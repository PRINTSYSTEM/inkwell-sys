import React from "react";

interface ProductionListHeaderProps {
  stats: {
    pendingMaterial: number;
    inProduction: number;
    inProductionToday: number;
    pendingQc: number;
    completed: number;
    completedToday: number;
  };
}

export function ProductionListHeader({
  stats,
}: ProductionListHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0 border-b pb-2">
      <div>
        <h1 className="text-lg font-bold text-balance whitespace-nowrap text-slate-800 dark:text-slate-100">
          Quản lý Sản xuất
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Chỉ số 1: Chưa xuất vật tư */}
        <div className="flex items-center gap-1.5 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-md px-2 py-1 text-xs">
          <span className="font-semibold text-orange-600 dark:text-orange-400">Chưa xuất vật tư:</span>
          <span className="font-extrabold text-orange-700 dark:text-orange-300 text-[13px]">{stats?.pendingMaterial || 0}</span>
        </div>

        {/* Chỉ số 2: Đang sản xuất */}
        <div className="flex items-center gap-1.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-md px-2 py-1 text-xs">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Đang sản xuất:</span>
          <span className="font-extrabold text-blue-700 dark:text-blue-300 text-[13px]">{stats?.inProduction || 0}</span>
          {stats?.inProductionToday > 0 && (
            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-1 py-0.2 rounded border border-green-200 dark:border-green-900/50">
              +{stats.inProductionToday}
            </span>
          )}
        </div>

        {/* Chỉ số 3: Chờ kiểm hàng */}
        <div className="flex items-center gap-1.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-md px-2 py-1 text-xs">
          <span className="font-semibold text-amber-600 dark:text-amber-400">Chờ kiểm hàng:</span>
          <span className="font-extrabold text-amber-700 dark:text-amber-300 text-[13px]">{stats?.pendingQc || 0}</span>
        </div>

        {/* Chỉ số 4: Đã hoàn thành */}
        <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-md px-2 py-1 text-xs">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đã hoàn thành:</span>
          <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-[13px]">{stats?.completed || 0}</span>
          {stats?.completedToday > 0 && (
            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-1 py-0.2 rounded border border-green-200 dark:border-green-900/50">
              +{stats.completedToday}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
