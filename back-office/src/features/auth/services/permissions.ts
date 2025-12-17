import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/apiClient';
import { useAuthStore } from '../hooks/useAuthStore';
import { useEffect } from 'react';

export function useGetPermissions() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setPermissions = useAuthStore((state) => state.setPermissions);

    const query = useQuery({
        queryKey: ['auth', 'permissions'], // Add to query-keys.ts later if needed
        queryFn: async () => {
            // Call GET /auth/permissions (standard endpoint)
            const response = await apiGet<string[]>('/api/auth/permissions');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 min
    });

    // Auto-sync to store
    useEffect(() => {
        if (query.data) {
            setPermissions(query.data);
        }
    }, [query.data, setPermissions]);

    return query;
}
