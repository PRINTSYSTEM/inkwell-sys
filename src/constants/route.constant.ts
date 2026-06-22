// src/constants/routes.ts

export const ROUTE_PATHS = {
  ROOT: "/" as const,

  AUTH: {
    LOGIN: "/login" as const,
  },

  DASHBOARD: "/dashboard" as const,

  DESIGN: {
    ROOT: "/design" as const,
    ALL: "/design/all" as const,
    MY_WORK: "/design/my-work" as const,
    MANAGEMENT: "/design/management" as const,
    SALE_LOOKUP: "/design/sale-lookup" as const,
    DETAIL_BASE: "/design/detail" as const, // prefix cho /design/detail/:id
    DESIGNER_DETAIL: "/design/designer" as const, // prefix cho /design/designer/:id
    READY_DESIGNS: "/design/ready-designs" as const,
  },

  ORDERS: {
    ROOT: "/orders" as const, // list
    SALE_ORDERS: "/orders/sale" as const,
    NEW: "/orders/new" as const,
    DETAIL_BASE: "/orders" as const, // prefix cho /orders/:id
  },

  CUSTOMERS: {
    ROOT: "/customers" as const,
    DETAIL_BASE: "/customers" as const, // prefix cho /customers/:id
    NEW: "/customers/create" as const,
  },

  DESIGN_TYPES: {
    ROOT: "/design-types" as const,
  },

  PROOFING: {
    ROOT: "/proofing" as const,
    WAITING_DESIGNS: "/proofing/waiting-designs" as const,
    CREATE_PRINT_ORDER: "/proofing/create-print-order" as const,
    CREATE: "/proofing/create" as const,
  },
  DIES: {
    ROOT: "/proofing/dies" as const,
  },
  PLATE_EXPORTS: {
    ROOT: "/plate-exports" as const,
    DETAIL_BASE: "/plate-exports" as const, // prefix cho /plate-exports/:id
  },
  PRODUCTION: {
    ROOT: "/productions" as const,
    DETAIL: "/productions/:id" as const,
    DEFECT_RECORDS: "/production/defect-records" as const,
  },


  INVENTORY: {
    ROOT: "/inventory" as const,
  },

  MATERIALS: {
    ROOT: "/materials" as const,
  },

  MATERIAL_TYPES: {
    ROOT: "/material-types" as const,
  },

  STOCK: {
    ROOT: "/stock" as const,
    SUMMARY: "/stock/summary" as const,
    STOCK_INS: "/stock/stock-ins" as const,
    STOCK_INS_CREATE: "/stock/stock-ins/create" as const,
    STOCK_OUTS: "/stock/stock-outs" as const,
    STOCK_OUTS_CREATE: "/stock/stock-outs/create" as const,
    MATERIAL_CUTS: "/stock/material-cuts" as const,
    MATERIAL_CUTS_CREATE: "/stock/material-cuts/create" as const,
    MATERIAL_CUTS_DETAIL: (id: string | number) => `/stock/material-cuts/${id}` as const,
  },

  VENDORS: {
    ROOT: "/vendors" as const,
    DETAIL_BASE: "/vendors" as const, // prefix cho /vendors/:id
  },

  ACCOUNTING: {
    ROOT: "/accounting" as const,
    PAYMENT: "/accounting/payment" as const,
    INVOICE: "/accounting/invoice" as const,
    DELIVERY: "/accounting/delivery" as const,
    DEBT_REPORT: "/accounting/debt-report" as const,
    REVENUE: "/accounting/revenue" as const,
    EXPENSES: "/accounting/expenses" as const,
    COST_PRICING: "/accounting/cost-pricing" as const,
    // Cash Management
    CASH_FUNDS: "/accounting/cash-funds" as const,
    CASH_PAYMENTS: "/accounting/cash-payments" as const,
    CASH_RECEIPTS: "/accounting/cash-receipts" as const,
    CASH_BOOK: "/accounting/cash-book" as const,
    // Bank Management
    BANK_ACCOUNTS: "/accounting/bank-accounts" as const,
    // AR/AP
    AR: "/accounting/ar" as const,
    AR_BY_ITEM: "/accounting/ar/by-item" as const,
    AR_UNDERDUE: "/accounting/ar/underdue" as const,
    AR_SUMMARY_BY_CUSTOMER_GROUP: "/accounting/ar/summary-by-customer-group" as const,
    AR_SUMMARY_BY_BRANCH: "/accounting/ar/summary-by-branch" as const,
    AP: "/accounting/ap" as const,
    AP_BY_PURCHASE_INVOICE: "/accounting/ap/by-purchase-invoice" as const,
    AP_OVERDUE: "/accounting/ap/overdue" as const,
    COLLECTION_SCHEDULE: "/accounting/collection-schedule" as const,
    // Debt Notifications & Reconciliations
    DEBT_NOTIFICATIONS: "/accounting/debt-notifications" as const,
    DEBT_RECONCILIATION_AR: "/accounting/debt-reconciliations/ar" as const,
    DEBT_RECONCILIATION_AP: "/accounting/debt-reconciliations/ap" as const,
    // Expense & Payment Method
    EXPENSE_CATEGORIES: "/accounting/expense-categories" as const,
    PAYMENT_METHODS: "/accounting/payment-methods" as const,
    DEFECT_REPORTS: "/accounting/defect-reports" as const,
  },


  DELIVERY_NOTES: {
    ROOT: "/delivery-notes" as const,
    DETAIL_BASE: "/delivery-notes" as const, // prefix cho /delivery-notes/:id
  },

  INVOICES: {
    DETAIL_BASE: "/accounting/invoice" as const, // prefix cho /invoices/:id
  },

  ATTENDANCE: {
    ROOT: "/attendance" as const,
  },
  ADMIN: {
    ROOT: "/admin" as const,
    USERS: "/admin/users" as const,
    USERS_CREATE: "/admin/users/create" as const,
    USERS_DETAIL: "/admin/users/:id" as const,
    ROLES: "/admin/roles" as const,
    SETTINGS: "/admin/settings" as const,
    ANALYTICS: "/admin/analytics" as const,
    SHARED_ADDRESSES: "/admin/shared-addresses" as const,
  },

  MANAGER: {
    ROOT: "/manager" as const,
    DASHBOARD: "/manager/dashboard" as const,
    EMPLOYEES: "/manager/employees" as const,
    EMPLOYEES_DETAIL_BASE: "/manager/employees" as const, // prefix cho /manager/employees/:id
    ASSIGNMENTS: "/manager/assignments" as const,
    PERFORMANCE: "/manager/performance" as const,
  },

  REPORTS: {
    ROOT: "/reports" as const,
    // Inventory Reports
    INVENTORY: {
      CURRENT_STOCK: "/reports/inventory/current-stock" as const,
      SUMMARY: "/reports/inventory/summary" as const,
      LOW_STOCK: "/reports/inventory/low-stock" as const,
      SLOW_MOVING: "/reports/inventory/slow-moving" as const,
      STOCK_CARD: "/reports/inventory/stock-card" as const,
    },
    // Sales Reports
  SALES: {
      BY_PERIOD: "/reports/sales/by-period" as const,
      BY_CUSTOMER: "/reports/sales/by-customer" as const,
      BY_DIMENSION: "/reports/sales/by-dimension" as const,
      TOP_PRODUCTS: "/reports/sales/top-products" as const,
      RETURNS_DISCOUNTS: "/reports/sales/returns-discounts" as const,
      ORDER_DRILL_DOWN: "/reports/sales/order-drill-down" as const,
    },
    // Report Exports
    EXPORTS: "/reports/exports" as const,
  },
  NOTIFICATIONS: "/notifications" as const,
  PROFILE: "/profile" as const,
SALES: {
      ROOT: "/sales" as const,
      QUOTE: "/sales/quote" as const,
}
} as const;

  