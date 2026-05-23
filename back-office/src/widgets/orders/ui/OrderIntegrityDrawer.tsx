import React, { memo } from "react";
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  Divider,
  Table,
  Card,
  Popconfirm,
  Button,
  Timeline,
  Space,
} from "antd";
import { LoadingOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  OrderStatusEnum,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  VALID_TRANSITIONS,
  PaymentStatusEnum,
} from "@/shared/types/order.types";

const { Title, Text } = Typography;

interface OrderIntegrityDrawerProps {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  orderDetails: any;
  isLoading: boolean;
  onTransition: (status: OrderStatusEnum) => void;
  isTransitioning: boolean;
  convertAndFormat: (val: number) => string;
}

export const OrderIntegrityDrawer: React.FC<OrderIntegrityDrawerProps> = memo(
  ({
    open,
    onClose,
    orderDetails,
    isLoading,
    onTransition,
    isTransitioning,
    convertAndFormat,
  }) => {
    const { t } = useTranslation();

    return (
      <Drawer
        title={
          <Title level={4} className="!mb-0 uppercase tracking-widest text-sm">
            {t("orders.drawer.title")}: {orderDetails?.code}
          </Title>
        }
        placement="right"
        width={850}
        onClose={onClose}
        open={open}
        className="luxury-drawer"
      >
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingOutlined
              style={{ fontSize: 40 }}
              className="text-gray-200"
            />
          </div>
        ) : (
          orderDetails && (
            <div className="space-y-8 pb-20">
              <Descriptions
                title={
                  <Text className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-400">
                    {t("orders.drawer.identity")}
                  </Text>
                }
                bordered
                column={2}
              >
                <Descriptions.Item label={t("orders.drawer.order_id")}>
                  {orderDetails.code}
                </Descriptions.Item>
                <Descriptions.Item label={t("orders.drawer.date")}>
                  {dayjs(orderDetails.createdAt).format("DD MMM YYYY, HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label={t("orders.drawer.customer")}>
                  {orderDetails.user?.fullName ||
                    orderDetails.guestFullName ||
                    t("dashboard.patron_default")}
                </Descriptions.Item>
                <Descriptions.Item label={t("profile.email")}>
                  {orderDetails.user?.email || orderDetails.guestEmail}
                </Descriptions.Item>
                <Descriptions.Item label={t("orders.drawer.valuation")}>
                  <Text strong className="text-lg font-serif">
                    {convertAndFormat(orderDetails.totalAmount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t("common.status")}>
                  <Tag
                    color={
                      PAYMENT_STATUS_CONFIG[
                        orderDetails.paymentStatus as PaymentStatusEnum
                      ]?.color
                    }
                  >
                    {
                      PAYMENT_STATUS_CONFIG[
                        orderDetails.paymentStatus as PaymentStatusEnum
                      ]?.label
                    }
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">
                <Text className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-400">
                  {t("common.inventory")}
                </Text>
              </Divider>
              <Table
                dataSource={orderDetails.items}
                pagination={false}
                rowKey="id"
                size="small"
                className="luxury-table-mini"
                columns={[
                  {
                    title: t("products.catalog.table.piece"),
                    dataIndex: "productName",
                    render: (v) => (
                      <Text className="font-serif italic">{v}</Text>
                    ),
                  },
                  {
                    title: t("products.tabs.attributes"),
                    dataIndex: "variantName",
                    render: (v) => (
                      <Text className="text-[10px] uppercase tracking-tighter text-gray-400">
                        {v}
                      </Text>
                    ),
                  },
                  { title: "Qty", dataIndex: "quantity", align: "center" },
                  {
                    title: t("orders.drawer.valuation"),
                    dataIndex: "price",
                    render: (v) => convertAndFormat(v),
                  },
                  {
                    title: "Subtotal",
                    dataIndex: "totalLine",
                    render: (v) => <Text strong>{convertAndFormat(v)}</Text>,
                    align: "right",
                  },
                ]}
              />

              <Divider orientation="left">
                <Text className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-400">
                  {t("orders.orchestrator")}
                </Text>
              </Divider>
              <Card className="bg-gray-50/50 dark:bg-white/[0.01] border-none">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Text className="text-[10px] uppercase tracking-widest font-bold">
                      {t("common.status")}:
                    </Text>
                    <Tag
                      color={
                        ORDER_STATUS_CONFIG[
                          orderDetails.status as OrderStatusEnum
                        ]?.color
                      }
                      className="m-0 border-none px-4 py-1"
                    >
                      {
                        ORDER_STATUS_CONFIG[
                          orderDetails.status as OrderStatusEnum
                        ]?.label
                      }
                    </Tag>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Text className="text-[10px] uppercase tracking-widest font-bold">
                      {t("common.actions")}:
                    </Text>
                    <Space wrap>
                      {(
                        VALID_TRANSITIONS[
                          orderDetails.status as OrderStatusEnum
                        ] || []
                      ).map((status) => (
                        <Popconfirm
                          key={status}
                          title={t("common.actions")}
                          onConfirm={() => onTransition(status)}
                          okButtonProps={{ className: "bg-black" }}
                        >
                          <Button
                            type="primary"
                            ghost
                            icon={<ArrowRightOutlined />}
                            loading={isTransitioning}
                            className="uppercase text-[9px] font-bold tracking-widest h-10 px-6"
                          >
                            {t("common.edit")} {"->"}{" "}
                            {ORDER_STATUS_CONFIG[status]?.label}
                          </Button>
                        </Popconfirm>
                      ))}
                      {(
                        VALID_TRANSITIONS[
                          orderDetails.status as OrderStatusEnum
                        ] || []
                      ).length === 0 && (
                        <Text className="text-[10px] italic text-gray-400">
                          {t("dashboard.archival_intelligence")}
                        </Text>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>

              <Divider orientation="left">
                <Text className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-400">
                  {t("orders.drawer.timeline")}
                </Text>
              </Divider>
              <Timeline
                className="luxury-timeline"
                items={orderDetails.timelines?.map((event: any) => ({
                  color: event.action.includes("CANCEL") ? "red" : "black",
                  children: (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Text className="text-[11px] font-bold tracking-widest uppercase">
                          {event.action.replace(/_/g, " ")}
                        </Text>
                        <Text className="text-[10px] text-gray-400">
                          {dayjs(event.createdAt).format("DD/MM HH:mm")}
                        </Text>
                      </div>
                      <Text className="text-[11px] italic text-gray-400 block">
                        {event.description}
                      </Text>
                      <div className="mt-2 flex items-center gap-2">
                        <Tag className="text-[8px] uppercase m-0 border-none bg-gray-100">
                          {event.fromStatus || "INIT"} → {event.toStatus}
                        </Tag>
                        <Text className="text-[9px] text-gray-300 font-mono">
                          Actor: {event.actorType}
                        </Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          )
        )}
      </Drawer>
    );
  },
);
