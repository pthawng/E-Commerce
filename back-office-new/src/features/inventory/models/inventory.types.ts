export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: any;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: string;
  warehouse?: Warehouse;
  productVariant?: {
    id: string;
    sku: string;
    variantTitle?: any;
    product: {
      id: string;
      name: any;
    };
  };
}

export interface InventoryLog {
  id: string;
  actionType: 'RECEIVE' | 'SALE' | 'RETURN' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DAMAGE';
  quantityChange: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceType?: string;
  referenceId?: string;
  actorId?: string;
  note?: string;
  createdAt: string;
  warehouse?: Partial<Warehouse>;
  productVariant?: {
    sku: string;
    variantTitle?: any;
  };
}

export interface StockQueryFilters {
  variantId?: string;
  warehouseId?: string;
  actionType?: string;
  referenceType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TransferStockDto {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  note?: string;
}

export interface AdjustStockDto {
  variantId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
}
