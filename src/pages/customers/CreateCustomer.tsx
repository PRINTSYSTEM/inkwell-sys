import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCustomer } from "@/hooks";
import { CreateCustomerRequest, CreateCustomerRequestSchema } from "@/Schema";
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  Phone,
  MapPin,
  CreditCard,
  Hash,
  Briefcase,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCustomerRequest>({
    name: "",
    companyName: "",
    representativeName: "",
    taxCode: "",
    phone: "",
    address: "",
    type: "company",
    maxDebt: 50000000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [generatedCode, setGeneratedCode] = useState("");
  const {
    mutateAsync: createCustomer,
    isPending,
    isSuccess,
  } = useCreateCustomer();
  const generateShortName = (full: string) => {
    const arr = full.trim().split(" ");
    const last2 = arr.slice(-2);
    return last2.map((w) => w[0]?.toUpperCase() || "").join("");
  };

  const generatePreviewCode = (name: string) =>
    name.trim() ? `XXXX${generateShortName(name)}` : "";

  const handleInput = (
    field: keyof CreateCustomerRequest,
    value: string | number | null
  ) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
    if (field === "representativeName")
      setGeneratedCode(generatePreviewCode(String(value ?? "")));
  };

  const validateForm = () => {
    try {
      CreateCustomerRequestSchema.safeParse(form);
      setErrors({});
      return true;
    } catch (error: unknown) {
      const validationErrors: Record<string, string> = {};
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const field = err.path[0];
          if (field && typeof field === "string") {
            validationErrors[field] = err.message;
          }
        });
      }
      setErrors(validationErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      const payload = CreateCustomerRequestSchema.parse({
        ...form,
        maxDebt: Number(form.maxDebt) || 0,
      });
      await createCustomer(payload);
      setTimeout(() => navigate("/customers"), 2000);
    } catch {
      toast.error("Dữ liệu không hợp lệ");
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
            Khách hàng đã được tạo thành công!
          </h2>
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/5">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/customers")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-balance">
                Thêm khách hàng mới
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Điền thông tin để tạo hồ sơ khách hàng
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-accent hidden sm:block" />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Thông tin cơ bản</h2>
                    <p className="text-sm text-muted-foreground">
                      Thông tin chính của khách hàng
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Tên khách hàng <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nhập tên khách hàng"
                    value={form.name}
                    onChange={(e) => handleInput("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="representativeName"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Tên người đại diện{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="representativeName"
                    placeholder="Nhập tên người đại diện"
                    value={form.representativeName || ""}
                    onChange={(e) =>
                      handleInput("representativeName", e.target.value)
                    }
                    className={
                      errors.representativeName ? "border-destructive" : ""
                    }
                  />
                  {errors.representativeName && (
                    <p className="text-sm text-destructive">
                      {errors.representativeName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Tên công ty
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Nhập tên công ty (nếu có)"
                    value={form.companyName || ""}
                    onChange={(e) => handleInput("companyName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Loại khách hàng <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInput("type", "company")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        form.type === "company"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Building2
                        className={`h-5 w-5 mx-auto mb-2 ${
                          form.type === "company"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          form.type === "company"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Khách công ty
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInput("type", "retail")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        form.type === "retail"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <User
                        className={`h-5 w-5 mx-auto mb-2 ${
                          form.type === "retail"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          form.type === "retail"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Khách lẻ
                      </p>
                    </button>
                  </div>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-accent/5 to-primary/5 p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Thông tin liên hệ</h2>
                    <p className="text-sm text-muted-foreground">
                      Địa chỉ và phương thức liên lạc
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Số điện thoại <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="0912 345 678"
                      value={form.phone || ""}
                      onChange={(e) => handleInput("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="taxCode"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Mã số thuế <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="taxCode"
                      placeholder="0123456789"
                      value={form.taxCode || ""}
                      onChange={(e) => handleInput("taxCode", e.target.value)}
                      className={errors.taxCode ? "border-destructive" : ""}
                    />
                    {errors.taxCode && (
                      <p className="text-sm text-destructive">
                        {errors.taxCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Địa chỉ <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Nhập địa chỉ đầy đủ"
                    value={form.address || ""}
                    onChange={(e) => handleInput("address", e.target.value)}
                    className={`min-h-24 ${
                      errors.address ? "border-destructive" : ""
                    }`}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Code */}
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl border border-accent/20 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">Mã khách hàng</h3>
              </div>
              <div className="bg-card rounded-lg p-4 border-2 border-dashed border-accent/30">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <p className="text-2xl font-mono font-bold text-accent">
                  {generatedCode || "XXXXXX"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Mã tự động tạo từ tên người đại diện
              </p>
            </div>

            {/* Credit Limit */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Hạn mức công nợ</h3>
                    <p className="text-xs text-muted-foreground">
                      Giới hạn tín dụng
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2">
                <Label htmlFor="maxDebt" className="text-sm font-medium">
                  Số tiền (VNĐ) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxDebt"
                  type="number"
                  placeholder="50000000"
                  value={form.maxDebt}
                  onChange={(e) =>
                    handleInput("maxDebt", Number(e.target.value))
                  }
                  className={`text-lg font-semibold ${
                    errors.maxDebt ? "border-destructive" : ""
                  }`}
                />
                {errors.maxDebt && (
                  <p className="text-sm text-destructive">{errors.maxDebt}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  ≈{" "}
                  {new Intl.NumberFormat("vi-VN").format(Number(form.maxDebt))}{" "}
                  đ
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base gap-2 shadow-lg hover:shadow-xl transition-all"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Tạo khách hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
