import { useEffect } from "react";
import { Minus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateStockOut, useUpdateStockOut } from "@/hooks/use-stock";

interface StockOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number | null;
  materialDetail: any;
  isEditMode: boolean;
  editId: number | null;
  stockOutForm: {
    quantity: number;
    documentCode: string;
    notes: string;
    purpose: string;
  };
  setStockOutForm: React.Dispatch<
    React.SetStateAction<{
      quantity: number;
      documentCode: string;
      notes: string;
      purpose: string;
    }>
  >;
  refetchAll: () => void;
}

export function StockOutDialog({
  open,
  onOpenChange,
  materialId,
  materialDetail,
  isEditMode,
  editId,
  stockOutForm,
  setStockOutForm,
  refetchAll,
}: StockOutDialogProps) {
  const { mutateAsync: createStockOut } = useCreateStockOut();
  const { mutateAsync: updateStockOut } = useUpdateStockOut();

  const handleStockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOutForm.quantity || stockOutForm.quantity <= 0) {
      toast.error("Vui lòng nhập số lượng!");
      return;
    }

    try {
      if (isEditMode && editId) {
        const promise = updateStockOut({
          id: editId,
          data: {
            notes: stockOutForm.notes || "",
            items: [
              {
                itemName: materialDetail?.name || "",
                quantity: stockOutForm.quantity,
                materialId: materialId,
                unit: materialDetail?.unit || "",
              },
            ],
          },
        });

        toast.promise(promise, {
          loading: "Đang cập nhật phiếu xuất...",
          success: "Cập nhật phiếu xuất thành công!",
          error: (err) => err?.response?.data?.message || err?.message || "Cập nhật phiếu xuất thất bại!",
        });

        await promise;
      } else {
        const promise = createStockOut({
          purpose: stockOutForm.purpose,
          itemType: "material",
          notes: stockOutForm.notes || "",
          stockOutDate: new Date().toISOString(),
          items: [
            {
              itemName: materialDetail?.name || "",
              quantity: stockOutForm.quantity,
              materialId: materialId,
              unit: materialDetail?.unit || "",
            },
          ],
        });

        toast.promise(promise, {
          loading: "Đang tạo phiếu xuất...",
          success: "Tạo phiếu xuất thành công!",
          error: (err) => err?.response?.data?.message || err?.message || "Tạo phiếu xuất thất bại!",
        });

        await promise;
      }
      onOpenChange(false);
      refetchAll();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-slate-200">
        <form onSubmit={handleStockOutSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
              <Minus className="h-4.5 w-4.5 text-rose-600" />
              {isEditMode ? "Cập nhật phiếu xuất kho" : "Tạo phiếu xuất kho"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isEditMode 
                ? "Cập nhật thông tin phiếu xuất kho nguyên vật liệu đang chờ duyệt." 
                : "Các thông tin như người tạo, thời gian và vật tư sẽ được hệ thống tự động gán."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            {/* Tên vật tư */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Vật tư xuất đi</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-800">
                {materialDetail?.name}
              </div>
            </div>

            {/* Mục đích xuất kho (Lý do xuất) */}
            {!isEditMode && (
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Mục đích xuất kho (Lý do)</Label>
                <Select
                  value={stockOutForm.purpose}
                  onValueChange={(val) => setStockOutForm((prev) => ({ ...prev, purpose: val }))}
                >
                  <SelectTrigger className="rounded-md border-slate-200 h-10 text-xs focus:ring-rose-500 cursor-pointer">
                    <SelectValue placeholder="Chọn lý do xuất" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="manual" className="text-xs cursor-pointer">Xuất điều chỉnh / Hao hao khác</SelectItem>
                    <SelectItem value="return_vendor" className="text-xs cursor-pointer font-semibold text-rose-600">Trả Nhà Cung Cấp (Return Vendor)</SelectItem>
                    <SelectItem value="transfer" className="text-xs cursor-pointer font-semibold text-[#93631F]">Xuất xưởng / Xuất sản xuất (Transfer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Số lượng */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">
                Số lượng xuất ({(materialDetail?.unit || "").toLowerCase()})
              </Label>
              <Input
                type="number"
                placeholder="Nhập số lượng..."
                value={stockOutForm.quantity || ""}
                onChange={(e) =>
                  setStockOutForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))
                }
                className="rounded-md border-slate-200 h-10 text-xs font-mono font-bold focus-visible:ring-rose-500 text-rose-600"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Diễn giải / Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú diễn giải..."
                value={stockOutForm.notes}
                onChange={(e) =>
                  setStockOutForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="rounded-md border-slate-200 text-xs min-h-[80px] focus-visible:ring-rose-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-md text-xs h-10 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-md text-xs h-10 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none"
            >
              {isEditMode ? "Cập nhật" : "Lưu phiếu xuất"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
