import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Generic hook to sync filter state with URL search parameters.
 * Supports strings, numbers, and booleans.
 */
export function useUrlFilters<T extends Record<string, any>>(initialFilters: T) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Parse filters from URL
    const filters = useMemo(() => {
        const currentParams = Object.fromEntries(searchParams.entries());
        const merged = { ...initialFilters };

        Object.keys(initialFilters).forEach((key) => {
            const val = currentParams[key];
            if (val !== undefined && val !== '') {
                // Type casting based on initial value
                const type = typeof initialFilters[key];
                if (type === 'number') {
                    merged[key as keyof T] = Number(val) as any;
                } else if (type === 'boolean') {
                    merged[key as keyof T] = (val === 'true') as any;
                } else {
                    merged[key as keyof T] = val as any;
                }
            }
        });

        return merged;
    }, [searchParams, initialFilters]);

    // Update filters and URL
    const setFilters = useCallback(
        (newFilters: Partial<T> | ((prev: T) => T)) => {
            setSearchParams((prev) => {
                const nextFilters = typeof newFilters === 'function' ? newFilters(filters) : { ...filters, ...newFilters };
                const nextParams = new URLSearchParams(prev);

                Object.keys(nextFilters).forEach((key) => {
                    const value = nextFilters[key];
                    // Don't sync undefined, null, or empty string (unless it's initial)
                    if (value === undefined || value === null || value === '') {
                        nextParams.delete(key);
                    } else {
                        nextParams.set(key, String(value));
                    }
                });

                return nextParams;
            }, { replace: true });
        },
        [setSearchParams, filters]
    );

    return [filters, setFilters] as const;
}
