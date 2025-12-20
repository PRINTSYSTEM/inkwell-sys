// src/components/orders/deposit-dialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/status-utils";
import { useUpdateOrder } from "@/hooks";

type DepositDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  totalAmount: number;
  currentDeposit: number;
};

type PaymentMethod = "cash" | "bank_transfer" | "card" | "e_wallet";

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ" },
  { value: "e_wallet", label: "Ví điện tử" },
];

export function DepositDialog({
  open,
  onOpenChange,
  orderId,
  totalAmount,
  currentDeposit,
}: DepositDialogProps) {
  const [amount, setAmount] = useState<number>(currentDeposit || 0);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const { mutateAsync: updateOrder, isPending } = useUpdateOrder();

  useEffect(() => {
    if (open) {
      setAmount(currentDeposit || 0);
      setNote("");
    }
  }, [open, currentDeposit]);

  const remaining = Math.max(totalAmount - currentDeposit, 0);

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) return;

    await updateOrder({
      id: orderId,
      data: {
        depositAmount: amount,
        // Include payment method and note in the note field
        note: note ? `[${method}] ${note}` : `[${method}] Đã nhận cọc`,
      },
    });

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nhận cọc đơn hàng</DialogTitle>
          <DialogDescription>
            Dành cho khách lẻ – cần nhận cọc trước khi chuyển sang bình bài.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tổng tiền</span>
              <span className="font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Đã cọc</span>
              <span className="font-medium text-emerald-600">
                {formatCurrency(currentDeposit)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-1 mt-1">
              <span className="text-muted-foreground">Còn lại</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Số tiền cọc</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>Phương thức thanh toán</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              placeholder="Ví dụ: khách chuyển khoản, mã giao dịch #123..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Xác nhận nhận cọc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
