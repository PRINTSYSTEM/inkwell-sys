import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { UserResponse, CreateUserRequest, UpdateUserRequest } from "@/Schema";

interface DesignerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer?: UserResponse | null;
  onSuccess: () => void;
  onSubmit: (
    data: CreateUserRequest | { id: number; data: UpdateUserRequest }
  ) => Promise<UserResponse>;
}

export function DesignerFormDialog({
  open,
  onOpenChange,
  designer,
  onSuccess,
  onSubmit,
}: DesignerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "design",
    email: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    if (designer) {
      setFormData({
        username: designer.username,
        password: "",
        fullName: designer.fullName,
        role: "design", // Luôn là design trong màn hình này
        email: designer.email,
        phone: designer.phone,
        isActive: designer.isActive,
      });
    } else {
      setFormData({
        username: "",
        password: "",
        fullName: "",
        role: "design",
        email: "",
        phone: "",
        isActive: true,
      });
    }
  }, [designer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (designer) {
        const updateData: UpdateUserRequest = {
          fullName: formData.fullName,
          role: formData.role as UpdateUserRequest["role"],
          email: formData.email,
          phone: formData.phone,
          isActive: formData.isActive,
        };
        await onSubmit({ id: designer.id as number, data: updateData });
      } else {
        const createData: CreateUserRequest = {
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role as CreateUserRequest["role"],
          email: formData.email,
          phone: formData.phone,
        };
        await onSubmit(createData);
      }

      toast.success(designer ? "Cập nhật thành công" : "Thêm mới thành công", {
        description: designer
          ? `Đã cập nhật thông tin nhân viên ${formData.fullName}`
          : `Đã thêm nhân viên ${formData.fullName}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Lỗi", {
        description: designer
          ? "Không thể cập nhật nhân viên"
          : "Không thể thêm nhân viên mới",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {designer ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
          </DialogTitle>
          <DialogDescription>
            {designer
              ? "Cập nhật thông tin nhân viên thiết kế"
              : "Nhập thông tin nhân viên thiết kế mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!designer && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="designer01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="designer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0123456789"
                required
              />
            </div>

            {designer && (
              <div className="space-y-2">
                <Label htmlFor="isActive">Trạng thái</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isActive: value === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Đang lưu..."
                : designer
                  ? "Cập nhật"
                  : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
