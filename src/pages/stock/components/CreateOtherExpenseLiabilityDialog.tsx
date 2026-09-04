import { useState } from "react";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveVendors, useCreateVendorOtherCost } from "@/hooks/use-vendor";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { DollarSign, Loader2 } from "lucide-react";

interface CreateOtherExpenseLiabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOtherExpenseLiabilityDialog({
  open,
  onOpenChange,
}: CreateOtherExpenseLiabilityDialogProps) {
  const { data: vendors = [], isLoading: isLoadingVendors } = useActiveVendors();
  const createOtherCostMutation = useCreateVendorOtherCost();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [recordedDate, setRecordedDate] = useState<string>(todayStr);

  const selectedVendor = vendors.find((v) => v.id.toString() === selectedVendorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendorId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }

    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Số tiền chi phí khác phải lớn hơn 0");
      return;
    }

    if (!note.trim()) {
      toast.error("Vui lòng nhập diễn giải chi phí");
      return;
    }

    createOtherCostMutation.mutate(
      {
        vendorId: Number(selectedVendorId),
        data: {
          amount: amountVal,
          note: note.trim(),
          recordedAt: recordedDate ? new Date(`${recordedDate}T12:00:00`).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã ghi nhận công nợ chi phí khác thành công");
          onOpenChange(false);
          // Reset form
          setSelectedVendorId("");
          setAmount("");
          setNote("");
          setRecordedDate(todayStr);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border border-slate-200 shadow-xl rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Nhập công nợ chi phí khác
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ghi nhận phụ phí, vận chuyển hoặc chi phí phát sinh khác trực tiếp vào công nợ của nhà cung cấp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Chọn Nhà Cung Cấp */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Nhà cung cấp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedVendorId}
                onValueChange={(val) => setSelectedVendorId(val)}
                disabled={isLoadingVendors}
              >
                <SelectTrigger className="h-9 border-slate-200 text-xs">
                  <SelectValue placeholder={isLoadingVendors ? "Đang tải nhà cung cấp..." : "Chọn nhà cung cấp..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()} className="text-xs">
                      {v.name} ({v.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVendor && (
                <span className="text-[10px] text-slate-500 italic">
                  Dư nợ hiện tại: <strong className="text-slate-800">{formatCurrency(selectedVendor.currentDebt ?? 0)} ₫</strong>
                </span>
              )}
            </div>

            {/* Số tiền chi phí */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expenseAmount" className="text-xs font-semibold text-slate-700">
                Số tiền chi phí (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expenseAmount"
                type="number"
                min="1"
                step="any"
                placeholder="Nhập số tiền chi phí (> 0)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 border-slate-200 text-xs"
                required
              />
            </div>

            {/* Ngày ghi nhận */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recordedDate" className="text-xs font-semibold text-slate-700">
                Ngày ghi nhận
              </Label>
              <Input
                id="recordedDate"
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="h-9 border-slate-200 text-xs"
              />
            </div>

            {/* Diễn giải / Ghi chú */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expenseNote" className="text-xs font-semibold text-slate-700">
                Diễn giải chi phí <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="expenseNote"
                rows={3}
                placeholder="Ví dụ: Phụ phí vận chuyển lô hàng #NK-102, Chi phí kiểm định..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border-slate-200 text-xs resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createOtherCostMutation.isPending}
              className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createOtherCostMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Ghi nhận công nợ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
