import { Users, FileText, Palette, Factory, Calculator, Clock, Bell, LayoutDashboard, Package, ChevronRight, Layers } from 'lucide-react';
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
    { title: 'Khách hàng', url: '/customers', icon: Users },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Thiết kế', url: '/design', icon: Palette },
    { title: 'Bình bài', url: '/prepress', icon: Layers },
    { title: 'Sản xuất', url: '/production', icon: Factory },
    { 
      title: 'Kho', 
      icon: Package,
      submenu: [
        { title: 'Quản lý kho', url: '/inventory', icon: Package },
        { title: 'Loại nguyên liệu thô', url: '/material-types', icon: Layers }
      ]
    },
    { title: 'Kế toán', url: '/accounting', icon: Calculator },
    { title: 'Chấm công', url: '/attendance', icon: Clock },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  production_manager: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Sản xuất', url: '/production', icon: Factory },
    { 
      title: 'Kho', 
      icon: Package,
      submenu: [
        { title: 'Quản lý kho', url: '/inventory', icon: Package },
        { title: 'Loại nguyên liệu thô', url: '/material-types', icon: Layers }
      ]
    },
    { title: 'Chấm công', url: '/attendance', icon: Clock },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  designer: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Thiết kế', url: '/design', icon: Palette },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  accountant: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Đơn hàng', url: '/orders', icon: FileText },
    { title: 'Kế toán', url: '/accounting', icon: Calculator },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  prepress: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Bình bài', url: '/prepress', icon: Layers },
    { title: 'Tạo lệnh bình bài', url: '/prepress/create-print-order', icon: FileText },
    { title: 'Thiết kế', url: '/design', icon: Palette },
    { title: 'Sản xuất', url: '/production', icon: Factory },
    { title: 'Thông báo', url: '/notifications', icon: Bell },
  ],
  operator: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Sản xuất', url: '/production', icon: Factory },
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
