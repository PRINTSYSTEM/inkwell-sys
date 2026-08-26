import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Check,
  ChevronsUpDown,
  Search,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateStockInFromVendor, useCreateAuxiliaryStockIn } from "@/hooks/use-stock";
import type { StockInItemRequest } from "@/Schema/stock.schema";
import { useVendors, useCreateVendor } from "@/hooks/use-vendor";
import { useSupplierTypes } from "@/hooks/use-supplier-type";
import { useMaterials } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { toast } from "sonner";
import type { CreateVendorRequest } from "@/Schema/vendor.schema";
import type { MaterialResponse } from "@/Schema/material.schema";
import { CreateMaterialDialog } from "./components/CreateMaterialDialog";

interface FormStockInItem extends StockInItemRequest {
  calculationMethod?: "m2" | "ram";
  materialTypeId?: number;
}


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

interface MaterialSelectorProps {
  value?: number;
  onSelect: (id: string) => void;
  materials: MaterialResponse[];
  placeholder?: string;
  className?: string;
  onCreateNew?: () => void;
  vendorId?: number | null;
}

function MaterialSelector({
  value,
  onSelect,
  materials,
  placeholder = "Chọn sản phẩm / vật tư",
  className,
  onCreateNew,
  vendorId,
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter materials strictly to only those belonging to the selected vendor
  const vendorMaterials = useMemo(() => {
    if (!vendorId) return [];
    return materials.filter((m) => m.vendorId === vendorId);
  }, [materials, vendorId]);

  const selectedMaterial = materials.find((m) => m.id === value);

  if (!vendorId) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn(
          "h-8 w-full justify-between text-xs bg-slate-100/80 text-slate-400 font-normal cursor-not-allowed border-dashed border-slate-300",
          className
        )}
      >
        <span className="truncate">Vui lòng chọn NCC trước...</span>
        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-30" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-8 w-full justify-between text-xs font-normal border-slate-300 bg-white hover:bg-slate-50 transition-colors",
            selectedMaterial ? "font-semibold text-slate-800" : "text-slate-500",
            className
          )}
        >
          <span className="truncate">
            {selectedMaterial
              ? selectedMaterial.name || selectedMaterial.materialTypeName
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Tìm sản phẩm của NCC..."
              className="h-8 border-none focus:ring-0"
            />
          </div>
          {onCreateNew && (
            <div className="p-1 border-b bg-amber-50/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-100 h-8"
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5 text-amber-700" />
                + Tạo vật tư mới cho NCC này
              </Button>
            </div>
          )}
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-4 text-center text-xs text-slate-500 px-3">
              NCC này chưa có vật tư nào trong danh mục.
              {onCreateNew && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 border-amber-600/40 text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Tạo mới ngay
                  </Button>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {vendorMaterials.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.name || m.materialTypeName || ""} ${m.code || ""}`}
                  onSelect={() => {
                    onSelect(m.id?.toString() || "");
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 text-amber-600 shrink-0",
                      value === m.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-slate-800 truncate">{m.name || m.materialTypeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">SKU: {m.code || "—"} | ĐVT: {m.unit || "—"}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function StockInCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVendorId = searchParams.get("vendorId");

  const {
    mutate: createStockInFromVendor,
    isPending: isPendingStandard,
    isSuccess: isSuccessStandard,
  } = useCreateStockInFromVendor();

  const {
    mutate: createAuxiliaryStockIn,
    isPending: isPendingAuxiliary,
    isSuccess: isSuccessAuxiliary,
  } = useCreateAuxiliaryStockIn();

  const isPending = isPendingStandard || isPendingAuxiliary;
  const isSuccess = isSuccessStandard || isSuccessAuxiliary;

  const { data: vendorsData } = useVendors({ pageNumber: 1, pageSize: 100, isActive: true });
  const allVendors = (vendorsData?.items || []).filter(
    (v) =>
      v.vendorType !== "die" &&
      v.vendorType !== "plate" &&
      v.vendorType !== "printing"
  );

  const [formData, setFormData] = useState({
    vendorId: initialVendorId ? Number(initialVendorId) : null as number | null,
    notes: "",
    stockInDate: new Date().toISOString().slice(0, 16),
  });

  const selectedVendor = allVendors.find((v) => v.id === formData.vendorId);
  const isAuxiliaryVendor = !!(
    selectedVendor &&
    [
      "solvent",
      "glue",
      "ink",
      "material",
      "accessory"
    ].includes(selectedVendor.vendorType?.toLowerCase() || "")
  );

  const { data: supplierTypesResp } = useSupplierTypes({ page: 1, size: 1000 });
  const supplierTypes = supplierTypesResp?.items || [];
  const { mutate: createVendor, isPending: isCreatingVendor } =
    useCreateVendor();
  const { data: materialsData } = useMaterials({ page: 1, size: 1000 });
  const materials = materialsData?.items || [];
  const { data: materialTypesData } = useMaterialTypeList({
    pageNumber: 1,
    pageSize: 100,
    status: "active",
  });
  const materialTypes = materialTypesData?.items || [];

  // Automatically update materialTypeId on items when vendor changes to auxiliary
  useEffect(() => {
    if (isAuxiliaryVendor && materialTypes.length > 0) {
      const defaultType = materialTypes.find(t => 
        t.code?.toUpperCase() === "MATERIAL" || 
        t.name?.toUpperCase().includes("VẬT TƯ KHÁC") ||
        t.name?.toUpperCase().includes("VAT TU KHAC")
      );
      const defaultId = defaultType?.id || materialTypes[0]?.id;
      setItems((prev) => 
        prev.map((item) => ({
          ...item,
          materialTypeId: item.materialTypeId || defaultId,
          unit: item.unit || "cái",
        }))
      );
    }
  }, [formData.vendorId, isAuxiliaryVendor, materialTypes]);

  const [isCreateVendorDialogOpen, setIsCreateVendorDialogOpen] =
    useState(false);
  const [newVendorData, setNewVendorData] = useState<CreateVendorRequest>({
    name: "",
    vendorType: "material",
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

  const [items, setItems] = useState<FormStockInItem[]>([
    {
      itemName: "",
      itemCode: "",
      unit: "",
      quantity: 1,
      unitPrice: undefined,
      notes: "",
      materialId: undefined,
      orderDetailId: undefined,
      lineKind: undefined,
      proofingOrderId: undefined,
      jobCode: "",
      calculationMethod: "m2",
    },
  ]);

  const [itemErrors, setItemErrors] = useState<
    Record<number, { itemName?: string; quantity?: string }>
  >({});

  const handleAddItem = () => {
    const defaultType = materialTypes.find(t => 
      t.code?.toUpperCase() === "MATERIAL" || 
      t.name?.toUpperCase().includes("VẬT TƯ KHÁC") ||
      t.name?.toUpperCase().includes("VAT TU KHAC")
    );
    const defaultId = defaultType?.id || materialTypes[0]?.id;

    setItems([
      ...items,
      {
        itemName: "",
        itemCode: "",
        unit: isAuxiliaryVendor ? "cái" : "",
        quantity: 1,
        ramQuantity: undefined,
        unitPrice: undefined,
        notes: "",
        materialId: undefined,
        materialTypeId: isAuxiliaryVendor ? defaultId : undefined,
        orderDetailId: undefined,
        lineKind: undefined,
        proofingOrderId: undefined,
        jobCode: "",
        calculationMethod: "m2",
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

  const validateItem = (index: number, item: FormStockInItem) => {
    const errors: { itemName?: string; quantity?: string } = {};
    const trimmedName = item.itemName?.trim() || "";

    if (!trimmedName) {
      errors.itemName = "Tên vật phẩm là bắt buộc";
    } else if (trimmedName.length < 1) {
      errors.itemName = "Tên vật phẩm phải có ít nhất 1 ký tự";
    }

    if (isAuxiliaryVendor) {
      if (!item.materialTypeId) {
        errors.itemName = "Loại vật tư là bắt buộc";
      }
      if (item.quantity === undefined || item.quantity === null || isNaN(item.quantity) || item.quantity <= 0) {
        errors.quantity = "Số lượng phải lớn hơn 0";
      }
    } else {
      const isItemRam = item.calculationMethod === "ram";

      if (isItemRam) {
        if (item.ramQuantity === undefined || item.ramQuantity === null) {
          errors.quantity = "Số ram là bắt buộc";
        } else if (isNaN(item.ramQuantity)) {
          errors.quantity = "Số ram phải là số";
        } else if (item.ramQuantity <= 0) {
          errors.quantity = "Số ram phải lớn hơn 0";
        } else if (item.ramQuantity > 2147483647) {
          errors.quantity = "Số ram quá lớn";
        }
      } else {
        if (item.quantity === undefined || item.quantity === null || isNaN(item.quantity)) {
          errors.quantity = "Số lượng là bắt buộc";
        } else if (!Number.isInteger(item.quantity)) {
          errors.quantity = "Số lượng phải là số nguyên";
        } else if (item.quantity <= 0) {
          errors.quantity = "Số lượng phải lớn hơn 0";
        } else if (item.quantity > 2147483647) {
          errors.quantity = "Số lượng quá lớn (tối đa 2,147,483,647)";
        }
      }
    }

    setItemErrors((prev) => ({ ...prev, [index]: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleItemChange = (
    index: number,
    field: keyof FormStockInItem,
    value: any
  ) => {
    const newItems = [...items];
    if (field === "calculationMethod") {
      const isItemRam = value === "ram";
      newItems[index] = {
        ...newItems[index],
        calculationMethod: value as "m2" | "ram",
        unit: isItemRam ? "gram" : "",
        ramQuantity: isItemRam ? 0 : undefined,
        quantity: isItemRam ? 1 : 1,
      };
    } else {
      let normalizedValue: string | number | undefined;
      if (field === "quantity" || field === "unitPrice" || field === "ramQuantity") {
        normalizedValue = value as number | undefined;
      } else if (field === "itemName") {
        normalizedValue = (value as string) || "";
      } else {
        normalizedValue = (value as string) ?? "";
      }
      newItems[index] = { ...newItems[index], [field]: normalizedValue };
    }

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

      // Load unit and unitPrice from localStorage if available
      let loadedUnit = "";
      let loadedUnitPrice: number | undefined = undefined;
      const cached = localStorage.getItem(`material_meta_${material.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          loadedUnit = parsed.unit || "";
          loadedUnitPrice = parsed.unitPrice;
        } catch (e) {
          console.error(e);
        }
      }

      const newItems = [...items];
      const isItemRam = newItems[index].calculationMethod === "ram";

      // Priority of unitPrice: unitPrice from backend -> localStorage cached unitPrice -> current item unitPrice
      const defaultUnitPrice = (material.unitPrice !== undefined && material.unitPrice !== null)
        ? material.unitPrice
        : (loadedUnitPrice !== undefined ? loadedUnitPrice : newItems[index].unitPrice);

      const isSheet = material.width !== undefined && material.width > 0;
      const defaultUnit = isSheet ? "tờ" : "m";
      newItems[index] = {
        ...newItems[index],
        itemName: materialName,
        itemCode: generatedCode,
        unit: isItemRam ? "gram" : (loadedUnit || defaultUnit),
        unitPrice: defaultUnitPrice,
        materialId: material.id,
        length: material.length,
        width: material.width,
        lineKind: isSheet ? "sheet" : "roll",
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

    if (!formData.vendorId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }

    const formatDateWithOffset = (dateStr: string): string => {
      if (!dateStr) return new Date().toISOString();
      const date = new Date(dateStr);
      return date.toISOString();
    };

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
      return (
        !!item.materialId &&
        item.quantity !== undefined &&
        item.quantity !== null &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1
      );
    });

    if (validItems.length === 0) {
      toast.error("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ", {
        description: "Chọn sản phẩm từ nhà cung cấp và nhập số lượng ≥ 1",
      });
      return;
    }

    createStockInFromVendor(
      {
        vendorId: formData.vendorId,
        notes: formData.notes?.trim() || undefined,
        stockInDate: formData.stockInDate
          ? formatDateWithOffset(formData.stockInDate)
          : undefined,
        items: validItems.map((item) => ({
          materialId: item.materialId!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? item.unitPrice : undefined,
          notes: (item.notes || "").trim() || undefined,
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
              <div className="md:col-span-4 space-y-1.5">
                <Label htmlFor="vendorId" className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-amber-600" /> 1. CHỌN NHÀ CUNG CẤP VẬT TƯ *
                  </span>
                  {!formData.vendorId && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse border border-amber-300">
                      Bắt buộc chọn trước
                    </span>
                  )}
                </Label>
                <div className="flex gap-1.5">
                  <Select
                    value={formData.vendorId?.toString() || ""}
                    onValueChange={(value) => {
                      const newVendorId = value ? Number(value) : null;
                      setFormData({ ...formData, vendorId: newVendorId });
                      // Reset row material selections when vendor changes
                      setItems(items.map((item) => ({
                        ...item,
                        materialId: undefined,
                        itemName: "",
                        itemCode: "",
                        unit: "",
                        unitPrice: undefined,
                      })));
                    }}
                  >
                    <SelectTrigger
                      id="vendorId"
                      className={cn(
                        "h-10 text-xs font-semibold rounded-lg transition-all",
                        !formData.vendorId
                          ? "border-2 border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/30 text-amber-900 shadow-sm"
                          : "border-slate-300 bg-white text-slate-900"
                      )}
                    >
                      <SelectValue placeholder="-- Chọn Nhà Cung Cấp Vật Tư --" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVendors.map((v) => (
                        <SelectItem key={v.id} value={v.id?.toString() || "0"} className="text-xs font-medium">
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-amber-300 hover:bg-amber-50"
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
                    title="Tạo nhà cung cấp mới"
                  >
                    <UserPlus className="h-4 w-4 text-amber-700" />
                  </Button>
                </div>
              </div>

              <div className="md:col-span-3 space-y-1.5">
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

              <div className="md:col-span-3 space-y-1.5">
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

          {/* Items Table List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#93631F]" />
                <h2 className="font-bold text-slate-900">Danh sách vật phẩm ({items.length})</h2>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead className="w-[140px]">Mã hàng</TableHead>
                      <TableHead className="w-[300px]">Sản phẩm / Vật tư *</TableHead>
                      <TableHead className="w-[120px] text-right">Số lượng *</TableHead>
                      <TableHead className="w-[90px] text-center">ĐVT</TableHead>
                      <TableHead className="w-[130px] text-right">Đơn giá (đ)</TableHead>
                      <TableHead className="w-[140px] text-right">Thành tiền (đ)</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index} className="group hover:bg-slate-50/40">
                        <TableCell className="text-center font-medium text-slate-400">{index + 1}</TableCell>
                        <TableCell>
                          <div className="h-8 px-2.5 flex items-center font-mono text-xs font-semibold text-slate-700 bg-slate-100/70 border border-slate-200 rounded-md select-none truncate">
                            {item.itemCode || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <MaterialSelector
                            value={item.materialId}
                            onSelect={(v) => handleMaterialSelect(index, v)}
                            materials={materials}
                            vendorId={formData.vendorId}
                            onCreateNew={() => {
                              setCreatingMaterialIndex(index);
                              setIsCreateMaterialDialogOpen(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity ?? ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleItemChange(index, "quantity", isNaN(val) ? undefined : val);
                            }}
                            className={`h-8 text-sm text-right ${itemErrors[index]?.quantity ? "border-red-500" : ""}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="h-8 px-2 flex items-center justify-center text-xs font-medium text-slate-700 bg-slate-100/70 border border-slate-200 rounded-md select-none">
                            {item.unit || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.unitPrice ?? ""}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value ? Math.max(0, parseFloat(e.target.value)) : undefined)}
                            placeholder="0"
                            className="h-8 text-sm text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-800 text-xs">
                          {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()} đ
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.notes || ""}
                            onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                            placeholder="Ghi chú..."
                            className="h-8 text-xs italic"
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
                      <TableCell colSpan={9} className="py-3 text-center text-[#93631F] font-bold text-xs uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5">
                          <Plus className="h-4 w-4" /> + THÊM DÒNG VẬT PHẨM MỚI
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
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
                  vendorType: "material",
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
                const materialSupplierType = supplierTypes.find(
                  (t) => t.code?.toUpperCase() === "MATERIAL"
                );
                createVendor(
                  {
                    name: newVendorData.name.trim(),
                    vendorType: materialSupplierType?.code || "MATERIAL",
                    supplierTypeId: materialSupplierType?.id,
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
                        vendorType: "material",
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
      <CreateMaterialDialog
        open={isCreateMaterialDialogOpen}
        onOpenChange={setIsCreateMaterialDialogOpen}
        defaultVendorId={formData.vendorId || undefined}
        showQuantity={true}
        dimensionUnit="m"
        submitButtonClassName="bg-[#93631F] hover:bg-[#7a521a]"
        onSuccess={(id, newMaterial, unit, unitPrice) => {
          if (creatingMaterialIndex !== null && id) {
            const matName = newMaterial?.name || "";
            const matCode = newMaterial?.code || (matName ? generateMaterialCode(matName) : "");
            const matUnit = unit || newMaterial?.unit || "tờ";
            const matPrice = unitPrice !== undefined ? unitPrice : (newMaterial?.unitPrice || 0);

            // Store metadata in localStorage
            localStorage.setItem(`material_meta_${id}`, JSON.stringify({
              unit: matUnit,
              unitPrice: matPrice
            }));

            // Direct state injection so newly created material is instantly & automatically selected!
            setItems((prevItems) => {
              const updated = [...prevItems];
              if (updated[creatingMaterialIndex]) {
                updated[creatingMaterialIndex] = {
                  ...updated[creatingMaterialIndex],
                  materialId: id,
                  itemName: matName,
                  itemCode: matCode,
                  unit: matUnit,
                  unitPrice: matPrice,
                };
              }
              return updated;
            });

            toast.success(`Đã tự động chọn vật tư vừa tạo: ${matName || matCode}`);
          }
          setCreatingMaterialIndex(null);
        }}
      />
    </div>
  );
}
