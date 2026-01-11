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
} from "lucide-react";
import { useCreateStockOut } from "@/hooks/use-stock";
import type { StockOutItemRequest } from "@/Schema/stock.schema";
import { useCustomers } from "@/hooks/use-customer";
import { toast } from "sonner";

export default function StockOutCreatePage() {
  const navigate = useNavigate();
  const { mutate: createStockOut, isPending, isSuccess } = useCreateStockOut();
  const { data: customersData } = useCustomers({ pageSize: 1000 });
  const customers = customersData?.items || [];

  const [formData, setFormData] = useState({
    type: "",
    customerId: null as number | null,
    orderId: null as number | null,
    productionId: null as number | null,
    deliveryNoteId: null as number | null,
    notes: "",
    stockOutDate: new Date().toISOString().slice(0, 16),
  });

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

    createStockOut(
      {
        type: formData.type?.trim() || "",
        customerId: formData.customerId || undefined,
        orderId: formData.orderId || undefined,
        productionId: formData.productionId || undefined,
        deliveryNoteId: formData.deliveryNoteId || undefined,
        notes: formData.notes?.trim() || "",
        stockOutDate: formData.stockOutDate
          ? formatDateWithOffset(formData.stockOutDate)
          : undefined,
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          itemCode: (item.itemCode || "").trim(),
          unit: (item.unit || "").trim(),
          quantity: Math.floor(item.quantity),
          notes: (item.notes || "").trim(),
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-red-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-orange-500 mx-auto" />
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
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <LogOut className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Tạo phiếu xuất kho
                  </h1>
                  <p className="text-xs text-slate-500">
                    Xuất vật phẩm ra khỏi kho
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
                form="stock-out-form"
                disabled={isPending}
                className="cursor-pointer transition-colors duration-200 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/25"
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="stock-out-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Main Information Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-600" />
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
                      <SelectItem value="sale">Bán hàng</SelectItem>
                      <SelectItem value="material_export">
                        Xuất nguyên liệu
                      </SelectItem>
                      <SelectItem value="production">Sản xuất</SelectItem>
                      <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

          {/* Items Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500/5 via-pink-500/5 to-rose-500/5 px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-red-600" />
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
                  className="cursor-pointer transition-colors duration-200 hover:bg-red-50 hover:border-red-300"
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
                  className="bg-amber-50/30 rounded-xl border border-slate-200/60 p-5 space-y-4 hover:border-orange-300/60 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-red-600">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            if (
                              !isNaN(num) &&
                              num >= 1 &&
                              num <= 2147483647
                            ) {
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
    </div>
  );
}
