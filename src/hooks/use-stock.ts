import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import type {
  CreateStockInRequest,
  UpdateStockInRequest,
  CreateStockOutRequest,
  UpdateStockOutRequest,
} from "@/Schema/stock.schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

// StockIn list params
export type StockInListParams = {
  pageNumber?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  search?: string;
};

// StockOut list params
export type StockOutListParams = {
  pageNumber?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  search?: string;
};

// ========== STOCK IN ==========

const stockInKeys = {
  all: ["stock-ins"] as const,
  lists: () => [...stockInKeys.all, "list"] as const,
  list: (params?: StockInListParams) =>
    [...stockInKeys.lists(), normalizeParams(params || {})] as const,
  details: () => [...stockInKeys.all, "detail"] as const,
  detail: (id: number) => [...stockInKeys.details(), id] as const,
};

export const useStockIns = (params?: StockInListParams) => {
  return useQuery({
    queryKey: stockInKeys.list(params),
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.STOCK_INS, {
        params: normalizeParams(params || {}),
      });
      return response.data;
    },
  });
};

export const useStockIn = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: stockInKeys.detail(id!),
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.STOCK_IN_BY_ID(id!));
      return response.data;
    },
    enabled: enabled && id !== null,
  });
};

export const useCreateStockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockInRequest) => {
      await apiRequest.post(API_SUFFIX.STOCK_INS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Tạo phiếu nhập kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useUpdateStockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateStockInRequest;
    }) => {
      await apiRequest.put(API_SUFFIX.STOCK_IN_BY_ID(id), data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      queryClient.invalidateQueries({ queryKey: stockInKeys.detail(id) });
      toast.success("Cập nhật phiếu nhập kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Cập nhật phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useDeleteStockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.STOCK_IN_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Xóa phiếu nhập kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Xóa phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCompleteStockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.post(API_SUFFIX.STOCK_IN_COMPLETE(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      queryClient.invalidateQueries({ queryKey: stockInKeys.detail(id) });
      toast.success("Hoàn thành phiếu nhập kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hoàn thành phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCancelStockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.post(API_SUFFIX.STOCK_IN_CANCEL(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      queryClient.invalidateQueries({ queryKey: stockInKeys.detail(id) });
      toast.success("Hủy phiếu nhập kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hủy phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ========== STOCK OUT ==========

const stockOutKeys = {
  all: ["stock-outs"] as const,
  lists: () => [...stockOutKeys.all, "list"] as const,
  list: (params?: StockOutListParams) =>
    [...stockOutKeys.lists(), normalizeParams(params || {})] as const,
  details: () => [...stockOutKeys.all, "detail"] as const,
  detail: (id: number) => [...stockOutKeys.details(), id] as const,
};

export const useStockOuts = (params?: StockOutListParams) => {
  return useQuery({
    queryKey: stockOutKeys.list(params),
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.STOCK_OUTS, {
        params: normalizeParams(params || {}),
      });
      return response.data;
    },
  });
};

export const useStockOut = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: stockOutKeys.detail(id!),
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.STOCK_OUT_BY_ID(id!));
      return response.data;
    },
    enabled: enabled && id !== null,
  });
};

export const useCreateStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockOutRequest) => {
      await apiRequest.post(API_SUFFIX.STOCK_OUTS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      toast.success("Tạo phiếu xuất kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useUpdateStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateStockOutRequest;
    }) => {
      await apiRequest.put(API_SUFFIX.STOCK_OUT_BY_ID(id), data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(id) });
      toast.success("Cập nhật phiếu xuất kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Cập nhật phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useDeleteStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.STOCK_OUT_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      toast.success("Xóa phiếu xuất kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Xóa phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCompleteStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.post(API_SUFFIX.STOCK_OUT_COMPLETE(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(id) });
      toast.success("Hoàn thành phiếu xuất kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hoàn thành phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCancelStockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.post(API_SUFFIX.STOCK_OUT_CANCEL(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      queryClient.invalidateQueries({ queryKey: stockOutKeys.detail(id) });
      toast.success("Hủy phiếu xuất kho thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hủy phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};


