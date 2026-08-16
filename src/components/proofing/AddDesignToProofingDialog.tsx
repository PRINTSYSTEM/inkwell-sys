import { useState, useMemo, useEffect } from "react";
import type { DesignItem } from "@/types/proofing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { sidesClassificationLabels } from "@/lib/status-utils";

interface AddDesignToProofingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDesigns: DesignItem[];
  materialTypeName?: string;
  currentDesign?: DesignItem | null; // Design hiện tại để so sánh quy cách
  onSubmit: (
    orderDetailItems: Array<{
      orderDetailId: number | null;
      readyDesignId: number | null;
      quantity: number;
      side?: "both" | "front" | "back";
    }>
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddDesignToProofingDialog({
  open,
  onOpenChange,
  availableDesigns,
  materialTypeName = "",
  currentDesign = null,
  onSubmit,
  isSubmitting = false,
}: AddDesignToProofingDialogProps) {
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [designSides, setDesignSides] = useState<
    Record<number, "both" | "front" | "back">
  >({});
  const [selectedDesignIds, setSelectedDesignIds] = useState<Set<number>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Helper functions to check design type
  const isNhanDesignType = (designTypeName: string): boolean => {
    return (
      designTypeName.toLowerCase().includes("nhãn") ||
      designTypeName.toLowerCase().includes("nhan")
    );
  };

  const isDecalDesignType = (designTypeName: string): boolean => {
    return designTypeName.toLowerCase().includes("decal");
  };

  // Filter designs to only show those with same specifications as current design
  const filteredDesigns = useMemo(() => {
    if (!currentDesign) {
      // If no current design, show all available designs
      return availableDesigns;
    }

    return availableDesigns.filter((design) => {
      // Chỉ ràng buộc cùng loại thiết kế (designTypeId), bỏ ràng buộc chất liệu (materialTypeId)
      const hasSameDesignType = design.designTypeId === currentDesign.designTypeId;
      if (!hasSameDesignType) return false;

      // Tìm kiếm theo mã hàng hoặc tên hàng
      if (searchTerm.trim()) {
        const lowerSearch = searchTerm.toLowerCase().trim();
        return (
          design.code?.toLowerCase().includes(lowerSearch) ||
          design.name?.toLowerCase().includes(lowerSearch)
        );
      }

      return true;
    });
  }, [availableDesigns, currentDesign, searchTerm]);

  // Set default quantities when modal opens
  useEffect(() => {
    if (open) {
      const initialQuantities: Record<number, number> = {};
      const initialSides: Record<number, "both" | "front" | "back"> = {};
      const initialSelected = new Set<number>();
      filteredDesigns.forEach((design) => {
        initialQuantities[design.id] = 0;
        initialSides[design.id] = "both";
      });
      setDesignQuantities(initialQuantities);
      setDesignSides(initialSides);
      setSelectedDesignIds(initialSelected);
    } else {
      setDesignQuantities({});
      setDesignSides({});
      setSelectedDesignIds(new Set());
    }
  }, [open, filteredDesigns]);

  // Handle checkbox toggle - set quantity to max when checked, 0 when unchecked
  const handleToggleDesign = (design: DesignItem) => {
    const isSelected = selectedDesignIds.has(design.id);
    const maxQty =
      design.availableQuantity !== undefined && design.availableQuantity >= 0
        ? design.availableQuantity
        : design.quantity;

    setSelectedDesignIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(design.id);
        setDesignQuantities((qty) => ({ ...qty, [design.id]: 0 }));
      } else {
        next.add(design.id);
        setDesignQuantities((qty) => ({ ...qty, [design.id]: maxQty }));
      }
      return next;
    });
  };

  const handleQuantityChange = (
    id: number,
    value: string,
    maxQty: number,
    availableQty?: number
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      const maxAvailable =
        availableQty !== undefined && availableQty >= 0 ? availableQty : maxQty;
      const clampedValue = Math.min(Math.max(0, numValue), maxAvailable);
      setDesignQuantities((prev) => ({
        ...prev,
        [id]: clampedValue,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate design quantities
      const invalidDesigns = filteredDesigns.filter((design) => {
        const qty = designQuantities[design.id] || 0;
        if (qty <= 0) return false;

        const maxAllowedQty =
          design.availableQuantity !== undefined &&
          design.availableQuantity >= 0
            ? design.availableQuantity
            : design.quantity;

        return qty > maxAllowedQty;
      });

      if (invalidDesigns.length > 0) {
        toast.error("Lỗi", {
          description: `Số lượng lấy vượt quá số lượng còn lại chưa bình bài cho ${invalidDesigns.length} mã hàng. Vui lòng kiểm tra lại.`,
        });
        return;
      }

      // Build orderDetailItems - only include selected designs with quantity > 0
      const orderDetailItems = Object.entries(designQuantities)
        .filter(
          ([id, qty]) => selectedDesignIds.has(parseInt(id, 10)) && qty > 0
        )
        .map(([id, qty]) => {
          const quantity = Number.isInteger(qty) ? qty : Math.floor(qty);
          if (quantity <= 0) {
            throw new Error("Số lượng phải lớn hơn 0");
          }
          const designId = parseInt(id, 10);
          const design = filteredDesigns.find((d) => d.id === designId);
          const isPoolDesign = design?.queueItemId?.startsWith("RD_") || false;
          return {
            orderDetailId: isPoolDesign ? null : (design?.id ?? null),
            readyDesignId: design?.readyDesignId ?? design?.designId ?? null,
            quantity: quantity,
            side: designSides[designId] || "both",
          };
        });

      if (orderDetailItems.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn ít nhất một mã hàng để thêm vào bình bài",
        });
        return;
      }

      await onSubmit(orderDetailItems);
      // Reset state and close dialog on success
      setDesignQuantities({});
      setSelectedDesignIds(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add designs:", error);
      // Don't close dialog on error so user can retry
    }
  };

  const selectedCount = useMemo(() => {
    return selectedDesignIds.size;
  }, [selectedDesignIds]);

  const hasValidQuantities = useMemo(() => {
    return Array.from(selectedDesignIds).some((designId) => {
      const qty = designQuantities[designId] || 0;
      return qty > 0;
    });
  }, [selectedDesignIds, designQuantities]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Compact Header */}
        <DialogHeader className="px-5 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Thêm thiết kế vào Bình Bài
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {filteredDesigns.length} mã hàng có sẵn
                  {currentDesign &&
                    ` (loại: ${currentDesign.designTypeName})`}
                  {" • "}
                  {selectedCount} đã chọn
                </DialogDescription>
              </div>
            </div>
          <div className="flex items-center gap-3 w-full max-w-sm ml-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hàng, tên hàng..."
                className="h-8 pl-8 text-xs bg-muted/30 focus-visible:ring-primary/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedCount > 0 && (
              <Badge variant="default" className="text-[10px] h-5 bg-primary/90">
                {selectedCount} đã chọn
              </Badge>
            )}
          </div>
        </div>
      </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={
                      filteredDesigns.length > 0 &&
                      filteredDesigns.every((d) => selectedDesignIds.has(d.id))
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const allSelected = new Set<number>();
                        const newQuantities: Record<number, number> = {};
                        filteredDesigns.forEach((design) => {
                          allSelected.add(design.id);
                          const maxQty =
                            design.availableQuantity !== undefined &&
                            design.availableQuantity >= 0
                              ? design.availableQuantity
                              : design.quantity;
                          newQuantities[design.id] = maxQty;
                        });
                        setSelectedDesignIds(allSelected);
                        setDesignQuantities((prev) => ({
                          ...prev,
                          ...newQuantities,
                        }));
                      } else {
                        const newQuantities: Record<number, number> = {};
                        filteredDesigns.forEach((design) => {
                          newQuantities[design.id] = 0;
                        });
                        setSelectedDesignIds(new Set());
                        setDesignQuantities((prev) => ({
                          ...prev,
                          ...newQuantities,
                        }));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-16 text-center">Ảnh</TableHead>
                <TableHead className="min-w-[200px]">mã hàng</TableHead>
                <TableHead className="w-32">Kích thước</TableHead>
                <TableHead className="w-24 text-right">Đặt hàng</TableHead>
                <TableHead className="w-24 text-right">Còn lại</TableHead>
                <TableHead className="w-40">Chất liệu</TableHead>
                <TableHead className="w-32">Mặt in</TableHead>
                <TableHead className="w-48">Số lượng lấy</TableHead>
                <TableHead className="w-28 text-right">Sau khi lấy</TableHead>
                <TableHead className="w-40 text-center">Thời gian tạo</TableHead>
                <TableHead className="w-16 text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesigns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center text-muted-foreground py-8"
                  >
                    {currentDesign
                      ? `Không có mã hàng nào cùng quy cách với ${currentDesign.materialTypeName} - ${currentDesign.designTypeName}`
                      : "Không có mã hàng nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDesigns.map((design, index) => {
                  const currentQty = designQuantities[design.id] || 0;
                  const isSelected = selectedDesignIds.has(design.id);
 
                  const baseAvailableQty =
                    design.availableQuantity !== undefined &&
                    design.availableQuantity >= 0
                      ? design.availableQuantity
                      : design.quantity;
 
                  const maxQty = baseAvailableQty;
                  const remainingQty = Math.max(
                    0,
                    baseAvailableQty - currentQty
                  );
                  const isValid = currentQty > 0 && currentQty <= maxQty;
                  const isExceeded = currentQty > maxQty;
                  const hasAvailableQuantity =
                    design.availableQuantity !== undefined;
 
                  return (
                    <TableRow
                      key={design.id}
                      className={cn(
                        "hover:bg-muted/30",
                        isSelected && isValid && "bg-green-50/30",
                        isSelected && isExceeded && "bg-red-50/30"
                      )}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleDesign(design)}
                        />
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        {design.thumbnailUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingImage({
                                url: design.thumbnailUrl,
                                title: design.name,
                              });
                            }}
                            className="w-10 h-10 rounded object-cover bg-muted overflow-hidden hover:opacity-80 transition-opacity mx-auto block"
                          >
                            <img
                              src={design.thumbnailUrl}
                              alt={design.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{design.name}</div>
                          <code className="text-xs text-muted-foreground font-mono">
                            {design.code}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {design.dimensions && design.dimensions.replace("x", " × ")}
                          {!design.dimensions && design.length && design.height && (
                            <>
                              {`${design.length} × ${design.height} mm`}
                            </>
                          )}
                          {!design.dimensions && !(design.length && design.height) && (
                            <span className="text-xs">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {design.quantity.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {hasAvailableQuantity ? (
                          <span
                            className={cn(
                              "text-sm font-medium",
                              design.availableQuantity! > 0
                                ? "text-green-600"
                                : design.availableQuantity! === 0
                                  ? "text-orange-600"
                                  : "text-red-600"
                            )}
                          >
                            {design.availableQuantity!.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-[150px] truncate" title={design.materialTypeName}>
                          {design.materialTypeName || "—"}
                          {design.basisWeight && design.basisWeight > 0 ? ` (${design.basisWeight} gsm)` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={designSides[design.id] || "both"}
                          onValueChange={(val) =>
                            setDesignSides((prev) => ({
                              ...prev,
                              [design.id]: val as "both" | "front" | "back",
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs font-semibold bg-white border-slate-200 min-w-[95px]">
                            <SelectValue placeholder="Mặt in" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both" className="text-xs font-medium">Cả 2 mặt</SelectItem>
                            <SelectItem value="front" className="text-xs font-semibold text-blue-600">Mặt trước</SelectItem>
                            <SelectItem value="back" className="text-xs font-semibold text-purple-600">Mặt sau</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="w-48 min-w-[150px]">
                        <div className="flex items-center gap-1.5 min-w-[140px]">
                          <Input
                            type="number"
                            min="0"
                            max={maxQty}
                            className={cn(
                              "h-8 w-20 text-center font-mono text-sm font-semibold",
                              isExceeded &&
                                "border-destructive focus-visible:ring-destructive",
                              !isSelected && "opacity-50"
                            )}
                            value={currentQty || ""}
                            onChange={(e) =>
                              handleQuantityChange(
                                design.id,
                                e.target.value,
                                design.quantity,
                                design.availableQuantity
                              )
                            }
                            placeholder="0"
                            disabled={!isSelected}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            /{maxQty.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            remainingQty > 0
                              ? "text-blue-600"
                              : remainingQty === 0 && currentQty > 0
                                ? "text-orange-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {remainingQty.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
                        {design.createdAt ? (
                          (() => {
                            const date = new Date(design.createdAt);
                            if (isNaN(date.getTime())) return "—";
                            const day = String(date.getDate()).padStart(2, "0");
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(2, "0");
                            const minutes = String(date.getMinutes()).padStart(2, "0");
                            const seconds = String(date.getSeconds()).padStart(2, "0");
                            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                          })()
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isExceeded ? (
                          <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                        ) : isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
 
        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t shrink-0 gap-2">
          <div className="flex-1 text-xs text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {selectedCount}/{filteredDesigns.length} mã hàng đã chọn • Tổng
                lấy{" "}
                {Array.from(selectedDesignIds)
                  .reduce((sum, id) => sum + (designQuantities[id] || 0), 0)
                  .toLocaleString()}{" "}
                sp
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            size="sm"
            className="h-9"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasValidQuantities}
            size="sm"
            className="h-9 gap-1.5 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Thêm Design
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      {viewingImage && (
        <ImageViewerDialog
          open={!!viewingImage}
          onOpenChange={(open) => {
            if (!open) setViewingImage(null);
          }}
          imageUrl={viewingImage.url}
          title={viewingImage.title}
        />
      )}
    </Dialog>
  );
}
