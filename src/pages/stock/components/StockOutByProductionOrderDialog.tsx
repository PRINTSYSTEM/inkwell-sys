import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Trash2, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useCreateStockOutForProductionOrder } from "@/hooks/use-stock";
import { usePendingMaterialProductionOrders } from "@/hooks/use-production";
import { useProofingOrders } from "@/hooks/use-proofing-order";
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

interface StockOutByProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch: () => void;
}

interface FormItem {
  materialId: number | null;
  quantity: number;
  cutLength?: number;
  cutWidth?: number;
  quantityProduced?: number;
}

function MaterialSelector({
  value,
  onSelect,
  materials,
  placeholder = "Chọn vật tư",
  className,
  disabled = false,
}: {
  value: number | null;
  onSelect: (id: number) => void;
  materials: any[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedMaterial = materials.find((m) => m.id === value);

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between text-xs bg-white border-slate-200 rounded-lg font-normal hover:bg-slate-50/50 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 px-3",
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
            className="h-9 w-full bg-transparent text-xs border-none focus:ring-0 focus-visible:ring-0"
          />
          <CommandList 
            className="max-h-[220px]"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
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

function ProductionOrderSelector({
  value,
  onSelect,
  productionOrders,
  placeholder = "Chọn lệnh sản xuất...",
}: {
  value: number | null;
  onSelect: (id: number, code: string) => void;
  productionOrders: any[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = productionOrders.find((po) => po.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between text-xs bg-white border-slate-200 rounded-lg font-normal hover:bg-slate-50/50 cursor-pointer"
        >
          <span className="truncate">
            {selected
              ? `${selected.proofingOrderCode || `PO-${selected.id}`}${selected.customerName ? ` - ${selected.customerName}` : ""}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <Command className="w-full">
          <CommandInput
            placeholder="Tìm mã bài, khách hàng..."
            className="h-9 w-full bg-transparent text-xs border-none focus:ring-0 focus-visible:ring-0"
          />
          <CommandList 
            className="max-h-[350px]"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>Không tìm thấy lệnh sản xuất.</CommandEmpty>
            <CommandGroup>
              {productionOrders.map((po) => (
                <CommandItem
                  key={po.id}
                  value={`${po.proofingOrderCode || ""} ${po.customerName || ""} ${po.paperName || ""} ${po.id}`}
                  onSelect={() => {
                    onSelect(po.id, po.proofingOrderCode || "");
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer flex flex-col items-start gap-1 py-2.5 px-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center w-full justify-between">
                    <span className="font-bold font-mono text-slate-700 text-sm">
                      {po.proofingOrderCode || `PO-${po.id}`}
                    </span>
                    {value === po.id && (
                      <Check className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  {po.customerName && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      KH: {po.customerName}
                    </span>
                  )}
                  {po.totalQuantity !== undefined && (
                    <div className="mt-2 w-full bg-amber-50/50 dark:bg-slate-900 rounded-lg p-2 space-y-1.5 text-[10px] text-slate-700 dark:text-slate-400 border border-amber-100 dark:border-slate-800">
                      <div className="font-bold text-amber-800 dark:text-amber-400 mb-0.5 border-b border-amber-100 pb-0.5">Thông tin bình bài:</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full font-sans">
                        <div>
                          <span className="text-slate-500 font-medium font-sans">Số giấy in:</span>
                          <span className="font-bold ml-1 text-slate-800">{po.totalQuantity?.toLocaleString()} tờ</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium font-sans">Mã hàng:</span>
                          <span className="font-bold ml-1 text-slate-800">{po.designCount || 0} mã</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium font-sans">Khổ giấy:</span>
                          <span className="font-bold ml-1 text-slate-800">{po.paperSizeName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium font-sans">Định lượng:</span>
                          <span className="font-bold ml-1 text-slate-800">{po.basisWeight || "—"} gsm</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 font-medium font-sans">Chất liệu:</span>
                          <span className="font-semibold ml-1 text-slate-800">{po.paperName} {po.materialCode ? `(${po.materialCode})` : ""}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 font-medium font-sans">Loại thiết kế:</span>
                          <span className="font-semibold ml-1 text-slate-800">{po.designTypeName || "—"}</span>
                        </div>
                      </div>
                    </div>
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

export function StockOutByProductionOrderDialog({
  open,
  onOpenChange,
  refetch,
}: StockOutByProductionOrderDialogProps) {
  const navigate = useNavigate();

  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<number | null>(null);
  const [selectedProductionOrderCode, setSelectedProductionOrderCode] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [exportReason, setExportReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([
    { materialId: null, quantity: 1 },
  ]);

  const { data: materialsData, isLoading: isLoadingMaterials } = useMaterials({
    page: 1,
    size: 1000,
  });
  const allMaterials = materialsData?.items || [];

  const { data: pendingProdOrdersData, isLoading: isLoadingOrders } = usePendingMaterialProductionOrders({
    pageSize: 1000,
  });
  const pendingProdOrders = pendingProdOrdersData?.items || [];

  const { data: proofingResp, isLoading: isLoadingProofing } = useProofingOrders({
    pageSize: 1000,
  });
  const proofingOrders = proofingResp?.items || [];

  const proofingMap = useMemo(() => {
    const map = new Map<number, any>();
    proofingOrders.forEach((po) => {
      if (po.id) {
        map.set(po.id, po);
      }
    });
    return map;
  }, [proofingOrders]);

  const enrichedProductionOrders = useMemo(() => {
    return pendingProdOrders.map((po) => {
      const proofing = po.proofingOrderId ? proofingMap.get(po.proofingOrderId) : null;
      return {
        ...po,
        paperName: proofing?.materialType?.name || "Giấy in",
        materialCode: proofing?.materialType?.code || "",
        totalQuantity: proofing?.totalQuantity || 0,
        paperSizeName: proofing?.rollWidth 
          ? `Cuộn (Rộng: ${proofing.rollWidth} mm)` 
          : (proofing?.paperSize?.name || proofing?.customPaperSize || "—"),
        designTypeName: proofing?.designType?.name || "—",
        basisWeight: proofing?.basisWeight || po.basisWeight || 0,
        designCount: po.items?.length || proofing?.proofingOrderDesigns?.length || 0,
      };
    });
  }, [pendingProdOrders, proofingMap]);

  const { mutateAsync: createStockOut, isPending } = useCreateStockOutForProductionOrder();

  useEffect(() => {
    if (open) {
      setSelectedProductionOrderId(null);
      setSelectedProductionOrderCode("");
      setReceiverName("");
      setExportReason("");
      setNotes("");
      setItems([{ materialId: null, quantity: 1 }]);
    }
  }, [open]);

  const getMaterialUnit = (materialId: number | null) => {
    if (!materialId) return "—";
    const mat = allMaterials.find((m) => m.id === materialId);
    return mat?.unit || "—";
  };

  const getMaterialStock = (materialId: number | null) => {
    if (!materialId) return null;
    const mat = allMaterials.find((m) => m.id === materialId);
    return mat?.currentStock ?? 0;
  };

  const handleAddItem = () => {
    setItems([...items, { materialId: null, quantity: 1 }]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductionOrderId) {
      toast.error("Vui lòng chọn lệnh sản xuất!");
      return;
    }

    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập tên người nhận!");
      return;
    }

    if (!exportReason.trim()) {
      toast.error("Vui lòng nhập lý do xuất kho!");
      return;
    }

    const invalidItem = items.some((item) => !item.materialId || !item.quantity || item.quantity <= 0);
    if (invalidItem) {
      toast.error("Vui lòng kiểm tra lại danh sách vật tư!");
      return;
    }

    for (const item of items) {
      const mat = allMaterials.find((m) => m.id === item.materialId);
      if (mat?.type === "cuon" && (!item.cutLength || !item.cutWidth)) {
        toast.error(`Vui lòng nhập kích thước cắt (Dài × Rộng) cho vật tư cuộn "${mat.name}"!`);
        return;
      }
    }

    for (const item of items) {
      const stock = getMaterialStock(item.materialId);
      if (stock !== null && item.quantity > stock) {
        const matName = allMaterials.find((m) => m.id === item.materialId)?.name || "Vật tư";
        toast.error(`Số lượng xuất vật tư "${matName}" vượt quá tồn kho hiện tại (${stock})!`);
        return;
      }
    }

    try {
      const res = await createStockOut({
        productionOrderId: selectedProductionOrderId,
        data: {
          receiverName: receiverName.trim(),
          exportReason: exportReason.trim(),
          stockOutDate: new Date().toISOString(),
          notes: notes.trim() || undefined,
          items: items.map((item) => {
            const bodyItem: any = {
              materialId: item.materialId,
              quantity: Math.round(item.quantity),
            };
            if (item.cutLength && item.cutWidth) {
              bodyItem.cutLength = item.cutLength;
              bodyItem.cutWidth = item.cutWidth;
              bodyItem.unit = "m";
              if (item.quantityProduced) {
                bodyItem.quantityProduced = Math.round(item.quantityProduced);
              }
            }
            return bodyItem;
          }),
        },
      });
      onOpenChange(false);
      refetch();
      if (res?.id) {
        navigate(`/stock/stock-outs/${res.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] rounded-xl border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="bg-slate-50 border-b border-slate-100 p-5 shrink-0">
          <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
            <Plus className="h-5 w-5 text-rose-600" />
            Tạo phiếu xuất sản xuất theo lệnh SX
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Xuất kho vật tư cho lệnh sản xuất. Có thể chọn vật tư từ nhiều nhà cung cấp khác nhau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Chọn lệnh sản xuất <span className="text-red-500">*</span>
                </Label>
                <ProductionOrderSelector
                  value={selectedProductionOrderId}
                  onSelect={(id, code) => {
                    setSelectedProductionOrderId(id);
                    setSelectedProductionOrderCode(code);
                    setExportReason(`Xuất nguyên liệu cho LSX #${code}`);

                    // Auto-fill material and quantity if possible
                    const po = enrichedProductionOrders.find((p) => p.id === id);
                    if (po) {
                      // Look for a material matching the po's materialCode or paperName
                      const matchedMaterial = allMaterials.find(
                        (m) =>
                          (po.materialCode && m.code === po.materialCode) ||
                          (po.paperName && m.name === po.paperName)
                      );

                      if (matchedMaterial) {
                        setItems([
                          {
                            materialId: matchedMaterial.id,
                            quantity: po.totalQuantity || 1,
                          },
                        ]);
                      } else {
                        // Reset items to empty selector with quantity from PO
                        setItems([{ materialId: null, quantity: po.totalQuantity || 1 }]);
                      }
                    }
                  }}
                  productionOrders={enrichedProductionOrders}
                  placeholder={(isLoadingOrders || isLoadingProofing) ? "Đang tải..." : "Chọn lệnh sản xuất..."}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Người nhận <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Nhập tên người nhận..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="h-10 text-xs border-slate-200 focus-visible:ring-rose-500 rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Lý do xuất kho <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Nhập lý do xuất..."
                  value={exportReason}
                  onChange={(e) => setExportReason(e.target.value)}
                  className="h-10 text-xs border-slate-200 focus-visible:ring-rose-500 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Show Selected Production Order Info Box */}
            {selectedProductionOrderId && (() => {
              const po = enrichedProductionOrders.find((p) => p.id === selectedProductionOrderId);
              if (!po) return null;
              return (
                <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-700 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="font-bold text-amber-900 border-b border-amber-100 pb-1.5 flex items-center gap-1.5 font-sans">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Thông tin lệnh sản xuất:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 font-sans">
                    {po.customerName && (
                      <div>
                        <span className="text-slate-500 font-medium font-sans">Khách hàng:</span>
                        <span className="font-bold ml-1 text-slate-800">{po.customerName}</span>
                      </div>
                    )}
                    {po.totalQuantity !== undefined && (
                      <div>
                        <span className="text-slate-500 font-medium font-sans">Số giấy in:</span>
                        <span className="font-bold ml-1 text-slate-800">{po.totalQuantity?.toLocaleString()} tờ</span>
                      </div>
                    )}
                    {po.designCount !== undefined && (
                      <div>
                        <span className="text-slate-500 font-medium font-sans">Mã hàng:</span>
                        <span className="font-bold ml-1 text-slate-800">{po.designCount} mã</span>
                      </div>
                    )}
                    {po.paperSizeName && (
                      <div>
                        <span className="text-slate-500 font-medium font-sans">Khổ giấy:</span>
                        <span className="font-bold ml-1 text-slate-800">{po.paperSizeName}</span>
                      </div>
                    )}
                    {po.basisWeight && (
                      <div>
                        <span className="text-slate-500 font-medium font-sans">Định lượng:</span>
                        <span className="font-bold ml-1 text-slate-800">{po.basisWeight} gsm</span>
                      </div>
                    )}
                    {po.paperName && (
                      <div className="col-span-2 font-sans">
                        <span className="text-slate-500 font-medium font-sans">Chất liệu:</span>
                        <span className="font-semibold ml-1 text-slate-800">{po.paperName} {po.materialCode ? `(${po.materialCode})` : ""}</span>
                      </div>
                    )}
                    {po.designTypeName && (
                      <div className="col-span-2 font-sans">
                        <span className="text-slate-500 font-medium font-sans">Loại thiết kế:</span>
                        <span className="font-semibold ml-1 text-slate-800">{po.designTypeName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Ghi chú</Label>
              <Textarea
                placeholder="Ghi chú cho phiếu xuất..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[60px] border-slate-200 focus-visible:ring-rose-500 rounded-lg"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh sách vật tư xuất kho
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="h-8 text-[11px] px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm dòng
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left text-xs border-collapse">
                   <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-[50px] text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Chọn vật tư</th>
                      <th className="py-2.5 px-3 w-[60px]">ĐVT</th>
                      <th className="py-2.5 px-3 w-[90px] text-right">Tồn hiện tại</th>
                      <th className="py-2.5 px-3 w-[100px]">SL xuất</th>
                      <th className="py-2.5 px-3 w-[150px]">Dài × Rộng (cm)</th>
                      <th className="py-2.5 px-3 w-[110px]">SL tờ ra</th>
                      <th className="py-2.5 px-3 w-[60px] text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const selectedMaterial = item.materialId
                        ? allMaterials.find((m) => m.id === item.materialId)
                        : null;
                      const isCuon = selectedMaterial?.type === "cuon";

                      return (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-semibold text-slate-400">{index + 1}</td>
                          <td className="py-2 px-3">
                            <MaterialSelector
                              value={item.materialId}
                              onSelect={(val) => handleItemChange(index, "materialId", val)}
                              materials={allMaterials}
                              placeholder={isLoadingMaterials ? "Đang tải..." : "Chọn vật tư"}
                            />
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-500">{getMaterialUnit(item.materialId)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
                            {item.materialId ? getMaterialStock(item.materialId)?.toLocaleString() : "—"}
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="SL..."
                              value={item.quantity || ""}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="h-9 text-xs font-mono font-bold text-rose-600 border-slate-200 focus-visible:ring-rose-500 rounded-lg bg-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            {isCuon ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="Dài"
                                  value={item.cutLength || ""}
                                  onChange={(e) => handleItemChange(index, "cutLength", parseInt(e.target.value) || undefined)}
                                  className="h-9 text-xs font-mono font-bold text-blue-600 border-blue-200 focus-visible:ring-blue-500/30 rounded-lg bg-white w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-slate-400 font-bold px-0.5">×</span>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="Rộng"
                                  value={item.cutWidth || ""}
                                  onChange={(e) => handleItemChange(index, "cutWidth", parseInt(e.target.value) || undefined)}
                                  className="h-9 text-xs font-mono font-bold text-blue-600 border-blue-200 focus-visible:ring-blue-500/30 rounded-lg bg-white w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isCuon ? (
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Tờ ra..."
                                value={item.quantityProduced || ""}
                                onChange={(e) => handleItemChange(index, "quantityProduced", parseInt(e.target.value) || undefined)}
                                className="h-9 text-xs font-mono font-bold text-amber-600 border-amber-200 focus-visible:ring-amber-500 rounded-lg bg-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                  <Plus className="h-4 w-4 mr-1" />
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
