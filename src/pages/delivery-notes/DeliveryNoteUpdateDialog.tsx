import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { DeliveryNoteLineResponse } from "@/Schema/delivery-note.schema";

const FAILURE_REASONS = [
  { id: 1, code: "RESCHEDULED_BY_BUYER", name: "Khách hẹn giao lại", allowRedelivery: true },
  { id: 2, code: "NO_CONTACT", name: "Không liên hệ được", allowRedelivery: true },
  { id: 3, code: "WRONG_ADDRESS", name: "Sai địa chỉ", allowRedelivery: true },
  { id: 4, code: "BUYER_NOT_AVAILABLE", name: "Khách không có mặt", allowRedelivery: true },
  { id: 5, code: "TIME_CHANGE", name: "Đổi thời gian giao", allowRedelivery: true },
  { id: 6, code: "QC_FAIL", name: "Hàng lỗi QC", allowRedelivery: false },
  { id: 7, code: "GOODS_DAMAGED", name: "Hàng hỏng", allowRedelivery: false },
  { id: 8, code: "WRONG_SPEC", name: "Sai yêu cầu", allowRedelivery: false },
  { id: 9, code: "WRONG_PRODUCT", name: "Sai sản phẩm", allowRedelivery: false },
  { id: 10, code: "SELLER_FAULT", name: "Lỗi người bán", allowRedelivery: false },
  { id: 11, code: "BUYER_REJECT", name: "Khách từ chối không lý do", allowRedelivery: false },
];

export default function DeliveryNoteUpdateDialog({
  open,
  onOpenChange,
  status,
  setStatus,
  failureType,
  setFailureType,
  failureReason,
  setFailureReason,
  affectsDebt,
  setAffectsDebt,
  notes,
  setNotes,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  status: string;
  setStatus: (v: any) => void;
  failureType: string;
  setFailureType: (v: any) => void;
  failureReason: string;
  setFailureReason: (v: any) => void;
  affectsDebt: boolean;
  setAffectsDebt: (v: boolean) => void;
  notes: string;
  setNotes: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái phiếu giao hàng</DialogTitle>
          <DialogDescription>Cập nhật trạng thái giao hàng và thông tin liên quan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Trạng thái *</Label>
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val as any);
                if (val !== "failed") {
                  setFailureReason("");
                  setFailureType("");
                  setAffectsDebt(false);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="shipping">Đang giao</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "failed" && (
            <>
              <div className="space-y-2">
                <Label>Loại thất bại</Label>
                <Select value={failureType} onValueChange={setFailureType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại thất bại" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      FAILURE_REASONS.reduce((acc, cur) => {
                        const cat = cur.allowRedelivery ? "logistics" : "other";
                        (acc[cat] = acc[cat] || []).push(cur);
                        return acc;
                      }, {} as Record<string, any[]>)
                    ).map(([cat, items]) => (
                      <React.Fragment key={cat}>
                        {items.map((r) => (
                          <SelectItem key={r.code} value={r.code}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lý do thất bại *</Label>
                <Textarea value={failureReason} onChange={(e) => setFailureReason(e.target.value)} rows={3} />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="affectsDebt" checked={affectsDebt} onCheckedChange={(c) => setAffectsDebt(c === true)} />
                <Label htmlFor="affectsDebt" className="text-sm font-medium leading-none">Ảnh hưởng đến công nợ (Đánh dấu nếu do khách hàng)</Label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Chọn lý do và ghi chú mô tả để cập nhật thất bại.</AlertDescription>
              </Alert>
            </>
          )}

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={isPending || !status || (status === "failed" && !failureReason)}>
            {isPending ? "Đang cập nhật..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
