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
import { useActiveVendors } from "@/hooks/use-vendor";
import { useSupplierCatalogs } from "@/hooks/use-supplier-catalog";
import { useMaterialSpecsByMaterialType } from "@/hooks/use-material-spec";

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultVendorId?: number;
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
  defaultVendorId,
  onSuccess,
  defaultMaterialTypeId,
}: CreateMaterialDialogProps) {
  // Master hooks
  const { data: vendorsData } = useActiveVendors();
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

  // Form states
  const [materialName, setMaterialName] = useState<string>("");
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [length, setLength] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<string>("tờ");
  const [basisWeight, setBasisWeight] = useState<number | undefined>(undefined);

  // Load material specifications (GSM) for selected material type
  const { data: materialSpecs = [] } = useMaterialSpecsByMaterialType(
    selectedTemplateId || null,
    !!selectedTemplateId
  );

  // Check if selected material type actually has valid GSM specs
  const hasGsmSpecs = useMemo(() => {
    if (!materialSpecs || materialSpecs.length === 0) return false;
    return materialSpecs.some((s) => (s.basisWeight ?? 0) > 0);
  }, [materialSpecs]);

  const families = familiesResp?.items || [];
  const templates = templatesResp?.items || [];
  const vendors = vendorsData || [];

  const currentVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId) || null;
  }, [selectedVendorId, vendors]);

  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  // Available templates: filter by catalog if configured, otherwise all templates
  const availableTemplates = useMemo(() => {
    if (!selectedVendorId) return templates;
    if (catalogs && catalogs.length > 0) {
      const filtered = templates.filter((t: any) =>
        catalogs.some((c) => c.materialTypeId === t.id)
      );
      if (filtered.length > 0) return filtered;
    }
    return templates;
  }, [templates, selectedVendorId, catalogs]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedVendorId(defaultVendorId);
      setSelectedTemplateId(defaultMaterialTypeId || null);
      setSelectedFamilyId(null);
      setMaterialName("");
      setWidth(undefined);
      setLength(undefined);
      setUnit("tờ");
      setBasisWeight(undefined);
    }
  }, [open, defaultVendorId, defaultMaterialTypeId]);

  // Sync selectedVendorId if defaultVendorId changes or vendors load
  useEffect(() => {
    if (open && vendors.length > 0 && selectedVendorId === undefined) {
      setSelectedVendorId(defaultVendorId ?? vendors[0]?.id);
    }
  }, [open, vendors, selectedVendorId, defaultVendorId]);

  // Auto-select first template if none selected
  useEffect(() => {
    if (open && availableTemplates.length > 0 && selectedTemplateId === null) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
  }, [open, availableTemplates, selectedTemplateId]);

  // When selectedTemplateId changes, sync material family & auto-fill initial materialName / unit
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        if (template.materialFamilyId) {
          setSelectedFamilyId(template.materialFamilyId);
        }
        // Auto-suggest initial materialName if currently empty
        setMaterialName(template.name || template.code || "");

        // Set default unit based on template name
        const nameLower = (template.name || "").toLowerCase();
        const codeLower = (template.code || "").toLowerCase();
        if (nameLower.includes("cuộn") || codeLower.includes("cuon") || nameLower.includes("màng") || nameLower.includes("mang")) {
          setUnit("cuộn");
        } else {
          setUnit("tờ");
        }
      }
    } else {
      setSelectedFamilyId(null);
    }
  }, [selectedTemplateId, templates]);

  // Auto-select default GSM spec if available
  useEffect(() => {
    if (hasGsmSpecs) {
      const defaultSpec = materialSpecs.find((s) => s.isDefault && (s.basisWeight ?? 0) > 0);
      if (defaultSpec && defaultSpec.basisWeight) {
        setBasisWeight(defaultSpec.basisWeight);
      } else {
        const firstValid = materialSpecs.find((s) => (s.basisWeight ?? 0) > 0);
        setBasisWeight(firstValid?.basisWeight);
      }
    } else {
      setBasisWeight(undefined);
    }
  }, [materialSpecs, hasGsmSpecs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendorId) {
      toast.error("Vui lòng chọn nhà cung cấp!");
      return;
    }

    if (!selectedTemplateId) {
      toast.error("Vui lòng chọn loại chất liệu!");
      return;
    }

    if (!materialName.trim()) {
      toast.error("Vui lòng nhập Tên vật tư (SKU)!");
      return;
    }

    const unitLower = (unit || "").toLowerCase().trim();
    const isRollType = !width || width === 0 || unitLower === "cuộn" || unitLower === "cuon" || unitLower === "m" || unitLower === "mét";

    const specDict: Record<string, string> = {};
    if (hasGsmSpecs && basisWeight) {
      specDict["gsm"] = basisWeight.toString();
    }

    createMaterial(
      {
        name: materialName.trim(),
        type: isRollType ? "cuon" : "to",
        length: length || 0,
        width: width || 0,
        unit: unit || "tờ",
        unitPrice: 0,
        basisWeight: hasGsmSpecs ? basisWeight : undefined,
        materialFamilyId: selectedFamilyId || currentTemplate?.materialFamilyId || undefined,
        materialTypeId: selectedTemplateId,
        specValues: Object.keys(specDict).length > 0 ? JSON.stringify(specDict) : undefined,
        vendorId: selectedVendorId,
      },
      {
        onSuccess: (newMaterial) => {
          toast.success("Tạo vật tư nhà cung cấp thành công!");
          onOpenChange(false);
          if (newMaterial?.id) {
            onSuccess?.(newMaterial.id, newMaterial, newMaterial.unit || undefined, newMaterial.unitPrice || undefined);
          }
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || "Tạo vật tư thất bại.";
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-slate-200 p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-indigo-700 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Tạo vật tư nhà cung cấp
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium pt-0.5">
              Nhà cung cấp: <strong className="text-indigo-800 font-semibold">{currentVendor?.name || (vendors.length > 0 ? vendors[0]?.name : "Chưa chọn")}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs py-1">
            {/* Chọn Nhà cung cấp nếu chưa khóa defaultVendorId */}
            {!defaultVendorId && vendors.length > 0 && (
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700">Chọn Nhà cung cấp *</Label>
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
            )}

            {/* Chọn loại chất liệu */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Chọn loại chất liệu *</Label>
              <Select
                value={selectedTemplateId?.toString() || ""}
                onValueChange={(val) => setSelectedTemplateId(Number(val))}
              >
                <SelectTrigger className="h-10 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Chọn loại chất liệu..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()} className="text-xs">
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tên vật tư (SKU) */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">
                Tên vật tư (SKU) <span className="text-red-500">*</span>
              </Label>
              <Input
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Nhập tên vật tư..."
                className="h-10 text-sm font-semibold bg-slate-50/50"
              />
            </div>

            {/* Định lượng (GSM) - Chỉ hiển thị đối với loại chất liệu dùng GSM (giấy...) */}
            {selectedTemplateId && hasGsmSpecs && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label className="font-semibold text-slate-700">
                  Định lượng (GSM) <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={basisWeight ? basisWeight.toString() : ""}
                  onValueChange={(v) => setBasisWeight(Number(v))}
                >
                  <SelectTrigger className="h-10 text-xs bg-slate-50/50">
                    <SelectValue placeholder="Chọn định lượng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materialSpecs
                      .filter((s) => (s.basisWeight ?? 0) > 0)
                      .map((spec) => (
                        <SelectItem key={spec.id} value={spec.basisWeight?.toString() || ""} className="text-xs">
                          <div className="flex items-center justify-between w-full">
                            <span>{spec.name || `${spec.basisWeight} gsm`}</span>
                            {spec.isDefault && (
                              <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
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

            {/* Đơn vị tính */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Đơn vị tính *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-10 text-xs bg-slate-50/50">
                  <SelectValue placeholder="Chọn đơn vị tính..." />
                </SelectTrigger>
                <SelectContent>
                  {["tờ", "cuộn", "kg", "cái", "lít", "m", "hộp", "thùng", "ram"].map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kích thước khổ vật tư */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700">Kích thước khổ vật tư</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Chiều rộng (cm)"
                    value={width ?? ""}
                    onChange={(e) => setWidth(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-10 text-xs text-center bg-slate-50/50 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block text-center">Chiều rộng (cm)</span>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Chiều dài (cm)"
                    value={length ?? ""}
                    onChange={(e) => setLength(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-10 text-xs text-center bg-slate-50/50 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block text-center">Chiều dài (cm)</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs px-5 font-medium rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 text-xs px-6 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Tạo vật tư
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
