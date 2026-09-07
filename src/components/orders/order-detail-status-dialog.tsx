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
import { designStatusLabels, orderDetailItemStatusLabels } from "@/lib/status-utils";
import { useUpdateDesign, useRevertDesign } from "@/hooks";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

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
    ? orderDetail?.status || design?.designStatus
    : orderDetail?.derivedStatus || design?.designStatus;

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [revertReason, setRevertReason] = useState("");

  const { mutateAsync: updateDesign, isPending: isUpdating } = useUpdateDesign();
  const { mutate: revertDesign, loading: isReverting } = useRevertDesign();

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus || design?.designStatus || "");
      setRevertReason("");
    }
  }, [design, currentStatus, open]);

  // Comprehensive list of all status options for product/item
  const statusOptions = useMemo(() => {
    return [
      { key: "received_info", label: "Nhận thông tin", isPreCutOver: true },
      { key: "designing", label: "Đang thiết kế", isPreCutOver: true },
      { key: "editing", label: "Đang chỉnh sửa", isPreCutOver: true },
      { key: "waiting_for_customer_approval", label: "Chờ khách duyệt", isPreCutOver: true },
      { key: "confirmed_for_printing", label: "Đã chốt in", isPreCutOver: false },
      { key: "waiting_for_proofing", label: "Chờ bình bài", isPreCutOver: false },
      { key: "waiting_for_delivery", label: "Chờ giao hàng", isPreCutOver: false },
      { key: "partially_delivered", label: "Giao một phần", isPreCutOver: false },
      { key: "completed", label: "Hoàn thành", isPreCutOver: false },
      { key: "returned", label: "Bị trả về", isPreCutOver: false },
      { key: "cancelled", label: "Đã hủy", isPreCutOver: false },
    ];
  }, []);

  const isRevertActionNeeded = useMemo(() => {
    if (!isCutOver) return false;
    const selectedOpt = statusOptions.find((opt) => opt.key === selectedStatus);
    return selectedOpt?.isPreCutOver ?? false;
  }, [isCutOver, selectedStatus, statusOptions]);

  const handleClose = () => {
    if (isUpdating || isReverting) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!design?.id || !selectedStatus) return;

    if (isRevertActionNeeded) {
      try {
        await revertDesign({
          id: design.id,
          reason: revertReason.trim() || "Cập nhật trạng thái thủ công",
        });

        toast.success("Thành công", {
          description: "Đã chuyển sản phẩm về giai đoạn thiết kế thành công",
        });
        onSuccess?.();
        handleClose();
      } catch (error) {
        console.error("Failed to revert design:", error);
      }
      return;
    }

    try {
      await updateDesign({
        id: design.id,
        data: {
          designStatus: selectedStatus,
        },
        suppressToast: true,
      });

      toast.success("Thành công", {
        description: "Đã cập nhật trạng thái sản phẩm thành công",
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Failed to update design status:", error);
    }
  };

  const isPending = isUpdating || isReverting;
  const isChanged = selectedStatus !== currentStatus;

  if (!orderDetail) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái sản phẩm</DialogTitle>
          <DialogDescription>
            Cập nhật trạng thái cho sản phẩm {design?.designName || "không tên"} ({design?.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Current Status info */}
          <div className="flex flex-col gap-1.5 rounded-md border bg-muted/40 px-3 py-2.5 text-sm shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Trạng thái hiện tại:</span>
              <StatusBadge
                status={currentStatus || ""}
                label={
                  orderDetailItemStatusLabels[currentStatus || ""] ||
                  designStatusLabels[currentStatus || ""] ||
                  currentStatus
                }
              />
            </div>
            {isCutOver && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tiến độ sản phẩm:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Đã chuyển sản xuất (Cut-over)
                </span>
              </div>
            )}
          </div>

          {/* Status Options Selection List */}
          <div className="space-y-2 flex-1 flex flex-col min-h-0 overflow-hidden">
            <Label className="text-sm font-semibold shrink-0">
              Danh sách trạng thái sản phẩm
            </Label>
            <div className="flex-1 overflow-y-auto pr-1 border rounded-md p-2 bg-muted/10">
              <RadioGroup
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                className="grid grid-cols-1 gap-1.5"
              >
                {statusOptions.map((opt) => {
                  const id = `status-option-${opt.key}`;
                  const displayLabel =
                    ENTITY_CONFIG.orderDetailItemStatuses.values[opt.key] ||
                    ENTITY_CONFIG.designStatuses.values[opt.key] ||
                    opt.label;

                  return (
                    <div
                      key={opt.key}
                      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer ${
                        selectedStatus === opt.key
                          ? "bg-primary/10 border-primary shadow-xs font-medium"
                          : "hover:bg-muted/60 bg-background text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setSelectedStatus(opt.key)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <RadioGroupItem value={opt.key} id={id} />
                        <Label htmlFor={id} className="cursor-pointer text-xs sm:text-sm truncate">
                          {opt.label}
                        </Label>
                      </div>
                      <StatusBadge
                        status={opt.key}
                        label={displayLabel}
                        className="shrink-0 text-[10px]"
                      />
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          {/* Revert Reason Notice (if cutover product is moved back to design status) */}
          {isRevertActionNeeded && (
            <div className="space-y-2 border p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shrink-0">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Chuyển sản phẩm về giai đoạn thiết kế</span>
              </div>
              <Textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="Nhập lý do chuyển về thiết kế (tùy chọn)..."
                className="min-h-[55px] text-xs bg-background"
                disabled={isPending}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex gap-2 shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isPending || !isChanged}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Cập nhật"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

