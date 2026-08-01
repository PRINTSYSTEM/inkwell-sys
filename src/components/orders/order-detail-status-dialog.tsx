// src/components/orders/order-detail-status-dialog.tsx
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
import { designStatusLabels } from "@/lib/status-utils";
import { useUpdateDesign, useRevertDesign } from "@/hooks";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { toast } from "sonner";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

type OrderDetailStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetail: any; // OrderDetailResponse
  onSuccess?: () => void;
};

export function OrderDetailStatusDialog({
  open,
  onOpenChange,
  orderDetail,
  onSuccess,
}: OrderDetailStatusDialogProps) {
  const design = orderDetail?.design;
  const isCutOver = orderDetail?.isCutOver ?? false;

  const currentStatus = isCutOver
    ? orderDetail?.status
    : orderDetail?.derivedStatus;

  const [selectedStatus, setSelectedStatus] = useState<string>(
    design?.designStatus || ""
  );
  const [revertReason, setRevertReason] = useState("");
  const [showRevertForm, setShowRevertForm] = useState(false);

  const { mutateAsync: updateDesign, isPending: isUpdating } = useUpdateDesign();
  const { mutate: revertDesign, loading: isReverting } = useRevertDesign();

  useEffect(() => {
    if (design?.designStatus) {
      setSelectedStatus(design.designStatus);
    }
    setShowRevertForm(false);
    setRevertReason("");
  }, [design, open]);

  const statusOptions = useMemo(() => {
    return Object.keys(ENTITY_CONFIG.designStatuses.values);
  }, []);

  const handleClose = () => {
    if (isUpdating || isReverting) return;
    onOpenChange(false);
  };

  const handleUpdateStatus = async () => {
    if (!design?.id) return;

    try {
      await updateDesign({
        id: design.id,
        data: {
          designStatus: selectedStatus,
        },
        suppressToast: true,
      });

      toast.success("Thành công", {
        description: "Đã cập nhật trạng thái thiết kế thành công",
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Failed to update design status:", error);
    }
  };

  const handleRevert = async () => {
    if (!design?.id) return;
    if (!revertReason.trim()) {
      toast.error("Vui lòng nhập lý do hoàn trả");
      return;
    }

    try {
      await revertDesign({
        id: design.id,
        reason: revertReason.trim(),
      });

      toast.success("Thành công", {
        description: "Đã hoàn trả thiết kế về trạng thái chờ thiết kế thành công",
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Failed to revert design:", error);
    }
  };

  if (!orderDetail) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái sản phẩm</DialogTitle>
          <DialogDescription>
            Cập nhật trạng thái cho sản phẩm {design?.designName || "không tên"} ({design?.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Current Status info */}
          <div className="flex flex-col gap-2 rounded-md border bg-muted/40 px-3 py-3 text-sm shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Trạng thái hiện tại:</span>
              <StatusBadge
                status={currentStatus || ""}
                label={
                  isCutOver
                    ? ENTITY_CONFIG.orderDetailItemStatuses.values[currentStatus || ""] || currentStatus
                    : designStatusLabels[currentStatus || ""] || currentStatus
                }
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Chế độ:</span>
              <span className="font-semibold text-primary">
                {isCutOver ? "Đã chuyển sản xuất (Cut-over)" : "Giai đoạn thiết kế"}
              </span>
            </div>
          </div>

          {/* Conditional Content */}
          {isCutOver ? (
            /* Cut-Over view (requires revert) */
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-amber-950 dark:text-amber-200">
                      Sản phẩm đã chốt in & chuyển sản xuất
                    </p>
                    <p className="text-amber-800 dark:text-amber-300 text-xs">
                      Trạng thái hiện tại được đồng bộ tự động theo tiến độ xưởng. Để sửa trạng thái thủ công, bạn cần chuyển sản phẩm này về giai đoạn thiết kế bằng cách hoàn trả.
                    </p>
                  </div>
                </div>
              </div>

              {!showRevertForm ? (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => setShowRevertForm(true)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Hoàn trả về trạng thái chờ thiết kế
                </Button>
              ) : (
                <div className="space-y-3 border p-3 rounded-md bg-muted/20">
                  <Label htmlFor="revert-reason" className="font-semibold text-xs">
                    Lý do hoàn trả *
                  </Label>
                  <Textarea
                    id="revert-reason"
                    value={revertReason}
                    onChange={(e) => setRevertReason(e.target.value)}
                    placeholder="Nhập lý do hoàn trả để lưu thông tin..."
                    className="min-h-[80px]"
                    disabled={isReverting}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRevertForm(false)}
                      disabled={isReverting}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRevert}
                      disabled={isReverting}
                    >
                      {isReverting ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Đang hoàn trả...
                        </>
                      ) : (
                        "Xác nhận hoàn trả"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Design phase view (allows change) */
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
              <Label className="text-sm font-medium shrink-0">Chọn trạng thái thiết kế mới</Label>
              <div className="flex-1 overflow-y-auto pr-1 min-h-[180px] max-h-[300px] border rounded-md p-2 bg-muted/10">
                <RadioGroup
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  className="grid grid-cols-1 gap-2"
                >
                  {statusOptions.map((status) => {
                    const id = `design-status-${status}`;
                    return (
                      <div
                        key={status}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
                      >
                        <RadioGroupItem value={status} id={id} />
                        <Label htmlFor={id} className="flex-1 cursor-pointer">
                          <span className="font-medium">
                            {ENTITY_CONFIG.designStatuses.values[status] || status}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex gap-2 shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating || isReverting}>
            Hủy
          </Button>
          {!isCutOver && (
            <Button onClick={handleUpdateStatus} disabled={isUpdating || selectedStatus === currentStatus}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
