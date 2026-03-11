import axiosClient from '@/shared/api/axiosClient';
import type { 
  InventoryItem, 
  InventoryLog, 
  StockQueryFilters, 
  PaginatedResponse, 
  TransferStockDto, 
  AdjustStockDto,
  Warehouse
} from '../models/inventory.types';

export const inventoryApi = {
  /**
   * Get all warehouses
   */
  getWarehouses: () => 
    axiosClient.get<any, any>('/inventory/warehouses').then(res => res.data as Warehouse[]),

  /**
   * Get inventory items (optionally filtered by variant/warehouse)
   */
  getStockLevels: (params?: { variantId?: string; warehouseId?: string }) =>
    axiosClient.get<any, any>('/inventory/stock', { params }).then(res => res.data as InventoryItem[]),

  /**
   * Get movement history
   */
  getHistory: (filters: StockQueryFilters) =>
    axiosClient.get<any, any>('/inventory/logs', { params: filters }).then(res => ({
      data: res.data,
      meta: res.meta,
    } as PaginatedResponse<InventoryLog>)),

  /**
   * Transfer stock between warehouses
   */
  transfer: (data: TransferStockDto) => 
    axiosClient.post('/inventory/transfer', data),

  /**
   * Adjust stock manually
   */
  adjust: (data: AdjustStockDto) =>
    axiosClient.post('/inventory/adjust', data),

  /**
   * Report damaged stock
   */
  reportDamage: (data: AdjustStockDto) =>
    axiosClient.post('/inventory/damage', data),
};
