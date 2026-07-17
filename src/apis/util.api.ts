export const normalizeParams = (filters: Record<string, unknown>) => {
  const normalized = { ...filters };
  const sort = filters.sort as string;

  if (typeof sort === "string") {
    const sortParts = sort.split(",");
    if (sortParts.length >= 2) {
      normalized.sortBy = sortParts[0];
      normalized.sortDirection = sortParts[1];
    }
  }

  // Remove null, undefined, and empty string values
  // Note: Empty strings are removed to avoid sending empty query params
  const removeEmptyValueParams = Object.fromEntries(
    Object.entries(normalized).filter(([_, v]) => {
      // Keep non-null, non-undefined values
      // Remove empty strings (they will be sent as empty query params which may not be desired)
      return v != null && v !== "";
    })
  );
  return removeEmptyValueParams;
};

export const API_SUFFIX = {
  // ========== AUTH ==========
  AUTH_LOGIN: "/auth/login",
  AUTH_ROLES: "/auth/roles",

  // ========== CONSTANTS ==========
  CONSTANTS: "/constants",

  // ========== USERS ==========
  USERS: "/users",
  USER_BY_ID: (id: number) => `/users/${id}`,
  USER_BY_USERNAME: (username: string) => `/users/username/${username}`,
  USER_ME: "/users/me",
  USER_CHANGE_PASSWORD: (id: number) => `/users/${id}/change-password`,
  USER_RESET_PASSWORD: (id: number) => `/users/${id}/reset-password`,
  USER_DEPARTMENT_RESET_PASSWORD: (id: number) =>
    `/users/${id}/department-reset-password`,
  USERS_DESIGNERS: "/users/designers",
  USER_KPI: (id: number) => `/users/${id}/kpi`,
  USER_KPI_TEAM: "/users/kpi/team",

  // ========== ORDERS ==========
  ORDERS: "/orders",
  ORDER_BY_ID: (id: number) => `/orders/${id}`,

  ORDERS_FOR_DESIGNER: "/orders/for-designer",
  ORDERS_FOR_ACCOUNTING: "/orders/for-accounting",
  ORDERS_FOR_SALE: "/orders/for-sale",
  ORDERS_SALES_DASHBOARD: "/orders/sales-dashboard",
  ORDER_FROM_READY_DESIGNS: "/orders/from-ready-designs",

  ORDER_ADD_DESIGN: (id: number) => `/orders/${id}/add-design`,
  ORDER_REMOVE_DESIGN: (orderId: number, orderDetailId: number) =>
    `/orders/${orderId}/designs/${orderDetailId}`,
  ORDER_UPDATE_FOR_ACCOUNTING: (id: number) => `/orders/${id}/accounting`,
  ORDER_UPDATE_FOR_SALE: (id: number) => `/orders/${id}/sale`,
  ORDER_EXPORT_INVOICE: (id: number) => `/orders/${id}/export-invoice`,
  ORDER_EXPORT_DELIVERY_NOTE: (id: number) =>
    `/orders/${id}/export-delivery-note`,
  ORDER_EXPORT_PDF: (id: number) => `/orders/${id}/export-pdf`,
  ORDER_EXPORT_DATA: (id: number) => `/orders/${id}/export-data`,
  ORDER_RECALCULATE_TOTAL: (id: number) => `/orders/${id}/recalculate-total`,
  ORDER_VALIDATE_EXPORT: (id: number) => `/orders/${id}/validate-export`,
  ORDER_GENERATE_EXCEL: (id: number) => `/orders/${id}/generate-excel`,
  ORDER_CANCEL: (id: number) => `/orders/${id}/cancel`,

  ORDERS_MY: "/orders/my",

  // ========== INVOICE ==========
  // Note: GET /invoices (list) may not be defined in OpenAPI schema yet
  INVOICES: "/invoices",
  INVOICE_SUMMARY_STATS: "/invoices/summary-stats",
  INVOICE_BY_ID: (id: number) => `/invoices/${id}`,
  INVOICE_BY_ORDER: (orderId: number) => `/invoices/order/${orderId}`, // Legacy: GET returns string (URL)
  INVOICES_BY_ORDER: (orderId: number) => `/invoices/by-order/${orderId}`, // GET with pagination
  INVOICE_EXPORT: (id: number) => `/invoices/${id}/export-sinvoice`,
  ORDER_INVOICE: (orderId: number) => `/invoices/order/${orderId}`, // Legacy alias, use INVOICE_BY_ORDER
  INVOICES_BILLABLE_ITEMS: "/invoices/billable-items",
  INVOICES_FROM_LINES: "/invoices/from-lines",
  INVOICE_ISSUE: (id: number) => `/invoices/${id}/issue`,
  INVOICE_E_INVOICE: (id: number) => `/invoices/${id}/e-invoice`,
  INVOICE_VOID: (id: number) => `/invoices/${id}/void`,
  CUSTOMER_EXPORT_DEBT_COMPARISON: (id: number) =>
    `/customers/${id}/export-debt-comparison`,

  // ========== ACCOUNTING ==========
  ACCOUNTING_BY_ORDER: (orderId: number) => `/accounting/order/${orderId}`,
  ACCOUNTING_CONFIRM_PAYMENT: (accountingId: number) =>
    `/accounting/${accountingId}/confirm-payment`,
  ACCOUNTING_CONFIRM_DEPOSIT: (orderId: number) =>
    `/accounting/order/${orderId}/confirm-deposit`,
  ACCOUNTING_APPROVE_DEBT: (orderId: number) =>
    `/accounting/order/${orderId}/approve-debt`,
  ACCOUNTING_EXPORT_DEBT: "/accounting/export-debt",
  // ========== AR LEDGER (NEW) ==========
  AR_LEDGER: "/ar-ledger",
  AR_LEDGER_BY_ID: (id: number) => `/ar-ledger/${id}`,
  AR_LEDGER_SUMMARY: (customerId: number) => `/ar-ledger/summary/${customerId}`,

  // ========== CUSTOMERS ==========
  CUSTOMERS: "/customers",
  CUSTOMER_BY_ID: (id: number) => `/customers/${id}`,
  // DEPRECATED: Endpoint not found in OpenAPI schema
  // CUSTOMER_CHECK_DUPLICATE_COMPANY: (name: string) =>
  //   `/customers/check-duplicate-company?companyName=${encodeURIComponent(
  //     name
  //   )}`,
  CUSTOMER_DEBT_HISTORY: (id: number) => `/customers/${id}/debt-history`,
  CUSTOMER_DEBT_STATEMENT: (id: number) => `/customers/${id}/debt-statement`,
  CUSTOMER_MONTHLY_DEBT: (id: number) => `/customers/${id}/monthly-debt`,
  CUSTOMER_DEBT_SUMMARY: (id: number) => `/customers/${id}/debt-summary`,
  CUSTOMER_STATISTICS: (id: number) => `/customers/${id}/statistics`,
  CUSTOMER_FAVORITE_STATS: (id: number) => `/customers/${id}/favorite-stats`,
  CUSTOMER_ORDERS: (id: number) => `/customers/${id}/order-history`,

  // ========== CUSTOMER ADDRESSES ==========
  CUSTOMER_ADDRESSES: (customerId: number) =>
    `/customers/${customerId}/addresses`,
  CUSTOMER_ADDRESS_BY_ID: (customerId: number, addressId: number) =>
    `/customers/${customerId}/addresses/${addressId}`,
  // Note: Không có set-default endpoint riêng.
  // Dùng PUT CUSTOMER_ADDRESS_BY_ID với { isDefault: true } để đặt mặc định.
  // Dùng PUT CUSTOMER_ADDRESS_BY_ID với { isActive: false } để "xóa" địa chỉ.

  // ========== DESIGN TYPES ==========
  DESIGN_TYPES: "/designs/types",
  DESIGN_TYPE_BY_ID: (id: number) => `/designs/types/${id}`,

  // ========== MATERIAL TYPES ==========
  MATERIAL_TYPES: "/designs/materials",
  MATERIAL_TYPE_BY_ID: (id: number) => `/designs/materials/${id}`,
  MATERIAL_TYPES_BY_DESIGN_TYPE: (designTypeId: number) =>
    `/designs/materials/design-type/${designTypeId}`,
  MATERIAL_TYPES_BULK: "/designs/materials/bulk",
  MATERIALS: "/materials",
  MATERIAL_BY_ID: (id: number) => `/materials/${id}`,
  MATERIAL_HISTORY: (id: number) => `/materials/${id}/history`,

  // ========== MATERIAL SPECS ==========
  MATERIAL_SPECS: (typeId: number) => `/material-types/${typeId}/specs`,
  MATERIAL_SPEC_PAGINATED: (typeId: number) => `/material-types/${typeId}/specs/paginated`,
  MATERIAL_SPEC_BY_ID: (typeId: number, id: number) => `/material-types/${typeId}/specs/${id}`,

  // ========== MATERIAL 8-LAYER MANAGEMENT SYSTEM ==========
  SUPPLIER_TYPES: "/supplier-types",
  SUPPLIER_TYPE_BY_ID: (id: number) => `/supplier-types/${id}`,
  MATERIAL_FAMILIES: "/material-families",
  MATERIAL_FAMILY_BY_ID: (id: number) => `/material-families/${id}`,
  SPEC_TEMPLATES: "/spec-templates",
  SPEC_TEMPLATE_BY_ID: (id: number) => `/spec-templates/${id}`,
  SPEC_VALUES: "/spec-values",
  SPEC_VALUE_BY_ID: (id: number) => `/spec-values/${id}`,
  SUPPLIER_CATALOGS: "/supplier-catalogs",
  SUPPLIER_CATALOG_BY_ID: (id: number) => `/supplier-catalogs/${id}`,


  // ========== DESIGNS ==========
  DESIGNS: "/designs",
  DESIGN_BY_ID: (id: number) => `/designs/${id}`,
  MY_DESIGNS: "/designs/my",
  DESIGN_BY_USER: (userId: number) => `/designs/user/${userId}`,
  DESIGN_BY_CUSTOMER: (customerId: number) =>
    `/designs/by-customer/${customerId}`,
  DESIGNS_SALE: "/designs/sale",
  READY_DESIGNS: "/ready-designs",
  READY_DESIGNS_BY_ID: (id: number) => `/ready-designs/${id}`,

  DESIGN_TIMELINE: (id: number) => `/designs/${id}/timeline`,
  DESIGN_UPLOAD_FILE: (id: number) => `/designs/${id}/upload-design-file`,
  DESIGN_UPLOAD_IMAGE: (id: number) => `/designs/${id}/upload-design-image`,
  DESIGN_GENERATE_EXCEL: (id: number) => `/designs/${id}/generate-excel`,
  DESIGN_REVERT_TO_WAITING: (id: number) => `/designs/${id}/revert-to-waiting`,
  DESIGN_REPRINT: (id: number) => `/designs/${id}/reprint`,
  DESIGN_CANCEL: (id: number) => `/designs/${id}/cancel`,
  DESIGN_MARK_URGENT: (id: number) => `/designs/${id}/mark-urgent`,
  DESIGN_UPDATE_CODE: (id: number) => `/designs/${id}/code`,

  DESIGN_EMPLOYEES_FIXED_QUERY: () =>
    `/users?pageNumber=1&pageSize=10&role=design`,

  // ========== PROOFING ORDERS ==========
  PROOFING_ORDERS: "/proofing-orders",
  PROOFING_ORDER_BY_ID: (id: number) => `/proofing-orders/${id}`,
  PROOFING_FROM_DESIGNS: "/proofing-orders/from-designs",
  PROOFING_AVAILABLE_BINS: "/proofing-orders/available-bins",
  PROOFING_AVAILABLE_ORDER_DETAILS: "/proofing-orders/available-order-details",
  PROOFING_COMPLETED_LIST: "/proofing-orders/completed",
  PROOFING_UPDATE_SCHEDULE_STATUS: (id: number) => `/proofing-orders/${id}/schedule-status`,
  PROOFING_BY_ORDER: (orderId: number) =>
    `/proofing-orders/by-order/${orderId}`,
  PROOFING_FOR_PRODUCTION: "/proofing-orders/for-production",
  PROOFING_UPLOAD_FILE: (id: number) => `/proofing-orders/${id}/upload-file`,
  PROOFING_UPLOAD_IMAGE: (id: number) => `/proofing-orders/${id}/upload-image`,
  PROOFING_UPLOAD_IMAGES: (id: number) => `/proofing-orders/${id}/images`,
  PAPER_SIZES: "/paper-sizes",
  PROOFING_RECORD_PLATE: (id: number) => `/proofing-orders/${id}/plate-export`,
  PROOFING_RECORD_DIE: (id: number) => `/proofing-orders/${id}/die-export`,
  PROOFING_DIE_RECEIVE: (dieExportId: number) =>
    `/proofing-orders/dies/${dieExportId}/receive`,
  PROOFING_PLATE_RECEIVE: (plateExportId: number) =>
    `/proofing-orders/plates/${plateExportId}/receive`,

  // ========== PLATE EXPORTS ==========
  PLATE_EXPORTS: "/plate-exports",
  PLATE_EXPORT_BY_ID: (id: number) => `/plate-exports/${id}`,
  PLATE_EXPORT_UPDATE: (id: number) => `/plate-exports/${id}`,
  PROOFING_UPDATE_FILE: (id: number) => `/proofing-orders/${id}/update-file`,
  PROOFING_UPDATE_IMAGE: (id: number) => `/proofing-orders/${id}/update-image`,
  PROOFING_DELETE_IMAGE: (proofingOrderId: number, imageId: number) =>
    `/proofing-orders/${proofingOrderId}/images/${imageId}`,
  PROOFING_DOWNLOAD_FILE: (id: number) =>
    `/proofing-orders/${id}/download-file`,
  PROOFING_COMPLETE: (id: number) => `/proofing-orders/${id}/complete`,
  PROOFING_CANCEL: (id: number) => `/proofing-orders/${id}/cancel`,
  PROOFING_PAUSE: (id: number) => `/proofing-orders/${id}/pause`,
  PROOFING_HAND_TO_PRODUCTION: (id: number) =>
    `/proofing-orders/${id}/hand-to-production`,
  PROOFING_AVAILABLE_QUANTITY: (designId: number) =>
    `/proofing-orders/available-quantity/${designId}`,
  PROOFING_UPDATE_AVAILABLE_QUANTITY: (designId: number) =>
    `/proofing-orders/designs/${designId}/available-quantity`,
  PROOFING_ADD_DESIGNS: (id: number) => `/proofing-orders/${id}/designs`,
  PROOFING_REMOVE_DESIGN: (id: number, designId: number) =>
    `/proofing-orders/${id}/designs/${designId}`,
  PROOFING_DESIGN_TYPE_SUMMARY:
    "/proofing-orders/available-order-details/design-type-summary",
  PROOFING_REJECT_DESIGN: "/proofing-orders/designs/reject",

  // ========== VENDORS ==========
  VENDORS: "/vendors",
  VENDOR_BY_ID: (id: number) => `/vendors/${id}`,
  VENDORS_ACTIVE: "/vendors/active",

  // ========== DIES ==========
  DIES: "/dies",
  DIE_BY_ID: (id: number) => `/dies/${id}`,
  DIE_IMAGE: (id: number) => `/dies/${id}/image`,
  DIE_UPDATE_STATUS: (id: number) => `/dies/${id}/status`,
  DIES_RELATED: "/dies/related",
  DIES_RELATED_BY_PROOFING_ORDER: (proofingOrderId: number) =>
    `/dies/related/proofing-order/${proofingOrderId}`,
  DIE_FROM_DIE_EXPORT: (dieExportId: number) =>
    `/dies/from-die-export/${dieExportId}`,
  // DIE_SEARCH: "/dies/search", // Endpoint removed - use regular DIES endpoint with q parameter
  DIES_BY_PROOFING_ORDER: (proofingOrderId: number) =>
    `/dies/proofing-order/${proofingOrderId}`,
  DIE_PROOFING_ORDER_HISTORY: (proofingOrderId: number) =>
    `/dies/proofing-order/${proofingOrderId}/history`,
  DIE_ASSIGN_TO_PROOFING_ORDER: (proofingOrderId: number) =>
    `/dies/proofing-order/${proofingOrderId}/assign`,
  DIE_REMOVE_FROM_PROOFING_ORDER: (proofingOrderId: number, dieId: number) =>
    `/dies/proofing-order/${proofingOrderId}/die/${dieId}`,
  DIE_REPLACE: (proofingOrderId: number, currentDieId: number) =>
    `/dies/proofing-order/${proofingOrderId}/die/${currentDieId}`,
  DIE_PROOFING_ORDER_DIE_RETURN: (dieExportId: number) =>
    `/dies/die-export/${dieExportId}/return`,
  DIE_PROOFING_ORDER_DIE_TAKE_OUT: (dieExportId: number) =>
    `/dies/die-export/${dieExportId}/take-out`,

  // ========== STOCK ==========
  STOCK_INS: "/stock-ins",
  STOCK_IN_BY_ID: (id: number) => `/stock-ins/${id}`,
  STOCK_IN_CANCEL: (id: number) => `/stock-ins/${id}/cancel`,
  STOCK_IN_COMPLETE: (id: number) => `/stock-ins/${id}/complete`,
  STOCK_IN_FROM_VENDOR: "/stock-ins/from-vendor",
  STOCK_IN_DIRECT_ISSUE: "/stock-ins/direct-issue",
  STOCK_IN_AUXILIARY: "/stock-ins/auxiliary",
  STOCK_IN_FROM_PRODUCTION: "/stock-ins/from-production",
  STOCK_IN_FROM_DELIVERY_RETURN: "/stock-ins/from-delivery-return",
  STOCK_IN_FROM_CUT: "/stock-ins/from-cut",
  STOCK_IN_BY_DELIVERY_NOTE: (deliveryNoteId: number) =>
    `/stock-ins/by-delivery-note/${deliveryNoteId}`,
  STOCK_IN_BY_PRODUCTION_ORDER: (productionOrderId: number) =>
    `/stock-ins/by-production-order/${productionOrderId}`,
  STOCK_IN_BY_VENDOR: (vendorId: number) =>
    `/stock-ins/by-vendor/${vendorId}`,
  STOCK_IN_SUMMARY: "/stock-ins/summary",
  STOCK_OUTS: "/stock-outs",
  STOCK_OUT_BY_ID: (id: number) => `/stock-outs/${id}`,
  STOCK_OUT_CANCEL: (id: number) => `/stock-outs/${id}/cancel`,
  STOCK_OUT_COMPLETE: (id: number) => `/stock-outs/${id}/complete`,
  STOCK_OUT_PDF: (id: number) => `/stock-outs/${id}/pdf`,
  STOCK_OUT_FOR_PRODUCTION: "/stock-outs/for-production",
  STOCK_OUT_MATERIAL_SUGGESTIONS: "/stock-outs/material-suggestions",
  STOCK_OUT_FOR_DELIVERY: "/stock-outs/for-delivery",
  STOCK_OUT_PROCESS_RETURN: "/stock-outs/process-return",
  STOCK_OUT_BY_DELIVERY_NOTE: (deliveryNoteId: number) =>
    `/stock-outs/by-delivery-note/${deliveryNoteId}`,
  STOCK_OUT_BY_PRODUCTION_ORDER: (productionOrderId: number) =>
    `/stock-outs/by-production-order/${productionOrderId}`,
  STOCK_OUT_RETURNABLE_BY_DELIVERY_NOTE: (deliveryNoteId: number) =>
    `/stock-outs/returnable/by-delivery-note/${deliveryNoteId}`,
  STOCK_OUT_SUMMARY: "/stock-outs/summary",
  STOCK_OUT_PRODUCTION_BY_VENDOR: "/stock-outs/production-by-vendor",
  STOCK_OUT_OUTSOURCE: "/stock-outs/outsource",
  STOCK_OUT_RETURN_VENDOR: "/stock-outs/return-vendor",
  STOCK_OUT_ADJUSTMENT: "/stock-outs/adjustment",
  STOCK_OUT_FOR_PRODUCTION_ORDER: (productionOrderId: number) =>
    `/stock-outs/production-order/${productionOrderId}`,
  STOCK_OUT_BY_VENDOR_EXCEL: (vendorId: number) => `/stock-outs/by-vendor/${vendorId}/excel`,
  INVENTORY_OPENING_BALANCE: "/inventory/opening-balance",
  MATERIAL_CUTS: "/material-cuts",
  MATERIAL_CUT_BY_ID: (id: number) => `/material-cuts/${id}`,
  MATERIAL_CUT_COMPLETE: (id: number) => `/material-cuts/${id}/complete`,
  MATERIAL_CUT_CANCEL: (id: number) => `/material-cuts/${id}/cancel`,

  // ========== PRODUCTIONS ==========
  PRODUCTION_ORDERS: "/production-orders",
  PRODUCTION_ORDER_BY_ID: (id: number) => `/production-orders/${id}`,
  PRODUCTION_ORDERS_BY_ORDER: (orderId: number) =>
    `/production-orders/by-order/${orderId}`,
  PRODUCTION_STEP_ASSIGN: (id: number) =>
    `/production-orders/steps/${id}/assign`,
  PRODUCTION_STEP_STATUS: (id: number) =>
    `/production-orders/steps/${id}/status`,
  PRODUCTION_ORDERS_KCS: "/production-orders/kcs",
  PRODUCTION_ORDERS_KCS_SUMMARY: "/production-orders/kcs/design-type-summary",
  PRODUCTION_ORDER_PRINT_LABEL: (poId: number, itemId: number) =>
    `/production-orders/${poId}/items/${itemId}/print-label`,

  // ========== DEFECT RECORDS ==========
  DEFECT_RECORDS: "/defect-records",
  DEFECT_RECORD_BY_ID: (id: number) => `/defect-records/${id}`,
  DEFECT_RECORDS_SUMMARY_BY_USER: "/defect-records/summary-by-user",
  DEFECT_RECORDS_BY_PRODUCTION_ORDER: (productionOrderId: number) =>
    `/defect-records/by-production-order/${productionOrderId}`,

  // ========== DELIVERY NOTES ==========
  DELIVERY_NOTES: "/delivery-notes",
  DELIVERY_NOTE_BY_ID: (id: number) => `/delivery-notes/${id}`,
  DELIVERY_NOTE_STATUS: (id: number) => `/delivery-notes/${id}/status`,
  DELIVERY_NOTE_EXPORT_PDF: (id: number) => `/delivery-notes/${id}/export-pdf`,
  DELIVERY_NOTE_RECREATE: "/delivery-notes/recreate",
  DELIVERY_NOTE_AVAILABLE_ORDERS: "/delivery-notes/available-orders",
  DELIVERY_NOTE_AVAILABLE_ORDER_DETAILS: "/delivery-notes/available-order-details",
  DELIVERY_NOTE_FAILURE_REASONS: "/delivery-notes/failure-reasons",
  DELIVERY_NOTE_LINE_RESULT: (lineId: number) =>
    `/delivery-notes/lines/${lineId}/result`,
  DELIVERY_NOTE_RETURNABLE_LINES: (id: number) => `/delivery-notes/${id}/returnable-lines`,

  // ========== RETURN NOTES ==========
  RETURN_NOTES: "/return-notes",
  RETURN_NOTE_BY_ID: (id: number) => `/return-notes/${id}`,
  RETURN_NOTES_BY_DELIVERY_NOTE: (deliveryNoteId: number) =>
    `/return-notes/by-delivery-note/${deliveryNoteId}`,
  RETURN_NOTE_PROCESS: (id: number) => `/return-notes/${id}/process`,

  // ========== CASH MANAGEMENT ==========
  CASH_PAYMENTS: "/cash-payments",
  CASH_PAYMENT_BY_ID: (id: number) => `/cash-payments/${id}`,
  CASH_PAYMENT_APPROVE: (id: number) => `/cash-payments/${id}/approve`,
  CASH_PAYMENT_CANCEL: (id: number) => `/cash-payments/${id}/cancel`,
  CASH_PAYMENT_POST: (id: number) => `/cash-payments/${id}/post`,
  CASH_PAYMENT_EXPORT_PDF: (id: number) => `/cash-payments/${id}/export-pdf`,
  CASH_PAYMENT_EXPORT: "/cash-payments/export",
  CASH_RECEIPTS: "/cash-receipts",
  CASH_RECEIPT_BY_ID: (id: number) => `/cash-receipts/${id}`,
  CASH_RECEIPT_APPROVE: (id: number) => `/cash-receipts/${id}/approve`,
  CASH_RECEIPT_CANCEL: (id: number) => `/cash-receipts/${id}/cancel`,
  CASH_RECEIPT_POST: (id: number) => `/cash-receipts/${id}/post`,
  CASH_RECEIPT_EXPORT_PDF: (id: number) => `/cash-receipts/${id}/export-pdf`,
  CASH_RECEIPT_EXPORT: "/cash-receipts/export",
  CASH_BOOK: "/cash-book",

  // ========== BANK MANAGEMENT ==========
  BANK_ACCOUNTS: "/categories/bank-accounts",
  BANK_ACCOUNT_BY_ID: (id: number) => `/categories/bank-accounts/${id}`,
  BANK_LEDGER: "/bank-ledger",

  // ========== EXPENSE & PAYMENT METHOD ==========
  EXPENSE_CATEGORIES: "/categories/expense-categories",
  EXPENSE_CATEGORY_BY_ID: (id: number) =>
    `/categories/expense-categories/${id}`,
  PAYMENT_METHODS: "/categories/payment-methods",
  PAYMENT_METHOD_BY_ID: (id: number) => `/categories/payment-methods/${id}`,

  // ========== DEBT NOTIFICATIONS ==========
  DEBT_NOTIFICATIONS: "/debt-notifications",
  DEBT_NOTIFICATION_BY_ID: (id: number) => `/debt-notifications/${id}`,
  DEBT_NOTIFICATION_PREVIEW: (id: number) => `/debt-notifications/${id}/preview`,
  DEBT_NOTIFICATION_READ: (id: number) => `/debt-notifications/${id}/read`,
  DEBT_NOTIFICATION_READ_ALL: "/debt-notifications/read-all",

  // ========== NOTIFICATIONS ==========
  NOTIFICATIONS: "/notifications",
  NOTIFICATION_BY_ID: (id: number) => `/notifications/${id}`,
  NOTIFICATION_READ: (id: number) => `/notifications/${id}/read`,
  NOTIFICATION_READ_ALL: "/notifications/read-all",
  NOTIFICATION_UNREAD_COUNT: "/notifications/unread-count",

  // ========== DEBT RECONCILIATIONS ==========
  DEBT_RECONCILIATION_AP: "/debt-reconciliations/ap",
  DEBT_RECONCILIATION_AP_DOWNLOAD: (id: number) =>
    `/debt-reconciliations/ap/${id}/download`,
  DEBT_RECONCILIATION_AR: "/debt-reconciliations/ar",
  DEBT_RECONCILIATION_AR_DOWNLOAD: (id: number) =>
    `/debt-reconciliations/ar/${id}/download`,

  // ========== AR/AP REPORTS ==========
  AR_SUMMARY: "/debt-reports/ar-summary",
  AR_SUMMARY_EXPORT: "/debt-reports/ar-summary/export",
  AR_DETAIL: "/debt-reports/ar-detail",
  AR_AGING: "/debt-reports/ar-aging",
  AR_AGING_EXPORT: "/debt-reports/ar-aging/export",
  AR_AGING_EXPORT_PDF: "/debt-reports/ar-aging/export-pdf",
  AR_BY_ITEM: "/debt-reports/ar-by-item",
  AR_DETAIL_BY_INVOICE: "/debt-reports/ar-detail-by-invoice",
  AR_DETAIL_LEDGER: (customerId: number) =>
    `/debt-reports/ar-detail-ledger/${customerId}`,
  AR_DETAIL_LEDGER_EXPORT: (customerId: number) =>
    `/debt-reports/ar-detail-ledger/${customerId}/export`,
  AR_OVERDUE: "/debt-reports/ar-overdue",
  AR_OVERDUE_EXPORT: "/debt-reports/ar-overdue/export",
  AR_SUMMARY_BY_BRANCH: "/debt-reports/ar-summary-by-branch",
  AR_SUMMARY_BY_CUSTOMER_GROUP: "/debt-reports/ar-summary-by-customer-group",
  AR_SUMMARY_EXPORT_PDF: "/debt-reports/ar-summary/export-pdf",
  AR_UNDERDUE: "/debt-reports/ar-underdue",
  AP_SUMMARY: "/debt-reports/ap-summary",
  AP_SUMMARY_EXPORT: "/debt-reports/ap-summary/export",
  AP_SUMMARY_REPORT: "/debt-reports/ap-summary-report",
  AP_DETAIL: "/debt-reports/ap-detail",
  AP_AGING: "/debt-reports/ap-aging",
  AP_AGING_EXPORT: "/debt-reports/ap-aging/export",
  AP_BY_PURCHASE_INVOICE: "/debt-reports/ap-by-purchase-invoice",
  AP_DETAIL_LEDGER: (vendorId: number) =>
    `/debt-reports/ap-detail-ledger/${vendorId}`,
  AP_DETAIL_LEDGER_EXPORT: (vendorId: number) =>
    `/debt-reports/ap-detail-ledger/${vendorId}/export`,
  AP_RECONCILIATION: (vendorId: number) =>
    `/debt-reports/ap-reconciliation/${vendorId}`,
  AP_RECONCILIATION_EXPORT: (vendorId: number) =>
    `/debt-reports/ap-reconciliation/${vendorId}/export`,
  AP_OVERDUE: "/debt-reports/ap-overdue",
  AP_ITEMS: "/debt-reports/ap-items",
  CUSTOMER_RECONCILIATION_EXPORT: "/debt-reports/customer-reconciliation/export",
  CUSTOMER_RECONCILIATION_EXPORT_PDF:
    "/debt-reports/customer-reconciliation/export-pdf",
  CUSTOMER_RECONCILIATION_EXPORT_WORD:
    "/debt-reports/customer-reconciliation/export-word",
  COLLECTION_SCHEDULE: "/debt-reports/collection-schedule",

  // ========== INVENTORY REPORTS ==========
  CURRENT_STOCK: "/inventory-reports/current-stock",
  INVENTORY_SUMMARY: "/inventory-reports/summary",
  INVENTORY_SUMMARY_EXCEL: "/inventory-reports/summary/excel",
  INVENTORY_SUMMARY_PDF: "/inventory-reports/summary/pdf",
  INVENTORY_HISTORY: "/inventory-reports/history",
  LOW_STOCK: "/inventory-reports/low-stock",
  SLOW_MOVING: "/inventory-reports/slow-moving",
  STOCK_CARD: (itemCode: string) => `/inventory-reports/stock-card/${itemCode}`,
  STOCK_CARD_EXCEL: (itemCode: string) => `/inventory-reports/stock-card/${itemCode}/excel`,
  VENDOR_RECONCILIATION_EXCEL: (vendorId: number) => `/inventory-reports/vendor-reconciliation/${vendorId}/excel`,

  // ========== SALES REPORTS ==========
  SALES_BY_PERIOD: "/sales-reports/by-period",
  SALES_BY_PERIOD_EXPORT: "/sales-reports/by-period/export",
  SALES_BY_CUSTOMER: "/sales-reports/by-customer",
  SALES_BY_DIMENSION: "/sales-reports/by-dimension",
  TOP_PRODUCTS: "/sales-reports/top-products",
  RETURNS_DISCOUNTS: "/sales-reports/returns-discounts",
  ORDER_DRILL_DOWN: (customerId: number) =>
    `/sales-reports/orders-by-customer/${customerId}`,
  ORDER_DRILL_DOWN_BY_PERIOD: "/sales-reports/orders-by-period",
  SALES_INVOICE_LIST_EXPORT: "/sales-reports/invoice-list/export",
  SALES_INVOICE_LIST_EXPORT_PDF: "/sales-reports/invoice-list/export-pdf",
  SALES_DETAIL_LEDGER: "/sales-reports/sales-detail-ledger",
  SALES_DETAIL_LEDGER_EXPORT: "/sales-reports/sales-detail-ledger/export",
  SALES_DETAIL_LEDGER_EXPORT_PDF:
    "/sales-reports/sales-detail-ledger/export-pdf",
  SALES_SUMMARY: "/sales-reports/sales-summary",
  SALES_SUMMARY_EXPORT: "/sales-reports/sales-summary/export",
  SALES_SUMMARY_EXPORT_PDF: "/sales-reports/sales-summary/export-pdf",

  // ========== REPORT EXPORTS ==========
  REPORT_EXPORTS: "/report-exports",
  REPORT_EXPORT_BY_ID: (id: number) => `/report-exports/${id}`,
  REPORT_EXPORT_DOWNLOAD: (id: number) => `/report-exports/${id}/download`,

  // ========== VENDORS (EXTRA) ==========
  VENDORS_PLATE_COUNT_OPTIONS: "/vendors/plate-count-options",
  // ========== FINANCE ACCOUNTS ==========
  FINANCE_ACCOUNTS_TREE: "/finance-accounts/tree",
  FINANCE_ACCOUNTS_SEARCH: "/finance-accounts/search",

  // ========== SHARED ADDRESSES ==========
  SHARED_ADDRESSES: "/shared-addresses",
  SHARED_ADDRESS_BY_ID: (id: number) => `/shared-addresses/${id}`,

  // ========== SYSTEM SETTINGS ==========
  SYSTEM_SETTINGS: "/system-settings",
  SYSTEM_SETTING_BY_KEY: (key: string) => `/system-settings/${key}`,
};
