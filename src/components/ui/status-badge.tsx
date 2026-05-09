import { getStatusColorClass } from "@/lib/status-utils";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | null;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colorClass = getStatusColorClass(status);

  return (
    <div className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors",
      colorClass,
      className
    )}>
      {label}
    </div>
  );
}
