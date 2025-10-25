import { Users, FileText, Palette, Factory, Calculator, Clock, Bell, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { currentUser } from '@/lib/mockData';

const navigationByRole = {
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Khách hàng', url: '/customers', icon: Users },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Thiết kế', url: '/design', icon: Palette },
    { title: 'Sản xuất', url: '/production', icon: Factory },
    { title: 'Kế toán', url: '/accounting', icon: Calculator },
    { title: 'Chấm công', url: '/attendance', icon: Clock },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  cskh: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Khách hàng', url: '/customers', icon: Users },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  design: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Thiết kế', url: '/design', icon: Palette },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  production: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Sản xuất', url: '/production', icon: Factory },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  production_manager: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Sản xuất', url: '/production', icon: Factory },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  accounting: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Kế toán', url: '/accounting', icon: Calculator },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  hr: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Chấm công', url: '/attendance', icon: Clock },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
};

export function AppSidebar() {
  const menuItems = navigationByRole[currentUser.role] || navigationByRole.admin;

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
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
