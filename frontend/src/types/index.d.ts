/**
 * Re-export shared types
 * Có thể extend hoặc override nếu cần
 */
export type { User, UserSummary, UserWithRoles } from '@shared/types';
export type { Order, OrderSummary, OrderItem } from '@shared/types';
export type { Product, ProductSummary, ProductVariant, ProductMedia, Category } from '@shared/types';
export type { ApiResponse, PaginatedResponse, PaginationMeta, ApiError } from '@shared/types';
export type { LoginPayload, RegisterPayload, AuthTokens, AuthResponse } from '@shared/types';
