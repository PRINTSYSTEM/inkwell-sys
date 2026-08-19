import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
} from "lucide-react";

import { formatImageUrl } from "@/lib/utils";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageUrl,
  title,
}: ImageViewerDialogProps) {
  const formattedUrl = formatImageUrl(imageUrl) || "/placeholder.svg";
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);

  // Reset image view state when dialog closes or image changes
  useEffect(() => {
    if (!open) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, imageUrl]);

  // Handle wheel zoom using native DOM event to bypass React passive event listener limitations.
  // Using callback ref node ensures listener is registered as soon as portal element mounts.
  useEffect(() => {
    if (!containerNode) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.15;
      if (e.deltaY < 0) {
        setScale((s) => Math.min(s + zoomFactor, 5));
      } else {
        setScale((s) => Math.max(s - zoomFactor, 0.4));
      }
    };

    containerNode.addEventListener("wheel", handleWheelRaw, { passive: false });
    return () => {
      containerNode.removeEventListener("wheel", handleWheelRaw);
    };
  }, [containerNode, open]);

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.4));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag / pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Double click to reset
  const handleDoubleClick = () => {
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-background border border-border [&>button]:hidden">
        <div className="relative h-[80vh] flex flex-col justify-between">
          
          {/* Interactive Image Container */}
          <div
            ref={setContainerNode}
            className={`flex-1 w-full h-full flex items-center justify-center overflow-hidden select-none bg-stone-50 dark:bg-stone-950/60 cursor-grab ${
              isDragging ? "cursor-grabbing" : ""
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onDoubleClick={handleDoubleClick}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                transformOrigin: "center center",
              }}
              className="flex items-center justify-center"
            >
              <img
                src={formattedUrl}
                alt={title || "Image"}
                className="max-w-[90vw] max-h-[75vh] object-contain pointer-events-none"
              />
            </div>
          </div>

          {/* Top control bar (Rendered after container for correct z-stacking on long images) */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border/85 rounded-xl p-1 shadow-md select-none">
            {/* Rotate control */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg"
              onClick={handleRotate}
              title="Xoay ảnh"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            {/* Zoom In control */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg"
              onClick={handleZoomIn}
              title="Phóng to"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Zoom Out control */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg"
              onClick={handleZoomOut}
              title="Thu nhỏ"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            {/* Reset control */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg"
              onClick={handleReset}
              title="Khôi phục"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Download control */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg"
              asChild
              title="Tải về"
            >
              <a href={formattedUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full h-full">
                <Download className="h-4 w-4" />
              </a>
            </Button>

            {/* Close control (using div to avoid Radix button hiding rules) */}
            <div
              className="h-8 w-8 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer transition-colors"
              onClick={() => onOpenChange(false)}
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </div>
          </div>

          {/* Footer Zoom Status indicator */}
          {scale !== 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 text-foreground border border-border px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm z-15 pointer-events-none shadow-sm">
              Zoom: {Math.round(scale * 100)}%
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
