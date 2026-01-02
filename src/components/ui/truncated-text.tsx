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
  showCursor?: boolean; // Option to show cursor on hover
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
  showCursor = true,
}: TruncatedTextProps) {
  const displayText = text || "—";
  const content = children || <span>{displayText}</span>;

  // Nếu text rỗng hoặc null, không cần tooltip
  if (!text || text.trim() === "") {
    return <span className={cn(className)}>{content}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn("truncate", showCursor && "cursor-help", className)}
            style={maxWidth ? { maxWidth } : undefined}
            title={showCursor ? displayText : undefined}
          >
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-md z-[100]"
          sideOffset={4}
        >
          <p className="break-words text-sm leading-relaxed">{displayText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
