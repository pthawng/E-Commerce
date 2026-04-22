import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { Buffer } from 'node:buffer';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { PaginationDto } from './pagination.dto';
import {
  buildPagination,
  buildPaginationLinks,
  buildPaginationMeta,
  parseSort,
  type PaginatedResult,
} from './pagination.util';
import { QueryCostService } from './query-cost.service';

/**
 * Maximum age (in ms) for a client-supplied snapshot_at timestamp.
 */
const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache TTL for COUNT(*) queries (in ms).
 */
const COUNT_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export interface PaginationOptions<TItem = any, TWhere = any> {
  findMany: (args: {
    where?: TWhere;
    orderBy?: any[];
    skip?: number;
    take: number;
    cursor?: any;
    include?: any;
    select?: any;
  }) => Promise<TItem[]>;

  count: (args: { where?: TWhere }) => Promise<number>;
  dto: PaginationDto;
  where?: TWhere;
  include?: any;
  select?: any;
  allowedSortFields: string[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  basePath: string;
  extraQuery?: Record<string, string | number | boolean | undefined>;
  filterComplexity?: number;
  joinCount?: number;
}

@Injectable()
export class PaginationService {
  private readonly logger = new Logger(PaginationService.name);
  private readonly secret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly queryCostService: QueryCostService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    const secret = this.config.get<string>('PAGINATION_SECRET');
    if (!secret) {
      this.logger.warn('PAGINATION_SECRET is not set — using fallback.');
    }
    this.secret = secret || 'fallback-low-security-secret';
  }

  async paginate<TItem = any>(options: PaginationOptions<TItem>): Promise<PaginatedResult<TItem>> {
    const {
      dto,
      allowedSortFields,
      defaultSort = { field: 'createdAt', order: 'desc' },
      filterComplexity = 0,
      joinCount = 0,
    } = options;

    // 1. Query Cost Control
    this.queryCostService.validate({
      limit: dto.limit,
      includeCount: joinCount,
      filterComplexity,
    });

    // 2. Snapshot Consistency
    const snapshotAt = this.resolveSnapshotAt(dto.snapshot_at);

    const { field, order } = parseSort(dto.sort as string, allowedSortFields, defaultSort);
    const orderBy: any[] = [{ [field]: order }];
    if (field !== 'id') {
      orderBy.push({ id: order });
    }

    // 3. Cursor Verification & Execution
    if (dto.cursor) {
      const decoded = this.verifyAndDecodeCursor(dto.cursor);
      if (!decoded) {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid or expired cursor.',
        });
      }
      return this.paginateCursor(options, { field, order, orderBy, snapshotAt }, decoded);
    }

    return this.paginateOffset(options, { field, order, orderBy, snapshotAt });
  }

  private async paginateCursor<TItem = any>(
    options: PaginationOptions<TItem>,
    ctx: { field: string; order: 'asc' | 'desc'; orderBy: any[]; snapshotAt: string },
    decoded: any,
  ): Promise<PaginatedResult<TItem>> {
    const { findMany, dto, include, select, basePath, extraQuery } = options;
    const { field, orderBy, snapshotAt } = ctx;

    const take = dto.limit + 1;
    const queryWhere = { ...(options.where as any), createdAt: { lte: snapshotAt } };
    const queryArgs: any = {
      where: queryWhere,
      orderBy,
      take,
      include,
      select,
    };

    if (decoded && decoded.id !== undefined) {
      queryArgs.cursor = { id: decoded.id };
      queryArgs.skip = 1;
    }

    const isFirstPage = !decoded || decoded.id === undefined;

    const [itemsRaw, totalItems] = await Promise.all([
      findMany(queryArgs),
      isFirstPage
        ? this.getCachedCount(options.count, queryWhere, basePath)
        : Promise.resolve(undefined),
    ]);

    const hasNext = itemsRaw.length > dto.limit;
    const items = hasNext ? itemsRaw.slice(0, dto.limit) : itemsRaw;

    let nextCursor: string | null = null;
    if (hasNext && items.length > 0) {
      const lastItem = items[items.length - 1] as any;
      nextCursor = this.signCursor({
        [field]: lastItem[field],
        id: lastItem.id,
        snapshot_at: snapshotAt,
        v: 1,
      });
    }

    const prevCursor = this.signCursor({
      ...decoded,
      snapshot_at: snapshotAt,
      v: 1,
    });

    const meta = buildPaginationMeta({
      limit: dto.limit,
      totalItems,
      hasNext,
      hasPrev: !isFirstPage,
      nextCursor,
      prevCursor,
    });

    const links = buildPaginationLinks({
      basePath,
      limit: dto.limit,
      nextCursor,
      prevCursor,
      extraQuery: { ...extraQuery, snapshot_at: snapshotAt },
    });

    return { items, meta, links, data: items };
  }

  private async paginateOffset<TItem = any>(
    options: PaginationOptions<TItem>,
    ctx: { field: string; order: 'asc' | 'desc'; orderBy: any[]; snapshotAt: string },
  ): Promise<PaginatedResult<TItem>> {
    const { findMany, count, dto, include, select, basePath, extraQuery } = options;
    const { field, orderBy, snapshotAt } = ctx;

    const where = { ...(options.where as any), createdAt: { lte: snapshotAt } };
    const { skip, take } = buildPagination({ page: dto.page as number, limit: dto.limit });

    const [items, totalItems] = await Promise.all([
      findMany({ where, orderBy, skip, take, include, select }),
      this.getCachedCount(count, where, basePath),
    ]);

    const total = totalItems ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / dto.limit));
    const currentPage = dto.page as number;
    const hasNext = currentPage < totalPages;

    let nextCursor: string | null = null;
    if (hasNext && items.length > 0) {
      const lastItem = items[items.length - 1] as any;
      nextCursor = this.signCursor({
        [field]: lastItem[field],
        id: lastItem.id,
        v: 1,
        snapshot_at: snapshotAt,
      });
    }

    const meta = buildPaginationMeta({
      totalItems: total,
      page: currentPage,
      limit: dto.limit,
      hasNext,
      hasPrev: currentPage > 1,
      nextCursor,
    });

    const links = buildPaginationLinks({
      basePath,
      page: currentPage,
      limit: dto.limit,
      totalPages,
      nextCursor,
      extraQuery: { ...extraQuery, snapshot_at: snapshotAt },
    });

    return { items, meta, links, data: items };
  }

  private async getCachedCount(
    countFn: (args: { where: any }) => Promise<number>,
    where: any,
    basePath: string,
  ): Promise<number> {
    let filtersHash: string;
    try {
      filtersHash = createHash('sha256').update(JSON.stringify(where)).digest('hex');
    } catch {
      filtersHash = createHash('sha256').update(String(basePath)).digest('hex');
    }
    const cacheKey = `pagination:count:${basePath}:${filtersHash}`;

    // Priority: Availability. If cacheManager injection failed, fail open to DB.
    if (!this.cacheManager || typeof this.cacheManager.get !== 'function') {
      return countFn({ where });
    }

    try {
      const cached = await this.cacheManager.get<number>(cacheKey);
      if (cached !== undefined && cached !== null) return Number(cached);
    } catch (e) {
      this.logger.error('Redis count cache read error', e);
    }

    const total = await countFn({ where });

    try {
      this.cacheManager.set(cacheKey, total, COUNT_CACHE_TTL_MS).catch(() => {});
    } catch {}

    return total;
  }

  private resolveSnapshotAt(rawSnapshotAt?: string): string {
    const now = new Date();
    if (!rawSnapshotAt) return now.toISOString();

    const requested = new Date(rawSnapshotAt);
    if (isNaN(requested.getTime())) {
      throw new BadRequestException({ message: 'Invalid snapshot_at ISO string.' });
    }

    if (requested > now) {
      throw new BadRequestException({ message: 'snapshot_at cannot be in the future.' });
    }

    const oldestAllowed = new Date(now.getTime() - SNAPSHOT_MAX_AGE_MS);
    if (requested < oldestAllowed) {
      throw new BadRequestException({ message: 'snapshot_at cannot be more than 24 hours old.' });
    }

    return requested.toISOString();
  }

  private signCursor(payload: Record<string, any>): string {
    const data = JSON.stringify({ ...payload, exp: Date.now() + 86400000 });
    const signature = createHmac('sha256', this.secret).update(data).digest('hex');
    const encodedData = Buffer.from(data).toString('base64url');
    const encodedSig = Buffer.from(signature).toString('base64url');
    return `${encodedData}|${encodedSig}`;
  }

  private verifyAndDecodeCursor(cursor: string): any | null {
    try {
      const pipeIndex = cursor.indexOf('|');
      if (pipeIndex === -1) return null;

      const encodedData = cursor.slice(0, pipeIndex);
      const encodedSig = cursor.slice(pipeIndex + 1);

      if (!encodedData || !encodedSig) return null;

      const data = Buffer.from(encodedData, 'base64url').toString('utf-8');
      const signature = Buffer.from(encodedSig, 'base64url').toString('utf-8');

      const expectedSignature = createHmac('sha256', this.secret).update(data).digest('hex');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length) return null;

      if (!timingSafeEqual(sigBuf, expBuf)) return null;

      const payload = JSON.parse(data);
      if (payload.exp < Date.now()) return null;

      return payload;
    } catch {
      return null;
    }
  }
}
