import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import type {
  PrintOrderResponsePaginate,
  PrintOrderCountsResponse,
  DispatchPrintOrdersRequest,
  EnqueuePrintOrdersRequest,
  PausePrintOrderRequest,
  CompletePrintOrderRequest,
  ReturnPrintOrderRequest,
  ReorderPrintOrdersRequest,
  ReturnToProofingRequest,
  PrintOrderHistoryItem,
  PrintOrderListParams,
  DispatchCandidateSummaryResponse,
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
  candidatesSummary: (params?: PrintOrderListParams) =>
    [...printOrderKeys.all, "dispatch-candidates-summary", normalizeParams((params ?? {}) as unknown as Record<string, unknown>)] as const,
  counts: () => [...printOrderKeys.all, "counts"] as const,
  history: (id: number) => [...printOrderKeys.all, "history", id] as const,
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

// 1.1. Get dispatch candidates summary (Thống kê tổng quan & đếm loại bài)
export const useDispatchCandidatesSummary = (params?: PrintOrderListParams) => {
  // Omit designTypeId from summary query params per Backend spec
  const { designTypeId, pageNumber, pageSize, ...summaryParams } = params || {};
  return useQuery<DispatchCandidateSummaryResponse>({
    queryKey: printOrderKeys.candidatesSummary(summaryParams),
    queryFn: async () => {
      const res = await apiRequest.get<DispatchCandidateSummaryResponse>(
        API_SUFFIX.PRINT_ORDER_DISPATCH_CANDIDATES_SUMMARY,
        {
          params: normalizeParams(summaryParams as Record<string, unknown>),
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
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_START(id), {});
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

// 5.1. Enqueue print orders (Thêm vào hàng chờ)
export const useEnqueuePrintOrders = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, EnqueuePrintOrdersRequest>({
    mutationFn: async (data: EnqueuePrintOrdersRequest) => {
      const res = await apiRequest.post(API_SUFFIX.PRINT_ORDER_ENQUEUE, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      toast.success("Đã thêm vào hàng chờ thành công!");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Thêm vào hàng chờ thất bại";
      toast.error(errMsg);
    },
  });
};

// 5.2. Dequeue print order (Bỏ khỏi hàng chờ)
export const useDequeuePrintOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: async (id: number) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_DEQUEUE(id), {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      toast.success("Đã bỏ khỏi hàng chờ!");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Bỏ khỏi hàng chờ thất bại";
      toast.error(errMsg);
    },
  });
};

// 5.3. Pause print order (Tạm dừng in)
export const usePausePrintOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: number; data: PausePrintOrderRequest }>({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_PAUSE(id), data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Đã tạm dừng lệnh in!");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Tạm dừng in thất bại";
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
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_COMPLETE(id), data ?? {});
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

// 7. Return print order to Dispatch (Trả về điều lệnh từ Màn thợ in)
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
      toast.success("Đã trả về bài cho bộ phận Điều lệnh");
    },
    onError: (error: ApiError) => {
      const errMsg = error.response?.data?.message || error.message || "Trả về lệnh in thất bại";
      toast.error(errMsg);
    },
  });
};

// 8. Confirm Paper Ready (Xác nhận đủ giấy)
export const useConfirmPaperReady = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { id: number; isPaperReady: boolean }
  >({
    mutationFn: async ({ id, isPaperReady }) => {
      const res = await apiRequest.put(
        API_SUFFIX.PRINT_ORDER_CONFIRM_PAPER(id),
        { isPaperReady }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật trạng thái giấy";
      toast.error(errMsg);
    },
  });
};

// 9. Confirm Flute Ready (Xác nhận đủ sóng E)
export const useConfirmFluteReady = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { id: number; isFluteReady: boolean }
  >({
    mutationFn: async ({ id, isFluteReady }) => {
      const res = await apiRequest.put(
        API_SUFFIX.PRINT_ORDER_CONFIRM_FLUTE(id),
        { isFluteReady }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật trạng thái sóng E";
      toast.error(errMsg);
    },
  });
};

// 10. Reorder Print Orders (Sắp xếp thứ tự hàng đợi kéo thả)
export const useReorderPrintOrders = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ReorderPrintOrdersRequest>({
    mutationFn: async (data: ReorderPrintOrdersRequest) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_REORDER, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      toast.success("Cập nhật thứ tự hàng đợi thành công!");
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể sắp xếp lại hàng đợi";
      toast.error(errMsg);
    },
  });
};

// 11. Return candidate to Proofing (Trả về bình bài từ Màn điều lệnh)
export const useReturnToProofing = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { id: number; data: ReturnToProofingRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.put(
        API_SUFFIX.PRINT_ORDER_RETURN_TO_PROOFING(id),
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Đã trả về bài cho bộ phận Bình bài!");
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể trả về bình bài";
      toast.error(errMsg);
    },
  });
};

// 12. Undo Dispatch Print Order (Hủy điều lệnh)
export const useUndoDispatchPrintOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: async (id: number) => {
      const res = await apiRequest.put(API_SUFFIX.PRINT_ORDER_UNDO_DISPATCH(id), {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dispatchCandidates"] });
      queryClient.invalidateQueries({ queryKey: ["dispatchCandidatesSummary"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Đã hủy điều lệnh thành công, bài đã quay lại danh sách chờ điều lệnh!");
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể hủy điều lệnh";
      toast.error(errMsg);
    },
  });
};

// 13. Get Print Order History (Lịch sử sản xuất)
export const usePrintOrderHistory = (id?: number | null) => {
  return useQuery<PrintOrderHistoryItem[]>({
    queryKey: printOrderKeys.history(id || 0),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const res = await apiRequest.get<PrintOrderHistoryItem[]>(
        API_SUFFIX.PRINT_ORDER_HISTORY(id)
      );
      return res.data;
    },
  });
};
