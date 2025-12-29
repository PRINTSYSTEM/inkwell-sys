// src/mocks/ar-ap.mock.ts
// Mock data for AR/AP Reports APIs

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

// Mock AR Summary
export const mockARSummary: ARSummaryResponse[] = [
  {
    customerId: 1,
    customerCode: "0001HN",
    customerName: "Công ty TNHH Hóa Nông",
    totalDebt: 50000000,
    currentDebt: 30000000,
    overdueDebt: 20000000,
    lastPaymentDate: "2025-01-10T00:00:00+07:00",
    lastPaymentAmount: 20000000,
  },
];

export const mockARSummaryPaginate: ARSummaryResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockARSummary,
};

// Mock AR Detail
export const mockARDetail: ARDetailResponse[] = [
  {
    id: 1,
    customerId: 1,
    customerCode: "0001HN",
    customerName: "Công ty TNHH Hóa Nông",
    orderId: 1,
    orderCode: "DH25-1",
    invoiceId: 1,
    invoiceNumber: "HD001",
    invoiceDate: "2025-01-15T00:00:00+07:00",
    dueDate: "2025-02-15T00:00:00+07:00",
    invoiceAmount: 50000000,
    paidAmount: 20000000,
    remainingAmount: 30000000,
    isOverdue: false,
    daysOverdue: 0,
  },
];

export const mockARDetailPaginate: ARDetailResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockARDetail,
};

// Mock AR Aging
export const mockARAging: ARAgingResponse[] = [
  {
    customerId: 1,
    customerCode: "0001HN",
    customerName: "Công ty TNHH Hóa Nông",
    current: 10000000,
    days30: 10000000,
    days60: 5000000,
    days90: 3000000,
    over90: 2000000,
    total: 30000000,
  },
];

export const mockARAgingPaginate: ARAgingResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockARAging,
};

// Mock AP Summary
export const mockAPSummary: APSummaryResponse[] = [
  {
    vendorId: 1,
    vendorCode: "V001",
    vendorName: "Công ty Vật tư In ấn ABC",
    totalDebt: 20000000,
    currentDebt: 15000000,
    overdueDebt: 5000000,
    lastPaymentDate: "2025-01-10T00:00:00+07:00",
    lastPaymentAmount: 5000000,
  },
];

export const mockAPSummaryPaginate: APSummaryResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockAPSummary,
};

// Mock AP Detail
export const mockAPDetail: APDetailResponse[] = [
  {
    id: 1,
    vendorId: 1,
    vendorCode: "V001",
    vendorName: "Công ty Vật tư In ấn ABC",
    orderId: 1,
    orderCode: "DH25-1",
    invoiceId: 1,
    invoiceNumber: "HD001",
    invoiceDate: "2025-01-15T00:00:00+07:00",
    dueDate: "2025-02-15T00:00:00+07:00",
    invoiceAmount: 20000000,
    paidAmount: 5000000,
    remainingAmount: 15000000,
    isOverdue: false,
    daysOverdue: 0,
  },
];

export const mockAPDetailPaginate: APDetailResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockAPDetail,
};

// Mock AP Aging
export const mockAPAging: APAgingResponse[] = [
  {
    vendorId: 1,
    vendorCode: "V001",
    vendorName: "Công ty Vật tư In ấn ABC",
    current: 5000000,
    days30: 5000000,
    days60: 3000000,
    days90: 1500000,
    over90: 500000,
    total: 15000000,
  },
];

export const mockAPAgingPaginate: APAgingResponseIPaginate = {
  size: 10,
  page: 1,
  total: 1,
  totalPages: 1,
  items: mockAPAging,
};

// Mock Collection Schedule
export const mockCollectionSchedule: CollectionScheduleResponse[] = [
  {
    id: 1,
    customerId: 1,
    customerCode: "0001HN",
    customerName: "Công ty TNHH Hóa Nông",
    orderId: 1,
    orderCode: "DH25-1",
    invoiceId: 1,
    invoiceNumber: "HD001",
    dueDate: "2025-02-15T00:00:00+07:00",
    amount: 30000000,
    daysUntilDue: 30,
    priority: "high",
  },
];

export const mockCollectionSchedulePaginate: CollectionScheduleResponseIPaginate =
  {
    size: 10,
    page: 1,
    total: 1,
    totalPages: 1,
    items: mockCollectionSchedule,
  };

