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
    laborCost: number;
  };
  setStockInForm: React.Dispatch<
    React.SetStateAction<{
      quantity: number;
      documentCode: string;
      notes: string;
      laborCost: number;
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

    let toastId: string | number | undefined;
    try {
      const calculatedTotalAmount = (stockInForm.quantity || 0) * (materialDetail?.unitPrice || 0);
      const isRollType = materialDetail?.type === "cuon" || 
                         materialDetail?.materialTypeName?.toLowerCase()?.includes("cuộn") || 
                         materialDetail?.materialTypeName?.toLowerCase()?.includes("cuon") ||
                         materialDetail?.unit?.toLowerCase()?.includes("cuộn") ||
                         materialDetail?.unit?.toLowerCase()?.includes("cuon");
      const lineKind = isRollType ? "roll" : "sheet";
      
      if (isEditMode && editId) {
        toastId = toast.loading("Đang cập nhật phiếu nhập...");
        await updateStockIn({
          id: editId,
          data: {
            notes: stockInForm.notes || undefined,
            totalAmount: calculatedTotalAmount || undefined,
            laborCost: stockInForm.laborCost || undefined,
            items: [
              {
                lineKind: lineKind,
                itemName: materialDetail?.name || "",
                itemCode: materialDetail?.code || undefined,
                unit: materialDetail?.unit || undefined,
                quantity: stockInForm.quantity,
                unitPrice: materialDetail?.unitPrice || undefined,
                notes: stockInForm.notes || undefined,
                materialId: materialId ? Number(materialId) : undefined,
                orderDetailId: undefined,
                length: materialDetail?.length || undefined,
                width: materialDetail?.width || undefined,
                height: materialDetail?.height || undefined,
                ramQuantity: undefined,
                proofingOrderId: undefined,
                jobCode: stockInForm.documentCode || undefined,
              },
            ],
          },
        });
      } else {
        toastId = toast.loading("Đang tạo phiếu nhập...");
        await createStockIn({
          source: "manual",
          itemType: "material",
          vendorId: materialDetail?.vendorId || undefined,
          productionOrderId: undefined,
          deliveryNoteId: undefined,
          originalStockOutId: undefined,
          orderId: undefined,
          totalAmount: calculatedTotalAmount || undefined,
          laborCost: stockInForm.laborCost || undefined,
          notes: stockInForm.notes || undefined,
          stockInDate: new Date().toISOString(),
          items: [
            {
              lineKind: lineKind,
              itemName: materialDetail?.name || "",
              itemCode: materialDetail?.code || undefined,
              unit: materialDetail?.unit || undefined,
              quantity: stockInForm.quantity,
              unitPrice: materialDetail?.unitPrice || undefined,
              notes: stockInForm.notes || undefined,
              materialId: materialId ? Number(materialId) : undefined,
              orderDetailId: undefined,
              length: materialDetail?.length || undefined,
              width: materialDetail?.width || undefined,
              height: materialDetail?.height || undefined,
              ramQuantity: undefined,
              proofingOrderId: undefined,
              jobCode: stockInForm.documentCode || undefined,
            },
          ],
        });
      }
      if (toastId) toast.dismiss(toastId);
      onOpenChange(false);
      refetchAll();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
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
