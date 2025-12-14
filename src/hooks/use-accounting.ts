// src/hooks/use-accounting.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import type {
  AccountingResponse,
  ConfirmPaymentRequest,
} from "@/Schema/accounting.schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";

// ===== Query Keys =====

export const accountingKeys = {
  all: ["accounting"] as const,
  byOrder: (orderId: number | null) =>
    ["accounting", "order", orderId] as const,
};

// ===== GET /accountings/order/{orderId} =====
// Lấy thông tin kế toán theo đơn hàng

export const useAccountingByOrder = (
  orderId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: accountingKeys.byOrder(orderId),
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<AccountingResponse>(
        API_SUFFIX.ACCOUNTING_BY_ORDER(orderId as number)
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ===== POST /accountings/order/{orderId} =====
// Tạo bản ghi kế toán cho đơn hàng

export const useCreateAccountingForOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    AccountingResponse,
    [number]
  >(async (orderId: number) => {
    const res = await apiRequest.post<AccountingResponse>(
      API_SUFFIX.ACCOUNTING_BY_ORDER(orderId)
    );
    return res.data;
  });

  const mutate = async (orderId: number) => {
    try {
      const result = await execute(orderId);

      // Refresh lại GET /accountings/order/{orderId}
      queryClient.invalidateQueries({
        queryKey: accountingKeys.byOrder(orderId),
      });

      // Invalidate orders list (để cập nhật trạng thái)
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      toast({
        title: "Thành công",
        description: "Đã tạo bản ghi kế toán cho đơn hàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo bản ghi kế toán";

      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });

      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// ===== POST /accountings/{accountingId}/confirm-payment =====
// Xác nhận thanh toán

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    AccountingResponse,
    [number, ConfirmPaymentRequest]
  >(async (accountingId: number, payload: ConfirmPaymentRequest) => {
    const res = await apiRequest.post<AccountingResponse>(
      API_SUFFIX.ACCOUNTING_CONFIRM_PAYMENT(accountingId),
      payload
    );
    return res.data;
  });

  const mutate = async (
    accountingId: number,
    payload: ConfirmPaymentRequest
  ) => {
    try {
      const result = await execute(accountingId, payload);

      // Invalidate tất cả các query liên quan
      queryClient.invalidateQueries({
        queryKey: accountingKeys.all,
      });

      // Invalidate orders list (để cập nhật trạng thái thanh toán)
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      // Invalidate customers (để cập nhật công nợ)
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });

      toast({
        title: "Thành công",
        description: "Đã xác nhận thanh toán",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xác nhận thanh toán";

      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });

      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};
