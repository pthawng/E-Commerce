import React, { memo } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Divider,
  Table,
  Tag,
  Progress,
} from "antd";
import {
  TeamOutlined,
  ArrowUpOutlined,
  CrownOutlined,
  WarningOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useCurrencyConverter } from "@/shared/lib/hooks/useCurrencyConverter";

const { Text } = Typography;

export const LifecycleIntelligence: React.FC = memo(() => {
  const { t } = useTranslation();
  const { convertAndFormat } = useCurrencyConverter();

  return (
    <div className="space-y-8">
      {/* Strategic Stats */}
      <Row gutter={24} className="mb-12">
        <Col span={6}>
          <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  {t("crm.intelligence.active_clients")}
                </Text>
              }
              value={1284}
              prefix={<TeamOutlined className="text-blue-500" />}
            />
            <div className="mt-2 flex items-center text-green-500 gap-1 text-[10px] font-bold">
              <ArrowUpOutlined /> 12% vs last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  {t("crm.intelligence.segments")}
                </Text>
              }
              value={18.4}
              suffix="%"
              prefix={<CrownOutlined className="text-amber-500" />}
            />
            <Progress
              percent={18.4}
              size="small"
              strokeColor="#d4af37"
              showInfo={false}
              className="mt-2"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  {t("crm.intelligence.retention")}
                </Text>
              }
              value={4.2}
              suffix="%"
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<WarningOutlined className="text-red-500" />}
            />
            <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Target: Below 5%
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  Avg. NPS Score
                </Text>
              }
              value={8.9}
              prefix={<HeartOutlined className="text-pink-500" />}
            />
            <div className="mt-2 flex items-center text-blue-500 gap-1 text-[10px] font-bold uppercase tracking-widest">
              Premium Satisfied
            </div>
          </Card>
        </Col>
      </Row>

      <Divider
        orientation="left"
        className="!text-xs !uppercase !tracking-widest !text-gray-400 font-bold"
      >
        RFM Segmentation Map
      </Divider>

      <Row gutter={24} className="mb-12">
        <Col span={12}>
          <Card
            title={
              <span className="text-[10px] uppercase tracking-widest font-bold">
                {t("crm.intelligence.high_net_worth")} (Champions)
              </span>
            }
            size="small"
            className="shadow-sm rounded-none"
          >
            <Table
              size="small"
              pagination={false}
              dataSource={[
                {
                  name: "Thanh Hoang",
                  spend: 852000000,
                  orders: 12,
                  last: "2 days ago",
                },
                {
                  name: "Minh Tu",
                  spend: 421000000,
                  orders: 5,
                  last: "5 days ago",
                },
                {
                  name: "Ngoc Anh",
                  spend: 312000000,
                  orders: 8,
                  last: "1 day ago",
                },
              ]}
              columns={[
                {
                  title: t("crm.directory.table.patron"),
                  dataIndex: "name",
                  render: (v) => (
                    <Text className="font-serif text-xs">{v}</Text>
                  ),
                },
                {
                  title: t("crm.directory.table.ltv"),
                  dataIndex: "spend",
                  render: (v) => (
                    <Text className="text-xs font-bold text-amber-600">
                      {convertAndFormat(v)}
                    </Text>
                  ),
                },
                {
                  title: t("crm.guests.table.last_active"),
                  dataIndex: "last",
                  render: (v) => (
                    <Text className="text-[10px] uppercase text-gray-400">
                      {v}
                    </Text>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <span className="text-[10px] uppercase tracking-widest font-bold">
                {t("crm.intelligence.dormant")} (Churn Warning)
              </span>
            }
            size="small"
            className="shadow-sm rounded-none"
          >
            <Table
              size="small"
              pagination={false}
              dataSource={[
                {
                  name: "Linh Dang",
                  spend: 125000000,
                  dormant: "180 days",
                  risk: "High",
                },
                {
                  name: "Hoang Nam",
                  spend: 98000000,
                  dormant: "90 days",
                  risk: "Medium",
                },
                {
                  name: "Phuong Thao",
                  spend: 215000000,
                  dormant: "120 days",
                  risk: "High",
                },
              ]}
              columns={[
                {
                  title: t("crm.directory.table.patron"),
                  dataIndex: "name",
                  render: (v) => (
                    <Text className="font-serif text-xs">{v}</Text>
                  ),
                },
                {
                  title: "LTV Impact",
                  dataIndex: "spend",
                  render: (v) => (
                    <Text className="text-xs font-bold">
                      {convertAndFormat(v)}
                    </Text>
                  ),
                },
                {
                  title: "Risk",
                  dataIndex: "risk",
                  render: (v) => (
                    <Tag color="red" className="text-[8px] uppercase font-bold">
                      {v}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Divider
        orientation="left"
        className="!text-xs !uppercase !tracking-widest !text-gray-400 font-bold"
      >
        Luxury Engagement Insight
      </Divider>

      <div className="py-20 text-center border border-dashed border-gray-100 dark:border-gray-900 bg-gray-50/30">
        <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
          {t("common.loading")}
        </Text>
      </div>
    </div>
  );
});
