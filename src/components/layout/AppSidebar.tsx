import { Users, FileText, Palette, Factory, Calculator, Clock, Bell, LayoutDashboard, Package, ChevronRight, Layers, Settings, Briefcase, Eye, BarChart3, Shield, UserPlus, FileBarChart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePermissions } from '@/lib/permissions';

const navigationByRole = {
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Phòng ban thiết kế',
      icon: Palette,
      submenu: [
        { title: 'Thiết kế', url: '/design', icon: Palette },
        { title: 'Tất cả thiết kế', url: '/design/all', icon: Eye },
        { title: 'Công việc của tôi', url: '/design/my-work', icon: Briefcase },
      ]
    },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Khách hàng', url: '/customers', icon: Users },
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { 
      title: 'Sản xuất',
      icon: Factory,
      submenu: [
        { title: 'Bình bài', url: '/prepress', icon: Layers },
        { title: 'Sản xuất', url: '/production', icon: Factory },
      ]
    },
    { 
      title: 'Kho vật tư',
      icon: Package,
      submenu: [
        { title: 'Quản lý kho', url: '/inventory', icon: Package },
        { title: 'Quản lý chất liệu', url: '/materials', icon: Package },
      ]
    },
    { 
      title: 'Quản lý hệ thống',
      icon: Settings,
      submenu: [
        { title: 'Quản lý người dùng', url: '/admin/users', icon: Users },
        { title: 'Quản lý vai trò', url: '/admin/roles', icon: Shield },
        { title: 'Phân tích phòng ban', url: '/admin/analytics', icon: BarChart3 },
        { title: 'Loại chất liệu', url: '/material-types', icon: Layers },
        { title: 'Loại thiết kế', url: '/design-types', icon: Settings },
        { title: 'Tạo mã thiết kế', url: '/design/code-generator', icon: Settings },
      ]
    },
    { 
      title: 'Hành chính',
      icon: Calculator,
      submenu: [
        { title: 'Kế toán', url: '/accounting', icon: Calculator },
        { title: 'Chấm công', url: '/attendance', icon: Clock },
      ]
    },
    { title: 'Báo cáo', url: '/reports', icon: FileBarChart },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  shareholder: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Phòng ban thiết kế',
      icon: Palette,
      submenu: [
        { title: 'Thiết kế', url: '/design', icon: Palette },
        { title: 'Tất cả thiết kế', url: '/design/all', icon: Eye },
      ]
    },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Khách hàng', url: '/customers', icon: Users },
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { 
      title: 'Sản xuất',
      icon: Factory,
      submenu: [
        { title: 'Bình bài', url: '/prepress', icon: Layers },
        { title: 'Sản xuất', url: '/production', icon: Factory },
      ]
    },
    { 
      title: 'Kho vật tư',
      icon: Package,
      submenu: [
        { title: 'Quản lý kho', url: '/inventory', icon: Package },
        { title: 'Quản lý chất liệu', url: '/materials', icon: Package },
      ]
    },
    { 
      title: 'Quản lý hệ thống',
      icon: Settings,
      submenu: [
        { title: 'Loại chất liệu', url: '/material-types', icon: Layers },
        { title: 'Loại thiết kế', url: '/design-types', icon: Settings },
        { title: 'Tạo mã thiết kế', url: '/design/code-generator', icon: Settings },
      ]
    },
    { 
      title: 'Hành chính',
      icon: Calculator,
      submenu: [
        { title: 'Kế toán', url: '/accounting', icon: Calculator },
      ]
    },
    { title: 'Báo cáo', url: '/reports', icon: FileBarChart },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  designer_manager: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Quản lý thiết kế',
      icon: Palette,
      submenu: [
        { title: 'Dashboard quản lý', url: '/design/management', icon: BarChart3 },
        { title: 'Tất cả thiết kế', url: '/design/all', icon: Eye },
        { title: 'Công việc của tôi', url: '/design/my-work', icon: Briefcase },
      ]
    },
    { 
      title: 'Manager Dashboard',
      icon: Users,
      submenu: [
        { title: 'Tổng quan phòng ban', url: '/manager/dashboard', icon: LayoutDashboard },
        { title: 'Theo dõi hiệu suất', url: '/manager/performance', icon: BarChart3 },
        { title: 'Phân công công việc', url: '/manager/assignments', icon: UserPlus },
      ]
    },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Khách hàng', url: '/customers', icon: Users },
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { 
      title: 'Kho vật tư',
      icon: Package,
      submenu: [
        { title: 'Quản lý chất liệu', url: '/materials', icon: Package },
      ]
    },
    { 
      title: 'Quản lý hệ thống',
      icon: Settings,
      submenu: [
        { title: 'Loại chất liệu', url: '/material-types', icon: Layers },
        { title: 'Loại thiết kế', url: '/design-types', icon: Settings },
        { title: 'Tạo mã thiết kế', url: '/design/code-generator', icon: Settings },
      ]
    },
    { title: 'Báo cáo', url: '/reports', icon: FileBarChart },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  production_manager: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Manager Dashboard',
      icon: Users,
      submenu: [
        { title: 'Tổng quan phòng ban', url: '/manager/dashboard', icon: LayoutDashboard },
        { title: 'Theo dõi hiệu suất', url: '/manager/performance', icon: BarChart3 },
        { title: 'Phân công công việc', url: '/manager/assignments', icon: UserPlus },
      ]
    },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { 
      title: 'Sản xuất',
      icon: Factory,
      submenu: [
        { title: 'Sản xuất', url: '/production', icon: Factory },
      ]
    },
    { 
      title: 'Kho vật tư',
      icon: Package,
      submenu: [
        { title: 'Quản lý kho', url: '/inventory', icon: Package },
        { title: 'Quản lý chất liệu', url: '/materials', icon: Package },
      ]
    },
    { 
      title: 'Quản lý hệ thống',
      icon: Settings,
      submenu: [
        { title: 'Loại chất liệu', url: '/material-types', icon: Layers },
      ]
    },
    { 
      title: 'Hành chính',
      icon: Calculator,
      submenu: [
        { title: 'Chấm công', url: '/attendance', icon: Clock },
      ]
    },
    { title: 'Báo cáo', url: '/reports', icon: FileBarChart },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  designer: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Phòng ban thiết kế',
      icon: Palette,
      submenu: [
        { title: 'Thiết kế', url: '/design', icon: Palette },
        { title: 'Tất cả thiết kế', url: '/design/all', icon: Eye },
        { title: 'Công việc của tôi', url: '/design/my-work', icon: Briefcase },
      ]
    },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  accountant: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { 
      title: 'Hành chính',
      icon: Calculator,
      submenu: [
        { title: 'Kế toán', url: '/accounting', icon: Calculator },
      ]
    },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  prepress: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Phòng ban thiết kế',
      icon: Palette,
      submenu: [
        { title: 'Thiết kế', url: '/design', icon: Palette },
        { title: 'Tất cả thiết kế', url: '/design/all', icon: Eye },
      ]
    },
    { 
      title: 'Sản xuất',
      icon: Factory,
      submenu: [
        { title: 'Bình bài', url: '/prepress', icon: Layers },
        { title: 'Tạo lệnh bình bài', url: '/prepress/create-print-order', icon: FileText },
        { title: 'Sản xuất', url: '/production', icon: Factory },
      ]
    },
    { title: 'Báo cáo', url: '/reports', icon: FileBarChart },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  operator: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Sản xuất',
      icon: Factory,
      submenu: [
        { title: 'Sản xuất', url: '/production', icon: Factory },
      ]
    },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  customer_service: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { 
      title: 'Khách hàng & Đơn hàng',
      icon: Users,
      submenu: [
        { title: 'Khách hàng', url: '/customers', icon: Users },
        { title: 'Đơn hàng', url: '/orders', icon: FileText },
      ]
    },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || 'operator');
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  
  if (!user) return null;
  
  // Filter menu items based on permissions
  const baseMenuItems = navigationByRole[user.role] || navigationByRole.admin;
  const menuItems = baseMenuItems.filter(item => {
    // Luôn hiển thị Dashboard
    if (item.url === '/dashboard') return true;
    
    // Check permissions cho từng module
    const module = item.url?.replace('/', '') || '';
    return permissions.canAccessModule(module);
  });

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
            PS
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">PrintSys</h2>
            <p className="text-xs text-sidebar-foreground/70">Hệ thống quản lý in ấn</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.submenu ? (
                    <Collapsible 
                      open={openSubmenus.includes(item.title)}
                      onOpenChange={() => toggleSubmenu(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronRight 
                            className={`h-4 w-4 transition-transform duration-200 ${
                              openSubmenus.includes(item.title) ? 'rotate-90' : ''
                            }`} 
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.submenu.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={({ isActive }) =>
                                    isActive
                                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                  }
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
