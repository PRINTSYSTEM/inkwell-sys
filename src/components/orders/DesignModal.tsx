import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Ruler,
  FileText,
} from "lucide-react";
import type { CreateDesignRequestUI, DesignTypeResponse } from "./DesignCard";
import { useMaterialTypeDetail } from "@/hooks/use-material-type";
import {
  useSharedAddresses,
  useCreateSharedAddress,
  useUpdateSharedAddress,
} from "@/hooks/use-shared-address";
import { ENTITY_CONFIG } from "@/config/entities.config";

// Helper functions to determine classification requirements
const isDecalDesignType = (designTypeName: string): boolean => {
  return designTypeName.toLowerCase().includes("decal");
};

const isTuiDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("túi") ||
    designTypeName.toLowerCase().includes("tui") ||
    designTypeName.toLowerCase().includes("bag") ||
    designTypeName.toLowerCase().includes("pe") ||
    designTypeName.toLowerCase().includes("pa") ||
    designTypeName.toLowerCase().includes("metaline")
  );
};

const isHopDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("hộp") ||
    designTypeName.toLowerCase().includes("hop")
  );
};

const isNhanDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("nhãn") ||
    designTypeName.toLowerCase().includes("nhan")
  );
};

const isTuiXepHongDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("túi xếp hông") ||
    designTypeName.toLowerCase().includes("tui xep hong") ||
    designTypeName.toLowerCase().includes("túi xếp") ||
    designTypeName.toLowerCase().includes("tui xep")
  );
};

const isDecalCuonDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("decal cuộn") ||
    designTypeName.toLowerCase().includes("decal cuon") ||
    designTypeName.toLowerCase().includes("decal cuộn")
  );
};

const isTuiCuonDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("túi cuộn") ||
    designTypeName.toLowerCase().includes("tui cuon") ||
    designTypeName.toLowerCase().includes("túi cuộn")
  );
};

const isTheTreoMaterial = (materialName: string): boolean => {
  return (
    materialName.toLowerCase().includes("thẻ treo") ||
    materialName.toLowerCase().includes("the treo")
  );
};

const isTuiXepHongMaterial = (materialName: string): boolean => {
  return (
    materialName.toLowerCase().includes("túi xếp hông") ||
    materialName.toLowerCase().includes("tui xep hong") ||
    materialName.toLowerCase().includes("túi xếp") ||
    materialName.toLowerCase().includes("tui xep")
  );
};

// Material type definition
export type MaterialClassificationOption = {
  id: number;
  value: string;
};

export type MaterialClassification = {
  id: number;
  classificationName: string;
  classificationKey: string;
  options: MaterialClassificationOption[];
};

export type MaterialTypeResponse = {
  id: number;
  name: string;
  description?: string;
  minimumQuantity?: number;
  classifications?: MaterialClassification[];
};

type DesignModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  design: CreateDesignRequestUI | null;
  designTypes: DesignTypeResponse[];
  materials: MaterialTypeResponse[];
  loadingMaterials?: boolean;
  onSave: (design: CreateDesignRequestUI) => void;
  onDesignTypeChange?: (designTypeId: number) => void;
  isNew?: boolean;
};

const STEPS = [
  { id: 1, title: "Thông tin cơ bản", icon: Package },
  { id: 2, title: "Tùy chọn nâng cao", icon: FileText },
];

export const DesignModal: React.FC<DesignModalProps> = ({
  open,
  onOpenChange,
  design,
  designTypes,
  materials,
  loadingMaterials = false,
  onSave,
  onDesignTypeChange,
  isNew = true,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateDesignRequestUI>({
    id: "",
    designTypeId: 0,
    materialTypeId: 0,
    quantity: undefined,
    designName: "",
    length: 0,
    width: 0,
    height: 0,
    adhesiveOffset: undefined,
    requirements: "",
    additionalNotes: "",
    laminationType: undefined,
    sharedAddressId: undefined,
  });

  // Reset form when modal opens with design data
  useEffect(() => {
    if (open && design) {
      setFormData(design);
      setCurrentStep(1);
    } else if (open && !design) {
      setFormData({
        id: `new-${Date.now()}`,
        designTypeId: 0,
        materialTypeId: 0,
        quantity: undefined,
        designName: "",
        length: 0,
        width: 0,
        height: 0,
        adhesiveOffset: undefined,
        requirements: "",
        additionalNotes: "",
        laminationType: undefined,
        sidesClassification: undefined,
        processClassification: undefined,
        sharedAddressId: undefined,
        gusseted: false,
      });
      setCurrentStep(1);
    }
  }, [open, design]);

  const updateField = <K extends keyof CreateDesignRequestUI>(
    field: K,
    value: CreateDesignRequestUI[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectDesignType = (typeId: number) => {
    setFormData((prev) => {
      const designType = designTypes.find((dt) => dt.id === typeId);
      const isTui = designType ? isTuiDesignType(designType.name) : false;

      return {
        ...prev,
        designTypeId: typeId,
        materialTypeId: 0,
        sidesClassificationOptionId: undefined,
        processClassificationOptionId: undefined,
        sidesClassification: isTui ? "two_side" : undefined, // Túi mặc định 2 mặt
        processClassification: undefined,
        minQuantity: undefined,
        gusseted: false,
      };
    });
    // Notify parent to load materials for this design type
    onDesignTypeChange?.(typeId);
  };

  const handleSelectMaterial = (materialId: number) => {
    const mat = materials.find((m) => m.id === materialId);

    setFormData((prev) => {
      // Fix: If minimumQuantity is 0 or falsy, set to undefined to prevent rendering "0"
      const newMinQuantity =
        mat?.minimumQuantity && mat.minimumQuantity > 0
          ? mat.minimumQuantity
          : undefined;

      const designType = designTypes.find((dt) => dt.id === prev.designTypeId);
      const isTui = designType ? isTuiDesignType(designType.name) : false;

      return {
        ...prev,
        materialTypeId: materialId,
        minQuantity: newMinQuantity,
        sidesClassificationOptionId: undefined,
        processClassificationOptionId: undefined,
        sidesClassification: isTui ? "two_side" : undefined, // Túi mặc định 2 mặt
        processClassification: undefined,
      };
    });
  };

  // fetch shared addresses to allow selecting per-design delivery address
  const { data: sharedAddressesData, isLoading: loadingSharedAddresses } =
    useSharedAddresses({ pageNumber: 1, pageSize: 1000 });
  const sharedAddresses = sharedAddressesData?.items || [];
  const [sharedAddressSearch, setSharedAddressSearch] = useState<string>("");
  const filteredSharedAddresses = sharedAddresses.filter((sa: any) => {
    const text = `${sa.label || ""} ${sa.address || ""}`.toLowerCase();
    return text.includes(sharedAddressSearch.trim().toLowerCase());
  });

  // Create / update hooks
  const { mutate: createSharedAddress } = useCreateSharedAddress();
  const { mutate: updateSharedAddress } = useUpdateSharedAddress();
  // Dialog state for add/edit address
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressDialogLabel, setAddressDialogLabel] = useState("");
  const [addressDialogAddress, setAddressDialogAddress] = useState("");
  const [addressEditingId, setAddressEditingId] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!addressDialogOpen) {
      setAddressDialogLabel("");
      setAddressDialogAddress("");
      setAddressEditingId(undefined);
    }
  }, [addressDialogOpen]);

  const openAddAddressDialog = () => {
    setAddressEditingId(undefined);
    setAddressDialogLabel("");
    setAddressDialogAddress("");
    setAddressDialogOpen(true);
  };

  const openEditAddressDialog = () => {
    if (!formData.sharedAddressId) return;
    const sel = sharedAddresses.find(
      (s: any) => s.id === formData.sharedAddressId,
    );
    if (!sel) return;
    setAddressEditingId(sel.id);
    setAddressDialogLabel(sel.label || "");
    setAddressDialogAddress(sel.address || "");
    setAddressDialogOpen(true);
  };

  const handleAddressDialogSave = async () => {
    if (!addressDialogLabel?.trim()) return;
    try {
      if (addressEditingId) {
        await updateSharedAddress(addressEditingId, {
          label: addressDialogLabel.trim(),
          address: addressDialogAddress?.trim(),
        });
      } else {
        const created = await createSharedAddress({
          label: addressDialogLabel.trim(),
          address: addressDialogAddress?.trim(),
        });
        updateField("sharedAddressId", created.id);
      }
      setAddressDialogOpen(false);
    } catch (err) {
      // hook shows toast
    }
  };

  // Get material detail from API when on step 2 (quy trình nâng cao)
  const { data: materialDetail } = useMaterialTypeDetail(
    currentStep === 2 && formData.materialTypeId > 0
      ? formData.materialTypeId
      : null,
    currentStep === 2 && formData.materialTypeId > 0,
  );

  // Check if this is an existing design (read-only except quantity)
  const isExistingDesign = formData.isFromExisting && formData.designId;

  // Determine which classifications to show based on design type and material
  const selectedDesignType = designTypes.find(
    (dt) => dt.id === formData.designTypeId,
  );
  const selectedMaterial =
    materialDetail || materials.find((m) => m.id === formData.materialTypeId);

  const designTypeName = selectedDesignType?.name || "";
  const materialName = selectedMaterial?.name || "";

  const isDecal = isDecalDesignType(designTypeName);
  const isTui = isTuiDesignType(designTypeName);
  const isHop = isHopDesignType(designTypeName);
  const isNhan = isNhanDesignType(designTypeName);
  const isTheTreo = isTheTreoMaterial(materialName);
  const isTuiXepHong =
    formData.gusseted ||
    isTuiXepHongDesignType(designTypeName) ||
    isTuiXepHongMaterial(materialName);
  const isDecalCuon = isDecalCuonDesignType(designTypeName);
  const isTuiCuon = isTuiCuonDesignType(designTypeName);

  // Determine which classifications to show and auto-set values based on rules:
  // - Hộp: Bế, 1 mặt, Cán bóng hoặc cán mờ
  // - Nhãn giấy: Cắt, 1 mặt, Cán bóng, cán mờ, hoặc không cán
  // - Thẻ treo (nhãn giấy đặc biệt): Cắt, 1 hoặc 2 mặt (cho phép chọn), Cán bóng, cán mờ, hoặc không cán
  // - Decal: Bế, 1 mặt, Cán bóng, cán mờ, hoặc không cán
  // - Túi: Cắt, 2 mặt, Cán bóng hoặc cán mờ
  // - Túi xếp hông (túi đặc biệt): Bế, 2 mặt, Cán bóng hoặc cán mờ
  // - Decal cuộn: 1 mặt, Cán bóng, cán mờ, hoặc không cán (không có process)
  // - Túi cuộn: 2 mặt, Cán bóng hoặc cán mờ (không có process)

  // Determine which classifications to show
  const shouldShowSidesClassification =
    isDecal || // Decal: có cả sides và process
    (isTheTreo && isNhan) || // Thẻ treo (nhãn): chỉ có sides (cho phép chọn)
    isDecalCuon || // Decal cuộn: chỉ có sides
    isTuiCuon; // Túi cuộn: chỉ có sides

  const shouldShowProcessClassification =
    isDecal || // Decal: có cả sides và process
    isHop || // Hộp: có process (Bế)
    (isNhan && !isTheTreo) || // Nhãn giấy (trừ thẻ treo): có process (Cắt)
    (isTui && !isTuiXepHong) || // Túi (trừ túi xếp hông): có process (Cắt)
    isTuiXepHong; // Túi xếp hông: có process (Bế)

  // Auto-set classifications based on design type rules
  useEffect(() => {
    if (!selectedDesignType) return;

    const updates: Partial<CreateDesignRequestUI> = {};

    // Hộp: Bế, 1 mặt
    if (isHop) {
      updates.processClassification = "die_cut";
      updates.sidesClassification = "one_side";
    }
    // Nhãn giấy (trừ thẻ treo): Cắt, 1 mặt
    else if (isNhan && !isTheTreo) {
      updates.processClassification = "cut";
      updates.sidesClassification = "one_side";
    }
    // Thẻ treo (nhãn giấy đặc biệt): Cắt, cho phép chọn 1 hoặc 2 mặt (không auto-set)
    else if (isTheTreo && isNhan) {
      updates.processClassification = "cut";
      // Không auto-set sidesClassification, cho phép người dùng chọn
    }
    // Decal: Bế, 1 mặt
    else if (isDecal && !isDecalCuon) {
      updates.processClassification = "die_cut";
      updates.sidesClassification = "one_side";
    }
    // Túi (trừ túi xếp hông): Cắt, 2 mặt
    else if (isTui && !isTuiXepHong && !isTuiCuon) {
      updates.processClassification = "cut";
      updates.sidesClassification = "two_side";
    }
    // Túi xếp hông (túi đặc biệt): Bế, 2 mặt
    else if (isTuiXepHong) {
      updates.processClassification = "die_cut";
      updates.sidesClassification = "two_side";
    }
    // Decal cuộn: 1 mặt (không có process)
    else if (isDecalCuon) {
      updates.processClassification = undefined;
      updates.sidesClassification = "one_side";
    }
    // Túi cuộn: 2 mặt (không có process)
    else if (isTuiCuon) {
      updates.processClassification = undefined;
      updates.sidesClassification = "two_side";
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => {
        const finalUpdates = { ...updates };
        
        // Decal cho phép người dùng chọn Cắt/Bế ở Step 2, nên ta không ghi đè nếu đã có giá trị
        // (để giữ lại lựa chọn của người dùng khi edit thiết kế)
        if (isDecal && !isDecalCuon) {
          if (prev.processClassification && finalUpdates.processClassification) {
            delete finalUpdates.processClassification;
          }
          if (prev.sidesClassification && finalUpdates.sidesClassification) {
            delete finalUpdates.sidesClassification;
          }
        }
        
        // Thẻ treo cho phép chọn mặt, không ghi đè nếu đã có giá trị
        if (isTheTreo && isNhan) {
          if (prev.sidesClassification && finalUpdates.sidesClassification) {
            delete finalUpdates.sidesClassification;
          }
        }

        const hasChanges = Object.keys(finalUpdates).some(
          (k) => prev[k as keyof CreateDesignRequestUI] !== finalUpdates[k as keyof Partial<CreateDesignRequestUI>]
        );
        
        return hasChanges ? { ...prev, ...finalUpdates } : prev;
      });
    }
  }, [
    selectedDesignType,
    selectedMaterial,
    isHop,
    isNhan,
    isTheTreo,
    isDecal,
    isDecalCuon,
    isTui,
    isTuiXepHong,
    isTuiCuon,
  ]);

  // Reset width to 0 when design type is not Hộp or Túi xếp hông (check both design type and material type)
  useEffect(() => {
    if (!isHop && !isTuiXepHong && formData.width && formData.width > 0) {
      setFormData((prev) => ({
        ...prev,
        width: 0,
      }));
    }
  }, [isHop, isTuiXepHong, formData.width, materialName]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Tên thiết kế, loại thiết kế, chất liệu, kích thước (dài và cao bắt buộc, rộng bắt buộc cho hộp và túi xếp hông), số lượng
        const hasLength = (formData.length ?? 0) > 0;
        const hasHeight = (formData.height ?? 0) > 0;
        const hasWidth = (formData.width ?? 0) > 0;
        const needsWidth = isHop || isTuiXepHong; // Chỉ hộp và túi xếp hông cần rộng

        return (
          formData.designName?.trim() &&
          formData.designTypeId > 0 &&
          formData.materialTypeId > 0 &&
          hasLength &&
          hasHeight &&
          (needsWidth ? hasWidth : true) &&
          formData.quantity !== undefined &&
          formData.quantity > 0
        );
      case 2:
        // Step 2: Các option nâng cao - Cán màn bắt buộc, classification nếu có thì phải chọn
        // Bắt buộc chọn cán màn:
        // - Nhãn giấy và Decal: cho phép Cán bóng (glossy), Cán mờ (matte), hoặc Không cán (none)
        // - Các loại khác: chỉ cho phép Cán bóng (glossy) hoặc Cán mờ (matte)
        const validLaminationTypes =
          isNhan || isDecal
            ? ["glossy", "matte", "none"] // Nhãn giấy và Decal có thể chọn "không cán"
            : ["glossy", "matte"]; // Các loại khác chỉ cho phép cán bóng hoặc cán mờ
        if (
          !formData.laminationType ||
          !validLaminationTypes.includes(formData.laminationType)
        ) {
          return false;
        }
        // Validate classifications based on design type and material rules
        // Túi, Túi xếp hông, Túi cuộn, Decal cuộn không cần validate vì đã tự động set mặc định
        if (
          !isTui &&
          !isTuiXepHong &&
          !isTuiCuon &&
          !isDecalCuon &&
          shouldShowSidesClassification &&
          !formData.sidesClassification
        ) {
          return false;
        }
        // Validate process classification nếu cần hiển thị
        // Decal cuộn và Túi cuộn không có process classification
        if (
          shouldShowProcessClassification &&
          !isDecalCuon &&
          !isTuiCuon &&
          !formData.processClassification
        ) {
          return false;
        }
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 2 && canGoNext()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const isQuantityBelowMin =
    formData.minQuantity &&
    formData.quantity > 0 &&
    formData.quantity < formData.minQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {isNew ? "Thêm thiết kế mới" : "Chỉnh sửa thiết kế"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress steps */}
        <div className="flex items-center justify-between px-2 py-3 border-b">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "",
                      isCompleted ? "bg-primary/20 text-primary" : "",
                      !isActive && !isCompleted ? "bg-muted text-muted-foreground" : "",
                    ].join(" ")}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={
                      "text-xs font-medium hidden sm:block " +
                      (isActive ? "text-foreground" : "text-muted-foreground")
                    }
                  >
                    {step.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={
                      "flex-1 h-0.5 mx-2 " + (isCompleted ? "bg-primary/40" : "bg-muted")
                    }
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* Step 1: Basic Info - Tên, Loại thiết kế, Chất liệu, Kích thước, Số lượng */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Loại thiết kế và Chất liệu - Cùng một hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loại thiết kế */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Loại thiết kế <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={
                      formData.designTypeId > 0
                        ? formData.designTypeId.toString()
                        : undefined
                    }
                    onValueChange={(value) =>
                      handleSelectDesignType(Number(value))
                    }
                    disabled={!!isExistingDesign}
                  >
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Chọn loại thiết kế..." />
                    </SelectTrigger>
                    <SelectContent>
                      {designTypes.map((type) => (
                        <SelectItem
                          key={type.id}
                          value={type.id.toString()}
                          className="text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>{type.name}</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono ml-1"
                            >
                              {type.code}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.designTypeId > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {
                        designTypes.find(
                          (dt) => dt.id === formData.designTypeId,
                        )?.description
                      }
                    </p>
                  )}
                </div>

                {/* Chất liệu */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Chất liệu <span className="text-destructive">*</span>
                  </Label>
                  {loadingMaterials ? (
                    <p className="text-sm text-muted-foreground">
                      Đang tải chất liệu...
                    </p>
                  ) : materials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {formData.designTypeId > 0
                        ? "Không có chất liệu phù hợp"
                        : "Chọn loại thiết kế trước"}
                    </p>
                  ) : (
                    <Select
                      value={
                        formData.materialTypeId > 0
                          ? formData.materialTypeId.toString()
                          : undefined
                      }
                      onValueChange={(value) =>
                        handleSelectMaterial(Number(value))
                      }
                      disabled={materials.length === 0 || !!isExistingDesign}
                    >
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="Chọn chất liệu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material: MaterialTypeResponse) => (
                          <SelectItem
                            key={material.id}
                            value={material.id.toString()}
                            className="text-sm"
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{material.name}</p>
                                {material.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {material.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {/* Tên thiết kế */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Tên thiết kế <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder={
                    selectedDesignType
                      ? `VD: ${selectedDesignType.name} ...`
                      : "VD: Bao bì túi phân bón kali"
                  }
                  value={formData.designName}
                  onChange={(e) => updateField("designName", e.target.value)}
                  className="h-11"
                  disabled={!!isExistingDesign}
                />
                {isExistingDesign && (
                  <p className="text-xs text-muted-foreground">
                    Thiết kế có sẵn - không thể chỉnh sửa
                  </p>
                )}
              </div>

              {/* Tùy chọn cho Túi: Túi xếp hông */}
              {isTui && !isTuiCuon && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Túi xếp hông</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          gusseted: true,
                          width: prev.width,
                          processClassification: "die_cut"
                        }));
                      }}
                      disabled={!!isExistingDesign}
                      className={`
                        px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all
                        ${formData.gusseted 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-border bg-background hover:border-primary/50 text-muted-foreground"}
                        ${isExistingDesign ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      Có
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          gusseted: false,
                          width: 0,
                          processClassification: "cut"
                        }));
                      }}
                      disabled={!!isExistingDesign}
                      className={`
                        px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all
                        ${!formData.gusseted 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-border bg-background hover:border-primary/50 text-muted-foreground"}
                        ${isExistingDesign ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      Không
                    </button>
                  </div>
                </div>
              )}

              {/* (Đã chuyển: Địa chỉ giao hàng moved to Step 2 - Advanced Options) */}

              


              {/* Kích thước */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Kích thước (mm) <span className="text-destructive">*</span>
                </Label>
                <div
                  className={`grid gap-4 ${
                    isHop || isTuiXepHong
                      ? "grid-cols-3"
                      : isNhan
                        ? "grid-cols-3"
                        : "grid-cols-2"
                  }`}
                >
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Dài <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.length || ""}
                      onChange={(e) =>
                        updateField(
                          "length",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      className="h-11"
                      disabled={!!isExistingDesign}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Cao <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.height || ""}
                      onChange={(e) =>
                        updateField(
                          "height",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      className="h-11"
                      disabled={!!isExistingDesign}
                    />
                  </div>
                  {(isHop || isTuiXepHong) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Rộng <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.width || ""}
                        onChange={(e) =>
                          updateField(
                            "width",
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                        className="h-11"
                        disabled={!!isExistingDesign}
                      />
                    </div>
                  )}
                  {/* Mép dán - chỉ hiển thị cho nhãn giấy, cùng hàng với kích thước */}
                  {isNhan && !isHop && !isTuiXepHong && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Mép dán (mm)
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.adhesiveOffset || ""}
                        onChange={(e) =>
                          updateField(
                            "adhesiveOffset",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="h-11"
                        disabled={!!isExistingDesign}
                        min="0"
                      />
                    </div>
                  )}
                </div>
                {/* Tooltip cho Mép dán - chỉ hiển thị khi là nhãn giấy */}
                {isNhan && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Mép dán:</span> Khoảng cách từ
                    mép đến vị trí dán keo (nếu có)
                  </p>
                )}
              </div>

              {/* Số lượng */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Số lượng <span className="text-destructive">*</span>
                  {formData.minQuantity && formData.minQuantity > 0 ? (
                    <span className="ml-2 text-xs text-blue-500 font-normal">
                      (Tối thiểu: {formData.minQuantity.toLocaleString("vi-VN")}
                      )
                    </span>
                  ) : null}
                </Label>
                <Input
                  type="number"
                  placeholder="VD: 1000"
                  value={
                    formData.quantity !== undefined && formData.quantity > 0
                      ? formData.quantity.toString()
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField(
                      "quantity",
                      val === "" || val === "0" ? undefined : Number(val),
                    );
                  }}
                  className={`max-w-xs h-11 ${
                    isQuantityBelowMin ? "border-destructive" : ""
                  }`}
                />

                {/* Quick quantity buttons */}
                <div className="flex flex-wrap gap-2">
                  {[500, 1000, 2000, 3000, 4000].map((qty) => (
                    <Button
                      key={qty}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField("quantity", qty)}
                      className={`h-9 px-3 ${
                        formData.quantity === qty
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }`}
                    >
                      {qty.toLocaleString("vi-VN")}
                    </Button>
                  ))}
                </div>

                {isQuantityBelowMin && (
                  <p className="text-xs text-destructive">
                    Số lượng nhỏ hơn mức tối thiểu (
                    {formData.minQuantity?.toLocaleString("vi-VN")})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Advanced Options - Số mặt in, Quy trình sản xuất, Cán màng, Yêu cầu, Ghi chú */}
          {currentStep === 2 && (
            <div className="space-y-6">

              {/* Địa chỉ giao hàng dùng chung (moved here from Step 1)
              <div className="space-y-3">
                <Label className="text-sm font-medium">Địa chỉ giao hàng</Label>
                {loadingSharedAddresses ? (
                  <p className="text-sm text-muted-foreground">Đang tải địa chỉ...</p>
                ) : (
                  <div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Tìm địa chỉ..."
                        value={sharedAddressSearch}
                        onChange={(e) => setSharedAddressSearch(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={openAddAddressDialog}>Thêm</Button>
                      <Button
                        variant="outline"
                        disabled={!formData.sharedAddressId}
                        onClick={openEditAddressDialog}
                      >
                        Sửa
                      </Button>
                    </div>
                    <Select
                      value={formData.sharedAddressId ? formData.sharedAddressId.toString() : undefined}
                      onValueChange={(v) => updateField("sharedAddressId", v && v !== "0" ? Number(v) : undefined)}
                      disabled={!!isExistingDesign}
                    >
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="Chọn địa chỉ..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không chọn</SelectItem>
                        {filteredSharedAddresses.map((sa: any) => (
                          <SelectItem key={sa.id} value={sa.id.toString()} className="text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{sa.label}</span>
                              {sa.address && (
                                <span className="text-xs text-muted-foreground truncate">{sa.address}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{addressEditingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}</DialogTitle>
                          <DialogDescription>Thêm hoặc chỉnh sửa địa chỉ giao hàng dùng chung.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          <Input placeholder="Tên địa chỉ (bắt buộc)" value={addressDialogLabel} onChange={(e) => setAddressDialogLabel(e.target.value)} className="h-11" />
                          <Textarea placeholder="Địa chỉ chi tiết (tuỳ chọn)" value={addressDialogAddress} onChange={(e) => setAddressDialogAddress(e.target.value)} className="h-24" />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>Hủy</Button>
                          <Button onClick={handleAddressDialogSave}>{addressEditingId ? "Cập nhật" : "Thêm"}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div> */}
              {/* Classifications và Cán màng - Số mặt in, Quy trình sản xuất, Cán màng */}
              {(shouldShowSidesClassification ||
                shouldShowProcessClassification ||
                isTui ||
                isTuiXepHong ||
                isTuiCuon ||
                isDecalCuon ||
                isHop ||
                (isNhan && !isTheTreo)) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Số mặt in - hiển thị khi cần */}
                  {(shouldShowSidesClassification ||
                    isTui ||
                    isTuiXepHong ||
                    isTuiCuon ||
                    isDecalCuon ||
                    isHop ||
                    (isNhan && !isTheTreo)) && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Số mặt in
                        {(shouldShowSidesClassification ||
                          isTui ||
                          isTuiXepHong ||
                          isTuiCuon ||
                          isDecalCuon ||
                          isHop ||
                          (isNhan && !isTheTreo)) && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      {/* Cho phép chọn khi là thẻ treo */}
                      {shouldShowSidesClassification && isTheTreo && isNhan ? (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(
                            ENTITY_CONFIG.sidesClassification.values,
                          ).map(([key, label]) => {
                            const isSelected =
                              formData.sidesClassification === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  updateField("sidesClassification", key);
                                }}
                                disabled={!!isExistingDesign}
                                className={`
                                  px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                                  ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:border-primary/50"
                                  }
                                  ${
                                    isExistingDesign
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                                `}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        // Hiển thị thông tin (không cho chọn) cho các trường hợp auto-set
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                          <Badge variant="outline" className="text-sm">
                            {formData.sidesClassification
                              ? ENTITY_CONFIG.sidesClassification.values[
                                  formData.sidesClassification
                                ]
                              : "—"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            (Tự động thiết lập)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quy trình sản xuất - chỉ hiển thị khi cần */}
                  {shouldShowProcessClassification && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Quy trình sản xuất{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      {isDecal && !isDecalCuon ? (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(
                            ENTITY_CONFIG.processClassification.values,
                          ).map(([key, label]) => {
                            const isSelected =
                              formData.processClassification === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  updateField("processClassification", key);
                                }}
                                disabled={!!isExistingDesign}
                                className={`
                                  px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                                  ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:border-primary/50"
                                  }
                                  ${
                                    isExistingDesign
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                                `}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                          <Badge variant="outline" className="text-sm">
                            {formData.processClassification
                              ? ENTITY_CONFIG.processClassification.values[
                                  formData.processClassification
                                ]
                              : "—"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            (Tự động thiết lập)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cán màn - Bắt buộc - chung hàng với 2 tùy chọn kia */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Cán màng <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ENTITY_CONFIG.laminationTypes.values)
                        .filter(([key]) => {
                          // Nhãn giấy và Decal: hiển thị Cán bóng, Cán mờ, và Không cán
                          if (isNhan || isDecal) {
                            return (
                              key === "glossy" ||
                              key === "matte" ||
                              key === "none"
                            );
                          }
                          // Các loại khác: chỉ hiển thị Cán bóng và Cán mờ
                          return key === "glossy" || key === "matte";
                        })
                        .map(([key, label]) => {
                          const isSelected = formData.laminationType === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                updateField("laminationType", key);
                              }}
                              disabled={!!isExistingDesign}
                              className={`
                            px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                            ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50"
                            }
                            ${
                              isExistingDesign
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                          `}
                            >
                              {label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Yêu cầu thiết kế */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Yêu cầu thiết kế</Label>
                <Textarea
                  placeholder="Mô tả chi tiết: màu sắc, bố cục, nội dung, logo..."
                  value={formData.requirements || ""}
                  onChange={(e) => updateField("requirements", e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={!!isExistingDesign}
                />
              </div>

              {/* Ghi chú thiết kế */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Ghi chú thiết kế</Label>
                <Textarea
                  placeholder="Ghi chú bổ sung cho thiết kế này (nếu có)..."
                  value={formData.additionalNotes || ""}
                  onChange={(e) =>
                    updateField("additionalNotes", e.target.value)
                  }
                  rows={3}
                  className="resize-none"
                  disabled={!!isExistingDesign}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className="gap-1"
              >
                Tiếp tục
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSave}>
                {isNew ? "Thêm thiết kế" : "Lưu thay đổi"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DesignModal;
