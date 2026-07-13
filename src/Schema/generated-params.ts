/* AUTO-GENERATED FILE. DO NOT EDIT. */
/* Source: src/generated/openapi.zod.ts */
/* Generated at: 2026-07-12T08:56:24.231Z */

import { z } from "zod";
import { IdSchema, PagedParamsSchema } from "./Common";

// ===== Generated Params Schemas =====

// ==== AccountingOrderConfirmDepositParams (POST /api/accounting/order/:orderId/confirm-deposit) ====
export const AccountingOrderConfirmDepositParamsSchema = z.object({
  depositAmount: z.number().nullable().optional(),
}).passthrough();
export type AccountingOrderConfirmDepositParams = z.infer<typeof AccountingOrderConfirmDepositParamsSchema>;

// ==== ArLedgerListParams (GET /api/ar-ledger) ====
export const ArLedgerListParamsSchema = z.object({
  customerId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
}).passthrough();
export type ArLedgerListParams = z.infer<typeof ArLedgerListParamsSchema>;

// ==== BankAccountsListParams (GET /api/categories/bank-accounts) ====
export const BankAccountsListParamsSchema = PagedParamsSchema.extend({
  isActive: z.boolean().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type BankAccountsListParams = z.infer<typeof BankAccountsListParamsSchema>;

// ==== BankLedgerListParams (GET /api/bank-ledger) ====
export const BankLedgerListParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  bankAccountId: z.number().int().nullable().optional(),
}).passthrough();
export type BankLedgerListParams = z.infer<typeof BankLedgerListParamsSchema>;

// ==== CashBookListParams (GET /api/cash-book) ====
export const CashBookListParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  accountCode: z.string().nullable().optional(),
}).passthrough();
export type CashBookListParams = z.infer<typeof CashBookListParamsSchema>;

// ==== CashPaymentExportParams (GET /api/cash-payments/export) ====
export const CashPaymentExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.string().nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  expenseCategoryId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type CashPaymentExportParams = z.infer<typeof CashPaymentExportParamsSchema>;

// ==== CashPaymentListParams (GET /api/cash-payments) ====
export const CashPaymentListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.string().nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  expenseCategoryId: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type CashPaymentListParams = z.infer<typeof CashPaymentListParamsSchema>;

// ==== CashReceiptExportParams (GET /api/cash-receipts/export) ====
export const CashReceiptExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.string().nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type CashReceiptExportParams = z.infer<typeof CashReceiptExportParamsSchema>;

// ==== CashReceiptListParams (GET /api/cash-receipts) ====
export const CashReceiptListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.string().nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  paymentMethodId: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type CashReceiptListParams = z.infer<typeof CashReceiptListParamsSchema>;

// ==== CustomerAddressesParams (GET /api/customers/:id/addresses) ====
export const CustomerAddressesParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type CustomerAddressesParams = z.infer<typeof CustomerAddressesParamsSchema>;

// ==== CustomerDebtHistoryParams (GET /api/customers/:id/debt-history) ====
export const CustomerDebtHistoryParamsSchema = PagedParamsSchema.extend({
  filterType: z.string().nullable().optional(),
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type CustomerDebtHistoryParams = z.infer<typeof CustomerDebtHistoryParamsSchema>;

// ==== CustomerDebtStatementParams (GET /api/customers/:id/debt-statement) ====
export const CustomerDebtStatementParamsSchema = z.object({
  month: z.number().int().nullable().optional(),
  year: z.number().int().nullable().optional(),
}).passthrough();
export type CustomerDebtStatementParams = z.infer<typeof CustomerDebtStatementParamsSchema>;

// ==== CustomerDebtSummaryParams (GET /api/customers/:id/debt-summary) ====
export const CustomerDebtSummaryParamsSchema = z.object({
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type CustomerDebtSummaryParams = z.infer<typeof CustomerDebtSummaryParamsSchema>;

// ==== CustomerListParams (GET /api/customers) ====
export const CustomerListParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  debtStatus: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type CustomerListParams = z.infer<typeof CustomerListParamsSchema>;

// ==== CustomerMonthlyDebtParams (GET /api/customers/:id/monthly-debt) ====
export const CustomerMonthlyDebtParamsSchema = PagedParamsSchema.extend({
  year: z.number().int().nullable().optional(),
  month: z.number().int().nullable().optional(),
});
export type CustomerMonthlyDebtParams = z.infer<typeof CustomerMonthlyDebtParamsSchema>;

// ==== CustomerOrdersParams (GET /api/customers/:id/order-history) ====
export const CustomerOrdersParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type CustomerOrdersParams = z.infer<typeof CustomerOrdersParamsSchema>;

// ==== DebtNotificationListParams (GET /api/debt-notifications) ====
export const DebtNotificationListParamsSchema = PagedParamsSchema.extend({
  type: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  isRead: z.boolean().nullable().optional(),
});
export type DebtNotificationListParams = z.infer<typeof DebtNotificationListParamsSchema>;

// ==== DebtReconciliationApDownloadParams (GET /api/debt-reconciliations/ap/:id/download) ====
export const DebtReconciliationApDownloadParamsSchema = z.object({
  format: z.string().nullable().optional(),
}).passthrough();
export type DebtReconciliationApDownloadParams = z.infer<typeof DebtReconciliationApDownloadParamsSchema>;

// ==== DebtReconciliationArDownloadParams (GET /api/debt-reconciliations/ar/:id/download) ====
export const DebtReconciliationArDownloadParamsSchema = z.object({
  format: z.string().nullable().optional(),
}).passthrough();
export type DebtReconciliationArDownloadParams = z.infer<typeof DebtReconciliationArDownloadParamsSchema>;

// ==== DebtReportApAgingParams (GET /api/debt-reports/ap-aging) ====
export const DebtReportApAgingParamsSchema = PagedParamsSchema.extend({
  asOfDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApAgingParams = z.infer<typeof DebtReportApAgingParamsSchema>;

// ==== DebtReportApByPurchaseInvoiceParams (GET /api/debt-reports/ap-by-purchase-invoice) ====
export const DebtReportApByPurchaseInvoiceParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApByPurchaseInvoiceParams = z.infer<typeof DebtReportApByPurchaseInvoiceParamsSchema>;

// ==== DebtReportApDetailLedgerExportParams (GET /api/debt-reports/ap-detail-ledger/:vendorId/export) ====
export const DebtReportApDetailLedgerExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type DebtReportApDetailLedgerExportParams = z.infer<typeof DebtReportApDetailLedgerExportParamsSchema>;

// ==== DebtReportApDetailLedgerParams (GET /api/debt-reports/ap-detail-ledger/:vendorId) ====
export const DebtReportApDetailLedgerParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApDetailLedgerParams = z.infer<typeof DebtReportApDetailLedgerParamsSchema>;

// ==== DebtReportApDetailParams (GET /api/debt-reports/ap-detail) ====
export const DebtReportApDetailParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApDetailParams = z.infer<typeof DebtReportApDetailParamsSchema>;

// ==== DebtReportApItemsParams (GET /api/debt-reports/ap-items) ====
export const DebtReportApItemsParamsSchema = PagedParamsSchema.extend({
  vendorId: z.number().int().nullable().optional(),
  vendorType: z.string().nullable().optional(),
  documentType: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApItemsParams = z.infer<typeof DebtReportApItemsParamsSchema>;

// ==== DebtReportApOverdueParams (GET /api/debt-reports/ap-overdue) ====
export const DebtReportApOverdueParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApOverdueParams = z.infer<typeof DebtReportApOverdueParamsSchema>;

// ==== DebtReportApReconciliationExportParams (GET /api/debt-reports/ap-reconciliation/:vendorId/export) ====
export const DebtReportApReconciliationExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type DebtReportApReconciliationExportParams = z.infer<typeof DebtReportApReconciliationExportParamsSchema>;

// ==== DebtReportApReconciliationParams (GET /api/debt-reports/ap-reconciliation/:vendorId) ====
export const DebtReportApReconciliationParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type DebtReportApReconciliationParams = z.infer<typeof DebtReportApReconciliationParamsSchema>;

// ==== DebtReportApSummaryParams (GET /api/debt-reports/ap-summary) ====
export const DebtReportApSummaryParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApSummaryParams = z.infer<typeof DebtReportApSummaryParamsSchema>;

// ==== DebtReportApSummaryReportParams (GET /api/debt-reports/ap-summary-report) ====
export const DebtReportApSummaryReportParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportApSummaryReportParams = z.infer<typeof DebtReportApSummaryReportParamsSchema>;

// ==== DebtReportArAgingExportPdfParams (GET /api/debt-reports/ar-aging/export-pdf) ====
export const DebtReportArAgingExportPdfParamsSchema = z.object({
  asOfDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
}).passthrough();
export type DebtReportArAgingExportPdfParams = z.infer<typeof DebtReportArAgingExportPdfParamsSchema>;

// ==== DebtReportArAgingParams (GET /api/debt-reports/ar-aging) ====
export const DebtReportArAgingParamsSchema = PagedParamsSchema.extend({
  asOfDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArAgingParams = z.infer<typeof DebtReportArAgingParamsSchema>;

// ==== DebtReportArByItemParams (GET /api/debt-reports/ar-by-item) ====
export const DebtReportArByItemParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArByItemParams = z.infer<typeof DebtReportArByItemParamsSchema>;

// ==== DebtReportArDetailByInvoiceParams (GET /api/debt-reports/ar-detail-by-invoice) ====
export const DebtReportArDetailByInvoiceParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArDetailByInvoiceParams = z.infer<typeof DebtReportArDetailByInvoiceParamsSchema>;

// ==== DebtReportArDetailLedgerParams (GET /api/debt-reports/ar-detail-ledger/:customerId) ====
export const DebtReportArDetailLedgerParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArDetailLedgerParams = z.infer<typeof DebtReportArDetailLedgerParamsSchema>;

// ==== DebtReportArDetailParams (GET /api/debt-reports/ar-detail) ====
export const DebtReportArDetailParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArDetailParams = z.infer<typeof DebtReportArDetailParamsSchema>;

// ==== DebtReportArOverdueParams (GET /api/debt-reports/ar-overdue) ====
export const DebtReportArOverdueParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArOverdueParams = z.infer<typeof DebtReportArOverdueParamsSchema>;

// ==== DebtReportArSummaryByBranchParams (GET /api/debt-reports/ar-summary-by-branch) ====
export const DebtReportArSummaryByBranchParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArSummaryByBranchParams = z.infer<typeof DebtReportArSummaryByBranchParamsSchema>;

// ==== DebtReportArSummaryByCustomerGroupParams (GET /api/debt-reports/ar-summary-by-customer-group) ====
export const DebtReportArSummaryByCustomerGroupParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArSummaryByCustomerGroupParams = z.infer<typeof DebtReportArSummaryByCustomerGroupParamsSchema>;

// ==== DebtReportArSummaryExportPdfParams (GET /api/debt-reports/ar-summary/export-pdf) ====
export const DebtReportArSummaryExportPdfParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
}).passthrough();
export type DebtReportArSummaryExportPdfParams = z.infer<typeof DebtReportArSummaryExportPdfParamsSchema>;

// ==== DebtReportArSummaryParams (GET /api/debt-reports/ar-summary) ====
export const DebtReportArSummaryParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArSummaryParams = z.infer<typeof DebtReportArSummaryParamsSchema>;

// ==== DebtReportArUnderdueParams (GET /api/debt-reports/ar-underdue) ====
export const DebtReportArUnderdueParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportArUnderdueParams = z.infer<typeof DebtReportArUnderdueParamsSchema>;

// ==== DebtReportCollectionScheduleParams (GET /api/debt-reports/collection-schedule) ====
export const DebtReportCollectionScheduleParamsSchema = PagedParamsSchema.extend({
  dueDateFrom: z.string().datetime({ offset: true }).nullable().optional(),
  dueDateTo: z.string().datetime({ offset: true }).nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DebtReportCollectionScheduleParams = z.infer<typeof DebtReportCollectionScheduleParamsSchema>;

// ==== DebtReportCustomerReconciliationExportPdfParams (GET /api/debt-reports/customer-reconciliation/export-pdf) ====
export const DebtReportCustomerReconciliationExportPdfParamsSchema = z.object({
  customerId: z.number().int().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type DebtReportCustomerReconciliationExportPdfParams = z.infer<typeof DebtReportCustomerReconciliationExportPdfParamsSchema>;

// ==== DebtReportCustomerReconciliationExportWordParams (GET /api/debt-reports/customer-reconciliation/export-word) ====
export const DebtReportCustomerReconciliationExportWordParamsSchema = z.object({
  customerId: z.number().int().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type DebtReportCustomerReconciliationExportWordParams = z.infer<typeof DebtReportCustomerReconciliationExportWordParamsSchema>;

// ==== DebtReportsApAgingExportParams (GET /api/debt-reports/ap-aging/export) ====
export const DebtReportsApAgingExportParamsSchema = z.object({
  asOfDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type DebtReportsApAgingExportParams = z.infer<typeof DebtReportsApAgingExportParamsSchema>;

// ==== DebtReportsApSummaryExportParams (GET /api/debt-reports/ap-summary/export) ====
export const DebtReportsApSummaryExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type DebtReportsApSummaryExportParams = z.infer<typeof DebtReportsApSummaryExportParamsSchema>;

// ==== DebtReportsArAgingExportParams (GET /api/debt-reports/ar-aging/export) ====
export const DebtReportsArAgingExportParamsSchema = z.object({
  asOfDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type DebtReportsArAgingExportParams = z.infer<typeof DebtReportsArAgingExportParamsSchema>;

// ==== DebtReportsArOverdueExportParams (GET /api/debt-reports/ar-overdue/export) ====
export const DebtReportsArOverdueExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type DebtReportsArOverdueExportParams = z.infer<typeof DebtReportsArOverdueExportParamsSchema>;

// ==== DebtReportsArSummaryExportParams (GET /api/debt-reports/ar-summary/export) ====
export const DebtReportsArSummaryExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type DebtReportsArSummaryExportParams = z.infer<typeof DebtReportsArSummaryExportParamsSchema>;

// ==== DebtReportsCustomerReconciliationExportParams (GET /api/debt-reports/customer-reconciliation/export) ====
export const DebtReportsCustomerReconciliationExportParamsSchema = z.object({
  customerId: z.number().int().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type DebtReportsCustomerReconciliationExportParams = z.infer<typeof DebtReportsCustomerReconciliationExportParamsSchema>;

// ==== DefectRecordByProductionOrderParams (GET /api/defect-records/by-production-order/:productionOrderId) ====
export const DefectRecordByProductionOrderParamsSchema = PagedParamsSchema.extend({
});
export type DefectRecordByProductionOrderParams = z.infer<typeof DefectRecordByProductionOrderParamsSchema>;

// ==== DefectRecordExportExcelParams (GET /api/defect-records/export-excel) ====
export const DefectRecordExportExcelParamsSchema = z.object({
  assignedToUserId: z.number().int().nullable().optional(),
  defectSource: z.string().nullable().optional(),
  productionOrderId: z.number().int().nullable().optional(),
  designId: z.number().int().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type DefectRecordExportExcelParams = z.infer<typeof DefectRecordExportExcelParamsSchema>;

// ==== DefectRecordListParams (GET /api/defect-records) ====
export const DefectRecordListParamsSchema = PagedParamsSchema.extend({
  assignedToUserId: z.number().int().nullable().optional(),
  defectSource: z.string().nullable().optional(),
  productionOrderId: z.number().int().nullable().optional(),
  designId: z.number().int().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DefectRecordListParams = z.infer<typeof DefectRecordListParamsSchema>;

// ==== DefectRecordSummaryByUserParams (GET /api/defect-records/summary-by-user) ====
export const DefectRecordSummaryByUserParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  defectSource: z.string().nullable().optional(),
}).passthrough();
export type DefectRecordSummaryByUserParams = z.infer<typeof DefectRecordSummaryByUserParamsSchema>;

// ==== DeliveryNoteAvailableOrderDetailsParams (GET /api/delivery-notes/available-order-details) ====
export const DeliveryNoteAvailableOrderDetailsParamsSchema = z.object({
  customerId: z.number().int().nullable().optional(),
}).passthrough();
export type DeliveryNoteAvailableOrderDetailsParams = z.infer<typeof DeliveryNoteAvailableOrderDetailsParamsSchema>;

// ==== DeliveryNoteAvailableOrdersListParams (GET /api/delivery-notes/available-orders) ====
export const DeliveryNoteAvailableOrdersListParamsSchema = PagedParamsSchema.extend({
  searchTerm: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  proofingOrderCode: z.string().nullable().optional(),
});
export type DeliveryNoteAvailableOrdersListParams = z.infer<typeof DeliveryNoteAvailableOrdersListParamsSchema>;

// ==== DeliveryNoteExportPdfParams (GET /api/delivery-notes/:id/export-pdf) ====
export const DeliveryNoteExportPdfParamsSchema = z.object({
  type: z.string().nullable().optional(),
}).passthrough();
export type DeliveryNoteExportPdfParams = z.infer<typeof DeliveryNoteExportPdfParamsSchema>;

// ==== DeliveryNoteFailureReasonsListParams (GET /api/delivery-notes/failure-reasons) ====
export const DeliveryNoteFailureReasonsListParamsSchema = z.object({
  allowRedeliveryOnly: z.boolean().nullable().optional(),
}).passthrough();
export type DeliveryNoteFailureReasonsListParams = z.infer<typeof DeliveryNoteFailureReasonsListParamsSchema>;

// ==== DeliveryNoteListParams (GET /api/delivery-notes) ====
export const DeliveryNoteListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DeliveryNoteListParams = z.infer<typeof DeliveryNoteListParamsSchema>;

// ==== DesignByCustomerParams (GET /api/designs/by-customer/:customerId) ====
export const DesignByCustomerParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignByCustomerParams = z.infer<typeof DesignByCustomerParamsSchema>;

// ==== DesignListParams (GET /api/designs) ====
export const DesignListParamsSchema = PagedParamsSchema.extend({
  designerId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  month: z.number().int().nullable().optional(),
  year: z.number().int().nullable().optional(),
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
  designTypeId: z.number().int().nullable().optional(),
  materialTypeId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignListParams = z.infer<typeof DesignListParamsSchema>;

// ==== DesignMaterialsDesignTypeParams (GET /api/designs/materials/design-type/:designTypeId) ====
export const DesignMaterialsDesignTypeParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  isSystem: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignMaterialsDesignTypeParams = z.infer<typeof DesignMaterialsDesignTypeParamsSchema>;

// ==== DesignSaleParams (GET /api/designs/sale) ====
export const DesignSaleParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  designType: z.string().nullable().optional(),
  materialType: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignSaleParams = z.infer<typeof DesignSaleParamsSchema>;

// ==== DesignTimelineParams (GET /api/designs/:id/timeline) ====
export const DesignTimelineParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignTimelineParams = z.infer<typeof DesignTimelineParamsSchema>;

// ==== DesignTypeListParams (GET /api/designs/types) ====
export const DesignTypeListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  searchQuery: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignTypeListParams = z.infer<typeof DesignTypeListParamsSchema>;

// ==== DesignUserParams (GET /api/designs/user/:userId) ====
export const DesignUserParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  month: z.number().int().nullable().optional(),
  year: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DesignUserParams = z.infer<typeof DesignUserParamsSchema>;

// ==== DieListParams (GET /api/dies) ====
export const DieListParamsSchema = PagedParamsSchema.extend({
  q: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerCode: z.string().nullable().optional(),
  designName: z.string().nullable().optional(),
  designCode: z.string().nullable().optional(),
  designTypeName: z.string().nullable().optional(),
  proofingOrderCode: z.string().nullable().optional(),
  vendorName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isUsable: z.boolean().nullable().optional(),
  location: z.string().nullable().optional(),
  designId: z.number().int().nullable().optional(),
  designTypeId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type DieListParams = z.infer<typeof DieListParamsSchema>;

// ==== DyRelatedParams (GET /api/dies/related) ====
export const DyRelatedParamsSchema = z.object({
  designId: z.number().int().nullable().optional(),
}).passthrough();
export type DyRelatedParams = z.infer<typeof DyRelatedParamsSchema>;

// ==== DyRelatedProofingOrderParams (GET /api/dies/related/proofing-order/:proofingOrderId) ====
export const DyRelatedProofingOrderParamsSchema = z.object({
  relevance: z.string().nullable().optional(),
  customer: z.string().nullable().optional(),
}).passthrough();
export type DyRelatedProofingOrderParams = z.infer<typeof DyRelatedProofingOrderParamsSchema>;

// ==== ExpenseCategoriesListParams (GET /api/categories/expense-categories) ====
export const ExpenseCategoriesListParamsSchema = PagedParamsSchema.extend({
  type: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ExpenseCategoriesListParams = z.infer<typeof ExpenseCategoriesListParamsSchema>;

// ==== FinanceAccountSearchParams (GET /api/finance-accounts/search) ====
export const FinanceAccountSearchParamsSchema = z.object({
  q: z.string().nullable().optional(),
}).passthrough();
export type FinanceAccountSearchParams = z.infer<typeof FinanceAccountSearchParamsSchema>;

// ==== FinanceAccountTreeParams (GET /api/finance-accounts/tree) ====
export const FinanceAccountTreeParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type FinanceAccountTreeParams = z.infer<typeof FinanceAccountTreeParamsSchema>;

// ==== InventoryBalanceParams (GET /api/inventory/balance) ====
export const InventoryBalanceParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
});
export type InventoryBalanceParams = z.infer<typeof InventoryBalanceParamsSchema>;

// ==== InventoryReportCurrentStockParams (GET /api/inventory-reports/current-stock) ====
export const InventoryReportCurrentStockParamsSchema = PagedParamsSchema.extend({
  asOfDate: z.string().datetime({ offset: true }).nullable().optional(),
  warehouse: z.string().nullable().optional(),
  itemGroup: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  designTypeId: z.number().int().nullable().optional(),
  materialTypeId: z.number().int().nullable().optional(),
  length: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
});
export type InventoryReportCurrentStockParams = z.infer<typeof InventoryReportCurrentStockParamsSchema>;

// ==== InventoryReportHistoryParams (GET /api/inventory-reports/history) ====
export const InventoryReportHistoryParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  itemType: z.string().nullable().optional(),
  itemCode: z.string().nullable().optional(),
  transactionType: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type InventoryReportHistoryParams = z.infer<typeof InventoryReportHistoryParamsSchema>;

// ==== InventoryReportLowStockParams (GET /api/inventory-reports/low-stock) ====
export const InventoryReportLowStockParamsSchema = PagedParamsSchema.extend({
  warehouse: z.string().nullable().optional(),
  itemGroup: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
});
export type InventoryReportLowStockParams = z.infer<typeof InventoryReportLowStockParamsSchema>;

// ==== InventoryReportMaterialHistoryExcelParams (GET /api/inventory-reports/material-history/:materialId/excel) ====
export const InventoryReportMaterialHistoryExcelParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type InventoryReportMaterialHistoryExcelParams = z.infer<typeof InventoryReportMaterialHistoryExcelParamsSchema>;

// ==== InventoryReportSlowMovingParams (GET /api/inventory-reports/slow-moving) ====
export const InventoryReportSlowMovingParamsSchema = PagedParamsSchema.extend({
  warehouse: z.string().nullable().optional(),
  daysThreshold: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
});
export type InventoryReportSlowMovingParams = z.infer<typeof InventoryReportSlowMovingParamsSchema>;

// ==== InventoryReportStockCardExcelParams (GET /api/inventory-reports/stock-card/:itemCode/excel) ====
export const InventoryReportStockCardExcelParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  warehouse: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
}).passthrough();
export type InventoryReportStockCardExcelParams = z.infer<typeof InventoryReportStockCardExcelParamsSchema>;

// ==== InventoryReportStockCardParams (GET /api/inventory-reports/stock-card/:itemCode) ====
export const InventoryReportStockCardParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  warehouse: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
}).passthrough();
export type InventoryReportStockCardParams = z.infer<typeof InventoryReportStockCardParamsSchema>;

// ==== InventoryReportSummaryExcelParams (GET /api/inventory-reports/summary/excel) ====
export const InventoryReportSummaryExcelParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  warehouse: z.string().nullable().optional(),
  itemGroup: z.string().nullable().optional(),
  itemCode: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  hideEmpty: z.boolean().nullable().optional(),
}).passthrough();
export type InventoryReportSummaryExcelParams = z.infer<typeof InventoryReportSummaryExcelParamsSchema>;

// ==== InventoryReportSummaryParams (GET /api/inventory-reports/summary) ====
export const InventoryReportSummaryParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  warehouse: z.string().nullable().optional(),
  itemGroup: z.string().nullable().optional(),
  itemCode: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  hideEmpty: z.boolean().nullable().optional(),
});
export type InventoryReportSummaryParams = z.infer<typeof InventoryReportSummaryParamsSchema>;

// ==== InventoryReportSummaryPdfParams (GET /api/inventory-reports/summary/pdf) ====
export const InventoryReportSummaryPdfParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  itemType: z.string().nullable().optional(),
}).passthrough();
export type InventoryReportSummaryPdfParams = z.infer<typeof InventoryReportSummaryPdfParamsSchema>;

// ==== InventoryReportVendorReconciliationExcelParams (GET /api/inventory-reports/vendor-reconciliation/:vendorId/excel) ====
export const InventoryReportVendorReconciliationExcelParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type InventoryReportVendorReconciliationExcelParams = z.infer<typeof InventoryReportVendorReconciliationExcelParamsSchema>;

// ==== InventoryReportVendorReconciliationParams (GET /api/inventory-reports/vendor-reconciliation/:vendorId) ====
export const InventoryReportVendorReconciliationParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type InventoryReportVendorReconciliationParams = z.infer<typeof InventoryReportVendorReconciliationParamsSchema>;

// ==== InventoryTransactionsParams (GET /api/inventory/transactions) ====
export const InventoryTransactionsParamsSchema = PagedParamsSchema.extend({
  itemCode: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  transactionType: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  search: z.string().nullable().optional(),
});
export type InventoryTransactionsParams = z.infer<typeof InventoryTransactionsParamsSchema>;

// ==== InvoicBillableItemsParams (GET /api/invoices/billable-items) ====
export const InvoicBillableItemsParamsSchema = z.object({
  customerId: z.number().int().nullable().optional(),
}).passthrough();
export type InvoicBillableItemsParams = z.infer<typeof InvoicBillableItemsParamsSchema>;

// ==== InvoicByOrderParams (GET /api/invoices/by-order/:orderId) ====
export const InvoicByOrderParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type InvoicByOrderParams = z.infer<typeof InvoicByOrderParamsSchema>;

// ==== InvoicesVoidParams (PUT /api/invoices/:id/void) ====
export const InvoicesVoidParamsSchema = z.object({
  reason: z.string().nullable().optional(),
}).passthrough();
export type InvoicesVoidParams = z.infer<typeof InvoicesVoidParamsSchema>;

// ==== InvoicListParams (GET /api/invoices) ====
export const InvoicListParamsSchema = PagedParamsSchema.extend({
  CustomerId: z.number().int().nullable().optional(),
  SalespersonId: z.number().int().nullable().optional(),
  Status: z.string().min(0).max(20).nullable().optional(),
  FromDate: z.string().datetime({ offset: true }).nullable().optional(),
  ToDate: z.string().datetime({ offset: true }).nullable().optional(),
  Search: z.string().min(0).max(100).nullable().optional(),
  SortColumn: z.string().nullable().optional(),
  SortOrder: z.string().nullable().optional(),
});
export type InvoicListParams = z.infer<typeof InvoicListParamsSchema>;

// ==== MaterialCutListParams (GET /api/material-cuts) ====
export const MaterialCutListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  inputMaterialId: z.number().int().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type MaterialCutListParams = z.infer<typeof MaterialCutListParamsSchema>;

// ==== MaterialFamilieListParams (GET /api/material-families) ====
export const MaterialFamilieListParamsSchema = z.object({
  page: z.number().int().nullable().optional(),
  size: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
}).passthrough();
export type MaterialFamilieListParams = z.infer<typeof MaterialFamilieListParamsSchema>;

// ==== MaterialHistoryParams (GET /api/materials/:id/history) ====
export const MaterialHistoryParamsSchema = PagedParamsSchema.extend({
  transactionType: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
});
export type MaterialHistoryParams = z.infer<typeof MaterialHistoryParamsSchema>;

// ==== MaterialListParams (GET /api/materials) ====
export const MaterialListParamsSchema = PagedParamsSchema.extend({
  name: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  quantityMin: z.number().int().nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  type: z.string().nullable().optional(),
  materialFamilyId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  designId: z.number().int().nullable().optional(),
  designMaterialTypeId: z.number().int().nullable().optional(),
  basisWeight: z.number().int().nullable().optional(),
  proofingOrderId: z.number().int().nullable().optional(),
  productionOrderId: z.number().int().nullable().optional(),
});
export type MaterialListParams = z.infer<typeof MaterialListParamsSchema>;

// ==== MaterialTypeListParams (GET /api/designs/materials) ====
export const MaterialTypeListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  isSystem: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type MaterialTypeListParams = z.infer<typeof MaterialTypeListParamsSchema>;

// ==== MaterialTypeSpecsPaginatedParams (GET /api/material-types/:materialTypeId/specs/paginated) ====
export const MaterialTypeSpecsPaginatedParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
});
export type MaterialTypeSpecsPaginatedParams = z.infer<typeof MaterialTypeSpecsPaginatedParamsSchema>;

// ==== MyDesignListParams (GET /api/designs/my) ====
export const MyDesignListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  month: z.number().int().nullable().optional(),
  year: z.number().int().nullable().optional(),
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type MyDesignListParams = z.infer<typeof MyDesignListParamsSchema>;

// ==== NotificationListParams (GET /api/notifications) ====
export const NotificationListParamsSchema = PagedParamsSchema.extend({
  isRead: z.boolean().nullable().optional(),
});
export type NotificationListParams = z.infer<typeof NotificationListParamsSchema>;

// ==== OrderListParams (GET /api/orders) ====
export const OrderListParamsSchema = PagedParamsSchema.extend({
  customerId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type OrderListParams = z.infer<typeof OrderListParamsSchema>;

// ==== OrdersForAccountingListParams (GET /api/orders/for-accounting) ====
export const OrdersForAccountingListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  filterType: z.string().nullable().optional(),
  orderCode: z.string().nullable().optional(),
  designCode: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type OrdersForAccountingListParams = z.infer<typeof OrdersForAccountingListParamsSchema>;

// ==== OrdersForDesignerListParams (GET /api/orders/for-designer) ====
export const OrdersForDesignerListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  orderCode: z.string().nullable().optional(),
  designCode: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type OrdersForDesignerListParams = z.infer<typeof OrdersForDesignerListParamsSchema>;

// ==== OrdersForSaleListParams (GET /api/orders/for-sale) ====
export const OrdersForSaleListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  orderCode: z.string().nullable().optional(),
  designCode: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type OrdersForSaleListParams = z.infer<typeof OrdersForSaleListParamsSchema>;

// ==== OrdersMyListParams (GET /api/orders/my) ====
export const OrdersMyListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  orderCode: z.string().nullable().optional(),
  designCode: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  startDate: z.string().datetime({ offset: true }).nullable().optional(),
  endDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type OrdersMyListParams = z.infer<typeof OrdersMyListParamsSchema>;

// ==== OutsourceOrderListParams (GET /api/outsource-orders) ====
export const OutsourceOrderListParamsSchema = PagedParamsSchema.extend({
  printingVendorId: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
});
export type OutsourceOrderListParams = z.infer<typeof OutsourceOrderListParamsSchema>;

// ==== PaperSizeListParams (GET /api/paper-sizes) ====
export const PaperSizeListParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  isCustom: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PaperSizeListParams = z.infer<typeof PaperSizeListParamsSchema>;

// ==== PaymentByCustomerParams (GET /api/payments/by-customer/:customerId) ====
export const PaymentByCustomerParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PaymentByCustomerParams = z.infer<typeof PaymentByCustomerParamsSchema>;

// ==== PaymentByOrderParams (GET /api/payments/by-order/:orderId) ====
export const PaymentByOrderParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PaymentByOrderParams = z.infer<typeof PaymentByOrderParamsSchema>;

// ==== PaymentMethodsListParams (GET /api/categories/payment-methods) ====
export const PaymentMethodsListParamsSchema = PagedParamsSchema.extend({
  isActive: z.boolean().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PaymentMethodsListParams = z.infer<typeof PaymentMethodsListParamsSchema>;

// ==== PlateExportListParams (GET /api/plate-exports) ====
export const PlateExportListParamsSchema = PagedParamsSchema.extend({
  vendorId: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
});
export type PlateExportListParams = z.infer<typeof PlateExportListParamsSchema>;

// ==== ProductionByOrderParams (GET /api/production-orders/by-order/:orderId) ====
export const ProductionByOrderParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ProductionByOrderParams = z.infer<typeof ProductionByOrderParamsSchema>;

// ==== ProductionListParams (GET /api/production-orders) ====
export const ProductionListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
  proofingOrderCode: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
  tab: z.string().nullable().optional(),
});
export type ProductionListParams = z.infer<typeof ProductionListParamsSchema>;

// ==== ProductionPendingMaterialParams (GET /api/production-orders/pending-material) ====
export const ProductionPendingMaterialParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ProductionPendingMaterialParams = z.infer<typeof ProductionPendingMaterialParamsSchema>;

// ==== ProductionSummaryStatsParams (GET /api/production-orders/summary-stats) ====
export const ProductionSummaryStatsParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  todayStart: z.string().datetime({ offset: true }).nullable().optional(),
  todayEnd: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type ProductionSummaryStatsParams = z.infer<typeof ProductionSummaryStatsParamsSchema>;

// ==== ProofingOrderAvailableOrderDetailsDesignTypeSummaryParams (GET /api/proofing-orders/available-order-details/design-type-summary) ====
export const ProofingOrderAvailableOrderDetailsDesignTypeSummaryParamsSchema = z.object({
  materialTypeId: z.number().int().nullable().optional(),
  designCode: z.string().nullable().optional(),
}).passthrough();
export type ProofingOrderAvailableOrderDetailsDesignTypeSummaryParams = z.infer<typeof ProofingOrderAvailableOrderDetailsDesignTypeSummaryParamsSchema>;

// ==== ProofingOrderAvailableOrderDetailsParams (GET /api/proofing-orders/available-order-details) ====
export const ProofingOrderAvailableOrderDetailsParamsSchema = PagedParamsSchema.extend({
  materialTypeId: z.number().int().nullable().optional(),
  designTypeId: z.number().int().nullable().optional(),
  designCode: z.string().nullable().optional(),
});
export type ProofingOrderAvailableOrderDetailsParams = z.infer<typeof ProofingOrderAvailableOrderDetailsParamsSchema>;

// ==== ProofingOrderByOrderParams (GET /api/proofing-orders/by-order/:orderId) ====
export const ProofingOrderByOrderParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ProofingOrderByOrderParams = z.infer<typeof ProofingOrderByOrderParamsSchema>;

// ==== ProofingOrderCompletedParams (GET /api/proofing-orders/completed) ====
export const ProofingOrderCompletedParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  designTypeId: z.number().int().nullable().optional(),
  scheduleStatus: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ProofingOrderCompletedParams = z.infer<typeof ProofingOrderCompletedParamsSchema>;

// ==== ProofingOrderForProductionListParams (GET /api/proofing-orders/for-production) ====
export const ProofingOrderForProductionListParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ProofingOrderForProductionListParams = z.infer<typeof ProofingOrderForProductionListParamsSchema>;

// ==== ProofingOrderListParams (GET /api/proofing-orders) ====
export const ProofingOrderListParamsSchema = PagedParamsSchema.extend({
  code: z.string().nullable().optional(),
  designCode: z.string().nullable().optional(),
  materialTypeId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ProofingOrderListParams = z.infer<typeof ProofingOrderListParamsSchema>;

// ==== ProofingOrdersPauseParams (PUT /api/proofing-orders/:id/pause) ====
export const ProofingOrdersPauseParamsSchema = z.object({
  reason: z.string().nullable().optional(),
}).passthrough();
export type ProofingOrdersPauseParams = z.infer<typeof ProofingOrdersPauseParamsSchema>;

// ==== PurchaseReportByItemListParams (GET /api/purchase-reports/by-item) ====
export const PurchaseReportByItemListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  itemCode: z.string().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PurchaseReportByItemListParams = z.infer<typeof PurchaseReportByItemListParamsSchema>;

// ==== PurchaseReportDetailLedgerParams (GET /api/purchase-reports/detail-ledger) ====
export const PurchaseReportDetailLedgerParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  itemCode: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PurchaseReportDetailLedgerParams = z.infer<typeof PurchaseReportDetailLedgerParamsSchema>;

// ==== PurchaseReportJournalParams (GET /api/purchase-reports/journal) ====
export const PurchaseReportJournalParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PurchaseReportJournalParams = z.infer<typeof PurchaseReportJournalParamsSchema>;

// ==== PurchaseReportsDetailLedgerExportParams (GET /api/purchase-reports/detail-ledger/export) ====
export const PurchaseReportsDetailLedgerExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  itemCode: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type PurchaseReportsDetailLedgerExportParams = z.infer<typeof PurchaseReportsDetailLedgerExportParamsSchema>;

// ==== PurchaseReportsJournalExportParams (GET /api/purchase-reports/journal/export) ====
export const PurchaseReportsJournalExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type PurchaseReportsJournalExportParams = z.infer<typeof PurchaseReportsJournalExportParamsSchema>;

// ==== PurchaseReportsSummaryExportParams (GET /api/purchase-reports/summary/export) ====
export const PurchaseReportsSummaryExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type PurchaseReportsSummaryExportParams = z.infer<typeof PurchaseReportsSummaryExportParamsSchema>;

// ==== PurchaseReportSummaryParams (GET /api/purchase-reports/summary) ====
export const PurchaseReportSummaryParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PurchaseReportSummaryParams = z.infer<typeof PurchaseReportSummaryParamsSchema>;

// ==== PurchaseReportVendorStatisticsParams (GET /api/purchase-reports/vendor-statistics) ====
export const PurchaseReportVendorStatisticsParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  vendorId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type PurchaseReportVendorStatisticsParams = z.infer<typeof PurchaseReportVendorStatisticsParamsSchema>;

// ==== ReadyDesignListParams (GET /api/ready-designs) ====
export const ReadyDesignListParamsSchema = PagedParamsSchema.extend({
  customerId: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
});
export type ReadyDesignListParams = z.infer<typeof ReadyDesignListParamsSchema>;

// ==== ReportExportListParams (GET /api/report-exports) ====
export const ReportExportListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  reportCode: z.string().nullable().optional(),
  exportedById: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type ReportExportListParams = z.infer<typeof ReportExportListParamsSchema>;

// ==== SalesReportByCustomerListParams (GET /api/sales-reports/by-customer) ====
export const SalesReportByCustomerListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  salespersonId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportByCustomerListParams = z.infer<typeof SalesReportByCustomerListParamsSchema>;

// ==== SalesReportByDimensionListParams (GET /api/sales-reports/by-dimension) ====
export const SalesReportByDimensionListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  dimension: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportByDimensionListParams = z.infer<typeof SalesReportByDimensionListParamsSchema>;

// ==== SalesReportByPeriodListParams (GET /api/sales-reports/by-period) ====
export const SalesReportByPeriodListParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  groupBy: z.string().nullable().optional(),
  salespersonId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportByPeriodListParams = z.infer<typeof SalesReportByPeriodListParamsSchema>;

// ==== SalesReportInvoiceListExportPdfParams (GET /api/sales-reports/invoice-list/export-pdf) ====
export const SalesReportInvoiceListExportPdfParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  salespersonId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type SalesReportInvoiceListExportPdfParams = z.infer<typeof SalesReportInvoiceListExportPdfParamsSchema>;

// ==== SalesReportOrdersByCustomerParams (GET /api/sales-reports/orders-by-customer/:customerId) ====
export const SalesReportOrdersByCustomerParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportOrdersByCustomerParams = z.infer<typeof SalesReportOrdersByCustomerParamsSchema>;

// ==== SalesReportOrdersByPeriodParams (GET /api/sales-reports/orders-by-period) ====
export const SalesReportOrdersByPeriodParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  salespersonId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportOrdersByPeriodParams = z.infer<typeof SalesReportOrdersByPeriodParamsSchema>;

// ==== SalesReportReturnsDiscountsParams (GET /api/sales-reports/returns-discounts) ====
export const SalesReportReturnsDiscountsParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  groupBy: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportReturnsDiscountsParams = z.infer<typeof SalesReportReturnsDiscountsParamsSchema>;

// ==== SalesReportSalesDetailLedgerExportPdfParams (GET /api/sales-reports/sales-detail-ledger/export-pdf) ====
export const SalesReportSalesDetailLedgerExportPdfParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
}).passthrough();
export type SalesReportSalesDetailLedgerExportPdfParams = z.infer<typeof SalesReportSalesDetailLedgerExportPdfParamsSchema>;

// ==== SalesReportSalesDetailLedgerParams (GET /api/sales-reports/sales-detail-ledger) ====
export const SalesReportSalesDetailLedgerParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportSalesDetailLedgerParams = z.infer<typeof SalesReportSalesDetailLedgerParamsSchema>;

// ==== SalesReportSalesSummaryExportPdfParams (GET /api/sales-reports/sales-summary/export-pdf) ====
export const SalesReportSalesSummaryExportPdfParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  groupBy: z.string().nullable().optional(),
}).passthrough();
export type SalesReportSalesSummaryExportPdfParams = z.infer<typeof SalesReportSalesSummaryExportPdfParamsSchema>;

// ==== SalesReportSalesSummaryParams (GET /api/sales-reports/sales-summary) ====
export const SalesReportSalesSummaryParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  groupBy: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportSalesSummaryParams = z.infer<typeof SalesReportSalesSummaryParamsSchema>;

// ==== SalesReportsByPeriodExportParams (GET /api/sales-reports/by-period/export) ====
export const SalesReportsByPeriodExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  groupBy: z.string().nullable().optional(),
  salespersonId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  saveHistory: z.boolean().nullable().optional(),
}).passthrough();
export type SalesReportsByPeriodExportParams = z.infer<typeof SalesReportsByPeriodExportParamsSchema>;

// ==== SalesReportsInvoiceListExportParams (GET /api/sales-reports/invoice-list/export) ====
export const SalesReportsInvoiceListExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  salespersonId: z.number().int().nullable().optional(),
  status: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type SalesReportsInvoiceListExportParams = z.infer<typeof SalesReportsInvoiceListExportParamsSchema>;

// ==== SalesReportsSalesDetailLedgerExportParams (GET /api/sales-reports/sales-detail-ledger/export) ====
export const SalesReportsSalesDetailLedgerExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type SalesReportsSalesDetailLedgerExportParams = z.infer<typeof SalesReportsSalesDetailLedgerExportParamsSchema>;

// ==== SalesReportsSalesSummaryExportParams (GET /api/sales-reports/sales-summary/export) ====
export const SalesReportsSalesSummaryExportParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  groupBy: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type SalesReportsSalesSummaryExportParams = z.infer<typeof SalesReportsSalesSummaryExportParamsSchema>;

// ==== SalesReportTopProductsParams (GET /api/sales-reports/top-products) ====
export const SalesReportTopProductsParamsSchema = PagedParamsSchema.extend({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  topN: z.number().int().nullable().optional(),
  itemGroup: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SalesReportTopProductsParams = z.infer<typeof SalesReportTopProductsParamsSchema>;

// ==== SharedAddresseListParams (GET /api/shared-addresses) ====
export const SharedAddresseListParamsSchema = PagedParamsSchema.extend({
  isActive: z.boolean().nullable().optional(),
  search: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type SharedAddresseListParams = z.infer<typeof SharedAddresseListParamsSchema>;

// ==== SpecTemplateListParams (GET /api/spec-templates) ====
export const SpecTemplateListParamsSchema = z.object({
  familyId: z.number().int().nullable().optional(),
}).passthrough();
export type SpecTemplateListParams = z.infer<typeof SpecTemplateListParamsSchema>;

// ==== SpecValueListParams (GET /api/spec-values) ====
export const SpecValueListParamsSchema = z.object({
  specTemplateId: z.number().int().nullable().optional(),
}).passthrough();
export type SpecValueListParams = z.infer<typeof SpecValueListParamsSchema>;

// ==== StockInByDeliveryNoteParams (GET /api/stock-ins/by-delivery-note/:deliveryNoteId) ====
export const StockInByDeliveryNoteParamsSchema = PagedParamsSchema.extend({
});
export type StockInByDeliveryNoteParams = z.infer<typeof StockInByDeliveryNoteParamsSchema>;

// ==== StockInByProductionOrderParams (GET /api/stock-ins/by-production-order/:productionOrderId) ====
export const StockInByProductionOrderParamsSchema = PagedParamsSchema.extend({
});
export type StockInByProductionOrderParams = z.infer<typeof StockInByProductionOrderParamsSchema>;

// ==== StockInByVendorParams (GET /api/stock-ins/by-vendor/:vendorId) ====
export const StockInByVendorParamsSchema = PagedParamsSchema.extend({
});
export type StockInByVendorParams = z.infer<typeof StockInByVendorParamsSchema>;

// ==== StockInListParams (GET /api/stock-ins) ====
export const StockInListParamsSchema = PagedParamsSchema.extend({
  source: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type StockInListParams = z.infer<typeof StockInListParamsSchema>;

// ==== StockInSummaryParams (GET /api/stock-ins/summary) ====
export const StockInSummaryParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type StockInSummaryParams = z.infer<typeof StockInSummaryParamsSchema>;

// ==== StockOutByVendorExcelParams (GET /api/stock-outs/by-vendor/:vendorId/excel) ====
export const StockOutByVendorExcelParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type StockOutByVendorExcelParams = z.infer<typeof StockOutByVendorExcelParamsSchema>;

// ==== StockOutListParams (GET /api/stock-outs) ====
export const StockOutListParamsSchema = PagedParamsSchema.extend({
  purpose: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type StockOutListParams = z.infer<typeof StockOutListParamsSchema>;

// ==== StockOutSummaryParams (GET /api/stock-outs/summary) ====
export const StockOutSummaryParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type StockOutSummaryParams = z.infer<typeof StockOutSummaryParamsSchema>;

// ==== SupplierCatalogListParams (GET /api/supplier-catalogs) ====
export const SupplierCatalogListParamsSchema = z.object({
  vendorId: z.number().int().nullable().optional(),
}).passthrough();
export type SupplierCatalogListParams = z.infer<typeof SupplierCatalogListParamsSchema>;

// ==== SupplierTypeListParams (GET /api/supplier-types) ====
export const SupplierTypeListParamsSchema = z.object({
  page: z.number().int().nullable().optional(),
  size: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
}).passthrough();
export type SupplierTypeListParams = z.infer<typeof SupplierTypeListParamsSchema>;

// ==== UserDesignersListParams (GET /api/users/designers) ====
export const UserDesignersListParamsSchema = PagedParamsSchema.extend({
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type UserDesignersListParams = z.infer<typeof UserDesignersListParamsSchema>;

// ==== UserKpiParams (GET /api/users/:id/kpi) ====
export const UserKpiParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
}).passthrough();
export type UserKpiParams = z.infer<typeof UserKpiParamsSchema>;

// ==== UserKpiTeamParams (GET /api/users/kpi/team) ====
export const UserKpiTeamParamsSchema = z.object({
  fromDate: z.string().datetime({ offset: true }).nullable().optional(),
  toDate: z.string().datetime({ offset: true }).nullable().optional(),
  role: z.string().nullable().optional(),
}).passthrough();
export type UserKpiTeamParams = z.infer<typeof UserKpiTeamParamsSchema>;

// ==== UserListParams (GET /api/users) ====
export const UserListParamsSchema = PagedParamsSchema.extend({
  role: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type UserListParams = z.infer<typeof UserListParamsSchema>;

// ==== VendorListParams (GET /api/vendors) ====
export const VendorListParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  vendorType: z.string().nullable().optional(),
  supplierTypeId: z.number().int().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type VendorListParams = z.infer<typeof VendorListParamsSchema>;
