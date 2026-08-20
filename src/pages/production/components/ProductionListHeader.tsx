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
          Lệnh sản xuất
        </h1>
      </div>
    </div>
  );
}
