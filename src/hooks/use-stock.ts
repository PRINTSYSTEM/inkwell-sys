import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import type {
  CreateStockInRequest,
  CreateStockInFromVendorRequest,
  CreateStockInFromProductionRequest,
  CreateStockInFromDeliveryReturnRequest,
  UpdateStockInRequest,
  CreateStockOutRequest,
  CreateStockOutForProductionRequest,
  CreateStockOutForDeliveryRequest,
  ProcessDeliveryReturnRequest,
  UpdateStockOutRequest,
} from "@/Schema/stock.schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type {
  StockInListParams,
  StockOutListParams,
  StockInSummaryParams,
  StockOutSummaryParams,
} from "@/Schema";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
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

export const useCreateStockInFromVendor = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { id: number },
    ApiError,
    CreateStockInFromVendorRequest
  >({
    mutationFn: async (data: CreateStockInFromVendorRequest) => {
      const response = await apiRequest.post<{ id: number }>(
        API_SUFFIX.STOCK_IN_FROM_VENDOR,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Tạo phiếu nhập kho từ nhà cung cấp thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCreateStockInFromProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockInFromProductionRequest) => {
      await apiRequest.post(API_SUFFIX.STOCK_IN_FROM_PRODUCTION, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Tạo phiếu nhập kho từ sản xuất thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCreateStockInFromDeliveryReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockInFromDeliveryReturnRequest) => {
      await apiRequest.post(API_SUFFIX.STOCK_IN_FROM_DELIVERY_RETURN, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Tạo phiếu nhập kho từ trả hàng thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu nhập kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCreateStockInFromCut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { materialCutId: number; notes?: string }) => {
      await apiRequest.post(API_SUFFIX.STOCK_IN_FROM_CUT, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Tạo phiếu nhập kho từ phiếu cắt thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu nhập kho từ phiếu cắt thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useStockInsByDeliveryNote = (
  deliveryNoteId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [...stockInKeys.all, "by-delivery-note", deliveryNoteId],
    queryFn: async () => {
      const response = await apiRequest.get(
        API_SUFFIX.STOCK_IN_BY_DELIVERY_NOTE(deliveryNoteId!)
      );
      return response.data;
    },
    enabled: enabled && deliveryNoteId !== null,
  });
};

export const useStockInsByProductionOrder = (
  productionOrderId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [...stockInKeys.all, "by-production-order", productionOrderId],
    queryFn: async () => {
      const response = await apiRequest.get(
        API_SUFFIX.STOCK_IN_BY_PRODUCTION_ORDER(productionOrderId!)
      );
      return response.data;
    },
    enabled: enabled && productionOrderId !== null,
  });
};

export const useStockInsByVendor = (
  vendorId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [...stockInKeys.all, "by-vendor", vendorId],
    queryFn: async () => {
      const response = await apiRequest.get(
        API_SUFFIX.STOCK_IN_BY_VENDOR(vendorId!)
      );
      return response.data;
    },
    enabled: enabled && vendorId !== null,
  });
};

export const useStockInSummary = (params?: StockInSummaryParams) => {
  return useQuery({
    queryKey: [...stockInKeys.all, "summary", normalizeParams(params || {})],
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.STOCK_IN_SUMMARY, {
        params: normalizeParams(params || {}),
      });
      return response.data;
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

export const useCreateStockOutForProduction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { id: number },
    ApiError,
    CreateStockOutForProductionRequest
  >({
    mutationFn: async (data: CreateStockOutForProductionRequest) => {
      const response = await apiRequest.post<{ id: number }>(
        API_SUFFIX.STOCK_OUT_FOR_PRODUCTION,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      toast.success("Tạo phiếu xuất kho cho sản xuất thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCreateStockOutForDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { id: number },
    ApiError,
    CreateStockOutForDeliveryRequest
  >({
    mutationFn: async (data: CreateStockOutForDeliveryRequest) => {
      const response = await apiRequest.post<{ id: number }>(
        API_SUFFIX.STOCK_OUT_FOR_DELIVERY,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      toast.success("Tạo phiếu xuất kho cho giao hàng thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu xuất kho thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useProcessDeliveryReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProcessDeliveryReturnRequest) => {
      await apiRequest.post(API_SUFFIX.STOCK_OUT_PROCESS_RETURN, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOutKeys.all });
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Xử lý trả hàng thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Xử lý trả hàng thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ========== MATERIAL CUTS ==========

const materialCutKeys = {
  all: ["material-cuts"] as const,
  lists: () => [...materialCutKeys.all, "list"] as const,
  list: (params?: any) =>
    [...materialCutKeys.lists(), normalizeParams(params || {})] as const,
  details: () => [...materialCutKeys.all, "detail"] as const,
  detail: (id: number) => [...materialCutKeys.details(), id] as const,
};

export const useMaterialCuts = (params?: any) => {
  return useQuery({
    queryKey: materialCutKeys.list(params),
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.MATERIAL_CUTS, {
        params: normalizeParams(params || {}),
      });
      return response.data;
    },
  });
};

export const useMaterialCut = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: materialCutKeys.detail(id!),
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.MATERIAL_CUT_BY_ID(id!));
      return response.data;
    },
    enabled: enabled && id !== null,
  });
};

export const useCreateMaterialCut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest.post(API_SUFFIX.MATERIAL_CUTS, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialCutKeys.all });
      toast.success("Tạo phiếu cắt nguyên liệu thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo phiếu cắt thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCompleteMaterialCut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // 1. Complete the material cut
      await apiRequest.post(API_SUFFIX.MATERIAL_CUT_COMPLETE(id));
      
      // 2. Generate stock-in record from cut for audit/tracking
      try {
        await apiRequest.post(API_SUFFIX.STOCK_IN_FROM_CUT, {
          materialCutId: id,
          notes: `Nhập kho tự động từ phiếu cắt #${id}`,
        });
      } catch (err) {
        console.error("Graceful error: Failed to log stock-in from completed cut:", err);
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: materialCutKeys.all });
      queryClient.invalidateQueries({ queryKey: materialCutKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: stockInKeys.all });
      toast.success("Hoàn thành phiếu cắt nguyên liệu thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hoàn thành phiếu cắt nguyên liệu thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useCancelMaterialCut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.post(API_SUFFIX.MATERIAL_CUT_CANCEL(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: materialCutKeys.all });
      queryClient.invalidateQueries({ queryKey: materialCutKeys.detail(id) });
      toast.success("Hủy phiếu cắt nguyên liệu thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hủy phiếu cắt nguyên liệu thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};


export const useStockOutsByDeliveryNote = (
  deliveryNoteId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [...stockOutKeys.all, "by-delivery-note", deliveryNoteId],
    queryFn: async () => {
      const response = await apiRequest.get(
        API_SUFFIX.STOCK_OUT_BY_DELIVERY_NOTE(deliveryNoteId!)
      );
      return response.data;
    },
    enabled: enabled && deliveryNoteId !== null,
  });
};

export const useStockOutsByProductionOrder = (
  productionOrderId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [...stockOutKeys.all, "by-production-order", productionOrderId],
    queryFn: async () => {
      const response = await apiRequest.get(
        API_SUFFIX.STOCK_OUT_BY_PRODUCTION_ORDER(productionOrderId!)
      );
      return response.data;
    },
    enabled: enabled && productionOrderId !== null,
  });
};

export const useReturnableStockOutsByDeliveryNote = (
  deliveryNoteId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      ...stockOutKeys.all,
      "returnable",
      "by-delivery-note",
      deliveryNoteId,
    ],
    queryFn: async () => {
      const response = await apiRequest.get(
        API_SUFFIX.STOCK_OUT_RETURNABLE_BY_DELIVERY_NOTE(deliveryNoteId!)
      );
      return response.data;
    },
    enabled: enabled && deliveryNoteId !== null,
  });
};

export const useStockOutSummary = (params?: StockOutSummaryParams) => {
  return useQuery({
    queryKey: [...stockOutKeys.all, "summary", normalizeParams(params || {})],
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.STOCK_OUT_SUMMARY, {
        params: normalizeParams(params || {}),
      });
      return response.data;
    },
  });
};
