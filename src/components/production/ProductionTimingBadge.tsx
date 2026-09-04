import React from "react";
import { format, parseISO } from "date-fns";
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductionTimingBadgeProps {
  timingStatus?: string | null; // ok | warning | late | done | inactive
  referenceAt?: string | null;
  dueAt?: string | null;
  elapsedHours?: number | null;
  remainingHours?: number | null;
  lateHours?: number | null;
  stepTypeName?: string | null;
  mostLateStepType?: string | null;
  variant?: "badge" | "pill" | "icon" | "full";
  showTooltip?: boolean;
  className?: string;
}

const safeFormatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return dateStr;
  }
};

export const ProductionTimingBadge: React.FC<ProductionTimingBadgeProps> = ({
  timingStatus,
  referenceAt,
  dueAt,
  elapsedHours,
  remainingHours,
  lateHours,
  stepTypeName,
  mostLateStepType,
  variant = "badge",
  showTooltip = true,
  className,
}) => {
  const status = (timingStatus || "ok").toLowerCase();

  // If no status or inactive/done with no warning needed
  if (status === "inactive") {
    return null;
  }

  // Determine styles & icons based on status
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let IconComponent = Clock;
  let labelText = "Đúng tiến độ";

  if (status === "warning") {
    badgeStyle = "bg-amber-500/15 text-amber-700 border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40";
    IconComponent = AlertTriangle;
    labelText = "Sắp quá hạn";
  } else if (status === "late") {
    badgeStyle = "bg-red-500/15 text-red-700 border-red-400/60 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50 animate-pulse";
    IconComponent = AlertCircle;
    labelText = "Quá hạn";
  } else if (status === "done") {
    badgeStyle = "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-700";
    IconComponent = CheckCircle2;
    labelText = "Hoàn thành";
  }

  // Time details formatting
  const formattedRef = safeFormatDate(referenceAt);
  const formattedDue = safeFormatDate(dueAt);
  const elapsedText = elapsedHours != null ? `${elapsedHours.toFixed(1)}h` : null;
  const remainingText = remainingHours != null ? `${remainingHours.toFixed(1)}h` : null;
  const lateText = lateHours != null && lateHours > 0 ? `${lateHours.toFixed(1)}h` : null;

  const content = (
    <div className="flex flex-col gap-1 text-xs min-w-[200px]">
      <div className="font-semibold text-sm border-b pb-1 flex items-center justify-between">
        <span>{stepTypeName || "Tiến độ khâu"}</span>
        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", badgeStyle)}>
          {labelText}
        </span>
      </div>
      {mostLateStepType && (
        <div className="text-amber-600 dark:text-amber-400 font-medium">
          Khâu chậm nhất: <span className="font-semibold">{mostLateStepType}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-600 dark:text-slate-300 pt-1">
        <span>Bắt đầu:</span>
        <span className="font-mono text-right">{formattedRef}</span>
        <span>Hạn chót:</span>
        <span className="font-mono text-right">{formattedDue}</span>
        {elapsedText && (
          <>
            <span>Đã trôi qua:</span>
            <span className="font-mono text-right font-medium">{elapsedText}</span>
          </>
        )}
        {remainingText && status !== "late" && (
          <>
            <span>Còn lại:</span>
            <span className="font-mono text-right font-medium text-amber-600">{remainingText}</span>
          </>
        )}
        {lateText && (
          <>
            <span>Thời gian trễ:</span>
            <span className="font-mono text-right font-bold text-red-600 dark:text-red-400">{lateText}</span>
          </>
        )}
      </div>
    </div>
  );

  let renderElement: React.ReactNode = null;

  if (variant === "icon") {
    renderElement = (
      <span className={cn("inline-flex items-center justify-center p-1 rounded-full border", badgeStyle, className)}>
        <IconComponent className="w-3.5 h-3.5" />
      </span>
    );
  } else if (variant === "pill") {
    renderElement = (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border shadow-xs transition-colors",
          badgeStyle,
          className
        )}
      >
        <IconComponent className="w-3 h-3" />
        <span>{labelText}</span>
        {lateText ? (
          <span className="font-bold border-l border-red-300 dark:border-red-700 pl-1 ml-0.5">+{lateText}</span>
        ) : remainingText ? (
          <span className="opacity-80 border-l border-current/20 pl-1 ml-0.5">{remainingText}</span>
        ) : null}
      </span>
    );
  } else if (variant === "full") {
    renderElement = (
      <div className={cn("p-2.5 rounded-lg border text-xs shadow-xs", badgeStyle, className)}>
        <div className="flex items-center justify-between gap-2 mb-1.5 font-semibold">
          <div className="flex items-center gap-1.5">
            <IconComponent className="w-4 h-4" />
            <span>{stepTypeName ? `Khâu ${stepTypeName}` : "Tiến độ sản xuất"}</span>
          </div>
          <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded font-bold bg-white/50 dark:bg-black/20">
            {labelText}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px] opacity-90">
          <div>Hạn: {formattedDue}</div>
          <div className="text-right">
            {lateText ? `Trễ: ${lateText}` : remainingText ? `Còn: ${remainingText}` : `Đã chạy: ${elapsedText}`}
          </div>
        </div>
      </div>
    );
  } else {
    // Default: badge
    renderElement = (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border shadow-2xs",
          badgeStyle,
          className
        )}
      >
        <IconComponent className="w-3.5 h-3.5" />
        <span>{labelText}</span>
      </span>
    );
  }

  if (!showTooltip) {
    return renderElement;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{renderElement}</TooltipTrigger>
        <TooltipContent side="top" className="p-3 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 shadow-xl">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
