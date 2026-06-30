// src/pages/stock/components/CreateMaterialDialog.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import type { MaterialResponse } from "@/Schema/material.schema";

// Import hooks
import { useCreateMaterial } from "@/hooks/use-material";
import { useMaterialFamilies } from "@/hooks/use-material-family";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { useSpecTemplates } from "@/hooks/use-spec-template";
import { useSpecValues } from "@/hooks/use-spec-value";
import { useActiveVendors } from "@/hooks/use-vendor";
import { useSupplierCatalogs } from "@/hooks/use-supplier-catalog";
import { useMaterialSpecsByMaterialType } from "@/hooks/use-material-spec";

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (
    materialId: number,
    material: MaterialResponse,
    unit?: string,
    unitPrice?: number
  ) => void;
  defaultMaterialTypeId?: number;
  showQuantity?: boolean;
  dimensionUnit?: string;
  submitButtonClassName?: string;
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultMaterialTypeId,
  showQuantity = false,
  dimensionUnit = "mm",
  submitButtonClassName,
}: CreateMaterialDialogProps) {
  // Master hooks
  const { data: vendorsData, isLoading: isLoadingVendors } = useActiveVendors();
  const { data: familiesResp } = useMaterialFamilies({ page: 1, size: 1000 });
  const { data: templatesResp } = useMaterialTypeList({ pageSize: 100 });
  const { mutate: createMaterial, isPending } = useCreateMaterial();

  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(undefined);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Load catalogs for selected vendor
  const { data: catalogsData } = useSupplierCatalogs(
    selectedVendorId ? { vendorId: selectedVendorId } : undefined
  );
  const catalogs = catalogsData || [];

  // Specs
  const { data: specTemplates } = useSpecTemplates(
    selectedFamilyId ? { familyId: selectedFamilyId } : undefined
  );
  const { data: specValues } = useSpecValues();

  // Form states
  const [specSelections, setSpecSelections] = useState<Record<string, string>>({});
  const [width, setWidth] = useState<number>(0);
  const [length, setLength] = useState<number>(0);
  const [unit, setUnit] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
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
    if (filteredMaterialSpecs.length > 0) {
      const defaultSpec = filteredMaterialSpecs.find((s) => s.isDefault);
      if (defaultSpec && defaultSpec.basisWeight) {
        setBasisWeight(defaultSpec.basisWeight);
      } else if (filteredMaterialSpecs[0].basisWeight) {
        setBasisWeight(filteredMaterialSpecs[0].basisWeight);
      } else {
        setBasisWeight(undefined);
      }
    } else {
      setBasisWeight(undefined);
    }
  }, [filteredMaterialSpecs]);

  const families = familiesResp?.items || [];
  const templates = templatesResp?.items || [];
  const vendors = vendorsData || [];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedVendorId(undefined);
      setSelectedFamilyId(null);
      setSelectedTemplateId(null);
      setSpecSelections({});
      setWidth(0);
      setLength(0);
      setUnit("");
      setUnitPrice(0);
      setBasisWeight(undefined);
    }
  }, [open]);

  // Set default vendor and reset template when vendor changes
  useEffect(() => {
    if (open && vendors.length > 0 && selectedVendorId === undefined) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [open, vendors, selectedVendorId]);

  useEffect(() => {
    setSelectedTemplateId(null);
    setSpecSelections({});
  }, [selectedVendorId]);

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
        setUnit(family.allowedUnits[0] || "");
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
    if (!selectedVendorId || !catalogs.length) return [];
    return templates.filter((t: any) =>
      catalogs.some((c) => c.materialTypeId === t.id)
    );
  }, [templates, selectedVendorId, catalogs]);

  // Select first template automatically
  useEffect(() => {
    if (filteredTemplates.length > 0 && selectedTemplateId === null) {
      setSelectedTemplateId(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectedTemplateId]);

  const currentVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId) || null;
  }, [selectedVendorId, vendors]);

  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  const currentFamilyObj = useMemo(() => {
    return families.find((f) => f.id === selectedFamilyId) || null;
  }, [selectedFamilyId, families]);

  const isRoll = useMemo(() => {
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
      familyCodeLower.includes("cuon") ||
      unit === "cuộn" ||
      unit === "cuon"
    );
  }, [currentTemplate, currentFamilyObj, unit]);

  const filteredMaterialSpecs = useMemo(() => {
    if (!materialSpecs || materialSpecs.length === 0) return [];
    
    // Find catalog entry for selected vendor and selected template
    const currentCatalog = catalogs.find((c) => c.materialTypeId === selectedTemplateId);
    if (!selectedVendorId || !selectedTemplateId || !currentCatalog) return materialSpecs;
    
    // Filter by allowedSpecValueIds
    if (currentCatalog.allowedSpecValueIds && currentCatalog.allowedSpecValueIds.length > 0 && specValues) {
      const allowedValues = specValues
        .filter((v: any) => currentCatalog.allowedSpecValueIds.includes(v.id))
        .map((v: any) => parseInt(v.value, 10))
        .filter((v: any) => !isNaN(v));
        
      if (allowedValues.length > 0) {
        return materialSpecs.filter((spec) => allowedValues.includes(spec.basisWeight ?? 0));
      }
    }
    return materialSpecs;
  }, [materialSpecs, catalogs, selectedVendorId, selectedTemplateId, specValues]);

  // Preview generated SKU Name
  const previewSkuName = useMemo(() => {
    if (!currentVendor || !currentTemplate) return "Xem trước...";

    // Get GSM if selected
    const gsmVal = hasSpecs ? (basisWeight?.toString() || "") : "";

    let sizeStr = "";
    if (width > 0 && length > 0) {
      sizeStr = `${width}x${length}`;
    } else if (width > 0) {
      sizeStr = `${width}cm`;
    } else {
      sizeStr = "Kích thước";
    }

    const gsmStr = gsmVal ? ` - ${gsmVal}gsm` : "";
    return `${currentVendor.name} - ${currentTemplate.name}${gsmStr} - ${sizeStr}`;
  }, [currentVendor, currentTemplate, hasSpecs, basisWeight, width, length]);

  const getValuesForSpecTemplate = (templateId: number) => {
    if (!specValues) return [];
    const values = specValues.filter((v: any) => v.specTemplateId === templateId);

    // Find catalog entry for selected vendor and selected template
    const currentCatalog = catalogs.find((c) => c.materialTypeId === selectedTemplateId);
    if (!selectedVendorId || !selectedTemplateId || !currentCatalog) return values;

    // Filter values by allowedSpecValueIds
    if (currentCatalog.allowedSpecValueIds && currentCatalog.allowedSpecValueIds.length > 0) {
      return values.filter((v) => currentCatalog.allowedSpecValueIds.includes(v.id));
    }
    return values;
  };

  const allowedUnitsOptions = useMemo(() => {
    if (!selectedFamilyId) return [];
    const family = families.find((f) => f.id === selectedFamilyId);
    if (!family?.allowedUnits) return [];
    return family.allowedUnits;
  }, [selectedFamilyId, families]);

  const unitsOptions = useMemo(() => {
    if (allowedUnitsOptions && allowedUnitsOptions.length > 0) return allowedUnitsOptions;
    return ["tờ", "cuộn", "kg", "m", "hộp", "thùng", "cái"];
  }, [allowedUnitsOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendorId) {
      toast.error("Vui lòng chọn nhà cung cấp!");
      return;
    }

    if (!selectedFamilyId) {
      toast.error("Vui lòng chọn nhóm vật tư!");
      return;
    }

    if (!selectedTemplateId) {
      toast.error("Vui lòng chọn định mức chất liệu!");
      return;
    }

    // Check if required specs are filled
    const missingRequiredSpec = specTemplates?.find(
      (t) => t.isRequired && !specSelections[t.id.toString()]
    );
    if (missingRequiredSpec) {
      toast.error(`Vui lòng chọn thông số bắt buộc: ${missingRequiredSpec.name}`);
      return;
    }

    // Validate that selected spec values are allowed in the catalog
    const currentCatalog = catalogs.find((c) => c.materialTypeId === selectedTemplateId);
    if (currentCatalog && currentCatalog.allowedSpecValueIds && currentCatalog.allowedSpecValueIds.length > 0) {
      const invalidSpec = specTemplates?.find((t) => {
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

    const specDict: Record<string, string> = {};
    if (specTemplates) {
      specTemplates.forEach((t) => {
        const val = specSelections[t.id.toString()];
        if (val) {
          specDict[t.key] = val;
        }
      });
    }
    if (hasSpecs && basisWeight) {
      specDict["gsm"] = basisWeight.toString();
    }

    const isRollType =
      currentFamilyObj?.code?.includes("roll") ||
      currentFamilyObj?.code?.includes("cuon") ||
      currentTemplate?.name?.toLowerCase().includes("cuộn") ||
      currentTemplate?.code?.toLowerCase().includes("cuon");

    createMaterial(
      {
        name: previewSkuName,
        type: isRollType ? "cuon" : "to",
        length: isRollType ? 0 : length,
        width: width || 0,
        unit: unit || unitsOptions[0] || (isRollType ? "m" : "tờ"),
        unitPrice: unitPrice || 0,
        basisWeight: hasSpecs ? basisWeight : undefined,
        materialFamilyId: selectedFamilyId,
        materialTypeId: selectedTemplateId,
        specValues: JSON.stringify(specDict),
        vendorId: selectedVendorId,
      },
      {
        onSuccess: (newMaterial) => {
          toast.success("Tạo chất liệu mới thành công!");
          onOpenChange(false);
          if (newMaterial.id) {
            onSuccess?.(newMaterial.id, newMaterial, newMaterial.unit || undefined, newMaterial.unitPrice || undefined);
          }
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || "Không thể tạo vật tư mới.";
          toast.error(`Lỗi: ${errMsg}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Tạo vật tư mới
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Điền thông tin phân tầng để tạo SKU vật tư mới vào hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs max-h-[380px] overflow-y-auto px-1">
            {/* Chọn Nhà cung cấp */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Chọn Nhà cung cấp</Label>
              <Select value={selectedVendorId?.toString() || ""} onValueChange={(val) => setSelectedVendorId(Number(val))}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Chọn nhà cung cấp..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v: any) => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chọn Chất liệu */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Chọn Định mức chất liệu (Template)</Label>
              <Select value={selectedTemplateId?.toString() || ""} onValueChange={(val) => setSelectedTemplateId(Number(val))}>
                <SelectTrigger className="h-10 text-xs" disabled={filteredTemplates.length === 0}>
                  <SelectValue placeholder={filteredTemplates.length === 0 ? "Chưa cấu hình chất liệu" : "Chọn định mức chất liệu..."} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    {filteredMaterialSpecs.map((spec) => (
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

            {/* Dynamic Spec values */}
            {specTemplates && specTemplates.length > 0 && (
              <div className="space-y-3 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                <span className="font-semibold text-indigo-700 text-xs block mb-1">Thông số kỹ thuật</span>
                <div className="grid grid-cols-2 gap-3">
                  {specTemplates.map((t) => {
                    const values = getValuesForSpecTemplate(t.id);
                    return (
                      <div key={t.id} className="space-y-1.5">
                        <Label className="text-slate-600 font-medium">
                          {t.name} {t.isRequired && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={specSelections[t.id.toString()] || ""}
                          onValueChange={(val) =>
                            setSpecSelections((prev) => ({ ...prev, [t.id.toString()]: val }))
                          }
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

            {/* Kích thước */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Kích thước khổ vật tư</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Chiều rộng"
                    value={width || ""}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    className="h-10 text-xs font-mono text-center"
                  />
                  <span className="text-[10px] text-slate-400 block text-center mt-0.5">Chiều rộng (cm/mm)</span>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Chiều dài"
                    disabled={isRoll}
                    value={isRoll ? 0 : (length || "")}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    className="h-10 text-xs font-mono text-center"
                  />
                  <span className="text-[10px] text-slate-400 block text-center mt-0.5">Chiều dài (Tờ)</span>
                </div>
              </div>
            </div>

            {/* Preview generated SKU */}
            <div className="space-y-1.5 select-none">
              <Label className="font-semibold text-slate-700">Tên SKU sinh ra (Xem trước)</Label>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 text-indigo-900 rounded-lg font-bold text-xs truncate">
                {previewSkuName}
              </div>
            </div>

            {/* Giá & Đơn vị tính */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Đơn giá nhập (đ)</Label>
                <Input
                  type="number"
                  placeholder="Nhập giá..."
                  value={unitPrice || ""}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="h-10 text-xs font-mono"
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
              disabled={isPending}
              className="rounded-md text-xs h-10 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer border-none"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tạo vật tư
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
