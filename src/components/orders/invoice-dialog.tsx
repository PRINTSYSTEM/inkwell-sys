// src/components/orders/invoice-dialog.tsx
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrderInvoice, useGenerateOrderInvoice } from "@/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";

type InvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
};

export function InvoiceDialog({
  open,
  onOpenChange,
  orderId,
}: InvoiceDialogProps) {
  const { data: invoice, refetch } = useOrderInvoice(orderId, open);
  // src/components/orders/invoice-dialog.tsx
  const { mutate: generateInvoice, loading: isPending } =
    useGenerateOrderInvoice();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleGenerate = async () => {
    await generateInvoice(orderId);
    await refetch();
  };

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const isUrl =
    typeof invoice === "string" &&
    (invoice.startsWith("http://") || invoice.startsWith("https://"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hoá đơn đơn hàng #{orderId}</DialogTitle>
          <DialogDescription>
            Xem hoặc tạo hoá đơn cho đơn hàng này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {invoice ? (
            isUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Hoá đơn đã được tạo. Nhấn vào nút dưới để mở.
                </p>
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <a href={invoice} target="_blank" rel="noreferrer">
                    Mở hoá đơn
                  </a>
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-64 rounded-md border p-3 text-sm font-mono bg-muted/40">
                {invoice}
              </ScrollArea>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có hoá đơn nào cho đơn hàng này.
            </p>
          )}
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Đóng
          </Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Đang tạo..." : "Tạo / cập nhật hoá đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
