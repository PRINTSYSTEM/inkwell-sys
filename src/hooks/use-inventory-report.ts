// src/hooks/use-inventory-report.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { buildFilename, formatDateForFilename } from "@/utils/file-name";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { downloadBlob } from "@/lib/download-utils";
import { toast } from "sonner";
import { createMockQueryFn, USE_MOCK_DATA } from "@/lib/mock-utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  mockCurrentStockPaginate,
  mockInventorySummaryPaginate,
  mockInventorySummary,
  mockLowStockPaginate,
  mockSlowMovingPaginate,
  mockStockCard,
  mockInventoryHistoryPaginate,
} from "@/mocks/inventory.mock";
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
import type {
  InventoryReportCurrentStockParams,
  InventoryReportSummaryParams,
  InventoryReportSummaryPdfParams,
} from "@/Schema";

// ================== CURRENT STOCK ==================

export const useCurrentStock = (params?: InventoryReportCurrentStockParams) => {
  return useQuery({
    queryKey: ["current-stock", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<CurrentStockResponseIPaginate>(
          API_SUFFIX.CURRENT_STOCK,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockCurrentStockPaginate
    ),
  });
};

// ================== INVENTORY SUMMARY ==================

export interface InventorySummaryParams {
  pageNumber?: number;
  pageSize?: number;
  materialTypeId?: number;
  designTypeId?: number;
  asOfDate?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  itemCode?: string;
  itemType?: string;
  itemGroup?: string;
  hideEmpty?: boolean;
  sortColumn?: string;
  sortOrder?: string;
}

export const useInventorySummary = (params?: InventorySummaryParams) => {
  return useQuery({
    queryKey: ["inventory-summary", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<InventorySummaryItemResponseIPaginate>(
          API_SUFFIX.INVENTORY_SUMMARY,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockInventorySummaryPaginate
    ),
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
      const dateSuffix = params?.fromDate || params?.toDate
        ? `Từ ${formatDateForFilename(params.fromDate)} Đến ${formatDateForFilename(params.toDate)}`
        : "";
      const itemType = params?.itemType === "material" ? "Vật tư" : "Thành phẩm";
      const excelName = buildFilename(["Báo cáo tổng hợp tồn kho", itemType, dateSuffix], "xlsx");
      downloadBlob(blob, excelName);
    },
    onSuccess: () => {
      toast.success("Xuất báo cáo thành công");
    },
    onError: () => {
      toast.error("Lỗi khi xuất báo cáo");
    },
  });
};

export const useExportInventorySummaryPDF = () => {
  return useMutation({
    mutationFn: async (params?: InventorySummaryParams) => {
      if (USE_MOCK_DATA) {
        // Simulating network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        // Helper to remove accents for Vietnamese standard font support
        const removeAccents = (str: string): string => {
          return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
        };

        // Title
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.text(removeAccents("BAO CAO TONG HOP TON KHO THANH PHAM"), 14, 20);

        // Date Range
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        let dateRangeText = "";
        if (params?.fromDate && params?.toDate) {
          const fromStr = new Date(params.fromDate).toLocaleDateString("vi-VN");
          const toStr = new Date(params.toDate).toLocaleDateString("vi-VN");
          dateRangeText = `Tu ngay: ${fromStr} - Den ngay: ${toStr}`;
        } else if (params?.toDate) {
          const toStr = new Date(params.toDate).toLocaleDateString("vi-VN");
          dateRangeText = `Tinh den ngay: ${toStr}`;
        } else {
          dateRangeText = `Ngay lap: ${new Date().toLocaleDateString("vi-VN")}`;
        }
        doc.text(removeAccents(dateRangeText), 14, 27);

        const typeFilter = params?.itemType || "product";
        doc.text(removeAccents(`Loai vat tu: ${typeFilter === "product" ? "Thanh pham" : "Vat tu"}`), 14, 32);

        // Columns definition: STT | Ma hang | Ten hang | DVT | Dau ky (SL) | Dau ky (Val) | Nhap (SL) | Nhap (Val) | Xuat (SL) | Xuat (Val) | Cuoi ky (SL) | Cuoi ky (Val)
        const columns = [
          { header: "STT", dataKey: "index" },
          { header: "Ma hang", dataKey: "code" },
          { header: "Ten hang", dataKey: "name" },
          { header: "DVT", dataKey: "unit" },
          { header: "Dau ky (SL)", dataKey: "openQty" },
          { header: "Dau ky (Tri gia)", dataKey: "openVal" },
          { header: "Nhap (SL)", dataKey: "inQty" },
          { header: "Nhap (Tri gia)", dataKey: "inVal" },
          { header: "Xuat (SL)", dataKey: "outQty" },
          { header: "Xuat (Tri gia)", dataKey: "outVal" },
          { header: "Cuoi ky (SL)", dataKey: "closeQty" },
          { header: "Cuoi ky (Tri gia)", dataKey: "closeVal" },
        ];

        // Format data
        const rows = mockInventorySummary.map((item, idx) => ({
          index: idx + 1,
          code: item.materialTypeCode || item.itemCode || "",
          name: removeAccents(item.materialTypeName || item.itemName || ""),
          unit: removeAccents(item.unit || "cai"),
          openQty: (item.openingQuantity || 0).toLocaleString("vi-VN"),
          openVal: (item.openingValue || 0).toLocaleString("vi-VN").replace(/\./g, ",") + " VND",
          inQty: (item.inQuantity || 0).toLocaleString("vi-VN"),
          inVal: (item.inValue || 0).toLocaleString("vi-VN").replace(/\./g, ",") + " VND",
          outQty: (item.outQuantity || 0).toLocaleString("vi-VN"),
          outVal: (item.outValue || 0).toLocaleString("vi-VN").replace(/\./g, ",") + " VND",
          closeQty: (item.closingQuantity || 0).toLocaleString("vi-VN"),
          closeVal: (item.closingValue || 0).toLocaleString("vi-VN").replace(/\./g, ",") + " VND",
        }));

        autoTable(doc, {
          columns: columns,
          body: rows,
          startY: 38,
          theme: "grid",
          styles: {
            fontSize: 8,
            font: "Helvetica",
            cellPadding: 1.5,
          },
          headStyles: {
            fillColor: [60, 60, 60],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            index: { halign: "center", cellWidth: 10 },
            code: { fontStyle: "bold", cellWidth: 22 },
            unit: { halign: "center", cellWidth: 12 },
            openQty: { halign: "right" },
            openVal: { halign: "right" },
            inQty: { halign: "right" },
            inVal: { halign: "right" },
            outQty: { halign: "right" },
            outVal: { halign: "right" },
            closeQty: { halign: "right" },
            closeVal: { halign: "right" },
          },
        });

        const dateSuffix = params?.fromDate || params?.toDate
          ? `Từ ${formatDateForFilename(params.fromDate)} Đến ${formatDateForFilename(params.toDate)}`
          : "";
        const itemType = params?.itemType === "material" ? "Vật tư" : "Thành phẩm";
        const pdfName = buildFilename(["Báo cáo tổng hợp tồn kho", itemType, dateSuffix], "pdf");
        doc.save(pdfName);
        return;
      }

      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get(API_SUFFIX.INVENTORY_SUMMARY_PDF, {
        params: normalizedParams,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: "application/pdf",
      });
      const dateSuffix = params?.fromDate || params?.toDate
        ? `Từ ${formatDateForFilename(params.fromDate)} Đến ${formatDateForFilename(params.toDate)}`
        : "";
      const itemType = params?.itemType === "material" ? "Vật tư" : "Thành phẩm";
      const pdfName = buildFilename(["Báo cáo tổng hợp tồn kho", itemType, dateSuffix], "pdf");
      downloadBlob(blob, pdfName);
    },
    onSuccess: () => {
      toast.success("Xuất PDF thành công");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Lỗi khi xuất PDF");
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
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<LowStockResponseIPaginate>(
          API_SUFFIX.LOW_STOCK,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockLowStockPaginate
    ),
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
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<SlowMovingResponseIPaginate>(
          API_SUFFIX.SLOW_MOVING,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockSlowMovingPaginate
    ),
  });
};

// ================== STOCK CARD ==================

export interface StockCardParams {
  fromDate?: string;
  toDate?: string;
  itemType?: string;
}

export const useStockCard = (itemCode: string, params?: StockCardParams) => {
  return useQuery({
    queryKey: ["stock-card", itemCode, params],
    enabled: !!itemCode,
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<StockCardResponse>(
          API_SUFFIX.STOCK_CARD(itemCode),
          { params: normalizedParams }
        );
        return res.data;
      },
      mockStockCard
    ),
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
      const dateSuffix = params?.fromDate || params?.toDate
        ? `Từ ${formatDateForFilename(params.fromDate)} Đến ${formatDateForFilename(params.toDate)}`
        : "";
      const excelName = buildFilename(["Thẻ kho", itemCode, dateSuffix], "xlsx");
      downloadBlob(blob, excelName);
    },
    onSuccess: () => {
      toast.success("Xuất báo cáo thành công");
    },
    onError: () => {
      toast.error("Lỗi khi xuất báo cáo");
    },
  });
};

export interface InventoryHistoryParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  itemType?: string;
  itemCode?: string;
  transactionType?: string;
  search?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface InventoryHistoryResponse {
  items: Array<{
    date?: string;
    voucherCode?: string | null;
    inQuantity?: number;
    outQuantity?: number;
    balance?: number;
    notes?: string | null;
    reference?: string | null;
    voucherType?: string | null;
    voucherId?: number;
    itemName?: string | null;
    itemCode?: string | null;
    unit?: string | null;
    warehouse?: string | null;
  }>;
  totalPages: number;
  total: number;
  size: number;
  page: number;
}

export const useInventoryHistory = (params?: InventoryHistoryParams) => {
  return useQuery({
    queryKey: ["inventory-history", params],
    queryFn: createMockQueryFn(
      async () => {
        const normalizedParams = normalizeParams(
          (params ?? {}) as Record<string, unknown>
        );
        const res = await apiRequest.get<InventoryHistoryResponse>(
          API_SUFFIX.INVENTORY_HISTORY,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockInventoryHistoryPaginate
    ),
  });
};

