import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomer,
  useFormValidation,
  useAuth,
  // useCheckDuplicateCompany, // DEPRECATED: Endpoint not found in OpenAPI
} from "@/hooks";
import { ROLE } from "@/constants";
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
  const { user } = useAuth();
  const canEditDebt =
    user?.role === ROLE.ACCOUNTING ||
    user?.role === ROLE.ACCOUNTING_LEAD ||
    user?.role === ROLE.ADMIN;

  const [form, setForm] = useState<CreateCustomerRequest>({
    name: "",
    companyName: "",
    representativeName: "",
    taxCode: "",
    phone: "",
    email: "",
    address: "",
    scrapRate: 0.005,
    type: "company",
    maxDebt: 200000000,
  });

  const [generatedCode, setGeneratedCode] = useState("");
  const [duplicateCompany, setDuplicateCompany] = useState<string | null>(null);
  // DEPRECATED: Endpoint not found in OpenAPI
  // const { check: checkDuplicate, loading: checkingDuplicate } =
  //   useCheckDuplicateCompany();
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

    // DEPRECATED: Endpoint not found in OpenAPI
    // if (field === "companyName" && form.companyName?.trim()) {
    //   try {
    //     const isDuplicate = await checkDuplicate(form.companyName.trim());
    //     if (isDuplicate) {
    //       setDuplicateCompany(form.companyName.trim());
    //     } else {
    //       setDuplicateCompany(null);
    //     }
    //   } catch (err) {
    //     console.error("Error checking duplicate company:", err);
    //   }
    // }
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
      // Ensure scrapRate is sent to API. Default to 0.005 when not provided.
      scrapRate: form.scrapRate ?? 0.005,
      // Only send debt fields if user has permission
      ...(canEditDebt && {
        currentDebt: form.currentDebt,
        maxDebt: Number(form.maxDebt) || 0,
      }),
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
      // Debug: log payload to verify scrapRate value sent
      console.debug("CreateCustomer payload:", payload);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
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
              <h1 className="text-xl sm:text-2xl font-bold text-balance">
                Thêm khách hàng mới
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Điền thông tin để tạo hồ sơ khách hàng doanh nghiệp
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-accent hidden sm:block" />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
      >
        <div className="grid gap-4 lg:grid-cols-3 items-start">
          {/* Column 1: Basic & Company Information */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Thông tin cơ bản</h2>
                  <p className="text-xs text-muted-foreground">
                    Thông tin chính của khách hàng
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Tên khách hàng
                </Label>
                <Input
                  id="name"
                  placeholder="Nhập tên khách hàng"
                  value={form.name}
                  onChange={(e) => handleInput("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  className={`h-9 text-sm ${getError("name") ? "border-destructive" : ""}`}
                />
                <FormFieldError error={getError("name")} />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyName"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Tên công ty <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="companyName"
                    placeholder="Nhập tên công ty (bắt buộc)"
                    value={form.companyName || ""}
                    onChange={(e) =>
                      handleInput("companyName", e.target.value)
                    }
                    onBlur={() => handleBlur("companyName")}
                    className={`h-9 text-sm ${getError("companyName") ? "border-destructive" : ""}`}
                  />
                </div>
                <FormFieldError error={getError("companyName")} />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="representativeName"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
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
                  className={`h-9 text-sm ${getError("representativeName") ? "border-destructive" : ""}`}
                />
                <FormFieldError error={getError("representativeName")} />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="taxCode"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Mã số thuế
                </Label>
                <Input
                  id="taxCode"
                  placeholder="0123456789"
                  value={form.taxCode || ""}
                  onChange={(e) => handleInput("taxCode", e.target.value)}
                  onBlur={() => handleBlur("taxCode")}
                  className={`h-9 text-sm ${getError("taxCode") ? "border-destructive" : ""}`}
                />
                <FormFieldError error={getError("taxCode")} />
              </div>
            </div>
          </div>

          {/* Column 2: Contact Information */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Thông tin liên hệ</h2>
                  <p className="text-xs text-muted-foreground">
                    Địa chỉ và phương thức liên lạc
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  placeholder="0912 345 678"
                  value={form.phone || ""}
                  onChange={(e) => handleInput("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  className={`h-9 text-sm ${getError("phone") ? "border-destructive" : ""}`}
                />
                <FormFieldError error={getError("phone")} />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email || ""}
                  onChange={(e) => handleInput("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`h-9 text-sm ${getError("email") ? "border-destructive" : ""}`}
                />
                <FormFieldError error={getError("email")} />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="address"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Địa chỉ
                </Label>
                <Textarea
                  id="address"
                  placeholder="Nhập địa chỉ đầy đủ"
                  value={form.address || ""}
                  onChange={(e) => handleInput("address", e.target.value)}
                  onBlur={() => handleBlur("address")}
                  rows={2}
                  className={`min-h-16 text-sm resize-none ${getError("address") ? "border-destructive" : ""}`}
                />
                <FormFieldError error={getError("address")} />
              </div>
            </div>
          </div>

          {/* Column 3: Preview & Limits */}
          <div className="space-y-4">
            {/* Preview Code */}
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl border border-accent/20 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-sm">Mã khách hàng</h3>
              </div>
              <div className="bg-card rounded-lg p-3 border border-dashed border-accent/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">Preview</p>
                <p className="text-xl font-mono font-bold text-accent">
                  {generatedCode || "XXXXXX"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Mã tự động tạo từ tên công ty
              </p>
            </div>

            {/* Credit Limit - Only show if user has permission */}
            {canEditDebt && (
              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Hạn mức công nợ</h3>
                      <p className="text-xs text-muted-foreground">
                        Giới hạn tín dụng
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <Label htmlFor="maxDebt" className="text-xs font-medium">
                    Số tiền (VNĐ)
                  </Label>
                  <Input
                    id="maxDebt"
                    type="number"
                    placeholder="200000000"
                    value={form.maxDebt}
                    onChange={(e) =>
                      handleInput("maxDebt", Number(e.target.value))
                    }
                    onBlur={() => handleBlur("maxDebt")}
                    className={`h-9 text-sm font-semibold ${getError("maxDebt") ? "border-destructive" : ""}`}
                  />
                  <FormFieldError error={getError("maxDebt")} />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ≈{" "}
                    {new Intl.NumberFormat("vi-VN").format(Number(form.maxDebt))}{" "}
                    đ
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-sm gap-2 shadow-md hover:shadow-lg transition-all"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
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
