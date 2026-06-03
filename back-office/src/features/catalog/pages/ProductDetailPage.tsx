import { Page } from "@/components/ui-kit";
import { AssetLibraryCard } from "../components/AssetLibraryCard";
import { PricingFormulaCard } from "../components/PricingFormulaCard";
import { PublishingWorkflowCard } from "../components/PublishingWorkflowCard";
import { useProductDetail } from "../hooks/useProductDetail";

export function ProductDetailPage({ productId }: { productId: string }) {
  const detail = useProductDetail(productId);

  return (
    <Page>
      <div>
        <h1 className="text-display text-3xl">{detail.data?.name ?? "Product detail"}</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{detail.data?.sku}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <PricingFormulaCard product={detail.data} />
        <PublishingWorkflowCard product={detail.data} />
        <AssetLibraryCard product={detail.data} />
      </div>
    </Page>
  );
}
