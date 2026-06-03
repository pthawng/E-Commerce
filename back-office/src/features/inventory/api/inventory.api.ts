import { backOfficeJson } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";
import type { InventoryItemStatusValue, TransferStatusValue, ActionType } from "@shared";

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  address: unknown;
  isActive: boolean;
};

export type InventoryOverview = {
  totalInsuranceValue: number;
  rfidTaggedPercentage: number;
  inTransitCount: number;
  discrepancyCount: number;
  serializedItems: number;
  inventoryHealth: {
    healthy: number;
    lowStock: number;
    deadStock: number;
  };
};

export type InventoryBalance = {
  id: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  inTransitQuantity: number;
  shelfLocation?: string;
  updatedAt: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  productVariant: {
    id: string;
    sku: string;
    variantTitle: unknown;
    price: number;
    thumbnailUrl?: string;
  };
};

export type InventoryLog = {
  id: string;
  inventoryBalanceId: string;
  productVariantId?: string;
  warehouseId?: string;
  actionType: `${ActionType}`;
  quantityChange: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  note?: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  productVariant?: {
    id: string;
    sku: string;
    variantTitle: unknown;
  };
};

export type InventoryTransfer = {
  id: string;
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: TransferStatusValue;
  note?: string;
  createdAt: string;
  fromWarehouse: {
    name: string;
  };
  toWarehouse: {
    name: string;
  };
  productVariant: {
    sku: string;
  };
};

export type StockLogsResponse = {
  data: InventoryLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  return backOfficeJson<T>(url, init);
}

export const inventoryApi = {
  overview() {
    return request<InventoryOverview>(API_ENDPOINTS.INVENTORY.OVERVIEW);
  },
  listWarehouses() {
    return request<Warehouse[]>(API_ENDPOINTS.INVENTORY.WAREHOUSES);
  },
  listStockLevels(params?: { warehouseId?: string; variantId?: string }) {
    const qs = new URLSearchParams();
    if (params?.warehouseId) qs.set("warehouseId", params.warehouseId);
    if (params?.variantId) qs.set("variantId", params.variantId);
    const queryStr = qs.toString();
    return request<InventoryBalance[]>(
      `${API_ENDPOINTS.INVENTORY.STOCK}${queryStr ? `?${queryStr}` : ""}`,
    );
  },
  listTransfers() {
    return request<InventoryTransfer[]>(API_ENDPOINTS.INVENTORY.TRANSFERS);
  },
  listLogs(query?: { page?: number; limit?: number; warehouseId?: string; actionType?: string }) {
    const qs = new URLSearchParams();
    if (query?.page) qs.set("page", String(query.page));
    if (query?.limit) qs.set("limit", String(query.limit));
    if (query?.warehouseId) qs.set("warehouseId", query.warehouseId);
    if (query?.actionType) qs.set("actionType", query.actionType);
    const queryStr = qs.toString();
    return request<StockLogsResponse>(
      `${API_ENDPOINTS.INVENTORY.LOGS}${queryStr ? `?${queryStr}` : ""}`,
    );
  },
  approveTransfer(id: string) {
    return request<InventoryTransfer>(API_ENDPOINTS.INVENTORY.TRANSFER_APPROVE(id), {
      method: "PATCH",
    });
  },
  rejectTransfer(id: string, note?: string) {
    return request<InventoryTransfer>(API_ENDPOINTS.INVENTORY.TRANSFER_REJECT(id), {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
  },
  resolveDiscrepancy(
    id: string,
    payload: {
      action: "DEDUCT_LOSS" | "ADD_SURPLUS" | "RE_SCANNED";
      targetStatus: Extract<
        InventoryItemStatusValue,
        "LOST" | "MISSING" | "FOUND" | "WRITTEN_OFF" | "AVAILABLE"
      >;
      note?: string;
    },
  ) {
    return request<unknown>(API_ENDPOINTS.INVENTORY.DISCREPANCY_RESOLVE(id), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
