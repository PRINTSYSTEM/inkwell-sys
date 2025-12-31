import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string | null | undefined;
  className?: string;
  maxWidth?: string;
  children?: React.ReactNode;
}

/**
 * Component hiển thị text với tooltip khi text bị truncate
 * Sử dụng cho các trường dài trong bảng
 */
export function TruncatedText({
  text,
  className,
  maxWidth,
  children,
}: TruncatedTextProps) {
  const displayText = text || "—";
  const content = children || <span>{displayText}</span>;

  // Nếu text rỗng hoặc null, không cần tooltip
  if (!text || text.trim() === "") {
    return <span className={cn(className)}>{content}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("truncate", className)}
            style={maxWidth ? { maxWidth } : undefined}
          >
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-words">{displayText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
