import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useCreateVendor } from "@/hooks/use-vendor";
import { useSupplierTypes } from "@/hooks/use-supplier-type";
import type { CreateVendorRequest } from "@/Schema/vendor.schema";
import { toast } from "sonner";




export default function VendorCreatePage() {
  const navigate = useNavigate();
  const { mutate: createVendor, isPending, isSuccess } = useCreateVendor();
  const { data: supplierTypesResp, isLoading: isLoadingTypes } = useSupplierTypes({ page: 1, size: 1000 });

  const [formData, setFormData] = useState<CreateVendorRequest & { supplierTypeId?: number }>({
    name: "",
    vendorType: "",
    supplierTypeId: undefined,
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateVendorRequest | "supplierTypeId", string>>
  >({});

  const supplierTypes = supplierTypesResp?.items || [];

  const validateField = (field: keyof CreateVendorRequest | "supplierTypeId", value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case "name":
        if (!value || !value.trim()) {
          newErrors.name = "Tên nhà cung cấp là bắt buộc";
        } else if (value.length > 255) {
          newErrors.name = "Tên nhà cung cấp không được vượt quá 255 ký tự";
        } else {
          delete newErrors.name;
        }
        break;
      case "supplierTypeId":
        if (!value) {
          newErrors.supplierTypeId = "Loại nhà cung cấp là bắt buộc";
        } else {
          delete newErrors.supplierTypeId;
        }
        break;
      case "phone":
        if (value && value.length > 20) {
          newErrors.phone = "Số điện thoại không được vượt quá 20 ký tự";
        } else {
          delete newErrors.phone;
        }
        break;
      case "email":
        if (value && value.length > 255) {
          newErrors.email = "Email không được vượt quá 255 ký tự";
        } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Email không hợp lệ";
        } else {
          delete newErrors.email;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (
    field: keyof CreateVendorRequest | "supplierTypeId",
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof errors];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof CreateVendorRequest | "supplierTypeId") => {
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    validateField("name", formData.name || "");
    validateField("supplierTypeId", formData.supplierTypeId);

    if (formData.phone) {
      validateField("phone", formData.phone);
    }
    if (formData.email) {
      validateField("email", formData.email);
    }

    // Check if there are any errors
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors || !formData.name?.trim() || !formData.supplierTypeId) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc", {
        description: "Kiểm tra lại các trường được đánh dấu *",
      });
      return;
    }

    const selectedType = supplierTypes.find(t => t.id === formData.supplierTypeId);

    // Prepare payload - convert empty strings to undefined for optional fields
    const payload: CreateVendorRequest = {
      name: formData.name.trim(),
      vendorType: selectedType?.code || "",
      supplierTypeId: formData.supplierTypeId,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      note: formData.note?.trim() || undefined,
    };

    createVendor(payload, {
      onSuccess: () => {
        navigate("/vendors");
      },
    });
  };



  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendors")}
              className="gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-balance">
                Thêm nhà cung cấp mới
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Điền thông tin để tạo hồ sơ nhà cung cấp
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-accent hidden sm:block" />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <Card className="border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Thông tin nhà cung cấp</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Nhập thông tin chi tiết của nhà cung cấp mới
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên nhà cung cấp <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Nhập tên nhà cung cấp"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierTypeId">
                  Loại nhà cung cấp <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.supplierTypeId?.toString() || undefined}
                  onValueChange={(value) => {
                    const idNum = Number(value);
                    handleInputChange("supplierTypeId", idNum);
                    validateField("supplierTypeId", idNum);
                  }}
                  disabled={isLoadingTypes}
                >
                  <SelectTrigger
                    id="supplierTypeId"
                    className={errors.supplierTypeId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={isLoadingTypes ? "Đang tải loại NCC..." : "Chọn loại nhà cung cấp"} />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.description || type.name || type.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierTypeId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.supplierTypeId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="Nhập số điện thoại"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="Nhập email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Địa chỉ
                </Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Ghi chú
                </Label>
                <Textarea
                  id="note"
                  value={formData.note || ""}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="Nhập ghi chú về nhà cung cấp..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/vendors")}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="cursor-pointer min-w-[140px]"
              >
                {isPending ? "Đang tạo..." : "Tạo nhà cung cấp"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
