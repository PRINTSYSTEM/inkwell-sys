// src/mocks/inventory.mock.ts
// Mock data for Inventory Reports APIs

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

// Mock Current Stock
export const mockCurrentStock: CurrentStockResponse[] = [
  {
    materialTypeId: 1,
    materialTypeCode: "DECAL-XI-BONG-VANG",
    materialTypeName: "Decal Xi Bóng Vàng",
    designTypeId: 3,
    designTypeCode: "D",
    designTypeName: "Decal",
    currentQuantity: 500,
    reservedQuantity: 100,
    availableQuantity: 400,
    unitPrice: 25000,
    totalValue: 12500000,
  },
];

export const mockCurrentStockPaginate: CurrentStockResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockCurrentStock,
};

// Mock Inventory Summary
export const mockInventorySummary: InventorySummaryItemResponse[] = [
  {
    materialTypeId: 1,
    materialTypeCode: "DECAL-XI-BONG-VANG",
    materialTypeName: "Decal Xi Bóng Vàng",
    openingQuantity: 600,
    openingValue: 15000000,
    inQuantity: 200,
    inValue: 5000000,
    outQuantity: 300,
    outValue: 7500000,
    closingQuantity: 500,
    closingValue: 12500000,
  },
];

export const mockInventorySummaryPaginate: InventorySummaryItemResponseIPaginate =
  {
    size: 10,
    page: 1,
    total: 1,
    totalPages: 1,
    items: mockInventorySummary,
  };

// Mock Low Stock
export const mockLowStock: LowStockResponse[] = [
  {
    materialTypeId: 1,
    materialTypeCode: "DECAL-XI-BONG-VANG",
    materialTypeName: "Decal Xi Bóng Vàng",
    currentQuantity: 50,
    minimumQuantity: 100,
    threshold: 100,
    unitPrice: 25000,
    totalValue: 1250000,
    lastStockInDate: "2025-01-10T00:00:00+07:00",
    lastStockOutDate: "2025-01-15T00:00:00+07:00",
  },
];

export const mockLowStockPaginate: LowStockResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockLowStock,
};

// Mock Slow Moving
export const mockSlowMoving: SlowMovingResponse[] = [
  {
    materialTypeId: 1,
    materialTypeCode: "DECAL-XI-BONG-VANG",
    materialTypeName: "Decal Xi Bóng Vàng",
    currentQuantity: 500,
    lastStockOutDate: "2024-12-01T00:00:00+07:00",
    daysSinceLastOut: 45,
    unitPrice: 25000,
    totalValue: 12500000,
  },
];

export const mockSlowMovingPaginate: SlowMovingResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockSlowMoving,
};

// Mock Stock Card
export const mockStockCard: StockCardResponse = {
  itemCode: "DECAL-XI-BONG-VANG",
  itemName: "Decal Xi Bóng Vàng",
  unit: "m2",
  openingBalance: 600,
  openingValue: 15000000,
  entries: [
    {
      date: "2025-01-10T08:00:00+07:00",
      voucherCode: "NK001",
      description: "Nhập kho",
      inQuantity: 200,
      inValue: 5000000,
      outQuantity: 0,
      outValue: 0,
      runningBalance: 800,
      runningValue: 20000000,
      reference: "NK001",
      voucherType: "StockIn",
      voucherId: 1,
    },
    {
      date: "2025-01-15T08:00:00+07:00",
      voucherCode: "XK001",
      description: "Xuất kho",
      inQuantity: 0,
      inValue: 0,
      outQuantity: 300,
      outValue: 7500000,
      runningBalance: 500,
      runningValue: 12500000,
      reference: "XK001",
      voucherType: "StockOut",
      voucherId: 1,
    },
  ],
  totalInQuantity: 200,
  totalInValue: 5000000,
  totalOutQuantity: 300,
  totalOutValue: 7500000,
  closingBalance: 500,
  closingValue: 12500000,
};

