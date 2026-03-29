import { useQuery } from '@tanstack/react-query';
import { OrderService } from '../services/OrderService';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => OrderService.getOrders(),
  });
};

export const useOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => OrderService.getOrderDetail(id),
    enabled: !!id,
  });
};
