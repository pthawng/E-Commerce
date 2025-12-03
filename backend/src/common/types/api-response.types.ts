/**
 * Re-export shared API types for backend
 * Backend có thể extend hoặc override nếu cần
 */
export type {
  ApiError,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  PaginationQuery,
} from '@shared/types';
