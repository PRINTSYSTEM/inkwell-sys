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
    DETAIL_BASE: "/design/detail" as const, // prefix cho /design/detail/:id
    DESIGNER_DETAIL: "/design/designer" as const, // prefix cho /design/designer/:id
  },

  ORDERS: {
    ROOT: "/orders" as const, // list
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
    CREATE_PRINT_ORDER: "/proofing/create-print-order" as const,
    CREATE: "/proofing/create" as const,
  },
  DIES: {
    ROOT: "/proofing/dies" as const,
  },
  PRODUCTION: {
    ROOT: "/productions" as const,
    DETAIL: "/productions/:id" as const,
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
    STOCK_INS: "/stock/stock-ins" as const,
    STOCK_INS_CREATE: "/stock/stock-ins/create" as const,
    STOCK_OUTS: "/stock/stock-outs" as const,
    STOCK_OUTS_CREATE: "/stock/stock-outs/create" as const,
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
    // Cash Management
    CASH_FUNDS: "/accounting/cash-funds" as const,
    CASH_PAYMENTS: "/accounting/cash-payments" as const,
    CASH_RECEIPTS: "/accounting/cash-receipts" as const,
    CASH_BOOK: "/accounting/cash-book" as const,
    // Bank Management
    BANK_ACCOUNTS: "/accounting/bank-accounts" as const,
    BANK_LEDGER: "/accounting/bank-ledger" as const,
    // AR/AP
    AR: "/accounting/ar" as const,
    AP: "/accounting/ap" as const,
    COLLECTION_SCHEDULE: "/accounting/collection-schedule" as const,
    // Expense & Payment Method
    EXPENSE_CATEGORIES: "/accounting/expense-categories" as const,
    PAYMENT_METHODS: "/accounting/payment-methods" as const,
  },

  DELIVERY_NOTES: {
    ROOT: "/delivery-notes" as const,
    DETAIL_BASE: "/delivery-notes" as const, // prefix cho /delivery-notes/:id
  },

  INVOICES: {
    ROOT: "/invoices" as const,
    DETAIL_BASE: "/invoices" as const, // prefix cho /invoices/:id
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
    ANALYTICS: "/admin/analytics" as const,
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
} as const;
