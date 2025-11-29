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
import { useUpdateOrder } from "@/hooks";

type EditOrderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResponse;
};

export function EditOrderSheet({
  open,
  onOpenChange,
  order,
}: EditOrderSheetProps) {
  const [deliveryAddress, setDeliveryAddress] = useState(
    order.deliveryAddress || ""
  );
  const [note, setNote] = useState(order.note || "");
  const { mutateAsync: updateOrder, isPending } = useUpdateOrder();

  useEffect(() => {
    if (open) {
      setDeliveryAddress(order.deliveryAddress || "");
      setNote(order.note || "");
    }
  }, [open, order.deliveryAddress, order.note]);

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    await updateOrder({
      id: order.id,
      data: {
        deliveryAddress: deliveryAddress || null,
        note: note || null,
      } as any,
    });
    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa đơn hàng {order.code}</SheetTitle>
          <SheetDescription>
            Cập nhật địa chỉ giao hàng, ghi chú...
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Địa chỉ giao hàng</Label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
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
