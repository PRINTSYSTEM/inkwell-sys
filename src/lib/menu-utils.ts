// src/lib/menu-utils.ts
import type { UserRole } from "@/Schema";
import type { LucideIcon } from "lucide-react";
import {
  MENU_ITEMS,
  type MenuItem,
  type MenuItemLeaf,
} from "@/config/menu.config";

export function hasAccess(
  allowedRoles: "all" | UserRole[],
  role: UserRole
): boolean {
  if (allowedRoles === "all") return true;
  return allowedRoles.includes(role);
}

/**
 * Extract all accessible menu items (leaf items with paths) for a given role
 * Flattens nested groups and returns only items with paths
 */
export function getAccessibleMenuItems(role: UserRole): MenuItemLeaf[] {
  const accessibleItems: MenuItemLeaf[] = [];

  function processItem(item: MenuItem) {
    if (hasAccess(item.allowedRoles, role)) {
      // If it's a leaf item (has path)
      if ("path" in item && item.path && !("children" in item)) {
        accessibleItems.push(item as MenuItemLeaf);
      }
      // If it's a group, process children
      if ("children" in item && item.children) {
        item.children.forEach((child) => {
          if (hasAccess(child.allowedRoles, role) && child.path) {
            accessibleItems.push(child);
          }
        });
      }
    }
  }

  MENU_ITEMS.forEach(processItem);
  return accessibleItems;
}

/**
 * Group menu items by their parent group for better organization
 */
export function getGroupedAccessibleMenuItems(role: UserRole) {
  const grouped: Array<{
    groupTitle?: string;
    groupIcon?: LucideIcon;
    items: MenuItemLeaf[];
  }> = [];

  MENU_ITEMS.forEach((item) => {
    if (!hasAccess(item.allowedRoles, role)) return;

    if ("path" in item && item.path && !("children" in item)) {
      // Leaf item - add directly
      grouped.push({
        items: [item as MenuItemLeaf],
      });
    } else if ("children" in item && item.children) {
      // Group item - filter accessible children
      const accessibleChildren = item.children.filter(
        (child) => hasAccess(child.allowedRoles, role) && child.path
      );
      if (accessibleChildren.length > 0) {
        grouped.push({
          groupTitle: item.title,
          groupIcon: item.icon,
          items: accessibleChildren,
        });
      }
    }
  });

  return grouped;
}
