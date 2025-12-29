// src/hooks/use-cash.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import { createMockQueryFn } from "@/lib/mock-utils";
import {
  mockCashFundsPaginate,
  mockCashFunds,
  mockCashPaymentsPaginate,
  mockCashPayments,
  mockCashReceiptsPaginate,
  mockCashReceipts,
  mockCashBook,
} from "@/mocks/cash.mock";
import type {
  CashFundResponse,
  CashFundResponseIPaginate,
  CreateCashFundRequest,
  UpdateCashFundRequest,
  CashPaymentResponse,
  CashPaymentResponseIPaginate,
  CreateCashPaymentRequest,
  UpdateCashPaymentRequest,
  CashReceiptResponse,
  CashReceiptResponseIPaginate,
  CreateCashReceiptRequest,
  UpdateCashReceiptRequest,
  CashBookResponse,
} from "@/Schema/accounting.schema";

// ================== CASH FUND ==================

export interface CashFundsParams {
  pageNumber?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}

export const useCashFunds = (params?: CashFundsParams) => {
  return useQuery({
    queryKey: ["cash-funds", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<CashFundResponseIPaginate>(
          API_SUFFIX.CASH_FUNDS,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockCashFundsPaginate
    ),
  });
};

export const useCashFund = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["cash-fund", id],
    enabled: enabled && !!id,
    queryFn: createMockQueryFn(
      async () => {
        const res = await apiRequest.get<CashFundResponse>(
          API_SUFFIX.CASH_FUND_BY_ID(id as number)
        );
        return res.data;
      },
      mockCashFunds.find((f) => f.id === id) || mockCashFunds[0]
    ),
  });
};

export const useCreateCashFund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCashFundRequest) => {
      const res = await apiRequest.post<CashFundResponse>(
        API_SUFFIX.CASH_FUNDS,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-funds"] });
      toast.success("Tạo quỹ tiền mặt thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdateCashFund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateCashFundRequest;
    }) => {
      const res = await apiRequest.put<CashFundResponse>(
        API_SUFFIX.CASH_FUND_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cash-fund", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["cash-funds"] });
      toast.success("Cập nhật quỹ tiền mặt thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteCashFund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.CASH_FUND_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-funds"] });
      toast.success("Xóa quỹ tiền mặt thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== CASH PAYMENT ==================

export interface CashPaymentsParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  status?: string;
  vendorId?: number;
  paymentMethodId?: number;
  expenseCategoryId?: number;
  search?: string;
}

export const useCashPayments = (params?: CashPaymentsParams) => {
  return useQuery({
    queryKey: ["cash-payments", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<CashPaymentResponseIPaginate>(
          API_SUFFIX.CASH_PAYMENTS,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockCashPaymentsPaginate
    ),
  });
};

export const useCashPayment = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["cash-payment", id],
    enabled: enabled && !!id,
    queryFn: createMockQueryFn(
      async () => {
        const res = await apiRequest.get<CashPaymentResponse>(
          API_SUFFIX.CASH_PAYMENT_BY_ID(id as number)
        );
        return res.data;
      },
      mockCashPayments.find((p) => p.id === id) || mockCashPayments[0]
    ),
  });
};

export const useCreateCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCashPaymentRequest) => {
      const res = await apiRequest.post<CashPaymentResponse>(
        API_SUFFIX.CASH_PAYMENTS,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Tạo phiếu chi thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdateCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateCashPaymentRequest;
    }) => {
      const res = await apiRequest.put<CashPaymentResponse>(
        API_SUFFIX.CASH_PAYMENT_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["cash-payment", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Cập nhật phiếu chi thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.CASH_PAYMENT_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Xóa phiếu chi thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useApproveCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<CashPaymentResponse>(
        API_SUFFIX.CASH_PAYMENT_APPROVE(id)
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cash-payment", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      toast.success("Duyệt phiếu chi thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useCancelCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<CashPaymentResponse>(
        API_SUFFIX.CASH_PAYMENT_CANCEL(id)
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cash-payment", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      toast.success("Hủy phiếu chi thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const usePostCashPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<CashPaymentResponse>(
        API_SUFFIX.CASH_PAYMENT_POST(id)
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cash-payment", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Hạch toán phiếu chi thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== CASH RECEIPT ==================

export interface CashReceiptsParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  status?: string;
  customerId?: number;
  paymentMethodId?: number;
  search?: string;
}

export const useCashReceipts = (params?: CashReceiptsParams) => {
  return useQuery({
    queryKey: ["cash-receipts", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<CashReceiptResponseIPaginate>(
          API_SUFFIX.CASH_RECEIPTS,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockCashReceiptsPaginate
    ),
  });
};

export const useCashReceipt = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["cash-receipt", id],
    enabled: enabled && !!id,
    queryFn: createMockQueryFn(
      async () => {
        const res = await apiRequest.get<CashReceiptResponse>(
          API_SUFFIX.CASH_RECEIPT_BY_ID(id as number)
        );
        return res.data;
      },
      mockCashReceipts.find((r) => r.id === id) || mockCashReceipts[0]
    ),
  });
};

export const useCreateCashReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCashReceiptRequest) => {
      const res = await apiRequest.post<CashReceiptResponse>(
        API_SUFFIX.CASH_RECEIPTS,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Tạo phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdateCashReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateCashReceiptRequest;
    }) => {
      const res = await apiRequest.put<CashReceiptResponse>(
        API_SUFFIX.CASH_RECEIPT_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["cash-receipt", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Cập nhật phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteCashReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.CASH_RECEIPT_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Xóa phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useApproveCashReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<CashReceiptResponse>(
        API_SUFFIX.CASH_RECEIPT_APPROVE(id)
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cash-receipt", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      toast.success("Duyệt phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useCancelCashReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<CashReceiptResponse>(
        API_SUFFIX.CASH_RECEIPT_CANCEL(id)
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cash-receipt", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      toast.success("Hủy phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const usePostCashReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<CashReceiptResponse>(
        API_SUFFIX.CASH_RECEIPT_POST(id)
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cash-receipt", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      toast.success("Hạch toán phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== CASH BOOK ==================

export interface CashBookParams {
  fromDate?: string;
  toDate?: string;
  cashFundId?: number;
}

export const useCashBook = (params?: CashBookParams) => {
  return useQuery({
    queryKey: ["cash-book", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<CashBookResponse>(
          API_SUFFIX.CASH_BOOK,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockCashBook
    ),
  });
};

