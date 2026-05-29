import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateMaterial } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { useActiveVendors } from "@/hooks/use-vendor";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MaterialResponse } from "@/Schema/material.schema";

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (
    materialId: number,
    material: MaterialResponse,
    unit?: string,
    unitPrice?: number
  ) => void;
  defaultMaterialTypeId?: number;
  showQuantity?: boolean;
  dimensionUnit?: string;
  submitButtonClassName?: string;
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultMaterialTypeId,
  showQuantity = false,
  dimensionUnit = "mm",
  submitButtonClassName,
}: CreateMaterialDialogProps) {
  const { data: materialTypesData } = useMaterialTypeList({ page: 1, size: 1000 });
  const materialTypes = materialTypesData?.items || [];

  // Fetch active vendors
  const { data: vendorsData, isLoading: isLoadingVendors } = useActiveVendors();

  const { mutate: createMaterial, isPending } = useCreateMaterial();

  const [formData, setFormData] = useState<{
    name: string;
    materialTypeId: number;
    type: "cuon" | "to" | "";
    vendorId: number | undefined;
    length: number;
    width: number | undefined;
    height: number | undefined;
    unit: string;
    unitPrice: number | undefined;
    quantity: number | undefined;
  }>({
    name: "",
    materialTypeId: defaultMaterialTypeId || 0,
    type: "",
    vendorId: undefined,
    length: 0,
    width: undefined,
    height: undefined,
    unit: "",
    unitPrice: undefined,
    quantity: undefined,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        materialTypeId: defaultMaterialTypeId || materialTypes[0]?.id || 0,
        type: "",
        vendorId: undefined,
        length: 0,
        width: undefined,
        height: undefined,
        unit: "",
        unitPrice: undefined,
        quantity: undefined,
      });
    }
  }, [open]);

  // Sync materialTypeId if materialTypes load or defaultMaterialTypeId changes
  useEffect(() => {
    if (open && materialTypes.length > 0 && !formData.materialTypeId) {
      setFormData((prev) => ({
        ...prev,
        materialTypeId: defaultMaterialTypeId || materialTypes[0]?.id || 0,
      }));
    }
  }, [open, materialTypes, defaultMaterialTypeId]);

  // Helper to parse dimensions from material name
  const parseDimensionsFromName = (name: string): { length?: number; width?: number | null } => {
    if (!name) return {};

    // Pattern 1: "Màng PE 64x53" -> length = 64, width = 53
    const crossMatch = name.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
    if (crossMatch) {
      return {
        length: parseFloat(crossMatch[1]),
        width: parseFloat(crossMatch[2]),
      };
    }

    // Pattern 2: "Cuộn PE khổ 64" -> length = 64, width = null
    const widthMatch = name.match(/(?:khổ|kho)\s*:?\s*(\d+(?:\.\d+)?)/i);
    if (widthMatch) {
      return {
        length: parseFloat(widthMatch[1]),
        width: null,
      };
    }

    return {};
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const parsed = parseDimensionsFromName(name);
    
    // Automatically guess type based on name to delight the user
    let guessedType: "cuon" | "to" | "" = "";
    const lowerName = name.toLowerCase();
    if (lowerName.includes("cuộn") || lowerName.includes("cuon")) {
      guessedType = "cuon";
    } else if (lowerName.includes("tờ") || lowerName.includes("to")) {
      guessedType = "to";
    }

    setFormData((prev) => {
      const updated = { ...prev, name };
      if (parsed.length !== undefined) {
        updated.length = parsed.length;
      }
      if (parsed.width !== undefined) {
        updated.width = parsed.width === null ? undefined : parsed.width;
      }
      if (guessedType) {
        updated.type = guessedType;
        updated.unit = guessedType === "cuon" ? "m dài" : "m^2";
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên chất liệu!");
      return;
    }

    if (!formData.type) {
      toast.error("Vui lòng chọn thể loại vật tư (Cuộn hoặc Tờ)!");
      return;
    }

    const finalMaterialTypeId = formData.materialTypeId || defaultMaterialTypeId || materialTypes[0]?.id || 1;

    createMaterial(
      {
        name: formData.name.trim(),
        type: formData.type as "cuon" | "to",
        length: formData.length,
        width: formData.width,
        unit: formData.unit.trim() || undefined,
        unitPrice: formData.unitPrice || 0,
        vendorId: formData.vendorId || undefined,
      },
      {
        onSuccess: (newMaterial) => {
          toast.success("Tạo chất liệu mới thành công!");
          onOpenChange(false);
          if (newMaterial.id) {
            onSuccess?.(newMaterial.id, newMaterial, formData.unit, formData.unitPrice);
          }
          // Reset form
          setFormData({
            name: "",
            materialTypeId: defaultMaterialTypeId || materialTypes[0]?.id || 0,
            type: "",
            vendorId: undefined,
            length: 0,
            width: undefined,
            height: undefined,
            unit: "",
            unitPrice: undefined,
            quantity: undefined,
          });
        },
        onError: (err) => {
          const errMsg = err.response?.data?.message || err.message || "Không thể tạo vật tư mới.";
          toast.error(`Lỗi: ${errMsg}`);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo chất liệu mới</DialogTitle>
          <DialogDescription>
            Tạo chất liệu mới để sử dụng trong hệ thống
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tên chất liệu */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Tên chất liệu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              className="bg-slate-50/50 font-medium focus-visible:ring-[#93631F]"
              placeholder="Nhập tên chất liệu (ví dụ: Decal cuộn 65x40)"
            />
          </div>

          {/* Thể loại (Cuộn/Tờ) & Nhà cung cấp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">
                Thể loại vật tư <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val: "cuon" | "to") =>
                  setFormData({
                    ...formData,
                    type: val,
                    unit: val === "cuon" ? "m dài" : "m^2",
                  })
                }
              >
                <SelectTrigger id="type" className="bg-slate-50/50 cursor-pointer">
                  <SelectValue placeholder="Chọn thể loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cuon">Dạng cuộn (cuon)</SelectItem>
                  <SelectItem value="to">Dạng tờ (to)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendorId">Nhà cung cấp</Label>
              <Select
                value={formData.vendorId ? String(formData.vendorId) : "none"}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    vendorId: val === "none" ? undefined : Number(val),
                  })
                }
              >
                <SelectTrigger id="vendorId" className="bg-slate-50/50 cursor-pointer">
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không gán (Trống)</SelectItem>
                  {isLoadingVendors ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#93631F]" />
                    </div>
                  ) : (
                    vendorsData?.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        {vendor.name || vendor.code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kích thước */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="length">
                Chiều dài ({dimensionUnit}) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="length"
                type="number"
                min="0"
                step="0.01"
                value={formData.length || ""}
                onChange={(e) =>
                  setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="focus-visible:ring-[#93631F]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="width">Chiều rộng ({dimensionUnit})</Label>
              <Input
                id="width"
                type="number"
                min="0"
                step="0.01"
                value={formData.width ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    width: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0 (tùy chọn)"
                className="focus-visible:ring-[#93631F]"
              />
            </div>
          </div>

          {/* Đơn giá & Đơn vị tính */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="unitPrice">Đơn giá (VND) <span className="text-red-500">*</span></Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="0"
                className="focus-visible:ring-[#93631F]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Đơn vị tính (ĐVT)</Label>
              <Input
                id="unit"
                value={formData.unit}
                disabled
                placeholder="ĐVT tự động gán theo thể loại"
                className="bg-slate-100 font-semibold cursor-not-allowed text-slate-700"
              />
            </div>
          </div>

          {/* Số lượng tồn kho (nếu bật) */}
          {showQuantity && (
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Số lượng tồn kho có sẵn</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: e.target.value === "" ? undefined : parseInt(e.target.value, 10) ?? undefined,
                  })
                }
                placeholder="0 (tùy chọn)"
                className="focus-visible:ring-[#93631F]"
              />
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={cn("cursor-pointer transition-colors duration-200 bg-[#93631F] hover:bg-[#7a521a] text-white border-none", submitButtonClassName)}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Đang tạo..." : "Tạo chất liệu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
