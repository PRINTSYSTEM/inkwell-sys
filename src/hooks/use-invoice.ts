// src/hooks/invoice.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import type { InvoiceResponse } from "@/Schema/invoice.schema";
import { API_SUFFIX } from "@/apis";

export const invoiceKeys = {
  byOrder: (orderId: number | null) => ["invoice", "order", orderId] as const,
};

// GET /api/invoices/order/{orderId}
export const useOrderInvoice = (
  orderId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: invoiceKeys.byOrder(orderId),
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<InvoiceResponse>(
        API_SUFFIX.ORDER_INVOICE(orderId)
      );
      return res.data; // string
    },
    staleTime: 5 * 60 * 1000,
  });
};

// POST /api/invoices/order/{orderId}
// -> thường dùng khi bấm "Xuất hoá đơn"
export const useGenerateOrderInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    // chỉ cần orderId, không có body
    mutationFn: async (orderId: number) => {
      const res = await apiRequest.post<InvoiceResponse>(
        API_SUFFIX.ORDER_INVOICE(orderId)
      );
      return res.data; // string
    },
    onSuccess: (data, orderId) => {
      // refresh lại GET /api/invoices/order/{orderId}
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.byOrder(orderId),
      });

      toast({
        title: "Thành công",
        description: "Đã tạo/cập nhật hoá đơn cho đơn hàng",
      });

      // tuỳ cách BE trả:
      // - nếu data là URL => có thể mở tab:
      //   window.open(data, "_blank");
      // - nếu data là mã/chuỗi => lưu vào UI/clipboard tuỳ ý
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo hoá đơn";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    },
  });
};
