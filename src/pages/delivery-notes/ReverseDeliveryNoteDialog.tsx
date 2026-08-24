import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface ReverseDeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNoteId: number | null;
  deliveryNoteCode?: string | null;
  isInvoiced?: boolean;
  isPending: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function ReverseDeliveryNoteDialog({
  open,
  onOpenChange,
  deliveryNoteId,
  deliveryNoteCode,
  isInvoiced = false,
  isPending,
  onConfirm,
}: ReverseDeliveryNoteDialogProps) {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    if (isPending) return;
    setReason("");
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do xóa phiếu giao hàng");
      return;
    }
    if (reason.trim().length > 500) {
      toast.error("Lý do không được vượt quá 500 ký tự");
      return;
    }

    try {
      await onConfirm(reason.trim());
      handleClose();
    } catch {
      // Error handled in parent/hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Xóa phiếu giao hàng
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Mã phiếu:{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {deliveryNoteCode || `#${deliveryNoteId}`}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2 font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Tác động khi xóa phiếu giao hàng:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
              <li>Phiếu giao hàng sẽ bị <b>xóa hoàn toàn</b> khỏi hệ thống.</li>
              <li>Mã hàng được hoàn về trạng thái <b>"Chưa tạo PGH"</b> để tạo lại phiếu mới.</li>
              <li><b>Công nợ</b> (Ledger & History) và <b>kho xuất</b> (StockOut/Return) sẽ được tự động hoàn tác.</li>
              <li>Trạng thái đơn hàng sẽ trở về trước khi giao (<code>production_completed</code>).</li>
            </ul>
          </div>

          {/* Warning if invoiced */}
          {isInvoiced && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <b>Cảnh báo:</b> Phiếu giao này có dấu hiệu đã xuất hóa đơn. Vui lòng hủy hóa đơn trước khi xóa phiếu.
              </span>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="reverse-reason" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Lý do xóa phiếu <span className="text-red-500">*</span>
              </Label>
              <span className="text-[10px] text-slate-400 font-mono">
                {reason.length}/500
              </span>
            </div>
            <Textarea
              id="reverse-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Giao nhầm mã hàng A thay vì B, khách từ chối — xóa phiếu để tạo lại..."
              maxLength={500}
              rows={3}
              className="text-xs rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-xl border-slate-200 text-xs font-semibold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !reason.trim()}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Xác nhận xóa phiếu
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
