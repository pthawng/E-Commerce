import { Badge, Panel } from "@/components/ui-kit";
import type { CatalogProductDetail } from "../api/catalog.api";

const labels: Record<string, string> = {
  DRAFT: "Draft",
  MEDIA_CONTENT_REVIEW: "Review hình ảnh & nội dung",
  PRICING_REVIEW: "Review giá",
  BOUTIQUE_DISTRIBUTION: "Phân phối tới Boutique",
  ONLINE: "Online",
};

const roles: Record<string, string> = {
  DRAFT: "Curator",
  MEDIA_CONTENT_REVIEW: "Editorial",
  PRICING_REVIEW: "Finance",
  BOUTIQUE_DISTRIBUTION: "Operations",
  ONLINE: "Operations",
};

export function PublishingWorkflowCard({ product }: { product?: CatalogProductDetail }) {
  const steps = product?.workflow?.steps ?? [];

  return (
    <Panel
      title="Publishing workflow"
      subtitle={product ? `Mã SKU: ${product.sku}` : "Chọn một sản phẩm"}
    >
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const done = step.status === "COMPLETED";
          const current = step.status === "IN_PROGRESS";
          return (
            <li key={step.id} className="flex items-center gap-3">
              <div
                className={
                  done
                    ? "h-6 w-6 rounded-full border border-gold bg-gold/20 text-gold flex items-center justify-center text-[10px]"
                    : current
                      ? "h-6 w-6 rounded-full border border-gold text-gold flex items-center justify-center text-[10px]"
                      : "h-6 w-6 rounded-full border border-border text-muted-foreground flex items-center justify-center text-[10px]"
                }
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <div
                  className={
                    current ? "text-[12.5px] font-medium text-gold" : "text-[12.5px] font-medium"
                  }
                >
                  {labels[step.step] ?? step.step}
                </div>
                <div className="text-[10.5px] text-muted-foreground">
                  {step.assignedRole ?? roles[step.step]}
                </div>
              </div>
              {current ? <Badge variant="gold">In review</Badge> : null}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
