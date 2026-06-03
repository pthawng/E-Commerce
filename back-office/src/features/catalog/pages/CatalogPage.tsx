import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Page, Panel } from "@/components/ui-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  catalogApi,
  type CatalogProduct,
  type CatalogQuery,
  type CatalogStatus,
  type CreateCatalogProductPayload,
} from "../api/catalog.api";
import { AssetLibraryCard } from "../components/AssetLibraryCard";
import { CatalogFilterBar } from "../components/CatalogFilterBar";
import { CatalogKpiCards } from "../components/CatalogKpiCards";
import { PricingFormulaCard } from "../components/PricingFormulaCard";
import { ProductCatalogTable } from "../components/ProductCatalogTable";
import { PublishingWorkflowCard } from "../components/PublishingWorkflowCard";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import { useCatalogOverview } from "../hooks/useCatalogOverview";
import { useCatalogProducts } from "../hooks/useCatalogProducts";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePricingFormula } from "../hooks/usePricingFormula";
import { useProductDetail } from "../hooks/useProductDetail";

function initialQuery(): CatalogQuery {
  if (typeof window === "undefined")
    return { page: 1, limit: 7, sortBy: "updatedAt", sortOrder: "desc" };
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get("search") ?? undefined,
    collectionId: params.get("collectionId") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    status: (params.get("status") as CatalogStatus | null) ?? "",
    stockStatus: (params.get("stockStatus") as CatalogQuery["stockStatus"] | null) ?? "",
    page: Number(params.get("page") ?? 1),
    limit: Number(params.get("limit") ?? 7),
    sortBy: params.get("sortBy") ?? "updatedAt",
    sortOrder: (params.get("sortOrder") as "asc" | "desc" | null) ?? "desc",
  };
}

function syncUrl(query: CatalogQuery) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) params.set(key, String(value));
  });
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

export function CatalogPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState<CatalogQuery>(() => initialQuery());
  const [search, setSearch] = useState(query.search ?? "");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importParseError, setImportParseError] = useState<string | undefined>();

  useEffect(() => {
    setQuery((current) => ({ ...current, search: debouncedSearch || undefined, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => syncUrl(query), [query]);

  const productsQuery = useCatalogProducts(query);
  const overviewQuery = useCatalogOverview();
  const filtersQuery = useCatalogFilters();
  const pricingFormulaQuery = usePricingFormula();
  const selectedProduct =
    productsQuery.data?.data.find((product) => product.id === selectedId) ??
    productsQuery.data?.data[0];
  const detailQuery = useProductDetail(selectedProduct?.id);

  useEffect(() => {
    if (!selectedId && productsQuery.data?.data[0]) setSelectedId(productsQuery.data.data[0].id);
  }, [productsQuery.data, selectedId]);

  const invalidateCatalog = () => {
    void queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog-product-detail"] });
  };

  const createMutation = useMutation({
    mutationFn: catalogApi.createProduct,
    onSuccess: (product) => {
      setSelectedId(product.id);
      setCreateOpen(false);
      invalidateCatalog();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ product, status }: { product: CatalogProduct; status: CatalogStatus }) =>
      catalogApi.changeStatus(product.id, status),
    onSuccess: (product) => {
      setSelectedId(product.id);
      invalidateCatalog();
    },
  });

  const importMutation = useMutation({
    mutationFn: (rows: CreateCatalogProductPayload[]) => catalogApi.importRows(rows),
    onSuccess: () => {
      setImportOpen(false);
      setImportJson("");
      setImportParseError(undefined);
      invalidateCatalog();
    },
  });

  const pageMeta = productsQuery.data?.meta ?? {
    page: query.page ?? 1,
    limit: query.limit ?? 7,
    total: 0,
    totalPages: 1,
  };
  const products = productsQuery.data?.data ?? [];
  const createDefaults = useMemo(
    () => ({
      collectionId: filtersQuery.data?.collections[0]?.id ?? "",
      categoryId: filtersQuery.data?.categories[0]?.id ?? "",
    }),
    [filtersQuery.data],
  );

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl">Thương mại & Catalog</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Dữ liệu sản phẩm, SKU, tồn kho và workflow xuất bản đang lấy trực tiếp từ API
            back-office.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload /> Nhập dữ liệu
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Thêm mẫu thiết kế mới
          </Button>
        </div>
      </div>

      <CatalogKpiCards overview={overviewQuery.data} isLoading={overviewQuery.isLoading} />

      <Panel padded={false}>
        <CatalogFilterBar
          filters={filtersQuery.data}
          query={query}
          search={search}
          onSearchChange={setSearch}
          onQueryChange={(patch) => setQuery((current) => ({ ...current, ...patch }))}
        />
        <ProductCatalogTable
          products={products}
          selectedId={selectedProduct?.id}
          isLoading={productsQuery.isLoading}
          page={pageMeta.page}
          totalPages={pageMeta.totalPages}
          total={pageMeta.total}
          error={productsQuery.error}
          onRetry={() => void productsQuery.refetch()}
          onSelect={(product) => setSelectedId(product.id)}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
          onStatusChange={(product, status) => statusMutation.mutate({ product, status })}
        />
      </Panel>

      {statusMutation.error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Không đổi được trạng thái</AlertTitle>
          <AlertDescription>{statusMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <PricingFormulaCard product={detailQuery.data} formula={pricingFormulaQuery.data} />
        <PublishingWorkflowCard product={detailQuery.data} />
        <AssetLibraryCard product={detailQuery.data} />
      </div>

      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        filters={filtersQuery.data}
        defaults={createDefaults}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập dữ liệu catalog</DialogTitle>
            <DialogDescription>
              Dán mảng JSON các dòng catalog đã validate. CSV/XLSX parser sẽ được nối vào endpoint
              import khi upload infra được bật.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importJson}
            onChange={(event) => setImportJson(event.target.value)}
            rows={10}
            placeholder='[{"name":"Eternal Harmony Band","sku":"RP-5021-H","collectionId":"...","categoryId":"...","retailPrice":42000,"stock":1}]'
          />
          {importParseError ? (
            <p className="text-[12px] text-destructive">{importParseError}</p>
          ) : null}
          {importMutation.error ? (
            <p className="text-[12px] text-destructive">{importMutation.error.message}</p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Hủy
            </Button>
            <Button
              disabled={importMutation.isPending}
              onClick={() => {
                try {
                  const rows = JSON.parse(importJson || "[]") as CreateCatalogProductPayload[];
                  setImportParseError(undefined);
                  importMutation.mutate(rows);
                } catch {
                  setImportParseError("JSON import không hợp lệ.");
                }
              }}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

function CreateProductDialog({
  open,
  onOpenChange,
  filters,
  defaults,
  isPending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: {
    collections: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
  };
  defaults: { collectionId: string; categoryId: string };
  isPending: boolean;
  error?: string;
  onSubmit: (payload: CreateCatalogProductPayload) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm mẫu thiết kế mới</DialogTitle>
          <DialogDescription>
            Tạo ProductDesign và SKU mặc định trong catalog back-office.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            onSubmit({
              name: String(form.get("name") ?? ""),
              sku: String(form.get("sku") ?? ""),
              collectionId: String(form.get("collectionId") ?? defaults.collectionId),
              categoryId: String(form.get("categoryId") ?? defaults.categoryId),
              retailPrice: Number(form.get("retailPrice") ?? 0),
              stock: Number(form.get("stock") ?? 0),
              certificate: String(form.get("certificate") ?? "") || undefined,
              thumbnailUrl: String(form.get("thumbnailUrl") ?? "") || undefined,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="name" label="Tên mẫu thiết kế" required />
            <Field name="sku" label="Mã SKU" required />
            <label className="flex flex-col gap-1 text-[12px]">
              Bộ sưu tập
              <select
                name="collectionId"
                defaultValue={defaults.collectionId}
                className="h-9 rounded-md border border-border bg-surface px-2"
              >
                {filters?.collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[12px]">
              Category
              <select
                name="categoryId"
                defaultValue={defaults.categoryId}
                className="h-9 rounded-md border border-border bg-surface px-2"
              >
                {filters?.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Field name="retailPrice" label="Giá bán lẻ EUR" type="number" required />
            <Field name="stock" label="Tồn kho ban đầu" type="number" required />
            <Field name="certificate" label="Chứng chỉ" />
            <Field name="thumbnailUrl" label="Ảnh chính URL" />
          </div>
          {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              Tạo sản phẩm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
