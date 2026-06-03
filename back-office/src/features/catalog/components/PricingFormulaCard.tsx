import { Panel } from "@/components/ui-kit";
import type { CatalogProductDetail, PricingFormula } from "../api/catalog.api";

const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function PricingFormulaCard({
  product,
  formula,
}: {
  product?: CatalogProductDetail;
  formula?: PricingFormula;
}) {
  const pricing = product?.pricing;
  const rows = [
    [
      "Material cost",
      pricing ? eur.format(pricing.materialCost) : eur.format(formula?.materialCost ?? 0),
    ],
    [
      "Atelier labor",
      pricing ? eur.format(pricing.laborCost) : eur.format(formula?.laborCost ?? 0),
    ],
    ["Maison margin", `x ${pricing?.marginMultiplier ?? formula?.marginMultiplier ?? 4.2}`],
    [
      "Boutique coefficient",
      pricing
        ? eur.format(pricing.boutiqueCoefficient)
        : eur.format(formula?.boutiqueCoefficient ?? 0),
    ],
  ];

  return (
    <Panel
      title="Công thức định giá"
      subtitle={product ? `Đang cấu hình cho ${product.name}` : `Version ${formula?.version ?? 1}`}
    >
      <div className="flex flex-col gap-3 text-[12px]">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-b border-border/60 py-1.5 last:border-0"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="text-mono font-medium">{value}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3 font-medium text-gold">
          <span>Giá bán lẻ niêm yết</span>
          <span className="text-mono">{eur.format(product?.retailPrice ?? 0)}</span>
        </div>
      </div>
    </Panel>
  );
}
