// src/mocks/bank.mock.ts
// Mock data for Bank Management APIs

import type {
  BankAccountResponse,
  BankAccountResponseIPaginate,
  BankLedgerResponse,
} from "@/Schema/accounting.schema";

// Mock Bank Accounts
export const mockBankAccounts: BankAccountResponse[] = [
  {
    id: 1,
    accountNumber: "1234567890",
    bankName: "Vietcombank",
    bankBranch: "Chi nhánh Hà Nội",
    accountHolder: "Công ty TNHH In ấn ABC",
    description: "Tài khoản chính",
    openingBalance: 100000000,
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
  {
    id: 2,
    accountNumber: "0987654321",
    bankName: "BIDV",
    bankBranch: "Chi nhánh TP.HCM",
    accountHolder: "Công ty TNHH In ấn ABC",
    description: "Tài khoản phụ",
    openingBalance: 50000000,
    isActive: true,
    createdAt: "2025-01-01T00:00:00+07:00",
    updatedAt: null,
  },
];

export const mockBankAccountsPaginate: BankAccountResponseIPaginate = {
  size: 10,
  page: 1,
  total: 2,
  totalPages: 1,
  items: mockBankAccounts,
};

// Mock Bank Ledger
export const mockBankLedger: BankLedgerResponse = {
  bankAccountId: 1,
  bankAccountNumber: "1234567890",
  bankName: "Vietcombank",
  openingBalance: 100000000,
  entries: [
    {
      date: "2025-01-15T08:00:00+07:00",
      voucherCode: "PT001",
      description: "Thu tiền đơn hàng",
      objectName: "Công ty TNHH Hóa Nông",
      debitAmount: 0,
      creditAmount: 20000000,
      runningBalance: 120000000,
      reference: "DH25-1",
      voucherType: "BankReceipt",
      voucherId: 1,
    },
    {
      date: "2025-01-15T09:00:00+07:00",
      voucherCode: "PC001",
      description: "Thanh toán vật tư",
      objectName: "Công ty Vật tư In ấn ABC",
      debitAmount: 10000000,
      creditAmount: 0,
      runningBalance: 110000000,
      reference: "PC001",
      voucherType: "BankPayment",
      voucherId: 1,
    },
  ],
  totalDebit: 10000000,
  totalCredit: 20000000,
  closingBalance: 110000000,
};

