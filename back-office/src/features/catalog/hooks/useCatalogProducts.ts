import { useQuery } from "@tanstack/react-query";
import { catalogApi, type CatalogQuery } from "../api/catalog.api";

export function useCatalogProducts(query: CatalogQuery) {
  return useQuery({
    queryKey: ["catalog-products", query],
    queryFn: () => catalogApi.listProducts(query),
    placeholderData: (previous) => previous,
  });
}
