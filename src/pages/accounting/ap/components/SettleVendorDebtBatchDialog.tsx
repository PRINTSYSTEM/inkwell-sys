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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSettleVendorDebtBatch } from "@/hooks/use-vendor";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";

interface SettleVendorDebtBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVendors: Map<number, { vendorId: number; vendorCode: string; vendorName: string; currentDebt: number }>;
  onSuccess: () => void;
}

interface BatchFormItem {
  vendorId: number;
  vendorCode: string;
  vendorName: string;
  currentDebt: number;
  amount: string;
  note: string;
}

export default function SettleVendorDebtBatchDialog({
  open,
  onOpenChange,
  selectedVendors,
  onSuccess,
}: SettleVendorDebtBatchDialogProps) {
  const batchMutation = useSettleVendorDebtBatch();
  const todayStr = new Date().toISOString().split("T")[0];

  const [settledAt, setSettledAt] = useState<string>(todayStr);
  const [allowAdvance, setAllowAdvance] = useState(true);
  const [items, setItems] = useState<BatchFormItem[]>([]);

  useEffect(() => {
    if (open) {
      setItems(
        Array.from(selectedVendors.values()).map((v) => ({
          ...v,
          amount: "", // default empty = Settle all
          note: "",
        }))
      );
      setSettledAt(todayStr);
      setAllowAdvance(true);
    }
  }, [open, selectedVendors, todayStr]);

  const handleItemChange = (index: number, field: "amount" | "note", value: string) => {
    const next = [...items];
    next[index] = {
      ...next[index],
      [field]: value,
    };
    setItems(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Pre-validate: trùng lặp nhà cung cấp
    const duplicateIds = new Set<number>();
    const seenIds = new Set<number>();
    for (const item of items) {
      if (seenIds.has(item.vendorId)) {
        duplicateIds.add(item.vendorId);
      }
      seenIds.add(item.vendorId);
    }

    if (duplicateIds.size > 0) {
      toast.error("Phát hiện trùng lặp Nhà cung cấp trong danh sách tất toán");
      return;
    }

    // Check notes & amounts
    for (const item of items) {
      if (!item.note.trim()) {
        toast.error(`Vui lòng nhập lý do tất toán cho nhà cung cấp ${item.vendorName}`);
        return;
      }
      const parsedAmount = item.amount === "" ? null : parseFloat(item.amount);
      if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
        toast.error(`Số tiền tất toán cho nhà cung cấp ${item.vendorName} không hợp lệ`);
        return;
      }
    }

    // Chặn ngày tương lai ở client side
    if (settledAt && new Date(settledAt) > new Date()) {
      toast.error("Ngày tất toán không được ở tương lai");
      return;
    }

    const payload = items.map((item) => ({
      vendorId: item.vendorId,
      amount: item.amount === "" ? null : parseFloat(item.amount),
      note: item.note.trim(),
      allowAdvance,
      settledAt: settledAt ? new Date(`${settledAt}T12:00:00`).toISOString() : null,
    }));

    batchMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border border-slate-200 shadow-2xl rounded-xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Tất toán công nợ hàng loạt (Ngoài hệ thống)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ghi giảm công nợ cho nhiều nhà cung cấp cùng lúc trong một giao dịch. Hệ thống sẽ tự động cập nhật số dư công nợ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0 space-y-4 pt-2">
          {/* Header Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 shrink-0">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="batchDate" className="text-xs font-semibold text-slate-700">
                Ngày tất toán chung
              </Label>
              <Input
                id="batchDate"
                type="date"
                max={todayStr}
                value={settledAt}
                onChange={(e) => setSettledAt(e.target.value)}
                className="h-9 bg-white border-slate-200"
                required
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-2 bg-white px-3 mt-auto h-9">
              <Label htmlFor="batchAllowAdvance" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Cho phép số dư âm (Advance)
              </Label>
              <Switch
                id="batchAllowAdvance"
                checked={allowAdvance}
                onCheckedChange={setAllowAdvance}
              />
            </div>
          </div>

          {/* Vendors List Table */}
          <div className="flex-1 overflow-auto border border-slate-200/80 rounded-lg bg-white shadow-sm min-h-[150px]">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[100px] font-semibold text-xs py-2">Mã NCC</TableHead>
                  <TableHead className="font-semibold text-xs py-2">Tên nhà cung cấp</TableHead>
                  <TableHead className="text-right w-[150px] font-semibold text-xs py-2">Nợ hiện tại</TableHead>
                  <TableHead className="w-[150px] font-semibold text-xs py-2">Tiền tất toán</TableHead>
                  <TableHead className="w-[200px] font-semibold text-xs py-2">Lý do tất toán <span className="text-red-500">*</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.vendorId} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs py-2">{item.vendorCode || "—"}</TableCell>
                    <TableCell className="font-semibold text-xs py-2 max-w-[150px] truncate" title={item.vendorName}>
                      {item.vendorName}
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs py-2 tabular-nums">
                      {formatCurrency(item.currentDebt)} ₫
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Để trống = Hết nợ"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                        className="h-8 text-xs font-mono border-slate-200"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="text"
                        placeholder="Lý do tất toán..."
                        value={item.note}
                        onChange={(e) => handleItemChange(index, "note", e.target.value)}
                        className="h-8 text-xs border-slate-200"
                        required
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={batchMutation.isPending}
              className="h-9"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={batchMutation.isPending}
              className="h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {batchMutation.isPending ? "Đang xử lý..." : `Xác nhận tất toán (${items.length} NCC)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
