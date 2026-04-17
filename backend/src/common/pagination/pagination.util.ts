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
   * Null on the very first page (no previous position exists).
   */
  prevCursor?: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
  data?: any[];
}

export interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

export function buildPagination({ page, limit }: { page: number; limit: number }) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta({
  totalItems,
  page,
  limit,
  hasNext,
  hasPrev,
  nextCursor,
  prevCursor,
}: {
  totalItems?: number;
  page?: number;
  limit: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string | null;
  prevCursor?: string | null;
}): PaginationMeta {
  const totalPages = totalItems ? Math.max(1, Math.ceil(totalItems / limit)) : undefined;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext:
      hasNext ?? (page !== undefined && totalPages !== undefined ? page < totalPages : false),
    // P1-4 FIX: Accept explicit hasPrev from caller (cursor mode) instead of
    // unconditionally deriving from page number (which is undefined in cursor mode).
    hasPrev: hasPrev ?? (page !== undefined ? page > 1 : false),
    nextCursor,
    prevCursor,
  };
}

export function buildPaginationLinks({
  basePath,
  page,
  limit,
  totalPages,
  nextCursor,
  prevCursor,
  extraQuery,
}: {
  basePath: string;
  page?: number;
  limit: number;
  totalPages?: number;
  nextCursor?: string | null;
  prevCursor?: string | null;
  extraQuery?: Record<string, string | number | boolean | undefined>;
}): PaginationLinks {
  const buildUrl = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();
    urlParams.set('limit', String(limit));

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.set(key, value);
      }
    });

    if (extraQuery) {
      Object.entries(extraQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.set(key, String(value));
        }
      });
    }

    return `${basePath}?${urlParams.toString()}`;
  };

  // P1-5 FIX: self link correctly encodes cursor when in cursor mode.
  // Previously always encoded page=undefined → produced page-1 URL for cursor consumers.
  const selfParams: Record<string, string | undefined> = {};
  if (page !== undefined) {
    selfParams['page'] = String(page);
  }
  // Note: cursor consumers don't get a self cursor because the current page's
  // cursor IS the prevCursor they already hold. We expose prevCursor in meta.

  return {
    self: buildUrl(selfParams),
    // next link: prefer cursor navigation (O(log N)) over offset page increment (O(N))
    next: nextCursor
      ? buildUrl({ cursor: nextCursor })
      : page !== undefined && totalPages !== undefined && page < totalPages
        ? buildUrl({ page: String(page + 1) })
        : null,
    // prev link: cursor mode uses prevCursor; offset mode decrements page
    prev: prevCursor
      ? buildUrl({ cursor: prevCursor })
      : page !== undefined && page > 1
        ? buildUrl({ page: String(page - 1) })
        : null,
  };
}

export function parseSort(
  sort: string | undefined,
  allowedFields: string[] = [],
  fallback: { field: string; order: 'asc' | 'desc' } = { field: 'createdAt', order: 'desc' },
): { field: string; order: 'asc' | 'desc' } {
  if (!sort) return fallback;

  const [field, order] = sort.split(':');
  const normalizedOrder = order === 'asc' ? 'asc' : order === 'desc' ? 'desc' : undefined;
  const isAllowed = !allowedFields.length || allowedFields.includes(field);

  if (!field || !normalizedOrder || !isAllowed) {
    return fallback;
  }

  return { field, order: normalizedOrder };
}
