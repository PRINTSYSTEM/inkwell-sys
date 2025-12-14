// src/hooks/invoice.hooks.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import type { InvoiceFileResponse } from "@/Schema/invoice.schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async"; // <- hook async bạn đã có

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

export const invoiceKeys = {
  byOrder: (orderId: number | null) => ["invoice", "order", orderId] as const,
};

// GET /invoices/order/{orderId}
export const useOrderInvoice = (
  orderId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: invoiceKeys.byOrder(orderId),
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<InvoiceFileResponse>(
        API_SUFFIX.ORDER_INVOICE(orderId as number)
      );
      return res.data; // string
    },
    staleTime: 5 * 60 * 1000,
  });
};

// POST /invoices/order/{orderId}
// -> dùng khi bấm "Xuất hoá đơn"
export const useGenerateOrderInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    InvoiceFileResponse,
    [number]
  >(async (orderId: number) => {
    const res = await apiRequest.post<InvoiceFileResponse>(
      API_SUFFIX.ORDER_INVOICE(orderId)
    );
    return res.data; // string
  });

  const mutate = async (orderId: number) => {
    try {
      const result = await execute(orderId);

      // refresh lại GET /invoices/order/{orderId}
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byOrder(orderId),
      });

      toast({
        title: "Thành công",
        description: "Đã tạo/cập nhật hoá đơn cho đơn hàng",
      });

      // tuỳ BE trả gì:
      // - nếu là URL: có thể window.open(result, "_blank")
      // - nếu là mã hoá đơn: hiển thị trong UI
      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo hoá đơn";

      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });

      throw err;
    }
  };

  return {
    data, // string | null (invoice result)
    loading, // trạng thái đang gọi API
    error, // message lỗi (string | null)
    mutate, // (orderId: number) => Promise<string>
    reset, // reset state về null
  };
};
