import React from "react";
import { Table, Tag, Space, Button, Typography, Steps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Order, OrderStatus } from "@/entities/order/model/types";
import { MOCK_ORDERS } from "@/entities/order/model/mock";
import {
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const statusColorMap: Record<OrderStatus, string> = {
  pending: "default",
  confirmed: "processing",
  in_production: "warning",
  quality_control: "cyan",
  shipped: "geekblue",
  delivered: "success",
  cancelled: "error",
  refunded: "magenta",
};

export const OrderTable: React.FC = () => {
  const columns: ColumnsType<Order> = [
    {
      title: "Order ID",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text) => <Text className="font-medium">{text}</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Total",
      dataIndex: ["totals", "total"],
      key: "total",
      render: (total: number, record) => (
        <span className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: record.totals.currency,
          }).format(total)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: OrderStatus) => (
        <Tag
          color={statusColorMap[status]}
          className="uppercase text-[10px] rounded-none px-2 font-bold border-none"
        >
          {status.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button
            type="primary"
            size="small"
            className="bg-black border-none text-[10px] uppercase h-7"
          >
            Process
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif mb-1">Order Fulfillment</h2>
          <p className="text-xs text-gray-400 italic">
            Orchestrate the journey of each timeless piece.
          </p>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={MOCK_ORDERS}
        rowKey="id"
        className="border border-gray-100"
      />
    </div>
  );
};
