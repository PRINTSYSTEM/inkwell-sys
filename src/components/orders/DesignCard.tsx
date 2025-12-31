import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, AlertCircle, CheckCircle2, Package, Layers, Ruler, FileText } from "lucide-react";
import { ENTITY_CONFIG } from "@/config/entities.config";

// Type definition for DesignType - matches API response
export type DesignTypeResponse = {
  id: number;
  name: string;
  code: string;
  description?: string;
};

// Material type definition
export type MaterialTypeResponse = {
  id: number;
  name: string;
  description?: string;
  minimumQuantity?: number;
};

export type CreateDesignRequestUI = {
  id: string;
  designCode?: string;
  designId?: number;
  isFromExisting?: boolean;
  designTypeId: number;
  materialTypeId: number;
  assignedDesignerId?: number;
  quantity: number;
  designName: string;
  length?: number;
  width?: number;
  height?: number;
  depth?: number;
  requirements?: string;
  additionalNotes?: string;
  minQuantity?: number;
  sidesClassificationOptionId?: number; // Deprecated - kept for backward compatibility
  processClassificationOptionId?: number; // Deprecated - kept for backward compatibility
  sidesClassification?: string | null; // New: stores classification value directly
  processClassification?: string | null; // New: stores classification value directly
  laminationType?: string | null;
};

type DesignCardProps = {
  design: CreateDesignRequestUI;
  index: number;
  designTypes: DesignTypeResponse[];
  materials?: MaterialTypeResponse[];
  onEdit: (design: CreateDesignRequestUI) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

const generateDesignCodePreview = (
  designTypeId: number,
  designTypes: DesignTypeResponse[]
) => {
  if (!designTypeId) return "";
  const dt = designTypes.find((x) => x.id === designTypeId);
  return dt ? `${dt.code}xxx` : "";
};

const isDesignValid = (design: CreateDesignRequestUI): boolean => {
  if (design.isFromExisting && design.designId) {
    const minQty = design.minQuantity || 0;
    return (
      design.designId > 0 &&
      design.quantity > 0 &&
      (minQty === 0 || design.quantity >= minQty)
    );
  } else {
    const minQty = design.minQuantity || 0;
    return (
      design.materialTypeId > 0 &&
      !!design.designName?.trim() &&
      design.quantity > 0 &&
      (minQty === 0 || design.quantity >= minQty) &&
      (design.length ?? 0) > 0 &&
      (design.height ?? 0) > 0
    );
  }
};

export const DesignCard: React.FC<DesignCardProps> = ({
  design,
  index,
  designTypes,
  materials = [],
  onEdit,
  onRemove,
  canRemove,
}) => {
  const isValid = isDesignValid(design);
  const designType = designTypes.find((dt) => dt.id === design.designTypeId);
  const material = materials.find((m) => m.id === design.materialTypeId);

  return (
    <div
      className={`
        group relative rounded-lg border p-4 transition-all hover:shadow-sm
        ${
          design.isFromExisting
            ? "bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
            : "bg-muted/30 border-l-4 border-l-primary/60"
        }
        ${!isValid ? "border-amber-300 dark:border-amber-600" : ""}
      `}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {isValid ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Index badge */}
        <div
          className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold
          ${
            design.isFromExisting
              ? "bg-blue-500/10 text-blue-600"
              : "bg-primary/10 text-primary"
          }
        `}
        >
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header - Tên thiết kế */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-base">
                  {design.designName || `Thiết kế #${index + 1}`}
                </span>
                <Badge
                  variant={design.isFromExisting ? "secondary" : "outline"}
                  className={`text-[10px] shrink-0 ${
                    design.isFromExisting
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : ""
                  }`}
                >
                  {design.isFromExisting ? "Có sẵn" : "Mới"}
                </Badge>
              </div>

              {/* Code preview */}
              {(design.designCode || design.designTypeId > 0) && (
                <p className="text-xs text-muted-foreground font-mono">
                  {design.designCode ||
                    generateDesignCodePreview(design.designTypeId, designTypes)}
                </p>
              )}
            </div>
          </div>

          {/* Info Grid - Loại thiết kế, Chất liệu, Số lượng, Kích thước */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Loại thiết kế */}
            {designType && (
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Loại thiết kế</p>
                  <p className="font-medium">{designType.name}</p>
                </div>
              </div>
            )}

            {/* Chất liệu */}
            {material && (
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Chất liệu</p>
                  <p className="font-medium">{material.name}</p>
                </div>
              </div>
            )}

            {/* Số lượng */}
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Số lượng</p>
                <p className={`font-medium ${design.quantity > 0 ? "text-foreground" : "text-amber-600"}`}>
                  {design.quantity > 0
                    ? design.quantity.toLocaleString("vi-VN")
                    : "Chưa nhập"}
                  {design.minQuantity && design.minQuantity > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Min: {design.minQuantity.toLocaleString("vi-VN")})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Kích thước */}
            {(design.length || design.width || design.height) && (
              <div className="flex items-start gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Kích thước</p>
                  <p className="font-medium">
                    {design.length || 0} × {design.height || 0} {design.width ? `× ${design.width}` : ""} mm
                  </p>
                </div>
              </div>
            )}

            {/* Cán màn */}
            {design.laminationType && (
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Cán màn</p>
                  <p className="font-medium">
                    {ENTITY_CONFIG.laminationTypes.values[
                      design.laminationType as keyof typeof ENTITY_CONFIG.laminationTypes.values
                    ] || design.laminationType}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Yêu cầu thiết kế */}
          {design.requirements && (
            <div className="flex items-start gap-2 pt-1 border-t">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-1">Yêu cầu thiết kế</p>
                <p className="text-sm text-foreground line-clamp-2">
                  {design.requirements}
                </p>
              </div>
            </div>
          )}

          {/* Validation warning */}
          {!isValid && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Chưa điền đủ thông tin
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(design)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(design.id)}
              className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignCard;
