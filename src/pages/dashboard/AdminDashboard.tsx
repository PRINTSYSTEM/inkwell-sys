// src/pages/dashboard/AdminDashboard.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks";
import { getGroupedAccessibleMenuItems } from "@/lib/menu-utils";
import type { UserRole } from "@/Schema";
import { ChevronRight } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role as UserRole;
  const groupedItems = getGroupedAccessibleMenuItems(role);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chào mừng, {user.fullName}! Quản lý hệ thống của bạn
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-5">
        {groupedItems.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2.5">
            {group.groupTitle && (
              <div className="flex items-center gap-2 px-1">
                {group.groupIcon && (
                  <group.groupIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <h2 className="text-base font-semibold text-foreground">
                  {group.groupTitle}
                </h2>
              </div>
            )}
            <div className="flex flex-wrap gap-2.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.id}
                    className="transition-all hover:shadow-md hover:border-primary/60 cursor-pointer group border bg-card/60 hover:bg-card px-3.5 py-2 flex items-center gap-2.5 rounded-lg w-fit h-10"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="flex-shrink-0 p-1 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap leading-none">
                      {item.title}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/70 group-hover:translate-x-0.5 transition-all ml-1 shrink-0" />
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
