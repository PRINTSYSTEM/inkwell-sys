import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, History } from "lucide-react";
import { useUpdateDesignNotes } from "@/hooks/use-design";
import type { DesignResponse } from "@/Schema";

interface EditDesignNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designId?: number | null;
  designCode?: string | null;
  designName?: string | null;
  currentNotes?: string | null;
  onSuccess?: (updatedDesign: DesignResponse) => void;
}

export function EditDesignNotesDialog({
  open,
  onOpenChange,
  designId,
  designCode,
  designName,
  currentNotes,
  onSuccess,
}: EditDesignNotesDialogProps) {
  const [newNote, setNewNote] = useState("");
  const { mutate: updateNotes, loading } = useUpdateDesignNotes();

  useEffect(() => {
    if (open) {
      setNewNote("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designId) return;

    try {
      const result = await updateNotes({
        id: designId,
        notes: newNote.trim(),
      });
      if (result) {
        onSuccess?.(result);
      }
      onOpenChange(false);
    } catch {
      // Error handled by hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-lg p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Cập nhật ghi chú thiết kế
          </DialogTitle>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {designCode && (
              <div>
                Mã thiết kế: <span className="font-mono font-semibold text-foreground">{designCode}</span>
              </div>
            )}
            {designName && (
              <div className="line-clamp-1">
                Tên thiết kế: <span className="font-medium text-foreground">{designName}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Ghi chú hiện tại */}
          {currentNotes && currentNotes.trim() && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Ghi chú hiện tại:
              </Label>
              <div className="max-h-36 overflow-y-auto rounded-md bg-muted/40 p-2.5 border text-xs whitespace-pre-wrap leading-relaxed text-foreground font-mono">
                {currentNotes.trim()}
              </div>
            </div>
          )}

          {/* Nhập ghi chú mới */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="design-new-note" className="text-xs font-semibold">
                Nội dung ghi chú mới cần thêm:
              </Label>
              <span className={`text-[11px] ${newNote.length > 500 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                {newNote.length}/500
              </span>
            </div>
            <Textarea
              id="design-new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nhập ghi chú mới... (Hệ thống sẽ tự động thêm ngày giờ & tên tài khoản lên đầu ghi chú)"
              rows={3}
              maxLength={500}
              className="text-xs font-medium resize-none focus-visible:ring-1"
            />
            <p className="text-[11px] text-muted-foreground/80 italic">
              * Ghi chú này hiển thị xuyên suốt hệ thống (Thiết kế, Kho, và Phiếu giao hàng).
            </p>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || newNote.length > 500}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Lưu ghi chú
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
