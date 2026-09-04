import React from "react";
import { format, parseISO } from "date-fns";
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useProductionOrderSchedule } from "@/hooks/use-production-timing";
import { ProductionTimingBadge } from "./ProductionTimingBadge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductionScheduleTimelineProps {
  productionOrderId: number;
  className?: string;
}

const safeFormatDate = (dateStr?: string | null) => {
  if (!dateStr) return "Chưa bắt đầu";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return dateStr;
  }
};

export const ProductionScheduleTimeline: React.FC<ProductionScheduleTimelineProps> = ({
  productionOrderId,
  className,
}) => {
  const { data: schedule, isLoading, isError } = useProductionOrderSchedule(productionOrderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Đang tải tiến độ thời gian...</span>
      </div>
    );
  }

  if (isError || !schedule) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm">
        Không thể tải thông tin tiến độ sản xuất.
      </div>
    );
  }

  const milestones = schedule.milestones || [];

  return (
    <Card className={cn("border shadow-xs", className)}>
      <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Timeline Tiến độ Sản xuất (LSX #{productionOrderId})</span>
          </CardTitle>
          <ProductionTimingBadge
            timingStatus={schedule.timingStatus}
            mostLateStepType={schedule.mostLateStepType}
            variant="pill"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {milestones.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Chưa có thông tin mốc thời gian cho đơn sản xuất này.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {milestones.map((m, idx) => {
              const status = (m.timingStatus || "ok").toLowerCase();
              let dotClass = "bg-slate-300 border-white text-slate-600";

              if (status === "done") {
                dotClass = "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950";
              } else if (status === "late") {
                dotClass = "bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-950 animate-pulse";
              } else if (status === "warning") {
                dotClass = "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950";
              } else if (status === "ok") {
                dotClass = "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950";
              }

              return (
                <div key={idx} className="relative group">
                  {/* Timeline dot node */}
                  <div
                    className={cn(
                      "absolute -left-[27px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110",
                      dotClass
                    )}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : status === "late" ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : status === "warning" ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px]">{idx + 1}</span>
                    )}
                  </div>

                  {/* Content card */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{m.stepTypeName || m.stepType}</span>
                        {m.stepId && (
                          <span className="text-xs text-slate-400 font-mono">
                            (#Step-{m.stepId})
                          </span>
                        )}
                      </div>
                      <ProductionTimingBadge
                        timingStatus={m.timingStatus}
                        referenceAt={m.referenceAt}
                        dueAt={m.dueAt}
                        elapsedHours={m.elapsedHours}
                        remainingHours={m.remainingHours}
                        lateHours={m.lateHours}
                        stepTypeName={m.stepTypeName}
                        variant="pill"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Mốc bắt đầu:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {safeFormatDate(m.referenceAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Hạn hoàn thành:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {safeFormatDate(m.dueAt)}
                        </span>
                      </div>
                    </div>

                    {(m.elapsedHours != null || m.lateHours != null) && (
                      <div className="mt-2 pt-2 border-t flex flex-wrap gap-4 text-xs text-slate-500">
                        {m.elapsedHours != null && (
                          <div>
                            Đã trôi qua: <span className="font-semibold text-slate-700 dark:text-slate-300">{m.elapsedHours.toFixed(1)} giờ</span>
                          </div>
                        )}
                        {m.remainingHours != null && m.timingStatus !== "late" && (
                          <div>
                            Thời gian còn lại: <span className="font-semibold text-amber-600">{m.remainingHours.toFixed(1)} giờ</span>
                          </div>
                        )}
                        {m.lateHours != null && m.lateHours > 0 && (
                          <div>
                            Thời gian trễ: <span className="font-bold text-red-600 dark:text-red-400">+{m.lateHours.toFixed(1)} giờ</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
