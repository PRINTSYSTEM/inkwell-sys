import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateStockIn, useUpdateStockIn } from "@/hooks/use-stock";

interface StockInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number | null;
  materialDetail: any;
  isEditMode: boolean;
  editId: number | null;
  stockInForm: {
    quantity: number;
    documentCode: string;
    notes: string;
  };
  setStockInForm: React.Dispatch<
    React.SetStateAction<{
      quantity: number;
      documentCode: string;
      notes: string;
    }>
  >;
  refetchAll: () => void;
}

export function StockInDialog({
  open,
  onOpenChange,
  materialId,
  materialDetail,
  isEditMode,
  editId,
  stockInForm,
  setStockInForm,
  refetchAll,
}: StockInDialogProps) {
  const { mutateAsync: createStockIn } = useCreateStockIn();
  const { mutateAsync: updateStockIn } = useUpdateStockIn();

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInForm.quantity || stockInForm.quantity <= 0) {
      toast.error("Vui lòng nhập số lượng!");
      return;
    }

    try {
      const calculatedTotalAmount = (stockInForm.quantity || 0) * (materialDetail?.unitPrice || 0);
      const isRollType = materialDetail?.type === "cuon" || 
                         materialDetail?.materialTypeName?.toLowerCase()?.includes("cuộn") || 
                         materialDetail?.materialTypeName?.toLowerCase()?.includes("cuon") ||
                         materialDetail?.unit?.toLowerCase()?.includes("cuộn") ||
                         materialDetail?.unit?.toLowerCase()?.includes("cuon");
      const lineKind = isRollType ? "roll" : "sheet";
      
      if (isEditMode && editId) {
        const promise = updateStockIn({
          id: editId,
          data: {
            notes: stockInForm.notes || "",
            totalAmount: calculatedTotalAmount,
            items: [
              {
                lineKind: lineKind,
                itemName: materialDetail?.name || "",
                itemCode: materialDetail?.code || "",
                unit: materialDetail?.unit || "",
                quantity: stockInForm.quantity,
                unitPrice: materialDetail?.unitPrice || 0,
                notes: stockInForm.notes || "",
                materialId: materialId ? Number(materialId) : 0,
                orderDetailId: 0,
                length: materialDetail?.length || 0,
                width: materialDetail?.width || 0,
                height: materialDetail?.height || 0,
                ramQuantity: 0,
                proofingOrderId: 0,
                jobCode: stockInForm.documentCode || "",
              },
            ],
          },
        });

        toast.promise(promise, {
          loading: "Đang cập nhật phiếu nhập...",
          success: "Cập nhật phiếu nhập thành công!",
          error: (err) => err?.response?.data?.message || err?.message || "Cập nhật phiếu nhập thất bại!",
        });

        await promise;
      } else {
        const promise = createStockIn({
          source: "manual",
          itemType: "material",
          vendorId: materialDetail?.vendorId || 0,
          productionOrderId: 0,
          deliveryNoteId: 0,
          originalStockOutId: 0,
          orderId: 0,
          totalAmount: calculatedTotalAmount,
          laborCost: 0,
          notes: stockInForm.notes || "",
          stockInDate: new Date().toISOString(),
          items: [
            {
              lineKind: lineKind,
              itemName: materialDetail?.name || "",
              itemCode: materialDetail?.code || "",
              unit: materialDetail?.unit || "",
              quantity: stockInForm.quantity,
              unitPrice: materialDetail?.unitPrice || 0,
              notes: stockInForm.notes || "",
              materialId: materialId ? Number(materialId) : 0,
              orderDetailId: 0,
              length: materialDetail?.length || 0,
              width: materialDetail?.width || 0,
              height: materialDetail?.height || 0,
              ramQuantity: 0,
              proofingOrderId: 0,
              jobCode: stockInForm.documentCode || "",
            },
          ],
        });

        toast.promise(promise, {
          loading: "Đang tạo phiếu nhập...",
          success: "Tạo phiếu nhập thành công!",
          error: (err) => err?.response?.data?.message || err?.message || "Tạo phiếu nhập thất bại!",
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
        <form onSubmit={handleStockInSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#93631F] flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-[#93631F]" />
              {isEditMode ? "Cập nhật phiếu nhập kho" : "Tạo phiếu nhập kho"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isEditMode 
                ? "Cập nhật thông tin phiếu nhập kho nguyên vật liệu đang chờ duyệt." 
                : "Các thông tin như người tạo, thời gian và vật tư sẽ được hệ thống tự động gán."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            {/* Tên vật tư */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Vật tư nhập vào</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-800">
                {materialDetail?.name}
              </div>
            </div>

            {/* Số lượng */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">
                Số lượng nhập ({(materialDetail?.unit || "").toLowerCase()})
              </Label>
              <Input
                type="number"
                placeholder="Nhập số lượng..."
                value={stockInForm.quantity || ""}
                onChange={(e) =>
                  setStockInForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))
                }
                className="rounded-md border-slate-200 h-10 text-xs font-mono font-bold focus-visible:ring-[#93631F] text-[#93631F]"
              />
            </div>

            {/* Số chứng từ / Mã bài */}
            {!isEditMode && (
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">
                  Mã bài sản xuất / Số chứng từ (Mặc định tự sinh)
                </Label>
                <Input
                  placeholder="Mã bài..."
                  value={stockInForm.documentCode}
                  onChange={(e) =>
                    setStockInForm((prev) => ({ ...prev, documentCode: e.target.value }))
                  }
                  className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F]"
                />
              </div>
            )}

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Diễn giải / Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú diễn giải..."
                value={stockInForm.notes}
                onChange={(e) =>
                  setStockInForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="rounded-md border-slate-200 text-xs min-h-[80px] focus-visible:ring-[#93631F]"
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
              className="rounded-md text-xs h-10 bg-[#93631F] hover:bg-[#7a521a] text-white cursor-pointer border-none"
            >
              {isEditMode ? "Cập nhật" : "Lưu phiếu nhập"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
