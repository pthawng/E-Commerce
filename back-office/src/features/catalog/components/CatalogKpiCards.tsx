import { Skeleton } from "@/components/ui/skeleton";
import { Stat } from "@/components/ui-kit";
import type { CatalogOverview } from "../api/catalog.api";

const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function CatalogKpiCards({
  overview,
  isLoading,
}: {
  overview?: CatalogOverview;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Stat
        label="SKU đang hoạt động"
        value={overview?.activeSkuCount ?? 0}
        delta="+0"
        trend="flat"
      />
      <Stat
        label="Giá trị đơn hàng TB"
        value={eur.format(overview?.averageOrderValue ?? 0)}
        delta="+0%"
        trend="flat"
      />
      <Stat label="Đang chế tác tại xưởng" value={overview?.inWorkshopCount ?? 0} />
      <Stat
        label="Bản nháp/chờ duyệt"
        value={(overview?.draftCount ?? 0) + (overview?.pendingApprovalCount ?? 0)}
        hint={`${overview?.pendingApprovalCount ?? 0} chờ duyệt`}
      />
    </div>
  );
}
