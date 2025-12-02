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
import type { CreateDesignTypeRequest, DesignTypeEntity } from "@/Schema";

interface DesignTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designType?: DesignTypeEntity | null;
  onSubmit: (data: CreateDesignTypeRequest) => void;
}

export function DesignTypeFormDialog({
  open,
  onOpenChange,
  designType,
  onSubmit,
}: DesignTypeFormDialogProps) {
  const [formData, setFormData] = useState<CreateDesignTypeRequest>({
    code: "",
    name: "",
    displayOrder: 1,
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (designType) {
      setFormData({
        code: designType.code,
        name: designType.name,
        displayOrder: designType.displayOrder,
        description: designType.description,
        status: designType.status as "active" | "inactive",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        displayOrder: 1,
        description: "",
        status: "active",
      });
    }
  }, [designType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {designType ? "Chỉnh sửa loại thiết kế" : "Thêm loại thiết kế mới"}
          </DialogTitle>
          <DialogDescription>
            {designType
              ? "Cập nhật thông tin loại thiết kế"
              : "Tạo loại thiết kế mới trong hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã loại thiết kế <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Ví dụ: CARD"
                required
                disabled={!!designType}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên loại thiết kế <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ví dụ: Card visit"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">
                Thứ tự hiển thị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: Number(e.target.value),
                  })
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
                  setFormData({ ...formData, status: value })
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

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Nhập mô tả cho loại thiết kế..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {designType ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
