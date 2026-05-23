import React, { useEffect, useMemo, useState, memo } from "react";
import {
  Table,
  Tag,
  Space,
  Typography,
  Tooltip,
  Row,
  Col,
  Card,
  Statistic,
} from "antd";
import {
  DatabaseOutlined,
  BugOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

type EventStatus = "COMPLETED" | "FAILED" | "PENDING" | "PROCESSING";

interface NerveEvent {
  id: string;
  eventType: string;
  status: EventStatus;
  retryCount: number;
  createdAt: string;
  payload?: unknown;
  lastError?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(
  /\/$/,
  "",
);

const normalizeEvent = (raw: Partial<NerveEvent> & { type?: string }): NerveEvent => ({
  id: raw.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  eventType: raw.eventType || raw.type || "system.event",
  status: raw.status || "COMPLETED",
  retryCount: raw.retryCount || 0,
  createdAt: raw.createdAt || new Date().toISOString(),
  payload: raw.payload,
  lastError: raw.lastError,
});

export const DomainEventMonitor: React.FC = memo(() => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<NerveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/nerve-center/stream`, {
      withCredentials: true,
    });

    source.onopen = () => setIsConnected(true);
    source.onerror = () => setIsConnected(false);
    source.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as Partial<NerveEvent> & {
          type?: string;
        };
        const event = normalizeEvent(parsed);
        setEvents((current) => [event, ...current].slice(0, 50));
      } catch {
        setEvents((current) =>
          [
            normalizeEvent({
              eventType: "system.unparseable_event",
              status: "FAILED",
              lastError: "Received malformed event payload",
            }),
            ...current,
          ].slice(0, 50),
        );
      }
    };

    return () => {
      source.close();
    };
  }, []);

  const metrics = useMemo(() => {
    const failed = events.filter((event) => event.status === "FAILED").length;
    const pending = events.filter((event) => event.status === "PENDING").length;
    const failureRate = events.length ? (failed / events.length) * 100 : 0;

    return { failed, pending, failureRate };
  }, [events]);

  const columns = [
    {
      title: t("nerve_center.events.table.type"),
      dataIndex: "eventType",
      key: "eventType",
      render: (v: string) => (
        <Text className="font-mono text-[10px] bg-gray-50 dark:bg-white/5 px-2 py-1 border border-gray-100 dark:border-gray-800 uppercase tracking-widest">
          {v}
        </Text>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (v: EventStatus) => {
        const isFailed = v === "FAILED";
        const isCompleted = v === "COMPLETED";
        return (
          <Tag
            color={isCompleted ? "success" : isFailed ? "error" : "processing"}
            className="rounded-none border-none text-[9px] uppercase font-bold tracking-widest"
          >
            {v}
          </Tag>
        );
      },
    },
    {
      title: t("nerve_center.events.table.retries"),
      dataIndex: "retryCount",
      key: "retryCount",
      render: (v: number) => (
        <Text className="text-[10px] font-bold text-gray-400">{v} / 5</Text>
      ),
    },
    {
      title: t("nerve_center.events.table.timestamp"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (
        <Text className="text-[10px] text-gray-400 uppercase tracking-widest">
          {new Date(v).toLocaleTimeString()}
        </Text>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (_: unknown, record: NerveEvent) => (
        <Space size={12}>
          <Tooltip title="View Payload">
            <EyeOutlined className="text-gray-400 cursor-pointer hover:text-black dark:hover:text-white" />
          </Tooltip>
          {record.status === "FAILED" && (
            <Tooltip title="Manual Retry">
              <PlayCircleOutlined className="text-amber-500 cursor-pointer hover:text-amber-600" />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card
            size="small"
            className="bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-gray-900 rounded-none shadow-none"
          >
            <Statistic
              title={
                <Text className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
                  {t("nerve_center.events.backlog")}
                </Text>
              }
              value={metrics.pending}
              prefix={<DatabaseOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            className="bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-gray-900 rounded-none shadow-none"
          >
            <Statistic
              title={
                <Text className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
                  {t("nerve_center.events.failure_rate")}
                </Text>
              }
              value={Number(metrics.failureRate.toFixed(1))}
              suffix="%"
              valueStyle={{ color: metrics.failed ? "#ff4d4f" : undefined }}
              prefix={<BugOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={events}
        loading={!isConnected && events.length === 0}
        rowKey="id"
        pagination={false}
        className="luxury-table"
      />
    </div>
  );
});
