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
    materialTypeCode: "0428YV-H001",
    materialTypeName: "Decal Xi Bóng Vàng",
    unit: "m2",
    openingQuantity: 600,
    openingValue: 15000000,
    inQuantity: 200,
    inValue: 5000000,
    outQuantity: 300,
    outValue: 7500000,
    closingQuantity: 500,
    closingValue: 12500000,
  },
  {
    materialTypeId: 2,
    materialTypeCode: "0428YV-H002",
    materialTypeName: "Decal Giấy AL",
    unit: "m2",
    openingQuantity: 1000,
    openingValue: 10000000,
    inQuantity: 500,
    inValue: 5000000,
    outQuantity: 800,
    outValue: 8000000,
    closingQuantity: 700,
    closingValue: 7000000,
  },
  {
    materialTypeId: 3,
    materialTypeCode: "0428YV-H003",
    materialTypeName: "Màng PET 0.12mm",
    unit: "cuộn",
    openingQuantity: 0,
    openingValue: 0,
    inQuantity: 8000,
    inValue: 48000000,
    outQuantity: 2000,
    outValue: 12000000,
    closingQuantity: 6000,
    closingValue: 36000000,
  },
  {
    materialTypeId: 4,
    materialTypeCode: "0428YV-H004",
    materialTypeName: "Thùng Carton 5 lớp",
    unit: "cái",
    openingQuantity: 250,
    openingValue: 6250000,
    inQuantity: 1000,
    inValue: 25000000,
    outQuantity: 1100,
    outValue: 27500000,
    closingQuantity: 150,
    closingValue: 37500000,
  },
  {
    materialTypeId: 5,
    materialTypeCode: "0428YV-H005",
    materialTypeName: "Mực OPP Vàng",
    unit: "kg",
    openingQuantity: 50,
    openingValue: 3500000,
    inQuantity: 20,
    inValue: 1400000,
    outQuantity: 15,
    outValue: 1050000,
    closingQuantity: 55,
    closingValue: 3850000,
  },
];

export const mockInventorySummaryPaginate: InventorySummaryItemResponseIPaginate =
  {
    size: 10,
    page: 1,
    total: 5,
    totalPages: 1,
    items: mockInventorySummary,
  };

// Mock Inventory History
export const mockInventoryHistoryPaginate = {
  size: 10,
  page: 1,
  total: 2,
  totalPages: 1,
  items: [
    {
      date: "2025-01-10T08:00:00+07:00",
      voucherCode: "NK001",
      inQuantity: 200,
      outQuantity: 0,
      balance: 800,
      notes: "Nhập kho vật tư đầu tháng",
      reference: "NK001",
      voucherType: "StockIn",
      voucherId: 1,
      itemName: "Decal Xi Bóng Vàng",
      itemCode: "0428YV-H001",
      unit: "m2",
      warehouse: "Kho chính",
    },
    {
      date: "2025-01-15T08:00:00+07:00",
      voucherCode: "XK001",
      inQuantity: 0,
      outQuantity: 300,
      balance: 500,
      notes: "Xuất kho sản xuất",
      reference: "XK001",
      voucherType: "StockOut",
      voucherId: 1,
      itemName: "Decal Xi Bóng Vàng",
      itemCode: "0428YV-H001",
      unit: "m2",
      warehouse: "Kho chính",
    },
  ],
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

