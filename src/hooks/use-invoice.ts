// src/hooks/use-invoice.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import type {
  InvoiceResponse,
  InvoiceResponsePaginate,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
} from "@/Schema/invoice.schema";

// ================== GET INVOICES ==================
// GET /invoices
export interface InvoicesParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export const useInvoices = (params?: InvoicesParams) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      // API returns InvoiceResponsePaginate
      const res = await apiRequest.get<InvoiceResponsePaginate>(
        API_SUFFIX.INVOICES,
        {
          params: normalizedParams,
        }
      );
      return res.data;
    },
  });
};

// ================== GET INVOICE BY ID ==================
// GET /invoices/{id}
export const useInvoice = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["invoice", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<InvoiceResponse>(
        API_SUFFIX.INVOICE_BY_ID(id as number)
      );
      return res.data;
    },
  });
};

// ================== GET INVOICES BY ORDER ==================
// GET /invoices/by-order/{orderId}
export interface InvoicesByOrderParams {
  pageNumber?: number;
  pageSize?: number;
}

export const useInvoicesByOrder = (
  orderId: number | null,
  params?: InvoicesByOrderParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["invoices", "by-order", orderId, params],
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      // API returns InvoiceResponsePaginate
      const res = await apiRequest.get<InvoiceResponsePaginate>(
        API_SUFFIX.INVOICES_BY_ORDER(orderId as number),
        {
          params: normalizedParams,
        }
      );
      return res.data;
    },
  });
};

// ================== CREATE INVOICE ==================
// POST /invoices
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const res = await apiRequest.post<InvoiceResponse>(
        API_SUFFIX.INVOICES,
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data.orders?.[0]?.orderId) {
        queryClient.invalidateQueries({
          queryKey: ["invoices", "by-order", data.orders[0].orderId],
        });
      }
      toast.success("Tạo hóa đơn thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== UPDATE INVOICE ==================
// PUT /invoices/{id}
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateInvoiceRequest;
    }) => {
      const res = await apiRequest.put<InvoiceResponse>(
        API_SUFFIX.INVOICE_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data.orders?.[0]?.orderId) {
        queryClient.invalidateQueries({
          queryKey: ["invoices", "by-order", data.orders[0].orderId],
        });
      }
      toast.success("Cập nhật hóa đơn thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== EXPORT INVOICE ==================
// GET /invoices/{id}/export-sinvoice
export const useExportInvoice = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.get<Blob>(API_SUFFIX.INVOICE_EXPORT(id), {
        responseType: "blob",
      });
      return res.data;
    },
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Xuất hóa đơn thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== GET INVOICE BY ORDER (Legacy) ==================
// GET /invoices/order/{orderId}
// Returns: string (invoice file URL)
export const useInvoiceByOrder = (
  orderId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["invoice", "by-order", orderId],
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<string>(
        API_SUFFIX.INVOICE_BY_ORDER(orderId as number)
      );
      return res.data;
    },
  });
};

// ================== CREATE INVOICE FROM ORDER (Legacy) ==================
// POST /invoices/order/{orderId}
// Returns: string (invoice file URL)
export const useCreateInvoiceFromOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest.post<string>(
        API_SUFFIX.INVOICE_BY_ORDER(orderId)
      );
      return res.data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({
        queryKey: ["invoice", "by-order", orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "by-order", orderId],
      });
      toast.success("Tạo hóa đơn từ đơn hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== ALIASES FOR COMPATIBILITY ==================
// These are aliases for backward compatibility with existing UI components
export const useOrderInvoice = useInvoiceByOrder;
export const useGenerateOrderInvoice = useCreateInvoiceFromOrder;
