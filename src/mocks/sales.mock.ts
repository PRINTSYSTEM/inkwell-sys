// src/mocks/sales.mock.ts
// Mock data for Sales Reports APIs

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

// Mock Sales by Period
export const mockSalesByPeriod: SalesByPeriodResponse[] = [
  {
    period: "2025-01",
    periodType: "month",
    orderCount: 10,
    totalQuantity: 5000,
    totalRevenue: 50000000,
    totalCost: 30000000,
    totalProfit: 20000000,
    profitMargin: 40,
  },
];

export const mockSalesByPeriodPaginate: SalesByPeriodResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockSalesByPeriod,
};

// Mock Sales by Customer
export const mockSalesByCustomer: SalesByCustomerResponse[] = [
  {
    customerId: 1,
    customerCode: "0001HN",
    customerName: "Công ty TNHH Hóa Nông",
    orderCount: 5,
    totalQuantity: 2500,
    totalRevenue: 25000000,
    totalCost: 15000000,
    totalProfit: 10000000,
    profitMargin: 40,
    lastOrderDate: "2025-01-15T00:00:00+07:00",
  },
];

export const mockSalesByCustomerPaginate: SalesByCustomerResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockSalesByCustomer,
};

// Mock Sales by Dimension
export const mockSalesByDimension: SalesByDimensionResponse[] = [
  {
    dimensionType: "designType",
    dimensionValue: "Decal",
    dimensionCode: "D",
    orderCount: 8,
    totalQuantity: 4000,
    totalRevenue: 40000000,
    totalCost: 24000000,
    totalProfit: 16000000,
    profitMargin: 40,
  },
];

export const mockSalesByDimensionPaginate: SalesByDimensionResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockSalesByDimension,
};

// Mock Top Products
export const mockTopProducts: TopProductResponse[] = [
  {
    designId: 1,
    designCode: "0001HN-D001",
    designName: "Decal đẹp",
    materialTypeId: 21,
    materialTypeCode: "DECAL-XI-BONG-VANG",
    materialTypeName: "Decal Xi Bóng Vàng",
    totalQuantity: 1000,
    totalRevenue: 25000000,
    orderCount: 5,
    averagePrice: 25000,
  },
];

export const mockTopProductsPaginate: TopProductResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockTopProducts,
};

// Mock Returns Discounts
export const mockReturnsDiscounts: ReturnsDiscountsResponse[] = [
  {
    id: 1,
    orderId: 1,
    orderCode: "DH25-1",
    date: "2025-01-15T00:00:00+07:00",
    type: "return",
    amount: 1000000,
    reason: "Hàng lỗi",
    description: "Trả hàng do lỗi in ấn",
  },
];

export const mockReturnsDiscountsPaginate: ReturnsDiscountsResponseIPaginate =
  {
    size: 10,
    page: 1,
    total: 1,
    totalPages: 1,
    items: mockReturnsDiscounts,
  };

// Mock Order Drill Down
export const mockOrderDrillDown: OrderDrillDownResponse[] = [
  {
    orderId: 1,
    orderCode: "DH25-1",
    orderDate: "2025-01-15T00:00:00+07:00",
    customerId: 1,
    customerCode: "0001HN",
    customerName: "Công ty TNHH Hóa Nông",
    totalAmount: 50000000,
    totalQuantity: 1000,
    status: "completed",
    deliveryDate: "2025-01-20T00:00:00+07:00",
  },
];

export const mockOrderDrillDownPaginate: OrderDrillDownResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockOrderDrillDown,
};

