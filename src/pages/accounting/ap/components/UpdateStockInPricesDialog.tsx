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

  useEffect(() => {
    if (open && stockIn?.items) {
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

    updatePrices(
      {
        id: stockInId,
        data: {
          stockInId,
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
            Điều chỉnh đơn giá và thành tiền nhập kho
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Cập nhật đơn giá cho phiếu nhập kho **{stockIn?.code}**. Hệ thống sẽ tự động tính toán lại công nợ và ghi nhận lịch sử điều chỉnh.
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
            <div className="max-h-[350px] overflow-y-auto border border-slate-200/80 rounded-lg shadow-sm">
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
                        Không có mặt hàng nào trong phiếu nhập này
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

            {/* Total Summary */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200/60 font-semibold text-slate-800">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Tổng tiền tạm tính:</span>
              <span className="text-lg font-bold font-mono text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || isLoading || isError || items.length === 0}
            className="font-semibold"
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
