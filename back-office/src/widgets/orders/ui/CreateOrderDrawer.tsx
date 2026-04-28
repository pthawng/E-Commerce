import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Table,
  InputNumber,
  Space,
  Typography,
  Divider,
  Card,
  message,
  Row,
  Col,
  AutoComplete,
  Avatar,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { orderApi, CreateOrderInput } from "@/entities/order/api/orderApi";
import {
  customerApi,
  CustomerListItem,
} from "@/entities/customer/api/customerApi";
import { productApi, ProductListItem } from "@/entities/product/api/productApi";
import { useCurrencyConverter } from "@/shared/lib/hooks/useCurrencyConverter";
import { usePageHeader } from "@/shared/lib/PageHeaderContext";
const { Text, Title } = Typography;
const { TextArea } = Input;
interface CreateOrderDrawerProps {
  open: boolean;
  onClose: () => void;
}
interface OrderItemRow {
  key: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}
export const CreateOrderDrawer: React.FC<CreateOrderDrawerProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { convertAndFormat } = useCurrencyConverter();
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const { data: customersData } = useQuery({
    queryKey: ["customers", customerSearch],
    queryFn: () =>
      customerApi.getCustomers({
        ...(customerSearch ? { search: customerSearch } : {}),
        limit: 20,
      }),
  });
  const { data: productsData } = useQuery({
    queryKey: ["products-select", productSearch],
    queryFn: () =>
      productApi.getProducts({
        ...(productSearch ? { search: productSearch } : {}),
        limit: 20,
      }),
  });
  const createMutation = useMutation({
    mutationFn: (data: CreateOrderInput) => orderApi.createOrder(data),
    onSuccess: () => {
      message.success(t("orders.create_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      handleClose();
    },
    onError: () => {
      message.error(t("orders.create_error"));
    },
  });
  const handleClose = () => {
    form.resetFields();
    setOrderItems([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setProductSearch("");
    onClose();
  };
  const addProduct = (product: ProductListItem) => {
    const variant = product.variants?.[0];
    if (!variant) {
      message.warning(t("orders.no_variant"));
      return;
    }
    const pName =
      typeof product.name === "object"
        ? product.name?.vi || product.name?.en || "N/A"
        : product.name;
    const vName = variant.variantTitle
      ? typeof variant.variantTitle === "object"
        ? variant.variantTitle.vi || variant.variantTitle.en
        : variant.variantTitle
      : pName;
    const newItem: OrderItemRow = {
      key: `${product.id}-${variant.id}-${Date.now()}`,
      variantId: variant.id,
      productName: pName,
      variantName: vName || pName,
      sku: variant.sku || "",
      quantity: 1,
      price: variant.price || 0,
      total: variant.price || 0,
    };
    setOrderItems((prev) => [...prev, newItem]);
    setProductSearch("");
  };
  const updateItemQuantity = (key: string, quantity: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantity, total: item.price * quantity }
          : item,
      ),
    );
  };
  const removeItem = (key: string) => {
    setOrderItems((prev) => prev.filter((item) => item.key !== key));
  };
  const orderTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.total, 0),
    [orderItems],
  );
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (orderItems.length === 0) {
        message.warning(t("orders.no_items"));
        return;
      }
      const orderData: CreateOrderInput = {
        customerId: selectedCustomer?.id,
        customerEmail: selectedCustomer
          ? selectedCustomer.email
          : customerSearch,
        customerName: selectedCustomer
          ? selectedCustomer.fullName
          : values.shippingName || customerSearch,
        items: orderItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingName: values.shippingName,
        shippingPhone: values.shippingPhone,
        shippingAddress: {
          city: values.city,
          district: values.district,
          ward: values.ward,
          detail: values.detail,
        },
        note: values.note,
      };
      createMutation.mutate(orderData);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };
  const itemColumns = [
    {
      title: (
        <Text className="text-[10px] uppercase">{t("orders.product")}</Text>
      ),
      dataIndex: "productName",
      render: (_: any, record: OrderItemRow) => (
        <div className="flex flex-col">
          {" "}
          <Text className="text-xs font-medium">{record.productName}</Text>{" "}
          <Text className="text-[9px] text-gray-400">
            {record.variantName} ({record.sku})
          </Text>{" "}
        </div>
      ),
    },
    {
      title: (
        <Text className="text-[10px] uppercase">{t("orders.quantity")}</Text>
      ),
      dataIndex: "quantity",
      width: 100,
      render: (_: any, record: OrderItemRow) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => updateItemQuantity(record.key, val || 1)}
          className="w-20"
          size="small"
        />
      ),
    },
    {
      title: <Text className="text-[10px] uppercase">{t("orders.price")}</Text>,
      dataIndex: "price",
      width: 120,
      render: (_: any, record: OrderItemRow) => (
        <Text className="text-xs">{convertAndFormat(record.price)}</Text>
      ),
    },
    {
      title: <Text className="text-[10px] uppercase">{t("orders.total")}</Text>,
      dataIndex: "total",
      width: 120,
      render: (_: any, record: OrderItemRow) => (
        <Text className="text-xs font-medium">
          {convertAndFormat(record.total)}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: any, record: OrderItemRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
          size="small"
        />
      ),
    },
  ];
  const customerOptions = useMemo(
    () =>
      customersData?.items?.map((c) => ({
        value: c.email,
        label: (
          <div className="flex items-center gap-2 py-1">
            {" "}
            <Avatar
              size="small"
              src={c.avatarUrl}
              icon={<UserOutlined />}
            />{" "}
            <div className="flex flex-col">
              {" "}
              <Text className="text-xs">{c.fullName}</Text>{" "}
              <Text className="text-[9px] text-gray-400">{c.email}</Text>{" "}
            </div>{" "}
          </div>
        ),
        customer: c,
      })) || [],
    [customersData],
  );
  const productOptions = useMemo(
    () =>
      productsData?.items?.map((p) => ({
        value: p.id,
        label: (
          <div className="flex items-center gap-2 py-1">
            {" "}
            <ShoppingOutlined />{" "}
            <div className="flex flex-col">
              {" "}
              <Text className="text-xs">
                {" "}
                {typeof p.name === "object"
                  ? p.name?.vi || p.name?.en || "N/A"
                  : p.name}{" "}
              </Text>{" "}
              <Text className="text-[9px] text-gray-400">
                {" "}
                {p.variants?.[0]?.sku || "N/A"} - {p.variants?.length || 0}{" "}
                variants{" "}
              </Text>{" "}
            </div>{" "}
          </div>
        ),
        product: p,
      })) || [],
    [productsData],
  );
  return (
    <Drawer
      title={
        <span className="font-serif italic text-lg">
          {" "}
          {t("orders.create_title")}{" "}
        </span>
      }
      placement="right"
      width={720}
      onClose={handleClose}
      open={open}
      footer={
        <div className="flex justify-between">
          {" "}
          <div className="flex flex-col">
            {" "}
            <Text className="text-[10px] uppercase text-gray-400">
              {t("orders.order_total")}
            </Text>{" "}
            <Text className="text-xl font-serif">
              {convertAndFormat(orderTotal)}
            </Text>{" "}
          </div>{" "}
          <Space>
            {" "}
            <Button onClick={handleClose}> {t("common.cancel")} </Button>{" "}
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending}
              className="bg-black border-none"
            >
              {" "}
              {t("orders.create_submit")}{" "}
            </Button>{" "}
          </Space>{" "}
        </div>
      }
    >
      {" "}
      <div className="space-y-6">
        {" "}
        {/* Customer Selection */}{" "}
        <Card size="small" className="border-gray-100">
          {" "}
          <Title level={5} className="!text-sm !mb-4">
            {t("orders.customer")}
          </Title>{" "}
          <AutoComplete
            options={customerOptions}
            onSelect={(_, option) => setSelectedCustomer(option.customer)}
            onSearch={setCustomerSearch}
            placeholder={t("orders.select_customer")}
            className="w-full"
            value={customerSearch}
            onChange={(val) => {
              setCustomerSearch(val);
              if (
                selectedCustomer &&
                val !== selectedCustomer.email &&
                val !== selectedCustomer.fullName
              ) {
                setSelectedCustomer(null);
              }
            }}
          />{" "}
          {selectedCustomer && (
            <div className="mt-3 p-3 bg-gray-50 rounded flex items-center gap-3">
              {" "}
              <Avatar
                src={selectedCustomer.avatarUrl}
                icon={<UserOutlined />}
              />{" "}
              <div className="flex flex-col flex-1">
                {" "}
                <Text className="text-xs font-medium">
                  {selectedCustomer.fullName}
                </Text>{" "}
                <Text className="text-[9px] text-gray-400">
                  {selectedCustomer.email}
                </Text>{" "}
              </div>{" "}
              <Tag>{selectedCustomer.segment || "PROSPECT"}</Tag>{" "}
            </div>
          )}{" "}
        </Card>{" "}
        {/* Products */}{" "}
        <Card size="small" className="border-gray-100">
          {" "}
          <Title level={5} className="!text-sm !mb-4">
            {t("orders.items")}
          </Title>{" "}
          <Select
            showSearch
            options={productOptions}
            onSelect={(_, option) => addProduct(option.product)}
            onSearch={setProductSearch}
            placeholder={t("orders.search_product")}
            className="w-full mb-4"
            filterOption={false}
            value={undefined}
          />{" "}
          <Table
            dataSource={orderItems}
            columns={itemColumns}
            pagination={false}
            size="small"
            summary={() =>
              orderItems.length > 0 ? (
                <Table.Summary fixed>
                  {" "}
                  <Table.Summary.Row>
                    {" "}
                    <Table.Summary.Cell index={0} colSpan={3}>
                      {" "}
                      <Text className="text-xs font-bold uppercase">
                        {t("orders.total")}
                      </Text>{" "}
                    </Table.Summary.Cell>{" "}
                    <Table.Summary.Cell index={3}>
                      {" "}
                      <Text className="text-sm font-serif font-medium">
                        {" "}
                        {convertAndFormat(orderTotal)}{" "}
                      </Text>{" "}
                    </Table.Summary.Cell>{" "}
                  </Table.Summary.Row>{" "}
                </Table.Summary>
              ) : null
            }
          />{" "}
        </Card>{" "}
        {/* Shipping Address */}{" "}
        <Card size="small" className="border-gray-100">
          {" "}
          <Title level={5} className="!text-sm !mb-4">
            {t("orders.shipping_address")}
          </Title>{" "}
          <Form form={form} layout="vertical">
            {" "}
            <Row gutter={16}>
              {" "}
              <Col span={24}>
                {" "}
                <Form.Item
                  name="shippingName"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.recipient_name")}
                    </Text>
                  }
                >
                  {" "}
                  <Input />{" "}
                </Form.Item>{" "}
              </Col>{" "}
              <Col span={24}>
                {" "}
                <Form.Item
                  name="shippingPhone"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.phone")}
                    </Text>
                  }
                >
                  {" "}
                  <Input />{" "}
                </Form.Item>{" "}
              </Col>{" "}
              <Col span={8}>
                {" "}
                <Form.Item
                  name="city"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.city")}
                    </Text>
                  }
                >
                  {" "}
                  <Input />{" "}
                </Form.Item>{" "}
              </Col>{" "}
              <Col span={8}>
                {" "}
                <Form.Item
                  name="district"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.district")}
                    </Text>
                  }
                >
                  {" "}
                  <Input />{" "}
                </Form.Item>{" "}
              </Col>{" "}
              <Col span={8}>
                {" "}
                <Form.Item
                  name="ward"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.ward")}
                    </Text>
                  }
                >
                  {" "}
                  <Input />{" "}
                </Form.Item>{" "}
              </Col>{" "}
              <Col span={24}>
                {" "}
                <Form.Item
                  name="detail"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.address_detail")}
                    </Text>
                  }
                >
                  {" "}
                  <Input.TextArea rows={2} />{" "}
                </Form.Item>{" "}
              </Col>{" "}
              <Col span={24}>
                {" "}
                <Form.Item
                  name="note"
                  label={
                    <Text className="text-[10px] uppercase">
                      {t("orders.note")}
                    </Text>
                  }
                >
                  {" "}
                  <Input.TextArea rows={2} />{" "}
                </Form.Item>{" "}
              </Col>{" "}
            </Row>{" "}
          </Form>{" "}
        </Card>{" "}
      </div>{" "}
    </Drawer>
  );
};
