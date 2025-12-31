import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ENTITY_CONFIG } from "@/config/entities.config";

// Helper functions to determine classification requirements
const isDecalDesignType = (designTypeName: string): boolean => {
  return designTypeName.toLowerCase().includes("decal");
};

const isTuiDesignType = (designTypeName: string): boolean => {
  return (
    designTypeName.toLowerCase().includes("túi") ||
    designTypeName.toLowerCase().includes("tui")
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

const isTheTreoMaterial = (materialName: string): boolean => {
  return (
    materialName.toLowerCase().includes("thẻ treo") ||
    materialName.toLowerCase().includes("the treo")
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
    requirements: "",
    additionalNotes: "",
    laminationType: undefined,
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
        requirements: "",
        additionalNotes: "",
        laminationType: undefined,
        sidesClassification: undefined,
        processClassification: undefined,
      });
      setCurrentStep(1);
    }
  }, [open, design]);

  const updateField = <K extends keyof CreateDesignRequestUI>(
    field: K,
    value: CreateDesignRequestUI[K]
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

  // Get material detail from API when on step 2 (quy trình nâng cao)
  const { data: materialDetail } = useMaterialTypeDetail(
    currentStep === 2 && formData.materialTypeId > 0
      ? formData.materialTypeId
      : null,
    currentStep === 2 && formData.materialTypeId > 0
  );

  // Check if this is an existing design (read-only except quantity)
  const isExistingDesign = formData.isFromExisting && formData.designId;

  // Determine which classifications to show based on design type and material
  const selectedDesignType = designTypes.find(
    (dt) => dt.id === formData.designTypeId
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

  // Determine which classifications to show based on rules:
  // - decal: có cả sidesClass và processClass
  // - thẻ treo: chỉ có sidesClass (khi là nhãn)
  // - túi: mặc định 2 mặt, không hiển thị (tự động set)
  // - hộp và nhãn (trừ thẻ treo): không có classification
  const shouldShowSidesClassification =
    isDecal || // Decal: có cả sides và process
    (isTheTreo && isNhan); // Thẻ treo (nhãn): chỉ có sides

  const shouldShowProcessClassification = isDecal; // Decal: có cả sides và process

  // For Túi: automatically set to 2 mặt, don't show selector
  useEffect(() => {
    if (isTui && formData.sidesClassification !== "two_side") {
      setFormData((prev) => ({
        ...prev,
        sidesClassification: "two_side",
      }));
    }
  }, [isTui, formData.sidesClassification]);

  // Reset width to 0 when design type is not Túi or Hộp
  useEffect(() => {
    if (!isTui && !isHop && formData.width && formData.width > 0) {
      setFormData((prev) => ({
        ...prev,
        width: 0,
      }));
    }
  }, [isTui, isHop, formData.width]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Tên thiết kế, loại thiết kế, chất liệu, kích thước (dài và cao bắt buộc, rộng bắt buộc cho túi và hộp), số lượng
        const hasLength = (formData.length ?? 0) > 0;
        const hasHeight = (formData.height ?? 0) > 0;
        const hasWidth = (formData.width ?? 0) > 0;
        const needsWidth = isTui || isHop; // Túi xếp hông và hộp cần rộng
        
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
        // Bắt buộc chọn cán màn - check against valid lamination types from config
        const validLaminationTypes = Object.keys(
          ENTITY_CONFIG.laminationTypes.values
        );
        if (
          !formData.laminationType ||
          !validLaminationTypes.includes(formData.laminationType)
        ) {
          return false;
        }
        // Validate classifications based on design type and material rules
        // Túi không cần validate vì đã tự động set mặc định
        if (
          !isTui &&
          shouldShowSidesClassification &&
          !formData.sidesClassification
        ) {
          return false;
        }
        if (
          shouldShowProcessClassification &&
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
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors
                      ${isActive ? "bg-primary text-primary-foreground" : ""}
                      ${isCompleted ? "bg-primary/20 text-primary" : ""}
                      ${
                        !isActive && !isCompleted
                          ? "bg-muted text-muted-foreground"
                          : ""
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? "bg-primary/40" : "bg-muted"
                    }`}
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
              {/* Tên thiết kế */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Tên thiết kế <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="VD: Bao bì túi phân bón kali"
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
                          (dt) => dt.id === formData.designTypeId
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

              {/* Kích thước */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Kích thước (mm) <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-4">
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
                          e.target.value === "" ? 0 : Number(e.target.value)
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
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      className="h-11"
                      disabled={!!isExistingDesign}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Rộng {isTui || isHop ? <span className="text-destructive">*</span> : ""}
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.width || ""}
                      onChange={(e) =>
                        updateField(
                          "width",
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      className="h-11"
                      disabled={!!isExistingDesign || (!isTui && !isHop)}
                    />
                  </div>
                </div>
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
                      val === "" || val === "0" ? undefined : Number(val)
                    );
                  }}
                  className={`max-w-xs h-11 ${
                    isQuantityBelowMin ? "border-destructive" : ""
                  }`}
                />

                {isQuantityBelowMin && (
                  <p className="text-xs text-destructive">
                    Số lượng nhỏ hơn mức tối thiểu (
                    {formData.minQuantity?.toLocaleString("vi-VN")})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Advanced Options - Số mặt in, Quy trình sản xuất, Yêu cầu, Ghi chú */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Classifications - Số mặt in, Quy trình sản xuất - Based on rules */}
              {(shouldShowSidesClassification ||
                shouldShowProcessClassification ||
                isTui) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Số mặt in - chỉ hiển thị khi cần chọn (không phải túi) */}
                  {shouldShowSidesClassification && !isTui && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Số mặt in <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          ENTITY_CONFIG.sidesClassification.values
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
                    </div>
                  )}

                  {/* Túi: mặc định 2 mặt, chỉ hiển thị thông tin (không cho chọn) */}
                  {isTui && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Số mặt in</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                        <Badge variant="outline" className="text-sm">
                          {ENTITY_CONFIG.sidesClassification.values.two_side}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          (Mặc định cho loại túi)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quy trình sản xuất */}
                  {shouldShowProcessClassification && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Quy trình sản xuất{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          ENTITY_CONFIG.processClassification.values
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
                    </div>
                  )}
                </div>
              )}

              {/* Cán màn - Bắt buộc */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Cán màn <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.laminationType || ""}
                  onValueChange={(value) =>
                    updateField("laminationType", value)
                  }
                >
                  <SelectTrigger className="max-w-xs h-11">
                    <SelectValue placeholder="Chọn loại cán màn" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_CONFIG.laminationTypes.values).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

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

              {/* Ghi chú thêm */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Ghi chú thêm</Label>
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
