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
  MapPin,
  Scissors,
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
  // ==== Phòng ban thiết kế ====
  {
    id: "design-dept",
    title: "Thiết kế",
    icon: Palette,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.DESIGN, ROLE.DESIGN_LEAD],
    children: [
      {
        id: "design-staff",
        title: "Nhân viên thiết kế",
        icon: User,
        path: ROUTE_PATHS.DESIGN.MANAGEMENT,
        allowedRoles: [ROLE.ADMIN, ROLE.DESIGN_LEAD, ROLE.MANAGER],
      },
      {
        id: "design-all",
        title: "Danh sách thiết kế",
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

  // ==== Sale (Bán hàng) ====
  {
    id: "sales",
    title: "Bán hàng",
    icon: ShoppingCart,
    allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.SALE],
    children: [
      {
        id: "sale-orders",
        title: "Đơn hàng( Báo giá)",
        icon: FileText,
        path: ROUTE_PATHS.ORDERS.SALE_ORDERS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.SALE],
      },
      {
        id: "sale-quotes",
        title: "Báo giá cần xử lí",
        icon: FileText,
        path: ROUTE_PATHS.SALES.QUOTE,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.SALE],
      },
      {
        id: "sale-receipts",
        title: "Quản lí phiếu thu",
        icon: Banknote,
        path: ROUTE_PATHS.ACCOUNTING.CASH_RECEIPTS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.SALE],
      },
      {
        id: "sale-design-lookup",
        title: "Tra cứu thiết kế",
        icon: PackageSearch,
        path: ROUTE_PATHS.DESIGN.SALE_LOOKUP,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.SALE],
      },
    ],
  },

  // ==== Khách hàng & Đơn hàng ====
  {
    id: "customer",
    title: "Quản lý khách hàng",
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
      ROLE.SALE,
    ],
    path: ROUTE_PATHS.CUSTOMERS.ROOT,
  },
  {
    id: "orders",
    title: "Đơn hàng ( Tổng quan)",
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
      ROLE.SALE,
    ],
  },
  {
    id: "ready-designs",
    title: "Kho thiết kế",
    icon: Package,
    path: ROUTE_PATHS.DESIGN.READY_DESIGNS,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
      ROLE.DESIGN,
      ROLE.DESIGN_LEAD,
      ROLE.SALE,
    ],
  },

  // ==== Bình bài ====
  {
    id: "proofing",
    title: "Bình bài",
    icon: Layers,
    path: ROUTE_PATHS.PROOFING.ROOT,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.PROOFER,
      ROLE.DESIGN,
      ROLE.DESIGN_LEAD,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
  },
  {
    id: "production-group",
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
        id: "production-orders",
        title: "Lệnh sản xuất",
        icon: Factory,
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

  // ==== Phiếu giao hàng ====
  {
    id: "delivery-notes-list",
    title: "Phiếu giao hàng",
    icon: Truck,
    path: ROUTE_PATHS.DELIVERY_NOTES.ROOT,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
  },

  // ==== Nhà cung cấp ====
  {
    id: "vendor-group",
    title: "Nhà cung cấp",
    icon: Building2,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
    children: [
      {
        id: "accounting-vendors",
        title: "Danh sách nhà cung cấp",
        icon: Building2,
        path: ROUTE_PATHS.VENDORS.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "accounting-cost-pricing",
        title: "Chi phí nhà cung cấp",
        icon: Calculator,
        path: ROUTE_PATHS.ACCOUNTING.COST_PRICING,
        allowedRoles: [ROLE.ADMIN, ROLE.ACCOUNTING, ROLE.ACCOUNTING_LEAD],
      },
    ],
  },

  // ==== Công nợ ====
  {
    id: "debt-group",
    title: "Công nợ",
    icon: Calculator,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
    children: [
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
        id: "ar",
        title: "Công nợ phải thu",
        icon: TrendingUp,
        path: ROUTE_PATHS.ACCOUNTING.AR,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "ap",
        title: "Công nợ phải trả",
        icon: TrendingDown,
        path: ROUTE_PATHS.ACCOUNTING.AP,
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
    ],
  },

  // ==== Tài chính ====
  {
    id: "finance-group",
    title: "Tài chính",
    icon: Wallet,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
    children: [
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
        id: "defect-reports",
        title: "Báo cáo lỗi",
        icon: FileBarChart,
        path: ROUTE_PATHS.ACCOUNTING.DEFECT_REPORTS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "defect-records",
        title: "Nhật ký lỗi sản xuất",
        icon: AlertTriangle,
        path: ROUTE_PATHS.PRODUCTION.DEFECT_RECORDS,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PRODUCTION,
          ROLE.PRODUCTION_LEAD,
        ],
      },
    ],
  },




  // ==== Quản lý kho ====
  {
    id: "stock-summary",
    title: "Tồn kho tổng hợp",
    icon: Package,
    path: ROUTE_PATHS.STOCK.SUMMARY,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.PRODUCTION_LEAD,
      ROLE.PRODUCTION,
    ],
  },
  {
    id: "production-stock",
    title: "Tồn kho sản xuất",
    icon: PackageSearch,
    path: ROUTE_PATHS.REPORTS.INVENTORY.SUMMARY,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.PRODUCTION_LEAD,
      ROLE.PRODUCTION,
    ],
  },
  {
    id: "production-tools",
    title: "Vật tư khuôn mẫu",
    icon: Scissors,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.PROOFER,
      ROLE.ACCOUNTING,
      ROLE.ACCOUNTING_LEAD,
    ],
    children: [
      {
        id: "dies-management",
        title: "Quản lý khuôn cắt",
        icon: Layers,
        path: ROUTE_PATHS.DIES.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PROOFER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "plate-exports",
        title: "Quản lý bản kẽm",
        icon: Package,
        path: ROUTE_PATHS.PLATE_EXPORTS.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PROOFER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
      {
        id: "outside-printing-orders",
        title: "Quản lý in gia công",
        icon: Package,
        path: ROUTE_PATHS.PLATE_EXPORTS.ROOT + "?type=outsource",
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.PROOFER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
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
        id: "admin-settings",
        title: "Cấu hình hệ thống",
        icon: Settings,
        path: ROUTE_PATHS.ADMIN.SETTINGS,
        allowedRoles: [ROLE.ADMIN],
      },

      // {
      //   id: "admin-roles",
      //   title: "Quản lý vai trò",
      //   icon: Shield,
      //   path: ROUTE_PATHS.ADMIN.ROLES,
      //   allowedRoles: [ROLE.ADMIN],
      // },
      {
        id: "design-types",
        title: "Loại thiết kế",
        icon: Settings,
        path: ROUTE_PATHS.DESIGN_TYPES.ROOT,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
      {
        id: "materials-specs",
        title: "Định mức chất liệu",
        icon: FileSpreadsheet,
        path: ROUTE_PATHS.MATERIALS.SPECS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PRODUCTION, ROLE.PRODUCTION_LEAD],
      },
    ],
  },

  // ==== Quản lý nhân viên ====
  // {
  //   id: "employee-management",
  //   title: "Quản lý nhân viên",
  //   icon: UserPlus,
  //   allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
  //   children: [
  //     {
  //       id: "manager-dashboard",
  //       title: "Tổng quan",
  //       icon: LayoutDashboard,
  //       path: ROUTE_PATHS.MANAGER.DASHBOARD,
  //       allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
  //     },
  //     {
  //       id: "employee-assignments",
  //       title: "Phân công công việc",
  //       icon: Briefcase,
  //       path: ROUTE_PATHS.MANAGER.ASSIGNMENTS,
  //       allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
  //     },
  //     {
  //       id: "employee-performance",
  //       title: "Hiệu suất nhân viên",
  //       icon: BarChart3,
  //       path: ROUTE_PATHS.MANAGER.PERFORMANCE,
  //       allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
  //     },
  //   ],
  // },

  // ==== Hành chính ====
  // {
  //   id: "hr",
  //   title: "Hành chính",
  //   icon: Clock,
  //   allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
  //   children: [
  //     {
  //       id: "attendance",
  //       title: "Chấm công",
  //       icon: Clock,
  //       path: ROUTE_PATHS.ATTENDANCE.ROOT,
  //       allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
  //     },
  //   ],
  // },

  // ==== Báo cáo (Đã ẩn theo yêu cầu) ====
  // {
  //   id: "reports",
  //   title: "Báo cáo",
  //   icon: FileBarChart,
  //   allowedRoles: [
  //     ROLE.ADMIN,
  //     ROLE.MANAGER,
  //     ROLE.ACCOUNTING_LEAD,
  //     ROLE.PRODUCTION_LEAD,
  //     ROLE.DESIGN_LEAD,
  //     ROLE.SALE,
  //   ],
  //   children: [
  //     // Inventory Reports
  //     {
  //       id: "inventory-slow-moving",
  //       title: "Hàng chậm luân chuyển",
  //       icon: Activity,
  //       path: ROUTE_PATHS.REPORTS.INVENTORY.SLOW_MOVING,
  //       allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.PRODUCTION_LEAD],
  //     },
  //     // Sales Reports
  //     {
  //       id: "sales-by-period",
  //       title: "Doanh số theo kỳ",
  //       icon: LineChart,
  //       path: ROUTE_PATHS.REPORTS.SALES.BY_PERIOD,
  //       allowedRoles: [
  //         ROLE.ADMIN,
  //         ROLE.MANAGER,
  //         ROLE.ACCOUNTING_LEAD,
  //         ROLE.SALE,
  //       ],
  //     },
  //     {
  //       id: "sales-by-customer",
  //       title: "Doanh số theo khách hàng",
  //       icon: Users,
  //       path: ROUTE_PATHS.REPORTS.SALES.BY_CUSTOMER,
  //       allowedRoles: [
  //         ROLE.ADMIN,
  //         ROLE.MANAGER,
  //         ROLE.ACCOUNTING_LEAD,
  //         ROLE.SALE,
  //       ],
  //     },
  //     {
  //       id: "sales-by-dimension",
  //       title: "Doanh số theo chiều",
  //       icon: PieChart,
  //       path: ROUTE_PATHS.REPORTS.SALES.BY_DIMENSION,
  //       allowedRoles: [
  //         ROLE.ADMIN,
  //         ROLE.MANAGER,
  //         ROLE.ACCOUNTING_LEAD,
  //         ROLE.SALE,
  //       ],
  //     },
  //     {
  //       id: "returns-discounts",
  //       title: "Trả hàng & giảm giá",
  //       icon: FileText,
  //       path: ROUTE_PATHS.REPORTS.SALES.RETURNS_DISCOUNTS,
  //       allowedRoles: [
  //         ROLE.ADMIN,
  //         ROLE.MANAGER,
  //         ROLE.ACCOUNTING_LEAD,
  //         ROLE.SALE,
  //       ],
  //     },
  //     {
  //       id: "order-drill-down",
  //       title: "Chi tiết đơn hàng",
  //       icon: FileSpreadsheet,
  //       path: ROUTE_PATHS.REPORTS.SALES.ORDER_DRILL_DOWN,
  //       allowedRoles: [
  //         ROLE.ADMIN,
  //         ROLE.MANAGER,
  //         ROLE.ACCOUNTING_LEAD,
  //         ROLE.SALE,
  //       ],
  //     },
  //     // Report Exports
  //     {
  //       id: "report-exports",
  //       title: "Báo cáo đã xuất",
  //       icon: FileSpreadsheet,
  //       path: ROUTE_PATHS.REPORTS.EXPORTS,
  //       allowedRoles: [
  //         ROLE.ADMIN,
  //         ROLE.MANAGER,
  //         ROLE.ACCOUNTING_LEAD,
  //         ROLE.SALE,
  //       ],
  //     },
  //   ],
  // },

  // ==== Thông báo ====
  {
    id: "notifications",
    title: "Thông báo",
    icon: Bell,
    path: ROUTE_PATHS.NOTIFICATIONS,
    allowedRoles: ALL,
  },
];
