export interface InventoryTransaction {
    id: string;
    type: 'restock' | 'sale' | 'adjustment' | 'production_use' | 'return';
    entityType: 'product_variant' | 'raw_material';
    entityId: string; // variantId or materialId
    quantity: number; // positive or negative
    previousQuantity: number;
    newQuantity: number;
    referenceId?: string; // orderId or shipmentId
    notes?: string;
    performedBy: string; // userId
    timestamp: string;
}

export interface RawMaterial {
    id: string;
    name: string;
    type: 'gold' | 'silver' | 'platinum' | 'gemstone';
    unit: 'grams' | 'carats' | 'units';
    stockLevel: number;
    minimumStockLevel: number;
    averageCost?: number;
    metadata: Record<string, any>;
}
