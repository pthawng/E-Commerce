import { BadRequestException, Injectable } from '@nestjs/common';

export interface QueryCostOptions {
  limit: number;
  includeCount: number;
  filterComplexity: number;
}

@Injectable()
export class QueryCostService {
  private readonly MAX_COST = 500; // Staff+ threshold

  /**
   * Calculate query cost based on limit, joins (includes), and filter density.
   */
  calculateCost(options: QueryCostOptions): number {
    const { limit, includeCount, filterComplexity } = options;

    // cost = limit * (1 + joins * 1.5) + complexity_overhead
    const baseCost = limit * (1 + includeCount * 1.5);
    const totalCost = baseCost + filterComplexity * 10;

    return Math.floor(totalCost);
  }

  /**
   * Enforce cost limits. Rejects if cost exceeds threshold.
   */
  validate(options: QueryCostOptions) {
    const cost = this.calculateCost(options);
    if (cost > this.MAX_COST) {
      throw new BadRequestException({
        code: 'QUERY_TOO_COMPLEX',
        message: `Your query complexity (${cost}) exceeds the maximum allowed (${this.MAX_COST}). Reduce limit or filters.`,
        details: { cost, max: this.MAX_COST },
      });
    }
    return cost;
  }
}
