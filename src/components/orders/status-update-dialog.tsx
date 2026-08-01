// src/components/orders/status-update-dialog.tsx
import { useState, useMemo, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { orderStatusLabels, orderStatusDescription } from "@/lib/status-utils";
import { useUpdateOrder } from "@/hooks";
import { ENTITY_CONFIG } from "@/config/entities.config";

type OrderStatus = string;

type StatusUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  currentStatus: OrderStatus;
  // nếu muốn giới hạn status có thể chọn, truyền vào; không thì dùng full list
  allowedStatuses?: OrderStatus[];
};

export function StatusUpdateDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  allowedStatuses,
}: StatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");

  const { mutateAsync: updateOrder, isPending } = useUpdateOrder();

  const statusOptions = useMemo(
    () => allowedStatuses ?? (Object.keys(ENTITY_CONFIG.orderStatuses.values) as OrderStatus[]),
    [allowedStatuses]
  );

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus, open]);

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      handleClose();
      return;
    }

    try {
      await updateOrder({
        id: orderId,
        data: {
          status: selectedStatus,
          note: note || undefined,
        },
      });
      handleClose();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
          <DialogDescription>
            Chọn trạng thái mới cho đơn hàng và thêm ghi chú (nếu cần).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm shrink-0">
            <span className="text-muted-foreground">Trạng thái hiện tại:</span>
            <StatusBadge
              status={currentStatus}
              label={orderStatusLabels[currentStatus] || currentStatus}
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
            <Label className="text-sm font-medium shrink-0">Trạng thái mới</Label>
            <div className="flex-1 overflow-y-auto pr-1 min-h-[150px] max-h-[320px] border rounded-md p-2 bg-muted/10">
              <RadioGroup
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
                className="grid grid-cols-1 gap-2"
              >
                {statusOptions.map((status) => {
                  const id = `status-${status}`;
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
                    >
                      <RadioGroupItem value={status} id={id} />
                      <Label htmlFor={id} className="flex-1 cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {orderStatusLabels[status] || status}
                          </span>
                          {orderStatusDescription[status] && (
                            <span className="text-xs text-muted-foreground">
                              {orderStatusDescription[status]}
                            </span>
                          )}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2 shrink-0">
            <Label htmlFor="status-note">Ghi chú</Label>
            <Textarea
              id="status-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do cập nhật trạng thái..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2 shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
