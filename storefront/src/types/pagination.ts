/**
 * Frontend mirror of the backend PaginationMeta / PaginationLinks contracts.
 * Keep in sync with backend/src/common/pagination/pagination.util.ts
 */
export interface PaginationMeta {
    page?: number;
    limit: number;
    totalItems?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string | null;
    /**
     * Provided in cursor mode so clients can navigate backwards.
     */
    prevCursor?: string | null;
}

export interface PaginationLinks {
    self: string;
    next: string | null;
    prev: string | null;
}
