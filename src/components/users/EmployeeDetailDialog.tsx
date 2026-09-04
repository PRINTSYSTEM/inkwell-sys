import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  Save,
  X,
  Lock,
  Calendar,
} from "lucide-react";
import { useUser, useUpdateUser, useResetPassword } from "@/hooks/use-user";
import { toast } from "sonner";
import { ZodError } from "zod";
import {
  UserResponse,
  UpdateUserRequestSchema,
  UpdateUserRequest,
  type UserRole,
} from "@/Schema";
import { ROLE_LABELS as RoleLabels } from "@/constants/role.constant";
import { cn } from "@/lib/utils";

interface EmployeeDetailDialogProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEditing?: boolean;
  onUserUpdated?: () => void;
}

const getRoleBadgeStyle = (role?: string) => {
  const r = role?.toLowerCase() || "";
  if (r.includes("admin")) return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
  if (r.includes("manager")) return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
  if (r.includes("design")) return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
  if (r.includes("kcs")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (r.includes("printer") || r.includes("production")) return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300";
  if (r.includes("accounting")) return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
  if (r.includes("warehouse")) return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
};

export function EmployeeDetailDialog({
  userId,
  open,
  onOpenChange,
  initialEditing = false,
  onUserUpdated,
}: EmployeeDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [editForm, setEditForm] = useState<Partial<UserResponse>>({});

  // Reset password inline sub-state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { data: user, isLoading } = useUser(userId, open && !!userId);
  const { mutateAsync: updateUser, isPending: saving } = useUpdateUser();
  const { mutate: adminResetPassword, loading: resettingPassword } = useResetPassword();

  useEffect(() => {
    setIsEditing(initialEditing);
  }, [initialEditing, open]);

  useEffect(() => {
    if (user) {
      setEditForm(user);
    }
  }, [user]);

  const handleInputChange = (field: keyof UserResponse, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !user.id) return;

    try {
      const updateData: Partial<UpdateUserRequest> = {};
      if (editForm.fullName !== user.fullName) updateData.fullName = editForm.fullName;
      if (editForm.role !== user.role) updateData.role = editForm.role as UserRole;
      if (editForm.email !== user.email) updateData.email = editForm.email?.trim() || null;
      if (editForm.phone !== user.phone) updateData.phone = editForm.phone?.trim() || null;
      if (editForm.isActive !== user.isActive) updateData.isActive = editForm.isActive;

      UpdateUserRequestSchema.parse(updateData);

      await updateUser({
        id: user.id,
        data: updateData,
      });

      toast.success("Cập nhật thông tin nhân viên thành công");
      setIsEditing(false);
      onUserUpdated?.();
    } catch (err) {
      if (err instanceof ZodError) {
        const validationErrors = err.errors.map((e) => e.message).join(", ");
        toast.error(`Dữ liệu không hợp lệ: ${validationErrors}`);
      } else {
        toast.error("Không thể cập nhật nhân viên");
      }
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!user || !user.id) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await adminResetPassword({
        id: user.id,
        data: { newPassword },
      } as any);
      setResetPasswordOpen(false);
      setNewPassword("");
    } catch {
      // Toast error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
              <User className="h-5 w-5 text-[#93631F]" />
              Chi Tiết Nhân Viên
            </DialogTitle>

            {user && (
              <Badge
                className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                  user.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {user.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#93631F]" />
            <span>Đang tải thông tin nhân viên...</span>
          </div>
        ) : !user ? (
          <div className="py-8 text-center text-slate-500">
            Không tìm thấy thông tin nhân viên
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Header User Card */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-[#93631F]/10 text-[#93631F] flex items-center justify-center font-bold text-base border border-[#93631F]/20">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {user.fullName || user.username}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                  <span className="font-mono text-[11px] font-medium bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    @{user.username}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-bold px-2 py-0.2 rounded border", getRoleBadgeStyle(user.role))}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {RoleLabels[user.role || ""] || user.role || "—"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Editable or View Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Full Name */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Họ và tên</Label>
                {isEditing ? (
                  <Input
                    value={editForm.fullName || ""}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="h-8.5 text-xs"
                  />
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 font-semibold text-slate-800 dark:text-slate-200">
                    {user.fullName || "—"}
                  </div>
                )}
              </div>

              {/* Username (read-only) */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Username</Label>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {user.username}
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Vai trò / Chức vụ</Label>
                {isEditing ? (
                  <Select
                    value={editForm.role || ""}
                    onValueChange={(val) => handleInputChange("role", val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {Object.entries(RoleLabels).map(([k, label]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#93631F]" />
                    <span>{RoleLabels[user.role || ""] || user.role || "—"}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@domain.com"
                    className="h-8.5 text-xs"
                  />
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.email || "—"}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Số điện thoại</Label>
                {isEditing ? (
                  <Input
                    value={editForm.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="0912345678"
                    className="h-8.5 text-xs font-mono"
                  />
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.phone || "—"}</span>
                  </div>
                )}
              </div>

              {/* Status Switch (when editing) */}
              {isEditing && (
                <div className="space-y-1 md:col-span-2 pt-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trạng thái tài khoản</Label>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                    <Switch
                      checked={editForm.isActive ?? true}
                      onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                    />
                    <span className="font-semibold text-xs text-slate-700">
                      {editForm.isActive ? "Đang hoạt động" : "Vô hiệu hóa tài khoản"}
                    </span>
                  </div>
                </div>
              )}

              {/* Additional Metadata */}
              {!isEditing && (
                <div className="md:col-span-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Ngày tạo: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}</span>
                  </div>
                  <div>
                    <span>Cập nhật: {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("vi-VN") : "—"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Password Inline Form */}
            {resetPasswordOpen && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2.5 mt-3">
                <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Reset Mật Khẩu (Admin)
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-amber-700 hover:text-amber-900"
                    onClick={() => setResetPasswordOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                  <Button
                    size="sm"
                    onClick={handleConfirmResetPassword}
                    disabled={resettingPassword}
                    className="h-8 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shrink-0 px-3"
                  >
                    {resettingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Xác nhận"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(user || {});
                }}
                disabled={saving}
                className="h-8 text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-8 text-xs font-bold bg-[#93631F] hover:bg-[#7a521a] text-white"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Lưu thay đổi
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetPasswordOpen(true)}
                className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Reset mật khẩu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Chỉnh sửa
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs"
              >
                Đóng
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
