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
  const groups: Array<{
    id: string;
    groupTitle?: string;
    groupIcon?: LucideIcon;
    items: MenuItemLeaf[];
  }> = [];

  // 1. Initialize groups from MENU_ITEMS that have children in the original order
  MENU_ITEMS.forEach((item) => {
    if ("children" in item && item.children) {
      groups.push({
        id: item.id,
        groupTitle: item.title,
        groupIcon: item.icon,
        items: [],
      });
    }
  });

  const standaloneItems: MenuItemLeaf[] = [];

  // 2. Distribute items logically
  MENU_ITEMS.forEach((item) => {
    if (!hasAccess(item.allowedRoles, role)) return;

    if ("children" in item && item.children) {
      // Add accessible children to their group
      const accessibleChildren = item.children.filter(
        (child) => hasAccess(child.allowedRoles, role) && child.path
      );
      const group = groups.find((g) => g.id === item.id);
      if (group) {
        group.items.push(...accessibleChildren);
      }
    } else if ("path" in item && item.path && !("children" in item)) {
      const leafItem = item as MenuItemLeaf;

      // Group leaf items into matching department groups
      let targetGroupId = "";
      if (leafItem.id === "customer" || leafItem.id === "orders") {
        targetGroupId = "sales";
      } else if (
        leafItem.id === "design-price-lookup-top" ||
        leafItem.id === "ready-designs" ||
        leafItem.id === "proofing"
      ) {
        targetGroupId = "design-dept";
      } else if (
        leafItem.id === "delivery-notes-list" ||
        leafItem.id === "stock-summary" ||
        leafItem.id === "production-stock"
      ) {
        targetGroupId = "production-group";
      } else if (leafItem.id === "notifications") {
        targetGroupId = "system";
      }

      const targetGroup = groups.find((g) => g.id === targetGroupId);
      if (targetGroup) {
        targetGroup.items.push(leafItem);
      } else {
        standaloneItems.push(leafItem);
      }
    }
  });

  // 3. Filter out groups with no items
  const filteredGroups = groups.filter((g) => g.items.length > 0);

  // 4. Return grouped items plus any remaining standalone items
  const result: Array<{
    groupTitle?: string;
    groupIcon?: LucideIcon;
    items: MenuItemLeaf[];
  }> = filteredGroups.map((g) => ({
    groupTitle: g.groupTitle,
    groupIcon: g.groupIcon,
    items: g.items,
  }));

  standaloneItems.forEach((item) => {
    result.push({
      items: [item],
    });
  });

  return result;
}
