import { Badge } from "@/components/ui/badge";
import { getStatusVariant } from "@/lib/status-utils";

interface StatusBadgeProps {
  status: string | null;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = getStatusVariant(status);

  return (
    <Badge
      variant={
        variant === "warning"
          ? "default"
          : variant === "success"
          ? "default"
          : variant
      }
      className="font-medium"
    >
      {label}
    </Badge>
  );
}
