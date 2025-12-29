// src/config/menuConfig.ts
import type { LucideIcon } from "lucide-react";
import {
  Users,
  FileText,
  Palette,
  Factory,
  Calculator,
  Clock,
  Bell,
  LayoutDashboard,
  Package,
  Layers,
  Settings,
  Briefcase,
  Eye,
  BarChart3,
  Shield,
  UserPlus,
  FileBarChart,
  User,
  CreditCard,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  Wallet,
  Banknote,
  Receipt,
  BookOpen,
  Landmark,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  PieChart,
  LineChart,
  PackageSearch,
  AlertTriangle,
  Activity,
  FileSpreadsheet,
} from "lucide-react";
import type { UserRole } from "@/Schema";
import { ROLE, ROUTE_PATHS } from "@/constants";

type RoleList = "all" | UserRole[];

export interface MenuItemBase {
  id: string;
  title: string;
  icon: LucideIcon;
  allowedRoles: RoleList;
}

export interface MenuItemLeaf extends MenuItemBase {
  path: string;
  children?: undefined;
}

export interface MenuItemGroup extends MenuItemBase {
  path?: undefined;
  children: MenuItemLeaf[];
}

export type MenuItem = MenuItemLeaf | MenuItemGroup;

// Helper cho allowedRoles = "ai cũng thấy"
const ALL: RoleList = "all";

export const MENU_ITEMS: MenuItem[] = [
  // ==== Dashboard ====
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    path: ROUTE_PATHS.DASHBOARD,
    allowedRoles: ALL,
  },

  // ==== Phòng ban thiết kế ====
  {
    id: "design-dept",
    title: "Phòng ban thiết kế",
    icon: Palette,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.DESIGN, ROLE.DESIGN_LEAD],
    children: [
      {
        id: "design-staff",
        title: "Tất cả nhân viên",
        icon: User,
        path: ROUTE_PATHS.DESIGN.MANAGEMENT,
        allowedRoles: [ROLE.ADMIN, ROLE.DESIGN_LEAD, ROLE.MANAGER],
      },
      {
        id: "design-all",
        title: "Tất cả thiết kế",
        icon: Eye,
        path: ROUTE_PATHS.DESIGN.ALL,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.DESIGN_LEAD],
      },
      {
        id: "design-my-work",
        title: "Công việc của tôi",
        icon: Briefcase,
        path: ROUTE_PATHS.DESIGN.MY_WORK,
        allowedRoles: [ROLE.DESIGN, ROLE.DESIGN_LEAD],
      },
    ],
  },

  // ==== Khách hàng & Đơn hàng ====
  {
    id: "customer",
    title: "Khách hàng",
    icon: Users,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
      ROLE.DESIGN,
      ROLE.DESIGN_LEAD,
      ROLE.PRODUCTION,
      ROLE.PRODUCTION_LEAD,
    ],
    path: ROUTE_PATHS.CUSTOMERS.ROOT,
  },
  {
    id: "orders",
    title: "Đơn hàng",
    icon: FileText,
    path: ROUTE_PATHS.ORDERS.ROOT,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
      ROLE.PRODUCTION,
      ROLE.PRODUCTION_LEAD,
      ROLE.DESIGN,
      ROLE.DESIGN_LEAD,
    ],
  },

  // ==== Sản xuất ====
  {
    id: "proofing",
    title: "Bình bài",
    icon: Factory,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PROOFER],
    children: [
      {
        id: "proofing",
        title: "Danh sách bình bài",
        icon: Layers,
        path: ROUTE_PATHS.PROOFING.ROOT,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PROOFER],
      },
      {
        id: "proofing-create-print-order",
        title: "Tạo lệnh bình bài",
        icon: Layers,
        path: ROUTE_PATHS.PROOFING.CREATE,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PROOFER],
      },
    ],
  },
  {
    id: "production",
    title: "Sản xuất",
    icon: Factory,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.PRODUCTION,
      ROLE.PRODUCTION_LEAD,
    ],
    children: [
      {
        id: "production",
        title: "Danh sách sản xuất",
        icon: Layers,
        path: ROUTE_PATHS.PRODUCTION.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION,
          ROLE.PRODUCTION_LEAD,
        ],
      },
    ],
  },

  // ==== Kho vật tư ====
  {
    id: "inventory",
    title: "Kho vật tư",
    icon: Package,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PRODUCTION_LEAD],
    children: [
      {
        id: "inventory-main",
        title: "Quản lý kho",
        icon: Package,
        path: ROUTE_PATHS.INVENTORY.ROOT,
        allowedRoles: [ROLE.ADMIN],
      },
      {
        id: "materials",
        title: "Quản lý chất liệu",
        icon: Package,
        path: ROUTE_PATHS.MATERIALS.ROOT,
        allowedRoles: [ROLE.ADMIN, ROLE.PRODUCTION_LEAD, ROLE.DESIGN_LEAD],
      },
    ],
  },

  // ==== Quản lý kho ====
  {
    id: "stock-management",
    title: "Quản lý kho",
    icon: Package,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.PRODUCTION_LEAD,
      ROLE.PRODUCTION,
    ],
    children: [
      {
        id: "stock-ins",
        title: "Phiếu nhập kho",
        icon: ArrowDownToLine,
        path: ROUTE_PATHS.STOCK.STOCK_INS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION_LEAD,
          ROLE.PRODUCTION,
        ],
      },
      {
        id: "stock-outs",
        title: "Phiếu xuất kho",
        icon: ArrowUpFromLine,
        path: ROUTE_PATHS.STOCK.STOCK_OUTS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION_LEAD,
          ROLE.PRODUCTION,
        ],
      },
      {
        id: "vendors",
        title: "Nhà cung cấp",
        icon: Building2,
        path: ROUTE_PATHS.VENDORS.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION_LEAD,
          ROLE.PROOFER,
        ],
      },
    ],
  },

  // ==== Quản lý hệ thống ====
  {
    id: "system",
    title: "Quản lý hệ thống",
    icon: Settings,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
    children: [
      {
        id: "admin-users",
        title: "Quản lý người dùng",
        icon: Users,
        path: ROUTE_PATHS.ADMIN.USERS,
        allowedRoles: [ROLE.ADMIN],
      },
      {
        id: "admin-roles",
        title: "Quản lý vai trò",
        icon: Shield,
        path: ROUTE_PATHS.ADMIN.ROLES,
        allowedRoles: [ROLE.ADMIN],
      },
      {
        id: "design-types",
        title: "Loại thiết kế",
        icon: Settings,
        path: ROUTE_PATHS.DESIGN_TYPES.ROOT,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
    ],
  },

  // ==== Kế toán ====
  {
    id: "accounting-dept",
    title: "Kế toán",
    icon: Calculator,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
    children: [
      {
        id: "accounting-payment",
        title: "Thanh toán",
        icon: CreditCard,
        path: ROUTE_PATHS.ACCOUNTING.PAYMENT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "accounting-invoice",
        title: "Hóa đơn",
        icon: FileText,
        path: ROUTE_PATHS.ACCOUNTING.INVOICE,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "invoices-list",
        title: "Danh sách hóa đơn",
        icon: FileText,
        path: ROUTE_PATHS.INVOICES.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "accounting-delivery",
        title: "Giao hàng",
        icon: Truck,
        path: ROUTE_PATHS.ACCOUNTING.DELIVERY,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "delivery-notes-list",
        title: "Danh sách phiếu giao hàng",
        icon: Truck,
        path: ROUTE_PATHS.DELIVERY_NOTES.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "accounting-debt-report",
        title: "Báo cáo công nợ",
        icon: FileBarChart,
        path: ROUTE_PATHS.ACCOUNTING.DEBT_REPORT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      // Cash Management
      {
        id: "cash-funds",
        title: "Quỹ tiền mặt",
        icon: Wallet,
        path: ROUTE_PATHS.ACCOUNTING.CASH_FUNDS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "cash-payments",
        title: "Phiếu chi",
        icon: Receipt,
        path: ROUTE_PATHS.ACCOUNTING.CASH_PAYMENTS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "cash-receipts",
        title: "Phiếu thu",
        icon: Banknote,
        path: ROUTE_PATHS.ACCOUNTING.CASH_RECEIPTS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "cash-book",
        title: "Sổ quỹ",
        icon: BookOpen,
        path: ROUTE_PATHS.ACCOUNTING.CASH_BOOK,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      // Bank Management
      {
        id: "bank-accounts",
        title: "Tài khoản ngân hàng",
        icon: Landmark,
        path: ROUTE_PATHS.ACCOUNTING.BANK_ACCOUNTS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "bank-ledger",
        title: "Sổ ngân hàng",
        icon: BookOpen,
        path: ROUTE_PATHS.ACCOUNTING.BANK_LEDGER,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      // AR
      {
        id: "ar-summary",
        title: "Công nợ phải thu - Tổng hợp",
        icon: TrendingUp,
        path: ROUTE_PATHS.ACCOUNTING.AR_SUMMARY,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "ar-detail",
        title: "Công nợ phải thu - Chi tiết",
        icon: FileText,
        path: ROUTE_PATHS.ACCOUNTING.AR_DETAIL,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "ar-aging",
        title: "Công nợ phải thu - Phân tích tuổi nợ",
        icon: BarChart3,
        path: ROUTE_PATHS.ACCOUNTING.AR_AGING,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      // AP
      {
        id: "ap-summary",
        title: "Công nợ phải trả - Tổng hợp",
        icon: TrendingDown,
        path: ROUTE_PATHS.ACCOUNTING.AP_SUMMARY,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "ap-detail",
        title: "Công nợ phải trả - Chi tiết",
        icon: FileText,
        path: ROUTE_PATHS.ACCOUNTING.AP_DETAIL,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "ap-aging",
        title: "Công nợ phải trả - Phân tích tuổi nợ",
        icon: BarChart3,
        path: ROUTE_PATHS.ACCOUNTING.AP_AGING,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "collection-schedule",
        title: "Lịch thu tiền",
        icon: Calendar,
        path: ROUTE_PATHS.ACCOUNTING.COLLECTION_SCHEDULE,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      // Expense & Payment Method
      {
        id: "expense-categories",
        title: "Danh mục chi phí",
        icon: DollarSign,
        path: ROUTE_PATHS.ACCOUNTING.EXPENSE_CATEGORIES,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "payment-methods",
        title: "Phương thức thanh toán",
        icon: CreditCard,
        path: ROUTE_PATHS.ACCOUNTING.PAYMENT_METHODS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
    ],
  },

  // ==== Quản lý nhân viên ====
  {
    id: "employee-management",
    title: "Quản lý nhân viên",
    icon: UserPlus,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
    children: [
      {
        id: "manager-dashboard",
        title: "Tổng quan",
        icon: LayoutDashboard,
        path: ROUTE_PATHS.MANAGER.DASHBOARD,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
      {
        id: "employee-assignments",
        title: "Phân công công việc",
        icon: Briefcase,
        path: ROUTE_PATHS.MANAGER.ASSIGNMENTS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
      {
        id: "employee-performance",
        title: "Hiệu suất nhân viên",
        icon: BarChart3,
        path: ROUTE_PATHS.MANAGER.PERFORMANCE,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
    ],
  },

  // ==== Hành chính ====
  {
    id: "hr",
    title: "Hành chính",
    icon: Clock,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
    children: [
      {
        id: "attendance",
        title: "Chấm công",
        icon: Clock,
        path: ROUTE_PATHS.ATTENDANCE.ROOT,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
    ],
  },

  // ==== Báo cáo ====
  {
    id: "reports",
    title: "Báo cáo",
    icon: FileBarChart,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING_LEAD,
      ROLE.PRODUCTION_LEAD,
      ROLE.DESIGN_LEAD,
    ],
    children: [
      // Inventory Reports
      {
        id: "inventory-current-stock",
        title: "Tồn kho hiện tại",
        icon: PackageSearch,
        path: ROUTE_PATHS.REPORTS.INVENTORY.CURRENT_STOCK,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION_LEAD,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "inventory-summary",
        title: "Tổng hợp tồn kho",
        icon: FileBarChart,
        path: ROUTE_PATHS.REPORTS.INVENTORY.SUMMARY,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION_LEAD,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "inventory-low-stock",
        title: "Hàng tồn kho thấp",
        icon: AlertTriangle,
        path: ROUTE_PATHS.REPORTS.INVENTORY.LOW_STOCK,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PRODUCTION_LEAD],
      },
      {
        id: "inventory-slow-moving",
        title: "Hàng chậm luân chuyển",
        icon: Activity,
        path: ROUTE_PATHS.REPORTS.INVENTORY.SLOW_MOVING,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PRODUCTION_LEAD],
      },
      // Sales Reports
      {
        id: "sales-by-period",
        title: "Doanh số theo kỳ",
        icon: LineChart,
        path: ROUTE_PATHS.REPORTS.SALES.BY_PERIOD,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
      {
        id: "sales-by-customer",
        title: "Doanh số theo khách hàng",
        icon: Users,
        path: ROUTE_PATHS.REPORTS.SALES.BY_CUSTOMER,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
      {
        id: "sales-by-dimension",
        title: "Doanh số theo chiều",
        icon: PieChart,
        path: ROUTE_PATHS.REPORTS.SALES.BY_DIMENSION,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
      {
        id: "top-products",
        title: "Sản phẩm bán chạy",
        icon: ShoppingCart,
        path: ROUTE_PATHS.REPORTS.SALES.TOP_PRODUCTS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
      {
        id: "returns-discounts",
        title: "Trả hàng & giảm giá",
        icon: FileText,
        path: ROUTE_PATHS.REPORTS.SALES.RETURNS_DISCOUNTS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
      {
        id: "order-drill-down",
        title: "Chi tiết đơn hàng",
        icon: FileSpreadsheet,
        path: ROUTE_PATHS.REPORTS.SALES.ORDER_DRILL_DOWN,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
      // Report Exports
      {
        id: "report-exports",
        title: "Báo cáo đã xuất",
        icon: FileSpreadsheet,
        path: ROUTE_PATHS.REPORTS.EXPORTS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      },
    ],
  },

  // ==== Thông báo ====
  {
    id: "notifications",
    title: "Thông báo",
    icon: Bell,
    path: ROUTE_PATHS.NOTIFICATIONS,
    allowedRoles: ALL,
  },
];
