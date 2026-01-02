import * as React from "react";
import { TruncatedText } from "./truncated-text";
import { cn } from "@/lib/utils";

interface TableCellTextProps {
  text: string | number | null | undefined;
  className?: string;
  maxWidth?: string;
  showCursor?: boolean;
  children?: React.ReactNode;
}

/**
 * Component để hiển thị text trong TableCell với TruncatedText mặc định
 * Sử dụng cho tất cả các trường text trong bảng
 */
export function TableCellText({
  text,
  className,
  maxWidth,
  showCursor = true,
  children,
}: TableCellTextProps) {
  // Nếu có children, render children
  if (children) {
    return <div className={cn(className)}>{children}</div>;
  }

  // Convert number to string
  const textValue =
    text === null || text === undefined
      ? null
      : typeof text === "number"
      ? text.toString()
      : text;

  return (
    <TruncatedText
      text={textValue}
      className={className}
      maxWidth={maxWidth}
      showCursor={showCursor}
    />
  );
}

