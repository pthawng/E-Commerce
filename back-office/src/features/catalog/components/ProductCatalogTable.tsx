import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResourceTable } from "@/components/patterns";
import { getProductThumbnailUrl } from "@shared";
import { Eye, MoreHorizontal, Send, Tag, Archive, Rocket } from "lucide-react";
import type { CatalogProduct, CatalogStatus } from "../api/catalog.api";
import { ProductStatusBadge } from "./ProductStatusBadge";

const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days === 0 && date.getDate() === new Date().getDate())
    return hours > 0 ? `${hours}h ago` : "Today";
  if (days === 1) return "Yesterday";
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ProductThumbnail({
  url,
  name,
  isSelected,
}: {
  url: string | null;
  name: string;
  isSelected: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tối ưu hóa URL Unsplash về kích thước w=160
  const getOptimizedUrl = (originalUrl: string | null) => {
    if (!originalUrl) return "";
    if (originalUrl.includes("images.unsplash.com") && !originalUrl.includes("w=")) {
      const separator = originalUrl.includes("?") ? "&" : "?";
      return `${originalUrl}${separator}w=160&q=80&auto=format`;
    }
    return originalUrl;
  };

  const containerClass = isSelected
    ? "h-9 w-9 rounded-md border border-gold bg-gold/10 text-gold flex items-center justify-center overflow-hidden relative shrink-0"
    : "h-9 w-9 rounded-md border border-border bg-surface-raised text-gold/60 flex items-center justify-center overflow-hidden relative shrink-0";

  // Bảo mật: Nếu sau này sử dụng Supabase/S3 private, cần dùng signed URL hoặc proxy endpoint ở backend.
  if (!url || hasError) {
    return (
      <div className={containerClass}>
        <Tag className="h-3.5 w-3.5" />
      </div>
    );
  }

  const optimizedUrl = getOptimizedUrl(url);

  return (
    <div className={containerClass}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-raised">
          <Tag className="h-3.5 w-3.5 animate-pulse opacity-40" />
        </div>
      )}
      <img
        src={optimizedUrl}
        alt={name}
        className={`h-full w-full object-cover transition-transform duration-300 hover:scale-110 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

export function ProductCatalogTable({
  products,
  selectedId,
  isLoading,
  page,
  totalPages,
  total,
  error,
  onRetry,
  onSelect,
  onPageChange,
  onStatusChange,
}: {
  products: CatalogProduct[];
  selectedId?: string;
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  error?: unknown;
  onRetry?: () => void;
  onSelect: (product: CatalogProduct) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (product: CatalogProduct, status: CatalogStatus) => void;
}) {
  return (
    <ResourceTable
      rows={products}
      getRowKey={(product) => product.id}
      onRowClick={onSelect}
      isLoading={isLoading && !products.length}
      error={error}
      onRetry={onRetry}
      isEmpty={!products.length}
      loadingLabel="Đang tải catalog..."
      loadingRows={7}
      emptyTitle="Không có mẫu thiết kế phù hợp"
      emptyDescription="Thử xóa bộ lọc hoặc nhập SKU khác."
      pagination={{
        page,
        totalPages,
        total,
        count: products.length,
        label: `Hiển thị ${products.length} / ${total} mẫu thiết kế`,
        previousLabel: "Trước",
        nextLabel: "Sau",
        onPageChange,
      }}
      columns={[
        {
          key: "sku",
          header: "SKU",
          className: "text-mono text-[11.5px] text-muted-foreground",
          width: "120px",
        },
        {
          key: "name",
          header: "Mẫu thiết kế",
          render: (product) => {
            const isSelected = product.id === selectedId;
            return (
              <div className="flex items-center gap-3">
                <ProductThumbnail
                  url={getProductThumbnailUrl(
                    { thumbnailUrl: product.thumbnailUrl },
                    { fallbackUrl: null },
                  )}
                  name={product.name}
                  isSelected={isSelected}
                />
                <div>
                  <div className={isSelected ? "font-medium text-gold" : "font-medium"}>
                    {product.name}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {[product.collection, product.category].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            );
          },
        },
        {
          key: "certificate",
          header: "Chứng chỉ",
          className: "text-mono text-[11px] text-muted-foreground",
        },
        {
          key: "retailPrice",
          header: "Giá bán lẻ",
          width: "120px",
          className: "text-right text-mono tabular",
          render: (product) => eur.format(product.retailPrice),
        },
        {
          key: "stock",
          header: "Tồn",
          width: "80px",
          className: "text-right",
          render: (product) => (
            <span
              className={
                product.stock === 0
                  ? "text-destructive tabular"
                  : product.stock <= 2
                    ? "text-warning tabular"
                    : "tabular"
              }
            >
              {product.stock}
            </span>
          ),
        },
        {
          key: "status",
          header: "Trạng thái",
          render: (product) => <ProductStatusBadge status={product.status} />,
        },
        {
          key: "updatedAt",
          header: "Cập nhật",
          className: "text-[11.5px] text-muted-foreground",
          render: (product) => relativeTime(product.updatedAt),
        },
        {
          key: "actions",
          header: "",
          render: (product) => (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onSelect(product)}>
                      <Eye /> View detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSelect(product)}>
                      <Tag /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(product, "PENDING_REVIEW")}>
                      <Send /> Submit review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(product, "PUBLISHED")}>
                      <Rocket /> Publish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(product, "ARCHIVED")}>
                      <Archive /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        },
      ]}
    />
  );
}
