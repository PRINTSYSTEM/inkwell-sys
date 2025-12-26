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
        id: "admin-analytics",
        title: "Phân tích phòng ban",
        icon: BarChart3,
        path: ROUTE_PATHS.ADMIN.ANALYTICS,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
      },
      {
        id: "material-types",
        title: "Loại chất liệu",
        icon: Layers,
        path: ROUTE_PATHS.MATERIAL_TYPES.ROOT,
        allowedRoles: [ROLE.ADMIN, ROLE.MANAGER],
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
        id: "accounting-dashboard",
        title: "Chờ xử lý",
        icon: Calculator,
        path: ROUTE_PATHS.ACCOUNTING.ROOT,
        allowedRoles: [
          ROLE.ADMIN,
          ROLE.MANAGER,
          ROLE.ACCOUNTING,
          ROLE.ACCOUNTING_LEAD,
        ],
      },
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
      // {
      //   id: "accounting-revenue",
      //   title: "Doanh thu",
      //   icon: BarChart3,
      //   path: ROUTE_PATHS.ACCOUNTING.REVENUE,
      //   allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      // },
      // {
      //   id: "accounting-expenses",
      //   title: "Chi phí",
      //   icon: FileText,
      //   path: ROUTE_PATHS.ACCOUNTING.EXPENSES,
      //   allowedRoles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.ACCOUNTING_LEAD],
      // },
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
    path: ROUTE_PATHS.REPORTS,
    allowedRoles: [
      ROLE.ADMIN,
      ROLE.MANAGER,
      ROLE.ACCOUNTING_LEAD,
      ROLE.PRODUCTION_LEAD,
      ROLE.DESIGN_LEAD,
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
