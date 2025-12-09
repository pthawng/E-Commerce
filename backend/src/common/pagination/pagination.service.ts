import { Injectable } from '@nestjs/common';
import type { PaginationDto } from './pagination.dto';
import {
  buildPagination,
  buildPaginationLinks,
  buildPaginationMeta,
  parseSort,
  type PaginatedResult,
} from './pagination.util';

/**
 * Options for pagination operation
 */
export interface PaginationOptions<TItem = unknown, TWhere = unknown> {
  /**
   * Function to execute findMany query
   */
  findMany: (args: {
    where?: TWhere;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip: number;
    take: number;
    include?: unknown;
    select?: unknown;
  }) => Promise<TItem[]>;

  /**
   * Function to execute count query
   */
  count: (args: { where?: TWhere }) => Promise<number>;

  /**
   * Pagination DTO from query params
   */
  dto: PaginationDto;

  /**
   * Where clause for filtering
   */
  where?: TWhere;

  /**
   * Include relations
   */
  include?: unknown;

  /**
   * Select specific fields
   */
  select?: unknown;

  /**
   * Allowed fields for sorting (whitelist)
   */
  allowedSortFields: string[];

  /**
   * Default sort field and order
   */
  defaultSort?: { field: string; order: 'asc' | 'desc' };

  /**
   * Base path for pagination links (e.g., '/users', '/products')
   */
  basePath: string;

  /**
   * Extra query parameters to include in pagination links
   */
  extraQuery?: Record<string, string | number | boolean | undefined>;
}

/**
 * Base Pagination Service
 *
 * Provides reusable pagination logic for all modules.
 * Handles:
 * - Query validation (via DTO)
 * - Skip/take calculation
 * - Sort parsing with whitelist
 * - Parallel count + findMany execution
 * - Meta and links generation
 *
 * @example
 * ```ts
 * const result = await this.paginationService.paginate({
 *   findMany: (args) => this.prisma.user.findMany(args),
 *   count: (args) => this.prisma.user.count(args),
 *   dto,
 *   where: { deletedAt: null },
 *   allowedSortFields: ['createdAt', 'email', 'fullName'],
 *   defaultSort: { field: 'createdAt', order: 'desc' },
 *   basePath: '/users',
 *   extraQuery: { search: dto.search },
 * });
 * ```
 */
@Injectable()
export class PaginationService {
  /**
   * Execute pagination query
   *
   * @param options - Pagination configuration
   * @returns Paginated result with items, meta, and links
   */
  async paginate<TItem = unknown>(
    options: PaginationOptions<TItem>,
  ): Promise<PaginatedResult<TItem>> {
    const {
      findMany,
      count,
      dto,
      where,
      include,
      select,
      allowedSortFields,
      defaultSort = { field: 'createdAt', order: 'desc' },
      basePath,
      extraQuery,
    } = options;

    // Parse and validate sort
    const { field, order } = parseSort(dto.sort, allowedSortFields, defaultSort);

    // Calculate skip/take
    const { skip, take } = buildPagination({ page: dto.page, limit: dto.limit });

    // Build orderBy object for Prisma
    const orderBy: Record<string, 'asc' | 'desc'> = { [field]: order };

    // Execute count and findMany in parallel for better performance
    const [items, totalItems] = await Promise.all([
      findMany({
        where,
        orderBy,
        skip,
        take,
        include,
        select,
      }),
      count({ where }),
    ]);

    // Build pagination meta
    const meta = buildPaginationMeta({
      totalItems,
      page: dto.page,
      limit: dto.limit,
    });

    // Build pagination links
    const links = buildPaginationLinks({
      basePath,
      page: dto.page,
      limit: dto.limit,
      totalPages: meta.totalPages,
      extraQuery,
    });

    return {
      items,
      meta,
      links,
    };
  }
}
