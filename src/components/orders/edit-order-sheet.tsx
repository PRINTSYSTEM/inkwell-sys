// src/components/orders/edit-order-sheet.tsx
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OrderResponse } from "@/Schema/order.schema";
import type { UpdateOrderRequest } from "@/Schema";
import { useUpdateOrder } from "@/hooks";

type EditOrderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResponse;
};

// Helper: format ISO -> value cho input datetime-local (YYYY-MM-DDTHH:mm)
function toDateTimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}-${mi}`.replace("T", "T").replace("-", ":");
}

// Helper: value từ input datetime-local -> ISO string
function fromDateTimeLocalValue(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function EditOrderSheet({
  open,
  onOpenChange,
  order,
}: EditOrderSheetProps) {
  const [deliveryAddress, setDeliveryAddress] = useState(
    order.deliveryAddress || ""
  );
  const [deliveryDateLocal, setDeliveryDateLocal] = useState(
    toDateTimeLocalValue(order.deliveryDate?.toString())
  );
  const [note, setNote] = useState(order.note || "");

  const { mutateAsync: updateOrder, isPending } = useUpdateOrder();

  // Reset form mỗi lần mở sheet
  useEffect(() => {
    if (open) {
      setDeliveryAddress(order.deliveryAddress || "");
      setDeliveryDateLocal(
        toDateTimeLocalValue(order.deliveryDate?.toString())
      );
      setNote(order.note || "");
    }
  }, [open, order.deliveryAddress, order.deliveryDate, order.note]);

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const payload: UpdateOrderRequest = {};

    // Backend cho phép null, nên map "" -> null
    payload.deliveryAddress = deliveryAddress.trim()
      ? deliveryAddress.trim()
      : null;
    payload.note = note.trim() ? note.trim() : null;

    const deliveryDateIso = fromDateTimeLocalValue(deliveryDateLocal);
    payload.deliveryDate = deliveryDateIso || "";

    await updateOrder({
      id: order.id,
      data: payload,
    });

    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa đơn hàng {order.code}</SheetTitle>
          <SheetDescription>
            Cập nhật địa chỉ giao hàng, ngày giao và ghi chú cho đơn hàng.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Địa chỉ giao hàng</Label>
            <Input
              placeholder="Nhập địa chỉ giao hàng"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ngày giao dự kiến</Label>
            <Input
              type="datetime-local"
              value={deliveryDateLocal}
              onChange={(e) => setDeliveryDateLocal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nếu để trống, hệ thống sẽ không lưu ngày giao cho đơn hàng.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              placeholder="Thông tin thêm cho đơn hàng, lưu ý giao nhận..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>

        <SheetFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
