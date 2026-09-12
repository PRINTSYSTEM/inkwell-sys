import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Circle } from "lucide-react";
import type { ProductionStepSla, SlaStatusType } from "@/types/capacity";

export interface ProductionStageStepperProps {
  steps: ProductionStepSla[];
  layout?: "horizontal" | "vertical";
  className?: string;
  onStepClick?: (step: ProductionStepSla) => void;
}

const statusColorConfig: Record<
  SlaStatusType,
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  ok: {
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    badgeText: "Đúng tiến độ",
    label: "Đúng tiến độ",
    icon: CheckCircle2,
  },
  warning: {
    bg: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    badgeText: "Sắp quá hạn",
    label: "Sắp quá hạn",
    icon: AlertTriangle,
  },
  late: {
    bg: "bg-red-500",
    border: "border-red-500",
    text: "text-red-700 dark:text-red-400",
    badgeBg: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-bold",
    badgeText: "Quá hạn",
    label: "Quá hạn SLA",
    icon: AlertCircle,
  },
  inactive: {
    bg: "bg-slate-300 dark:bg-slate-700",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-500 dark:text-slate-400",
    badgeBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    badgeText: "Chưa tới",
    label: "Chưa tới lượt",
    icon: Circle,
  },
};

export function ProductionStageStepper({
  steps,
  layout = "horizontal",
  className,
  onStepClick,
}: ProductionStageStepperProps) {
  if (!steps || steps.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Chưa có công đoạn</span>;
  }

  if (layout === "horizontal") {
    return (
      <div className={cn("flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none", className)}>
        {steps.map((step, idx) => {
          const statusKey: SlaStatusType =
            step.processingStatus || step.waitingStatus || "inactive";
          const config = statusColorConfig[statusKey] || statusColorConfig.inactive;
          const Icon = config.icon;
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.id || idx}>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold transition-all shrink-0 cursor-pointer hover:shadow-sm",
                  config.badgeBg,
                  config.border
                )}
                onClick={() => onStepClick?.(step)}
                title={`Khâu: ${step.stepName || "Công đoạn"} | SLA: ${config.label}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[90px]">
                  {step.stepName || `Khâu ${idx + 1}`}
                </span>
                {step.processingMinutes != null && step.processingMinutes > 0 && (
                  <span className="text-[10px] opacity-85 font-mono">
                    ({step.processingMinutes} phút)
                  </span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-3.5 shrink-0 rounded-full",
                    config.bg
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Vertical Stepper Timeline for Drawers
  const lateStep = steps.find(
    (s) => s.processingStatus === "late" || s.waitingStatus === "late"
  );

  return (
    <div className={cn("space-y-4", className)}>
      {lateStep && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">
              Cảnh báo Quá Hạn SLA tại Khâu: {lateStep.stepName}
            </p>
            <p className="text-[11px] mt-0.5 opacity-90">
              {lateStep.processingStatus === "late"
                ? `Thời gian thực hiện (${lateStep.processingMinutes || 0} phút) vượt quá SLA quy định.`
                : `Thời gian chờ chuyển khâu (${lateStep.waitingMinutes || 0} phút) vượt mốc cho phép.`}
            </p>
          </div>
        </div>
      )}

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {steps.map((step, idx) => {
          const statusKey: SlaStatusType =
            step.processingStatus || step.waitingStatus || "inactive";
          const config = statusColorConfig[statusKey] || statusColorConfig.inactive;
          const Icon = config.icon;

          return (
            <div
              key={step.id || idx}
              className="relative flex items-start justify-between gap-3 text-xs"
            >
              {/* Stepper Dot */}
              <div
                className={cn(
                  "absolute -left-[23px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border bg-background z-10",
                  config.border
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", config.text)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">
                    {step.stepName || `Công đoạn ${idx + 1}`}
                  </h4>
                  <Badge className={cn("text-[10px] px-1.5 py-0 border-none font-bold", config.badgeBg)}>
                    {config.badgeText}
                  </Badge>
                </div>

                <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                  {step.readyAt && (
                    <p>Sẵn sàng: <span className="font-medium text-foreground">{step.readyAt}</span></p>
                  )}
                  {step.startedAt && (
                    <p>Bắt đầu: <span className="font-medium text-foreground">{step.startedAt}</span></p>
                  )}
                  {step.completedAt && (
                    <p>Hoàn thành: <span className="font-medium text-foreground">{step.completedAt}</span></p>
                  )}
                </div>

                {/* 2-Way SLA Info Pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {step.waitingMinutes != null && (
                    <div className="px-2 py-0.5 rounded bg-muted/60 text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>Thời gian chờ: <strong>{step.waitingMinutes} phút</strong></span>
                    </div>
                  )}
                  {step.processingMinutes != null && (
                    <div className="px-2 py-0.5 rounded bg-muted/60 text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>Thời gian thực hiện: <strong>{step.processingMinutes} phút</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
