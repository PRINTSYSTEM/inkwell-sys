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

import { useCreateMaterial } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const { mutate: createMaterial, isPending } = useCreateMaterial();

  const [formData, setFormData] = useState<{
    name: string;
    materialTypeId: number;
    length: number;
    width: number | undefined;
    height: number | undefined;
    unit: string;
    unitPrice: number | undefined;
    quantity: number | undefined;
  }>({
    name: "",
    materialTypeId: defaultMaterialTypeId || 0,
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
    setFormData((prev) => {
      const updated = { ...prev, name };
      if (parsed.length !== undefined) {
        updated.length = parsed.length;
      }
      if (parsed.width !== undefined) {
        updated.width = parsed.width === null ? undefined : parsed.width;
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    const finalMaterialTypeId = formData.materialTypeId || defaultMaterialTypeId || materialTypes[0]?.id || 1;

    if (!finalMaterialTypeId) {
      return;
    }

    createMaterial(
      {
        name: formData.name.trim(),
        materialTypeId: finalMaterialTypeId,
        length: formData.length,
        width: formData.width,
        height: undefined,
        quantity: showQuantity ? formData.quantity : 0,
        unit: formData.unit.trim() || undefined,
        unitPrice: formData.unitPrice,
      },
      {
        onSuccess: (newMaterial) => {
          onOpenChange(false);
          if (newMaterial.id) {
            onSuccess?.(newMaterial.id, newMaterial, formData.unit, formData.unitPrice);
          }
          // Reset form
          setFormData({
            name: "",
            materialTypeId: defaultMaterialTypeId || materialTypes[0]?.id || 0,
            length: 0,
            width: undefined,
            height: undefined,
            unit: "",
            unitPrice: undefined,
            quantity: undefined,
          });
        },
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
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên chất liệu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              className="bg-slate-50/50 font-medium"
              placeholder="Nhập tên chất liệu"
            />
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
              />
            </div>
            <div className="space-y-2">
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
              />
            </div>
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Đơn giá</Label>
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
                placeholder="0 (tùy chọn)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị tính (ĐVT)</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Ví dụ: Tờ, Cuộn, Cái..."
              />
            </div>
          </div>

          {showQuantity && (
            <div className="space-y-2">
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
              />
            </div>
          )}

          <DialogFooter className="pt-4">
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
              className={cn("cursor-pointer transition-colors duration-200", submitButtonClassName)}
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
