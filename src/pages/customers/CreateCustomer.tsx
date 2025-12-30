import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomer,
  useFormValidation,
  useCheckDuplicateCompany,
} from "@/hooks";
import { CreateCustomerRequest, CreateCustomerRequestSchema } from "@/Schema";
import { FormFieldError } from "@/components/ui/form-field-error";
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
  AlertCircle,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCustomerRequest>({
    name: "",
    companyName: "",
    representativeName: "",
    taxCode: "",
    phone: "",
    email: "",
    address: "",
    type: "company",
    maxDebt: 50000000,
  });

  const [generatedCode, setGeneratedCode] = useState("");
  const [duplicateCompany, setDuplicateCompany] = useState<string | null>(null);
  const { check: checkDuplicate, loading: checkingDuplicate } =
    useCheckDuplicateCompany();
  const {
    mutateAsync: createCustomer,
    isPending,
    isSuccess,
  } = useCreateCustomer();

  // Form validation hook
  const {
    errors,
    validateAndParse,
    clearFieldError,
    touchField,
    getError,
    scrollToFirstError,
  } = useFormValidation(CreateCustomerRequestSchema);

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
    clearFieldError(field as string);
    
    // Clear companyName error when switching from company to retail
    if (field === "type" && value === "retail") {
      clearFieldError("companyName");
    }
    
    if (field === "companyName")
      setGeneratedCode(generatePreviewCode(String(value ?? "")));
  };

  const handleBlur = async (field: keyof CreateCustomerRequest) => {
    touchField(field as string);

    if (field === "companyName" && form.companyName?.trim()) {
      try {
        const isDuplicate = await checkDuplicate(form.companyName.trim());
        if (isDuplicate) {
          setDuplicateCompany(form.companyName.trim());
        } else {
          setDuplicateCompany(null);
        }
      } catch (err) {
        console.error("Error checking duplicate company:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prepare form data - convert empty strings to undefined for optional fields
    const formData = {
      name: form.name?.trim() || undefined,
      companyName: form.companyName?.trim() || undefined,
      representativeName: form.representativeName?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      taxCode: form.taxCode?.trim() || undefined,
      address: form.address?.trim() || undefined,
      type: form.type || undefined,
      currentDebt: form.currentDebt,
      maxDebt: Number(form.maxDebt) || 0,
    };

    // Validate and parse form data
    const payload = validateAndParse(formData);

    if (!payload) {
      // Scroll to first error field
      setTimeout(() => {
        scrollToFirstError();
      }, 100);
      return;
    }

    try {
      await createCustomer(payload);
      setTimeout(() => navigate("/customers"), 2000);
    } catch (error) {
      // Error is already handled by the mutation hook
      console.error("Error creating customer:", error);
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
                    Tên khách hàng
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nhập tên khách hàng"
                    value={form.name}
                    onChange={(e) => handleInput("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    className={getError("name") ? "border-destructive" : ""}
                  />
                  <FormFieldError error={getError("name")} />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="representativeName"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Tên người đại diện
                  </Label>
                  <Input
                    id="representativeName"
                    placeholder="Nhập tên người đại diện"
                    value={form.representativeName || ""}
                    onChange={(e) =>
                      handleInput("representativeName", e.target.value)
                    }
                    onBlur={() => handleBlur("representativeName")}
                    className={
                      getError("representativeName") ? "border-destructive" : ""
                    }
                  />
                  <FormFieldError error={getError("representativeName")} />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Tên công ty
                    {form.type === "company" && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      placeholder={
                        form.type === "company"
                          ? "Nhập tên công ty (bắt buộc)"
                          : "Nhập tên công ty (nếu có)"
                      }
                      value={form.companyName || ""}
                      onChange={(e) =>
                        handleInput("companyName", e.target.value)
                      }
                      onBlur={() => handleBlur("companyName")}
                      className={
                        duplicateCompany === form.companyName?.trim() &&
                        duplicateCompany !== null
                          ? "border-amber-500 bg-amber-50/50"
                          : getError("companyName")
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {checkingDuplicate && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {duplicateCompany === form.companyName?.trim() &&
                    duplicateCompany !== null && (
                      <div className="flex items-center gap-2 text-amber-600 text-xs mt-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>
                          Tên công ty "{duplicateCompany}" đã có trong hệ thống!
                        </span>
                      </div>
                    )}
                  <FormFieldError error={getError("companyName")} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Loại khách hàng
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
                  <FormFieldError error={getError("type")} />
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
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      placeholder="0912 345 678"
                      value={form.phone || ""}
                      onChange={(e) => handleInput("phone", e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      className={getError("phone") ? "border-destructive" : ""}
                    />
                    <FormFieldError error={getError("phone")} />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={form.email || ""}
                      onChange={(e) => handleInput("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={getError("email") ? "border-destructive" : ""}
                    />
                    <FormFieldError error={getError("email")} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="taxCode"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Mã số thuế
                    </Label>
                    <Input
                      id="taxCode"
                      placeholder="0123456789"
                      value={form.taxCode || ""}
                      onChange={(e) => handleInput("taxCode", e.target.value)}
                      onBlur={() => handleBlur("taxCode")}
                      className={
                        getError("taxCode") ? "border-destructive" : ""
                      }
                    />
                    <FormFieldError error={getError("taxCode")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Địa chỉ
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Nhập địa chỉ đầy đủ"
                    value={form.address || ""}
                    onChange={(e) => handleInput("address", e.target.value)}
                    onBlur={() => handleBlur("address")}
                    className={`min-h-24 ${
                      getError("address") ? "border-destructive" : ""
                    }`}
                  />
                  <FormFieldError error={getError("address")} />
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
                  Số tiền (VNĐ)
                </Label>
                <Input
                  id="maxDebt"
                  type="number"
                  placeholder="50000000"
                  value={form.maxDebt}
                  onChange={(e) =>
                    handleInput("maxDebt", Number(e.target.value))
                  }
                  onBlur={() => handleBlur("maxDebt")}
                  className={`text-lg font-semibold ${
                    getError("maxDebt") ? "border-destructive" : ""
                  }`}
                />
                <FormFieldError error={getError("maxDebt")} />
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
