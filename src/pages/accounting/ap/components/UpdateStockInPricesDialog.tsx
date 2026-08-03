import React, { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStockIn, useUpdateStockInPrices } from "@/hooks/use-stock";
import { formatCurrency } from "@/lib/status-utils";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface UpdateStockInPricesDialogProps {
  stockInId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditItem {
  stockInItemId: number;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineAmount: number;
}

export default function UpdateStockInPricesDialog({
  stockInId,
  open,
  onOpenChange,
}: UpdateStockInPricesDialogProps) {
  const { data: stockIn, isLoading, isError, error } = useStockIn(
    stockInId,
    open && stockInId !== null
  );

  const { mutate: updatePrices, isPending: isUpdating } = useUpdateStockInPrices();
  const [items, setItems] = useState<EditItem[]>([]);
  const [stockInDate, setStockInDate] = useState<string>("");
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (open && stockIn) {
      if (stockIn.items) {
        setItems(
          stockIn.items.map((item: any) => ({
            stockInItemId: item.id,
            name: item.itemName || "",
            quantity: item.quantity || 0,
            unit: item.unit || "cái",
            unitPrice: item.unitPrice ?? 0,
            lineAmount: item.lineAmount ?? ((item.quantity || 0) * (item.unitPrice || 0)),
          }))
        );
      } else {
        setItems([]);
      }
      setStockInDate(stockIn.stockInDate ? stockIn.stockInDate.split("T")[0] : "");
    }
  }, [open, stockIn]);

  const handlePriceChange = (index: number, valStr: string) => {
    const price = parseFloat(valStr) || 0;
    const updated = [...items];
    const item = updated[index];
    updated[index] = {
      ...item,
      unitPrice: price,
      lineAmount: Math.round((item.quantity || 0) * price),
    };
    setItems(updated);
  };

  const handleAmountChange = (index: number, valStr: string) => {
    const amount = parseFloat(valStr) || 0;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      lineAmount: amount,
    };
    setItems(updated);
  };

  const handleSave = () => {
    if (!stockInId) return;

    // Chặn ngày tương lai ở client side
    if (stockInDate && new Date(stockInDate) > new Date()) {
      toast.error("Ngày phiếu nhập không được ở tương lai");
      return;
    }

    updatePrices(
      {
        id: stockInId,
        data: {
          stockInId,
          stockInDate: stockInDate ? new Date(`${stockInDate}T12:00:00`).toISOString() : undefined,
          items: items.map((item) => ({
            stockInItemId: item.stockInItemId,
            unitPrice: item.unitPrice,
            lineAmount: item.lineAmount,
          })),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.lineAmount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-slate-200 shadow-xl rounded-2xl p-6 bg-background">
        <DialogHeader className="pb-3 border-b border-border/40">
          <DialogTitle className="text-lg font-bold text-slate-800">
            Điều chỉnh ngày và đơn giá nhập kho
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Cập nhật ngày ghi sổ hoặc đơn giá cho phiếu nhập kho **{stockIn?.code}**. Hệ thống sẽ tự động tính toán lại công nợ và ghi nhận lịch sử điều chỉnh.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">Đang tải thông tin chi tiết phiếu nhập...</span>
          </div>
        ) : isError ? (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1.5 max-w-xs bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg">
              <Label htmlFor="stockInDate" className="text-xs font-semibold text-slate-700">
                Ngày phiếu nhập kho
              </Label>
              <Input
                id="stockInDate"
                type="date"
                max={todayStr}
                value={stockInDate}
                onChange={(e) => setStockInDate(e.target.value)}
                className="h-8 bg-white border-slate-200"
                required
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-slate-200/80 rounded-lg shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-semibold text-xs text-slate-600">Tên vật tư</TableHead>
                    <TableHead className="text-right font-semibold text-xs text-slate-600 w-[100px]">Số lượng</TableHead>
                    <TableHead className="text-center font-semibold text-xs text-slate-600 w-[70px]">ĐVT</TableHead>
                    <TableHead className="text-right font-semibold text-xs text-slate-600 w-[160px]">Đơn giá (đ)</TableHead>
                    <TableHead className="text-right font-semibold text-xs text-slate-600 w-[180px]">Thành tiền (đ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center italic text-muted-foreground text-xs">
                        Không có mặt hàng nào trong phiếu nhập này (Chỉ thay đổi ngày phiếu)
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.stockInItemId} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-xs text-slate-700 max-w-[200px] truncate" title={item.name}>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-semibold tabular-nums text-slate-700">
                          {item.quantity.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-500">{item.unit}</TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Nhập đơn giá..."
                            value={item.unitPrice ?? ""}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="h-8 text-right text-xs font-mono font-bold text-slate-800 border-slate-200 focus-visible:ring-primary/40"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Nhập thành tiền..."
                            value={item.lineAmount ?? ""}
                            onChange={(e) => handleAmountChange(index, e.target.value)}
                            className="h-8 text-right text-xs font-mono font-bold text-slate-800 border-slate-200 focus-visible:ring-primary/40"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {items.length > 0 && (
              <div className="flex justify-end items-center gap-2 px-1 text-xs font-semibold text-slate-700">
                <span>Tổng cộng sau điều chỉnh:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {formatCurrency(totalAmount)} ₫
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
            className="h-9"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className="h-9 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
