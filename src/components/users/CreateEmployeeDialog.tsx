import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  UserPlus,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  User,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { CreateUserRequest, CreateUserRequestSchema } from "@/Schema";
import { ROLE_LABELS as RoleLabels } from "@/constants/role.constant";
import { useCreateUser } from "@/hooks/use-user";
import { ZodError } from "zod";

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateEmployeeDialogProps) {
  const [form, setForm] = useState<CreateUserRequest>({
    username: "",
    password: "",
    fullName: "",
    role: "design",
    email: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutateAsync: createUser, isPending } = useCreateUser();

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      fullName: "",
      role: "design",
      email: "",
      phone: "",
    });
    setErrors({});
    setShowPassword(false);
  };

  const handleInput = (field: keyof CreateUserRequest, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value || "" }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      CreateUserRequestSchema.parse(form);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path[0] as string;
          if (path) newErrors[path] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    try {
      const formData: CreateUserRequest = {
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      };

      await createUser(formData);
      toast.success("Tạo nhân viên thành công");
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch {
      // Handled by hook toast
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
            <UserPlus className="h-5 w-5 text-[#93631F]" />
            Thêm nhân viên mới
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Tạo tài khoản mới cho nhân viên và phân quyền truy cập hệ thống
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Username */}
            <div className="space-y-1">
              <Label htmlFor="create-username" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Username <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="create-username"
                  value={form.username}
                  onChange={(e) => handleInput("username", e.target.value)}
                  placeholder="Nhập username"
                  className={`pl-8 h-8.5 text-xs font-mono ${errors.username ? "border-rose-500" : ""}`}
                />
              </div>
              {errors.username && (
                <p className="text-[11px] text-rose-500">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="create-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mật khẩu <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleInput("password", e.target.value)}
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                  className={`pl-8 pr-8 h-8.5 text-xs ${errors.password ? "border-rose-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500">{errors.password}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-fullName" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Họ và tên <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="create-fullName"
                value={form.fullName}
                onChange={(e) => handleInput("fullName", e.target.value)}
                placeholder="Nhập họ và tên đầy đủ..."
                className={`h-8.5 text-xs ${errors.fullName ? "border-rose-500" : ""}`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-500">{errors.fullName}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="create-role" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Vai trò / Chức vụ <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.role}
                onValueChange={(value) => handleInput("role", value)}
              >
                <SelectTrigger className={`h-8.5 text-xs ${errors.role ? "border-rose-500" : ""}`}>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {Object.entries(RoleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-[#93631F]" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-[11px] text-rose-500">{errors.role}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="create-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="create-email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => handleInput("email", e.target.value)}
                  placeholder="email@domain.com"
                  className={`pl-8 h-8.5 text-xs ${errors.email ? "border-rose-500" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="create-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="create-phone"
                  value={form.phone || ""}
                  onChange={(e) => handleInput("phone", e.target.value)}
                  placeholder="0912345678"
                  className={`pl-8 h-8.5 text-xs font-mono ${errors.phone ? "border-rose-500" : ""}`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-500">{errors.phone}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isPending}
              className="h-8 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 text-xs font-bold bg-[#93631F] hover:bg-[#7a521a] text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo nhân viên"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
