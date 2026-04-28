import React from "react";
import { Typography, Tabs, Space, Row, Col, Card } from "antd";
import {
  SyncOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePageHeader } from "@/shared/lib/PageHeaderContext";
import { WidgetErrorBoundary } from "@/shared/ui/ErrorBoundary/WidgetErrorBoundary";

// Widgets
import { DomainEventMonitor } from "@/widgets/nerve-center/ui/DomainEventMonitor";
import { EmailQueueMonitor } from "@/widgets/nerve-center/ui/EmailQueueMonitor";

const { Title, Text } = Typography;

export const NerveCenterPage: React.FC = () => {
  const { t } = useTranslation();

  usePageHeader({
    title: t("nerve_center.title"),
    subtitle: t("nerve_center.subtitle"),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Health Pulse */}
      <Card className="shadow-none border-none rounded-none bg-black dark:bg-[#0a0a0a] text-white">
        <Row gutter={24} align="middle">
          <Col span={4}>
            <div className="flex flex-col items-center border-r border-gray-800 py-4">
              <SafetyCertificateOutlined className="text-3xl text-emerald-500 mb-2" />
              <Text className="text-emerald-500 uppercase text-[9px] font-bold tracking-widest">
                {t("nerve_center.health")}
              </Text>
            </div>
          </Col>
          <Col span={20}>
            <div className="flex justify-between items-center px-4">
              <div>
                <Title level={4} className="!text-white !mb-1 font-serif">
                  {t("nerve_center.matrix")}
                </Title>
                <Text className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                  FAANG-Grade L8 Monitoring
                </Text>
              </div>
              <Space size={24}>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    {t("nerve_center.worker")}
                  </div>
                  <div className="text-emerald-400 font-bold text-xs uppercase">
                    Healthy
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    {t("nerve_center.drift")}
                  </div>
                  <div className="text-white font-bold text-xs">0.00 VND</div>
                </div>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="events"
        className="luxury-tabs"
        items={[
          {
            key: "events",
            label: (
              <Space size={6}>
                <SyncOutlined />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {t("nerve_center.tabs.events")}
                </span>
              </Space>
            ),
            children: (
              <WidgetErrorBoundary
                fallbackTitle={t("common.error_boundary_title")}
              >
                <DomainEventMonitor />
              </WidgetErrorBoundary>
            ),
          },
          {
            key: "email",
            label: (
              <Space size={6}>
                <MailOutlined />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {t("nerve_center.tabs.email")}
                </span>
              </Space>
            ),
            children: (
              <WidgetErrorBoundary
                fallbackTitle={t("common.error_boundary_title")}
              >
                <EmailQueueMonitor />
              </WidgetErrorBoundary>
            ),
          },
          {
            key: "logs",
            label: (
              <Space size={6}>
                <ClockCircleOutlined />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {t("nerve_center.tabs.audit")}
                </span>
              </Space>
            ),
            children: (
              <div className="py-20 text-center uppercase tracking-widest text-gray-300 dark:text-gray-700 font-bold text-xs border border-dashed border-gray-100 dark:border-gray-900">
                {t("nerve_center.tabs.audit")} (Streaming)
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default NerveCenterPage;
