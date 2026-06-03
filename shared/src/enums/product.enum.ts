/**
 * Media Type Enum
 * Media type for products
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  MODEL_3D = 'model_3d',
}

/**
 * Inventory Action Type Enum
 * Inventory action type
 */
export enum ActionType {
  IMPORT = 'IMPORT',
  SALE = 'SALE',
  RETURN = 'RETURN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
}

/**
 * Product Catalog Status
 * Mirrors Prisma ProductCatalogStatus.
 */
export enum ProductCatalogStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRE_ORDER = 'PRE_ORDER',
  WORKSHOP_REVIEW = 'WORKSHOP_REVIEW',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Stock Status
 * Mirrors Prisma StockStatus.
 */
export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRE_ORDER = 'PRE_ORDER',
}

/**
 * Inventory Transfer Status
 * Mirrors Prisma TransferStatus.
 */
export enum TransferStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Inventory Reservation Status
 * Mirrors Prisma ReservationStatus.
 */
export enum ReservationStatus {
  ACTIVE = 'active',
  CONFIRMED = 'confirmed',
  RELEASED = 'released',
  EXPIRED = 'expired',
}

/**
 * Physical inventory item status
 * Mirrors Prisma ItemStatus.
 */
export enum InventoryItemStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_TRANSIT = 'IN_TRANSIT',
  SOLD = 'SOLD',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
  MISSING = 'MISSING',
  FOUND = 'FOUND',
  WRITTEN_OFF = 'WRITTEN_OFF',
  QC_HOLD = 'QC_HOLD',
  CONSULTATION = 'CONSULTATION',
}

