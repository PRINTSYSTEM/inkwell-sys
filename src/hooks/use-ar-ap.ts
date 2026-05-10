// src/hooks/use-ar-ap.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import { useAsyncCallback } from "@/hooks/use-async";
import { z } from "zod";
import type {
  ARSummaryResponse,
  ARSummaryResponseIPaginate,
  ARDetailResponse,
  ARDetailResponseIPaginate,
  ARAgingResponse,
  ARAgingResponseIPaginate,
  APSummaryResponse,
  APSummaryResponseIPaginate,
  APDetailResponse,
  APDetailResponseIPaginate,
  APAgingResponse,
  APAgingResponseIPaginate,
  CollectionScheduleResponse,
  CollectionScheduleResponseIPaginate,
} from "@/Schema/accounting.schema";
import {
  APByPurchaseInvoiceResponseIPaginateSchema,
  APDetailLedgerRowIPaginateSchema,
  APOverdueResponseIPaginateSchema,
  ARByItemResponseIPaginateSchema,
  ARDetailByInvoiceResponseIPaginateSchema,
  ARDetailLedgerRowIPaginateSchema,
  AROverdueResponseIPaginateSchema,
  ARSummaryByBranchResponseIPaginateSchema,
  ARSummaryByCustomerGroupResponseIPaginateSchema,
  ARUnderdueResponseIPaginateSchema,
  DebtReconciliationAPRequestSchema,
  DebtReconciliationARRequestSchema,
  DebtReconciliationResponseSchema,
} from "@/Schema/generated";

type APByPurchaseInvoiceResponseIPaginate = z.infer<
  typeof APByPurchaseInvoiceResponseIPaginateSchema
>;
type APDetailLedgerRowIPaginate = z.infer<typeof APDetailLedgerRowIPaginateSchema>;
type APOverdueResponseIPaginate = z.infer<typeof APOverdueResponseIPaginateSchema>;
type ARByItemResponseIPaginate = z.infer<typeof ARByItemResponseIPaginateSchema>;
type ARDetailByInvoiceResponseIPaginate = z.infer<
  typeof ARDetailByInvoiceResponseIPaginateSchema
>;
type ARDetailLedgerRowIPaginate = z.infer<typeof ARDetailLedgerRowIPaginateSchema>;
type AROverdueResponseIPaginate = z.infer<typeof AROverdueResponseIPaginateSchema>;
type ARSummaryByBranchResponseIPaginate = z.infer<
  typeof ARSummaryByBranchResponseIPaginateSchema
>;
type ARSummaryByCustomerGroupResponseIPaginate = z.infer<
  typeof ARSummaryByCustomerGroupResponseIPaginateSchema
>;
type ARUnderdueResponseIPaginate = z.infer<typeof ARUnderdueResponseIPaginateSchema>;
type DebtReconciliationAPRequest = z.infer<typeof DebtReconciliationAPRequestSchema>;
type DebtReconciliationARRequest = z.infer<typeof DebtReconciliationARRequestSchema>;
type DebtReconciliationResponse = z.infer<typeof DebtReconciliationResponseSchema>;
import type {
  DebtReportArSummaryParams,
  DebtReportArDetailParams,
  DebtReportArAgingParams,
  DebtReportApSummaryParams,
  DebtReportApDetailParams,
  DebtReportApAgingParams,
  DebtReportCollectionScheduleParams,
  DebtReportApByPurchaseInvoiceParams,
  DebtReportApDetailLedgerParams,
  DebtReportApDetailLedgerExportParams,
  DebtReportApOverdueParams,
  DebtReportArAgingExportPdfParams,
  DebtReportArByItemParams,
  DebtReportArDetailByInvoiceParams,
  DebtReportArDetailLedgerParams,
  DebtReportArOverdueParams,
  DebtReportArSummaryByBranchParams,
  DebtReportArSummaryByCustomerGroupParams,
  DebtReportArSummaryExportPdfParams,
  DebtReportArUnderdueParams,
  DebtReportCustomerReconciliationExportPdfParams,
  DebtReportCustomerReconciliationExportWordParams,
  DebtReconciliationApDownloadParams,
  DebtReconciliationArDownloadParams,
} from "@/Schema";

// ================== AR (Accounts Receivable) ==================

export const useARSummary = (params?: DebtReportArSummaryParams) => {
  return useQuery({
    queryKey: ["ar-summary", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARSummaryResponseIPaginate>(
        API_SUFFIX.AR_SUMMARY,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useARDetail = (params?: DebtReportArDetailParams) => {
  return useQuery({
    queryKey: ["ar-detail", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARDetailResponseIPaginate>(
        API_SUFFIX.AR_DETAIL,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useARAging = (params?: DebtReportArAgingParams) => {
  return useQuery({
    queryKey: ["ar-aging", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARAgingResponseIPaginate>(
        API_SUFFIX.AR_AGING,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useExportARSummary = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportArSummaryParams?]
  >(async (params?: DebtReportArSummaryParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AR_SUMMARY_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params?: DebtReportArSummaryParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ar-summary-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất báo cáo tổng hợp công nợ phải thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất báo cáo tổng hợp công nợ phải thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useExportARAging = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportArAgingParams?]
  >(async (params?: DebtReportArAgingParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AR_AGING_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params?: DebtReportArAgingParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ar-aging-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất báo cáo phân tích tuổi nợ phải thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất báo cáo phân tích tuổi nợ phải thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== AP (Accounts Payable) ==================

export const useAPSummary = (params?: DebtReportApSummaryParams) => {
  return useQuery({
    queryKey: ["ap-summary", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APSummaryResponseIPaginate>(
        API_SUFFIX.AP_SUMMARY,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useAPDetail = (params?: DebtReportApDetailParams) => {
  return useQuery({
    queryKey: ["ap-detail", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APDetailResponseIPaginate>(
        API_SUFFIX.AP_DETAIL,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useAPAging = (params?: DebtReportApAgingParams) => {
  return useQuery({
    queryKey: ["ap-aging", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APAgingResponseIPaginate>(
        API_SUFFIX.AP_AGING,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useExportAPSummary = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportApSummaryParams?]
  >(async (params?: DebtReportApSummaryParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AP_SUMMARY_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params?: DebtReportApSummaryParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ap-summary-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất báo cáo tổng hợp công nợ phải trả",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất báo cáo tổng hợp công nợ phải trả";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useExportAPAging = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportApAgingParams?]
  >(async (params?: DebtReportApAgingParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AP_AGING_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params?: DebtReportApAgingParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ap-aging-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất báo cáo phân tích tuổi nợ phải trả",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất báo cáo phân tích tuổi nợ phải trả";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== COLLECTION SCHEDULE ==================

export const useCollectionSchedule = (params?: DebtReportCollectionScheduleParams) => {
  return useQuery({
    queryKey: ["collection-schedule", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<CollectionScheduleResponseIPaginate>(
        API_SUFFIX.COLLECTION_SCHEDULE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== DEBT RECONCILIATIONS ==================

// ===== POST /api/debt-reconciliations/ap =====
// Tạo đối soát công nợ phải trả

export const useCreateDebtReconciliationAP = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DebtReconciliationResponse,
    [DebtReconciliationAPRequest]
  >(async (data: DebtReconciliationAPRequest) => {
    const res = await apiRequest.post<DebtReconciliationResponse>(
      API_SUFFIX.DEBT_RECONCILIATION_AP,
      data
    );
    return res.data;
  });

  const mutate = async (data: DebtReconciliationAPRequest) => {
    try {
      const result = await execute(data);

      queryClient.invalidateQueries({
        queryKey: ["debt-reconciliations"],
      });

      toast.success("Thành công", {
        description: "Đã tạo đối soát công nợ phải trả",
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
        "Không thể tạo đối soát công nợ phải trả";

      toast.error("Lỗi", {
        description: message,
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
};// ===== GET /api/debt-reconciliations/ap/:id/download =====
// Tải xuống đối soát công nợ phải trả

export const useDownloadDebtReconciliationAP = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [number, DebtReconciliationApDownloadParams?]
  >(async (id: number, params?: DebtReconciliationApDownloadParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.DEBT_RECONCILIATION_AP_DOWNLOAD(id),
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (id: number, params?: DebtReconciliationApDownloadParams) => {
    try {
      const blob = await execute(id, params);
      const format = params?.format || "pdf";
      const fileBlob = new Blob([blob], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `debt-reconciliation-ap-${id}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã tải xuống đối soát công nợ phải trả",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải xuống đối soát công nợ phải trả";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== POST /api/debt-reconciliations/ar =====
// Tạo đối soát công nợ phải thu

export const useCreateDebtReconciliationAR = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DebtReconciliationResponse,
    [DebtReconciliationARRequest]
  >(async (data: DebtReconciliationARRequest) => {
    const res = await apiRequest.post<DebtReconciliationResponse>(
      API_SUFFIX.DEBT_RECONCILIATION_AR,
      data
    );
    return res.data;
  });

  const mutate = async (data: DebtReconciliationARRequest) => {
    try {
      const result = await execute(data);

      queryClient.invalidateQueries({
        queryKey: ["debt-reconciliations"],
      });

      toast.success("Thành công", {
        description: "Đã tạo đối soát công nợ phải thu",
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
        "Không thể tạo đối soát công nợ phải thu";

      toast.error("Lỗi", {
        description: message,
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

// ===== GET /api/debt-reconciliations/ar/:id/download =====
// Tải xuống đối soát công nợ phải thu

export const useDownloadDebtReconciliationAR = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [number, DebtReconciliationArDownloadParams?]
  >(async (id: number, params?: DebtReconciliationArDownloadParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.DEBT_RECONCILIATION_AR_DOWNLOAD(id),
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (id: number, params?: DebtReconciliationArDownloadParams) => {
    try {
      const blob = await execute(id, params);
      const format = params?.format || "pdf";
      const fileBlob = new Blob([blob], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `debt-reconciliation-ar-${id}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã tải xuống đối soát công nợ phải thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải xuống đối soát công nợ phải thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== NEW AR REPORTS ==================

// ===== GET /api/debt-reports/ar-by-item =====
// Báo cáo công nợ phải thu theo mặt hàng

export const useARByItem = (params?: DebtReportArByItemParams) => {
  return useQuery({
    queryKey: ["ar-by-item", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARByItemResponseIPaginate>(
        API_SUFFIX.AR_BY_ITEM,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ar-detail-by-invoice =====
// Chi tiết công nợ phải thu theo hóa đơn

export const useARDetailByInvoice = (params?: DebtReportArDetailByInvoiceParams) => {
  return useQuery({
    queryKey: ["ar-detail-by-invoice", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARDetailByInvoiceResponseIPaginate>(
        API_SUFFIX.AR_DETAIL_BY_INVOICE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ar-detail-ledger/:customerId =====
// Sổ chi tiết công nợ phải thu theo khách hàng

export const useARDetailLedger = (
  customerId: number | null,
  params?: DebtReportArDetailLedgerParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["ar-detail-ledger", customerId, params],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARDetailLedgerRowIPaginate>(
        API_SUFFIX.AR_DETAIL_LEDGER(customerId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ar-detail-ledger/:customerId/export =====
// Xuất sổ chi tiết công nợ phải thu

export const useExportARDetailLedger = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [number]
  >(async (customerId: number) => {
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.AR_DETAIL_LEDGER_EXPORT(customerId),
      { responseType: "arraybuffer" }
    );
    return res.data;
  });

  const mutate = async (customerId: number) => {
    try {
      const blob = await execute(customerId);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ar-detail-ledger-${customerId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất sổ chi tiết công nợ phải thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất sổ chi tiết công nợ phải thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/ar-overdue =====
// Công nợ phải thu quá hạn

export const useAROverdue = (params?: DebtReportArOverdueParams) => {
  return useQuery({
    queryKey: ["ar-overdue", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<AROverdueResponseIPaginate>(
        API_SUFFIX.AR_OVERDUE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ar-overdue/export =====
// Xuất công nợ phải thu quá hạn

export const useExportAROverdue = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportArOverdueParams]
  >(async (params: DebtReportArOverdueParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AR_OVERDUE_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: DebtReportArOverdueParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ar-overdue-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất công nợ phải thu quá hạn",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất công nợ phải thu quá hạn";

      toast.error("Lỗi", {
        description: message,
      });      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/ar-summary-by-branch =====
// Tổng hợp công nợ phải thu theo chi nhánh

export const useARSummaryByBranch = (params?: DebtReportArSummaryByBranchParams) => {
  return useQuery({
    queryKey: ["ar-summary-by-branch", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARSummaryByBranchResponseIPaginate>(
        API_SUFFIX.AR_SUMMARY_BY_BRANCH,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ar-summary-by-customer-group =====
// Tổng hợp công nợ phải thu theo nhóm khách hàng

export const useARSummaryByCustomerGroup = (
  params?: DebtReportArSummaryByCustomerGroupParams
) => {
  return useQuery({
    queryKey: ["ar-summary-by-customer-group", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARSummaryByCustomerGroupResponseIPaginate>(
        API_SUFFIX.AR_SUMMARY_BY_CUSTOMER_GROUP,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ar-summary/export-pdf =====
// Xuất PDF tổng hợp công nợ phải thu

export const useExportARSummaryPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportArSummaryExportPdfParams]
  >(async (params: DebtReportArSummaryExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AR_SUMMARY_EXPORT_PDF, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: DebtReportArSummaryExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ar-summary-export.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất PDF tổng hợp công nợ phải thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất PDF tổng hợp công nợ phải thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/ar-aging/export-pdf =====
// Xuất PDF phân tích tuổi nợ phải thu

export const useExportARAgingPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportArAgingExportPdfParams]
  >(async (params: DebtReportArAgingExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.AR_AGING_EXPORT_PDF, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: DebtReportArAgingExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ar-aging-export.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất PDF phân tích tuổi nợ phải thu",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất PDF phân tích tuổi nợ phải thu";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/ar-underdue =====
// Công nợ phải thu chưa đến hạn

export const useARUnderdue = (params?: DebtReportArUnderdueParams) => {
  return useQuery({
    queryKey: ["ar-underdue", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARUnderdueResponseIPaginate>(
        API_SUFFIX.AR_UNDERDUE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/customer-reconciliation/export =====
// Xuất đối soát công nợ khách hàng

export const useExportCustomerReconciliation = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportCustomerReconciliationExportPdfParams]
  >(async (params: DebtReportCustomerReconciliationExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.CUSTOMER_RECONCILIATION_EXPORT,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: DebtReportCustomerReconciliationExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `customer-reconciliation-export.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất đối soát công nợ khách hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất đối soát công nợ khách hàng";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/customer-reconciliation/export-pdf =====
// Xuất PDF đối soát công nợ khách hàng

export const useExportCustomerReconciliationPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportCustomerReconciliationExportPdfParams]
  >(async (params: DebtReportCustomerReconciliationExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.CUSTOMER_RECONCILIATION_EXPORT_PDF,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: DebtReportCustomerReconciliationExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `customer-reconciliation-export.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất PDF đối soát công nợ khách hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất PDF đối soát công nợ khách hàng";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/customer-reconciliation/export-word =====
// Xuất Word đối soát công nợ khách hàng

export const useExportCustomerReconciliationWord = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [DebtReportCustomerReconciliationExportWordParams]
  >(async (params: DebtReportCustomerReconciliationExportWordParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.CUSTOMER_RECONCILIATION_EXPORT_WORD,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: DebtReportCustomerReconciliationExportWordParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `customer-reconciliation-export.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất Word đối soát công nợ khách hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất Word đối soát công nợ khách hàng";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== NEW AP REPORTS ==================

// ===== GET /api/debt-reports/ap-by-purchase-invoice =====
// Báo cáo công nợ phải trả theo hóa đơn mua hàng

export const useAPByPurchaseInvoice = (params?: DebtReportApByPurchaseInvoiceParams) => {
  return useQuery({
    queryKey: ["ap-by-purchase-invoice", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APByPurchaseInvoiceResponseIPaginate>(
        API_SUFFIX.AP_BY_PURCHASE_INVOICE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ap-detail-ledger/:vendorId =====
// Sổ chi tiết công nợ phải trả theo nhà cung cấp

export const useAPDetailLedger = (
  vendorId: number | null,
  params?: DebtReportApDetailLedgerParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["ap-detail-ledger", vendorId, params],
    enabled: enabled && !!vendorId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APDetailLedgerRowIPaginate>(
        API_SUFFIX.AP_DETAIL_LEDGER(vendorId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ===== GET /api/debt-reports/ap-detail-ledger/:vendorId/export =====
// Xuất sổ chi tiết công nợ phải trả

export const useExportAPDetailLedger = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [number, DebtReportApDetailLedgerExportParams?]
  >(async (vendorId: number, params?: DebtReportApDetailLedgerExportParams) => {
    const normalizedParams = normalizeParams({
      ...(params ?? {}),
      vendorId: vendorId,
    } as Record<string, unknown>);
    
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.AP_DETAIL_LEDGER_EXPORT(vendorId),
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (
    vendorId: number,
    params?: DebtReportApDetailLedgerExportParams
  ) => {
    try {
      const blob = await execute(vendorId, params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ap-detail-ledger-${vendorId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "Đã xuất sổ chi tiết công nợ phải trả",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất sổ chi tiết công nợ phải trả";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ===== GET /api/debt-reports/ap-overdue =====
// Công nợ phải trả quá hạn

export const useAPOverdue = (params?: DebtReportApOverdueParams) => {
  return useQuery({
    queryKey: ["ap-overdue", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APOverdueResponseIPaginate>(
        API_SUFFIX.AP_OVERDUE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};


