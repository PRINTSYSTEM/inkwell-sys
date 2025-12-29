import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  ShoppingCart,
  Palette,
  Package,
  BarChart3,
  Settings,
  Users,
  Factory,
  UserIcon,
  LogOut,
  Calculator,
  UserCheck,
  FileText,
  Building2,
  Scissors,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface SidebarSubItem {
  title: string;
  href: string;
}

interface SidebarDepartment {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SidebarSubItem[];
}

const departments: SidebarDepartment[] = [
  {
    title: "Quản lý",
    icon: Building2,
    items: [
      { title: "Dashboard", href: "/dashboard" },
      { title: "Quản lý nhân viên", href: "/manager/employees" },
      { title: "Phân công công việc", href: "/manager/assignments" },
      { title: "Báo cáo tổng quan", href: "/manager/reports" },
    ],
  },
  {
    title: "Thiết kế",
    icon: Palette,
    items: [
      { title: "Danh sách thiết kế", href: "/design" },
      { title: "Tạo thiết kế mới", href: "/design/create" },
      { title: "Phân công thiết kế", href: "/design/assignments" },
      { title: "Loại thiết kế", href: "/design-types" },
    ],
  },
  {
    title: "Đơn hàng",
    icon: ShoppingCart,
    items: [
      { title: "Danh sách đơn hàng", href: "/orders" },
      { title: "Tạo đơn hàng", href: "/orders/create" },
      { title: "Theo dõi đơn hàng", href: "/orders/tracking" },
    ],
  },
  {
    title: "Sản xuất",
    icon: Factory,
    items: [
      { title: "Kế hoạch sản xuất", href: "/production" },
      { title: "Tiến độ sản xuất", href: "/production/progress" },
      { title: "Quản lý máy móc", href: "/production/machines" },
    ],
  },
  {
    title: "Prepress",
    icon: Scissors,
    items: [
      { title: "Chuẩn bị in", href: "/prepress" },
      { title: "Kiểm tra file", href: "/prepress/check" },
      { title: "Xuất bản in", href: "/prepress/output" },
    ],
  },
  {
    title: "Vật liệu",
    icon: Package,
    items: [
      { title: "Kho vật liệu", href: "/materials" },
      { title: "Nhập xuất kho", href: "/inventory" },
      { title: "Loại vật liệu", href: "/material-types" },
    ],
  },
  {
    title: "Kho",
    icon: Package,
    items: [
      { title: "Phiếu nhập kho", href: "/stock/stock-ins" },
      { title: "Phiếu xuất kho", href: "/stock/stock-outs" },
      { title: "Nhà cung cấp", href: "/vendors" },
    ],
  },
  {
    title: "Khách hàng",
    icon: Users,
    items: [
      { title: "Danh sách khách hàng", href: "/customers" },
      { title: "Thêm khách hàng", href: "/customers/create" },
      { title: "Lịch sử giao dịch", href: "/customers/history" },
    ],
  },
  {
    title: "Kế toán",
    icon: Calculator,
    items: [
      { title: "Quản lý thanh toán", href: "/accounting" },
      { title: "Báo cáo công nợ", href: "/accounting/debt-report" },
      { title: "Doanh thu", href: "/accounting/revenue" },
      { title: "Chi phí", href: "/accounting/expenses" },
    ],
  },
  {
    title: "Chấm công",
    icon: UserCheck,
    items: [
      { title: "Chấm công nhân viên", href: "/attendance" },
      { title: "Báo cáo chấm công", href: "/attendance/reports" },
    ],
  },
  {
    title: "Quản trị",
    icon: Settings,
    items: [
      { title: "Quản lý người dùng", href: "/admin/users" },
      { title: "Phân quyền", href: "/admin/permissions" },
      { title: "Cài đặt hệ thống", href: "/admin/settings" },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openDepartments, setOpenDepartments] = useState<
    Record<string, boolean>
  >({});

  const handleLogout = async () => {
    await logout();
  };

  const toggleDepartment = (departmentTitle: string) => {
    setOpenDepartments((prev) => ({
      ...prev,
      [departmentTitle]: !prev[departmentTitle],
    }));
  };

  const isItemActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-background border-r",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <img
            src="/images/logo.png"
            alt="QUANG ĐẠT DESIGN - PRINTING"
            className="h-10 w-auto object-contain"
          />
          QUANG ĐẠT
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {departments.map((department) => {
          const Icon = department.icon;
          const isOpen = openDepartments[department.title];
          const hasActiveItem = department.items.some((item) =>
            isItemActive(item.href)
          );

          return (
            <Collapsible
              key={department.title}
              open={isOpen}
              onOpenChange={() => toggleDepartment(department.title)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-sm font-medium mb-1",
                    hasActiveItem
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {department.title}
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1">
                {department.items.map((item) => {
                  const isActive = isItemActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "block rounded-lg px-8 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Reports - Standalone */}
        <Link
          to="/reports"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground mt-2",
            isItemActive("/reports")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Báo cáo
        </Link>

        {/* Notifications - Standalone */}
        <Link
          to="/notifications"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            isItemActive("/notifications")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Thông báo
        </Link>
      </nav>

      {/* User info and logout */}
      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
