import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api/catalog.api";

export function useProductDetail(productId?: string) {
  return useQuery({
    queryKey: ["catalog-product-detail", productId],
    queryFn: () => catalogApi.detail(productId!),
    enabled: Boolean(productId),
  });
}
