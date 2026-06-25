import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, AlertCircle, Minus, Info, Check, ChevronsUpDown } from "lucide-react";
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
import { toast } from "sonner";
import { useMaterials } from "@/hooks/use-material";
import { useActivePrintingVendors } from "@/hooks/use-vendor";
import {
  useCreateProductionStockOutByVendor,
  useCreateOutsourceStockOut,
  useCreateReturnVendorStockOut,
  useCreateAdjustmentStockOut,
} from "@/hooks/use-stock";
import { usePendingMaterialProductionOrders } from "@/hooks/use-production";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface StockOutByVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVendorId: number | null;
  vendors: any[];
  refetch: () => void;
}

interface FormItem {
  materialId: number | null;
  jobCode: string;
  quantity: number;
  notes: string;
}

interface MaterialSelectorProps {
  value: number | null;
  onSelect: (id: number) => void;
  materials: any[];
  placeholder?: string;
  className?: string;
}

function MaterialSelector({
  value,
  onSelect,
  materials,
  placeholder = "Chọn vật tư",
  className,
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedMaterial = materials.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between text-xs bg-white border-slate-200 rounded-lg font-normal hover:bg-slate-50/50 cursor-pointer",
            className
          )}
        >
          <span className="truncate">
            {selectedMaterial
              ? `${selectedMaterial.name || ""}${selectedMaterial.size ? ` (${selectedMaterial.size})` : ""}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="w-full">
          <CommandInput
            placeholder="Tìm vật tư..."
            className="h-9 w-full bg-transparent text-xs"
          />
          <CommandList className="max-h-[220px]">
            <CommandEmpty>Không tìm thấy vật tư nào.</CommandEmpty>
            <CommandGroup>
              {materials.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.name || ""} ${m.size || ""} ${m.id}`}
                  onSelect={() => {
                    onSelect(m.id);
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 text-rose-600",
                      value === m.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>
                    {m.name} {m.size ? `(${m.size})` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface JobCodeSelectorProps {
  value: string;
  onSelect: (code: string) => void;
  productionOrders: any[];
  placeholder?: string;
  className?: string;
}

function JobCodeSelector({
  value,
  onSelect,
  productionOrders,
  placeholder = "Mã bài...",
  className,
}: JobCodeSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between text-xs bg-white border-slate-200 rounded-lg font-normal hover:bg-slate-50/50 cursor-pointer px-3",
            className
          )}
        >
          <span className="truncate font-mono">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command className="w-full">
          <CommandInput
            placeholder="Tìm mã bài..."
            className="h-9 w-full bg-transparent text-xs border-none focus:ring-0 focus-visible:ring-0"
          />
          <CommandList className="max-h-[220px]">
            <CommandEmpty>Không tìm thấy mã bài nào.</CommandEmpty>
            <CommandGroup>
              {productionOrders.map((po) => (
                <CommandItem
                  key={po.id}
                  value={`${po.proofingOrderCode || ""} ${po.customerName || ""} ${po.id}`}
                  onSelect={() => {
                    onSelect(po.proofingOrderCode || "");
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer flex flex-col items-start gap-0.5 py-1.5 px-3 hover:bg-slate-50"
                >
                  <div className="flex items-center w-full justify-between">
                    <span className="font-bold font-mono text-slate-700">
                      {po.proofingOrderCode || "N/A"}
                    </span>
                    {value === po.proofingOrderCode && (
                      <Check className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  {po.customerName && (
                    <span className="text-[10px] text-slate-500 truncate w-full">
                      KH: {po.customerName}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function StockOutByVendorDialog({
  open,
  onOpenChange,
  selectedVendorId,
  vendors,
  refetch,
}: StockOutByVendorDialogProps) {
  const navigate = useNavigate();
  // Purpose: production, outsource, return_vendor, adjustment
  const [purpose, setPurpose] = useState<string>("production");

  // General fields
  const [receiverName, setReceiverName] = useState("");
  const [exportReason, setExportReason] = useState("Xuất sản xuất");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Items table
  const [items, setItems] = useState<FormItem[]>([
    { materialId: null, jobCode: "", quantity: 1, notes: "" },
  ]);

  // For outsource
  const [outsourceVendorId, setOutsourceVendorId] = useState<number | null>(null);
  const [receiverPhone, setReceiverPhone] = useState("");

  const { data: printingVendorsData } = useActivePrintingVendors();
  const printingVendors = printingVendorsData || [];

  const handlePrintingVendorSelect = (val: string) => {
    const pVendorId = Number(val);
    setOutsourceVendorId(pVendorId);
    const vendor = printingVendors.find((v) => v.id === pVendorId);
    if (vendor) {
      setWarehouseName(vendor.name || "");
      setReceiverName(vendor.name || "");
      setWarehouseAddress(vendor.address || "");
      setReceiverPhone(vendor.phone || "");
    }
  };

  // For adjustment (single item)
  const [adjMaterialId, setAdjMaterialId] = useState<number | null>(null);
  const [adjQuantity, setAdjQuantity] = useState<number>(1);
  const [adjReason, setAdjReason] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  // Mutations
  const { mutateAsync: createProductionStockOut, isPending: isPendingProduction } =
    useCreateProductionStockOutByVendor();
  const { mutateAsync: createOutsourceStockOut, isPending: isPendingOutsource } =
    useCreateOutsourceStockOut();
  const { mutateAsync: createReturnVendorStockOut, isPending: isPendingReturn } =
    useCreateReturnVendorStockOut();
  const { mutateAsync: createAdjustmentStockOut, isPending: isPendingAdjustment } =
    useCreateAdjustmentStockOut();

  const isPending =
    isPendingProduction ||
    isPendingOutsource ||
    isPendingReturn ||
    isPendingAdjustment;

  // Fetch materials for selected vendor (limit 1000)
  const { data: materialsData, isLoading: isLoadingMaterials } = useMaterials({
    vendorId: selectedVendorId || undefined,
    size: 1000,
  });
  const vendorMaterials = materialsData?.items || [];

  // Load pending material production orders for Mã bài selector
  const { data: pendingProdOrdersData } = usePendingMaterialProductionOrders({
    pageSize: 1000,
  });
  const pendingProdOrders = pendingProdOrdersData?.items || [];

  // Filter materials based on purpose
  // Xuất sản xuất: currently applied for sheet (tờ)
  const filteredMaterials = useMemo(() => {
    if (purpose === "production") {
      return vendorMaterials.filter((item) => {
        const unit = (item.unit || "").toLowerCase();
        const name = (item.name || "").toLowerCase();
        const isRoll =
          unit.includes("cuộn") ||
          unit.includes("cuon") ||
          name.includes("cuộn") ||
          name.includes("cuon");
        return !isRoll;
      });
    }
    return vendorMaterials;
  }, [vendorMaterials, purpose]);

  // Reset form when dialog opens/closes or vendor changes
  useEffect(() => {
    if (open) {
      setPurpose("production");
      setReceiverName("");
      setExportReason("Xuất sản xuất");
      setWarehouseName("");
      setWarehouseAddress("");
      setNotes("");
      setItems([{ materialId: null, jobCode: "", quantity: 1, notes: "" }]);
      setAdjMaterialId(null);
      setAdjQuantity(1);
      setAdjReason("");
      setAdjNotes("");
      setOutsourceVendorId(null);
      setReceiverPhone("");
    }
  }, [open, selectedVendorId]);

  // Prefill return_vendor fields when purpose is selected
  useEffect(() => {
    if (purpose === "return_vendor" && selectedVendorId) {
      const supplier = vendors.find((v) => v.id === selectedVendorId);
      if (supplier) {
        setWarehouseName(supplier.name || "");
        setWarehouseAddress(supplier.address || "");
      }
    }
  }, [purpose, selectedVendorId, vendors]);

  const vendorName = useMemo(() => {
    if (!selectedVendorId) return "";
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    return vendor?.name || `NCC #${selectedVendorId}`;
  }, [selectedVendorId, vendors]);

  const handleAddItem = () => {
    setItems([...items, { materialId: null, jobCode: "", quantity: 1, notes: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Phải có ít nhất một vật tư trong danh sách!");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getMaterialUnit = (materialId: number | null) => {
    if (!materialId) return "—";
    const mat = vendorMaterials.find((m) => m.id === materialId);
    return mat?.unit || "—";
  };

  const getMaterialStock = (materialId: number | null) => {
    if (!materialId) return null;
    const mat = vendorMaterials.find((m) => m.id === materialId);
    return mat?.currentStock ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;

    // 1. Validate based on purpose
    if (purpose === "production") {
      if (!receiverName.trim()) {
        toast.error("Vui lòng nhập họ và tên người nhận hàng!");
        return;
      }
      if (!exportReason.trim()) {
        toast.error("Vui lòng nhập lý do xuất hàng!");
        return;
      }
      
      const invalidItem = items.some((item) => !item.materialId || !item.quantity || item.quantity <= 0);
      if (invalidItem) {
        toast.error("Vui lòng kiểm tra lại danh sách vật tư. Vật tư và số lượng lớn hơn 0 là bắt buộc!");
        return;
      }

      // Check stock
      for (const item of items) {
        const stock = getMaterialStock(item.materialId);
        if (stock !== null && item.quantity > stock) {
          const matName = vendorMaterials.find((m) => m.id === item.materialId)?.name || "Vật tư";
          toast.error(`Số lượng xuất vật tư "${matName}" vượt quá tồn kho hiện tại (${stock})!`);
          return;
        }
      }

      // Prepare payload
      const payload = {
        vendorId: selectedVendorId,
        receiverName: receiverName.trim(),
        exportReason: exportReason.trim(),
        stockOutDate: new Date().toISOString(),
        items: items.map((item) => ({
          materialId: item.materialId,
          quantity: Math.round(item.quantity),
          notes: `[Mã bài: ${item.jobCode.trim() || "—"}] ${item.notes.trim()}`.trim(),
        })),
      };

      try {
        const res = await createProductionStockOut(payload);
        onOpenChange(false);
        refetch();
        if (res?.id) {
          navigate(`/stock/stock-outs/${res.id}`);
        }
      } catch (err) {
        console.error(err);
      }

    } else if (purpose === "outsource" || purpose === "return_vendor") {
      if (purpose === "outsource" && !outsourceVendorId) {
        toast.error("Vui lòng chọn nhà in gia công!");
        return;
      }
      if (purpose === "return_vendor" && !warehouseAddress.trim()) {
        toast.error("Vui lòng nhập địa chỉ kho nhận!");
        return;
      }
      if (!exportReason.trim()) {
        toast.error("Vui lòng nhập lý do xuất hàng!");
        return;
      }

      const invalidItem = items.some((item) => !item.materialId || !item.quantity || item.quantity <= 0);
      if (invalidItem) {
        toast.error("Vui lòng kiểm tra lại danh sách vật tư. Vật tư và số lượng lớn hơn 0 là bắt buộc!");
        return;
      }

      // Check stock
      for (const item of items) {
        const stock = getMaterialStock(item.materialId);
        if (stock !== null && item.quantity > stock) {
          const matName = vendorMaterials.find((m) => m.id === item.materialId)?.name || "Vật tư";
          toast.error(`Số lượng xuất vật tư "${matName}" vượt quá tồn kho hiện tại (${stock})!`);
          return;
        }
      }

      const payload = {
        vendorId: purpose === "outsource" ? outsourceVendorId : selectedVendorId,
        exportReason: exportReason.trim(),
        warehouseName: warehouseName.trim() || undefined,
        warehouseAddress: warehouseAddress.trim() || undefined,
        stockOutDate: new Date().toISOString(),
        items: items.map((item) => ({
          materialId: item.materialId,
          quantity: Math.round(item.quantity),
          notes: item.notes.trim() || undefined,
        })),
      };

      try {
        let res;
        if (purpose === "outsource") {
          res = await createOutsourceStockOut(payload);
        } else {
          res = await createReturnVendorStockOut(payload);
        }
        onOpenChange(false);
        refetch();
        if (res?.id) {
          navigate(`/stock/stock-outs/${res.id}`);
        }
      } catch (err) {
        console.error(err);
      }

    } else if (purpose === "adjustment") {
      if (!adjMaterialId) {
        toast.error("Vui lòng chọn vật tư cần xuất điều chỉnh!");
        return;
      }
      if (!adjQuantity || adjQuantity <= 0) {
        toast.error("Số lượng xuất phải lớn hơn 0!");
        return;
      }
      if (!adjReason.trim()) {
        toast.error("Vui lòng nhập lý do xuất điều chỉnh!");
        return;
      }

      const stock = getMaterialStock(adjMaterialId);
      if (stock !== null && adjQuantity > stock) {
        toast.error(`Số lượng xuất điều chỉnh vượt quá tồn kho hiện tại (${stock})!`);
        return;
      }

      // Combine reason and notes into notes payload
      const combinedNotes = [
        `Lý do: ${adjReason.trim()}`,
        adjNotes.trim() ? `Ghi chú: ${adjNotes.trim()}` : ""
      ].filter(Boolean).join(" - ");

      const payload = {
        materialId: adjMaterialId,
        quantity: Math.round(adjQuantity),
        notes: combinedNotes,
        stockOutDate: new Date().toISOString(),
      };

      try {
        const res = await createAdjustmentStockOut(payload);
        onOpenChange(false);
        refetch();
        if (res?.id) {
          navigate(`/stock/stock-outs/${res.id}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-xl border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="bg-slate-50 border-b border-slate-100 p-5 shrink-0">
          <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
            <Minus className="h-5 w-5 text-rose-600" />
            Tạo phiếu xuất kho theo NCC
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Xuất kho các vật tư của nhà cung cấp <span className="font-bold text-slate-700">{vendorName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Chọn loại nghiệp vụ xuất kho */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Lý do xuất kho (Loại nghiệp vụ)</Label>
                <Select
                  value={purpose}
                  onValueChange={(val) => {
                    setPurpose(val);
                    if (val === "production") {
                      setExportReason("Xuất sản xuất");
                    } else if (val === "outsource") {
                      setExportReason("Xuất in gia công");
                    } else if (val === "return_vendor") {
                      setExportReason("Xuất trả NCC");
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-xs border-slate-200 rounded-lg cursor-pointer bg-white">
                    <SelectValue placeholder="Chọn lý do xuất kho" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="production" className="text-xs cursor-pointer">Xuất sản xuất</SelectItem>
                    <SelectItem value="outsource" className="text-xs cursor-pointer">Xuất in gia công</SelectItem>
                    <SelectItem value="return_vendor" className="text-xs cursor-pointer">Xuất trả hàng nhà cung cấp</SelectItem>
                    <SelectItem value="adjustment" className="text-xs cursor-pointer">Xuất điều chỉnh giảm kho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic sections based on purpose */}
            {purpose === "production" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Họ và tên người nhận hàng <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Nhập tên người nhận hàng..."
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="h-10 text-xs border-slate-200 focus-visible:ring-rose-500 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Lý do xuất hàng <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ví dụ: Xuất sản xuất, Xuất test mẫu..."
                    value={exportReason}
                    onChange={(e) => setExportReason(e.target.value)}
                    className="h-10 text-xs border-slate-200 focus-visible:ring-rose-500 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}

            {purpose === "outsource" && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Chọn nhà in gia công <span className="text-red-500">*</span></Label>
                    <Select
                      value={outsourceVendorId ? String(outsourceVendorId) : ""}
                      onValueChange={handlePrintingVendorSelect}
                    >
                      <SelectTrigger className="h-10 text-xs border-slate-200 bg-white rounded-lg cursor-pointer">
                        <SelectValue placeholder="Chọn nhà in gia công" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg max-h-[220px]">
                        {printingVendors.map((v: any) => (
                          <SelectItem key={v.id} value={String(v.id)} className="text-xs cursor-pointer">
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Lý do xuất hàng <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Ví dụ: Xuất in gia công..."
                      value={exportReason}
                      onChange={(e) => setExportReason(e.target.value)}
                      className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Họ tên người nhận hàng</Label>
                    <Input
                      placeholder="Họ tên người nhận..."
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Số điện thoại</Label>
                    <Input
                      placeholder="Số điện thoại..."
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Địa chỉ nhận</Label>
                    <Input
                      placeholder="Địa chỉ..."
                      value={warehouseAddress}
                      onChange={(e) => setWarehouseAddress(e.target.value)}
                      className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {purpose === "return_vendor" && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Tên kho nhận</Label>
                    <Input
                      placeholder="Ví dụ: Kho nhận NCC..."
                      value={warehouseName}
                      onChange={(e) => setWarehouseName(e.target.value)}
                      className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Lý do xuất hàng <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Ví dụ: Xuất trả ncc..."
                      value={exportReason}
                      onChange={(e) => setExportReason(e.target.value)}
                      className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Địa chỉ kho nhận <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Nhập địa chỉ nhận..."
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    className="h-10 text-xs border-slate-200 bg-white focus-visible:ring-rose-500 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}

            {/* 2. Items List */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-slate-400" />
                  Danh sách vật tư đề xuất xuất kho
                </h3>
                {purpose !== "adjustment" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                    className="h-8 text-[11px] px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer font-bold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm dòng
                  </Button>
                )}
              </div>

              {purpose === "adjustment" ? (
                /* Adjustment: Simple single item form */
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700">Vật tư cần điều chỉnh giảm</Label>
                      <MaterialSelector
                        value={adjMaterialId}
                        onSelect={(val) => setAdjMaterialId(val)}
                        materials={vendorMaterials}
                        placeholder="Chọn vật tư"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700">Tồn kho hiện tại</Label>
                      <div className="h-10 px-3 bg-white border border-slate-200 rounded-lg flex items-center font-bold text-slate-500 font-mono">
                        {adjMaterialId ? `${getMaterialStock(adjMaterialId)} ${getMaterialUnit(adjMaterialId)}` : "—"}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700">Số lượng giảm <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Số lượng..."
                        value={adjQuantity || ""}
                        onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                        className="h-10 font-mono font-bold text-rose-600 focus-visible:ring-rose-500 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700">Lý do điều chỉnh (bắt buộc) <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Lý do điều chỉnh giảm kho (ví dụ: phát hiện lỗi hao hụt vật tư)..."
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        className="h-10 bg-white border-slate-200 focus-visible:ring-rose-500 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700">Ghi chú</Label>
                      <Input
                        placeholder="Ghi chú thêm về điều chỉnh..."
                        value={adjNotes}
                        onChange={(e) => setAdjNotes(e.target.value)}
                        className="h-10 bg-white border-slate-200 focus-visible:ring-rose-500 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Excel-like Table for production, outsource, return_vendor */
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-[50px] text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Chọn vật tư</th>
                        <th className="py-2.5 px-3 w-[80px]">ĐVT</th>
                        <th className="py-2.5 px-3 w-[120px] text-right">Tồn hiện tại</th>
                        {purpose === "production" && <th className="py-2.5 px-3 w-[140px]">Mã bài</th>}
                        <th className="py-2.5 px-3 w-[120px]">Số lượng xuất</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Ghi chú dòng</th>
                        <th className="py-2.5 px-3 w-[60px] text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-semibold text-slate-400">{index + 1}</td>
                          <td className="py-2 px-3">
                            <MaterialSelector
                              value={item.materialId}
                              onSelect={(val) => handleItemChange(index, "materialId", val)}
                              materials={filteredMaterials}
                              placeholder="Chọn vật tư"
                              className="h-9"
                            />
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-500">{getMaterialUnit(item.materialId)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
                            {item.materialId ? getMaterialStock(item.materialId)?.toLocaleString() : "—"}
                          </td>
                          {purpose === "production" && (
                            <td className="py-2 px-3">
                              <JobCodeSelector
                                value={item.jobCode}
                                onSelect={(val) => handleItemChange(index, "jobCode", val)}
                                productionOrders={pendingProdOrders}
                                placeholder="Mã bài..."
                                className="h-9"
                              />
                            </td>
                          )}
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Số lượng..."
                              value={item.quantity || ""}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="h-9 text-xs font-mono font-bold text-rose-600 border-slate-200 focus-visible:ring-rose-500 rounded-lg bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              placeholder="Ghi chú thêm..."
                              value={item.notes}
                              onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                              className="h-9 text-xs border-slate-200 focus-visible:ring-rose-500 rounded-lg bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 text-xs rounded-lg cursor-pointer font-bold border-slate-200 bg-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending || isLoadingMaterials}
              className="h-10 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer border-none shadow-md shadow-rose-100"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 mr-1" />
                  Lưu phiếu xuất
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
