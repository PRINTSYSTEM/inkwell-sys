import React, { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { deliveryLineStatusLabels } from "@/lib/status-utils";
import type { DeliveryNoteLineResponse } from "@/Schema/delivery-note.schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, XCircle, Loader2, Image as ImageIcon, RotateCcw, FileEdit, Check, X } from "lucide-react";
import { useUpdateDeliveryLineResult, useFailureReasons } from "@/hooks/use-delivery-note";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { Input } from "@/components/ui/input";

// ── Status display ──────────────────────────────────────────────────────────

function LineStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const label = deliveryLineStatusLabels[status] || status;
  return <StatusBadge status={status} label={label} />;
}

// ── Failure reasons ─────────────────────────────────────────────────────────

const FAILURE_REASONS = [
  { id: 1, name: "Khách hẹn giao lại" },
  { id: 2, name: "Không liên hệ được" },
  { id: 3, name: "Sai địa chỉ" },
  { id: 4, name: "Khách không có mặt" },
  { id: 5, name: "Đổi thời gian giao" },
  { id: 6, name: "Hàng lỗi QC" },
  { id: 7, name: "Hàng hỏng" },
  { id: 8, name: "Sai yêu cầu" },
  { id: 9, name: "Sai sản phẩm" },
  { id: 10, name: "Lỗi người bán" },
  { id: 11, name: "Khách từ chối không lý do" },
];

// ── Status flow ─────────────────────────────────────────────────────────────

// Trạng thái "kế tiếp" khi giao thành công
const NEXT_STATUS: Record<string, string> = {
  pending: "delivered",
  in_transit: "delivered",
};

// ── Component ───────────────────────────────────────────────────────────────

export default function DeliveryLineRow({
  line,
  noteStatus,
  onReturn,
}: {
  line: DeliveryNoteLineResponse;
  noteStatus?: string | null;
  onReturn?: (line: DeliveryNoteLineResponse) => void;
}) {
  const [localStatus, setLocalStatus] = useState<string | null | undefined>(
    line.status,
  );

  React.useEffect(() => {
    setLocalStatus(line.status);
  }, [line.status]);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [failureReasonId, setFailureReasonId] = useState<number | null>(null);
  const [failureNotes, setFailureNotes] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const updateLineResultMutation = useUpdateDeliveryLineResult();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(line.note || "");

  React.useEffect(() => {
    setTempNote(line.note || "");
  }, [line.note]);

  const handleSaveNote = async () => {
    if (!line?.id) return;
    try {
      await updateLineResultMutation.mutateAsync({
        lineId: Number(line.id),
        data: {
          status: line.status || "pending",
          note: tempNote,
        },
      });
      setIsEditingNote(false);
    } catch {
      // handled by hook
    }
  };
  const { data: failureReasonsApi } = useFailureReasons();
  const reasonsList = failureReasonsApi || FAILURE_REASONS;

  const noteStatusLower = (noteStatus || "").toLowerCase();
  // Phiếu phải đang trong trạng thái giao hàng hoặc giao một phần
  const noteIsShipping = [
    "in_transit",
    "delivering",
    "partially_completed",
    "completed", // backend tự validate, FE cứ cho phép
  ].includes(noteStatusLower);

  const currentStatus = (localStatus || "").toLowerCase();
  const nextStatus = NEXT_STATUS[currentStatus];
  const nextStatusLabel = deliveryLineStatusLabels[nextStatus] || nextStatus;

  // Line đã kết thúc hoặc chờ giao lại thì ẩn nút
  const isSettled =
    currentStatus === "delivered" ||
    currentStatus === "cancelled" ||
    currentStatus === "returned" ||
    currentStatus === "failed_reschedule";

  // Chỉ hiện nút khi line chưa kết thúc VÀ phiếu đang trong quá trình giao
  const showButtons = !isSettled && noteIsShipping;

  // ── Handlers ──

  const handleNext = async () => {
    if (!line?.id || !nextStatus) return;
    try {
      await updateLineResultMutation.mutateAsync({
        lineId: Number(line.id),
        data: {
          status: nextStatus,
          actualDeliveredQty: line.deliveryQty ?? line.netQtyTotal ?? undefined,
        },
      });
      setLocalStatus(nextStatus);
    } catch {
      // handled by hook
    }
  };

  const handleFail = async () => {
    if (!line?.id || !failureReasonId) return;

    let targetStatus = "failed_reschedule";
    const selectedReason = reasonsList.find((r) => r.id === failureReasonId);

    if (selectedReason) {
      if ("allowRedelivery" in selectedReason) {
        // dynamic logic from API
        if ((selectedReason as any).allowRedelivery) {
          targetStatus = "failed_reschedule";
        } else if ((selectedReason as any).code === "BUYER_REJECT" || failureReasonId === 11) {
          targetStatus = "cancelled";
        } else {
          targetStatus = "returned";
        }
      } else {
        // fallback hardcoded logic
        if (failureReasonId >= 6 && failureReasonId <= 10) {
          targetStatus = "returned";
        } else if (failureReasonId === 11) {
          targetStatus = "cancelled";
        }
      }
    }

    try {
      await updateLineResultMutation.mutateAsync({
        lineId: Number(line.id),
        data: {
          status: targetStatus as any,
          failureReasonId,
          failureNotes: failureNotes || undefined,
          actualDeliveredQty: 0,
        },
      });
      setLocalStatus(targetStatus);
      setFailDialogOpen(false);
      setFailureReasonId(null);
      setFailureNotes("");
    } catch {
      // handled by hook
    }
  };

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition-colors">
        {/* Mã hàng / Đơn */}
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted/60 flex items-center justify-center border border-border">
              {line.designImageUrl ? (
                <img
                  src={line.designImageUrl}
                  alt={line.designCode || "Thiết kế"}
                  className="h-full w-full object-cover cursor-zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImageUrl(line.designImageUrl || null);
                  }}
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="font-mono font-semibold text-sm truncate">
                {line.designCode || "—"}
              </div>
              {line.orderCode && (
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {line.orderCode}
                </div>
              )}
            </div>
          </div>
        </TableCell>

        {/* Tên sản phẩm */}
        <TableCell>
          <div className="text-sm font-medium line-clamp-2">
            {line.designName || "—"}
          </div>
        </TableCell>

        {/* Ghi chú */}
        <TableCell className="max-w-[200px]">
          {isEditingNote ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Input
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                className="h-8 text-xs flex-1"
                placeholder="Nhập ghi chú..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNote();
                  if (e.key === "Escape") {
                    setTempNote(line.note || "");
                    setIsEditingNote(false);
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={handleSaveNote}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  setTempNote(line.note || "");
                  setIsEditingNote(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded transition-all min-h-8"
              onClick={() => setIsEditingNote(true)}
              title="Click để sửa ghi chú"
            >
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium break-words whitespace-pre-wrap flex-1">
                {line.note || <span className="text-stone-300 dark:text-stone-700 italic">Thêm ghi chú...</span>}
              </span>
              <FileEdit className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </TableCell>

        {/* SL đặt hàng */}
        <TableCell className="text-right">
          <span className="text-sm font-medium">
            {typeof line.orderedQty === "number"
              ? line.orderedQty.toLocaleString("vi-VN")
              : "—"}
          </span>
        </TableCell>

        {/* SL giao */}
        <TableCell className="text-right">
          <span className="text-sm font-medium text-blue-600">
            {typeof line.deliveryQty === "number"
              ? line.deliveryQty.toLocaleString("vi-VN")
              : "—"}
          </span>
        </TableCell>

        {/* Phụ hao */}
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            {(() => {
              const scrapVal =
                typeof line.scrapQty === "number"
                  ? line.scrapQty
                  : typeof line.orderedQty === "number" &&
                      typeof line.netQtyTotal === "number"
                    ? line.orderedQty - line.netQtyTotal
                    : null;
              return (
                <span className="font-medium text-sm">
                  {scrapVal != null ? scrapVal.toLocaleString("vi-VN") : "—"}
                </span>
              );
            })()}
          </div>
        </TableCell>

        {/* SL thực tính */}
        <TableCell className="text-right">
          <div className="flex flex-col items-end">
            <span className="font-bold text-sm text-primary">
              {typeof line.netQtyTotal === "number"
                ? line.netQtyTotal.toLocaleString("vi-VN")
                : "—"}
            </span>
          </div>
        </TableCell>

        {/* Thành tiền */}
        <TableCell className="text-right">
          <div className="font-medium text-sm">
            {line.lineAmount != null ? formatCurrency(line.lineAmount) : "—"}
          </div>
        </TableCell>

        {/* Cột Trạng thái */}
        <TableCell>
          <LineStatusBadge status={localStatus} />
        </TableCell>

        {/* Cột Thao tác */}
        <TableCell>
          {!isSettled && noteIsShipping && (
            <div className="flex flex-col gap-1.5 w-fit">
              {nextStatus && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-[10px] gap-1 px-2 whitespace-nowrap w-full justify-center"
                  onClick={handleNext}
                  disabled={updateLineResultMutation.isPending}
                >
                  {updateLineResultMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {nextStatusLabel}
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[10px] gap-1 px-2 whitespace-nowrap w-full justify-center"
                onClick={() => setFailDialogOpen(true)}
                disabled={updateLineResultMutation.isPending}
              >
                <XCircle className="h-3 w-3" />
                Thất bại
              </Button>
            </div>
          )}

          {currentStatus === "delivered" && onReturn && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1 px-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              onClick={() => onReturn(line)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Trả hàng
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* ── Dialog thất bại ─────────────────────────────────────────────── */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Giao hàng thất bại
            </DialogTitle>
            <DialogDescription>
              <span className="font-mono font-semibold">{line.designCode}</span>
              {line.designName && ` — ${line.designName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>
                Lý do <span className="text-destructive">*</span>
              </Label>
              <Select
                value={failureReasonId ? String(failureReasonId) : ""}
                onValueChange={(v) => setFailureReasonId(Number(v) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do..." />
                </SelectTrigger>
                <SelectContent>
                  {reasonsList.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea
                value={failureNotes}
                onChange={(e) => setFailureNotes(e.target.value)}
                placeholder="Ghi chú thêm (tuỳ chọn)"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFailDialogOpen(false)}
              disabled={updateLineResultMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleFail}
              disabled={!failureReasonId || updateLineResultMutation.isPending}
              className="gap-1"
            >
              {updateLineResultMutation.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              Xác nhận thất bại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewImageUrl && (
        <ImageViewerDialog
          open={!!previewImageUrl}
          onOpenChange={(open) => !open && setPreviewImageUrl(null)}
          imageUrl={previewImageUrl}
          title="Xem ảnh thiết kế"
        />
      )}
    </>
  );
}
