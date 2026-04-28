import React, { memo } from "react";
import { Modal, Space, Table, Typography, Tag, Empty } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { orderApi } from "@/entities/order/api/orderApi";
import { useCurrencyConverter } from "@/shared/lib/hooks/useCurrencyConverter";
const { Text } = Typography;
interface GuestOrdersModalProps {
  email: string | null;
  open: boolean;
  onClose: () => void;
}
export const GuestOrdersModal: React.FC<GuestOrdersModalProps> = memo(
  ({ email, open, onClose }) => {
    const { t } = useTranslation();
    const { convertAndFormat } = useCurrencyConverter();
    const { data: orders, isLoading } = useQuery({
      queryKey: ["crm-guest-orders", email],
      queryFn: () =>
        email ? orderApi.getOrders({ guestEmail: email, limit: 50 }) : null,
      enabled: !!email && open,
    });
    return (
      <Modal
        title={
          <Space>
            {" "}
            <HistoryOutlined className="text-amber-600" />{" "}
            <span className="font-serif">
              {t("crm.guests.table.view_orders")}
            </span>{" "}
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={700}
        className="luxury-modal"
      >
        {" "}
        <div className="mb-6 p-4 bg-amber-50/30 border border-amber-100/50 dark:bg-amber-900/10 dark:border-amber-900/30">
          {" "}
          <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
            {t("orders.drawer.customer")}
          </Text>{" "}
          <Text strong className="text-sm font-serif">
            {email || "—"}
          </Text>{" "}
        </div>{" "}
        <Table
          dataSource={orders?.items || []}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
          columns={[
            {
              title: t("dashboard.table.reference"),
              dataIndex: "code",
              key: "code",
              render: (v: string) => (
                <Text className="font-serif text-xs font-bold">{v}</Text>
              ),
            },
            {
              title: t("common.status"),
              dataIndex: "status",
              key: "status",
              render: (v: string) => (
                <Tag className="text-[9px] uppercase font-bold tracking-widest border-none bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5">
                  {" "}
                  {v}{" "}
                </Tag>
              ),
            },
            {
              title: t("orders.drawer.valuation"),
              dataIndex: "totalAmount",
              key: "totalAmount",
              render: (v: number) => (
                <Text className="font-serif text-xs text-amber-600">
                  {convertAndFormat(v)}
                </Text>
              ),
            },
            {
              title: t("orders.drawer.date"),
              dataIndex: "createdAt",
              key: "createdAt",
              render: (v: string) => (
                <Text className="text-[10px] text-gray-400 font-bold">
                  {new Date(v).toLocaleDateString()}
                </Text>
              ),
            },
          ]}
          locale={{ emptyText: <Empty description={t("common.no_data")} /> }}
        />{" "}
      </Modal>
    );
  },
);
