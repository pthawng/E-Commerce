/**
 * API Response Types
 * Chuẩn hóa response format giữa BE và FE
 */

/**
 * Standard API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
  data: T | null;
  meta: PaginationMeta | null;
  errors?: any;
}

/**
 * Pagination Meta
 * Supports hybrid Offset (page) and Cursor (nextCursor) modes
 */
export interface PaginationMeta {
  page?: number;
  limit: number;
  totalItems?: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * API Error Response
 */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
  meta: null;
  data: null;
}

/**
 * Pagination Query Params
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  cursor?: string;
}
