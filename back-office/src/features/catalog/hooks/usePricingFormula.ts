import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api/catalog.api";

export function usePricingFormula() {
  return useQuery({
    queryKey: ["catalog-pricing-formula"],
    queryFn: catalogApi.pricingFormula,
  });
}
