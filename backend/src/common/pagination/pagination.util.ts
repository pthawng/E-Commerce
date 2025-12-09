export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
}: {
  totalItems: number;
  page: number;
  limit: number;
}): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function buildPaginationLinks({
  basePath,
  page,
  limit,
  totalPages,
  extraQuery,
}: {
  basePath: string;
  page: number;
  limit: number;
  totalPages: number;
  extraQuery?: Record<string, string | number | boolean | undefined>;
}): PaginationLinks {
  const buildUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
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
    self: buildUrl(page),
    next: page < totalPages ? buildUrl(page + 1) : null,
    prev: page > 1 ? buildUrl(page - 1) : null,
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
