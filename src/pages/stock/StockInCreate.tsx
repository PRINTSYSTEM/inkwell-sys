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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  UserPlus,
  Package,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCreateStockInFromVendor } from "@/hooks/use-stock";
import type { StockInItemRequest } from "@/Schema/stock.schema";
import { useVendors, useCreateVendor } from "@/hooks/use-vendor";
import { useMaterials, useCreateMaterial } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { toast } from "sonner";
import type { CreateVendorRequest } from "@/Schema/vendor.schema";
import type { MaterialResponse } from "@/Schema/material.schema";
import type { CreateMaterialRequest } from "@/Schema/material.schema";

// Utility function to generate material code from name
// Example: "Hộp Duplex 350 - 20x15x10cm" -> "HOP-DUPLEX-350-20x15x10"
const generateMaterialCode = (name: string): string => {
  if (!name) return "";

  let code = name
    // Normalize Vietnamese characters (remove accents)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Remove "cm" suffix (case insensitive, with optional spaces)
    .replace(/\s*cm\s*$/i, "")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    .trim();

  // Replace spaces, underscores, and special characters with hyphens
  // Keep x and X for dimensions (like 20x15x10)
  code = code
    .replace(/[\s_\-]+/g, "-")
    // Replace any character that's not alphanumeric, hyphen, or x/X with empty string
    .replace(/[^A-Za-z0-9\-xX]/g, "")
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, "-")
    // Convert to uppercase (but preserve x as X for dimensions)
    .toUpperCase()
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  return code;
};

export default function StockInCreatePage() {
  const navigate = useNavigate();
  const {
    mutate: createStockInFromVendor,
    isPending,
    isSuccess,
  } = useCreateStockInFromVendor();
  const { data: vendorsData } = useVendors({ pageNumber: 1, pageSize: 100 });
  const allVendors = vendorsData?.items || [];
  const { mutate: createVendor, isPending: isCreatingVendor } =
    useCreateVendor();
  const { data: materialsData } = useMaterials({ page: 1, size: 1000 });
  const materials = materialsData?.items || [];
  const { mutate: createMaterial, isPending: isCreatingMaterial } =
    useCreateMaterial();
  const { data: materialTypesData } = useMaterialTypeList({
    pageNumber: 1,
    pageSize: 100,
    status: "active",
  });
  const materialTypes = materialTypesData?.items || [];

  const [formData, setFormData] = useState({
    vendorId: null as number | null,
    notes: "",
    stockInDate: new Date().toISOString().slice(0, 16),
  });

  const [isCreateVendorDialogOpen, setIsCreateVendorDialogOpen] =
    useState(false);
  const [newVendorData, setNewVendorData] = useState<CreateVendorRequest>({
    name: "",
    vendorType: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const [isCreateMaterialDialogOpen, setIsCreateMaterialDialogOpen] =
    useState(false);
  const [creatingMaterialIndex, setCreatingMaterialIndex] = useState<
    number | null
  >(null);
  const [newMaterialData, setNewMaterialData] = useState<CreateMaterialRequest>(
    {
      name: "",
      materialTypeId: 0,
      length: 0,
      width: 0,
      height: undefined,
      quantity: undefined,
    }
  );

  const [items, setItems] = useState<StockInItemRequest[]>([
    {
      itemName: "",
      itemCode: "",
      unit: "",
      quantity: 1,
      unitPrice: undefined,
      notes: "",
      materialId: undefined,
      orderDetailId: undefined,
    },
  ]);

  const [itemErrors, setItemErrors] = useState<
    Record<number, { itemName?: string; quantity?: string }>
  >({});

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        itemCode: "",
        unit: "",
        quantity: 1,
        unitPrice: undefined,
        notes: "",
        materialId: undefined,
        orderDetailId: undefined,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Phải có ít nhất một vật phẩm");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
    const newErrors = { ...itemErrors };
    delete newErrors[index];
    setItemErrors(newErrors);
  };

  const validateItem = (index: number, item: StockInItemRequest) => {
    const errors: { itemName?: string; quantity?: string } = {};
    const trimmedName = item.itemName?.trim() || "";

    if (!trimmedName) {
      errors.itemName = "Tên vật phẩm là bắt buộc";
    } else if (trimmedName.length < 1) {
      errors.itemName = "Tên vật phẩm phải có ít nhất 1 ký tự";
    }

    if (!Number.isInteger(item.quantity)) {
      errors.quantity = "Số lượng phải là số nguyên";
    } else if (item.quantity < 1) {
      errors.quantity = "Số lượng phải lớn hơn 0";
    } else if (item.quantity > 2147483647) {
      errors.quantity = "Số lượng quá lớn (tối đa 2,147,483,647)";
    }

    setItemErrors((prev) => ({ ...prev, [index]: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleItemChange = (
    index: number,
    field: keyof StockInItemRequest,
    value: string | number | null | undefined
  ) => {
    const newItems = [...items];
    let normalizedValue: string | number | undefined;
    if (field === "quantity" || field === "unitPrice") {
      normalizedValue = value as number | undefined;
    } else if (field === "itemName") {
      normalizedValue = (value as string) || "";
    } else {
      normalizedValue = (value as string)?.trim() || "";
    }
    newItems[index] = { ...newItems[index], [field]: normalizedValue };

    // Clear error when user types
    if (itemErrors[index]?.[field as keyof (typeof itemErrors)[number]]) {
      const newErrors = { ...itemErrors };
      if (newErrors[index]) {
        delete newErrors[index][field as keyof (typeof newErrors)[number]];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      setItemErrors(newErrors);
    }

    setItems(newItems);
  };

  const handleMaterialSelect = (index: number, materialId: string) => {
    const material = materials.find((m) => m.id?.toString() === materialId);
    if (material && material.id) {
      const materialName = material.name || material.materialTypeName || "";
      const generatedCode = generateMaterialCode(materialName);
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        itemName: materialName,
        itemCode: generatedCode,
        unitPrice: undefined,
        materialId: material.id,
        length: material.length,
        width: material.width,
        height: material.height,
      };
      setItems(newItems);
      // Clear errors when material is selected
      if (itemErrors[index]) {
        const newErrors = { ...itemErrors };
        delete newErrors[index];
        setItemErrors(newErrors);
      }
    }
  };

  const handleItemBlur = (index: number) => {
    validateItem(index, items[index]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all items
    let allValid = true;
    items.forEach((item, index) => {
      if (!validateItem(index, item)) {
        allValid = false;
      }
    });

    if (!allValid) {
      toast.error("Vui lòng kiểm tra lại thông tin vật phẩm", {
        description: "Có lỗi trong danh sách vật phẩm",
      });
      return;
    }

    const validItems = items.filter((item) => {
      const trimmedName = item.itemName?.trim() || "";
      return (
        trimmedName.length >= 1 &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 2147483647
      );
    });

    if (validItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một vật phẩm hợp lệ", {
        description:
          "Tên vật phẩm bắt buộc (ít nhất 1 ký tự) và số lượng phải từ 1 trở lên",
      });
      return;
    }

    const formatDateWithOffset = (dateStr: string): string => {
      if (!dateStr) return new Date().toISOString();
      const date = new Date(dateStr);
      return date.toISOString();
    };

    if (!formData.vendorId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }

    createStockInFromVendor(
      {
        vendorId: formData.vendorId,
        itemType: "material",
        notes: formData.notes?.trim() || undefined,
        stockInDate: formData.stockInDate
          ? formatDateWithOffset(formData.stockInDate)
          : undefined,
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          itemCode: (item.itemCode || "").trim() || undefined,
          unit: (item.unit || "").trim() || undefined,
          quantity: Math.floor(item.quantity),
          unitPrice: item.unitPrice ?? undefined,
          notes: (item.notes || "").trim() || undefined,
          materialId: item.materialId ?? undefined,
          orderDetailId: item.orderDetailId ?? undefined,
          length: item.length ?? undefined,
          width: item.width ?? undefined,
          height: item.height ?? undefined,
        })),
      },
      {
        onSuccess: (data) => {
          // Navigate to detail page
          if (data?.id) {
            navigate(`/stock/stock-ins/${data.id}`);
          }
        },
      }
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">
              Tạo phiếu nhập kho thành công!
            </h2>
            <p className="text-slate-600">
              Phiếu nhập kho đã được tạo và lưu vào hệ thống
            </p>
          </div>
          <Button
            onClick={() => navigate("/stock/stock-ins")}
            className="cursor-pointer transition-colors duration-200"
            size="lg"
          >
            Xem danh sách phiếu nhập kho
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="cursor-pointer transition-colors duration-200 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Tạo phiếu nhập kho
                  </h1>
                  <p className="text-xs text-slate-500">
                    Thêm vật phẩm mới vào kho
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="cursor-pointer transition-colors duration-200"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                form="stock-in-form"
                disabled={isPending}
                className="cursor-pointer transition-colors duration-200 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Tạo phiếu nhập kho
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="stock-in-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Main Information Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Thông tin phiếu nhập kho
                  </h2>
                  <p className="text-sm text-slate-500">
                    Điền thông tin cơ bản cho phiếu nhập kho
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="vendorId"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4 text-slate-500" />
                      Nhà cung cấp <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewVendorData({
                          name: "",
                          vendorType: "material",
                          phone: "",
                          email: "",
                          address: "",
                          note: "",
                        });
                        setIsCreateVendorDialogOpen(true);
                      }}
                      className="h-7 text-xs cursor-pointer transition-colors duration-200"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Tạo mới
                    </Button>
                  </div>
                  <Select
                    value={formData.vendorId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vendorId: value ? Number(value) : null,
                      })
                    }
                  >
                    <SelectTrigger
                      id="vendorId"
                      className="h-11 cursor-pointer transition-colors duration-200"
                    >
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVendors.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-500">
                          Không có nhà cung cấp nào
                        </div>
                      ) : (
                        allVendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id?.toString() || "0"}
                          >
                            {vendor.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="stockInDate"
                    className="text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-slate-500" />
                    Ngày nhập kho
                  </Label>
                  <Input
                    id="stockInDate"
                    type="datetime-local"
                    value={
                      formData.stockInDate
                        ? formData.stockInDate.includes("T")
                          ? formData.stockInDate.slice(0, 16)
                          : formData.stockInDate + "T00:00"
                        : new Date().toISOString().slice(0, 16)
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        stockInDate:
                          value || new Date().toISOString().slice(0, 16),
                      });
                    }}
                    className="h-11 transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-slate-700"
                >
                  Ghi chú
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Nhập ghi chú cho phiếu nhập kho..."
                  rows={3}
                  className="resize-none transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Danh sách vật phẩm
                    </h2>
                    <p className="text-sm text-slate-500">
                      Thêm các vật phẩm cần nhập kho
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="cursor-pointer transition-colors duration-200 hover:bg-indigo-50 hover:border-indigo-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm vật phẩm
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-5 space-y-4 hover:border-slate-300/60 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Vật phẩm {index + 1}
                      </span>
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-600">
                        Chọn chất liệu
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCreatingMaterialIndex(index);
                          setNewMaterialData({
                            name: "",
                            materialTypeId: 0,
                            length: 0,
                            width: 0,
                            height: undefined,
                            quantity: undefined,
                          });
                          setIsCreateMaterialDialogOpen(true);
                        }}
                        className="h-7 text-xs cursor-pointer transition-colors duration-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Tạo mới
                      </Button>
                    </div>
                    <Select
                      value={items[index].materialId?.toString() || ""}
                      onValueChange={(value) =>
                        handleMaterialSelect(index, value)
                      }
                    >
                      <SelectTrigger className="h-10 cursor-pointer transition-colors duration-200">
                        <SelectValue placeholder="Chọn chất liệu để tự động điền thông tin" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-slate-500">
                            Không có chất liệu nào
                          </div>
                        ) : (
                          materials.map((material) => (
                            <SelectItem
                              key={material.id}
                              value={material.id?.toString() || ""}
                            >
                              {material.name ||
                                material.materialTypeName ||
                                `Chất liệu #${material.id}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Tên vật phẩm <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemChange(index, "itemName", e.target.value)
                        }
                        onBlur={() => handleItemBlur(index)}
                        placeholder="Nhập tên vật phẩm"
                        className={
                          itemErrors[index]?.itemName
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }
                      />
                      {itemErrors[index]?.itemName && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {itemErrors[index].itemName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Mã vật phẩm
                      </Label>
                      <Input
                        value={item.itemCode || ""}
                        onChange={(e) =>
                          handleItemChange(index, "itemCode", e.target.value)
                        }
                        placeholder="Mã (tùy chọn)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Đơn vị
                      </Label>
                      <Input
                        value={item.unit || ""}
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                        placeholder="Đơn vị (tùy chọn)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Số lượng <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="2147483647"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || val === "0") {
                            handleItemChange(index, "quantity", 1);
                          } else {
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num >= 1 && num <= 2147483647) {
                              handleItemChange(index, "quantity", num);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val < 1) {
                            handleItemChange(index, "quantity", 1);
                          } else if (val > 2147483647) {
                            handleItemChange(index, "quantity", 2147483647);
                          }
                          handleItemBlur(index);
                        }}
                        className={
                          itemErrors[index]?.quantity
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }
                      />
                      {itemErrors[index]?.quantity && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {itemErrors[index].quantity}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Đơn giá
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice ?? ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">
                      Ghi chú vật phẩm
                    </Label>
                    <Textarea
                      value={item.notes || ""}
                      onChange={(e) =>
                        handleItemChange(index, "notes", e.target.value)
                      }
                      placeholder="Ghi chú về vật phẩm này..."
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Create Vendor Dialog */}
      <Dialog
        open={isCreateVendorDialogOpen}
        onOpenChange={setIsCreateVendorDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo nhà cung cấp mới</DialogTitle>
            <DialogDescription>
              Tạo nhà cung cấp mới cho chất liệu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vendorName"
                value={newVendorData.name}
                onChange={(e) =>
                  setNewVendorData({ ...newVendorData, name: e.target.value })
                }
                placeholder="Nhập tên nhà cung cấp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorPhone">Số điện thoại</Label>
              <Input
                id="vendorPhone"
                value={newVendorData.phone || ""}
                onChange={(e) =>
                  setNewVendorData({
                    ...newVendorData,
                    phone: e.target.value || undefined,
                  })
                }
                placeholder="Nhập số điện thoại (tùy chọn)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorEmail">Email</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={newVendorData.email || ""}
                onChange={(e) =>
                  setNewVendorData({
                    ...newVendorData,
                    email: e.target.value || undefined,
                  })
                }
                placeholder="Nhập email (tùy chọn)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorAddress">Địa chỉ</Label>
              <Textarea
                id="vendorAddress"
                value={newVendorData.address || ""}
                onChange={(e) =>
                  setNewVendorData({
                    ...newVendorData,
                    address: e.target.value || undefined,
                  })
                }
                placeholder="Nhập địa chỉ (tùy chọn)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorNote">Ghi chú</Label>
              <Textarea
                id="vendorNote"
                value={newVendorData.note || ""}
                onChange={(e) =>
                  setNewVendorData({
                    ...newVendorData,
                    note: e.target.value || undefined,
                  })
                }
                placeholder="Nhập ghi chú (tùy chọn)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateVendorDialogOpen(false);
                setNewVendorData({
                  name: "",
                  vendorType: "",
                  phone: "",
                  email: "",
                  address: "",
                  note: "",
                });
              }}
              className="cursor-pointer transition-colors duration-200"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!newVendorData.name.trim()) {
                  toast.error("Vui lòng nhập tên nhà cung cấp");
                  return;
                }
                if (!newVendorData.vendorType) {
                  toast.error("Vui lòng chọn loại nhà cung cấp trước");
                  return;
                }
                createVendor(
                  {
                    name: newVendorData.name.trim(),
                    vendorType: newVendorData.vendorType,
                    phone: newVendorData.phone?.trim() || undefined,
                    email: newVendorData.email?.trim() || undefined,
                    address: newVendorData.address?.trim() || undefined,
                    note: newVendorData.note?.trim() || undefined,
                  },
                  {
                    onSuccess: (newVendor) => {
                      toast.success("Đã tạo nhà cung cấp thành công");
                      setIsCreateVendorDialogOpen(false);
                      setFormData({
                        ...formData,
                        vendorId: newVendor.id || null,
                      });
                      setNewVendorData({
                        name: "",
                        vendorType: "",
                        phone: "",
                        email: "",
                        address: "",
                        note: "",
                      });
                    },
                  }
                );
              }}
              disabled={isCreatingVendor}
              className="cursor-pointer transition-colors duration-200"
            >
              {isCreatingVendor ? "Đang tạo..." : "Tạo nhà cung cấp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Material Dialog */}
      <Dialog
        open={isCreateMaterialDialogOpen}
        onOpenChange={setIsCreateMaterialDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo chất liệu mới</DialogTitle>
            <DialogDescription>
              Tạo chất liệu mới để sử dụng trong phiếu nhập kho
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="materialName">
                Tên chất liệu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="materialName"
                value={newMaterialData.name}
                onChange={(e) =>
                  setNewMaterialData({
                    ...newMaterialData,
                    name: e.target.value,
                  })
                }
                placeholder="Nhập tên chất liệu (ví dụ: Hộp Duplex 350 - 20x15x10cm)"
              />
              {newMaterialData.name &&
                generateMaterialCode(newMaterialData.name) && (
                  <div className="mt-1.5 p-2 bg-slate-50 rounded-md border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        Mã tự động:
                      </span>
                      <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {generateMaterialCode(newMaterialData.name)}
                      </code>
                    </div>
                  </div>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialTypeId">
                Loại chất liệu <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newMaterialData.materialTypeId?.toString() || ""}
                onValueChange={(value) =>
                  setNewMaterialData({
                    ...newMaterialData,
                    materialTypeId: Number(value),
                  })
                }
              >
                <SelectTrigger id="materialTypeId">
                  <SelectValue placeholder="Chọn loại chất liệu" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-slate-500">
                      Không có loại chất liệu nào
                    </div>
                  ) : (
                    materialTypes.map((materialType) => (
                      <SelectItem
                        key={materialType.id}
                        value={materialType.id?.toString() || "0"}
                      >
                        {materialType.name || materialType.code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="materialLength">
                  Chiều dài (m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="materialLength"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterialData.length || ""}
                  onChange={(e) =>
                    setNewMaterialData({
                      ...newMaterialData,
                      length: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialWidth">
                  Chiều rộng (m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="materialWidth"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterialData.width || ""}
                  onChange={(e) =>
                    setNewMaterialData({
                      ...newMaterialData,
                      width: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialHeight">Chiều cao (m)</Label>
                <Input
                  id="materialHeight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterialData.height || ""}
                  onChange={(e) =>
                    setNewMaterialData({
                      ...newMaterialData,
                      height:
                        e.target.value === ""
                          ? undefined
                          : parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="0 (tùy chọn)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialQuantity">Số lượng</Label>
              <Input
                id="materialQuantity"
                type="number"
                min="0"
                step="1"
                value={newMaterialData.quantity || ""}
                onChange={(e) =>
                  setNewMaterialData({
                    ...newMaterialData,
                    quantity:
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value, 10) || undefined,
                  })
                }
                placeholder="0 (tùy chọn)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateMaterialDialogOpen(false);
                setNewMaterialData({
                  name: "",
                  materialTypeId: 0,
                  length: 0,
                  width: 0,
                  height: undefined,
                  quantity: undefined,
                });
              }}
              disabled={isCreatingMaterial}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!newMaterialData.name.trim()) {
                  toast.error("Vui lòng nhập tên chất liệu");
                  return;
                }
                if (
                  !newMaterialData.materialTypeId ||
                  newMaterialData.materialTypeId === 0
                ) {
                  toast.error("Vui lòng chọn loại chất liệu");
                  return;
                }
                if (newMaterialData.length <= 0) {
                  toast.error("Vui lòng nhập chiều dài lớn hơn 0");
                  return;
                }
                if (newMaterialData.width <= 0) {
                  toast.error("Vui lòng nhập chiều rộng lớn hơn 0");
                  return;
                }
                createMaterial(
                  {
                    name: newMaterialData.name.trim(),
                    materialTypeId: newMaterialData.materialTypeId,
                    length: newMaterialData.length,
                    width: newMaterialData.width,
                    height: newMaterialData.height,
                    quantity: newMaterialData.quantity,
                  },
                  {
                    onSuccess: (newMaterial) => {
                      toast.success("Đã tạo chất liệu thành công");
                      setIsCreateMaterialDialogOpen(false);
                      if (creatingMaterialIndex !== null && newMaterial.id) {
                        handleMaterialSelect(
                          creatingMaterialIndex,
                          newMaterial.id.toString()
                        );
                      }
                      setNewMaterialData({
                        name: "",
                        materialTypeId: 0,
                        length: 0,
                        width: 0,
                        height: undefined,
                        quantity: undefined,
                      });
                      setCreatingMaterialIndex(null);
                    },
                  }
                );
              }}
              disabled={isCreatingMaterial}
              className="cursor-pointer transition-colors duration-200"
            >
              {isCreatingMaterial ? "Đang tạo..." : "Tạo chất liệu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
