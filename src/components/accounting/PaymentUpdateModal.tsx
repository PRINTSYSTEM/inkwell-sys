import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CreditCard } from "lucide-react";
import { OrderWithAccounting, PaymentStatus } from "./InvoiceConfirmDialog";

interface PaymentUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithAccounting | null;
  onConfirm: (orderId: number, amount: number, note: string) => void;
}

export function PaymentUpdateModal({
  open,
  onOpenChange,
  order,
  onConfirm,
}: PaymentUpdateModalProps) {
  const [paymentType, setPaymentType] = useState<"partial" | "full">("partial");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  if (!order) return null;

  const remainingAmount = order.totalAmount - order.depositAmount;

  const handleConfirm = () => {
    const paymentAmount =
      paymentType === "full" ? remainingAmount : parseFloat(amount);
    if (paymentAmount > 0) {
      onConfirm(order.id, paymentAmount, note);
      setAmount("");
      setNote("");
      setPaymentType("partial");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const isValid =
    paymentType === "full" ||
    (parseFloat(amount) > 0 && parseFloat(amount) <= remainingAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cập nhật thanh toán
          </DialogTitle>
          <DialogDescription>
            Đơn hàng:{" "}
            <span className="font-medium text-foreground">{order.code}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng giá trị:</span>
              <span className="font-medium">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Đã thanh toán:</span>
              <span className="font-medium text-success">
                {formatCurrency(order.depositAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Còn lại:</span>
              <span className="font-bold text-destructive">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Payment type selection */}
          <div className="space-y-3">
            <Label>Hình thức thanh toán</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as "partial" | "full")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal cursor-pointer">
                  Thanh toán đủ ({formatCurrency(remainingAmount)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="font-normal cursor-pointer">
                  Thanh toán một phần
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Partial amount input */}
          {paymentType === "partial" && (
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền thanh toán</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                max={remainingAmount}
              />
              {parseFloat(amount) > remainingAmount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Số tiền không được vượt quá số còn lại
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="note"
              placeholder="Nhập ghi chú..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Xác nhận thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
