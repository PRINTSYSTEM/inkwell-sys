// src/hooks/use-inventory-report.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { downloadBlob } from "@/lib/download-utils";
import { toast } from "sonner";
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
import type { InventoryReportCurrentStockParams } from "@/Schema";

// ================== CURRENT STOCK ==================

export const useCurrentStock = (params?: InventoryReportCurrentStockParams) => {
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
  itemType?: string;
  itemGroup?: string;
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

export const useExportInventorySummary = () => {
  return useMutation({
    mutationFn: async (params?: InventorySummaryParams) => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get(API_SUFFIX.INVENTORY_SUMMARY_EXCEL, {
        params: normalizedParams,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `inventory-summary-${new Date().getTime()}.xlsx`);
    },
    onSuccess: () => {
      toast.success("Xuất báo cáo thành công");
    },
    onError: () => {
      toast.error("Lỗi khi xuất báo cáo");
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
  itemType?: string;
  itemGroup?: string;
  warehouse?: string;
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

export const useExportStockCard = () => {
  return useMutation({
    mutationFn: async ({
      itemCode,
      params,
    }: {
      itemCode: string;
      params?: StockCardParams;
    }) => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get(API_SUFFIX.STOCK_CARD_EXCEL(itemCode), {
        params: normalizedParams,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `stock-card-${itemCode}-${new Date().getTime()}.xlsx`);
    },
    onSuccess: () => {
      toast.success("Xuất báo cáo thành công");
    },
    onError: () => {
      toast.error("Lỗi khi xuất báo cáo");
    },
  });
};

