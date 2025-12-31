import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useMyProfile,
  useUpdateMyProfile,
  useChangeUserPassword,
} from "@/hooks/use-user";
import { useFormValidation } from "@/hooks/use-form-validation";
import { z } from "@/Schema";

const ProfileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Họ và tên không được để trống")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .max(255, "Email tối đa 255 ký tự"),
  phone: z
    .string()
    .trim()
    .max(20, "Số điện thoại tối đa 20 ký tự")
    .optional()
    .or(z.literal("")),
});

const roleNames: Record<string, string> = {
  admin: "Quản trị viên",
  production_manager: "Trưởng sản xuất",
  accountant: "Kế toán",
  designer: "Thiết kế",
  prepress: "Bình bài",
  operator: "Vận hành",
};

export default function Profile() {
  const navigate = useNavigate();

  const { data: me, isLoading, isError, refetch } = useMyProfile();

  const { mutate: updateMyProfile, loading: isUpdatingProfile } =
    useUpdateMyProfile();

  const { mutate: changeUserPassword, loading: isChangingPassword } =
    useChangeUserPassword();

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Đồng bộ dữ liệu profile vào form khi API trả về
  useEffect(() => {
    if (me) {
      setProfileForm({
        fullName: me.fullName ?? "",
        email: me.email ?? "",
        phone: me.phone ?? "",
      });
    }
  }, [me]);

  const handleProfileChange = (
    field: keyof typeof profileForm,
    value: string
  ) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const {
    errors,
    touched,
    validateAndParse,
    touchField,
    getError,
    scrollToFirstError,
  } = useFormValidation<typeof ProfileFormSchema>(ProfileFormSchema);

  const handleSaveProfile = async () => {
    if (!me) return;

    const parsed = validateAndParse(profileForm, true);
    if (!parsed) {
      toast.error("Lỗi", {
        description: "Vui lòng kiểm tra lại các trường bị lỗi",
      });
      scrollToFirstError();
      return;
    }

    try {
      await updateMyProfile({
        fullName: parsed.fullName.trim(),
        email: parsed.email.trim(),
        phone: parsed.phone?.toString().trim() || undefined,
      } as any);
    } catch {
      // Toast thành công/thất bại đã được xử lý trong hook useUpdateMyProfile
    }
  };

  const handleChangePassword = async () => {
    if (!me) return;

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Lỗi", {
        description: "Vui lòng điền đầy đủ thông tin mật khẩu",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Lỗi", {
        description: "Mật khẩu mới không khớp",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Lỗi", {
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
      return;
    }

    try {
      await changeUserPassword({
        id: me.id,
        data: {
          currentPassword,
          newPassword,
          confirmPassword,
        },
      } as any);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordDialogOpen(false);
    } catch {
      // Toast lỗi đã được hook xử lý
    }
  };

  const getRoleLabel = (role?: string | null) => {
    if (!role) return "Chưa xác định";
    return roleNames[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  if (isError || !me) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground">
          Không thể tải thông tin người dùng.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
          <Button onClick={() => navigate("/login")}>Đăng nhập lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>
          <p className="text-muted-foreground">
            Xem và cập nhật thông tin tài khoản của bạn
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Thông tin tóm tắt */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {me.fullName?.charAt(0) || me.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{me.fullName || "Chưa có họ tên"}</CardTitle>
            <CardDescription>{getRoleLabel(me.role)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{me.email}</span>
            </div>
            {me.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{me.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Tham gia:{" "}
                {new Date(me.createdAt ?? new Date()).toLocaleDateString(
                  "vi-VN"
                )}
              </span>
            </div>
            {me.role && (
              <div className="pt-2">
                <Badge>{getRoleLabel(me.role)}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form chỉnh sửa + đổi mật khẩu */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Chỉnh sửa thông tin</CardTitle>
            <CardDescription>
              Cập nhật thông tin cá nhân và mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên *</Label>
                <Input
                  id="fullName"
                  value={profileForm.fullName}
                  onChange={(e) =>
                    handleProfileChange("fullName", e.target.value)
                  }
                  onBlur={() => touchField("fullName")}
                  placeholder="Nhập họ và tên"
                />
                {touched.fullName && getError("fullName") && (
                  <p className="text-sm text-destructive mt-1">
                    {getError("fullName")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  onBlur={() => touchField("email")}
                  placeholder="Nhập email"
                />
                {touched.email && getError("email") && (
                  <p className="text-sm text-destructive mt-1">
                    {getError("email")}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  onBlur={() => touchField("phone")}
                  placeholder="Nhập số điện thoại"
                />
                {touched.phone && getError("phone") && (
                  <p className="text-sm text-destructive mt-1">
                    {getError("phone")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Input
                  value={getRoleLabel(me.role)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <Separator />

            {/* Hành động */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isUpdatingProfile}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>

                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={setIsPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Đổi mật khẩu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Đổi mật khẩu</DialogTitle>
                      <DialogDescription>
                        Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Mật khẩu hiện tại *</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                currentPassword: e.target.value,
                              }))
                            }
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                current: !prev.current,
                              }))
                            }
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mật khẩu mới *</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            placeholder="Nhập mật khẩu mới"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                new: !prev.new,
                              }))
                            }
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Nhập lại mật khẩu mới *</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            placeholder="Nhập lại mật khẩu mới"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                confirm: !prev.confirm,
                              }))
                            }
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsPasswordDialogOpen(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword
                          ? "Đang đổi mật khẩu..."
                          : "Xác nhận"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Button variant="ghost" onClick={() => navigate(-1)}>
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
