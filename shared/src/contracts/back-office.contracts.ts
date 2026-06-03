import type {
  InventoryItemStatus,
  ProductCatalogStatus,
  StaffInvitationStatus,
  StaffStatus,
  StockStatus,
  TransferStatus,
  UserType,
} from '../enums';
import type { PermissionSlug } from '../enums/rbac.enum';

export type ProductCatalogStatusValue = `${ProductCatalogStatus}`;
export type StockStatusValue = `${StockStatus}`;
export type TransferStatusValue = `${TransferStatus}`;
export type InventoryItemStatusValue = `${InventoryItemStatus}`;
export type StaffStatusValue = `${StaffStatus}`;
export type StaffInvitationStatusValue = `${StaffInvitationStatus}`;
export type UserTypeValue = `${UserType}`;
export type PermissionSlugValue = PermissionSlug;
