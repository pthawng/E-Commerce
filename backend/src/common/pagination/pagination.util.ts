export interface PaginationMeta {
  page?: number;
  limit: number;
  totalItems?: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

/**
 * Encode an object to a Base64 string
 */
export function encodeCursor(value: Record<string, any>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

/**
 * Decode a Base64 string to an object
 */
export function decodeCursor<T = Record<string, any>>(cursor: string): T | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded) as T;
  } catch (e) {
    return null;
  }
}

export function buildPagination({ page, limit }: { page: number; limit: number }) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginationMeta({
  totalItems,
  page,
  limit,
  hasNext,
  nextCursor,
}: {
  totalItems?: number;
  page?: number;
  limit: number;
  hasNext?: boolean;
  nextCursor?: string | null;
}): PaginationMeta {
  const totalPages = totalItems ? Math.max(1, Math.ceil(totalItems / limit)) : undefined;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: hasNext ?? (page !== undefined && totalPages !== undefined ? page < totalPages : false),
    hasPrev: page !== undefined ? page > 1 : false,
    nextCursor,
  };
}

export function buildPaginationLinks({
  basePath,
  page,
  limit,
  totalPages,
  nextCursor,
  extraQuery,
}: {
  basePath: string;
  page?: number;
  limit: number;
  totalPages?: number;
  nextCursor?: string | null;
  extraQuery?: Record<string, string | number | boolean | undefined>;
}): PaginationLinks {
  const buildUrl = (targetPage?: number, targetCursor?: string | null) => {
    const params = new URLSearchParams();
    if (targetPage) params.set('page', String(targetPage));
    if (targetCursor) params.set('cursor', targetCursor);
    params.set('limit', String(limit));

    if (extraQuery) {
      Object.entries(extraQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return {
    self: buildUrl(page, null), // TODO: improve self link for cursor
    next: nextCursor ? buildUrl(undefined, nextCursor) : (page !== undefined && totalPages !== undefined && page < totalPages ? buildUrl(page + 1) : null),
    prev: page !== undefined && page > 1 ? buildUrl(page - 1) : null,
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
