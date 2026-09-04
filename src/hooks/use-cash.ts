// src/hooks/use-cash.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { buildFilename, formatDateForFilename } from "@/utils/file-name";
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

const getCachedCashPayment = (queryClient: any, id: number) => {
  let payment = queryClient.getQueryData(["cash-payment", id]);
  if (!payment) {
    const queries = queryClient.getQueryCache().findAll({ queryKey: ["cash-payments"] });
    for (const query of queries) {
      const data = query.state.data as any;
      if (data?.items && Array.isArray(data.items)) {
        const found = data.items.find((item: any) => item.id === id);
        if (found) {
          payment = found;
          break;
        }
      } else if (Array.isArray(data)) {
        const found = data.find((item: any) => item.id === id);
        if (found) {
          payment = found;
          break;
        }
      }
    }
  }
  return payment;
};

const getCachedCashReceipt = (queryClient: any, id: number) => {
  let receipt = queryClient.getQueryData(["cash-receipt", id]);
  if (!receipt) {
    const queries = queryClient.getQueryCache().findAll({ queryKey: ["cash-receipts"] });
    for (const query of queries) {
      const data = query.state.data as any;
      if (data?.items && Array.isArray(data.items)) {
        const found = data.items.find((item: any) => item.id === id);
        if (found) {
          receipt = found;
          break;
        }
      } else if (Array.isArray(data)) {
        const found = data.find((item: any) => item.id === id);
        if (found) {
          receipt = found;
          break;
        }
      }
    }
  }
  return receipt;
};

// ================== CASH PAYMENT: EXPORT EXCEL ==================

export const useExportCashPaymentsExcel = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    void,
    [CashPaymentListParams]
  >(async (params: CashPaymentListParams) => {
    const normalizedParams = normalizeParams(params as Record<string, unknown>);
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.CASH_PAYMENT_EXPORT,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const dateSuffix = params?.fromDate || params?.toDate
      ? `Từ ${formatDateForFilename(params.fromDate)} Đến ${formatDateForFilename(params.toDate)}`
      : "";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildFilename(["Danh sách phiếu chi", dateSuffix], "xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

  const mutate = async (params: CashPaymentListParams) => {
    try {
      await execute(params);
      toast.success("Thành công", {
        description: "Đã xuất Excel phiếu chi",
      });
    } catch (err: unknown) {
      const error = err as any;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất Excel phiếu chi",
      });
      throw err;
    }
  };

  return { loading, isPending: loading, error, mutate, reset };
};

// ================== CASH PAYMENT: EXPORT PDF ==================

export const useExportCashPaymentPDF = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.get<ArrayBuffer>(
        API_SUFFIX.CASH_PAYMENT_EXPORT_PDF(id),
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const payment = getCachedCashPayment(queryClient, id);
      const code = payment?.code || `PC${String(id).padStart(5, '0')}`;
      const name = payment?.vendorName || payment?.receiverName || "Nhà cung cấp";
      const date = formatDateForFilename(payment?.createdAt || payment?.paymentDate || new Date());

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(["Phiếu chi", code, name, date], "pdf");
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
        description: "Đã xuất PDF phiếu chi",
      });
    } catch (err: unknown) {
      const error = err as any;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất PDF phiếu chi",
      });
      throw err;
    }
  };

  return { loading, isPending: loading, error, mutate, reset };
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

const invalidateReceiptRelatedQueries = (queryClient: any, id?: number) => {
  if (id) {
    queryClient.invalidateQueries({ queryKey: ["cash-receipt", id] });
  }
  queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
  queryClient.invalidateQueries({ queryKey: ["cash-book"] });
  queryClient.invalidateQueries({ queryKey: ["customers"] });
  queryClient.invalidateQueries({ queryKey: ["customer"] });
  queryClient.invalidateQueries({ queryKey: ["ar-summary"] });
  queryClient.invalidateQueries({ queryKey: ["ar-detail"] });
  queryClient.invalidateQueries({ queryKey: ["ar-aging"] });
  queryClient.invalidateQueries({ queryKey: ["ar-ledger-list"] });
  queryClient.invalidateQueries({ queryKey: ["ar-ledger-summary"] });
  queryClient.invalidateQueries({ queryKey: ["ar-detail-ledger"] });
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
    onSuccess: (data) => {
      invalidateReceiptRelatedQueries(queryClient, data?.id);
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
      invalidateReceiptRelatedQueries(queryClient, variables.id);
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
    onSuccess: (_, id) => {
      invalidateReceiptRelatedQueries(queryClient, id);
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
      invalidateReceiptRelatedQueries(queryClient, id);
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
      invalidateReceiptRelatedQueries(queryClient, id);
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
      invalidateReceiptRelatedQueries(queryClient, id);
      toast.success("Hạch toán phiếu thu thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== CASH RECEIPT: EXPORT PDF ==================

export const useExportCashReceiptPDF = () => {
  const queryClient = useQueryClient();
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

      const receipt = getCachedCashReceipt(queryClient, id);
      const code = receipt?.code || `PT${String(id).padStart(5, '0')}`;
      const name = receipt?.customerName || receipt?.payerName || "Khách lẻ";
      const date = formatDateForFilename(receipt?.createdAt || receipt?.receiptDate || new Date());

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(["Phiếu thu", code, name, date], "pdf");
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

  return { loading, isPending: loading, error, mutate, reset };
};

// ================== CASH RECEIPT: EXPORT EXCEL ==================

export const useExportCashReceiptsExcel = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    void,
    [CashReceiptListParams]
  >(async (params: CashReceiptListParams) => {
    const normalizedParams = normalizeParams(params as Record<string, unknown>);
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.CASH_RECEIPT_EXPORT,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const dateSuffix = params?.fromDate || params?.toDate
      ? `Từ ${formatDateForFilename(params.fromDate)} Đến ${formatDateForFilename(params.toDate)}`
      : "";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildFilename(["Danh sách phiếu thu", dateSuffix], "xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

  const mutate = async (params: CashReceiptListParams) => {
    try {
      await execute(params);
      toast.success("Thành công", {
        description: "Đã xuất Excel phiếu thu",
      });
    } catch (err: unknown) {
      const error = err as any;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất Excel phiếu thu",
      });
      throw err;
    }
  };

  return { loading, isPending: loading, error, mutate, reset };
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

// ================== FINANCE ACCOUNTS ==================

export const useFinanceAccountTree = (params?: { fromDate?: string; toDate?: string }) => {
  return useQuery({
    queryKey: ["finance-account-tree", params],
    queryFn: async () => {
      const res = await apiRequest.get<any[]>(API_SUFFIX.FINANCE_ACCOUNTS_TREE, {
        params,
      });
      return res.data;
    },
  });
};

export const useCashFunds = (q: string = "111") => {
  return useQuery({
    queryKey: ["cash-funds", q],
    queryFn: async () => {
      const res = await apiRequest.get<any[]>(API_SUFFIX.FINANCE_ACCOUNTS_SEARCH, {
        params: { q },
      });
      // Filter leaf accounts: 1111 for cash, 1121 for bank transfers
      const leafAccounts = res.data.filter(acc => acc.code === "1111" || acc.code === "1121");
      return {
        items: leafAccounts,
        total: leafAccounts.length,
      };
    },
  });
};

