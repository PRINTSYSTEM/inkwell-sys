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

  ACCOUNTING: {
    ROOT: "/accounting" as const,
    DEBT_REPORT: "/accounting/debt-report" as const,
    REVENUE: "/accounting/revenue" as const,
    EXPENSES: "/accounting/expenses" as const,
  },

  ATTENDANCE: {
    ROOT: "/attendance" as const,
  },
  ADMIN: {
    ROOT: "/admin" as const,
    USERS: "/admin/users" as const,
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

  REPORTS: "/reports" as const,
  NOTIFICATIONS: "/notifications" as const,
} as const;
