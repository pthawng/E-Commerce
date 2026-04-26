import api from './apiInstance';

export interface InventoryItem {
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
        name?: Record<string, string>;
        variantTitle?: any;
    };
}

export interface InventoryTransfer {
    id: string;
    variantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    status: 'PENDING' | 'SHIPPED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';
    note?: string;
    createdAt: string;
    fromWarehouse: { name: string };
    toWarehouse: { name: string };
    productVariant: { sku: string };
}

export interface InventoryLog {
    id: string;
    actionType: string;
    quantityChange: number;
    beforeQuantity: number;
    afterQuantity: number;
    referenceId?: string;
    referenceType?: string;
    note?: string;
    createdAt: string;
    warehouse: { name: string };
    productVariant: { sku: string };
}

export interface Warehouse {
    id: string;
    name: string;
    code: string;
    address?: {
        city?: string;
        country?: string;
        province?: string;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const inventoryApi = {
    // Stock Levels
    getStockLevels: (filters: { warehouseId?: string; variantId?: string }) =>
        api.get<InventoryItem[]>('/inventory/stock', { params: filters }).then(res => res.data),

    // Transfers
    getTransfers: () =>
        api.get<InventoryTransfer[]>('/inventory/transfers').then(res => res.data),

    initiateTransfer: (data: { variantId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; note?: string }) =>
        api.post('/inventory/transfers', data).then(res => res.data),

    shipTransfer: (id: string) =>
        api.post(`/inventory/transfers/${id}/ship`).then(res => res.data),

    receiveTransfer: (id: string) =>
        api.post(`/inventory/transfers/${id}/receive`).then(res => res.data),

    // Logs
    getLogs: (params: any) =>
        api.get<{ data: InventoryLog[]; meta: any }>('/inventory/logs', { params }).then(res => res.data),

    // Warehouses
    getWarehouses: () =>
        api.get<Warehouse[]>('/inventory/warehouses').then(res => res.data),

    createWarehouse: (data: { name: string; code: string; address?: string; isActive?: boolean }) =>
        api.post<Warehouse>('/inventory/warehouses', data).then(res => res.data),

    updateWarehouse: (id: string, data: { name?: string; code?: string; address?: string; isActive?: boolean }) =>
        api.patch<Warehouse>(`/inventory/warehouses/${id}`, data).then(res => res.data),
};

