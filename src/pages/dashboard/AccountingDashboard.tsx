// src/pages/dashboard/AccountingDashboard.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks";
import { getGroupedAccessibleMenuItems } from "@/lib/menu-utils";
import { Calculator, ChevronRight } from "lucide-react";
import type { UserRole } from "@/Schema";

export default function AccountingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role as UserRole;
  const groupedItems = getGroupedAccessibleMenuItems(role);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Calculator className="h-4 w-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Kế toán
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Chào mừng, {user.fullName}! Quản lý tài chính và kế toán
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
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.id}
                    className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group border bg-card/50 hover:bg-card"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">
                            {item.title}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    </CardContent>
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
