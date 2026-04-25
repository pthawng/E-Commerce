import { useQuery } from '@tanstack/react-query';
import api from '../../api/apiInstance';

interface ExchangeRatesResponse {
    base: string;
    rates: Record<string, number>;
    timestamp: string;
}

/**
 * Fetch real-time exchange rates from the backend
 */
export const useExchangeRates = () => {
    return useQuery<ExchangeRatesResponse>({
        queryKey: ['exchange-rates'],
        queryFn: async () => {
            const { data } = await api.get<ExchangeRatesResponse>('/system/currency/rates');
            return data;
        },
        staleTime: 12 * 60 * 60 * 1000, // 12 hours matching BE cache
        gcTime: 24 * 60 * 60 * 1000,
    });
};
