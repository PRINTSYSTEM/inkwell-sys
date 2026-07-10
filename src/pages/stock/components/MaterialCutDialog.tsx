import { useState, useEffect, useMemo, useRef } from "react";
import { Scissors, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateMaterialCut, useUpdateMaterialCut } from "@/hooks/use-stock";
import { usePendingMaterialProductionOrders } from "@/hooks/use-production";
import { useProofingOrders } from "@/hooks/use-proofing-order";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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

interface MaterialCutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number | null;
  materialDetail: any;
  vendorRolls: any[];
  refetchAll: () => void;
  isEditMode?: boolean;
  editId?: number | null;
  editData?: any;
  materials?: any[];
}

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

const getLocalDatetimeString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseDimensions = (sizeStr: string) => {
  if (!sizeStr) return { width: 0, length: 0 };
  const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    return {
      width: parseFloat(match[1]) || 0,
      length: parseFloat(match[2]) || 0,
    };
  }
  return { width: 0, length: 0 };
};

function JobCodeSelector({
  value,
  onChange,
  productionOrders,
}: {
  value: string;
  onChange: (val: string) => void;
  productionOrders: any[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    if (!search) return productionOrders;
    const s = search.toLowerCase();
    return productionOrders.filter((po) =>
      (po.proofingOrderCode || "").toLowerCase().includes(s) ||
      (po.customerName || "").toLowerCase().includes(s) ||
      (po.paperName || "").toLowerCase().includes(s)
    );
  }, [productionOrders, search]);

  const hasExactMatch = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return productionOrders.some((po) => (po.proofingOrderCode || "").toLowerCase() === s);
  }, [productionOrders, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between text-xs bg-white border-slate-200 rounded-lg font-normal hover:bg-slate-50/50 cursor-pointer px-3"
        >
          <span className="truncate">{value || "Nhập hoặc chọn mã bài..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            placeholder="Tìm hoặc nhập mã bài..."
            value={search}
            onValueChange={setSearch}
            className="h-9 w-full bg-transparent text-xs border-none focus:ring-0 focus-visible:ring-0"
          />
          <CommandList 
            className="max-h-[350px]"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {search.trim() && !hasExactMatch && (
              <CommandGroup heading="Mã tự nhập">
                <CommandItem
                  value={search}
                  onSelect={() => {
                    onChange(search.trim());
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer text-blue-600 font-bold"
                >
                  Sử dụng: "{search}"
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Danh sách lệnh sản xuất túi">
              {filteredOrders.map((po) => (
                <CommandItem
                  key={po.id}
                  value={`${po.proofingOrderCode || ""} ${po.customerName || ""} ${po.id}`}
                  onSelect={() => {
                    onChange(po.proofingOrderCode || "");
                    setOpen(false);
                  }}
                  className="text-xs cursor-pointer flex flex-col items-start gap-1 py-2.5 px-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center w-full justify-between">
                    <span className="font-bold font-mono text-slate-700 text-sm">
                      {po.proofingOrderCode || `PO-${po.id}`}
                    </span>
                    {value === po.proofingOrderCode && (
                      <Check className="h-3.5 w-3.5 text-[#93631F] shrink-0" />
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
              {filteredOrders.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500">
                  Không tìm thấy lệnh sản xuất nào.
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MaterialCutDialog({
  open,
  onOpenChange,
  materialId,
  materialDetail,
  vendorRolls,
  refetchAll,
  isEditMode = false,
  editId = null,
  editData = null,
  materials,
}: MaterialCutDialogProps) {
  const { mutateAsync: createMaterialCut } = useCreateMaterialCut();
  const { mutateAsync: updateMaterialCut } = useUpdateMaterialCut();

  const { data: pendingProdOrdersData } = usePendingMaterialProductionOrders({
    pageSize: 1000,
  });
  const pendingProdOrders = pendingProdOrdersData?.items || [];

  const { data: proofingResp } = useProofingOrders({
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

  const isTuiDesignType = (name: string): boolean => {
    if (!name) return false;
    const n = name.toLowerCase();
    return (
      n.includes("túi") ||
      n.includes("tui") ||
      n.includes("bag") ||
      n.includes("pe") ||
      n.includes("pa") ||
      n.includes("metaline")
    );
  };

  const bagProdOrders = useMemo(() => {
    return enrichedProductionOrders.filter((po) => {
      const designType = po.designTypeName || "";
      const code = po.proofingOrderCode || "";
      return isTuiDesignType(designType) || isTuiDesignType(code);
    });
  }, [enrichedProductionOrders]);

  const handleSelectJobCode = (jobCodeVal: string) => {
    const po = bagProdOrders.find((p) => p.proofingOrderCode === jobCodeVal);
    if (po) {
      const sizeStr = po.paperSizeName || "";
      const { width: parsedWidth, length: parsedLength } = parseDimensions(sizeStr);
      
      setCutForm((prev) => ({
        ...prev,
        jobCode: jobCodeVal,
        quantityProduced: po.totalQuantity || prev.quantityProduced || 0,
        width: parsedWidth || prev.width || 0,
        length: parsedLength || prev.length || 0,
        isManuallyEditedUsed: false,
      }));
    } else {
      setCutForm((prev) => ({
        ...prev,
        jobCode: jobCodeVal,
      }));
    }
  };

  const isInitialLoadRef = useRef(true);
  useEffect(() => {
    if (open) {
      isInitialLoadRef.current = true;
    }
  }, [open]);

  const [cutForm, setCutForm] = useState({
    inputMaterialId: 0,
    jobCode: "",
    width: 0,
    length: 0,
    quantityProduced: 1200,
    quantityUsed: 0,
    quantityWasted: 0,
    notes: "",
    isManuallyEditedUsed: false,
    cutAt: getLocalDatetimeString(),
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditMode && editData) {
        const output = editData.outputs?.[0] || {};
        
        let outputWidth = output.cutLength || 0;
        let outputLength = output.cutWidth || 0;

        // Try to retrieve dimensions using outputMaterialId and materials list
        if ((!outputWidth || !outputLength) && output.outputMaterialId && materials) {
          const mat = materials.find((m: any) => m.id === output.outputMaterialId);
          if (mat) {
            outputWidth = mat.length || 0;
            outputLength = mat.width || 0;
          }
        }

        // Fallback: parse dimensions from outputMaterialName (e.g. "Decal giấy đế xanh : 50x70")
        if ((!outputWidth || !outputLength) && output.outputMaterialName) {
          const crossMatch = output.outputMaterialName.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
          if (crossMatch) {
            outputWidth = parseFloat(crossMatch[1]);
            outputLength = parseFloat(crossMatch[2]);
          }
        }

        setCutForm({
          inputMaterialId: editData.inputMaterialId || materialId || 0,
          jobCode: editData.jobCode || "",
          width: outputWidth,
          length: outputLength,
          quantityProduced: output.quantityProduced || 0,
          quantityUsed: editData.quantityUsed || 0,
          quantityWasted: editData.quantityWasted || 0,
          notes: editData.notes || "",
          isManuallyEditedUsed: true,
          cutAt: editData.cutAt ? getLocalDatetimeString(new Date(editData.cutAt)) : getLocalDatetimeString(),
        });
      } else if (materialDetail) {
        setCutForm({
          inputMaterialId: materialId || 0,
          jobCode: "",
          width: materialDetail.length || 0,
          length: 0,
          quantityProduced: 1200,
          quantityUsed: 0,
          quantityWasted: 0,
          notes: "",
          isManuallyEditedUsed: false,
          cutAt: getLocalDatetimeString(),
        });
      }
    }
  }, [open, materialId, materialDetail, isEditMode, editData, materials]);

  const dropdownRolls = useMemo(() => {
    if (!materialDetail) return [];
    
    // Filter vendorRolls to strictly match the current material's vendorId
    const rolls = (vendorRolls || []).filter((r: any) => r.vendorId === materialDetail.vendorId);
    
    // Ensure the current material itself is always in the list
    const hasCurrent = rolls.some((r: any) => r.id === materialDetail.id);
    if (!hasCurrent) {
      rolls.unshift(materialDetail);
    }
    
    return rolls;
  }, [vendorRolls, materialDetail]);

  const selectedInputMaterial = useMemo(() => {
    if (cutForm.inputMaterialId === materialId) return materialDetail;
    return dropdownRolls.find((r) => r.id === cutForm.inputMaterialId) || materialDetail;
  }, [cutForm.inputMaterialId, materialId, materialDetail, dropdownRolls]);

  // Always synchronize cutForm.width with the selected roll's width
  useEffect(() => {
    if (isEditMode && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    if (selectedInputMaterial) {
      setCutForm((prev) => ({
        ...prev,
        width: selectedInputMaterial.length || 0,
      }));
    }
  }, [selectedInputMaterial, isEditMode]);

  // Recalculate quantityUsed
  useEffect(() => {
    if (!cutForm.isManuallyEditedUsed) {
      const dimension2Val = cutForm.length || 0;
      const quantityProd = cutForm.quantityProduced || 0;
      const calculatedUsed = parseFloat(((dimension2Val / 100) * quantityProd).toFixed(2));
      setCutForm((prev) => ({
        ...prev,
        quantityUsed: isNaN(calculatedUsed) ? 0 : calculatedUsed,
      }));
    }
  }, [cutForm.length, cutForm.quantityProduced, cutForm.isManuallyEditedUsed]);

  const handleCutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutForm.width || cutForm.width <= 0) {
      toast.error("Vui lòng nhập chiều rộng cắt!");
      return;
    }
    const maxVal = selectedInputMaterial?.length || 0;
    if (maxVal > 0 && cutForm.width > maxVal) {
      toast.error(`Chiều rộng không thể lớn hơn khổ cuộn nguyên liệu (${maxVal} cm)`);
      return;
    }
    if (!cutForm.length || cutForm.length <= 0) {
      toast.error("Vui lòng nhập chiều dài cắt!");
      return;
    }
    if (!cutForm.quantityProduced || cutForm.quantityProduced <= 0) {
      toast.error("Vui lòng nhập số lượng tờ ra!");
      return;
    }

    if (!cutForm.cutAt) {
      toast.error("Vui lòng chọn thời gian cắt!");
      return;
    }
    const parsedDate = new Date(cutForm.cutAt);
    if (isNaN(parsedDate.getTime())) {
      toast.error("Thời gian cắt không hợp lệ!");
      return;
    }

    let toastId: string | number | undefined;
    try {
      const cutAtStr = parsedDate.toISOString();
      const payload = {
        inputMaterialId: cutForm.inputMaterialId,
        quantityUsed: Math.round(cutForm.quantityUsed),
        quantityWasted: Math.round(cutForm.quantityWasted),
        jobCode: cutForm.jobCode || null,
        cutAt: cutAtStr,
        notes: cutForm.notes || "",
        outputs: [
          {
            outputMaterialId: isEditMode && editData?.outputs?.[0]?.outputMaterialId ? editData.outputs[0].outputMaterialId : null,
            cutLength: cutForm.width,
            cutWidth: cutForm.length,
            quantityProduced: cutForm.quantityProduced,
          },
        ],
      };

      if (isEditMode && editId) {
        toastId = toast.loading("Đang cập nhật phiếu cắt...");
        await updateMaterialCut({ id: editId, data: payload });
      } else {
        toastId = toast.loading("Đang tạo phiếu cắt...");
        await createMaterialCut(payload);
      }
      if (toastId) toast.dismiss(toastId);
      onOpenChange(false);
      refetchAll();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border-slate-200">
        <form onSubmit={handleCutSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#93631F] flex items-center gap-2">
              <Scissors className="h-4.5 w-4.5 text-[#93631F]" />
              {isEditMode ? "Chỉnh sửa phiếu cắt" : "Cắt nguyên liệu từ cuộn"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhập thông tin phân chia cuộn nguyên liệu thành các tờ thành phẩm. Hệ thống sẽ tự tạo chất liệu tờ mới theo vendor của cuộn.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Nguyên liệu đầu vào */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="font-semibold text-slate-700">Cuộn nguyên liệu đầu vào</Label>
              <Select
                value={String(cutForm.inputMaterialId)}
                onValueChange={(val) => {
                  const id = parseInt(val, 10);
                  const selected = dropdownRolls.find((r) => r.id === id) || materialDetail;
                  setCutForm((prev) => ({
                    ...prev,
                    inputMaterialId: id,
                    width: selected?.length || 0,
                  }));
                }}
              >
                <SelectTrigger className="rounded-md border-slate-200 h-10 text-xs focus:ring-[#93631F] cursor-pointer">
                  <SelectValue placeholder="Chọn cuộn nguyên liệu" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {dropdownRolls.map((roll) => (
                    <SelectItem key={roll.id} value={String(roll.id)} className="text-xs cursor-pointer">
                      {roll.name} {roll.length ? `(Khổ: ${roll.length} cm) ` : ""}(Tồn: {(roll.currentStock ?? roll.quantity ?? 0).toLocaleString()} {roll.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tồn kho hiện tại */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Tồn kho hiện tại (m)</Label>
              <div className="h-10 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-md font-bold font-mono text-slate-700 select-none">
                {(selectedInputMaterial?.currentStock ?? selectedInputMaterial?.quantity ?? 0).toLocaleString()} m
              </div>
            </div>

            {/* Mã bài */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Mã bài sản xuất</Label>
              <JobCodeSelector
                value={cutForm.jobCode}
                onChange={handleSelectJobCode}
                productionOrders={bagProdOrders}
              />
            </div>

            {/* Kích thước cắt ra */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between mb-0.5">
                <Label className="font-semibold text-slate-700">Kích thước cắt ra (cm)</Label>

              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    type="number"
                    placeholder="Chiều rộng"
                    value={cutForm.width !== undefined && cutForm.width !== null ? cutForm.width : ""}
                    max={selectedInputMaterial?.length || undefined}
                    onChange={(e) => {
                      const maxVal = selectedInputMaterial?.length || 0;
                      const inputVal = parseFloat(e.target.value) || 0;
                      if (maxVal > 0 && inputVal > maxVal) {
                        toast.warning(`Chiều rộng không thể lớn hơn khổ cuộn nguyên liệu (${maxVal} cm)`);
                        setCutForm((prev) => ({ ...prev, width: maxVal }));
                      } else {
                        setCutForm((prev) => ({ ...prev, width: inputVal }));
                      }
                    }}
                    className="rounded-md border-slate-200 h-10 text-xs font-mono text-center focus-visible:ring-[#93631F]"
                  />
                  <span className="text-[10px] text-slate-400 block text-center leading-none mt-1">
                    Chiều rộng cắt (Tối đa: {selectedInputMaterial?.length || 0} cm)
                  </span>
                </div>
                <span className="text-slate-400 font-bold self-center">x</span>
                <div className="flex-1 space-y-1">
                  <Input
                    type="number"
                    placeholder="Chiều dài"
                    value={cutForm.length || ""}
                    onChange={(e) => setCutForm((prev) => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                    className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] text-center"
                  />
                  <span className="text-[10px] text-slate-400 block text-center leading-none mt-1">Chiều dài cắt ra</span>
                </div>
              </div>
            </div>

            {/* Số lượng tờ cắt ra */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Số lượng tờ cắt ra (tờ)</Label>
              <Input
                type="number"
                value={cutForm.quantityProduced || ""}
                onChange={(e) => setCutForm((prev) => ({ ...prev, quantityProduced: parseInt(e.target.value, 10) || 0 }))}
                className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] font-bold"
              />
            </div>

            {/* Sử dụng (mét) */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Sử dụng (m)</Label>
              <Input
                type="number"
                step="any"
                value={cutForm.quantityUsed || ""}
                onChange={(e) => {
                  setCutForm((prev) => ({
                    ...prev,
                    quantityUsed: parseFloat(e.target.value) || 0,
                    isManuallyEditedUsed: true,
                  }));
                }}
                className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] font-bold text-[#93631F]"
              />
            </div>

            {/* Hao hụt (mét) */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Hao hụt (m)</Label>
              <Input
                type="number"
                step="any"
                value={cutForm.quantityWasted || ""}
                onChange={(e) => setCutForm((prev) => ({ ...prev, quantityWasted: parseFloat(e.target.value) || 0 }))}
                className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] font-bold text-amber-600"
              />
            </div>

            {/* Tồn kho sau khi cắt */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Tồn kho sau khi cắt (m)</Label>
              {(() => {
                const currentQty = selectedInputMaterial?.currentStock ?? selectedInputMaterial?.quantity ?? 0;
                const used = cutForm.quantityUsed || 0;
                const wasted = cutForm.quantityWasted || 0;
                const remaining = parseFloat((currentQty - used - wasted).toFixed(2));
                const isNegative = remaining < 0;
                return (
                  <div className={cn(
                    "h-10 px-3 flex items-center border rounded-md font-bold font-mono select-none transition-colors",
                    isNegative 
                      ? "bg-rose-50 border-rose-200 text-rose-700" 
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  )}>
                    {remaining.toLocaleString()} m
                    {isNegative && <span className="text-[10px] ml-1.5 font-sans font-normal">(Thiếu hụt!)</span>}
                  </div>
                );
              })()}
            </div>

            {/* Thời gian cắt */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Thời gian cắt</Label>
              <Input
                type="datetime-local"
                value={cutForm.cutAt}
                onChange={(e) => setCutForm((prev) => ({ ...prev, cutAt: e.target.value }))}
                className="rounded-md border-slate-200 h-10 text-xs font-mono focus-visible:ring-[#93631F] cursor-pointer"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="font-semibold text-slate-700">Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú thêm cho quá trình cắt..."
                value={cutForm.notes}
                onChange={(e) => setCutForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="rounded-md border-slate-200 text-xs min-h-[60px] focus-visible:ring-[#93631F]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-md text-xs h-10 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-md text-xs h-10 bg-[#93631F] hover:bg-[#7a521a] text-white cursor-pointer border-none"
            >
              {isEditMode ? "Cập nhật phiếu cắt" : "Lưu phiếu cắt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
