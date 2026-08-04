import React, { useState, useMemo } from "react";
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
import { ChevronRight, XCircle, Loader2, Image as ImageIcon, RotateCcw, FileEdit, Check, X, ExternalLink } from "lucide-react";
import { useUpdateDeliveryLineResult, useFailureReasons } from "@/hooks/use-delivery-note";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useProductionOrders } from "@/hooks/use-production";

interface ProofingCodeProps {
  code: string;
}

function ProofingCodeWithProductions({ code }: ProofingCodeProps) {
  const match = code.match(/\d+/);
  const proofingOrderId = match ? parseInt(match[0], 10) : null;

  const { data: productionsResp, isLoading } = useProductionOrders(
    proofingOrderId ? { proofingOrderId, pageSize: 50 } : undefined
  );

  const productions = useMemo(() => {
    if (!productionsResp) return [];
    if (Array.isArray(productionsResp)) return productionsResp;
    if (typeof productionsResp === "object" && "items" in productionsResp) {
      return (productionsResp.items || []) as any[];
    }
    return [];
  }, [productionsResp]);

  if (!proofingOrderId) {
    return <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">{code}</span>;
  }

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <Link
          to={`/delivery-notes?tab=completed-qc&search=${code}`}
          className="font-extrabold text-amber-600 dark:text-amber-400 font-mono hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {code}
          <ExternalLink className="h-3.5 w-3.5 inline opacity-70" />
        </Link>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg rounded-lg text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="font-bold text-xs text-stone-500 uppercase tracking-wider">
            Lệnh sản xuất liên quan ({code})
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-stone-400 text-xs py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải lệnh sản xuất...
            </div>
          ) : productions.length === 0 ? (
            <div className="text-stone-400 text-xs py-1 italic">
              Chưa có lệnh sản xuất nào cho bài này
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-48 overflow-y-auto pr-1">
              {productions.map((prod: any) => (
                <div key={prod.id} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-stone-500">Mã lệnh:</span>
                    <Link
                      to={`/productions/${prod.id}`}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      PO{String(prod.id).padStart(4, '0')}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Người phụ trách:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {prod.productionLeadName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Tiến độ / SL sản xuất:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {prod.progressPercent || 0}% ({prod.producedQty || 0} tờ)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Trạng thái:</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {prod.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

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

  const filteredReasons = useMemo(() => {
    const resch = reasonsList.find(
      (r) => 
        (r as any).code === "RESCHEDULED_BY_BUYER" || 
        (r as any).code === "RESCHEDULE" || 
        (r as any).name?.toLowerCase().includes("hẹn giao lại") || 
        r.id === 1
    ) || { id: 1, name: "Khách hẹn giao lại", code: "RESCHEDULED_BY_BUYER", allowRedelivery: true };

    const other = reasonsList.find(
      (r) => 
        (r as any).code === "OTHER" || 
        (r as any).code === "OTHER_REASON" || 
        (r as any).name?.toLowerCase().includes("lý do khác") ||
        (r as any).name?.toLowerCase().includes("lí do khác")
    ) || { id: 12, name: "Lý do khác", code: "OTHER", allowRedelivery: false };

    return [resch, other];
  }, [reasonsList]);

  const rescheduleReasonId = filteredReasons[0]?.id || null;
  const otherReasonId = filteredReasons[1]?.id || null;

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
          note: line.note ?? undefined,
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
      const code = (selectedReason as any).code;
      const isResched = 
        code === "RESCHEDULED_BY_BUYER" || 
        code === "RESCHEDULE" || 
        (selectedReason as any).allowRedelivery === true;
      
      targetStatus = isResched ? "failed_reschedule" : "returned";
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
              {line.designImageUrl || line.designThumbnailUrl ? (
                <img
                  src={line.designThumbnailUrl || line.designImageUrl || ""}
                  alt={line.designCode || "Thiết kế"}
                  className="h-full w-full object-cover cursor-zoom-in"
                  loading="lazy"
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

        {/* Mã bài */}
        <TableCell>
          {line.proofingOrderCodes && line.proofingOrderCodes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {line.proofingOrderCodes.map((code: string) => (
                <ProofingCodeWithProductions key={code} code={code} />
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
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
          <div className="flex flex-col gap-1 items-start">
            <LineStatusBadge status={localStatus} />
            {((localStatus === "failed_reschedule" || localStatus === "returned") && 
              (line.failureNotes || line.failureReasonName)) && (
              <div className="text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20 max-w-[150px] break-words mt-1">
                {line.failureReasonName || "Thất bại"}
                {line.failureNotes && `: ${line.failureNotes}`}
              </div>
            )}
          </div>
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
                onValueChange={(v) => {
                  const rId = Number(v) || null;
                  setFailureReasonId(rId);
                  if (rId !== otherReasonId) {
                    setFailureNotes("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredReasons.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {failureReasonId === otherReasonId ? (
              <div className="space-y-1.5">
                <Label>
                  Nhập lý do <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="Nhập chi tiết lý do giao hàng thất bại..."
                  rows={3}
                  className="resize-none text-xs"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                  rows={2}
                  className="resize-none text-xs"
                />
              </div>
            )}
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
              disabled={
                !failureReasonId || 
                (failureReasonId === otherReasonId && !failureNotes.trim()) || 
                updateLineResultMutation.isPending
              }
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
