import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api/catalog.api";

export function useCatalogOverview() {
  return useQuery({
    queryKey: ["catalog-overview"],
    queryFn: catalogApi.overview,
  });
}
