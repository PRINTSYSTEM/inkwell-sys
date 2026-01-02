import { useState, useMemo, useEffect } from "react";
import type { DesignItem } from "@/types/proofing";
import type { PaperSizeResponse } from "@/Schema/paper-size.schema";
import type { CreateProofingOrderFromDesignsRequest } from "@/Schema/proofing-order.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Hash,
  Maximize2,
  Settings,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreateProofingOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDesigns: DesignItem[];
  paperSizes?: PaperSizeResponse[];
  onSubmit: (data: CreateProofingOrderFromDesignsRequest) => Promise<void>;
  isSubmitting?: boolean;
  onSuccess: () => void;
}

export function CreateProofingOrderModal({
  open,
  onOpenChange,
  selectedDesigns,
  paperSizes = [],
  onSubmit,
  isSubmitting = false,
  onSuccess,
}: CreateProofingOrderModalProps) {
  const [notes, setNotes] = useState("");
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState<number>(1); // Số lượng tờ bình bài được in ra
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [paperSizeId, setPaperSizeId] = useState<string>("none");
  const [customPaperSize, setCustomPaperSize] = useState("");

  const materialTypeName =
    selectedDesigns.length > 0 ? selectedDesigns[0].materialTypeName : "";

  // Set default quantities when modal opens
  useEffect(() => {
    if (open) {
      const initialQuantities: Record<number, number> = {};
      selectedDesigns.forEach((design) => {
        initialQuantities[design.id] = 0;
      });
      setDesignQuantities(initialQuantities);
      setProofingSheetQuantity(1);
    } else {
      setNotes("");
      setProofingSheetQuantity(1);
      setDesignQuantities({});
      setPaperSizeId("none");
      setCustomPaperSize("");
    }
  }, [open, selectedDesigns]);

  const handleQuantityChange = (
    id: number,
    value: string,
    maxQty: number,
    availableQty?: number
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      // Use availableQty if exists and valid (>= 0), otherwise use maxQty (which is quantity)
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
      // Validate totalQuantity: must be integer >= 1 and <= 2147483647 (schema requirement)
      if (
        !proofingSheetQuantity ||
        proofingSheetQuantity < 1 ||
        !Number.isInteger(proofingSheetQuantity) ||
        proofingSheetQuantity > 2147483647
      ) {
        toast.error("Lỗi", {
          description:
            "Số lượng tờ bình bài phải là số nguyên từ 1 đến 2,147,483,647",
        });
        return;
      }

      // Validate design quantities
      const invalidDesigns = selectedDesigns.filter((design) => {
        const qty = designQuantities[design.id] || 0;
        if (qty <= 0) return false; // Skip validation for zero quantities

        // Use availableQuantity if exists and valid (>= 0), otherwise use quantity
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

      // Build orderDetailItems - filter out zero quantities and validate
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

      // Prepare request payload according to schema
      const payload: CreateProofingOrderFromDesignsRequest = {
        orderDetailItems,
        totalQuantity: proofingSheetQuantity,
        notes: notes?.trim() || undefined,
        paperSizeId:
          paperSizeId === "none" || paperSizeId === "custom"
            ? undefined
            : Number(paperSizeId),
        customPaperSize:
          paperSizeId === "custom" && customPaperSize?.trim()
            ? customPaperSize.trim()
            : undefined,
      };

      // Submit to API
      await onSubmit(payload);

      // Only call onSuccess and close modal if submit succeeds
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by the onSubmit function (via hook)
      // Just log for debugging
      console.error("Failed to create proofing order:", error);
      // Don't close modal on error - let user fix and retry
    }
  };

  const totalSelectedQuantity = useMemo(() => {
    return Object.values(designQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [designQuantities]);

  const hasValidQuantities = useMemo(() => {
    return selectedDesigns.some((design) => {
      const qty = designQuantities[design.id] || 0;
      return qty > 0;
    });
  }, [selectedDesigns, designQuantities]);

  const selectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Compact Header */}
        <DialogHeader className="px-5 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Tạo Mã Bài
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {selectedDesigns.length} thiết kế • {selectedCount} đã nhập số
                  lượng
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {materialTypeName}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - 2 Column Layout */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Left Column - Designs Table */}
          <div className="flex-1 overflow-auto border-r">
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
                {selectedDesigns.map((design, index) => {
                  const currentQty = designQuantities[design.id] || 0;

                  // Determine the base quantity to use: availableQuantity if exists and valid, otherwise quantity
                  const baseAvailableQty =
                    design.availableQuantity !== undefined &&
                    design.availableQuantity >= 0
                      ? design.availableQuantity
                      : design.quantity;

                  // Max quantity that can be taken (same as baseAvailableQty)
                  const maxQty = baseAvailableQty;

                  // Remaining quantity after taking currentQty
                  const remainingQty = Math.max(
                    0,
                    baseAvailableQty - currentQty
                  );

                  // Validation states
                  const isValid = currentQty > 0 && currentQty <= maxQty;
                  const isExceeded = currentQty > maxQty;

                  // Check if availableQuantity was provided (even if 0)
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
                          <div className="font-medium text-sm">
                            {design.name}
                          </div>
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
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
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
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Right Column - Configuration Panel */}
          <div className="w-[420px] flex flex-col border-l bg-muted/20 shrink-0">
            {/* Configuration Section */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <div className="space-y-3">
                    {/* Proofing Sheet Quantity */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="proofingSheetQuantity"
                        className="text-sm font-medium"
                      >
                        Số lượng tờ bình bài{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="proofingSheetQuantity"
                          type="number"
                          min="1"
                          max="2147483647"
                          step="1"
                          className="pl-9 h-10 font-semibold"
                          placeholder="Nhập số lượng tờ bình bài"
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
                      <p className="text-xs text-muted-foreground">
                        Số lượng tờ bình bài được in ra (không phải tổng số
                        lượng thiết kế)
                      </p>
                    </div>

                    {/* Paper Size */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="paperSizeId"
                        className="text-sm font-medium"
                      >
                        Khổ giấy in
                      </Label>
                      <Select
                        value={paperSizeId}
                        onValueChange={setPaperSizeId}
                      >
                        <SelectTrigger id="paperSizeId" className="h-10">
                          <Maximize2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Chọn khổ giấy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chưa xác định</SelectItem>
                          {paperSizes?.map((ps) => (
                            <SelectItem key={ps.id} value={ps.id.toString()}>
                              {ps.name}{" "}
                              {ps.width && ps.height
                                ? `(${ps.width}×${ps.height})`
                                : ""}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            -- Nhập thủ công --
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Paper Size */}
                    {paperSizeId === "custom" ? (
                      <div className="space-y-2">
                        <Label
                          htmlFor="customPaperSize"
                          className="text-sm font-medium"
                        >
                          Khổ giấy tùy chỉnh
                        </Label>
                        <Input
                          id="customPaperSize"
                          className="h-10"
                          placeholder="Ví dụ: 31×43, 65×86..."
                          value={customPaperSize}
                          onChange={(e) => setCustomPaperSize(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Kích thước
                        </Label>
                        <div className="h-10 flex items-center px-3 rounded-md border bg-background text-sm text-muted-foreground">
                          {paperSizeId !== "none" &&
                          paperSizes?.find(
                            (ps) => ps.id.toString() === paperSizeId
                          ) ? (
                            <span>
                              {
                                paperSizes.find(
                                  (ps) => ps.id.toString() === paperSizeId
                                )?.width
                              }{" "}
                              ×{" "}
                              {
                                paperSizes.find(
                                  (ps) => ps.id.toString() === paperSizeId
                                )?.height
                              }
                            </span>
                          ) : (
                            <span className="italic">Chưa chọn</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Ghi chú
                  </h3>
                  <Textarea
                    id="notes"
                    className="min-h-[100px] resize-none"
                    placeholder="Nhập ghi chú cho lệnh bình bài này (tùy chọn)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t shrink-0 gap-2">
          <div className="flex-1 text-xs text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {selectedCount}/{selectedDesigns.length} thiết kế đã nhập số
                lượng
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
              isSubmitting || !hasValidQuantities || proofingSheetQuantity < 1
            }
            size="sm"
            className="h-9 gap-1.5 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tạo Lệnh
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
