/**
 * Query Client Configuration
 * Cấu hình TanStack Query
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Default query options
 */
const defaultQueryOptions = {
  queries: {
    // Time before data is considered stale
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Time before inactive queries are garbage collected
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    // Retry failed requests
    retry: 1,
    // Refetch on window focus
    refetchOnWindowFocus: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry failed mutations
    retry: 1,
  },
};

/**
 * Create QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

