import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Package } from "lucide-react";
import { CreateMaterialTypeRequest, MaterialTypeResponse } from "@/Schema";

interface MaterialTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designTypeId: number;
  editingMaterial: MaterialTypeResponse | null;
  onSubmit: (material: CreateMaterialTypeRequest) => void;
}

// State nội bộ: price & pricePerCm2 giữ dạng string cho dễ nhập
type MaterialFormState = {
  code: string;
  name: string;
  displayOrder: number;
  description: string;
  price: string;
  pricePerCm2: string;
  minimumQuantity: string;
  status: "active" | "inactive";
};

export function MaterialTypeFormDialog({
  open,
  onOpenChange,
  designTypeId,
  editingMaterial,
  onSubmit,
}: MaterialTypeFormDialogProps) {
  const [formData, setFormData] = useState<MaterialFormState>({
    code: "",
    name: "",
    displayOrder: 1,
    description: "",
    price: "",
    pricePerCm2: "",
    minimumQuantity: "",
    status: "active",
  });

  useEffect(() => {
    if (editingMaterial) {
      setFormData({
        code: editingMaterial.code,
        name: editingMaterial.name,
        displayOrder: editingMaterial.displayOrder,
        description: editingMaterial.description ?? "",
        price:
          editingMaterial.price != null ? String(editingMaterial.price) : "",
        pricePerCm2:
          editingMaterial.pricePerCm2 != null
            ? String(editingMaterial.pricePerCm2)
            : "",
        minimumQuantity:
          editingMaterial.minimumQuantity != null
            ? String(editingMaterial.minimumQuantity)
            : "",
        status: editingMaterial.status as "active" | "inactive",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        displayOrder: 1,
        description: "",
        price: "",
        pricePerCm2: "",
        minimumQuantity: "",
        status: "active",
      });
    }
  }, [editingMaterial, designTypeId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert string -> number an toàn
    const priceNumber =
      formData.price.trim() === "" ? 0 : Number(formData.price);
    const pricePerCm2Number =
      formData.pricePerCm2.trim() === "" ? 0 : Number(formData.pricePerCm2);
    const minimumQuantityNumber =
      formData.minimumQuantity.trim() === ""
        ? undefined
        : Number(formData.minimumQuantity);

    // Nếu muốn bắt buộc > 0 thì check kỹ:
    // if (!priceNumber || !pricePerCm2Number) { ... } // chú ý: 0 là falsy

    const payload: CreateMaterialTypeRequest = {
      code: formData.code,
      name: formData.name,
      displayOrder: formData.displayOrder,
      description: formData.description,
      price: priceNumber,
      pricePerCm2: pricePerCm2Number,
      minimumQuantity: minimumQuantityNumber,
      designTypeId, // luôn gắn từ props
      status: formData.status,
    };

    // Debug nếu cần
    // console.log("Submitting material payload:", payload);

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>
                {editingMaterial ? "Chỉnh sửa chất liệu" : "Thêm chất liệu mới"}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? "Cập nhật thông tin chất liệu"
                  : "Điền thông tin để tạo chất liệu mới"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Mã chất liệu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="VD: PP-001"
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên chất liệu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="VD: Giấy PP 150g"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Mô tả chi tiết về chất liệu..."
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Thông tin giá
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Giá cố định <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    // step="1000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="0"
                    required
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    đ
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Giá cố định áp dụng cho đơn vị sản phẩm
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerCm2">
                  Giá theo diện tích <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="pricePerCm2"
                    type="number"
                    min="0"
                    // step="10"
                    value={formData.pricePerCm2}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerCm2: e.target.value,
                      }))
                    }
                    placeholder="0"
                    required
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    đ/cm²
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Giá tính theo diện tích cm²
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumQuantity">Số lượng tối thiểu</Label>
              <Input
                id="minimumQuantity"
                type="number"
                min="0"
                value={formData.minimumQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumQuantity: e.target.value,
                  }))
                }
                placeholder="0"
                className="pr-12"
              />
              <p className="text-xs text-muted-foreground">
                Số lượng tối thiểu khi đặt hàng với chất liệu này (để trống nếu
                không giới hạn)
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Cài đặt
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">
                  Thứ tự hiển thị <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayOrder: Number(e.target.value) || 1,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">
                  Trạng thái <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1">
              {editingMaterial ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
