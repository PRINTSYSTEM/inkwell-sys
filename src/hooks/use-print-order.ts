import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import type {
  PrintOrderResponsePaginate,
  PrintOrderCountsResponse,
  DispatchPrintOrdersRequest,
  CompletePrintOrderRequest,
  ReturnPrintOrderRequest,
  PrintOrderListParams,
} from "@/Schema/print-order.schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

export const printOrderKeys = {
  all: ["print-orders"] as const,
  lists: () => [...printOrderKeys.all, "list"] as const,
  list: (params?: PrintOrderListParams) =>
    [...printOrderKeys.lists(), normalizeParams((params ?? {}) as unknown as Record<string, unknown>)] as const,
  candidates: (params?: PrintOrderListParams) =>
    [...printOrderKeys.all, "dispatch-candidates", normalizeParams((params ?? {}) as unknown as Record<string, unknown>)] as const,
  counts: () => [...printOrderKeys.all, "counts"] as const,
};

// 1. Get dispatch candidates (Chưa điều lệnh)
export const useDispatchCandidates = (params?: PrintOrderListParams) => {
  return useQuery<PrintOrderResponsePaginate>({
    queryKey: printOrderKeys.candidates(params),
    queryFn: async () => {
      const res = await apiRequest.get<PrintOrderResponsePaginate>(
        API_SUFFIX.PRINT_ORDER_DISPATCH_CANDIDATES,
        {
          params: normalizeParams((params ?? {}) as Record<string, unknown>),
        }
      );
      return res.data;
    },
  });
};

// 2. Bulk dispatch print orders
export const useDispatchPrintOrders = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DispatchPrintOrdersRequest>({
    mutationFn: async (data: DispatchPrintOrdersRequest) => {
      const res = await apiRequest.post(API_SUFFIX.PRINT_ORDER_DISPATCH, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Điều lệnh sản xuất thành công!");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Điều lệnh thất bại";
      toast.error(errMsg);
    },
  });
};

// 3. Get print orders (MÀN 2)
export const usePrintOrders = (params?: PrintOrderListParams) => {
  return useQuery<PrintOrderResponsePaginate>({
    queryKey: printOrderKeys.list(params),
    queryFn: async () => {
      const res = await apiRequest.get<PrintOrderResponsePaginate>(
        API_SUFFIX.PRINT_ORDERS,
        {
          params: normalizeParams((params ?? {}) as Record<string, unknown>),
        }
      );
      return res.data;
    },
  });
};

// 4. Get counts for tabs ({ waiting, printing, returned, completedToday })
export const usePrintOrderCounts = () => {
  return useQuery<PrintOrderCountsResponse>({
    queryKey: printOrderKeys.counts(),
    queryFn: async () => {
      const res = await apiRequest.get<PrintOrderCountsResponse>(
        API_SUFFIX.PRINT_ORDER_COUNTS
      );
      return res.data;
    },
    refetchInterval: 15000, // Auto refresh counts every 15s
  });
};

// 5. Start print order
export const useStartPrintOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: async (id: number) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_START(id));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Đã bắt đầu in!");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Bắt đầu in thất bại";
      toast.error(errMsg);
    },
  });
};

// 6. Complete print order
export const useCompletePrintOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { id: number; data?: CompletePrintOrderRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_COMPLETE(id), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Hoàn thành lệnh in!");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Hoàn thành in thất bại";
      toast.error(errMsg);
    },
  });
};

// 7. Return print order (Trả về bình bài)
export const useReturnPrintOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { id: number; data: ReturnPrintOrderRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_RETURN(id), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Đã trả về bài cho bộ phận Bình bài");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Trả về lệnh in thất bại";
      toast.error(errMsg);
    },
  });
};
