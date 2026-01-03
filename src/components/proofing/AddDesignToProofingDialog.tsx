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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Layers,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Hash,
  Maximize2,
  MessageSquare,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePaperSizes, useCreatePaperSize } from "@/hooks/use-proofing-order";

interface AddDesignToProofingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDesigns: DesignItem[];
  materialTypeName?: string;
  onSubmit: (
    orderDetailItems: Array<{ orderDetailId: number; quantity: number }>,
    proofingSheetQuantity: number,
    paperSizeId: string,
    customPaperSize: string,
    notes: string
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddDesignToProofingDialog({
  open,
  onOpenChange,
  availableDesigns,
  materialTypeName = "",
  onSubmit,
  isSubmitting = false,
}: AddDesignToProofingDialogProps) {
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState<number>(1);
  const [paperSizeId, setPaperSizeId] = useState<string>("none");
  const [customPaperSize, setCustomPaperSize] = useState("");
  const [notes, setNotes] = useState("");

  const { data: paperSizes } = usePaperSizes();
  const { mutate: createPaperSize, loading: isCreatingPaperSize } =
    useCreatePaperSize();

  // Set default quantities when modal opens
  useEffect(() => {
    if (open) {
      const initialQuantities: Record<number, number> = {};
      availableDesigns.forEach((design) => {
        initialQuantities[design.id] = 0;
      });
      setDesignQuantities(initialQuantities);
      setProofingSheetQuantity(1);
      setPaperSizeId("none");
      setCustomPaperSize("");
      setNotes("");
    } else {
      setDesignQuantities({});
    }
  }, [open, availableDesigns]);

  // Parse custom paper size input
  const parsedCustomPaperSize = useMemo(() => {
    if (!customPaperSize || paperSizeId !== "custom") return null;
    const trimmed = customPaperSize.trim();
    const match = trimmed.match(/^(\d+)\s*[×xX]\s*(\d+)$/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
    return null;
  }, [customPaperSize, paperSizeId]);

  const existingPaperSize = useMemo(() => {
    if (!parsedCustomPaperSize || !paperSizes) return null;
    return paperSizes.find(
      (ps) =>
        ps.width === parsedCustomPaperSize.width &&
        ps.height === parsedCustomPaperSize.height
    );
  }, [parsedCustomPaperSize, paperSizes]);

  const showCreateButton =
    paperSizeId === "custom" &&
    parsedCustomPaperSize !== null &&
    existingPaperSize === null;

  const handleCreatePaperSize = async () => {
    if (!parsedCustomPaperSize) return;
    try {
      const newPaperSize = await createPaperSize({
        name: `${parsedCustomPaperSize.width}×${parsedCustomPaperSize.height}`,
        width: parsedCustomPaperSize.width,
        height: parsedCustomPaperSize.height,
        isCustom: true,
      });
      if (newPaperSize?.id) {
        setPaperSizeId(newPaperSize.id.toString());
        setCustomPaperSize("");
      }
    } catch (error) {
      console.error("Failed to create paper size:", error);
    }
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
      const invalidDesigns = availableDesigns.filter((design) => {
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
          description: `Số lượng lấy vượt quá số lượng còn lại chưa bình bài cho ${invalidDesigns.length} thiết kế. Vui lòng kiểm tra lại.`,
        });
        return;
      }

      // Build orderDetailItems - filter out zero quantities
      const orderDetailItems = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const quantity = Number.isInteger(qty) ? qty : Math.floor(qty);
          if (quantity <= 0) {
            throw new Error("Số lượng phải lớn hơn 0");
          }
          return {
            orderDetailId: parseInt(id, 10),
            quantity: quantity,
          };
        });

      if (orderDetailItems.length === 0) {
        toast.error("Lỗi", {
          description:
            "Vui lòng nhập số lượng lấy cho ít nhất một thiết kế (lớn hơn 0)",
        });
        return;
      }

      // Validate proofing sheet quantity
      if (
        !proofingSheetQuantity ||
        proofingSheetQuantity < 1 ||
        !Number.isInteger(proofingSheetQuantity) ||
        proofingSheetQuantity > 2147483647
      ) {
        toast.error("Lỗi", {
          description:
            "Số lượng giấy in phải là số nguyên từ 1 đến 2,147,483,647",
        });
        return;
      }

      await onSubmit(
        orderDetailItems,
        proofingSheetQuantity,
        paperSizeId,
        customPaperSize,
        notes
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add designs:", error);
    }
  };

  const selectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  const hasValidQuantities = useMemo(() => {
    return availableDesigns.some((design) => {
      const qty = designQuantities[design.id] || 0;
      return qty > 0;
    });
  }, [availableDesigns, designQuantities]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Compact Header */}
        <DialogHeader className="px-5 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Thêm Design vào Bình Bài
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {availableDesigns.length} thiết kế có sẵn • {selectedCount} đã nhập số lượng
                </DialogDescription>
              </div>
            </div>
            {materialTypeName && (
              <Badge variant="secondary" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {materialTypeName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Config Section */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border">
            {/* Proofing Sheet Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="proofingSheetQuantity" className="text-sm font-bold">
                Số lượng giấy in
                <span className="text-destructive"> *</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="proofingSheetQuantity"
                  type="number"
                  min="1"
                  max="2147483647"
                  step="1"
                  className="pl-8 h-8 text-sm font-semibold"
                  placeholder="Nhập số lượng"
                  value={proofingSheetQuantity || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setProofingSheetQuantity(0);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (
                        !isNaN(numValue) &&
                        numValue > 0 &&
                        numValue <= 2147483647
                      ) {
                        setProofingSheetQuantity(numValue);
                      } else if (numValue > 2147483647) {
                        setProofingSheetQuantity(2147483647);
                      }
                    }
                  }}
                  required
                />
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-1.5">
              <Label htmlFor="paperSizeId" className="text-sm font-bold">
                Khổ giấy in
              </Label>
              <Select value={paperSizeId} onValueChange={setPaperSizeId}>
                <SelectTrigger id="paperSizeId" className="h-8 text-sm">
                  <Maximize2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Chọn khổ giấy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa xác định</SelectItem>
                  {paperSizes?.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id.toString()}>
                      {ps.name}
                      {ps.width && ps.height
                        ? ` (${ps.width}×${ps.height})`
                        : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">-- Nhập thủ công --</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Paper Size or Size Display */}
            {paperSizeId === "custom" ? (
              <div className="space-y-1.5">
                <Label htmlFor="customPaperSize" className="text-sm font-bold">
                  Khổ giấy tùy chỉnh
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="customPaperSize"
                    className="h-8 text-sm flex-1"
                    placeholder="31×43, 65×86..."
                    value={customPaperSize}
                    onChange={(e) => setCustomPaperSize(e.target.value)}
                    disabled={isCreatingPaperSize}
                  />
                  {showCreateButton && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 shrink-0"
                      onClick={handleCreatePaperSize}
                      disabled={isCreatingPaperSize}
                    >
                      {isCreatingPaperSize ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1.5 text-xs">Tạo mới</span>
                    </Button>
                  )}
                </div>
                {existingPaperSize && (
                  <p className="text-xs font-medium text-muted-foreground">
                    Đã tồn tại:{" "}
                    {existingPaperSize.name ||
                      `${existingPaperSize.width}×${existingPaperSize.height}`}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-muted-foreground">
                  Kích thước
                </Label>
                <div className="h-8 flex items-center px-2 rounded-md border bg-background text-sm font-semibold text-muted-foreground">
                  {paperSizeId !== "none" &&
                  paperSizes?.find((ps) => ps.id.toString() === paperSizeId) ? (
                    <span>
                      {
                        paperSizes.find((ps) => ps.id.toString() === paperSizeId)
                          ?.width
                      }{" "}
                      ×{" "}
                      {
                        paperSizes.find((ps) => ps.id.toString() === paperSizeId)
                          ?.height
                      }
                    </span>
                  ) : (
                    <span className="italic">Chưa chọn</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-bold flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              Ghi chú
            </Label>
            <Textarea
              id="notes"
              className="min-h-[60px] text-sm resize-none"
              placeholder="Nhập ghi chú cho lệnh bình bài này (tùy chọn)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="min-w-[200px]">Thiết kế</TableHead>
                <TableHead className="w-24 text-right">Đặt hàng</TableHead>
                <TableHead className="w-24 text-right">Còn lại</TableHead>
                <TableHead className="w-48">Số lượng lấy</TableHead>
                <TableHead className="w-28 text-right">Sau khi lấy</TableHead>
                <TableHead className="w-16 text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableDesigns.map((design, index) => {
                const currentQty = designQuantities[design.id] || 0;

                const baseAvailableQty =
                  design.availableQuantity !== undefined &&
                  design.availableQuantity >= 0
                    ? design.availableQuantity
                    : design.quantity;

                const maxQty = baseAvailableQty;
                const remainingQty = Math.max(0, baseAvailableQty - currentQty);
                const isValid = currentQty > 0 && currentQty <= maxQty;
                const isExceeded = currentQty > maxQty;
                const hasAvailableQuantity =
                  design.availableQuantity !== undefined;

                return (
                  <TableRow
                    key={design.id}
                    className={cn(
                      "hover:bg-muted/30",
                      isValid && "bg-green-50/30",
                      isExceeded && "bg-red-50/30"
                    )}
                  >
                    <TableCell className="text-center text-xs text-muted-foreground font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{design.name}</div>
                        <code className="text-xs text-muted-foreground font-mono">
                          {design.code}
                        </code>
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
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={maxQty}
                          className={cn(
                            "h-9 flex-1 text-right font-mono text-base font-semibold",
                            isExceeded &&
                              "border-destructive focus-visible:ring-destructive"
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
                    <TableCell className="text-center">
                      {isExceeded ? (
                        <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                      ) : isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t shrink-0 gap-2">
          <div className="flex-1 text-xs text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {selectedCount}/{availableDesigns.length} thiết kế đã nhập số lượng
                {proofingSheetQuantity >= 1 && (
                  <> • Tổng lấy {Object.values(designQuantities).reduce((sum, qty) => sum + qty, 0).toLocaleString()} sp</>
                )}
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
            disabled={
              isSubmitting ||
              !hasValidQuantities ||
              proofingSheetQuantity < 1
            }
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
    </Dialog>
  );
}

