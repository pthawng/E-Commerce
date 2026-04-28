import React, { useState, useMemo, memo } from "react";
import {
  Table,
  Tag,
  Space,
  Input,
  Select,
  Card,
  Typography,
  Tooltip,
  Badge,
  Button,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  SwapOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  inventoryApi,
  InventoryItem,
} from "@/entities/inventory/api/inventoryApi";
import { useCurrencyConverter } from "@/shared/lib/hooks/useCurrencyConverter";
const { Text } = Typography;
export const StockTable: React.FC = memo(() => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string | undefined>();
  const { convertAndFormat } = useCurrencyConverter();
  const {
    data: stock,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["inventory-stock", warehouseFilter],
    queryFn: () =>
      inventoryApi.getStockLevels({ warehouseId: warehouseFilter }),
  });
  const filteredStock = useMemo(() => {
    return (
      stock?.filter((item) =>
        item.productVariant.sku.toLowerCase().includes(search.toLowerCase()),
      ) || []
    );
  }, [stock, search]);
  const columns = useMemo(
    () => [
      {
        title: t("inventory.stock.table.product_sku"),
        key: "product",
        render: (_: any, record: InventoryItem) => (
          <div className="flex flex-col">
            {" "}
            <Text strong className="font-serif text-sm">
              {" "}
              {record.productVariant?.name?.vi ||
                record.productVariant?.sku ||
                t("common.no_data")}{" "}
            </Text>{" "}
            <Text
              type="secondary"
              className="text-[10px] uppercase tracking-tighter"
            >
              {" "}
              {record.productVariant?.sku || "N/A"}{" "}
            </Text>{" "}
          </div>
        ),
      },
      {
        title: t("inventory.stock.table.vault"),
        dataIndex: ["warehouse", "name"],
        key: "warehouse",
        render: (name: string) => (
          <Tag className="rounded-none border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/5 uppercase text-[9px] font-bold tracking-widest px-2">
            {" "}
            {name}{" "}
          </Tag>
        ),
      },
      {
        title: t("inventory.stock.table.reserved"),
        dataIndex: "reservedQuantity",
        key: "reserved",
        align: "right" as const,
        render: (qty: number) => (
          <Text type={qty > 0 ? "warning" : "secondary"} className="text-sm">
            {" "}
            {qty > 0 ? `-${qty}` : "0"}{" "}
          </Text>
        ),
      },
      {
        title: t("inventory.stock.table.damaged"),
        dataIndex: "damagedQuantity",
        key: "damaged",
        align: "right" as const,
        render: (qty: number) => (
          <Text type={qty > 0 ? "danger" : "secondary"} className="text-sm">
            {" "}
            {qty > 0 ? `-${qty}` : "0"}{" "}
          </Text>
        ),
      },
      {
        title: t("inventory.stock.table.available"),
        key: "available",
        align: "right" as const,
        render: (_: any, record: InventoryItem) => {
          const available =
            (record.quantity || 0) -
            (record.reservedQuantity || 0) -
            (record.damagedQuantity || 0);
          return (
            <Badge
              count={available}
              overflowCount={9999}
              style={{
                backgroundColor: available <= 5 ? "#f5222d" : "#52c41a",
              }}
              className="font-bold"
            />
          );
        },
      },
      {
        title: t("inventory.stock.table.in_transit"),
        dataIndex: "inTransitQuantity",
        key: "inTransit",
        align: "right" as const,
        render: (qty: number) => (
          <Space size={4}>
            {" "}
            {qty > 0 && (
              <SwapOutlined className="text-blue-400 animate-pulse" />
            )}{" "}
            <Text
              type={qty > 0 ? undefined : "secondary"}
              className={`text-sm ${qty > 0 ? "text-blue-600 font-bold" : ""}`}
            >
              {" "}
              {qty > 0 ? `+${qty}` : "0"}{" "}
            </Text>{" "}
          </Space>
        ),
      },
      {
        title: t("inventory.stock.table.shelf"),
        dataIndex: "shelfLocation",
        key: "shelf",
        render: (loc: string) => (
          <Text code className="text-[10px]">
            {loc || "N/A"}
          </Text>
        ),
      },
    ],
    [t, convertAndFormat],
  );
  return (
    <div className="space-y-6">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <Space size="large">
          {" "}
          <Input
            prefix={<SearchOutlined className="text-gray-300" />}
            placeholder={t("inventory.stock.search")}
            className="h-10 w-80 border-gray-100 dark:border-gray-900 bg-transparent rounded-none text-[11px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />{" "}
          <Select
            placeholder={t("inventory.stock.all_warehouses")}
            className="w-48 luxury-select"
            allowClear
            onChange={setWarehouseFilter}
            options={[
              { label: "Main Vault", value: "main" },
              { label: "Display Showroom", value: "showroom" },
            ]}
          />{" "}
        </Space>{" "}
        <Space>
          {" "}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            type="text"
            className="text-gray-400 hover:text-black dark:hover:text-white"
          />{" "}
          <Button
            type="primary"
            icon={<FilterOutlined />}
            className="h-10 px-6 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[9px] font-bold"
          >
            {" "}
            {t("inventory.stock.advanced_analysis")}{" "}
          </Button>{" "}
        </Space>{" "}
      </div>{" "}
      <Table
        columns={columns}
        dataSource={filteredStock}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        className="luxury-table border border-gray-100 dark:border-gray-900"
        scroll={{ x: 1000 }}
        summary={(pageData) => {
          let totalAvailable = 0;
          pageData.forEach(
            ({ quantity, reservedQuantity, damagedQuantity }) => {
              totalAvailable +=
                (quantity || 0) -
                (reservedQuantity || 0) -
                (damagedQuantity || 0);
            },
          );
          return (
            <Table.Summary.Row className="bg-gray-50 dark:bg-white/5 font-bold">
              {" "}
              <Table.Summary.Cell index={0} colSpan={5}>
                {t("inventory.stock.salable_total")}
              </Table.Summary.Cell>{" "}
              <Table.Summary.Cell index={1} align="right">
                {" "}
                <Text className="text-lg">{totalAvailable}</Text>{" "}
              </Table.Summary.Cell>{" "}
              <Table.Summary.Cell index={2} colSpan={2} />{" "}
            </Table.Summary.Row>
          );
        }}
      />{" "}
      <Card
        size="small"
        className="bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30"
      >
        {" "}
        <Space>
          {" "}
          <AlertOutlined className="text-amber-500" />{" "}
          <Text className="text-[11px] text-amber-700 dark:text-amber-400">
            {" "}
            {t("inventory.stock.reconciliation_alert")}{" "}
            <Text underline className="ml-2 cursor-pointer">
              {t("inventory.stock.view_drift")}
            </Text>{" "}
          </Text>{" "}
        </Space>{" "}
      </Card>{" "}
    </div>
  );
});
