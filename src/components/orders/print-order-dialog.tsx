// src/components/orders/print-order-dialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGenerateOrderExcel } from "@/hooks";

type PrintOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
};

export function PrintOrderDialog({
  open,
  onOpenChange,
  orderId,
}: PrintOrderDialogProps) {
  const { mutate: generateExcel, loading: isPending } = useGenerateOrderExcel();

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    await generateExcel(orderId);
    // BE có thể trả về URL download, tuỳ implementation của bạn mà mở file
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>In / xuất đơn hàng</DialogTitle>
          <DialogDescription>
            Tạo file Excel (hoặc phiếu in) cho đơn hàng này.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Đang tạo..." : "Tạo file"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
