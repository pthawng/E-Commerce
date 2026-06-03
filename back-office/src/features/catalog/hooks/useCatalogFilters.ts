import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api/catalog.api";

export function useCatalogFilters() {
  return useQuery({
    queryKey: ["catalog-filters"],
    queryFn: catalogApi.filters,
    staleTime: 10 * 60 * 1000,
  });
}
