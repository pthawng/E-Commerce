import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { paymentsApi, type PaymentStatus, type RefundPaymentDto, type ConfirmCODDto } from '../api/payments.api';
import { message } from 'antd';

/**
 * Fetch payment status for an order
 */
export const usePaymentStatus = (
    orderId: string,
    options?: Omit<UseQueryOptions<PaymentStatus>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['payments', 'status', orderId],
        queryFn: async () => {
            const response = await paymentsApi.getPaymentStatus(orderId);
            return response.data!;
        },
        enabled: !!orderId,
        ...options,
    });
};

/**
 * Refund payment mutation
 */
export const useRefundPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, data }: { orderId: string; data: RefundPaymentDto }) => {
            const response = await paymentsApi.refundPayment(orderId, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate payment status
            queryClient.invalidateQueries({ queryKey: ['payments', 'status', variables.orderId] });
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            message.success('Refund processed successfully');
        },
        onError: (error: any) => {
            message.error(error.message || 'Failed to process refund');
        },
    });
};

/**
 * Confirm COD payment mutation
 */
export const useConfirmCOD = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ConfirmCODDto) => {
            const response = await paymentsApi.confirmCOD(data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate payment status
            queryClient.invalidateQueries({ queryKey: ['payments', 'status', variables.orderId] });
            // Invalidate orders
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            message.success('COD payment confirmed successfully');
        },
        onError: (error: any) => {
            message.error(error.message || 'Failed to confirm COD payment');
        },
    });
};
