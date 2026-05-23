import React from "react";
import {
  Row,
  Col,
  Typography,
  Table,
  Progress,
  Badge,
  Skeleton,
} from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/entities/dashboard/api/dashboardApi";
import { useTranslation } from "react-i18next";
const { Text } = Typography;
export const AtelierPulse: React.FC = () => {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: () => dashboardApi.getRecentOrders(5),
    refetchInterval: 30000,
  });
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }
  const dataSource =
    orders?.map((order: any) => {
      let dotStatus = "success";
      if (order.status === "CANCELLED") dotStatus = "error";
      else if (["PENDING_PAYMENT", "DRAFT"].includes(order.status))
        dotStatus = "warning";
      else if (
        [
          "CONFIRMED",
          "MATERIAL_RESERVED",
          "IN_PRODUCTION",
          "QC",
          "READY_TO_SHIP",
        ].includes(order.status)
      )
        dotStatus = "processing";
      return {
        key: order.id,
        id: `PAR-${order.id.slice(-4).toUpperCase()}`,
        client: order.user?.fullName || t("dashboard.patron_default"),
        stage: order.status,
        wait:
          order.slaStatus === "variance_detected"
            ? "48h+"
            : order.slaStatus === "in_compliance"
              ? t("dashboard.n_a")
              : t("dashboard.under_24h"),
        load: order.workloadFactor || 0,
        status: dotStatus,
        slaRaw: order.slaStatus,
      };
    }) || [];
  return (
    <div className="space-y-8">
      {" "}
      <div className="flex justify-between items-baseline">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <h2 className="text-2xl font-serif tracking-tight">
            {t("dashboard.pulse")}
          </h2>{" "}
          <Badge
            count={t("dashboard.live")}
            style={{
              backgroundColor: "#000",
              borderRadius: 0,
              fontSize: "9px",
              fontWeight: 900,
              textTransform: "uppercase",
              padding: "0 8px",
            }}
          />{" "}
        </div>{" "}
      </div>{" "}
      <Row gutter={[48, 48]}>
        {" "}
        <Col xs={24} lg={24}>
          {" "}
          <Table
            pagination={false}
            className="luxury-table-high-contrast"
            dataSource={dataSource}
            columns={[
              {
                title: t("dashboard.table.reference"),
                dataIndex: "id",
                key: "id",
                render: (t) => (
                  <Text className="text-[11px] font-black tracking-widest text-black dark:text-white uppercase">
                    {t}
                  </Text>
                ),
              },
              {
                title: t("dashboard.table.patron"),
                dataIndex: "client",
                key: "client",
                render: (t) => (
                  <Text className="text-sm font-serif font-bold text-gray-800 dark:text-gray-200">
                    {t}
                  </Text>
                ),
              },
              {
                title: t("dashboard.table.phase"),
                dataIndex: "stage",
                key: "stage",
                render: (stage: string, r: any) => (
                  <div className="flex items-center gap-3">
                    {" "}
                    <div
                      className={`w-2 h-2 rounded-full ${r.status === "error" ? "bg-red-600" : r.status === "processing" ? "bg-amber-600 animate-pulse" : "bg-green-600"}`}
                    />{" "}
                    <Text
                      className={`text-[11px] uppercase tracking-[0.15em] font-black ${r.status === "error" ? "text-red-700" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {" "}
                      {t(`dashboard.status_mapping.${stage}`, {
                        defaultValue: stage,
                      })}{" "}
                    </Text>{" "}
                  </div>
                ),
              },
              {
                title: t("dashboard.table.load"),
                dataIndex: "load",
                key: "load",
                width: 120,
                render: (l: number) => (
                  <Progress
                    percent={l}
                    showInfo={false}
                    size={{ height: 3 }}
                    strokeColor={l > 80 ? "#be123c" : "#000"}
                  />
                ),
              },
              {
                title: t("dashboard.table.sla"),
                dataIndex: "wait",
                key: "wait",
                render: (wait: string, r: any) => {
                  const isVariance = r.slaRaw === "variance_detected";
                  return (
                    <div
                      className={`flex items-center gap-2 px-3 py-1 border ${isVariance ? "bg-red-50 border-red-100 text-red-600" : "bg-gray-50 border-gray-100 text-gray-500"} dark:bg-transparent`}
                    >
                      {" "}
                      <ClockCircleOutlined className="text-[10px]" />{" "}
                      <Text
                        className={`text-[10px] font-black uppercase tracking-widest leading-none m-0 ${isVariance ? "text-red-700" : "text-gray-500"}`}
                      >
                        {" "}
                        {wait}{" "}
                      </Text>{" "}
                    </div>
                  );
                },
              },
            ]}
          />{" "}
        </Col>{" "}
      </Row>{" "}
      <style
        dangerouslySetInnerHTML={{
          __html: `                 .luxury-table-high-contrast .ant-table-thead > tr > th {                     border-bottom: 2px solid #000 !important;                     text-transform: uppercase;                     letter-spacing: 0.2em;                     font-size: 10px;                     font-weight: 900;                     padding: 16px 8px !important;                 }                 .dark .luxury-table-high-contrast .ant-table-thead > tr > th {                     border-bottom: 2px solid #fff !important;                 }             `,
        }}
      />{" "}
    </div>
  );
};
