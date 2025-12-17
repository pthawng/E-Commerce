export type FilterOperator = 'equals' | 'contains' | 'in' | 'gt' | 'lt' | 'gte' | 'lte' | 'range';

export interface FilterFieldConfig {
    field?: string; // Override db field name if different from filter key
    operator?: FilterOperator;
    mode?: 'insensitive' | 'default'; // For string comparisons
    transform?: (value: any) => any; // Transform input value (e.g. Number(val))
}

export interface SearchConfig {
    searchableFields?: string[]; // Fields to apply generic 'search' to (OR condition)
    filterConfig?: Record<string, FilterFieldConfig>; // Configuration for specific filters
}

export class QueryBuilder {
    /**
     * Build Prisma WhereInput from search string and filters
     */
    static build(
        dto: { search?: string; filters?: Record<string, any> },
        config: SearchConfig,
    ): Record<string, any> {
        const conditions: any[] = [];

        // 1. Generic Search (OR condition across multiple fields)
        if (dto.search && config.searchableFields && config.searchableFields.length > 0) {
            const searchConditions = config.searchableFields.map((field) => ({
                [field]: { contains: dto.search, mode: 'insensitive' },
            }));
            conditions.push({ OR: searchConditions });
        }

        // 2. Specific Filters (AND conditions)
        if (dto.filters && config.filterConfig) {
            Object.entries(dto.filters).forEach(([key, value]) => {
                // Skip undefined/null/empty strings if needed, but usually we respect what FE sends
                if (value === undefined || value === null || value === '') return;

                const conf = config.filterConfig?.[key];
                if (!conf) return; // Skip undefined filters for security (allow-list approach)

                const field = conf.field || key;
                const finalValue = conf.transform ? conf.transform(value) : value;
                const mode = conf.mode || 'default';

                switch (conf.operator) {
                    case 'contains':
                        conditions.push({
                            [field]: { contains: finalValue, mode: mode === 'default' ? undefined : mode },
                        });
                        break;
                    case 'in':
                        // Ensure array
                        const arrValue = Array.isArray(finalValue)
                            ? finalValue
                            : typeof finalValue === 'string'
                                ? finalValue.split(',') // Basic CSV support
                                : [finalValue];
                        conditions.push({ [field]: { in: arrValue } });
                        break;
                    case 'gt':
                    case 'lt':
                    case 'gte':
                    case 'lte':
                        conditions.push({ [field]: { [conf.operator]: finalValue } });
                        break;
                    case 'range':
                        // Expects [min, max] or { min, max }
                        // If value is array [min, max]
                        if (Array.isArray(finalValue) && finalValue.length === 2) {
                            conditions.push({
                                [field]: { gte: finalValue[0], lte: finalValue[1] }
                            });
                        }
                        break;
                    case 'equals':
                    default:
                        conditions.push({ [field]: finalValue });
                        break;
                }
            });
        }

        // 3. Return generic AND if we have conditions, otherwise empty object
        if (conditions.length > 0) {
            return { AND: conditions };
        }

        return {};
    }
}
