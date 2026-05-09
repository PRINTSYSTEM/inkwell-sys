import { useState, useEffect } from "react";
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
  LayoutGrid,
  List,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      width: undefined,
      height: 0,
      quantity: undefined,
    }
  );

  // Helper to update generated name
  const updateMaterialName = (typeId: number, length: number, width: number | undefined) => {
    const type = materialTypes.find(t => t.id === typeId);
    const typeName = type ? (type.name || type.code) : "";
    
    let dims = "";
    if (length > 0) {
      dims = width !== undefined && width > 0 ? `${length}x${width}` : `${length}`;
    }
    
    if (typeName && dims) return `${typeName} - ${dims}`;
    return typeName || dims || "";
  };

  const [layoutMode, setLayoutMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("stockInLayoutMode");
    return (saved as "grid" | "table") || "grid";
  });

  useEffect(() => {
    localStorage.setItem("stockInLayoutMode", layoutMode);
  }, [layoutMode]);

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
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Standard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tạo phiếu nhập kho</h1>
            <p className="text-sm text-muted-foreground">Thêm vật phẩm mới vào kho một cách nhanh chóng</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="stock-in-form"
              disabled={isPending}
              size="sm"
              className="bg-[#93631F] hover:bg-[#7a521a] text-white"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {isPending ? "Đang tạo..." : "Tạo phiếu nhập kho"}
            </Button>
          </div>
        </div>

        <form id="stock-in-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Compact Main Information */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3 space-y-1.5">
                <Label htmlFor="vendorId" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Nhà cung cấp *
                </Label>
                <div className="flex gap-1">
                  <Select
                    value={formData.vendorId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, vendorId: Number(value) })}
                  >
                    <SelectTrigger id="vendorId" className="h-9">
                      <SelectValue placeholder="Chọn NCC" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVendors.map((v) => (
                        <SelectItem key={v.id} value={v.id?.toString() || "0"}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setIsCreateVendorDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="stockInDate" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Ngày nhập
                </Label>
                <Input
                  id="stockInDate"
                  type="datetime-local"
                  value={formData.stockInDate.slice(0, 16)}
                  onChange={(e) => setFormData({ ...formData, stockInDate: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="md:col-span-5 space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold text-slate-600">Ghi chú phiếu</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú nhanh..."
                  className="h-9"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="button" onClick={handleAddItem} className="w-full h-9 bg-[#93631F] hover:bg-[#7a521a] text-white shadow-sm transition-all active:scale-95 font-medium">
                  <Plus className="h-4 w-4 mr-2" /> Thêm vật phẩm
                </Button>
              </div>
            </div>
          </div>

          {/* Items Grid/Table Layout */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#93631F]" />
                <h2 className="font-bold text-slate-900">Danh sách vật phẩm ({items.length})</h2>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button
                  type="button"
                  variant={layoutMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLayoutMode("grid")}
                  className={`h-8 w-8 p-0 ${layoutMode === "grid" ? "bg-white shadow-sm text-[#93631F] hover:bg-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={layoutMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLayoutMode("table")}
                  className={`h-8 w-8 p-0 ${layoutMode === "table" ? "bg-white shadow-sm text-[#93631F] hover:bg-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {layoutMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, index) => (
                  <div key={index} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-[#93631F]/30 transition-all duration-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                          {index + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                          {item.itemName || "Sản phẩm mới"}
                        </span>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex gap-1">
                          <Select
                            value={item.materialId?.toString() || ""}
                            onValueChange={(v) => handleMaterialSelect(index, v)}
                          >
                            <SelectTrigger className="h-8 text-xs bg-slate-50/50">
                              <SelectValue placeholder="Chọn chất liệu" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((m) => (
                                <SelectItem key={m.id} value={m.id?.toString() || ""}>{m.name || m.materialTypeName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 hover:bg-[#93631F]/10 text-[#93631F] border-[#93631F]/20"
                            onClick={() => {
                              setCreatingMaterialIndex(index);
                              setNewMaterialData({ name: "", materialTypeId: 0, length: 0, width: undefined, height: 0, quantity: undefined });
                              setIsCreateMaterialDialogOpen(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Input
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                          placeholder="Tên vật phẩm *"
                          className={`h-8 text-sm ${itemErrors[index]?.itemName ? "border-red-500" : ""}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Số lượng</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                            className={`h-8 text-sm ${itemErrors[index]?.quantity ? "border-red-500" : ""}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Đơn vị</Label>
                          <Input
                            value={item.unit || ""}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                            placeholder="vị"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Đơn giá</Label>
                          <Input
                            type="number"
                            value={item.unitPrice ?? ""}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="0.00"
                            className="h-8 text-sm"
                          />
                        </div>
                        <Input
                          value={item.notes || ""}
                          onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                          placeholder="Ghi chú..."
                          className="h-8 text-xs italic"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:border-[#93631F]/30 hover:text-[#93631F] hover:bg-[#93631F]/5 transition-all group active:scale-95 min-h-[220px]"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#93631F]/10 transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-sm">Thêm dòng mới</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead className="w-[200px]">Chất liệu</TableHead>
                        <TableHead className="min-w-[200px]">Tên vật phẩm *</TableHead>
                        <TableHead className="w-[100px] text-right">Số lượng</TableHead>
                        <TableHead className="w-[80px]">ĐVT</TableHead>
                        <TableHead className="w-[120px] text-right">Đơn giá</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index} className="group">
                          <TableCell className="text-center font-medium text-slate-400">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                value={item.materialId?.toString() || ""}
                                onValueChange={(v) => handleMaterialSelect(index, v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Chọn" />
                                </SelectTrigger>
                                <SelectContent>
                                  {materials.map((m) => (
                                    <SelectItem key={m.id} value={m.id?.toString() || ""}>{m.name || m.materialTypeName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-[#93631F] hover:bg-[#93631F]/10"
                                onClick={() => {
                                  setCreatingMaterialIndex(index);
                                  setNewMaterialData({ name: "", materialTypeId: 0, length: 0, width: undefined, height: 0, quantity: undefined });
                                  setIsCreateMaterialDialogOpen(true);
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                              placeholder="Tên..."
                              className={`h-8 text-sm ${itemErrors[index]?.itemName ? "border-red-500" : ""}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                              className={`h-8 text-sm text-right ${itemErrors[index]?.quantity ? "border-red-500" : ""}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit || ""}
                              onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                              placeholder="vị"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice ?? ""}
                              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="0"
                              className="h-8 text-sm text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.notes || ""}
                              onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                              placeholder="..."
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="hover:bg-slate-50/50 cursor-pointer" onClick={handleAddItem}>
                        <TableCell colSpan={8} className="py-3 text-center text-[#93631F] font-bold text-xs uppercase tracking-wider">
                          <div className="flex items-center justify-center gap-1.5">
                            <Plus className="h-4 w-4" /> Thêm dòng vật phẩm mới
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
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
              className="cursor-pointer transition-colors duration-200 bg-[#93631F] hover:bg-[#7a521a]"
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
                readOnly
                className="bg-slate-50 font-medium"
                placeholder="Tên sẽ được tự động tạo từ loại và kích thước"
              />
              {newMaterialData.name &&
                generateMaterialCode(newMaterialData.name) && (
                  <div className="mt-1.5 p-2 bg-slate-50 rounded-md border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        Mã tự động:
                      </span>
                      <code className="text-xs font-mono text-[#93631F] bg-[#93631F]/5 px-2 py-0.5 rounded">
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
                onValueChange={(value) => {
                  const typeId = Number(value);
                  setNewMaterialData({
                    ...newMaterialData,
                    materialTypeId: typeId,
                    name: updateMaterialName(typeId, newMaterialData.length, newMaterialData.width)
                  });
                }}
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
            <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) => {
                    const length = parseFloat(e.target.value) || 0;
                    setNewMaterialData({
                      ...newMaterialData,
                      length,
                      name: updateMaterialName(newMaterialData.materialTypeId, length, newMaterialData.width)
                    });
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialWidth">Chiều rộng (m)</Label>
                <Input
                  id="materialWidth"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMaterialData.width || ""}
                  onChange={(e) => {
                    const width = e.target.value === "" ? undefined : parseFloat(e.target.value) || 0;
                    setNewMaterialData({
                      ...newMaterialData,
                      width,
                      name: updateMaterialName(newMaterialData.materialTypeId, newMaterialData.length, width)
                    });
                  }}
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
                  width: undefined,
                  height: 0,
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
                        width: undefined,
                        height: 0,
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
