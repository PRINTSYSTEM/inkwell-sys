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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Layers,
  Ruler,
  FileText,
  User,
  Building2,
} from "lucide-react";
import type { DesignResponse } from "@/Schema/design.schema";

type ExistingDesignModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  design: DesignResponse | null;
  onConfirm: (design: DesignResponse, quantity: number, laminationType: string) => void;
};

export const ExistingDesignModal: React.FC<ExistingDesignModalProps> = ({
  open,
  onOpenChange,
  design,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [laminationType, setLaminationType] = useState<string>("");

  // Reset quantity and laminationType when modal opens/closes
  useEffect(() => {
    if (open) {
      setQuantity(0);
      setLaminationType("");
    }
  }, [open]);

  const handleConfirm = () => {
    const validLaminationTypes = Object.keys(
      ENTITY_CONFIG.laminationTypes.values
    );
    if (
      design &&
      quantity > 0 &&
      laminationType &&
      validLaminationTypes.includes(laminationType)
    ) {
      onConfirm(design, quantity, laminationType);
      setQuantity(0);
      setLaminationType("");
      onOpenChange(false);
    }
  };

  if (!design) return null;

  const sizeLabel =
    design.width && design.height
      ? `${design.length || 0} × ${design.width} × ${design.height} mm`
      : "Chưa có";

  const minQuantity = design.materialType?.minimumQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            Chi tiết thiết kế có sẵn
          </DialogTitle>
          <DialogDescription>
            Xem thông tin chi tiết thiết kế. Chỉ có thể thay đổi số lượng.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge variant="outline" className="font-mono text-xs mb-2">
                    {design.code || `DES-${design.id}`}
                  </Badge>
                  <h3 className="font-semibold text-base">
                    {design.designName || "Không tên"}
                  </h3>
                </div>
              </div>

              <Separator />

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loại thiết kế */}
                {design.designType && (
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Loại thiết kế
                      </p>
                      <p className="text-sm font-medium">
                        {design.designType.name}
                      </p>
                      {design.designType.code && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono mt-1"
                        >
                          {design.designType.code}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Chất liệu */}
                {design.materialType && (
                  <div className="flex items-start gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Chất liệu
                      </p>
                      <p className="text-sm font-medium">
                        {design.materialType.name}
                      </p>
                      {minQuantity && minQuantity > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Số lượng tối thiểu:{" "}
                          {minQuantity.toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Kích thước */}
                {(design.length || design.width || design.height) && (
                  <div className="flex items-start gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Kích thước (mm)
                      </p>
                      <p className="text-sm font-medium">{sizeLabel}</p>
                    </div>
                  </div>
                )}

                {/* Số mặt in */}
                {design.sidesClassification && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Số mặt in
                      </p>
                      <p className="text-sm font-medium">
                        {design.sidesClassification}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quy trình sản xuất */}
                {design.processClassification && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Quy trình sản xuất
                      </p>
                      <p className="text-sm font-medium">
                        {design.processClassification}
                      </p>
                    </div>
                  </div>
                )}

                {/* Designer */}
                {design.designer && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Người thiết kế
                      </p>
                      <p className="text-sm font-medium">
                        {(design.designer.name as string) ||
                          (design.designer.username as string) ||
                          "—"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer */}
                {design.customer && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Khách hàng
                      </p>
                      <p className="text-sm font-medium">
                        {(design.customer.companyName as string) ||
                          (design.customer.name as string) ||
                          "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Yêu cầu thiết kế */}
            {(design.latestRequirements || design.notes) && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    Yêu cầu thiết kế
                  </Label>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {String(design.latestRequirements || design.notes || "")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Quantity input - Only editable field */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Số lượng <span className="text-destructive">*</span>
                </Label>
                {minQuantity && minQuantity > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Số lượng tối thiểu:{" "}
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {minQuantity.toLocaleString("vi-VN")}
                    </span>
                  </p>
                )}
              </div>
              <Input
                type="number"
                placeholder="VD: 1000"
                value={quantity || ""}
                onChange={(e) =>
                  setQuantity(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="h-11 w-full"
                min={minQuantity && minQuantity > 0 ? minQuantity : 1}
                autoFocus
              />
              {minQuantity &&
                minQuantity > 0 &&
                quantity > 0 &&
                quantity < minQuantity && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>⚠️</span>
                    <span>
                      Số lượng nhỏ hơn mức tối thiểu (
                      {minQuantity.toLocaleString("vi-VN")})
                    </span>
                  </p>
                )}
            </div>

            {/* Cán màn - Bắt buộc */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Cán màn <span className="text-destructive">*</span>
              </Label>
              <Select
                value={laminationType}
                onValueChange={(value) => setLaminationType(value)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Chọn loại cán màn" />
                </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      ENTITY_CONFIG.laminationTypes.values
                    ).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              quantity <= 0 ||
              (minQuantity && minQuantity > 0 && quantity < minQuantity) ||
              !laminationType ||
              !Object.keys(ENTITY_CONFIG.laminationTypes.values).includes(
                laminationType
              )
            }
          >
            Thêm vào đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExistingDesignModal;
