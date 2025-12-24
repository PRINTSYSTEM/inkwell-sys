import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useUser, useUpdateUser, useChangeUserPassword } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ZodError } from "zod";
import {
  UserResponse,
  UpdateUserRequestSchema,
  UpdateUserRequest,
} from "@/Schema";
import { ROLE_LABELS as RoleLabels } from "@/constants/role.constant";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserResponse>>({});
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const userId = parseInt(id || "0");
  const { data, isLoading, error } = useUser(userId, !!id);
  const { mutateAsync: updateUser, isPending } = useUpdateUser();
  const { mutate: changePassword, loading: changingPassword } =
    useChangeUserPassword();

  useEffect(() => {
    if (isLoading) return;
    if (error) {
      toast.error("Lỗi khi tải thông tin nhân viên");
      navigate("/manager/employees");
      return;
    }
    if (data) {
      setUser(data);
      setEditForm(data);
    }
  }, [isLoading, error, data, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(user || {});
  };

  const handleSave = async () => {
    if (!editForm || !editForm.id) return;

    try {
      // Prepare update data
      const updateData: Partial<UpdateUserRequest> = {};
      if (editForm.fullName !== user?.fullName)
        updateData.fullName = editForm.fullName;
      if (editForm.role !== user?.role) updateData.role = editForm.role;
      if (editForm.email !== user?.email) updateData.email = editForm.email;
      if (editForm.phone !== user?.phone) updateData.phone = editForm.phone;
      if (editForm.isActive !== user?.isActive)
        updateData.isActive = editForm.isActive;

      // Validate data using Zod schema
      UpdateUserRequestSchema.parse(updateData);

      // Use updateUser hook
      await updateUser({
        id: editForm.id,
        data: updateData,
      });

      setIsEditing(false);
      setUser(editForm as UserResponse);
    } catch (error) {
      console.error("Error updating user:", error);

      if (error instanceof ZodError) {
        const validationErrors = error.errors
          .map((err) => err.message)
          .join(", ");
        toast.error(`Dữ liệu không hợp lệ: ${validationErrors}`);
      } else if (error instanceof Error) {
        toast.error(`Lỗi khi cập nhật nhân viên: ${error.message}`);
      } else {
        toast.error("Lỗi không xác định khi cập nhật nhân viên");
      }
    }
  };

  const handleInputChange = (
    field: keyof UserResponse,
    value: string | boolean | undefined
  ) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      await changePassword({
        id: userId,
        data: {
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        },
      });
      setChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/manager/employees")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Đang tải thông tin nhân viên...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/manager/employees")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Không tìm thấy nhân viên</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/manager/employees")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Chi tiết nhân viên
            </h1>
            <p className="text-muted-foreground mt-1">
              Thông tin và quản lý tài khoản
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
                disabled={isPending}
              >
                <X className="h-4 w-4" />
                Hủy
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lưu
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setChangePasswordDialog(true)}
                className="gap-2"
              >
                Đổi mật khẩu
              </Button>
              <Button onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin nhân viên
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={user.username || ""}
                    disabled={true}
                    className="font-mono bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username không thể thay đổi
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên *</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={editForm.fullName || ""}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <Input
                      id="fullName"
                      value={user.fullName || "-"}
                      disabled={true}
                      className="bg-muted"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò *</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.role || ""}
                      onValueChange={(value) => handleInputChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RoleLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        <Shield className="h-3 w-3 mr-1" />
                        {RoleLabels[user.role || ""] || user.role || "-"}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Nhập email"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {user.email ? (
                        <>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editForm.phone || ""}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {user.phone ? (
                        <>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{user.phone}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Trạng thái</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={editForm.isActive ?? true}
                        onCheckedChange={(checked) =>
                          handleInputChange("isActive", checked)
                        }
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        {editForm.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </Label>
                    </div>
                  ) : (
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Vô hiệu hóa
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thông tin khác
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Ngày tạo</Label>
                <p className="text-sm">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Cập nhật lần cuối</Label>
                <p className="text-sm">
                  {user.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onOpenChange={setChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu mới cho nhân viên {user.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <p className="text-xs text-muted-foreground">
                Nhập mật khẩu của bạn (admin) để xác nhận
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordDialog(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={changingPassword}
            >
              Hủy
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Đổi mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

