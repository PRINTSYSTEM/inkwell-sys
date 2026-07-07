// src/pages/stock/components/CreateMaterialDirectDialog.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Boxes, FileText, HelpCircle, Layers } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

// Import hooks
import { useMaterialFamilies } from "@/hooks/use-material-family";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { useSpecTemplates } from "@/hooks/use-spec-template";
import { useMaterialSpecsByMaterialType } from "@/hooks/use-material-spec";
import { useSpecValues } from "@/hooks/use-spec-value";
import { useSupplierCatalogs } from "@/hooks/use-supplier-catalog";

interface CreateMaterialDirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVendorId: string;
  vendorsData: any[] | undefined;
  refetch: () => void;
}

export function CreateMaterialDirectDialog({
  open,
  onOpenChange,
  selectedVendorId,
  vendorsData,
  refetch,
}: CreateMaterialDirectDialogProps) {
  const queryClient = useQueryClient();

  // Selected Vendor
  const selectedVendor = useMemo(() => {
    if (selectedVendorId === "all") return null;
    return vendorsData?.find((v) => String(v.id) === selectedVendorId) || null;
  }, [selectedVendorId, vendorsData]);

  // Master Data hooks
  const { data: familiesResp } = useMaterialFamilies({ page: 1, size: 1000 });
  const { data: templatesResp } = useMaterialTypeList({ pageSize: 100 });

  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Load catalogs for selected vendor
  const { data: catalogsData } = useSupplierCatalogs(
    selectedVendor?.id ? { vendorId: selectedVendor.id } : undefined
  );
  const catalogs = catalogsData || [];

  // Spec templates for selected family
  const { data: specTemplates } = useSpecTemplates(
    selectedFamilyId ? { familyId: selectedFamilyId } : undefined
  );

  // Fetch all spec values
  const { data: specValues } = useSpecValues();

  // Translation map for units of measure
  const unitTranslation: Record<string, string> = useMemo(() => ({
    sheet: "tờ",
    ram: "ram",
    roll: "cuộn",
    kg: "kg",
    kilogram: "kg",
    meter: "m",
    metre: "m",
    m: "m",
    box: "hộp",
    pack: "gói",
    piece: "cái",
    m2: "M2",
  }), []);

  const translateUnit = (unitStr: string): string => {
    if (!unitStr) return "";
    const lower = unitStr.toLowerCase().trim();
    return unitTranslation[lower] || unitStr;
  };

  // Helper functions to check width and length specification templates
  const isWidthSpec = (nameStr: string, keyStr: string) => {
    const n = nameStr.toLowerCase();
    const k = keyStr.toLowerCase();
    return n.includes("rộng") || n.includes("rong") || n.includes("width") || k.includes("rong") || k.includes("width");
  };

  const isLengthSpec = (nameStr: string, keyStr: string) => {
    const n = nameStr.toLowerCase();
    const k = keyStr.toLowerCase();
    return n.includes("cao") || n.includes("height") || n.includes("dài") || n.includes("dai") || n.includes("length") || k.includes("cao") || k.includes("height") || k.includes("dai") || k.includes("length");
  };

  // Form states
  const [name, setName] = useState<string>("");
  const [specSelections, setSpecSelections] = useState<Record<string, string>>({});
  const [width, setWidth] = useState<number>(0);
  const [length, setLength] = useState<number>(0);
  const [unit, setUnit] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [basisWeight, setBasisWeight] = useState<number | undefined>(undefined);

  // Load material specifications for selected material type
  const { data: materialSpecs = [], isLoading: isLoadingSpecs } = useMaterialSpecsByMaterialType(
    selectedTemplateId || null,
    !!selectedTemplateId
  );

  const hasSpecs = useMemo(() => {
    if (!materialSpecs || materialSpecs.length === 0) return false;
    if (materialSpecs.length === 1 && (materialSpecs[0].basisWeight === 0 || !materialSpecs[0].basisWeight)) {
      return false;
    }
    return true;
  }, [materialSpecs]);

  // Auto-select default spec
  useEffect(() => {
    if (materialSpecs.length > 0) {
      const defaultSpec = materialSpecs.find((s) => s.isDefault);
      if (defaultSpec && defaultSpec.basisWeight) {
        setBasisWeight(defaultSpec.basisWeight);
      } else if (materialSpecs[0].basisWeight) {
        setBasisWeight(materialSpecs[0].basisWeight);
      } else {
        setBasisWeight(undefined);
      }
    } else {
      setBasisWeight(undefined);
    }
  }, [materialSpecs]);

  const families = familiesResp?.items || [];
  const templates = templatesResp?.items || [];

  // Find selected material template
  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  // Find selected family object
  const currentFamilyObj = useMemo(() => {
    return families.find((f) => f.id === selectedFamilyId) || null;
  }, [selectedFamilyId, families]);

  const isGroup3 = useMemo(() => {
    if (!currentFamilyObj?.code) return false;
    const codeUpper = currentFamilyObj.code.toUpperCase();
    return ["INK", "GLUE", "SOLVENT", "ACCESSORY"].includes(codeUpper);
  }, [currentFamilyObj]);

  const isRollType = useMemo(() => {
    const unitLower = unit.toLowerCase().trim();
    const isRollUnit = unitLower === "cuộn" || unitLower === "cuon" || unitLower === "mét" || unitLower === "met" || unitLower === "m";
    if (isRollUnit) return true;

    if (!currentTemplate) return false;
    const nameLower = currentTemplate.name?.toLowerCase() || "";
    const codeLower = currentTemplate.code?.toLowerCase() || "";
    const familyCodeLower = currentFamilyObj?.code?.toLowerCase() || "";
    return (
      nameLower.includes("cuộn") ||
      nameLower.includes("cuon") ||
      nameLower.includes("màng") ||
      nameLower.includes("mang") ||
      codeLower.includes("cuon") ||
      codeLower.includes("roll") ||
      familyCodeLower.includes("roll") ||
      familyCodeLower.includes("cuon")
    );
  }, [currentTemplate, currentFamilyObj, unit]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setSelectedFamilyId(null);
      setSelectedTemplateId(null);
      setSpecSelections({});
      setWidth(0);
      setLength(0);
      setUnit("");
      setUnitPrice(0);
      setQuantity(0);
      setNotes("");
      setBasisWeight(undefined);
    }
  }, [open]);

  // Pre-fill name based on current template selection
  useEffect(() => {
    if (open && currentTemplate) {
      setName(currentTemplate.name || "");
    }
  }, [open, currentTemplate]);

  // Set selectedFamilyId automatically when selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template?.materialFamilyId) {
        setSelectedFamilyId(template.materialFamilyId);
      }
    } else {
      setSelectedFamilyId(null);
    }
  }, [selectedTemplateId, templates]);

  // Default unit when selectedTemplateId or selectedFamilyId changes
  useEffect(() => {
    if (selectedFamilyId) {
      const family = families.find((f) => f.id === selectedFamilyId);
      if (family?.allowedUnits && family.allowedUnits.length > 0) {
        setUnit(translateUnit(family.allowedUnits[0] || ""));
        return;
      }
    }

    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      const nameLower = template?.name?.toLowerCase() || "";
      const codeLower = template?.code?.toLowerCase() || "";
      const isRoll = nameLower.includes("cuộn") || codeLower.includes("cuon") || nameLower.includes("màng") || nameLower.includes("mang");
      setUnit(isRoll ? "cuộn" : "tờ");
    } else {
      setUnit("");
    }
  }, [selectedFamilyId, selectedTemplateId, families, templates]);

  // Filter templates: only show those linked to the selected Vendor in the catalogs
  const filteredTemplates = useMemo(() => {
    if (!selectedVendor?.id || !catalogs.length) return [];
    return templates.filter((t: any) =>
      catalogs.some((c) => c.materialTypeId === t.id)
    );
  }, [templates, selectedVendor, catalogs]);

  // Automatically pre-select first template in filtered templates
  useEffect(() => {
    if (filteredTemplates.length > 0 && selectedTemplateId === null) {
      setSelectedTemplateId(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectedTemplateId]);

  // Options of units from selected family
  const allowedUnitsOptions = useMemo(() => {
    if (!selectedFamilyId) return [];
    const family = families.find((f) => f.id === selectedFamilyId);
    if (!family?.allowedUnits) return [];
    return family.allowedUnits;
  }, [selectedFamilyId, families]);

  const unitsOptions = useMemo(() => {
    const defaultUnits = ["sheet", "roll", "kg", "m", "box", "pack", "piece", "m2"];
    const rawOptions = allowedUnitsOptions && allowedUnitsOptions.length > 0
      ? [...allowedUnitsOptions, ...defaultUnits]
      : defaultUnits;
    const mapped = rawOptions.map(opt => translateUnit(opt));
    return Array.from(new Set(mapped));
  }, [allowedUnitsOptions]);



  // Spec Value list for each spec template
  const getValuesForSpecTemplate = (templateId: number) => {
    if (!specValues) return [];
    const values = specValues.filter((v: any) => v.specTemplateId === templateId);

    // Find catalog entry for selected vendor and selected template
    const currentCatalog = catalogs.find((c) => c.materialTypeId === selectedTemplateId);
    if (!selectedVendor?.id || !selectedTemplateId || !currentCatalog) return values;

    // Filter values by allowedSpecValueIds
    if (currentCatalog.allowedSpecValueIds && currentCatalog.allowedSpecValueIds.length > 0) {
      const filtered = values.filter((v) => currentCatalog.allowedSpecValueIds.includes(v.id));
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return values;
  };

  // Filter dynamic spec templates: exclude width, length, and grain templates from the dropdowns list
  const visibleSpecTemplates = useMemo(() => {
    return specTemplates?.filter((t) => 
      !isWidthSpec(t.name, t.key) && 
      !isLengthSpec(t.name, t.key) &&
      !t.name.toLowerCase().includes("thớ") &&
      !t.name.toLowerCase().includes("grain") &&
      !t.key.toLowerCase().includes("grain") &&
      !t.key.toLowerCase().includes("gsm") &&
      !t.name.toLowerCase().includes("định lượng") &&
      !t.name.toLowerCase().includes("dinh luong")
    ) || [];
  }, [specTemplates]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedVendorId === "all" || !selectedVendor) {
      toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi nhập vật tư mới!");
      return;
    }

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên vật tư!");
      return;
    }



    if (!selectedTemplateId) {
      toast.error("Vui lòng chọn định mức chất liệu!");
      return;
    }

    // Check if required specs are filled
    const missingRequiredSpec = visibleSpecTemplates.find(
      (t) => t.isRequired && !specSelections[t.id.toString()]
    );
    if (missingRequiredSpec) {
      toast.error(`Vui lòng chọn thông số bắt buộc: ${missingRequiredSpec.name}`);
      return;
    }

    // Validate that selected spec values are allowed in the catalog
    const currentCatalog = catalogs.find((c) => c.materialTypeId === selectedTemplateId);
    if (currentCatalog && currentCatalog.allowedSpecValueIds && currentCatalog.allowedSpecValueIds.length > 0) {
      const invalidSpec = visibleSpecTemplates.find((t) => {
        const selectedVal = specSelections[t.id.toString()];
        if (!selectedVal) return false;

        const specValObj = specValues?.find(v => v.specTemplateId === t.id && v.value === selectedVal);
        if (!specValObj) return false;

        return !currentCatalog.allowedSpecValueIds.includes(specValObj.id);
      });

      if (invalidSpec) {
        toast.error(`Thuộc tính đã chọn không hợp lệ hoặc không được phân phối bởi NCC này: ${invalidSpec.name}`);
        return;
      }
    }



    if (!isGroup3) {
      if (width <= 0) {
        toast.error("Vui lòng nhập chiều rộng!");
        return;
      }

      if (!isRollType && length <= 0) {
        toast.error("Vui lòng nhập chiều dài!");
        return;
      }
    }

    if (quantity < 0) {
      toast.error("Số lượng ban đầu không được âm!");
      return;
    }

    // Prepare JSON specifications dictionary for the backend helper
    const specDict: Record<string, string> = {};
    if (specTemplates) {
      specTemplates.forEach((t) => {
        if (isWidthSpec(t.name, t.key)) {
          specDict[t.key] = width.toString();
        } else if (isLengthSpec(t.name, t.key)) {
          specDict[t.key] = length.toString();
        } else {
          const val = specSelections[t.id.toString()];
          if (val) {
            specDict[t.key] = val;
          }
        }
      });
    }
    if (basisWeight) {
      specDict["gsm"] = basisWeight.toString();
    }

    try {
      const payload = {
        name: name.trim(),
        type: isRollType ? "cuon" : "to",
        length: (isGroup3 || isRollType) ? 0 : length,
        width: isGroup3 ? 0 : (width || 0),
        unit: unit || unitsOptions[0] || (isRollType ? "m" : "tờ"),
        unitPrice: unitPrice || 0,
        basisWeight: basisWeight,
        materialFamilyId: selectedFamilyId,
        materialTypeId: selectedTemplateId,
        specValues: JSON.stringify(specDict),
        vendorId: selectedVendor.id,
      };

      let toastId: string | number | undefined;
      try {
        toastId = toast.loading("Đang tạo chất liệu mới...");
        const newMaterialRes = await apiRequest.post<any>(API_SUFFIX.MATERIALS, payload);
        const newMaterial = newMaterialRes.data;

        if (newMaterial && quantity > 0) {
          toast.loading("Đang duyệt phiếu nhập kho ban đầu...", { id: toastId });
          const calculatedTotalAmount = (quantity || 0) * (newMaterial.unitPrice || 0);
          const lineKind = isRollType ? "roll" : "sheet";

          const stockInRes = await apiRequest.post<any>(API_SUFFIX.STOCK_INS, {
            source: "manual",
            itemType: "material",
            vendorId: selectedVendor.id,
            totalAmount: calculatedTotalAmount || undefined,
            notes: notes || "Nhập kho ban đầu khi tạo vật tư mới",
            stockInDate: new Date().toISOString(),
            items: [
              {
                lineKind: lineKind,
                itemName: newMaterial.name,
                itemCode: newMaterial.code || undefined,
                unit: newMaterial.unit || undefined,
                quantity: quantity,
                unitPrice: newMaterial.unitPrice || undefined,
                notes: notes || undefined,
                materialId: newMaterial.id,
                length: newMaterial.length || undefined,
                width: newMaterial.width || undefined,
                height: newMaterial.height || undefined,
              },
            ],
          });
          const stockInResult = stockInRes.data;

          if (stockInResult && stockInResult.id) {
            await apiRequest.post(API_SUFFIX.STOCK_IN_COMPLETE(stockInResult.id));
          }
        }

        // Invalidate queries to refresh lists
        queryClient.invalidateQueries({ queryKey: ["materials"] });
        queryClient.invalidateQueries({ queryKey: ["stock-ins"] });

        if (toastId) toast.dismiss(toastId);

        if (quantity > 0) {
          toast.success(`Đã tạo SKU "${newMaterial.name}" và nhập kho ${quantity} ${newMaterial.unit} thành công!`);
        } else {
          toast.success(`Đã tạo SKU "${newMaterial.name}" thành công!`);
        }

        onOpenChange(false);
        refetch();
      } catch (err: any) {
        if (toastId) toast.dismiss(toastId);
        const errMsg = err.response?.data?.message || err.message || "Đã xảy ra lỗi!";
        toast.error(`Thực hiện thất bại: ${errMsg}`);
        console.error(err);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-xl border-slate-200">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-indigo-700 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Tạo vật tư nhà cung cấp
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhà cung cấp: <strong className="text-indigo-700">{selectedVendor?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs max-h-[75vh] overflow-y-auto px-1 py-1">
            {/* COLUMN 1: Basic specifications */}
            <div className="space-y-3.5">
              {/* Chọn loại chất liệu */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Chọn loại chất liệu</Label>
                <Select value={selectedTemplateId?.toString() || ""} onValueChange={(val) => setSelectedTemplateId(Number(val))}>
                  <SelectTrigger className="h-10 text-xs" disabled={filteredTemplates.length === 0}>
                    <SelectValue placeholder={filteredTemplates.length === 0 ? "Nhà cung cấp chưa có chất liệu liên kết nào" : "Chọn định mức chất liệu..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tên vật tư (SKU) */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Tên vật tư (SKU) <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Nhập tên vật tư..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              {/* Định lượng (GSM) */}
              {selectedTemplateId && hasSpecs && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label className="font-semibold text-slate-700">Định lượng (GSM) <span className="text-red-500">*</span></Label>
                  <Select
                    value={basisWeight ? basisWeight.toString() : ""}
                    onValueChange={(v) => setBasisWeight(Number(v))}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Chọn định lượng..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materialSpecs.map((spec) => (
                        <SelectItem
                          key={spec.id}
                          value={spec.basisWeight?.toString() || ""}
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{spec.name || `${spec.basisWeight} ${spec.defaultUnit || "gsm"}`}</span>
                            {spec.isDefault && (
                              <span className="ml-2 text-[10px] bg-amber-50 text-amber-500 border border-amber-300 rounded px-1 scale-90 shrink-0">
                                Mặc định
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Điền các thuộc tính động (T5/T6) */}
              {visibleSpecTemplates && visibleSpecTemplates.length > 0 && (
                <div className="space-y-3 border border-slate-100 rounded-lg p-3 bg-slate-50/50 animate-in fade-in duration-200">
                  <span className="font-semibold text-indigo-700 text-xs block mb-1">Thông số kỹ thuật của nhóm</span>
                  <div className="grid grid-cols-2 gap-3">
                    {visibleSpecTemplates.map((t) => {
                      const values = getValuesForSpecTemplate(t.id);
                      return (
                        <div key={t.id} className="space-y-1.5">
                          <Label className="text-slate-600 font-medium">
                            {t.name} {t.isRequired && <span className="text-red-500">*</span>}
                          </Label>
                          <Select
                            value={specSelections[t.id.toString()] || ""}
                            onValueChange={(val) => {
                              setSpecSelections((prev) => ({ ...prev, [t.id.toString()]: val }));
                              if (t.key.toLowerCase().includes("gsm") || t.name.toLowerCase().includes("định lượng") || t.name.toLowerCase().includes("dinh luong")) {
                                const numericVal = parseFloat(val);
                                if (!isNaN(numericVal)) {
                                  setBasisWeight(numericVal);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs bg-white">
                              <SelectValue placeholder={`Chọn ${t.name}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {values.map((v: any) => (
                                <SelectItem key={v.id} value={v.value}>{v.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Đơn vị tính */}
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label className="font-semibold text-slate-700">Đơn vị tính</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Chọn đơn vị..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* COLUMN 2: Pricing, Quantities and Sizes */}
            <div className="space-y-3.5">
              {/* Kích thước (Tầng 8) */}
              {!isGroup3 && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label className="font-semibold text-slate-700">
                    {isRollType ? "Khổ cuộn vật tư" : "Kích thước khổ vật tư"}
                  </Label>
                  <div className={isRollType ? "grid grid-cols-1" : "grid grid-cols-2 gap-3"}>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        placeholder={isRollType ? "Khổ cuộn / Chiều rộng" : "Chiều rộng"}
                        value={width || ""}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        className="h-10 text-xs font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-400 block text-center mt-0.5">
                        {isRollType ? "Khổ cuộn/Chiều rộng (cm/mm)" : "Chiều rộng (cm/mm)"}
                      </span>
                    </div>
                    {!isRollType && (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="Chiều dài"
                          value={length || ""}
                          onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                          className="h-10 text-xs font-mono text-center"
                        />
                        <span className="text-[10px] text-slate-400 block text-center mt-0.5">Chiều dài (cm/mm)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Đơn giá nhập */}
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label className="font-semibold text-slate-700">Đơn giá nhập (đ)</Label>
                <Input
                  type="number"
                  placeholder="Nhập giá..."
                  value={unitPrice || ""}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="h-10 text-xs font-mono"
                />
              </div>

              {/* Số lượng ban đầu */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Số lượng nhập kho đầu kỳ</Label>
                <Input
                  type="number"
                  placeholder="Để trống nếu không có tồn kho ban đầu..."
                  value={quantity || ""}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="h-10 text-xs font-mono font-bold text-indigo-600 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Ghi chú phiếu nhập</Label>
                <Textarea
                  placeholder="Diễn giải thêm..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs min-h-[90px]"
                />
              </div>
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
              className="rounded-md text-xs h-10 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer border-none"
            >
              Tạo & Nhập kho SKU
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
