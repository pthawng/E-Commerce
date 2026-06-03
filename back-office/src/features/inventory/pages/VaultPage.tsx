import { Page, Panel, Stat, Badge, DataTable } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import {
  Lock,
  MapPin,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory.api";

type WarehouseAddress = {
  city?: string;
};

type LocalizedTitle = {
  en?: string;
  vi?: string;
};

// Helper to convert and format VND values into standard Luxury Euros format (or fallback if low value)
const formatValue = (vndAmount: number) => {
  if (!vndAmount) return "€0.0";
  // Assuming a conversion rate of 1 EUR = 27,000 VND for mock consistency
  const eurAmount = vndAmount / 27000;
  if (eurAmount >= 1000000) {
    return `€${(eurAmount / 1000000).toFixed(1)}M`;
  }
  if (eurAmount >= 1000) {
    return `€${(eurAmount / 1000).toFixed(1)}K`;
  }
  return `€${eurAmount.toFixed(0)}`;
};

export function VaultPage() {
  const { t } = useTranslation("vault");
  const { t: tc } = useTranslation("common");

  // Fetch live overview statistics
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["inventory", "overview"],
    queryFn: () => inventoryApi.overview(),
  });

  // Fetch list of physical warehouses / vaults
  const { data: warehouses, isLoading: isWarehousesLoading } = useQuery({
    queryKey: ["inventory", "warehouses"],
    queryFn: () => inventoryApi.listWarehouses(),
  });

  // Fetch inventory balances (quantities)
  const { data: stockLevels, isLoading: isStockLoading } = useQuery({
    queryKey: ["inventory", "stock"],
    queryFn: () => inventoryApi.listStockLevels(),
  });

  // Fetch movement logs
  const { data: logData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["inventory", "logs"],
    queryFn: () => inventoryApi.listLogs({ limit: 5 }),
  });

  const isLoading = isOverviewLoading || isWarehousesLoading || isStockLoading || isLogsLoading;

  // Process rows for Warehouse Locations table dynamically
  const warehouseRows = (warehouses || []).map((w) => {
    const wBalances = (stockLevels || []).filter((s) => s.warehouseId === w.id);
    const itemsCount = wBalances.reduce((sum, b) => sum + b.quantity, 0);
    const valueSum = wBalances.reduce(
      (sum, b) => sum + b.quantity * Number(b.productVariant.price),
      0,
    );
    const damagedSum = wBalances.reduce((sum, b) => sum + b.damagedQuantity, 0);
    const health =
      itemsCount > 0 ? Math.round(100 - (damagedSum / (itemsCount + damagedSum || 1)) * 100) : 100;

    let statusKey = "secured";
    let badgeVariant = "success";
    if (health === 100 && damagedSum === 0) {
      statusKey = "sealed";
      badgeVariant = "info";
    } else if (health < 95) {
      statusKey = "auditCycle";
      badgeVariant = "warning";
    }

    return {
      id: w.id,
      name: w.name,
      city: (w.address as WarehouseAddress | null | undefined)?.city || w.code,
      items: itemsCount,
      value: formatValue(valueSum),
      health,
      statusKey,
      v: badgeVariant,
    };
  });

  // Process rows for Recent movements timeline dynamically
  const movementRows = (logData?.data || []).map((log) => {
    const time = new Date(log.createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const variantName = log.productVariant
      ? `${(log.productVariant.variantTitle as LocalizedTitle | null | undefined)?.vi || (log.productVariant.variantTitle as LocalizedTitle | null | undefined)?.en || "Sản phẩm"} (${log.productVariant.sku})`
      : log.note || "Hàng tồn kho";

    let opKey = "saleFinal";
    let badgeVariant = "success";
    let statusKey = "delivered";

    if (log.actionType === "IMPORT") {
      opKey = "inboundGIA";
      badgeVariant = "info";
      statusKey = "sealed";
    } else if (log.actionType === "TRANSFER_OUT") {
      opKey = "transferEscorted";
      badgeVariant = "info";
      statusKey = "inTransit";
    } else if (log.actionType === "TRANSFER_IN") {
      opKey = "transferEscorted";
      badgeVariant = "success";
      statusKey = "delivered";
    } else if (log.actionType === "DAMAGE") {
      opKey = "inspection";
      badgeVariant = "warning";
      statusKey = "pending";
    }

    return {
      id: log.id,
      t: time,
      ref: log.referenceId
        ? log.referenceId.slice(0, 8).toUpperCase()
        : log.id.slice(0, 8).toUpperCase(),
      item: variantName,
      from:
        log.actionType === "TRANSFER_IN"
          ? "Warehouse Transit"
          : log.warehouse?.name || "Main Warehouse",
      to:
        log.actionType === "TRANSFER_OUT"
          ? "Warehouse Transit"
          : log.warehouse?.name || "Main Warehouse",
      opKey,
      statusKey,
      v: badgeVariant,
    };
  });

  // Mock luxury categories overlaying health ratios
  const inventoryCategories = [
    { catKey: "diamondsDFVVS", level: overview?.inventoryHealth.healthy || 100, alert: false },
    {
      catKey: "diamonds2ct",
      level: overview?.inventoryHealth.lowStock || 0,
      alert: (overview?.inventoryHealth.lowStock || 0) > 20,
    },
    { catKey: "colourStonesBurmese", level: 78, alert: false },
    { catKey: "pearlsSouthSea", level: 91, alert: false },
    { catKey: "platinumGold", level: 84, alert: false },
  ];

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Lock className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {t("page.subtitle", {
              locations: warehouses?.length || 0,
              items: overview?.serializedItems || 0,
              value: formatValue(overview?.totalInsuranceValue || 0),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
          <Badge variant="success">
            <ShieldCheck className="h-2.5 w-2.5" /> {t("badges.rfidOnline")}
          </Badge>
          <Badge variant="gold">{t("badges.auditLeft", { time: "02:14:09" })}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat
          accent
          label={t("kpis.totalInsuredValue")}
          value={formatValue(overview?.totalInsuranceValue || 0)}
          hint={t("kpis.totalInsuredValueHint")}
        />
        <Stat
          label={t("kpis.serializedItems")}
          value={overview?.serializedItems?.toString() || "0"}
          delta="+4"
          trend="up"
        />
        <Stat
          label={t("kpis.inTransit")}
          value={overview?.inTransitCount?.toString() || "0"}
          hint={t("kpis.inTransitHint", { n: overview?.inTransitCount || 0 })}
        />
        <Stat
          label={t("kpis.discrepancies")}
          value={overview?.discrepancyCount?.toString() || "0"}
          delta="−2"
          trend="down"
          hint={t("kpis.discrepanciesHint")}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel
          className="col-span-2"
          title={t("locations.title")}
          subtitle={t("locations.subtitle")}
          padded={false}
        >
          <DataTable
            columns={[
              {
                key: "name",
                header: t("locations.columns.vault"),
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-surface-raised border border-border-strong flex items-center justify-center">
                      <MapPin className="h-3.5 w-3.5 text-gold/70" />
                    </div>
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[10.5px] text-muted-foreground">{r.city}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "items",
                header: t("locations.columns.items"),
                className: "text-mono tabular text-right",
              },
              {
                key: "value",
                header: t("locations.columns.value"),
                className: "text-mono tabular text-right",
              },
              {
                key: "health",
                header: t("locations.columns.health"),
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.health >= 95 ? "bg-success" : r.health >= 85 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${r.health}%` }}
                      />
                    </div>
                    <span className="text-mono text-[11px] tabular">{r.health}%</span>
                  </div>
                ),
              },
              {
                key: "statusKey",
                header: t("locations.columns.status"),
                render: (r) => (
                  <Badge variant={r.v as BadgeVariant}>
                    {t(`locations.status.${r.statusKey}`)}
                  </Badge>
                ),
              },
            ]}
            rows={warehouseRows}
          />
        </Panel>

        <Panel title={t("inventoryHealth.title")} subtitle={t("inventoryHealth.subtitle")}>
          <div className="space-y-4">
            {inventoryCategories.map((c) => (
              <div key={c.catKey}>
                <div className="flex justify-between text-[11.5px] mb-1">
                  <span className="flex items-center gap-1.5">
                    {c.alert && <AlertTriangle className="h-3 w-3 text-warning" />}
                    {t(`inventoryHealth.categories.${c.catKey}`)}
                  </span>
                  <span className={`tabular ${c.alert ? "text-warning" : "text-muted-foreground"}`}>
                    {c.level}%
                  </span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.alert ? "bg-warning" : "bg-gold/70"}`}
                    style={{ width: `${c.level}%` }}
                  />
                </div>
              </div>
            ))}
            <button className="text-[11.5px] text-gold hover:underline flex items-center gap-1 mt-2">
              {tc("actions.requestRestock")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Panel>
      </div>

      <Panel
        title={t("movements.title")}
        subtitle={t("movements.subtitle")}
        action={
          <Badge variant="outline">
            <Activity className="h-2.5 w-2.5" /> {tc("status.live")}
          </Badge>
        }
        padded={false}
      >
        <DataTable
          columns={[
            {
              key: "t",
              header: t("movements.columns.time"),
              className: "text-mono text-[11.5px] text-muted-foreground",
              width: "70px",
            },
            {
              key: "ref",
              header: t("movements.columns.ref"),
              className: "text-mono text-[11.5px] text-muted-foreground",
            },
            {
              key: "item",
              header: t("movements.columns.asset"),
              render: (r) => <span className="font-medium">{r.item}</span>,
            },
            {
              key: "from",
              header: t("movements.columns.from"),
              className: "text-[11.5px] text-muted-foreground",
            },
            {
              key: "to",
              header: t("movements.columns.to"),
              render: (r) => <span className="text-[11.5px]">{r.to}</span>,
            },
            {
              key: "opKey",
              header: t("movements.columns.operation"),
              className: "text-[11.5px]",
              render: (r) => t(`movements.operations.${r.opKey}`),
            },
            {
              key: "statusKey",
              header: t("movements.columns.status"),
              render: (r) => (
                <Badge variant={r.v as BadgeVariant}>{t(`movements.status.${r.statusKey}`)}</Badge>
              ),
            },
          ]}
          rows={movementRows}
        />
      </Panel>
    </Page>
  );
}
