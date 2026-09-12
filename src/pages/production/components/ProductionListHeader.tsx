import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProductionListHeaderProps {
  stats?: {
    pendingMaterial: number;
    inProduction: number;
    inProductionToday: number;
    pendingQc: number;
    completed: number;
    completedToday: number;
  };
  onRefresh?: () => void;
  onCreateNew?: () => void;
  isRefreshing?: boolean;
}

export function ProductionListHeader({
  onRefresh,
  onCreateNew,
  isRefreshing,
}: ProductionListHeaderProps) {
  const todayStr = format(new Date(), "dd/MM/yyyy", { locale: vi });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0 border-b pb-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          Lệnh sản xuất
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quản lý và theo dõi tiến độ 19 loại sản phẩm thời gian thực
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Date pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Hôm nay ({todayStr})</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs font-bold gap-1.5 bg-card hover:bg-muted"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        )}

        {/* Create button */}
        <Button
          size="sm"
          onClick={onCreateNew}
          className="h-8 text-xs font-bold gap-1 bg-[#93631F] hover:bg-[#7a521a] text-white shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo lệnh SX</span>
        </Button>
      </div>
    </div>
  );
}
