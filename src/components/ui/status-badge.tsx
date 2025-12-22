import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/lib/status-utils";

interface StatusBadgeProps {
  status: string | null;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colorClass = getStatusColorClass(status);

  return (
    <Badge variant="outline" className={`font-medium border ${colorClass} ${className || ""}`}>
      {label}
    </Badge>
  );
}
