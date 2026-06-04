import { useState, useEffect, useMemo } from "react";
import { Plus, Boxes, FileText } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

const parseRollWidth = (name: string): number | null => {
  const match = name.trim().match(/(\d+(?:\.\d+)?)\s*(?:cm|mm|m)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
};

interface CreateMaterialDirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVendorId: string;
  vendorsData: any[] | undefined;
  refetch: () => void;
}

export function CreateMaterialDirectDialog({
  open,
  onOpenChange,
  selectedVendorId,
  vendorsData,
  refetch,
}: CreateMaterialDirectDialogProps) {
  const queryClient = useQueryClient();

  const [materialType, setMaterialType] = useState<"cuon" | "to">("cuon");
  const [materialForm, setMaterialForm] = useState({
    name: "",
    width: 0,
    length: 0,
    quantity: 0,
    unitPrice: 0,
    notes: "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setMaterialForm({
        name: "",
        width: 0,
        length: 0,
        quantity: 0,
        unitPrice: 0,
        notes: "",
      });
      setMaterialType("cuon");
    }
  }, [open]);

  // Prefilled vendor information from filter
  const selectedVendor = useMemo(() => {
    if (selectedVendorId === "all") return null;
    return vendorsData?.find((v) => String(v.id) === selectedVendorId) || null;
  }, [selectedVendorId, vendorsData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVendorId === "all" || !selectedVendor) {
      toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi nhập vật tư mới!");
      return;
    }

    if (materialType === "cuon") {
      if (!materialForm.name.trim()) {
        toast.error("Vui lòng nhập tên vật tư cuộn!");
        return;
      }
      const widthVal = parseRollWidth(materialForm.name);
      if (widthVal === null) {
        toast.error("Vui lòng nhập kích thước khổ!");
        return;
      }
    } else {
      if (!materialForm.width || materialForm.width <= 0) {
        toast.error("Vui lòng nhập chiều rộng khổ!");
        return;
      }
      if (!materialForm.length || materialForm.length <= 0) {
        toast.error("Vui lòng nhập chiều dài khổ!");
        return;
      }
    }

    if (materialForm.quantity < 0) {
      toast.error("Số lượng không được âm!");
      return;
    }

    try {
      const generatedName = materialType === "cuon" 
        ? materialForm.name.trim() 
        : `Tờ ${materialForm.width}x${materialForm.length}`;

      const payload = {
        name: generatedName,
        type: materialType,
        length: materialType === "cuon" ? 0 : materialForm.length,
        width: materialType === "cuon" ? parseRollWidth(materialForm.name) : materialForm.width,
        unit: materialType === "cuon" ? "m" : "tờ",
        unitPrice: materialForm.unitPrice || 0,
        vendorId: selectedVendor.id,
      };

      let toastId: string | number | undefined;
      try {
        toastId = toast.loading("Đang tạo chất liệu mới...");
        const newMaterialRes = await apiRequest.post<any>(API_SUFFIX.MATERIALS, payload);
        const newMaterial = newMaterialRes.data;
        
        if (newMaterial && materialForm.quantity > 0) {
          toast.loading("Đang tạo và duyệt phiếu nhập kho ban đầu...", { id: toastId });
          const calculatedTotalAmount = (materialForm.quantity || 0) * (newMaterial.unitPrice || 0);
          const lineKind = materialType === "cuon" ? "roll" : "sheet";
          
          const stockInRes = await apiRequest.post<any>(API_SUFFIX.STOCK_INS, {
            source: "manual",
            itemType: "material",
            vendorId: selectedVendor.id,
            totalAmount: calculatedTotalAmount || undefined,
            notes: materialForm.notes || "Nhập kho ban đầu khi tạo vật tư mới",
            stockInDate: new Date().toISOString(),
            items: [
              {
                lineKind: lineKind,
                itemName: newMaterial.name,
                itemCode: newMaterial.code || undefined,
                unit: newMaterial.unit || undefined,
                quantity: materialForm.quantity,
                unitPrice: newMaterial.unitPrice || undefined,
                notes: materialForm.notes || undefined,
                materialId: newMaterial.id,
                length: newMaterial.length || undefined,
                width: newMaterial.width || undefined,
                height: newMaterial.height || undefined,
              },
            ],
          });
          const stockInResult = stockInRes.data;

          if (stockInResult && stockInResult.id) {
            await apiRequest.post(API_SUFFIX.STOCK_IN_COMPLETE(stockInResult.id));
          }
        }
        
        // Invalidate queries to refresh lists
        queryClient.invalidateQueries({ queryKey: ["materials"] });
        queryClient.invalidateQueries({ queryKey: ["stock-ins"] });
        
        if (toastId) toast.dismiss(toastId);
        
        if (materialForm.quantity > 0) {
          toast.success(`Đã tạo vật tư "${newMaterial.name}" và nhập kho ${materialForm.quantity} ${newMaterial.unit || (materialType === "cuon" ? "m" : "tờ")} thành công!`);
        } else {
          toast.success(`Đã tạo vật tư "${newMaterial.name}" thành công!`);
        }
        
        onOpenChange(false);
        refetch();
      } catch (err: any) {
        if (toastId) toast.dismiss(toastId);
        const errMsg = err.response?.data?.message || err.message || "Đã xảy ra lỗi!";
        toast.error(`Thực hiện thất bại: ${errMsg}`);
        console.error(err);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-slate-200">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#93631F] flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-[#93631F]" />
              Nhập vật tư mới
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tạo nguyên vật liệu mới. Nhà cung cấp được gán tự động từ bộ lọc: <strong className="text-[#93631F]">{selectedVendor?.name || selectedVendor?.code}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Chọn loại vật tư */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Loại vật tư</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={materialType === "cuon" ? "default" : "outline"}
                  onClick={() => setMaterialType("cuon")}
                  className={materialType === "cuon" 
                    ? "bg-[#93631F] hover:bg-[#7a521a] text-white border-none rounded-md text-xs cursor-pointer h-10" 
                    : "rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 text-xs cursor-pointer h-10"}
                >
                  <Boxes className="h-4 w-4 mr-2" />
                  Vật tư cuộn
                </Button>
                <Button
                  type="button"
                  variant={materialType === "to" ? "default" : "outline"}
                  onClick={() => setMaterialType("to")}
                  className={materialType === "to" 
                    ? "bg-[#93631F] hover:bg-[#7a521a] text-white border-none rounded-md text-xs cursor-pointer h-10" 
                    : "rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 text-xs cursor-pointer h-10"}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Vật tư tờ
                </Button>
              </div>
            </div>

            {/* Form fields conditionally rendered based on materialType */}
            {materialType === "cuon" ? (
              <>
                {/* Nhập tên */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700">Tên vật tư cuộn</Label>
                  <Input
                    placeholder="Nhập tên cuộn (ví dụ: Decal bể cuộn khổ 32)..."
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="rounded-md border-slate-200 h-10 text-xs focus-visible:ring-[#93631F]"
                  />
                </div>

                {/* Đơn vị hiển thị */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md select-none">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none mb-1">Đơn vị tính công nợ</span>
                    <span className="text-xs font-bold text-slate-700">m dài</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none mb-1">Đơn vị lưu kho</span>
                    <span className="text-xs font-bold text-slate-700">m dài</span>
                  </div>
                </div>

                {/* Số lượng (m) */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700">Số lượng ban đầu (m)</Label>
                  <Input
                    type="number"
                    placeholder="Nhập số lượng mét..."
                    value={materialForm.quantity || ""}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="rounded-md border-slate-200 h-10 text-xs font-mono font-bold focus-visible:ring-[#93631F] text-[#93631F]"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Nhập khổ (width x length) */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700">Kích thước khổ (cm)</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        type="number"
                        placeholder="Chiều rộng"
                        value={materialForm.width || ""}
                        onChange={(e) => setMaterialForm((prev) => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                        className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] text-center"
                      />
                      <span className="text-[10px] text-slate-400 block text-center leading-none mt-1">Chiều rộng (width)</span>
                    </div>
                    <span className="text-slate-400 font-bold self-center">x</span>
                    <div className="flex-1 space-y-1">
                      <Input
                        type="number"
                        placeholder="Chiều dài"
                        value={materialForm.length || ""}
                        onChange={(e) => setMaterialForm((prev) => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                        className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] text-center"
                      />
                      <span className="text-[10px] text-slate-400 block text-center leading-none mt-1">Chiều dài (length)</span>
                    </div>
                  </div>
                </div>

                {/* Tên tự ghép */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700">Tên vật tư ghép tự động</Label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-800 text-xs">
                    Tờ {materialForm.width || 0}x{materialForm.length || 0}
                  </div>
                </div>

                {/* Đơn vị hiển thị */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md select-none">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none mb-1">Đơn vị tính công nợ</span>
                    <span className="text-xs font-bold text-slate-700">m² (mét vuông)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none mb-1">Đơn vị lưu kho</span>
                    <span className="text-xs font-bold text-slate-700">tờ</span>
                  </div>
                </div>

                {/* Số lượng (tờ) */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700">Số lượng ban đầu (tờ)</Label>
                  <Input
                    type="number"
                    placeholder="Nhập số lượng tờ..."
                    value={materialForm.quantity || ""}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="rounded-md border-slate-200 h-10 text-xs font-mono font-bold focus-visible:ring-[#93631F] text-[#93631F]"
                  />
                </div>
              </>
            )}

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Diễn giải / Ghi chú</Label>
              <Textarea
                placeholder="Nhập diễn giải ghi chú thêm..."
                value={materialForm.notes}
                onChange={(e) => setMaterialForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="rounded-md border-slate-200 text-xs min-h-[60px] focus-visible:ring-[#93631F]"
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
              Lưu vật tư
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
