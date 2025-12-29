// src/mocks/expense.mock.ts
// Mock data for Expense Category and Payment Method APIs

import type {
  ExpenseCategoryResponse,
  ExpenseCategoryResponseIPaginate,
  PaymentMethodResponse,
  PaymentMethodResponseIPaginate,
} from "@/Schema/accounting.schema";

// Mock Expense Categories
export const mockExpenseCategories: ExpenseCategoryResponse[] = [
  {
    id: 1,
    code: "CPVT",
    name: "Chi phí vật tư",
    type: "expense",
    description: "Chi phí mua vật tư in ấn",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
  {
    id: 2,
    code: "CPVC",
    name: "Chi phí vận chuyển",
    type: "expense",
    description: "Chi phí vận chuyển hàng hóa",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
  {
    id: 3,
    code: "CPNS",
    name: "Chi phí nhân sự",
    type: "expense",
    description: "Chi phí lương và phụ cấp",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
  {
    id: 4,
    code: "THDT",
    name: "Thu từ đơn hàng",
    type: "income",
    description: "Thu tiền từ đơn hàng",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
];

export const mockExpenseCategoriesPaginate: ExpenseCategoryResponseIPaginate =
  {
    size: 10,
    page: 1,
    total: 4,
    totalPages: 1,
    items: mockExpenseCategories,
  };

// Mock Payment Methods
export const mockPaymentMethods: PaymentMethodResponse[] = [
  {
    id: 1,
    code: "TM",
    name: "Tiền mặt",
    description: "Thanh toán bằng tiền mặt",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
  {
    id: 2,
    code: "CK",
    name: "Chuyển khoản",
    description: "Thanh toán qua chuyển khoản ngân hàng",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
  {
    id: 3,
    code: "TT",
    name: "Thẻ tín dụng",
    description: "Thanh toán bằng thẻ tín dụng",
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
];

export const mockPaymentMethodsPaginate: PaymentMethodResponseIPaginate = {
  size: 10,
  page: 1,
  total: 3,
  totalPages: 1,
  items: mockPaymentMethods,
};

