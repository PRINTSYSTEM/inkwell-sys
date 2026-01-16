// src/hooks/use-sales-report.ts
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { downloadBlob } from "@/lib/download-utils";
import { useAsyncCallback } from "@/hooks/use-async";

import type {
  SalesByPeriodResponseIPaginate,
  SalesByCustomerResponseIPaginate,
  SalesByDimensionResponseIPaginate,
  TopProductResponseIPaginate,
  ReturnsDiscountsResponseIPaginate,
  OrderDrillDownResponseIPaginate,
} from "@/Schema/report.schema";

// IMPORTANT: params types come from src/Schema/generated-params.ts (re-exported by @/Schema)
import type {
  SalesReportByPeriodListParams,
  SalesReportByCustomerListParams,
  SalesReportByDimensionListParams,
  SalesReportTopProductsParams,
  SalesReportReturnsDiscountsParams,
  SalesReportOrdersByCustomerParams,
  SalesReportOrdersByPeriodParams,
  SalesReportsByPeriodExportParams,
} from "@/Schema";

// ================== SALES BY PERIOD ==================

export const useSalesByPeriod = (params?: SalesReportByPeriodListParams) => {
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

export const useSalesByCustomer = (params?: SalesReportByCustomerListParams) => {
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

export const useSalesByDimension = (params?: SalesReportByDimensionListParams) => {
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

export const useTopProducts = (params?: SalesReportTopProductsParams) => {
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

export const useReturnsDiscounts = (params?: SalesReportReturnsDiscountsParams) => {
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

export const useOrderDrillDownByPeriod = (params?: SalesReportOrdersByPeriodParams) => {
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
    downloadBlob(blob, "sales-by-period.xlsx");
  });

  const mutate = async (params: SalesReportsByPeriodExportParams) => {
    try {
      await execute(params);
      toast.success("ThÃ nh cÃ´ng", {
        description: "ÄÃ£ xuáº¥t Excel bÃ¡o cÃ¡o doanh sá»‘ theo ká»³",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message || e?.message || "KhÃ´ng thá»ƒ xuáº¥t bÃ¡o cÃ¡o";
      toast.error("Lá»—i", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};
