import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface CursorTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  delayDuration?: number;
  className?: string;
}

export function CursorTooltip({
  content,
  children,
  delayDuration = 300,
  className,
}: CursorTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = React.useState({
    left: 0,
    top: 0,
  });
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Calculate tooltip position to keep it within viewport
  // Tooltip keeps its original size, only position changes
  const calculateTooltipPosition = React.useCallback(
    (cursorX: number, cursorY: number) => {
      if (!tooltipRef.current || typeof window === "undefined") {
        return { left: cursorX + 10, top: cursorY + 10 };
      }

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const offset = 10; // Distance from cursor

      let left = cursorX + offset;
      let top = cursorY + offset;

      // Adjust horizontal position if tooltip goes off the right edge
      if (left + tooltipRect.width > viewportWidth) {
        // Try placing it on the left side of cursor
        const leftSidePosition = cursorX - tooltipRect.width - offset;
        if (leftSidePosition >= 0) {
          left = leftSidePosition;
        } else {
          // If it still overflows on the left, keep it on the right side but align to viewport edge
          // Tooltip size remains unchanged, it may be partially visible
          left = Math.max(0, viewportWidth - tooltipRect.width - 10);
        }
      }

      // Adjust vertical position if tooltip goes off the bottom edge
      if (top + tooltipRect.height > viewportHeight) {
        // Try placing it above the cursor
        const topSidePosition = cursorY - tooltipRect.height - offset;
        if (topSidePosition >= 0) {
          top = topSidePosition;
        } else {
          // If it still overflows on the top, keep it below but align to viewport edge
          // Tooltip size remains unchanged, it may be partially visible
          top = Math.max(0, viewportHeight - tooltipRect.height - 10);
        }
      }

      // Ensure tooltip doesn't go off the left edge (but keep original size)
      if (left < 0) {
        left = 10;
      }

      // Ensure tooltip doesn't go off the top edge (but keep original size)
      if (top < 0) {
        top = 10;
      }

      return { left, top };
    },
    []
  );

  // Update tooltip position when cursor position or open state changes
  React.useLayoutEffect(() => {
    if (isOpen && tooltipRef.current) {
      const newPosition = calculateTooltipPosition(position.x, position.y);
      setTooltipPosition(newPosition);
    }
  }, [isOpen, position, calculateTooltipPosition]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clone the child element and add event handlers to it
  const childWithProps = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter(e);
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
    onMouseMove: (e: React.MouseEvent) => {
      handleMouseMove(e);
      if (children.props.onMouseMove) {
        children.props.onMouseMove(e);
      }
    },
  });

  const tooltipElement = isOpen ? (
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[100] pointer-events-none",
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        left: `${tooltipPosition.left}px`,
        top: `${tooltipPosition.top}px`,
        transform: "translate(0, 0)",
        width: "max-content", // Keep original width, don't constrain
        maxWidth: "none", // Don't limit max width
      }}
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      {childWithProps}
      {typeof window !== "undefined" &&
        createPortal(tooltipElement, document.body)}
    </>
  );
}
