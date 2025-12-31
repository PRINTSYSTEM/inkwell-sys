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
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ZodError } from "zod";
import { CreateUserRequest, CreateUserRequestSchema } from "@/Schema";
import { ROLE_LABELS as RoleLabels } from "@/constants/role.constant";
import { useCreateUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeeCreate() {
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "EmployeeCreate.tsx:32",
      message: "EmployeeCreate component mounted",
      data: { pathname: window.location.pathname },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  const navigate = useNavigate();
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

  const { mutateAsync: createUser, isPending, isSuccess } = useCreateUser();

  const handleInput = (
    field: keyof CreateUserRequest,
    value: string | null
  ) => {
    setForm((p) => ({ ...p, [field]: value || "" }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      CreateUserRequestSchema.parse(form);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          if (path) {
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);
        // Scroll to first error
        const firstErrorField = Object.keys(newErrors)[0];
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    try {
      // Prepare form data - convert empty strings to undefined for optional fields
      const formData: CreateUserRequest = {
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      };

      await createUser(formData);
      setTimeout(() => navigate("/admin/users"), 2000);
    } catch (error) {
      // Error is already handled by the mutation hook
      console.error("Error creating user:", error);
    }
  };

  if (isSuccess)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <div className="text-center space-y-4 animate-fadeInUp">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
            <CheckCircle2 className="relative h-24 w-24 text-accent mx-auto animate-scaleIn" />
          </div>
          <h2 className="text-3xl font-semibold text-balance">
            Nhân viên đã được tạo thành công!
          </h2>
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/users")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Thêm nhân viên mới
            </h1>
            <p className="text-muted-foreground mt-1">
              Tạo tài khoản mới cho nhân viên
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => handleInput("username", e.target.value)}
                  placeholder="Nhập username"
                  className={errors.username ? "border-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Username sẽ không thể thay đổi sau khi tạo
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mật khẩu <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => handleInput("password", e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    className={errors.password ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => handleInput("fullName", e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Vai trò <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => handleInput("role", value)}
                >
                  <SelectTrigger
                    className={errors.role ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RoleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => handleInput("email", e.target.value)}
                    placeholder="Nhập email (tùy chọn)"
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={form.phone || ""}
                    onChange={(e) => handleInput("phone", e.target.value)}
                    placeholder="Nhập số điện thoại (tùy chọn)"
                    className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/users")}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Tạo nhân viên
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
