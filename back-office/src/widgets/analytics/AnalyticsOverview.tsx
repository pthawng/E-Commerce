import React from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const SALES_DATA = [
  { name: "Mon", sales: 4000 },
  { name: "Tue", sales: 3000 },
  { name: "Wed", sales: 2000 },
  { name: "Thu", sales: 2780 },
  { name: "Fri", sales: 1890 },
  { name: "Sat", sales: 2390 },
  { name: "Sun", sales: 3490 },
];

const MATERIAL_DATA = [
  { name: "18k Gold", value: 45 },
  { name: "Platinum", value: 25 },
  { name: "Sterling Silver", value: 20 },
  { name: "Bespoke Alloy", value: 10 },
];

const COLORS = ["#1a1a1a", "#4a4a4a", "#8a8a8a", "#cccccc"];

export const AnalyticsOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="font-serif mb-1">
          Business Intelligence
        </Title>
        <Text className="text-xs text-gray-400 italic">
          Strategic insights into your luxury operations.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-gray-50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest text-gray-400">
                  Net Revenue
                </Text>
              }
              value={125840}
              precision={2}
              valueStyle={{ color: "#1a1a1a", fontFamily: "serif" }}
              prefix="$"
              suffix={
                <ArrowUpOutlined className="text-xs text-green-500 ml-2" />
              }
            />
            <Text className="text-[10px] text-green-500 font-medium">
              +12.5% from last month
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-gray-50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest text-gray-400">
                  Total Orders
                </Text>
              }
              value={48}
              valueStyle={{ color: "#1a1a1a", fontFamily: "serif" }}
              suffix={
                <ArrowUpOutlined className="text-xs text-green-500 ml-2" />
              }
            />
            <Text className="text-[10px] text-green-500 font-medium">
              +4 new today
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-gray-50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest text-gray-400">
                  Inventory Value
                </Text>
              }
              value={842500}
              precision={0}
              valueStyle={{ color: "#1a1a1a", fontFamily: "serif" }}
              prefix="$"
            />
            <Text className="text-[10px] text-gray-400 font-medium">
              854 items in vault
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-gray-50">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest text-gray-400">
                  Active Customers
                </Text>
              }
              value={1240}
              valueStyle={{ color: "#1a1a1a", fontFamily: "serif" }}
              suffix={
                <ArrowDownOutlined className="text-xs text-red-500 ml-2" />
              }
            />
            <Text className="text-[10px] text-red-500 font-medium">
              -2.1% churn rate
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Text className="text-[10px] uppercase tracking-widest text-gray-400">
                Weekly Revenue Trend
              </Text>
            }
            bordered={false}
            className="shadow-sm border border-gray-50 h-full"
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SALES_DATA}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#999" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#999" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 0,
                      border: "1px solid #f0f0f0",
                      boxShadow: "none",
                    }}
                    labelStyle={{ fontFamily: "serif", fontWeight: "bold" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#1a1a1a"
                    strokeWidth={2}
                    dot={{ fill: "#1a1a1a", r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Text className="text-[10px] uppercase tracking-widest text-gray-400">
                Material Popularity
              </Text>
            }
            bordered={false}
            className="shadow-sm border border-gray-50 h-full"
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MATERIAL_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {MATERIAL_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-4">
                {MATERIAL_DATA.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: COLORS[i] }}
                      />
                      <Text className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                        {item.name}
                      </Text>
                    </div>
                    <Text className="text-[10px] font-bold">{item.value}%</Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
