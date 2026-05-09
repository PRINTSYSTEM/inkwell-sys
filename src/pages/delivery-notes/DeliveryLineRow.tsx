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
import { ChevronRight, XCircle, Loader2 } from "lucide-react";
import { useUpdateDeliveryLineResult, useFailureReasons } from "@/hooks/use-delivery-note";

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
}: {
  line: DeliveryNoteLineResponse;
  noteStatus?: string | null;
}) {
  const [localStatus, setLocalStatus] = useState<string | null | undefined>(
    line.status,
  );
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [failureReasonId, setFailureReasonId] = useState<number | null>(null);
  const [failureNotes, setFailureNotes] = useState("");

  const updateLineResultMutation = useUpdateDeliveryLineResult();
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

  // Chỉ phụ thuộc vào trạng thái của CHÍNH LINE này, không phụ thuộc noteStatus
  const showButtons = !isSettled;

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
          <div className="space-y-0.5">
            <div className="font-mono font-semibold text-sm">
              {line.designCode || "—"}
            </div>
            {line.orderCode && (
              <div className="text-xs text-muted-foreground font-mono">
                {line.orderCode}
              </div>
            )}
          </div>
        </TableCell>

        {/* Tên sản phẩm */}
        <TableCell>
          <div className="text-sm font-medium line-clamp-2">
            {line.designName || "—"}
          </div>
          {line.note && (
            <div className="text-[11px] text-orange-600 font-medium mt-1 italic">
              Ghi chú: {line.note}
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
              {typeof line.actualDeliveredQty === "number"
                ? line.actualDeliveredQty.toLocaleString("vi-VN")
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
          {showButtons && (
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
    </>
  );
}
