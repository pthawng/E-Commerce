import { StatusBadge } from "@/components/patterns";
import type { CatalogStatus } from "../api/catalog.api";

export function ProductStatusBadge({ status }: { status: CatalogStatus }) {
  return <StatusBadge status={status} />;
}
