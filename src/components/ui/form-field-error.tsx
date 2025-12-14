import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface FormFieldErrorProps {
  error?: string;
  className?: string;
}

/**
 * Component to display form field validation errors
 */
export function FormFieldError({ error, className }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-destructive mt-1",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}
