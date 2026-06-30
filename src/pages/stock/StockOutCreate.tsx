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
  Plus,
  Trash2,
  Calendar,
  User,
  FileText,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Sparkles,
  Check,
} from "lucide-react";
import {
  useCreateStockOutForProduction,
  useCreateStockOutForDelivery,
  useMaterialSuggestions,
} from "@/hooks/use-stock";
import { cn } from "@/lib/utils";
import type { StockOutItemRequest } from "@/Schema/stock.schema";
import { useCustomers } from "@/hooks/use-customer";
import { useProductionOrders } from "@/hooks/use-production";
import { useDeliveryNotes } from "@/hooks/use-delivery-note";
import { useMaterials } from "@/hooks/use-material";
import { toast } from "sonner";
import { Factory, Truck } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
    .replace(/[\s_-]+/g, "-")
    // Replace any character that's not alphanumeric, hyphen, or x/X with empty string
    .replace(/[^A-Za-z0-9xX-]/g, "")
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, "-")
    // Convert to uppercase (but preserve x as X for dimensions)
    .toUpperCase()
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  return code;
};

export default function StockOutCreatePage() {
  const navigate = useNavigate();
  const {
    mutate: createStockOutForProduction,
    isPending: isPendingProduction,
    isSuccess: isSuccessProduction,
  } = useCreateStockOutForProduction();
  const {
    mutate: createStockOutForDelivery,
    isPending: isPendingDelivery,
    isSuccess: isSuccessDelivery,
  } = useCreateStockOutForDelivery();

  const { data: customersData } = useCustomers({ pageSize: 100 });
  const customers = customersData?.items || [];

  const { data: productionOrdersData } = useProductionOrders({ pageSize: 100 });
  const productionOrders = productionOrdersData?.items || [];

  const { data: deliveryNotesData } = useDeliveryNotes({ pageSize: 100 });
  const deliveryNotes = deliveryNotesData?.items || [];

  const [stockOutType, setStockOutType] = useState<"production" | "delivery">(
    "production"
  );
  const [filterByProduction, setFilterByProduction] = useState(true);

  const [formData, setFormData] = useState({
    itemType: "",
    customerId: null as number | null,
    orderId: null as number | null,
    productionOrderId: null as number | null,
    deliveryNoteId: null as number | null,
    notes: "",
    stockOutDate: new Date().toISOString().slice(0, 16),
  });

  const { data: materialsData } = useMaterials({
    size: 1000,
    productionOrderId:
      stockOutType === "production" && filterByProduction
        ? (formData.productionOrderId || undefined)
        : undefined,
  });
  const materials = materialsData?.items || [];

  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useMaterialSuggestions(
    formData.productionOrderId || undefined,
    stockOutType === "production"
  );

  const isPending = isPendingProduction || isPendingDelivery;
  const isSuccess = isSuccessProduction || isSuccessDelivery;

  const [items, setItems] = useState<StockOutItemRequest[]>([
    {
      itemName: "",
      itemCode: "",
      unit: "",
      quantity: 1,
      notes: "",
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
        notes: "",
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

  const validateItem = (index: number, item: StockOutItemRequest) => {
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
    } else if (item.materialId) {
      const material = materials.find((m) => m.id === item.materialId);
      if (material && material.currentStock !== undefined && item.quantity > material.currentStock) {
        errors.quantity = `Số lượng vượt quá Tồn kho nguyên vật liệu (${material.currentStock})`;
      }
    }

    setItemErrors((prev) => ({ ...prev, [index]: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleItemChange = (
    index: number,
    field: keyof StockOutItemRequest,
    value: string | number | null | undefined
  ) => {
    const newItems = [...items];
    let normalizedValue: string | number | undefined;
    if (field === "quantity") {
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
        delete newErrors[index][field as keyof (typeof itemErrors)[number]];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      setItemErrors(newErrors);
    }

    setItems(newItems);
  };

  const handleItemBlur = (index: number) => {
    validateItem(index, items[index]);
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
        unit: "",
        materialId: material.id,
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

  const handleApplySuggestion = (suggestion: any) => {
    const materialName = suggestion.name || suggestion.materialTypeName || "";
    const generatedCode = generateMaterialCode(materialName);
    
    // Check if the first item is empty
    if (items.length === 1 && items[0].itemName === "" && items[0].itemCode === "") {
      const newItems = [...items];
      newItems[0] = {
        itemName: materialName,
        itemCode: generatedCode,
        unit: suggestion.unit || "tờ",
        quantity: 1,
        notes: `Sử dụng gợi ý (Match Score: ${suggestion.matchScore}%)`,
        materialId: suggestion.id,
      } as any;
      setItems(newItems);
      toast.success(`Đã chọn vật tư gợi ý: ${materialName}`);
    } else {
      // Append a new item
      const newItem = {
        itemName: materialName,
        itemCode: generatedCode,
        unit: suggestion.unit || "tờ",
        quantity: 1,
        notes: `Sử dụng gợi ý (Match Score: ${suggestion.matchScore}%)`,
        materialId: suggestion.id,
      } as any;
      setItems([...items, newItem]);
      toast.success(`Đã thêm vật tư gợi ý: ${materialName}`);
    }
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

    const mappedItems = validItems.map((item) => ({
      itemName: item.itemName.trim(),
      itemCode: (item.itemCode || "").trim() || undefined,
      unit: (item.unit || "").trim() || undefined,
      quantity: Math.floor(item.quantity),
      notes: (item.notes || "").trim() || undefined,
      materialId: item.materialId ?? undefined,
      orderDetailId: item.orderDetailId ?? undefined,
    }));

    // Handle different stock out types
    if (stockOutType === "production") {
      if (!formData.productionOrderId) {
        toast.error("Vui lòng chọn lệnh sản xuất", {
          description:
            "Lệnh sản xuất là bắt buộc khi tạo phiếu xuất kho cho sản xuất",
        });
        return;
      }
      createStockOutForProduction(
        {
          productionOrderId: formData.productionOrderId,
          itemType: formData.itemType?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          stockOutDate: formData.stockOutDate
            ? formatDateWithOffset(formData.stockOutDate)
            : undefined,
          items: mappedItems,
        },
        {
          onSuccess: (data) => {
            // Navigate to detail page
            if (data?.id) {
              navigate(`/stock/stock-outs/${data.id}`);
            }
          },
        }
      );
    } else if (stockOutType === "delivery") {
      if (!formData.deliveryNoteId) {
        toast.error("Vui lòng chọn phiếu giao hàng", {
          description:
            "Phiếu giao hàng là bắt buộc khi tạo phiếu xuất kho cho giao hàng",
        });
        return;
      }
      createStockOutForDelivery(
        {
          deliveryNoteId: formData.deliveryNoteId,
          customerId: formData.customerId || undefined,
          orderId: formData.orderId || undefined,
          itemType: formData.itemType?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          stockOutDate: formData.stockOutDate
            ? formatDateWithOffset(formData.stockOutDate)
            : undefined,
          items: mappedItems,
        },
        {
          onSuccess: (data) => {
            // Navigate to detail page
            if (data?.id) {
              navigate(`/stock/stock-outs/${data.id}`);
            }
          },
        }
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#93631F]/10 blur-3xl rounded-full animate-pulse" />
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-[#93631F] mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">
              Tạo phiếu xuất kho thành công!
            </h2>
            <p className="text-slate-600">
              Phiếu xuất kho đã được tạo và lưu vào hệ thống
            </p>
          </div>
          <Button
            onClick={() => navigate("/stock/stock-outs")}
            className="cursor-pointer transition-colors duration-200"
            size="lg"
          >
            Xem danh sách phiếu xuất kho
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Standard Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tạo phiếu xuất kho</h1>
              <p className="text-muted-foreground mt-1">Xuất vật phẩm ra khỏi kho</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="cursor-pointer transition-colors duration-200 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="stock-out-form"
              disabled={isPending}
              className="cursor-pointer transition-colors duration-200 bg-gradient-to-r from-[#93631F] to-[#7a521a] hover:opacity-90 shadow-lg shadow-[#93631F]/25 text-white border-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tạo phiếu xuất kho
                </>
              )}
            </Button>
          </div>
        </div>

        <form id="stock-out-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-5 space-y-6 flex flex-col">
          {/* Main Information Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden flex-1">
            <div className="bg-gradient-to-r bg-[#93631F]/5 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#93631F]/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#93631F]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Thông tin phiếu xuất kho
                  </h2>
                  <p className="text-sm text-slate-500">
                    Điền thông tin cơ bản cho phiếu xuất kho
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stock Out Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Loại phiếu xuất kho <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStockOutType("production");
                      setFormData({
                        ...formData,
                        productionOrderId: null,
                        deliveryNoteId: null,
                        customerId: null,
                        orderId: null,
                      });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      stockOutType === "production"
                        ? "border-[#93631F] bg-[#93631F]/5 shadow-md"
                        : "border-slate-200 bg-white hover:border-[#93631F]/50 hover:bg-[#93631F]/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          stockOutType === "production"
                            ? "bg-[#93631F] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Factory className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">
                          Sản xuất
                        </div>
                        <div className="text-xs text-slate-500">
                          Cho phòng ban sản xuất
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockOutType("delivery");
                      setFormData({
                        ...formData,
                        productionOrderId: null,
                        deliveryNoteId: null,
                      });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      stockOutType === "delivery"
                        ? "border-[#93631F] bg-[#93631F]/5 shadow-md"
                        : "border-slate-200 bg-white hover:border-[#93631F]/50 hover:bg-[#93631F]/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          stockOutType === "delivery"
                            ? "bg-[#93631F] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">
                          Giao hàng
                        </div>
                        <div className="text-xs text-slate-500">
                          Giao hàng cho khách
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Production Order Selection (for production type) */}
              {stockOutType === "production" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="productionOrderId"
                    className="text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <Factory className="h-4 w-4 text-slate-500" />
                    Lệnh sản xuất <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.productionOrderId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        productionOrderId: value ? Number(value) : null,
                      })
                    }
                  >
                    <SelectTrigger
                      id="productionOrderId"
                      className="h-11 cursor-pointer transition-colors duration-200"
                    >
                      <SelectValue placeholder="Chọn lệnh sản xuất" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionOrders.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-500">
                          Không có lệnh sản xuất nào
                        </div>
                      ) : (
                        productionOrders.map((order) => (
                          <SelectItem
                            key={order.id}
                            value={order.id?.toString() || ""}
                          >
                            {order.proofingOrderCode ||
                              `Lệnh sản xuất #${order.id}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.productionOrderId && (
                    <div className="flex items-center space-x-2 pt-1 animate-in fade-in duration-200">
                      <Switch
                        id="filterByProduction"
                        checked={filterByProduction}
                        onCheckedChange={setFilterByProduction}
                      />
                      <Label htmlFor="filterByProduction" className="text-xs text-slate-500 cursor-pointer">
                        Lọc danh sách vật tư theo lệnh sản xuất này
                      </Label>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Note Selection (for delivery type) */}
              {stockOutType === "delivery" && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="deliveryNoteId"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Truck className="h-4 w-4 text-slate-500" />
                      Phiếu giao hàng <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.deliveryNoteId?.toString() || ""}
                      onValueChange={(value) => {
                        const selectedNote = deliveryNotes.find(
                          (note) => note.id?.toString() === value
                        );
                        setFormData({
                          ...formData,
                          deliveryNoteId: value ? Number(value) : null,
                          customerId: selectedNote?.customerId
                            ? Number(selectedNote.customerId)
                            : null,
                          orderId: selectedNote?.orderId
                            ? Number(selectedNote.orderId)
                            : null,
                        });
                      }}
                    >
                      <SelectTrigger
                        id="deliveryNoteId"
                        className="h-11 cursor-pointer transition-colors duration-200"
                      >
                        <SelectValue placeholder="Chọn phiếu giao hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryNotes.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-slate-500">
                            Không có phiếu giao hàng nào
                          </div>
                        ) : (
                          deliveryNotes.map((note) => (
                            <SelectItem
                              key={note.id}
                              value={note.id?.toString() || ""}
                            >
                              {note.code || `Phiếu giao hàng #${note.id}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="customerId"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      Khách hàng
                    </Label>
                    <Select
                      value={formData.customerId?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          customerId: value ? Number(value) : null,
                        })
                      }
                    >
                      <SelectTrigger
                        id="customerId"
                        className="h-11 cursor-pointer transition-colors duration-200"
                      >
                        <SelectValue placeholder="Chọn khách hàng (tùy chọn)" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id?.toString() || ""}
                          >
                            {customer.name ?? ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Common fields for all types */}
              <div className="space-y-2">
                <Label
                  htmlFor="stockOutDate"
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Ngày xuất kho
                </Label>
                <Input
                  id="stockOutDate"
                  type="datetime-local"
                  value={
                    formData.stockOutDate
                      ? formData.stockOutDate.includes("T")
                        ? formData.stockOutDate.slice(0, 16)
                        : formData.stockOutDate + "T00:00"
                      : new Date().toISOString().slice(0, 16)
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      stockOutDate:
                        value || new Date().toISOString().slice(0, 16),
                    });
                  }}
                  className="h-11 transition-colors duration-200"
                />
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
                  placeholder="Nhập ghi chú cho phiếu xuất kho..."
                  rows={3}
                  className="resize-none transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Optimization Suggestions Panel */}
          {stockOutType === "production" && formData.productionOrderId && (
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Gợi ý vật tư tối ưu</h3>
                    <p className="text-[11px] text-slate-500">Tự động đề xuất dựa trên lệnh sản xuất</p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex-1 overflow-y-auto max-h-[380px] space-y-4">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : !suggestionsData?.suggestions || suggestionsData.suggestions.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Không tìm thấy nguyên vật liệu phù hợp trong kho.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 leading-relaxed">
                      Lệnh sản xuất yêu cầu chất liệu <strong className="text-slate-800">{suggestionsData.materialTypeName}</strong>
                      {suggestionsData.basisWeight ? (
                        <> định lượng <strong className="text-slate-800">{suggestionsData.basisWeight} gsm</strong></>
                      ) : null}
                      {suggestionsData.rollWidth ? (
                        <> khổ cuộn <strong className="text-slate-800">{suggestionsData.rollWidth} mm</strong></>
                      ) : null}
                      .
                    </div>
                    {suggestionsData.suggestions.map((suggestion: any) => {
                      const isHigh = suggestion.matchScore >= 90;
                      const isMedium = suggestion.matchScore >= 70 && suggestion.matchScore < 90;
                      
                      return (
                        <div
                          key={suggestion.id}
                          className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col gap-2.5 group relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-800 block truncate group-hover:text-emerald-700 transition-colors">
                                {suggestion.name || suggestion.materialTypeName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-405 block mt-0.5">
                                SKU: {suggestion.code || "—"}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[9px] font-bold border rounded px-1.5 py-0.5 shrink-0 scale-90",
                                isHigh
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50"
                                  : isMedium
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                              )}
                            >
                              Khớp {suggestion.matchScore}%
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500 font-medium">
                            <div>Định lượng: <strong className="text-slate-700">{suggestion.basisWeight ? `${suggestion.basisWeight} gsm` : "—"}</strong></div>
                            <div>Tồn kho: <strong className="text-slate-700">{suggestion.currentStock?.toLocaleString("vi-VN") || 0} {suggestion.unit || "tờ"}</strong></div>
                            {suggestion.width || suggestion.length ? (
                              <div className="col-span-2 mt-0.5 text-slate-400">
                                Kích thước: {suggestion.width || "—"} x {suggestion.length || "0"} cm
                              </div>
                            ) : null}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              NCC: {suggestion.vendorName || "—"}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="h-7 text-[10px] px-2.5 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              Sử dụng gợi ý
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          <div className="xl:col-span-7 space-y-6 flex flex-col">
          {/* Items Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden flex-1 flex flex-col">
            <div className="bg-gradient-to-r bg-[#93631F]/5 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#93631F]/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-[#93631F]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Danh sách vật phẩm
                    </h2>
                    <p className="text-sm text-slate-500">
                      Thêm các vật phẩm cần xuất kho
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="cursor-pointer transition-colors duration-200 hover:bg-[#93631F]/10 hover:border-[#93631F]/30"
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
                  className="bg-white rounded-xl border border-slate-200/60 p-5 space-y-4 hover:border-[#93631F]/30 shadow-sm transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#93631F]/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-[#93631F]">
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
                        className="h-8 w-8 p-0 text-red-500 hover:text-[#93631F] hover:bg-red-50 cursor-pointer transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Row 1: Chọn chất liệu | Mã vật phẩm */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Chọn chất liệu
                      </Label>
                      <Select
                        value={item.materialId?.toString() || ""}
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

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Mã vật phẩm
                      </Label>
                      <Input
                        value={item.itemCode || ""}
                        onChange={(e) =>
                          handleItemChange(index, "itemCode", e.target.value)
                        }
                        placeholder="Mã (tự động hoặc nhập thủ công)"
                      />
                    </div>

                    {/* Row 2: Tên vật phẩm | Số lượng */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Tên vật phẩm <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemChange(index, "itemName", e.target.value)
                        }
                        onBlur={() => handleItemBlur(index)}
                        placeholder="Nhập tên vật phẩm hoặc chọn chất liệu"
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
                        Số lượng <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
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
                        {(() => {
                          const material = materials.find((m) => m.id === item.materialId);
                          if (material && material.currentStock !== undefined) {
                            return (
                              <div className="flex items-center gap-1.5 px-3 bg-[#93631F]/10 border border-[#93631F]/20 rounded-md whitespace-nowrap">
                                <Package className="h-4 w-4 text-[#93631F]" />
                                <span className="text-sm font-semibold text-[#93631F]">
                                  Tồn: {material.currentStock.toLocaleString("vi-VN")}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {itemErrors[index]?.quantity && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {itemErrors[index].quantity}
                        </p>
                      )}
                    </div>

                    {/* Row 3: Đơn vị */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">
                        Đơn vị
                      </Label>
                      <Input
                        value={item.unit || ""}
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                        placeholder="Đơn vị (tự động hoặc nhập thủ công)"
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
          </div>
        </form>
      </div>
    </div>
  );
}
