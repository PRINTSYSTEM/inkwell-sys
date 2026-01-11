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
import { useCreateStockIn } from "@/hooks/use-stock";
import type { StockInItemRequest } from "@/Schema/stock.schema";
import { useVendors, useCreateVendor } from "@/hooks/use-vendor";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { vendorTypeLabels } from "@/lib/status-utils";
import { toast } from "sonner";
import type { CreateVendorRequest } from "@/Schema/vendor.schema";
import type { MaterialTypeResponse } from "@/Schema/material-type.schema";

export default function StockInCreatePage() {
  const navigate = useNavigate();
  const { mutate: createStockIn, isPending, isSuccess } = useCreateStockIn();
  const { data: vendorsData } = useVendors({ pageSize: 1000 });
  const allVendors = vendorsData?.items || [];
  const { mutate: createVendor, isPending: isCreatingVendor } =
    useCreateVendor();
  const { data: materialTypesData } = useMaterialTypeList({
    pageSize: 1000,
    status: "active",
  });
  const materialTypes = materialTypesData?.items || [];

  const [formData, setFormData] = useState({
    type: "",
    supplierType: "" as string,
    supplierId: null as number | null,
    orderId: null as number | null,
    productionId: null as number | null,
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

  const filteredVendors = formData.supplierType
    ? allVendors.filter(
        (vendor) =>
          vendor.vendorType?.toLowerCase() ===
          formData.supplierType.toLowerCase()
      )
    : allVendors;

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

  const handleMaterialTypeSelect = (index: number, materialTypeId: string) => {
    const materialType = materialTypes.find(
      (mt) => mt.id?.toString() === materialTypeId
    );
    if (materialType && materialType.id) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        itemName: materialType.name || "",
        itemCode: materialType.code || "",
        unitPrice: materialType.pricePerM2,
        materialId: materialType.id,
      };
      setItems(newItems);
      // Clear errors when material type is selected
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

    createStockIn(
      {
        type: formData.type?.trim() || "",
        supplierId: formData.supplierId || undefined,
        orderId: formData.orderId || undefined,
        productionId: formData.productionId || undefined,
        notes: formData.notes?.trim() || "",
        stockInDate: formData.stockInDate
          ? formatDateWithOffset(formData.stockInDate)
          : undefined,
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          itemCode: (item.itemCode || "").trim(),
          unit: (item.unit || "").trim(),
          quantity: Math.floor(item.quantity),
          unitPrice: item.unitPrice ?? undefined,
          notes: (item.notes || "").trim(),
          materialId: item.materialId ?? undefined,
          orderDetailId: item.orderDetailId ?? undefined,
        })),
      },
      {
        onSuccess: () => {
          // Navigation handled by isSuccess state
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
                  <Label
                    htmlFor="type"
                    className="text-sm font-medium text-slate-700"
                  >
                    Loại phiếu
                  </Label>
                  <Select
                    value={formData.type || undefined}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="type"
                      className="h-11 cursor-pointer transition-colors duration-200"
                    >
                      <SelectValue placeholder="Chọn loại phiếu (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
                      <SelectItem value="purchase">Mua hàng</SelectItem>
                      <SelectItem value="production_completion">
                        Hoàn thành sản xuất
                      </SelectItem>
                      <SelectItem value="return">Trả hàng</SelectItem>
                      <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="supplierType"
                    className="text-sm font-medium text-slate-700"
                  >
                    Loại nhà cung cấp
                  </Label>
                  <Select
                    value={formData.supplierType || undefined}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        supplierType: value === "all" ? "" : value,
                        supplierId: null,
                      })
                    }
                  >
                    <SelectTrigger
                      id="supplierType"
                      className="h-11 cursor-pointer transition-colors duration-200"
                    >
                      <SelectValue placeholder="Chọn loại nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(vendorTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="supplierId"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4 text-slate-500" />
                      Nhà cung cấp
                    </Label>
                    {formData.supplierType && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewVendorData({
                            name: "",
                            vendorType: formData.supplierType,
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
                    )}
                  </div>
                  <Select
                    value={formData.supplierId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        supplierId: value ? Number(value) : null,
                      })
                    }
                    disabled={!formData.supplierType}
                  >
                    <SelectTrigger
                      id="supplierId"
                      className="h-11 cursor-pointer transition-colors duration-200 disabled:opacity-50"
                    >
                      <SelectValue
                        placeholder={
                          formData.supplierType
                            ? "Chọn nhà cung cấp"
                            : "Chọn loại nhà cung cấp trước"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVendors.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-500">
                          Không có nhà cung cấp nào
                        </div>
                      ) : (
                        filteredVendors.map((vendor) => (
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
                    <Label className="text-xs font-medium text-slate-600">
                      Chọn chất liệu
                    </Label>
                    <Select
                      value=""
                      onValueChange={(value) =>
                        handleMaterialTypeSelect(index, value)
                      }
                    >
                      <SelectTrigger className="h-10 cursor-pointer transition-colors duration-200">
                        <SelectValue placeholder="Chọn chất liệu để tự động điền thông tin" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-slate-500">
                            Không có chất liệu nào
                          </div>
                        ) : (
                          materialTypes.map((mt) => (
                            <SelectItem
                              key={mt.id}
                              value={mt.id?.toString() || ""}
                            >
                              {mt.name || mt.code || `Chất liệu #${mt.id}`}
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
              Tạo nhà cung cấp mới cho loại:{" "}
              {vendorTypeLabels[newVendorData.vendorType] ||
                newVendorData.vendorType}
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
                        supplierId: newVendor.id || null,
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
    </div>
  );
}
