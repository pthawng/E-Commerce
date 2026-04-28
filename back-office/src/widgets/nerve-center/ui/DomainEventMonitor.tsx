import React, { useState, memo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export const DomainEventMonitor: React.FC = memo(() => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // Mock data for UI demonstration - In production, replace with real API
  const { data: events, isLoading } = useQuery({
    queryKey: ["nerve-events", page],
    queryFn: async () => ({
      items: [
        {
          id: "1",
          eventType: "order.created",
          status: "COMPLETED",
          retryCount: 0,
          createdAt: new Date().toISOString(),
          payload: { orderId: "ORD-123" },
        },
        {
          id: "2",
          eventType: "payment.failed",
          status: "FAILED",
          retryCount: 5,
          lastError: "Gateway Timeout",
          createdAt: new Date().toISOString(),
          payload: { orderId: "ORD-124" },
        },
        {
          id: "3",
          eventType: "inventory.reserved",
          status: "PENDING",
          retryCount: 0,
          createdAt: new Date().toISOString(),
          payload: { variantId: "V-88" },
        },
      ],
      meta: { total: 3 },
    }),
  });

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
      render: (v: string) => {
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
      render: (_: any, record: any) => (
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
              value={12}
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
              value={0.8}
              suffix="%"
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<BugOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={events?.items || []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        className="luxury-table"
      />
    </div>
  );
});
