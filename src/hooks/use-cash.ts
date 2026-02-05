// src/hooks/use-cash.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import { createMockQueryFn } from "@/lib/mock-utils";
import { useAsyncCallback } from "@/hooks/use-async";
import {
  mockCashPaymentsPaginate,
  mockCashPayments,
  mockCashReceiptsPaginate,
  mockCashReceipts,
  mockCashBook,
} from "@/mocks/cash.mock";
import type {
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
import type {
  CashPaymentListParams,
  CashReceiptListParams,
  CashBookListParams,
  CashPaymentExportParams,
  CashReceiptExportParams,
} from "@/Schema";

// ================== CASH PAYMENT ==================

export const useCashPayments = (params?: CashPaymentListParams) => {
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

export const useCashReceipts = (params?: CashReceiptListParams) => {
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

// ================== CASH RECEIPT: EXPORT PDF ==================

export const useExportCashReceiptPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.get<ArrayBuffer>(
        API_SUFFIX.CASH_RECEIPT_EXPORT_PDF(id),
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cash-receipt-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);
      toast.success("Thành công", {
        description: "Đã xuất PDF phiếu thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất PDF phiếu thu",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== CASH BOOK ==================

export const useCashBook = (params?: CashBookListParams) => {
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

// ================== EXPORT CASH PAYMENTS ==================
// GET /api/cash-payments/export

export const useExportCashPayments = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [CashPaymentExportParams]
  >(async (params: CashPaymentExportParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.CASH_PAYMENT_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: CashPaymentExportParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cash-payments-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất danh sách phiếu chi",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất danh sách phiếu chi";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== EXPORT CASH RECEIPTS ==================
// GET /api/cash-receipts/export

export const useExportCashReceipts = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [CashReceiptExportParams]
  >(async (params: CashReceiptExportParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.CASH_RECEIPT_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: CashReceiptExportParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cash-receipts-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất danh sách phiếu thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất danh sách phiếu thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};
