import { Filter, Search, X } from "lucide-react";
import type { CatalogFilters, CatalogQuery, CatalogStatus, StockStatus } from "../api/catalog.api";

const statuses: Array<{ value: CatalogStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
  { value: "WORKSHOP_REVIEW", label: "Workshop review" },
];

const stockStatuses: Array<{ value: StockStatus; label: string }> = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
];

export function CatalogFilterBar({
  filters,
  query,
  search,
  onSearchChange,
  onQueryChange,
}: {
  filters?: CatalogFilters;
  query: CatalogQuery;
  search: string;
  onSearchChange: (value: string) => void;
  onQueryChange: (patch: CatalogQuery) => void;
}) {
  const activeFilterCount = [
    query.collectionId,
    query.categoryId,
    query.status,
    query.stockStatus,
    query.search,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
      <div className="flex min-w-[260px] flex-1 items-center gap-2 h-8 px-3 rounded-md bg-surface border border-border">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          placeholder="Tìm theo tên, SKU, chứng chỉ"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
        />
        {search ? (
          <button
            onClick={() => onSearchChange("")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      <select
        value={query.collectionId ?? ""}
        onChange={(event) =>
          onQueryChange({ collectionId: event.target.value || undefined, page: 1 })
        }
        className="h-8 rounded-md border border-border bg-surface px-2 text-[11.5px]"
      >
        <option value="">Tất cả bộ sưu tập</option>
        {filters?.collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>

      <select
        value={query.categoryId ?? ""}
        onChange={(event) =>
          onQueryChange({ categoryId: event.target.value || undefined, page: 1 })
        }
        className="h-8 rounded-md border border-border bg-surface px-2 text-[11.5px]"
      >
        <option value="">Tất cả category</option>
        {filters?.categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        value={query.status ?? ""}
        onChange={(event) =>
          onQueryChange({ status: (event.target.value as CatalogStatus) || "", page: 1 })
        }
        className="h-8 rounded-md border border-border bg-surface px-2 text-[11.5px]"
      >
        <option value="">Tất cả trạng thái</option>
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <select
        value={query.stockStatus ?? ""}
        onChange={(event) =>
          onQueryChange({ stockStatus: (event.target.value as StockStatus) || "", page: 1 })
        }
        className="h-8 rounded-md border border-border bg-surface px-2 text-[11.5px]"
      >
        <option value="">Tất cả tồn kho</option>
        {stockStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <button className="h-8 px-3 rounded-md border border-border bg-surface text-[11.5px] text-muted-foreground flex items-center gap-1.5">
        <Filter className="h-3 w-3" /> {activeFilterCount} lọc
      </button>
    </div>
  );
}
