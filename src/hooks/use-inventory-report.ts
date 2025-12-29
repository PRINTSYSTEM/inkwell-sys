// src/hooks/use-inventory-report.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type {
  CurrentStockResponse,
  CurrentStockResponseIPaginate,
  InventorySummaryItemResponse,
  InventorySummaryItemResponseIPaginate,
  LowStockResponse,
  LowStockResponseIPaginate,
  SlowMovingResponse,
  SlowMovingResponseIPaginate,
  StockCardResponse,
} from "@/Schema/stock.schema";

// ================== CURRENT STOCK ==================

export interface CurrentStockParams {
  pageNumber?: number;
  pageSize?: number;
  materialTypeId?: number;
  designTypeId?: number;
  search?: string;
}

export const useCurrentStock = (params?: CurrentStockParams) => {
  return useQuery({
    queryKey: ["current-stock", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<CurrentStockResponseIPaginate>(
        API_SUFFIX.CURRENT_STOCK,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== INVENTORY SUMMARY ==================

export interface InventorySummaryParams {
  pageNumber?: number;
  pageSize?: number;
  materialTypeId?: number;
  designTypeId?: number;
  asOfDate?: string;
  search?: string;
}

export const useInventorySummary = (params?: InventorySummaryParams) => {
  return useQuery({
    queryKey: ["inventory-summary", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<InventorySummaryItemResponseIPaginate>(
        API_SUFFIX.INVENTORY_SUMMARY,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== LOW STOCK ==================

export interface LowStockParams {
  pageNumber?: number;
  pageSize?: number;
  materialTypeId?: number;
  designTypeId?: number;
  threshold?: number;
  search?: string;
}

export const useLowStock = (params?: LowStockParams) => {
  return useQuery({
    queryKey: ["low-stock", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<LowStockResponseIPaginate>(
        API_SUFFIX.LOW_STOCK,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== SLOW MOVING ==================

export interface SlowMovingParams {
  pageNumber?: number;
  pageSize?: number;
  materialTypeId?: number;
  designTypeId?: number;
  daysThreshold?: number;
  search?: string;
}

export const useSlowMoving = (params?: SlowMovingParams) => {
  return useQuery({
    queryKey: ["slow-moving", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<SlowMovingResponseIPaginate>(
        API_SUFFIX.SLOW_MOVING,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== STOCK CARD ==================

export interface StockCardParams {
  fromDate?: string;
  toDate?: string;
}

export const useStockCard = (itemCode: string, params?: StockCardParams) => {
  return useQuery({
    queryKey: ["stock-card", itemCode, params],
    enabled: !!itemCode,
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<StockCardResponse>(
        API_SUFFIX.STOCK_CARD(itemCode),
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

