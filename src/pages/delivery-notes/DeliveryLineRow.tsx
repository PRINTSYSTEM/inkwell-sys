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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useUpdateDeliveryLineResult } from "@/hooks/use-delivery-note";

function LineStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="inline-block">—</span>;
  const label = deliveryLineStatusLabels[status] || status;
  return <StatusBadge status={status} label={label} />;
}

export default function DeliveryLineRow({ line, noteStatus }: { line: DeliveryNoteLineResponse; noteStatus?: string | null }) {
  const [isFailDialogOpen, setIsFailDialogOpen] = useState(false);
  const [failureReasonId, setFailureReasonId] = useState<number | null>(null);
  const [failureNotes, setFailureNotes] = useState("");
  const [affectsDebt, setAffectsDebt] = useState(false);
  const [actualDeliveredQty, setActualDeliveredQty] = useState<number | undefined>(undefined);

  const updateLineResultMutation = useUpdateDeliveryLineResult();

  const noteInTransit = (noteStatus || "").toLowerCase();
  const noteIsShipping = ["in_transit", "delivering"].includes(noteInTransit);

  const FAILURE_REASONS = [
    { id: 1, code: "RESCHEDULED_BY_BUYER", name: "Khách hẹn giao lại" },
    { id: 2, code: "NO_CONTACT", name: "Không liên hệ được" },
    { id: 3, code: "WRONG_ADDRESS", name: "Sai địa chỉ" },
    { id: 4, code: "BUYER_NOT_AVAILABLE", name: "Khách không có mặt" },
    { id: 5, code: "TIME_CHANGE", name: "Đổi thời gian giao" },
    { id: 6, code: "QC_FAIL", name: "Hàng lỗi QC" },
    { id: 7, code: "GOODS_DAMAGED", name: "Hàng hỏng" },
    { id: 8, code: "WRONG_SPEC", name: "Sai yêu cầu" },
    { id: 9, code: "WRONG_PRODUCT", name: "Sai sản phẩm" },
    { id: 10, code: "SELLER_FAULT", name: "Lỗi người bán" },
    { id: 11, code: "BUYER_REJECT", name: "Khách từ chối không lý do" },
  ];

  const handleMarkDelivered = async () => {
    if (!line?.id) return;
    const qty = line.deliveryQty ?? line.netQtyTotal ?? undefined;
    try {
      await updateLineResultMutation.mutateAsync({
        lineId: Number(line.id),
        data: {
          status: "delivered",
          actualDeliveredQty: qty,
        },
      });
    } catch (e) {
      // handled by hook
    }
  };

  const handleMarkFailed = async () => {
    if (!line?.id) return;
    if (!failureReasonId) return;
    try {
      await updateLineResultMutation.mutateAsync({
        lineId: Number(line.id),
        data: {
          status: "failed_reschedule",
          failureReasonId: failureReasonId,
          failureNotes: failureNotes || undefined,
          actualDeliveredQty: actualDeliveredQty ?? 0,
        },
      });
      setIsFailDialogOpen(false);
    } catch (e) {
      // handled by hook
    }
  };
  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell>
        <div className="space-y-0.5">
          <div className="font-mono font-semibold text-sm">{line.designCode || "—"}</div>
          {line.orderCode && (
            <div className="text-xs text-muted-foreground font-mono">{line.orderCode}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium line-clamp-2">{line.designName || "—"}</div>
      </TableCell>
      <TableCell className="text-right">
        <span className="text-sm font-medium">{typeof line.orderedQty === 'number' ? line.orderedQty.toLocaleString('vi-VN') : "—"}</span>
      </TableCell>
          <TableCell className="text-right">
            <span className="text-sm font-medium text-blue-600">{typeof line.deliveryQty === 'number' ? line.deliveryQty.toLocaleString('vi-VN') : "—"}</span>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex flex-col items-end">
              {(() => {
                const scrapVal = (typeof line.scrapQty === 'number') ? line.scrapQty : (typeof line.orderedQty === 'number' && typeof line.netQtyTotal === 'number' ? (line.orderedQty - line.netQtyTotal) : null);
                const scrapLabel = typeof scrapVal === 'number' ? scrapVal.toLocaleString('vi-VN') : "—";
                return <span className="font-medium text-sm">{scrapLabel}</span>;
              })()}
              {typeof line.orderedQty === 'number' ? (
                <span className="text-[10px] text-muted-foreground">{(() => {
                  const scrap = (typeof line.scrapQty === 'number') ? line.scrapQty : (typeof line.orderedQty === 'number' && typeof line.netQtyTotal === 'number' ? (line.orderedQty - line.netQtyTotal) : null);
                  if (scrap == null || typeof line.orderedQty !== 'number' || line.orderedQty === 0) return "";
                  const pct = (scrap / line.orderedQty) * 100;
                  return `${pct.toFixed(2).replace(/\.00$/, '')}%`;
                })()}</span>
              ) : null}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex flex-col items-end">
              <span className="font-bold text-sm text-primary">{(typeof line.netQtyTotal === 'number' ? line.netQtyTotal : (typeof line.actualDeliveredQty === 'number' ? line.actualDeliveredQty : null)) != null ? String(typeof line.netQtyTotal === 'number' ? line.netQtyTotal.toLocaleString('vi-VN') : (typeof line.actualDeliveredQty === 'number' ? line.actualDeliveredQty.toLocaleString('vi-VN') : "")) : "—"}</span>
              {typeof line.actualDeliveredQty === 'number' && line.actualDeliveredQty !== line.netQtyTotal && (
                <span className="text-[10px] text-green-600 font-medium">Thực giao: {line.actualDeliveredQty.toLocaleString('vi-VN')}</span>
              )}
            </div>
          </TableCell>
      <TableCell className="text-right">
        <div className="font-medium text-sm">{line.lineAmount != null ? formatCurrency(line.lineAmount) : "—"}</div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <LineStatusBadge status={line.status} />
          <div className="flex items-center gap-2">
            {noteIsShipping && line.status !== "delivered" && (
              <Button size="sm" onClick={handleMarkDelivered} disabled={updateLineResultMutation.isPending}>
                Thành công
              </Button>
            )}
            {noteIsShipping && line.status !== "failed_reschedule" && (
              <>
                <Button size="sm" variant="destructive" onClick={() => setIsFailDialogOpen(true)}>
                  Thất bại
                </Button>

                <Dialog open={isFailDialogOpen} onOpenChange={setIsFailDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Đánh dấu thất bại cho dòng</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div>
                        <Label>Lý do thất bại *</Label>
                        <Select value={failureReasonId ? String(failureReasonId) : ""} onValueChange={(v) => setFailureReasonId(Number(v) || null)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn lý do" />
                          </SelectTrigger>
                          <SelectContent>
                            {FAILURE_REASONS.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>SL thực giao</Label>
                        <input
                          type="number"
                          className="w-full rounded border px-2 py-1"
                          value={actualDeliveredQty ?? ""}
                          onChange={(e) => setActualDeliveredQty(e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <Label>Ghi chú</Label>
                        <Textarea value={failureNotes} onChange={(e) => setFailureNotes(e.target.value)} rows={3} />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox id={`aff-${line.id}`} checked={affectsDebt} onCheckedChange={(c) => setAffectsDebt(c === true)} />
                        <Label htmlFor={`aff-${line.id}`}>Ảnh hưởng công nợ</Label>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Chọn lý do và ghi chú để cập nhật thất bại.</AlertDescription>
                      </Alert>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsFailDialogOpen(false)} disabled={updateLineResultMutation.isPending}>Hủy</Button>
                      <Button onClick={handleMarkFailed} disabled={updateLineResultMutation.isPending || !failureReasonId}>Xác nhận</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
