// src/hooks/use-delivery-note.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
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
  FailureReasonResponse,
  DeliveryNoteLineResponse,
  UpdateDeliveryLineResultRequest,
} from "@/Schema/delivery-note.schema";

// ================== GET DELIVERY NOTES ==================
// GET /delivery-notes
export interface DeliveryNotesParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}

export const useDeliveryNotes = (params?: DeliveryNotesParams) => {
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
export const useUpdateDeliveryNoteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateDeliveryStatusRequest;
    }) => {
      const res = await apiRequest.put<DeliveryNoteResponse>(
        API_SUFFIX.DELIVERY_NOTE_STATUS(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryNote", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["deliveryNotes"] });
      toast.success("Cập nhật trạng thái phiếu giao hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== EXPORT DELIVERY NOTE PDF ==================
// GET /delivery-notes/{id}/export-pdf
export const useExportDeliveryNotePDF = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.get<Blob>(
        API_SUFFIX.DELIVERY_NOTE_EXPORT_PDF(id),
        {
          responseType: "blob",
        }
      );
      return res.data;
    },
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `delivery-note-${id}.pdf`;
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

// ================== GET AVAILABLE ORDERS FOR DELIVERY ==================
// GET /delivery-notes/available-orders
export interface AvailableOrdersForDeliveryParams {
  customerId?: number;
}

export const useAvailableOrdersForDelivery = (
  params?: AvailableOrdersForDeliveryParams
) => {
  return useQuery({
    queryKey: ["availableOrdersForDelivery", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderForDeliveryResponse[]>(
        API_SUFFIX.DELIVERY_NOTE_AVAILABLE_ORDERS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== GET FAILURE REASONS ==================
// GET /delivery-notes/failure-reasons
export interface FailureReasonsParams {
  allowRedeliveryOnly?: boolean;
}

export const useFailureReasons = (params?: FailureReasonsParams) => {
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

