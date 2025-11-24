import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
  exportOrders,
  uploadOrderExcel,
} from "@/apis/order.api";
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
  OrderQueryParams,
  OrderListResponse, // nếu bạn có type riêng thì import vào
} from "@/Schema";

/* ================== QUERY KEYS ================== */

export const orderKeys = {
  all: ["orders"] as const,

  // list với params (page, filter,...)
  list: (params?: {
    pageNumber?: number;
    pageSize?: number;
    customerId?: number;
    status?: string;
    search?: string;
  }) => [...orderKeys.all, "list", params ?? {}] as const,

  // detail
  detail: (id: number) => [...orderKeys.all, "detail", id] as const,

  // stats
  stats: () => [...orderKeys.all, "stats"] as const,
} as const;

/* ================== QUERIES ================== */

// useOrders Hook
export const useOrders = (params?: {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// useOrder Hook (single order)
export const useOrder = (id: number, enabled = true) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrderById(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// useOrderStats Hook
export const useOrderStats = () => {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: getOrderStats,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

/* ================== MUTATIONS ================== */

// useCreateOrder Mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Order, Error, CreateOrderRequest>({
    mutationFn: (data) => createOrder(data),

    onSuccess: (newOrder) => {
      // Invalidate list + stats
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });

      // Cache detail luôn
      queryClient.setQueryData(orderKeys.detail(newOrder.id), newOrder);

      toast({
        title: "Thành công",
        description: `Đã tạo đơn hàng ${newOrder.code} thành công`,
      });
    },

    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    },
  });
};

type UpdateOrderVariables = {
  id: number;
  data: UpdateOrderRequest;
};

// useUpdateOrder Mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Order, Error, UpdateOrderVariables>({
    mutationFn: ({ id, data }) => updateOrder(id, data),

    onSuccess: (updatedOrder, { id }) => {
      // cập nhật cache chi tiết đơn hàng
      queryClient.setQueryData(orderKeys.detail(id), updatedOrder);

      // invalidate list + stats để dữ liệu đồng bộ
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });

      toast({
        title: "Thành công",
        description: `Đã cập nhật đơn hàng ${updatedOrder.code} thành công`,
      });
    },

    onError: (error) => {
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

  return useMutation<void, Error, number>({
    mutationFn: (id: number) => deleteOrder(id),

    onSuccess: (_, deletedId) => {
      // remove cache detail
      queryClient.removeQueries({ queryKey: orderKeys.detail(deletedId) });

      // Update các cache list đang có
      queryClient.setQueriesData(
        { queryKey: orderKeys.all, type: "active" },
        (oldData: OrderListResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.data.filter((order) => order.id !== deletedId),
            totalCount: oldData.totalCount - 1,
          };
        }
      );

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });

      toast({
        title: "Thành công",
        description: "Đã xóa đơn hàng thành công",
      });
    },

    onError: (error) => {
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

  return useMutation<
    { fileUrl?: string },
    Error,
    | {
        customerId?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
      }
    | undefined
  >({
    mutationFn: (params) => exportOrders(params),

    onSuccess: (data) => {
      if (data.fileUrl) {
        window.open(data.fileUrl, "_blank");
      }

      toast({
        title: "Thành công",
        description: "Đã xuất danh sách đơn hàng thành công",
      });
    },

    onError: (error) => {
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

  return useMutation<unknown, Error, { orderId: number; file: File }>({
    mutationFn: ({ orderId, file }) => uploadOrderExcel(orderId, file),

    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });

      toast({
        title: "Thành công",
        description: "Đã tải lên file Excel thành công",
      });
    },

    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lên file Excel",
        variant: "destructive",
      });
    },
  });
};
