// src/components/orders/production-dialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProductionStep } from "@/hooks";
import type {
  UpdateProductionStepRequest,
} from "@/Schema/production.schema";

type ProductionDialogMode = "start" | "complete";

type ProductionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: number; // Changed from productionId to stepId for new API
  mode: ProductionDialogMode;
};

export function ProductionDialog({
  open,
  onOpenChange,
  stepId,
  mode,
}: ProductionDialogProps) {
  const [wastage, setWastage] = useState<number>(0);
  const [producedQty, setProducedQty] = useState<number>(1);
  const [defectNotes, setDefectNotes] = useState("");
  const { mutate: updateStep, isPending: updating } = useUpdateProductionStep();

  const loading = updating;

  const handleClose = () => {
    if (loading) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (mode === "start") {
      // Start step: set status to "in_progress" or appropriate status
      const payload: UpdateProductionStepRequest = {
        status: "in_progress",
      };
      await updateStep({ id: stepId, data: payload });
    } else {
      // Complete step: set status to "completed" with output and defect info
      const payload: UpdateProductionStepRequest = {
        status: "completed",
        outputQty: producedQty || 1,
        defectQty: wastage || 0,
        defectNotes: defectNotes || undefined,
      };
      await updateStep({ id: stepId, data: payload });
    }

    handleClose();
  };

  const title = mode === "start" ? "Bắt đầu sản xuất" : "Hoàn thành sản xuất";
  const description =
    mode === "start"
      ? "Xác nhận bắt đầu lệnh sản xuất này."
      : "Nhập thông tin hao hụt, lỗi nếu có trước khi hoàn thành.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === "complete" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Số lượng sản xuất <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={producedQty}
                onChange={(e) => setProducedQty(Number(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Số lượng hao hụt (nếu có)</Label>
              <Input
                type="number"
                min={0}
                value={wastage}
                onChange={(e) => setWastage(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú lỗi / sự cố</Label>
              <Textarea
                placeholder="Mô tả lỗi in, lỗi gia công..."
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : mode === "start"
                ? "Bắt đầu"
                : "Xác nhận hoàn thành"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
