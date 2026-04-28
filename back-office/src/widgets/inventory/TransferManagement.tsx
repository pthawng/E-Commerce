import React from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  inventoryApi,
  InventoryTransfer,
} from "@/entities/inventory/api/inventoryApi";
const { Text, Title } = Typography;
const { TextArea } = Input;
export const TransferManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.split("-")[0];
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form] = Form.useForm();
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["inventory-transfers"],
    queryFn: inventoryApi.getTransfers,
  });
  const createMutation = useMutation({
    mutationFn: inventoryApi.initiateTransfer,
    onSuccess: () => {
      message.success(t("inventory.transfers.success_init"));
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      setIsModalOpen(false);
      form.resetFields();
    },
  });
  const shipMutation = useMutation({
    mutationFn: inventoryApi.shipTransfer,
    onSuccess: () => {
      message.success(t("inventory.transfers.success_ship"));
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
    },
  });
  const receiveMutation = useMutation({
    mutationFn: inventoryApi.receiveTransfer,
    onSuccess: () => {
      message.success(t("inventory.transfers.success_receive"));
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
    },
  });
  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "processing",
      SHIPPED: "warning",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    const icons: Record<string, any> = {
      PENDING: <ClockCircleOutlined />,
      SHIPPED: <TruckOutlined className="animate-bounce" />,
      COMPLETED: <CheckCircleOutlined />,
    };
    return (
      <Tag
        icon={icons[status]}
        color={colors[status]}
        className="rounded-none font-bold text-[10px]"
      >
        {" "}
        {status}{" "}
      </Tag>
    );
  };
  const columns = [
    {
      title: t("inventory.transfers.table.id"),
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Text code className="text-[10px]">
          {id.slice(0, 8)}
        </Text>
      ),
    },
    {
      title: t("inventory.transfers.table.route"),
      key: "route",
      render: (_: any, record: InventoryTransfer) => (
        <Space>
          {" "}
          <Text strong>{record.fromWarehouse?.name || "N/A"}</Text>{" "}
          <ArrowRightOutlined className="text-gray-300" />{" "}
          <Text strong>{record.toWarehouse?.name || "N/A"}</Text>{" "}
        </Space>
      ),
    },
    {
      title: "SKU",
      dataIndex: ["productVariant", "sku"],
      key: "sku",
      render: (sku: string, record: InventoryTransfer) => (
        <Text className="text-xs">
          {sku || record.productVariant?.sku || "N/A"}
        </Text>
      ),
    },
    {
      title: t("inventory.transfers.table.qty"),
      dataIndex: "quantity",
      key: "qty",
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (_: any, record: InventoryTransfer) => (
        <Space>
          {" "}
          {record.status === "PENDING" && (
            <Button
              size="small"
              type="primary"
              onClick={() => shipMutation.mutate(record.id)}
              className="text-[10px] bg-amber-600 dark:bg-amber-700 border-none uppercase font-bold"
            >
              {" "}
              {t("inventory.transfers.ship_now")}{" "}
            </Button>
          )}{" "}
          {record.status === "SHIPPED" && (
            <Button
              size="small"
              type="primary"
              onClick={() => receiveMutation.mutate(record.id)}
              className="text-[10px] bg-green-600 dark:bg-green-700 border-none uppercase font-bold"
            >
              {" "}
              {t("inventory.transfers.confirm_receipt")}{" "}
            </Button>
          )}{" "}
        </Space>
      ),
    },
  ];
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: inventoryApi.getWarehouses,
  });
  const { data: stockItems } = useQuery({
    queryKey: ["inventory-stock-all"],
    queryFn: () => inventoryApi.getStockLevels({}),
  });
  const variantOptions = React.useMemo(() => {
    const uniqueVariants = new Map();
    stockItems?.forEach((item) => {
      uniqueVariants.set(item.productVariant.id, {
        label: `${item.productVariant.sku} - ${item.productVariant.name?.[currentLang] || item.productVariant.name?.vi || item.productVariant.name?.en || "Unnamed"}`,
        value: item.productVariant.id,
      });
    });
    return Array.from(uniqueVariants.values());
  }, [stockItems, currentLang]);
  const warehouseOptions = warehouses?.map((w: any) => ({
    label: w.name,
    value: w.id,
  }));
  return (
    <div className="space-y-6">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <Input
          prefix={<SearchOutlined className="text-gray-300" />}
          placeholder={t("inventory.transfers.search")}
          className="h-10 w-80 border-gray-100 dark:border-gray-900 bg-transparent rounded-none text-[11px]"
        />{" "}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-6 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[9px] font-bold"
        >
          {" "}
          {t("inventory.transfers.initiate")}{" "}
        </Button>{" "}
      </div>{" "}
      <Table
        columns={columns}
        dataSource={transfers}
        loading={isLoading}
        rowKey="id"
        className="luxury-table border border-gray-100 dark:border-gray-900"
      />{" "}
      <Modal
        title={
          <Title level={5} className="font-serif !mb-0">
            {t("inventory.transfers.initiate")}
          </Title>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={500}
        className="luxury-modal"
      >
        {" "}
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          className="mt-4"
        >
          {" "}
          <Form.Item
            name="variantId"
            label={t("inventory.transfers.form.variant")}
            rules={[{ required: true }]}
          >
            {" "}
            <Select
              placeholder={t("common.search_placeholder")}
              options={variantOptions}
              showSearch
              className="luxury-select"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />{" "}
          </Form.Item>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <Form.Item
              name="fromWarehouseId"
              label={t("inventory.transfers.from")}
              rules={[{ required: true }]}
            >
              {" "}
              <Select
                placeholder={t("common.search_placeholder")}
                options={warehouseOptions}
                className="luxury-select"
              />{" "}
            </Form.Item>{" "}
            <Form.Item
              name="toWarehouseId"
              label={t("inventory.transfers.to")}
              rules={[{ required: true }]}
            >
              {" "}
              <Select
                placeholder={t("common.search_placeholder")}
                options={warehouseOptions}
                className="luxury-select"
              />{" "}
            </Form.Item>{" "}
          </div>{" "}
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true }]}
            initialValue={1}
          >
            {" "}
            <InputNumber
              min={1}
              className="w-full h-10 leading-10 rounded-none"
            />{" "}
          </Form.Item>{" "}
          <Form.Item name="note" label={t("inventory.transfers.form.note")}>
            {" "}
            <TextArea
              placeholder={t("inventory.transfers.form.note_placeholder")}
              className="rounded-none"
              rows={3}
            />{" "}
          </Form.Item>{" "}
        </Form>{" "}
      </Modal>{" "}
    </div>
  );
};
