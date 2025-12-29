// src/hooks/use-sales-report.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
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

export interface OrderDrillDownParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  search?: string;
}

export const useOrderDrillDown = (params?: OrderDrillDownParams) => {
  return useQuery({
    queryKey: ["order-drill-down", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderDrillDownResponseIPaginate>(
        API_SUFFIX.ORDER_DRILL_DOWN,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useOrderDrillDownByPeriod = (params?: OrderDrillDownParams) => {
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

