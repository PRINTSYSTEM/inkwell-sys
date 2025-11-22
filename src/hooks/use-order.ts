import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
  exportOrders,
  uploadOrderExcel,
  type CreateOrderRequest,
  type UpdateOrderRequest,
  type Order,
  type OrdersResponse
} from '@/apis/order.api';

// Query Keys
const QUERY_KEYS = {
  orders: (params?: { pageNumber?: number; pageSize?: number; search?: string; status?: string }) => ['orders', params],
  order: (id: number) => ['order', id],
  stats: () => ['orders', 'stats'],
} as const;

// useOrders Hook
export const useOrders = (params?: {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.orders(params),
    queryFn: () => getOrders(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// useOrder Hook (single order)
export const useOrder = (id: number, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => getOrderById(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// useOrderStats Hook
export const useOrderStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: getOrderStats,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

// useCreateOrder Mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(data),
    onSuccess: (newOrder) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });

      // Optimistically update cache
      queryClient.setQueryData(QUERY_KEYS.order(newOrder.id), newOrder);

      toast({
        title: "Thành công",
        description: `Đã tạo đơn hàng ${newOrder.code} thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    },
  });
};

// useUpdateOrder Mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateOrderRequest) => updateOrder(data),
    onSuccess: (updatedOrder) => {
      // Update specific order in cache
      queryClient.setQueryData(QUERY_KEYS.order(updatedOrder.id), updatedOrder);
      
      // Update order in orders list cache
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (oldData: OrdersResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            ),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });

      toast({
        title: "Thành công",
        description: `Đã cập nhật đơn hàng ${updatedOrder.code} thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật đơn hàng",
        variant: "destructive",
      });
    },
  });
};

// useDeleteOrder Mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.order(deletedId) });
      
      // Update orders list cache
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (oldData: OrdersResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.filter((order) => order.id !== deletedId),
            totalCount: oldData.totalCount - 1,
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });

      toast({
        title: "Thành công",
        description: "Đã xóa đơn hàng thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa đơn hàng",
        variant: "destructive",
      });
    },
  });
};

// useExportOrders Mutation
export const useExportOrders = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params?: {
      customerId?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }) => exportOrders(params),
    onSuccess: (data) => {
      // Open download link
      if (data.fileUrl) {
        window.open(data.fileUrl, '_blank');
      }
      
      toast({
        title: "Thành công",
        description: "Đã xuất danh sách đơn hàng thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xuất danh sách đơn hàng",
        variant: "destructive",
      });
    },
  });
};

// useUploadOrderExcel Mutation
export const useUploadOrderExcel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orderId, file }: { orderId: number; file: File }) =>
      uploadOrderExcel(orderId, file),
    onSuccess: (data, { orderId }) => {
      // Invalidate order to refetch updated data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      
      toast({
        title: "Thành công",
        description: "Đã tải lên file Excel thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lên file Excel",
        variant: "destructive",
      });
    },
  });
};