import React, { memo, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Alert,
  Space,
} from "antd";
import {
  GoldOutlined,
  AppstoreOutlined,
  WarningOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "@/shared/api/apiInstance";
import { useCurrencyConverter } from "@/shared/lib/hooks/useCurrencyConverter";

const { Text } = Typography;

export const MaterialLedgerLink: React.FC = memo(() => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.split("-")[0];
  const { convertAndFormat } = useCurrencyConverter();

  const getName = useCallback(
    (name: Record<string, string> | null | undefined, fallback = "—") => {
      if (!name) return fallback;
      return (
        name[currentLang] ||
        name.en ||
        name.vi ||
        Object.values(name)[0] ||
        fallback
      );
    },
    [currentLang],
  );

  const { data: balances, isLoading } = useQuery({
    queryKey: ["ledger-balances"],
    queryFn: () => api.get("/ledger/balances").then((res) => res.data),
  });

  const { data: kpis } = useQuery({
    queryKey: ["ledger-kpis"],
    queryFn: () => api.get("/ledger/kpis").then((res) => res.data),
  });

  const materials = Array.isArray(balances) ? balances : [];
  const lowStockMaterials = materials.filter((m: any) => m.available <= 5);

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={8}>
          <Card className="shadow-none border-gray-100 dark:border-gray-900 rounded-none bg-gray-50/20">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  {t("products.ledger.total_value")}
                </Text>
              }
              value={kpis?.totalMaterialValue || 0}
              formatter={(v) => convertAndFormat(Number(v))}
              prefix={<GoldOutlined className="text-amber-500" />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-none border-gray-100 dark:border-gray-900 rounded-none bg-gray-50/20">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  {t("products.ledger.skus")}
                </Text>
              }
              value={materials.length}
              prefix={<AppstoreOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-none border-gray-100 dark:border-gray-900 rounded-none bg-gray-50/20">
            <Statistic
              title={
                <Text className="text-[10px] uppercase tracking-widest font-bold">
                  {t("products.ledger.alerts")}
                </Text>
              }
              value={lowStockMaterials.length}
              valueStyle={{
                color: lowStockMaterials.length > 0 ? "#ff4d4f" : "#52c41a",
              }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {lowStockMaterials.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="rounded-none border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10"
          message={
            <Text className="text-[10px] uppercase tracking-widest font-bold">
              {t("products.ledger.warnings")}
            </Text>
          }
          description={
            <div className="space-y-1 mt-2">
              {lowStockMaterials.map((m: any) => (
                <div key={m.id} className="text-xs">
                  <Text strong className="font-serif">
                    {getName(m.name)}
                  </Text>{" "}
                  ({m.sku}) — Available:{" "}
                  <Text type="danger">{m.available}</Text>, Reserved:{" "}
                  {m.reserved}
                </div>
              ))}
            </div>
          }
        />
      )}

      <Card
        title={
          <Space>
            <BarChartOutlined className="text-gray-400" />
            <Text className="text-xs uppercase tracking-widest font-bold">
              {t("products.ledger.title")}
            </Text>
          </Space>
        }
        className="shadow-none border-gray-100 dark:border-gray-900 rounded-none"
      >
        <Table
          dataSource={materials}
          loading={isLoading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20 }}
          className="luxury-table"
          columns={[
            {
              title: "SKU",
              dataIndex: "sku",
              render: (v: string) => (
                <Text code className="text-[10px]">
                  {v}
                </Text>
              ),
            },
            {
              title: t("products.catalog.table.material"),
              render: (_: any, r: any) => (
                <Text className="font-serif font-bold">{getName(r.name)}</Text>
              ),
            },
            {
              title: t("products.catalog.table.variants"),
              dataIndex: "variantTitle",
              render: (v: any) =>
                v ? (
                  <Text className="text-[10px] text-gray-400 uppercase tracking-tighter">
                    {typeof v === "object" ? JSON.stringify(v) : v}
                  </Text>
                ) : (
                  "—"
                ),
            },
            { title: "Warehouse", dataIndex: "warehouse" },
            {
              title: "Qty",
              dataIndex: "quantity",
              render: (v: number) => (
                <Text strong className="font-serif">
                  {v.toLocaleString()}
                </Text>
              ),
            },
            {
              title: "Reserved",
              dataIndex: "reserved",
              render: (v: number) => (
                <Text
                  type={v > 0 ? "warning" : "secondary"}
                  className="text-xs"
                >
                  {v}
                </Text>
              ),
            },
            {
              title: "Available",
              dataIndex: "available",
              render: (v: number) => (
                <Text
                  type={v <= 5 ? "danger" : "success"}
                  strong
                  className="font-serif text-sm"
                >
                  {v}
                </Text>
              ),
            },
            {
              title: t("products.catalog.table.valuation"),
              dataIndex: "costPrice",
              render: (v: number) => convertAndFormat(v),
            },
          ]}
        />
      </Card>
    </div>
  );
});
