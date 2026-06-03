import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, BarChart3, PackageSearch, ReceiptText } from "lucide-react";
import { AsyncState, ResourceTable, StatusBadge } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Badge, Page, Panel, Sparkline, Stat } from "@/components/ui-kit";
import {
  dashboardApi,
  type DashboardLowStockAlert,
  type DashboardRecentOrder,
} from "../api/dashboard.api";

const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function formatMoney(value: number | string | undefined) {
  return vnd.format(Number(value ?? 0));
}

function readLocalizedName(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.vi ?? record.en ?? record.name ?? "Không rõ");
  }
  return "Không rõ";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function DashboardOverview() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const statsQuery = useQuery({ queryKey: ["dashboard", "stats"], queryFn: dashboardApi.stats });
  const revenueQuery = useQuery({
    queryKey: ["dashboard", "revenue", range],
    queryFn: () => dashboardApi.revenue(range),
  });
  const recentOrdersQuery = useQuery({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () => dashboardApi.recentOrders(8),
  });
  const lowStockQuery = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => dashboardApi.lowStock(8),
  });

  const revenueSeries = useMemo(
    () => (revenueQuery.data ?? []).map((point) => Math.max(0, Number(point.amount))),
    [revenueQuery.data],
  );
  const maxRevenue = Math.max(...revenueSeries, 1);

  return (
    <Page>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Executive dashboard
          </div>
          <h1 className="mt-2 text-display text-4xl">Ray Paradis Operations</h1>
          <p className="mt-1.5 max-w-xl text-[13px] text-muted-foreground">
            Dữ liệu vận hành lấy trực tiếp từ đơn hàng, tồn kho và cảnh báo back-office.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">DB-backed</Badge>
          <Badge variant="gold">Live API</Badge>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          accent
          label="Doanh thu hợp lệ"
          value={statsQuery.isLoading ? "..." : formatMoney(statsQuery.data?.revenue)}
          hint="Không tính đơn đã hủy"
        />
        <Stat
          label="Đơn hôm nay"
          value={statsQuery.isLoading ? "..." : (statsQuery.data?.ordersToday ?? 0)}
          hint="Từ bảng Order"
        />
        <Stat
          label="Đơn đang xử lý"
          value={statsQuery.isLoading ? "..." : (statsQuery.data?.activeOrders ?? 0)}
          hint="Pending đến shipped"
        />
        <Stat
          label="Cảnh báo tồn thấp"
          value={statsQuery.isLoading ? "..." : (statsQuery.data?.lowStockItems ?? 0)}
          hint="Theo Settings Registry"
          trend={statsQuery.data?.lowStockItems ? "down" : "flat"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Revenue series"
          subtitle="Tổng doanh thu theo ngày từ Order"
          action={
            <div className="flex gap-1">
              {(["7d", "30d"] as const).map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={range === item ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRange(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          }
        >
          <AsyncState
            isLoading={revenueQuery.isLoading}
            error={revenueQuery.error}
            onRetry={() => void revenueQuery.refetch()}
            isEmpty={!revenueQuery.data?.length}
            emptyTitle="Chưa có doanh thu"
            emptyDescription="Series sẽ xuất hiện khi có đơn hàng hợp lệ."
          >
            <div className="flex h-56 items-end gap-2">
              {(revenueQuery.data ?? []).map((point) => (
                <div key={point.date} className="flex min-w-6 flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-gold/10 to-gold/60 transition hover:from-gold/30"
                    title={`${point.date}: ${formatMoney(point.amount)}`}
                    style={{ height: `${Math.max(4, (Number(point.amount) / maxRevenue) * 100)}%` }}
                  />
                  <span className="text-[9.5px] text-muted-foreground tabular">
                    {point.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </AsyncState>
        </Panel>

        <Panel title="Operational pulse" subtitle="Tín hiệu lấy từ dữ liệu thật">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkline data={revenueSeries.length ? revenueSeries : [0, 0, 0]} />
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground">Revenue pulse</div>
                <div className="text-mono text-[13px] tabular">
                  {formatMoney(revenueSeries.at(-1))}
                </div>
              </div>
              <BarChart3 className="h-4 w-4 text-success" />
            </div>
            <div className="luxury-divider my-2" />
            <div className="flex gap-2 text-[11.5px]">
              <ReceiptText className="mt-0.5 h-3.5 w-3.5 text-info" />
              <span>{statsQuery.data?.activeOrders ?? 0} đơn đang cần theo dõi vận hành.</span>
            </div>
            <div className="flex gap-2 text-[11.5px]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-warning" />
              <span>{statsQuery.data?.lowStockItems ?? 0} SKU dưới ngưỡng tồn kho.</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Recent orders"
          subtitle="Đơn hàng mới nhất từ database"
          action={
            <Button type="button" variant="ghost" size="sm">
              <ArrowUpRight />
              Orders
            </Button>
          }
          padded={false}
        >
          <ResourceTable<DashboardRecentOrder>
            rows={recentOrdersQuery.data ?? []}
            getRowKey={(order) => order.id}
            isLoading={recentOrdersQuery.isLoading}
            error={recentOrdersQuery.error}
            onRetry={() => void recentOrdersQuery.refetch()}
            emptyTitle="Chưa có đơn hàng"
            emptyDescription="Các đơn mới sẽ xuất hiện tại đây."
            columns={[
              { key: "code", header: "Mã đơn", className: "text-mono text-[11px]" },
              {
                key: "customer",
                header: "Khách hàng",
                render: (order) => order.user?.fullName ?? order.user?.email ?? "Guest",
              },
              {
                key: "totalAmount",
                header: "Giá trị",
                className: "text-right text-mono tabular",
                render: (order) => formatMoney(order.totalAmount),
              },
              {
                key: "status",
                header: "Trạng thái",
                render: (order) => <StatusBadge status={order.status} />,
              },
              {
                key: "createdAt",
                header: "Tạo lúc",
                className: "text-[11.5px] text-muted-foreground",
                render: (order) => formatDateTime(order.createdAt),
              },
            ]}
          />
        </Panel>

        <Panel title="Low-stock alerts" subtitle="Theo ngưỡng từ Settings Registry" padded={false}>
          <ResourceTable<DashboardLowStockAlert>
            rows={lowStockQuery.data ?? []}
            getRowKey={(row) => row.id}
            isLoading={lowStockQuery.isLoading}
            error={lowStockQuery.error}
            onRetry={() => void lowStockQuery.refetch()}
            emptyTitle="Không có tồn thấp"
            emptyDescription="Không có SKU nào dưới ngưỡng cấu hình."
            columns={[
              {
                key: "sku",
                header: "SKU",
                className: "text-mono text-[11px]",
                render: (row) => row.productVariant?.sku ?? "N/A",
              },
              {
                key: "name",
                header: "Sản phẩm",
                render: (row) => readLocalizedName(row.productVariant?.product?.name),
              },
              {
                key: "warehouse",
                header: "Kho",
                render: (row) => row.warehouse?.name ?? row.warehouse?.code ?? "N/A",
              },
              {
                key: "quantity",
                header: "Tồn",
                className: "text-right text-mono tabular text-warning",
                render: (row) => row.quantity,
              },
              {
                key: "reservedQuantity",
                header: "Reserved",
                className: "text-right text-mono tabular",
                render: (row) => row.reservedQuantity,
              },
            ]}
          />
        </Panel>
      </div>
    </Page>
  );
}
