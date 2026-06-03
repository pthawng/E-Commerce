import { backOfficeJson } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";
import type { ProductCatalogStatusValue, StockStatusValue } from "@shared";

export type CatalogStatus = ProductCatalogStatusValue;
export type StockStatus = StockStatusValue;

export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  collection: string | null;
  collectionId?: string | null;
  category: string | null;
  categoryId?: string | null;
  certificate: string | null;
  retailPrice: number;
  currency: string;
  stock: number;
  stockStatus: StockStatus;
  status: CatalogStatus;
  pricingApproved: boolean;
  preorderEnabled: boolean;
  updatedAt: string;
  thumbnailUrl: string | null;
};

export type CatalogProductDetail = CatalogProduct & {
  slug: string;
  description?: string;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    price: number;
    stock: number;
    stockStatus: StockStatus;
  }>;
  pricing: {
    materialCost: number;
    laborCost: number;
    marginMultiplier: number;
    boutiqueCoefficient: number;
    retailPrice: number;
    currency: string;
    formulaVersion: number;
    approvedAt?: string;
  } | null;
  inventory: Array<{
    variantId: string;
    sku: string;
    stock: number;
    reservedStock: number;
    preorderLimit: number | null;
    stockStatus: StockStatus;
  }>;
  certificates: Array<{
    id: string;
    certificateNo: string;
    authority: string;
    type: string;
    gemstone?: string;
    fileUrl?: string;
  }>;
  media: Array<{
    id: string;
    url: string;
    type: string;
    altText?: unknown;
    isThumbnail: boolean;
    order: number;
  }>;
  workflow: {
    id: string;
    status: string;
    currentStep: string;
    steps: Array<{
      id: string;
      step: string;
      status: string;
      assignedRole?: string;
      completedAt?: string;
    }>;
  } | null;
  auditLogs: Array<{ id: string; action: string; createdAt: string; metadata?: unknown }>;
};

export type CatalogQuery = {
  search?: string;
  collectionId?: string;
  categoryId?: string;
  status?: CatalogStatus | "";
  stockStatus?: StockStatus | "";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type CatalogListResponse = {
  data: CatalogProduct[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type CatalogOverview = {
  activeSkuCount: number;
  activeSkuGrowth: number;
  averageOrderValue: number;
  averageOrderValueGrowth: number;
  inWorkshopCount: number;
  draftCount: number;
  pendingApprovalCount: number;
};

export type CatalogFilters = {
  collections: Array<{ id: string; name: string; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
};

export type PricingFormula = {
  version: number;
  materialCost: number;
  laborCost: number;
  marginMultiplier: number;
  boutiqueCoefficient: number;
  currency: string;
};

export type CreateCatalogProductPayload = {
  name: string;
  sku: string;
  collectionId: string;
  categoryId: string;
  retailPrice: number;
  stock: number;
  certificate?: string;
  thumbnailUrl?: string;
  pricingApproved?: boolean;
  preorderEnabled?: boolean;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  return backOfficeJson<T>(url, init);
}

function buildQuery(query: CatalogQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) params.set(key, String(value));
  });
  return params.toString();
}

export const catalogApi = {
  listProducts(query: CatalogQuery) {
    const qs = buildQuery(query);
    return request<CatalogListResponse>(
      `${API_ENDPOINTS.BACK_OFFICE.CATALOG.PRODUCTS}${qs ? `?${qs}` : ""}`,
    );
  },
  overview() {
    return request<CatalogOverview>(API_ENDPOINTS.BACK_OFFICE.CATALOG.OVERVIEW);
  },
  filters() {
    return request<CatalogFilters>(API_ENDPOINTS.BACK_OFFICE.CATALOG.FILTERS);
  },
  detail(id: string) {
    return request<CatalogProductDetail>(API_ENDPOINTS.BACK_OFFICE.CATALOG.PRODUCT_BY_ID(id));
  },
  createProduct(payload: CreateCatalogProductPayload) {
    return request<CatalogProductDetail>(API_ENDPOINTS.BACK_OFFICE.CATALOG.PRODUCTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  changeStatus(id: string, status: CatalogStatus, reason?: string) {
    return request<CatalogProductDetail>(API_ENDPOINTS.BACK_OFFICE.CATALOG.PRODUCT_STATUS(id), {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    });
  },
  pricingFormula() {
    return request<PricingFormula>(API_ENDPOINTS.BACK_OFFICE.CATALOG.PRICING_FORMULA);
  },
  importRows(rows: CreateCatalogProductPayload[]) {
    return request<{
      id: string;
      status: string;
      totalRows: number;
      successRows: number;
      failedRows: number;
      errorReport?: unknown;
    }>(API_ENDPOINTS.BACK_OFFICE.CATALOG.IMPORT, {
      method: "POST",
      body: JSON.stringify({ fileName: "manual-catalog-import.json", rows }),
    });
  },
};
