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
import { toast } from "sonner";
import type { CreateDesignTypeRequest, DesignTypeResponse } from "@/Schema";

interface DesignTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designType?: DesignTypeResponse | null;
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
        deliverySlaDays: designType.deliverySlaDays ?? undefined,
        deliveryWarningBeforeHours: designType.deliveryWarningBeforeHours ?? undefined,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        displayOrder: 1,
        description: "",
        status: "active",
        deliverySlaDays: 3,
        deliveryWarningBeforeHours: 12,
      });
    }
  }, [designType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const slaDays = formData.deliverySlaDays;
    const warningHours = formData.deliveryWarningBeforeHours;

    if ((slaDays != null && warningHours == null) || (slaDays == null && warningHours != null)) {
      toast.error("Vui lòng nhập đầy đủ cả SLA giao hàng và Cảnh báo trước giờ");
      return;
    }

    if (slaDays != null && warningHours != null) {
      if (slaDays < 1 || slaDays > 365) {
        toast.error("SLA giao hàng phải từ 1 đến 365 ngày");
        return;
      }
      if (warningHours <= 0) {
        toast.error("Thời gian cảnh báo trước phải lớn hơn 0 giờ");
        return;
      }
      if (warningHours >= slaDays * 24) {
        toast.error(`Thời gian cảnh báo (${warningHours}h) phải nhỏ hơn SLA giao hàng (${slaDays * 24}h)`);
        return;
      }
    }

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliverySlaDays">SLA giao hàng (ngày)</Label>
              <Input
                id="deliverySlaDays"
                type="number"
                min={1}
                max={365}
                value={formData.deliverySlaDays ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliverySlaDays: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Ví dụ: 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryWarningBeforeHours">Cảnh báo trước (giờ)</Label>
              <Input
                id="deliveryWarningBeforeHours"
                type="number"
                min={1}
                value={formData.deliveryWarningBeforeHours ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryWarningBeforeHours: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Ví dụ: 12"
              />
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
