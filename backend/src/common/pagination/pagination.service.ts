import { Injectable } from '@nestjs/common';
import type { PaginationDto } from './pagination.dto';
import {
  buildPagination,
  buildPaginationLinks,
  buildPaginationMeta,
  decodeCursor,
  encodeCursor,
  parseSort,
  type PaginatedResult,
} from './pagination.util';

/**
 * Options for pagination operation
 */
export interface PaginationOptions<TItem = any, TWhere = any> {
  /**
   * Function to execute findMany query
   */
  findMany: (args: {
    where?: TWhere;
    orderBy?: any[];
    skip?: number;
    take: number;
    cursor?: any;
    include?: any;
    select?: any;
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
  include?: any;

  /**
   * Select specific fields
   */
  select?: any;

  /**
   * Allowed fields for sorting (whitelist)
   */
  allowedSortFields: string[];

  /**
   * Default sort field and order
   */
  defaultSort?: { field: string; order: 'asc' | 'desc' };

  /**
   * Base path for pagination links
   */
  basePath: string;

  /**
   * Extra query parameters to include in pagination links
   */
  extraQuery?: Record<string, string | number | boolean | undefined>;
}

@Injectable()
export class PaginationService {
  /**
   * Execute hybrid pagination query (Cursor + Offset)
   * Enforces deterministic ordering using id as tie-breaker.
   */
  async paginate<TItem = any>(
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

    // 1. Determine Sort Order (Stable/Deterministic)
    const { field, order } = parseSort(dto.sort as string, allowedSortFields, defaultSort);
    const orderBy: any[] = [{ [field]: order }];
    if (field !== 'id') {
      orderBy.push({ id: order });
    }

    // 2. Execute Hybrid Logic
    if (dto.cursor) {
      return this.paginateCursor(options, { field, order, orderBy });
    }

    return this.paginateOffset(options, { field, order, orderBy });
  }

  /**
   * Cursor-based pagination (Infinite Scroll Friendly)
   */
  private async paginateCursor<TItem = any>(
    options: PaginationOptions<TItem>,
    sort: { field: string; order: 'asc' | 'desc'; orderBy: any[] },
  ): Promise<PaginatedResult<TItem>> {
    const { findMany, dto, where, include, select, basePath, extraQuery } = options;
    const { field, order, orderBy } = sort;

    const decoded = decodeCursor(dto.cursor as string);
    const take = dto.limit + 1; // Fetch one extra to check for next page

    const queryArgs: any = {
      where,
      orderBy,
      take,
      include,
      select,
    };

    // Apply cursor condition if decoded successfully
    if (decoded && decoded[field] !== undefined) {
      queryArgs.cursor = { id: decoded.id };
      queryArgs.skip = 1; // Skip the cursor element itself
    }

    const itemsRaw = await findMany(queryArgs);
    const hasNext = itemsRaw.length > dto.limit;
    const items = hasNext ? itemsRaw.slice(0, dto.limit) : itemsRaw;

    let nextCursor: string | null = null;
    if (hasNext && items.length > 0) {
      const lastItem = items[items.length - 1] as any;
      nextCursor = encodeCursor({
        [field]: lastItem[field],
        id: lastItem.id,
      });
    }

    const meta = buildPaginationMeta({
      limit: dto.limit,
      hasNext,
      nextCursor,
    });

    const links = buildPaginationLinks({
      basePath,
      limit: dto.limit,
      nextCursor,
      extraQuery,
    });

    return { items, meta, links };
  }

  /**
   * Standard Offset-based pagination (Backward Compatible)
   */
  private async paginateOffset<TItem = any>(
    options: PaginationOptions<TItem>,
    sort: { field: string; order: 'asc' | 'desc'; orderBy: any[] },
  ): Promise<PaginatedResult<TItem>> {
    const { findMany, count, dto, where, include, select, basePath, extraQuery } = options;
    const { orderBy } = sort;

    const { skip, take } = buildPagination({ page: dto.page as number, limit: dto.limit });

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

    const meta = buildPaginationMeta({
      totalItems,
      page: dto.page as number,
      limit: dto.limit,
    });

    const links = buildPaginationLinks({
      basePath,
      page: dto.page as number,
      limit: dto.limit,
      totalPages: meta.totalPages,
      extraQuery,
    });

    return { items, meta, links };
  }
}
