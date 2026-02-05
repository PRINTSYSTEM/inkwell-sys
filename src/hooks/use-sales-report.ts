// src/hooks/use-sales-report.ts
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { downloadBlob } from "@/lib/download-utils";
import { useAsyncCallback } from "@/hooks/use-async";
import type {
  SalesByPeriodResponse,
  SalesByPeriodResponseIPaginate,
  SalesByCustomerResponse,
  SalesByCustomerResponseIPaginate,
  SalesByDimensionResponse,
  SalesByDimensionResponseIPaginate,
  TopProductResponse,
  TopProductResponseIPaginate,
  ReturnsDiscountsResponse,
  ReturnsDiscountsResponseIPaginate,
  OrderDrillDownResponse,
  OrderDrillDownResponseIPaginate,
} from "@/Schema/report.schema";
import { z } from "zod";
import {
  SalesDetailLedgerRowIPaginateSchema,
  SalesSummaryRowIPaginateSchema,
} from "@/Schema/generated";

type SalesDetailLedgerRowIPaginate = z.infer<
  typeof SalesDetailLedgerRowIPaginateSchema
>;
type SalesSummaryRowIPaginate = z.infer<typeof SalesSummaryRowIPaginateSchema>;
import type {
  SalesReportsByPeriodExportParams,
  SalesReportOrdersByCustomerParams,
  SalesReportsInvoiceListExportParams,
  SalesReportInvoiceListExportPdfParams,
  SalesReportSalesDetailLedgerParams,
  SalesReportsSalesDetailLedgerExportParams,
  SalesReportSalesDetailLedgerExportPdfParams,
  SalesReportSalesSummaryParams,
  SalesReportsSalesSummaryExportParams,
  SalesReportSalesSummaryExportPdfParams,
} from "@/Schema";

// ================== SALES BY PERIOD ==================

export interface SalesByPeriodParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  periodType?: string; // day, week, month, quarter, year
  search?: string;
}

export const useSalesByPeriod = (params?: SalesByPeriodParams) => {
  return useQuery({
    queryKey: ["sales-by-period", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<SalesByPeriodResponseIPaginate>(
        API_SUFFIX.SALES_BY_PERIOD,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== SALES BY CUSTOMER ==================

export interface SalesByCustomerParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  search?: string;
}

export const useSalesByCustomer = (params?: SalesByCustomerParams) => {
  return useQuery({
    queryKey: ["sales-by-customer", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<SalesByCustomerResponseIPaginate>(
        API_SUFFIX.SALES_BY_CUSTOMER,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== SALES BY DIMENSION ==================

export interface SalesByDimensionParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  dimensionType?: string; // designType, materialType, etc.
  search?: string;
}

export const useSalesByDimension = (params?: SalesByDimensionParams) => {
  return useQuery({
    queryKey: ["sales-by-dimension", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<SalesByDimensionResponseIPaginate>(
        API_SUFFIX.SALES_BY_DIMENSION,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== TOP PRODUCTS ==================

export interface TopProductsParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  sortBy?: string; // quantity, revenue
  search?: string;
}

export const useTopProducts = (params?: TopProductsParams) => {
  return useQuery({
    queryKey: ["top-products", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<TopProductResponseIPaginate>(
        API_SUFFIX.TOP_PRODUCTS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== RETURNS DISCOUNTS ==================

export interface ReturnsDiscountsParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export const useReturnsDiscounts = (params?: ReturnsDiscountsParams) => {
  return useQuery({
    queryKey: ["returns-discounts", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ReturnsDiscountsResponseIPaginate>(
        API_SUFFIX.RETURNS_DISCOUNTS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== ORDER DRILL DOWN ==================

export const useOrderDrillDown = (
  customerId: number | null,
  params?: SalesReportOrdersByCustomerParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["order-drill-down", customerId, params],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderDrillDownResponseIPaginate>(
        API_SUFFIX.ORDER_DRILL_DOWN(customerId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useOrderDrillDownByPeriod = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ["order-drill-down-by-period", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderDrillDownResponseIPaginate>(
        API_SUFFIX.ORDER_DRILL_DOWN_BY_PERIOD,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== EXPORT SALES BY PERIOD ==================
// GET /sales-reports/by-period/export
export const useExportSalesByPeriod = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    void,
    [SalesReportsByPeriodExportParams]
  >(async (params: SalesReportsByPeriodExportParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );

    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.SALES_BY_PERIOD_EXPORT,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `sales-by-period.xlsx`);
  });

  const mutate = async (params: SalesReportsByPeriodExportParams) => {
    try {
      await execute(params);
      toast.success("Thành công", {
        description: "Đã xuất Excel báo cáo doanh số theo kỳ",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất báo cáo";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== SALES INVOICE LIST EXPORT ==================

export const useSalesInvoiceListExport = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [SalesReportsInvoiceListExportParams]
  >(async (params: SalesReportsInvoiceListExportParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.SALES_INVOICE_LIST_EXPORT,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: SalesReportsInvoiceListExportParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(fileBlob, "sales-invoice-list-export.xlsx");
      toast.success("Thành công", {
        description: "Đã xuất danh sách hóa đơn",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất danh sách hóa đơn";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useSalesInvoiceListExportPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [SalesReportInvoiceListExportPdfParams]
  >(async (params: SalesReportInvoiceListExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.SALES_INVOICE_LIST_EXPORT_PDF,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: SalesReportInvoiceListExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/pdf",
      });
      downloadBlob(fileBlob, "sales-invoice-list-export.pdf");
      toast.success("Thành công", {
        description: "Đã xuất PDF danh sách hóa đơn",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất PDF danh sách hóa đơn";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== SALES DETAIL LEDGER ==================

export const useSalesDetailLedger = (params?: SalesReportSalesDetailLedgerParams) => {
  return useQuery({
    queryKey: ["sales-detail-ledger", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<SalesDetailLedgerRowIPaginate>(
        API_SUFFIX.SALES_DETAIL_LEDGER,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useSalesDetailLedgerExport = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [SalesReportsSalesDetailLedgerExportParams]
  >(async (params: SalesReportsSalesDetailLedgerExportParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.SALES_DETAIL_LEDGER_EXPORT,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: SalesReportsSalesDetailLedgerExportParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(fileBlob, "sales-detail-ledger-export.xlsx");
      toast.success("Thành công", {
        description: "Đã xuất sổ chi tiết bán hàng",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất sổ chi tiết bán hàng";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useSalesDetailLedgerExportPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [SalesReportSalesDetailLedgerExportPdfParams]
  >(async (params: SalesReportSalesDetailLedgerExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.SALES_DETAIL_LEDGER_EXPORT_PDF,
      {
        params: normalizedParams,
        responseType: "arraybuffer",
      }
    );
    return res.data;
  });

  const mutate = async (params: SalesReportSalesDetailLedgerExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/pdf",
      });
      downloadBlob(fileBlob, "sales-detail-ledger-export.pdf");
      toast.success("Thành công", {
        description: "Đã xuất PDF sổ chi tiết bán hàng",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất PDF sổ chi tiết bán hàng";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== SALES SUMMARY ==================

export const useSalesSummary = (params?: SalesReportSalesSummaryParams) => {
  return useQuery({
    queryKey: ["sales-summary", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<SalesSummaryRowIPaginate>(
        API_SUFFIX.SALES_SUMMARY,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useSalesSummaryExport = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [SalesReportsSalesSummaryExportParams]
  >(async (params: SalesReportsSalesSummaryExportParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.SALES_SUMMARY_EXPORT, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: SalesReportsSalesSummaryExportParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(fileBlob, "sales-summary-export.xlsx");
      toast.success("Thành công", {
        description: "Đã xuất tổng hợp bán hàng",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất tổng hợp bán hàng";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useSalesSummaryExportPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<
    ArrayBuffer,
    [SalesReportSalesSummaryExportPdfParams]
  >(async (params: SalesReportSalesSummaryExportPdfParams) => {
    const normalizedParams = normalizeParams(
      (params ?? {}) as Record<string, unknown>
    );
    const res = await apiRequest.get<ArrayBuffer>(API_SUFFIX.SALES_SUMMARY_EXPORT_PDF, {
      params: normalizedParams,
      responseType: "arraybuffer",
    });
    return res.data;
  });

  const mutate = async (params: SalesReportSalesSummaryExportPdfParams) => {
    try {
      const blob = await execute(params);
      const fileBlob = new Blob([blob], {
        type: "application/pdf",
      });
      downloadBlob(fileBlob, "sales-summary-export.pdf");
      toast.success("Thành công", {
        description: "Đã xuất PDF tổng hợp bán hàng",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xuất PDF tổng hợp bán hàng";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};