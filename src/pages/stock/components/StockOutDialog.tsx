import { useEffect, useState } from "react";
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
import { useVendors, useVendor } from "@/hooks/use-vendor";

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
    vendorId?: number;
    receiverName?: string;
    receiverAddress?: string;
    warehouseName?: string;
    warehouseAddress?: string;
  };
  setStockOutForm: React.Dispatch<
    React.SetStateAction<{
      quantity: number;
      documentCode: string;
      notes: string;
      purpose: string;
      vendorId?: number;
      receiverName?: string;
      receiverAddress?: string;
      warehouseName?: string;
      warehouseAddress?: string;
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
  const { data: vendorsData } = useVendors({ pageNumber: 1, pageSize: 100 });
  const vendorsList = vendorsData?.items || [];

  const selectedVendorId = stockOutForm.vendorId || null;
  const { data: selectedVendorDetail } = useVendor(selectedVendorId, !!selectedVendorId);
  const [lastLoadedVendorId, setLastLoadedVendorId] = useState<number | null>(null);

  // Prefill vendorId if purpose is return_vendor and vendorId is not set
  useEffect(() => {
    if (open && stockOutForm.purpose === "return_vendor" && !stockOutForm.vendorId && materialDetail?.vendorId) {
      setStockOutForm((prev) => ({
        ...prev,
        vendorId: materialDetail.vendorId,
      }));
    }
  }, [open, stockOutForm.purpose, stockOutForm.vendorId, materialDetail?.vendorId, setStockOutForm]);

  // Prefill receiver fields when selectedVendorDetail is loaded/changed
  useEffect(() => {
    if (selectedVendorDetail && selectedVendorDetail.id === stockOutForm.vendorId && stockOutForm.vendorId !== lastLoadedVendorId) {
      setStockOutForm((prev) => ({
        ...prev,
        receiverAddress: selectedVendorDetail.address || "",
      }));
      setLastLoadedVendorId(stockOutForm.vendorId);
    }
  }, [selectedVendorDetail, stockOutForm.vendorId, lastLoadedVendorId, setStockOutForm]);

  const handleStockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOutForm.quantity || stockOutForm.quantity <= 0) {
      toast.error("Vui lòng nhập số lượng!");
      return;
    }

    let toastId: string | number | undefined;
    try {
      if (isEditMode && editId) {
        toastId = toast.loading("Đang cập nhật phiếu xuất...");
        await updateStockOut({
          id: editId,
          data: {
            notes: stockOutForm.notes || "",
            purpose: stockOutForm.purpose,
            vendorId: stockOutForm.vendorId || undefined,
            receiverName: stockOutForm.receiverName || undefined,
            receiverAddress: stockOutForm.receiverAddress || undefined,
            warehouseName: stockOutForm.warehouseName || undefined,
            warehouseAddress: stockOutForm.warehouseAddress || undefined,
            items: [
              {
                itemName: materialDetail?.name || "",
                quantity: stockOutForm.quantity,
                materialId: materialId,
                unit: materialDetail?.unit || "",
                jobCode: stockOutForm.documentCode || undefined,
              } as any,
            ],
          },
        });
      } else {
        toastId = toast.loading("Đang tạo phiếu xuất...");
        await createStockOut({
          purpose: stockOutForm.purpose,
          itemType: "material",
          notes: stockOutForm.notes || "",
          stockOutDate: new Date().toISOString(),
          vendorId: stockOutForm.vendorId || undefined,
          receiverName: stockOutForm.receiverName || undefined,
          receiverAddress: stockOutForm.receiverAddress || undefined,
          warehouseName: stockOutForm.warehouseName || undefined,
          warehouseAddress: stockOutForm.warehouseAddress || undefined,
          items: [
            {
              itemName: materialDetail?.name || "",
              quantity: stockOutForm.quantity,
              materialId: materialId,
              unit: materialDetail?.unit || "",
              jobCode: stockOutForm.documentCode || undefined,
            } as any,
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
      <DialogContent className="max-w-xl rounded-xl border-slate-200">
        <form onSubmit={handleStockOutSubmit} className="space-y-3.5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
              <Minus className="h-4.5 w-4.5 text-rose-600" />
              {isEditMode ? "Cập nhật phiếu xuất kho" : "Tạo phiếu xuất kho"}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-500 leading-normal">
              {isEditMode 
                ? "Cập nhật thông tin phiếu xuất kho nguyên vật liệu đang chờ duyệt." 
                : "Thông tin người tạo và thời gian xuất sẽ được gán tự động."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            {/* Tên vật tư hiển thị nhỏ gọn ở giữa */}
            <div className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-md text-center">
              <span className="font-semibold text-slate-500">Vật tư:</span>
              <span className="font-bold text-slate-800 truncate max-w-[380px]" title={materialDetail?.name}>
                {materialDetail?.name}
              </span>
            </div>

            {/* Mục đích xuất kho (Lý do xuất) */}
            {!isEditMode && (
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Mục đích xuất kho (Lý do)</Label>
                <Select
                  value={stockOutForm.purpose}
                  onValueChange={(val) => setStockOutForm((prev) => ({ ...prev, purpose: val }))}
                >
                  <SelectTrigger className="rounded-md border-slate-200 h-9 text-xs focus:ring-rose-500 cursor-pointer">
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

            {/* Số lượng + Mã bài sản xuất (Nằm trên 1 dòng) */}
            <div className="grid grid-cols-2 gap-3">
              <div className={isEditMode ? "col-span-2 space-y-1" : "col-span-1 space-y-1"}>
                <Label className="font-semibold text-slate-700">
                  Số lượng xuất ({(materialDetail?.unit || "").toLowerCase()})
                </Label>
                <Input
                  type="number"
                  placeholder="Số lượng..."
                  value={stockOutForm.quantity || ""}
                  onChange={(e) =>
                    setStockOutForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))
                  }
                  className="rounded-md border-slate-200 h-9 text-xs font-mono font-bold focus-visible:ring-rose-500 text-rose-600"
                />
              </div>

              {!isEditMode && (
                <div className="col-span-1 space-y-1">
                  <Label className="font-semibold text-slate-700">Mã bài sản xuất</Label>
                  <Input
                    placeholder="Mã bài..."
                    value={stockOutForm.documentCode}
                    onChange={(e) =>
                      setStockOutForm((prev) => ({ ...prev, documentCode: e.target.value }))
                    }
                    className="rounded-md border-slate-200 h-9 text-xs font-mono focus-visible:ring-rose-500 text-rose-600"
                  />
                </div>
              )}
            </div>

            {/* Conditional fields based on purpose */}
            {stockOutForm.purpose === "return_vendor" && (
              <div className="space-y-2.5 border-t border-slate-100 pt-2.5">
                <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Thông tin trả hàng</h4>
                
                {/* Chọn Nhà Cung Cấp */}
                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">Nhà cung cấp nhận lại</Label>
                  <Select
                    value={stockOutForm.vendorId ? String(stockOutForm.vendorId) : ""}
                    onValueChange={(val) => setStockOutForm((prev) => ({ ...prev, vendorId: val ? parseInt(val, 10) : undefined }))}
                  >
                    <SelectTrigger className="rounded-md border-slate-200 h-9 text-xs cursor-pointer focus:ring-rose-500">
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {vendorsList.map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)} className="text-xs cursor-pointer">
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tên & Địa chỉ người nhận (Chia tỉ lệ 1:2 trên dòng ngang) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-1">
                    <Label className="font-semibold text-slate-700">Tên người nhận</Label>
                    <Input
                      placeholder="Người nhận..."
                      value={stockOutForm.receiverName || ""}
                      onChange={(e) =>
                        setStockOutForm((prev) => ({ ...prev, receiverName: e.target.value }))
                      }
                      className="rounded-md border-slate-200 h-9 text-xs focus-visible:ring-rose-500 text-rose-600"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <Label className="font-semibold text-slate-700">Địa chỉ nhận</Label>
                    <Input
                      placeholder="Địa chỉ..."
                      value={stockOutForm.receiverAddress || ""}
                      onChange={(e) =>
                        setStockOutForm((prev) => ({ ...prev, receiverAddress: e.target.value }))
                      }
                      className="rounded-md border-slate-200 h-9 text-xs focus-visible:ring-rose-500 text-rose-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ghi chú */}
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Diễn giải / Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú diễn giải..."
                value={stockOutForm.notes}
                onChange={(e) =>
                  setStockOutForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="rounded-md border-slate-200 text-xs min-h-[45px] focus-visible:ring-rose-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-md text-xs h-9 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-md text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none"
            >
              {isEditMode ? "Cập nhật" : "Lưu phiếu xuất"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
