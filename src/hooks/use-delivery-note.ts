// src/hooks/use-delivery-note.ts
import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { buildFilename, formatDateForFilename } from "@/utils/file-name";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import type {
  DeliveryNoteResponse,
  DeliveryNoteResponsePaginate,
  UpdateDeliveryStatusRequest,
  RecreateDeliveryNoteRequest,
  CreateDeliveryNoteRequest,
  OrderForDeliveryResponse,
  OrderForDeliveryResponsePaginate,
  OrderDetailForDeliveryResponse,
  FailureReasonResponse,
  DeliveryNoteLineResponse,
  UpdateDeliveryLineResultRequest,
  DeliveryNoteStatsResponse,
} from "@/Schema/delivery-note.schema";
import type {
  DeliveryNoteListParams,
  DeliveryNoteFailureReasonsListParams,
  DeliveryNoteStatsParams,
} from "@/Schema";

// ================== GET DELIVERY NOTES ==================
// GET /delivery-notes
export const useDeliveryNotes = (params?: DeliveryNoteListParams) => {
  return useQuery({
    queryKey: ["deliveryNotes", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<DeliveryNoteResponsePaginate>(
        API_SUFFIX.DELIVERY_NOTES,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== GET DELIVERY NOTES STATS ==================
// GET /delivery-notes/stats
export const useDeliveryNoteStats = (params?: DeliveryNoteStatsParams) => {
  return useQuery({
    queryKey: ["deliveryNoteStats", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<DeliveryNoteStatsResponse>(
        API_SUFFIX.DELIVERY_NOTE_STATS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== GET DELIVERY NOTE BY ID ==================
// GET /delivery-notes/{id}
export const useDeliveryNote = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["deliveryNote", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<DeliveryNoteResponse>(
        API_SUFFIX.DELIVERY_NOTE_BY_ID(id as number)
      );
      return res.data;
    },
  });
};

// ================== UPDATE DELIVERY NOTE STATUS ==================
// PUT /delivery-notes/{id}/status
export const useUpdateDeliveryNoteStatus = (
  options?: UseMutationOptions<DeliveryNoteResponse, Error, { id: number; data: UpdateDeliveryStatusRequest }>
) => {
  const queryClient = useQueryClient();

  return useMutation<DeliveryNoteResponse, Error, { id: number; data: UpdateDeliveryStatusRequest }>({
    ...options,
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.put<DeliveryNoteResponse>(
        API_SUFFIX.DELIVERY_NOTE_STATUS(id),
        data
      );
      return res.data;
    },
    onSuccess: (updatedData, variables, context) => {
      const deliveryNoteId = Number(variables.id);
      
      // Update the cache for the specific delivery note immediately
      queryClient.setQueryData(["deliveryNote", deliveryNoteId], updatedData);
      
      // Also invalidate using the number ID and the general lists to be safe
      queryClient.invalidateQueries({ queryKey: ["deliveryNote", deliveryNoteId] });
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      
      if (options?.onSuccess) options.onSuccess(updatedData, variables, context as any);
    },
    onError: (error: Error, variables, context) => {
      if (options?.onError) options.onError(error, variables, context as any);
    },
    onSettled: (data, error, variables, context) => {
      if (options?.onSettled) options.onSettled(data as any, error as any, variables as any, context as any);
    },
  });
};

// ================== UPDATE DELIVERY NOTE GENERAL ==================
// PUT /delivery-notes/{id}
export const useUpdateDeliveryNote = (
  options?: UseMutationOptions<DeliveryNoteResponse, Error, { id: number; data: Partial<DeliveryNoteResponse> }>
) => {
  const queryClient = useQueryClient();

  return useMutation<DeliveryNoteResponse, Error, { id: number; data: Partial<DeliveryNoteResponse> }>({
    ...options,
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.put<DeliveryNoteResponse>(
        API_SUFFIX.DELIVERY_NOTE_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (updatedData, variables, context) => {
      const deliveryNoteId = Number(variables.id);
      queryClient.setQueryData(["deliveryNote", deliveryNoteId], updatedData);
      queryClient.invalidateQueries({ queryKey: ["deliveryNote", deliveryNoteId] });
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      toast.success("Cập nhật phiếu giao hàng thành công");
      if (options?.onSuccess) options.onSuccess(updatedData, variables, context as any);
    },
    onError: (error: Error, variables, context) => {
      toast.error(`Lỗi cập nhật phiếu giao hàng: ${error.message}`);
      if (options?.onError) options.onError(error, variables, context as any);
    },
  });
};

const getCachedDeliveryNote = (queryClient: any, id: number) => {
  let note = queryClient.getQueryData(["deliveryNote", id]);
  if (!note) {
    const queries = queryClient.getQueryCache().findAll({ queryKey: ["deliveryNotes"] });
    for (const query of queries) {
      const data = query.state.data as any;
      if (data?.items && Array.isArray(data.items)) {
        const found = data.items.find((item: any) => item.id === id);
        if (found) {
          note = found;
          break;
        }
      } else if (Array.isArray(data)) {
        const found = data.find((item: any) => item.id === id);
        if (found) {
          note = found;
          break;
        }
      }
    }
  }
  return note;
};

// ================== EXPORT DELIVERY NOTE PDF ==================
// GET /delivery-notes/{id}/export-pdf
export const useExportDeliveryNotePDF = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: number; type?: string }) => {
      const res = await apiRequest.get<Blob>(
        API_SUFFIX.DELIVERY_NOTE_EXPORT_PDF(id),
        {
          params: type ? { type } : undefined,
          responseType: "blob",
        }
      );
      return res.data;
    },
    onSuccess: (blob, variables) => {
      const { id, type } = variables;
      const note = getCachedDeliveryNote(queryClient, id);
      const code = note?.code || `DN${String(id).padStart(5, '0')}`;
      const customer = note?.customerName || note?.order?.customerName || "Khách hàng";
      const date = formatDateForFilename(note?.createdAt || note?.deliveryDate || new Date());
      const typeLabel = type ? (type === "internal" ? "Nội bộ" : "Khách hàng") : "";

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(["Phiếu giao hàng", code, customer, date, typeLabel], "pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Xuất PDF phiếu giao hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== CREATE DELIVERY NOTE ==================
// POST /delivery-notes
export const useCreateDeliveryNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeliveryNoteRequest) => {
      const res = await apiRequest.post<DeliveryNoteResponse>(
        API_SUFFIX.DELIVERY_NOTES,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      toast.success("Tạo phiếu giao hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== RECREATE DELIVERY NOTE ==================
// POST /delivery-notes/recreate
export const useRecreateDeliveryNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecreateDeliveryNoteRequest) => {
      const res = await apiRequest.post<DeliveryNoteResponse>(
        API_SUFFIX.DELIVERY_NOTE_RECREATE,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      toast.success("Tạo lại phiếu giao hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};



// ================== GET FAILURE REASONS ==================
// GET /delivery-notes/failure-reasons
export const useFailureReasons = (
  params?: DeliveryNoteFailureReasonsListParams
) => {
  return useQuery({
    queryKey: ["failureReasons", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<FailureReasonResponse[]>(
        API_SUFFIX.DELIVERY_NOTE_FAILURE_REASONS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== UPDATE DELIVERY LINE RESULT ==================
// PUT /delivery-notes/lines/{lineId}/result
export const useUpdateDeliveryLineResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineId,
      data,
    }: {
      lineId: number;
      data: UpdateDeliveryLineResultRequest;
    }) => {
      const res = await apiRequest.put<DeliveryNoteLineResponse>(
        API_SUFFIX.DELIVERY_NOTE_LINE_RESULT(lineId),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      queryClient.invalidateQueries({ queryKey: ["deliveryNote"] });
      toast.success("Cập nhật kết quả giao hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== GET AVAILABLE ORDERS FOR DELIVERY ==================
// GET /delivery-notes/available-orders
export const useAvailableOrdersForDelivery = (
  params?: { customerId?: number; pageNumber?: number; pageSize?: number },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["availableOrdersForDelivery", params],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const normalizedParams = normalizeParams({
        pageSize: 1000, // Fetch up to 1000 orders to avoid pagination truncating results on matching
        ...(params ?? {}),
      } as Record<string, unknown>);
      const res = await apiRequest.get<OrderForDeliveryResponsePaginate>(
        API_SUFFIX.DELIVERY_NOTE_AVAILABLE_ORDERS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== DELETE DELIVERY NOTE ==================
// DELETE /delivery-notes/{id}
export const useDeleteDeliveryNote = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    ...options,
    mutationFn: async (id) => {
      await apiRequest.delete(API_SUFFIX.DELIVERY_NOTE_BY_ID(id));
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      queryClient.invalidateQueries({ queryKey: ["deliveryNote", variables] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      toast.success("Xóa phiếu giao hàng thành công");
      if (options?.onSuccess) options.onSuccess(data, variables, context);
    },
    onError: (error: any, variables, context) => {
      const message = error.response?.data?.message || error.message || "Xóa phiếu giao hàng thất bại";
      toast.error("Xóa phiếu giao hàng thất bại", { description: message });
      if (options?.onError) options.onError(error, variables, context);
    },
  });
};
