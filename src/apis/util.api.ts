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

  const removeEmptyValueParams = Object.fromEntries(
    Object.entries(normalized).filter(([_, v]) => v != null)
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
  USER_CHANGE_PASSWORD: (id: number) => `/users/${id}/change-password`,
  USERS_DESIGNERS: "/users/designers",
  USER_KPI: (id: number, fromDate?: string, toDate?: string) => {
    const base = `/users/${id}/kpi`;
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    return params.toString() ? `${base}?${params.toString()}` : base;
  },
  USER_KPI_TEAM: (fromDate?: string, toDate?: string, role?: string) => {
    const base = "/users/kpi/team";
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    if (role) params.append("role", role);
    return params.toString() ? `${base}?${params.toString()}` : base;
  },

  // ========== ORDERS ==========
  ORDERS: "/orders",
  ORDER_BY_ID: (id: number) => `/orders/${id}`,

  ORDERS_FOR_DESIGNER: "/orders/for-designer",
  ORDERS_FOR_ACCOUNTING: "/orders/for-accounting",
  ORDERS_WITH_EXISTING_DESIGNS: "/orders/with-existing-designs",

  ORDER_ADD_DESIGN: (id: number) => `/orders/${id}/add-design`,
  ORDER_UPDATE_FOR_ACCOUNTING: (id: number) => `/orders/${id}/accounting`,
  ORDER_EXPORT_INVOICE: (id: number) => `/orders/${id}/export-invoice`,
  ORDER_EXPORT_DELIVERY_NOTE: (id: number) =>
    `/orders/${id}/export-delivery-note`,
  ORDER_EXPORT_PDF: (id: number) => `/orders/${id}/export-pdf`,
  ORDER_GENERATE_EXCEL: (id: number) => `/orders/${id}/generate-excel`,

  ORDERS_MY: "/orders/my",

  // ========== INVOICE ==========
  INVOICES: "/invoices",
  INVOICE_BY_ID: (id: number) => `/invoices/${id}`,
  INVOICE_BY_ORDER: (orderId: number) => `/invoices/order/${orderId}`,
  INVOICES_BY_ORDER: (orderId: number) => `/invoices/by-order/${orderId}`,
  INVOICE_EXPORT: (id: number) => `/invoices/${id}/export-sinvoice`,
  ORDER_INVOICE: (orderId: number) => `/invoices/order/${orderId}`, // Legacy, use INVOICE_BY_ORDER
  CUSTOMER_EXPORT_DEBT_COMPARISON: (id: number) =>
    `/customers/${id}/export-debt-comparison`,

  // ========== ACCOUNTING ==========
  ACCOUNTING_BY_ORDER: (orderId: number) => `/accountings/order/${orderId}`,
  ACCOUNTING_CONFIRM_PAYMENT: (accountingId: number) =>
    `/accountings/${accountingId}/confirm-payment`,
  ACCOUNTING_CONFIRM_DEPOSIT: (orderId: number, depositAmount?: number) => {
    const base = `/accountings/order/${orderId}/confirm-deposit`;
    return depositAmount != null
      ? `${base}?depositAmount=${depositAmount}`
      : base;
  },
  ACCOUNTING_APPROVE_DEBT: (orderId: number) =>
    `/accountings/order/${orderId}/approve-debt`,
  ACCOUNTING_EXPORT_DEBT: "/accountings/export-debt",

  // ========== CUSTOMERS ==========
  CUSTOMERS: "/customers",
  CUSTOMER_BY_ID: (id: number) => `/customers/${id}`,
  CUSTOMER_CHECK_DUPLICATE_COMPANY: (name: string) =>
    `/customers/check-duplicate-company?companyName=${encodeURIComponent(
      name
    )}`,
  CUSTOMER_DEBT_HISTORY: (id: number) => `/customers/${id}/debt-history`,
  CUSTOMER_MONTHLY_DEBT: (id: number) => `/customers/${id}/monthly-debt`,
  CUSTOMER_DEBT_SUMMARY: (id: number) => `/customers/${id}/debt-summary`,
  CUSTOMER_STATISTICS: (id: number) => `/customers/${id}/statistics`,
  CUSTOMER_ORDERS: (id: number) => `/customers/${id}/order-history`,

  // ========== DESIGN TYPES ==========
  DESIGN_TYPES: "/designs/types",
  DESIGN_TYPE_BY_ID: (id: number) => `/designs/types/${id}`,

  // ========== MATERIAL TYPES ==========
  MATERIAL_TYPES: "/designs/materials",
  MATERIAL_TYPE_BY_ID: (id: number) => `/designs/materials/${id}`,
  MATERIAL_TYPES_BY_DESIGN_TYPE: (designTypeId: number) =>
    `/designs/materials/design-type/${designTypeId}`,
  MATERIAL_TYPES_BULK: "/designs/materials/bulk",

  // ========== DESIGNS ==========
  DESIGNS: "/designs",
  DESIGN_BY_ID: (id: number) => `/designs/${id}`,
  MY_DESIGNS: "/designs/my",
  DESIGN_BY_USER: (userId: number) => `/designs/user/${userId}`,
  DESIGN_BY_CUSTOMER: (customerId: number) =>
    `/designs/by-customer/${customerId}`,

  DESIGN_TIMELINE: (id: number) => `/designs/${id}/timeline`,
  DESIGN_UPLOAD_FILE: (id: number) => `/designs/${id}/upload-design-file`,
  DESIGN_UPLOAD_IMAGE: (id: number) => `/designs/${id}/upload-design-image`,
  DESIGN_GENERATE_EXCEL: (id: number) => `/designs/${id}/generate-excel`,

  DESIGN_EMPLOYEES_FIXED_QUERY: () =>
    `/users?pageNumber=1&pageSize=10&role=design`,

  // ========== PROOFING ORDERS ==========
  PROOFING_ORDERS: "/proofing-orders",
  PROOFING_ORDER_BY_ID: (id: number) => `/proofing-orders/${id}`,
  PROOFING_FROM_DESIGNS: "/proofing-orders/from-designs",
  PROOFING_AVAILABLE_ORDER_DETAILS: "/proofing-orders/available-order-details",
  PROOFING_BY_ORDER: (orderId: number) =>
    `/proofing-orders/by-order/${orderId}`,
  PROOFING_FOR_PRODUCTION: "/proofing-orders/for-production",
  PROOFING_UPLOAD_FILE: (id: number) => `/proofing-orders/${id}/upload-file`,
  PROOFING_UPLOAD_IMAGE: (id: number) => `/proofing-orders/${id}/upload-image`,
  PAPER_SIZES: "/paper-sizes",
  PROOFING_RECORD_PLATE: (id: number) => `/proofing-orders/${id}/plate-export`,
  PROOFING_RECORD_DIE: (id: number) => `/proofing-orders/${id}/die-export`,
  PROOFING_UPDATE_FILE: (id: number) => `/proofing-orders/${id}/update-file`,
  PROOFING_DOWNLOAD_FILE: (id: number) =>
    `/proofing-orders/${id}/download-file`,
  PROOFING_COMPLETE: (id: number) => `/proofing-orders/${id}/complete`,
  PROOFING_APPROVE: (id: number) => `/proofing-orders/${id}/approve`,
  PROOFING_START_PRODUCTION: (id: number) =>
    `/proofing-orders/${id}/start-production`,
  PROOFING_COMPLETE_PRODUCTION: (id: number) =>
    `/proofing-orders/${id}/complete-production`,
  PROOFING_HAND_TO_PRODUCTION: (id: number) =>
    `/proofing-orders/${id}/hand-to-production`,
  PROOFING_AVAILABLE_QUANTITY: (designId: number) =>
    `/proofing-orders/available-quantity/${designId}`,

  // ========== PLATE VENDORS ==========
  PLATE_VENDORS: "/plate-vendors",
  PLATE_VENDOR_BY_ID: (id: number) => `/plate-vendors/${id}`,
  PLATE_VENDORS_ACTIVE: "/plate-vendors/active",

  // ========== PRODUCTIONS ==========
  PRODUCTIONS: "/productions",
  PRODUCTION_BY_ID: (id: number) => `/productions/${id}`,
  PRODUCTIONS_BY_PROOFING_ORDER: (proofingOrderId: number) =>
    `/productions/proofing-order/${proofingOrderId}`,
  PRODUCTION_START: (id: number) => `/productions/${id}/start`,
  PRODUCTION_COMPLETE: (id: number) => `/productions/${id}/complete`,

  // ========== DELIVERY NOTES ==========
  DELIVERY_NOTES: "/delivery-notes",
  DELIVERY_NOTE_BY_ID: (id: number) => `/delivery-notes/${id}`,
  DELIVERY_NOTE_STATUS: (id: number) => `/delivery-notes/${id}/status`,
  DELIVERY_NOTE_EXPORT_PDF: (id: number) => `/delivery-notes/${id}/export-pdf`,
  DELIVERY_NOTE_RECREATE: "/delivery-notes/recreate",
};
