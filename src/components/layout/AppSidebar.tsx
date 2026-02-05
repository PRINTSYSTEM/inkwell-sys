// src/components/layout/AppSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import type { UserRole } from "@/Schema";
import {
  MENU_ITEMS,
  MenuItem,
  MenuItemGroup,
  MenuItemLeaf,
} from "@/config/menu.config";

function hasAccess(allowedRoles: "all" | UserRole[], role: UserRole): boolean {
  if (allowedRoles === "all") return true;
  return allowedRoles.includes(role);
}

function renderLeaf(
  item: MenuItemLeaf,
  location: ReturnType<typeof useLocation>
) {
  // Enhanced isActive check for nested routes
  const checkIsActive = (path: string) => {
    const currentPath = location.pathname;
    if (currentPath === path) return true;
    if (path !== "/" && currentPath.startsWith(path + "/")) return true;
    return false;
  };

  const isActive = checkIsActive(item.path);

  return (
    <SidebarMenuButton key={item.id} asChild>
      <NavLink
        to={item.path}
        className={() => {
          // Always use our custom check
          const active = checkIsActive(item.path);
          return active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50";
        }}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </NavLink>
    </SidebarMenuButton>
  );
}

function renderGroup(
  item: MenuItemGroup,
  role: UserRole,
  openSubmenus: string[],
  toggleSubmenu: (id: string) => void,
  location: ReturnType<typeof useLocation>
) {
  const visibleChildren = item.children.filter((child) =>
    hasAccess(child.allowedRoles, role)
  );
  if (visibleChildren.length === 0) return null;

  // Check if any child is active
  const hasActiveChild = visibleChildren.some((child) => {
    const path = child.path;
    return (
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(path + "/"))
    );
  });

  // Helper function to check if path is active
  const checkIsActive = (path: string) => {
    const currentPath = location.pathname;
    if (currentPath === path) return true;
    if (path !== "/" && currentPath.startsWith(path + "/")) return true;
    return false;
  };

  // 🔹 TRƯỜNG HỢP CHỈ CÓ 1 CHILD => HIỆN THẲNG ITEM, KHÔNG CẦN SUBMENU
  if (visibleChildren.length === 1) {
    const child = visibleChildren[0];
    const Icon = child.icon || item.icon; // ưu tiên icon của child

    return (
      <SidebarMenuButton asChild>
        <NavLink
          to={child.path}
          className={() => {
            // Always use our custom check
            const active = checkIsActive(child.path);
            return active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50";
          }}
        >
          <Icon className="h-4 w-4" />
          <span>{child.title}</span>
        </NavLink>
      </SidebarMenuButton>
    );
  }

  // 🔹 TRƯỜNG HỢP CÓ ≥ 2 CHILD => DÙNG COLLAPSIBLE NHƯ CŨ
  const isOpen = openSubmenus.includes(item.id);

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleSubmenu(item.id)}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          type="button"
          className={`w-full justify-between ${
            hasActiveChild
              ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
              : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </div>
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {visibleChildren.map((child) => {
            // Check if child is a group (has children, no path) or leaf (has path)
            const isGroup = "children" in child && child.children && !("path" in child && child.path);
            const isLeaf = "path" in child && child.path;
            
            // If it's a group, render as a nested Collapsible within submenu
            if (isGroup && "children" in child && child.children) {
              const nestedGroup = child as MenuItemGroup;
              const nestedVisibleChildren = nestedGroup.children.filter((c) =>
                hasAccess(c.allowedRoles, role)
              );
              if (nestedVisibleChildren.length === 0) return null;
              
              const nestedIsOpen = openSubmenus.includes(nestedGroup.id);
              const nestedHasActiveChild = nestedVisibleChildren.some((c) => {
                const path = c.path;
                return (
                  location.pathname === path ||
                  (path !== "/" && location.pathname.startsWith(path + "/"))
                );
              });
              
              return (
                <SidebarMenuSubItem key={child.id}>
                  <Collapsible open={nestedIsOpen} onOpenChange={() => {
                    toggleSubmenu(nestedGroup.id);
                  }}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuSubButton
                        type="button"
                        className={`w-full justify-between min-w-0 ${
                          nestedHasActiveChild
                            ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <nestedGroup.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{nestedGroup.title}</span>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                            nestedIsOpen ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarMenuSubButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {nestedVisibleChildren.map((nestedChild) => (
                          <SidebarMenuSubItem key={nestedChild.id}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={nestedChild.path}
                                className={() => {
                                  const active = checkIsActive(nestedChild.path);
                                  return active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50";
                                }}
                              >
                                <nestedChild.icon className="h-4 w-4" />
                                <span>{nestedChild.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuSubItem>
              );
            }
            
            // If it's a leaf, render as NavLink
            if (isLeaf && "path" in child && child.path) {
              return (
                <SidebarMenuSubItem key={child.id}>
                  <SidebarMenuSubButton asChild>
                    <NavLink
                      to={child.path}
                      className={() => {
                        // Always use our custom check
                        const active = checkIsActive(child.path);
                        return active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50";
                      }}
                    >
                      <child.icon className="h-4 w-4" />
                      <span>{child.title}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            }
            
            // Fallback: should not happen, but render nothing if neither group nor leaf
            return null;
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const role = user?.role as UserRole | undefined;

  // Auto-expand submenus that have active children
  useEffect(() => {
    if (!role) return;
    const activeSubmenuIds: string[] = [];

    MENU_ITEMS.forEach((item) => {
      if ("children" in item && item.children) {
        const hasActiveChild = item.children.some((child) => {
          if (!hasAccess(child.allowedRoles, role)) return false;
          const path = child.path;
          return (
            location.pathname === path ||
            (path !== "/" && location.pathname.startsWith(path + "/"))
          );
        });

        if (hasActiveChild) {
          activeSubmenuIds.push(item.id);
        }
      }
    });

    if (activeSubmenuIds.length > 0) {
      setOpenSubmenus((prev) => {
        const combined = [...new Set([...prev, ...activeSubmenuIds])];
        return combined;
      });
    }
  }, [location.pathname, role]);

  if (!user || !role) return null;

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const visibleItems = MENU_ITEMS.filter((item) =>
    hasAccess(item.allowedRoles, role)
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="QUANG DAT DESIGN - PRINTING"
            className="h-12 w-auto object-contain"
          />
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">
              QUANG ĐẠT
            </h2>
            <p className="text-xs text-sidebar-foreground/70">
              DESIGN - PRINTING
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Menu chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item: MenuItem) => (
                <SidebarMenuItem key={item.id}>
                  {"children" in item && item.children
                    ? renderGroup(
                        item as MenuItemGroup,
                        role,
                        openSubmenus,
                        toggleSubmenu,
                        location
                      )
                    : renderLeaf(item as MenuItemLeaf, location)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
