import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              asChild
            >
              <a href={imageUrl} download>
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
              <p className="text-sm font-medium">{title}</p>
            </div>
          )}
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title || "Image"}
            className="w-full h-auto max-h-[85vh] object-contain bg-black"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
