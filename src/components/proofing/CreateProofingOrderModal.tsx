import { useState, useMemo, useEffect } from "react";
import { DesignItem } from "@/types/proofing";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProofingOrderFromDesigns, usePaperSizes } from "@/hooks/use-proofing-order";

interface CreateProofingOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDesigns: DesignItem[];
  onSuccess: () => void;
}

export function CreateProofingOrderModal({
  open,
  onOpenChange,
  selectedDesigns,
  onSuccess,
}: CreateProofingOrderModalProps) {
  const [notes, setNotes] = useState("");
  const [totalQuantity, setTotalQuantity] = useState<number>(1);
  const [designQuantities, setDesignQuantities] = useState<Record<number, number>>({});
  const [paperSizeId, setPaperSizeId] = useState<string>("none");
  const [customPaperSize, setCustomPaperSize] = useState("");

  const { data: paperSizes } = usePaperSizes();
  const { mutate, loading } = useCreateProofingOrderFromDesigns();

  const materialTypeName =
    selectedDesigns.length > 0 ? selectedDesigns[0].materialTypeName : "";

  // Tính tổng quantity mặc định từ selected designs
  const defaultTotalQuantity = useMemo(() => {
    return selectedDesigns.reduce(
      (sum, design) => sum + (design.quantity || 0),
      0
    );
  }, [selectedDesigns]);

  // Set default quantities khi dialog mở
  useEffect(() => {
    if (open) {
      if (defaultTotalQuantity > 0) {
        setTotalQuantity(defaultTotalQuantity);
      } else {
        setTotalQuantity(1);
      }

      // Initialize individual design quantities
      const initialQuantities: Record<number, number> = {};
      selectedDesigns.forEach(design => {
        initialQuantities[design.id] = design.quantity || 0;
      });
      setDesignQuantities(initialQuantities);
    } else {
      // Reset khi dialog đóng
      setNotes("");
      setTotalQuantity(1);
      setDesignQuantities({});
      setPaperSizeId("none");
      setCustomPaperSize("");
    }
  }, [open, defaultTotalQuantity, selectedDesigns]);

  // Update total quantity when individual quantities change
  useEffect(() => {
    const sum = Object.values(designQuantities).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      setTotalQuantity(sum);
    }
  }, [designQuantities]);

  const handleQuantityChange = (id: number, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setDesignQuantities(prev => ({
        ...prev,
        [id]: numValue
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate quantity
      if (
        !totalQuantity ||
        totalQuantity < 1 ||
        !Number.isInteger(totalQuantity)
      ) {
        return;
      }

      // Convert designQuantities to orderDetailItems format
      const orderDetailItems = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({
          orderDetailId: parseInt(id, 10),
          quantity: qty,
        }));

      if (orderDetailItems.length === 0) {
        alert("Vui lòng chọn ít nhất một thiết kế với số lượng lớn hơn 0");
        return;
      }

      await mutate({
        orderDetailItems,
        notes: notes || undefined,
        totalQuantity,
        paperSizeId: paperSizeId === "none" || paperSizeId === "custom" ? undefined : Number(paperSizeId),
        customPaperSize: paperSizeId === "custom" ? customPaperSize : undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Failed to create proofing order:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Proofing Order</DialogTitle>
          <DialogDescription>
            Xác nhận tạo proofing order với {selectedDesigns.length} designs đã
            chọn. Bạn có thể điều chỉnh số lượng cho từng thiết kế.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Designs with Quantity Inputs */}
          <div className="space-y-3">
            <Label>Chi tiết thiết kế và số lượng</Label>
            <div className="space-y-2 rounded-md border p-3 bg-muted/20">
              {selectedDesigns.map((design) => (
                <div
                  key={design.id}
                  className="grid grid-cols-12 gap-2 items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="col-span-8 space-y-0.5">
                    <p className="font-medium truncate">{design.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {design.code} • Tối đa: {design.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      size={1}
                      min="0"
                      max={design.quantity}
                      className="h-8 text-right font-mono"
                      value={designQuantities[design.id] || 0}
                      onChange={(e) => handleQuantityChange(design.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Quantity */}
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">
                Tổng số lượng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                step="1"
                className="font-bold text-lg h-11"
                placeholder="Nhập tổng số lượng"
                value={totalQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setTotalQuantity(0);
                  } else {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue > 0) {
                      setTotalQuantity(numValue);
                    }
                  }
                }}
                required
              />
            </div>

            {/* Material Type (auto-filled) */}
            <div className="space-y-2">
              <Label>Vật liệu</Label>
              <div className="flex h-11 items-center justify-center rounded-md border bg-muted/50 px-3">
                <Badge variant="secondary" className="text-xs">{materialTypeName}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            {/* Paper Size Selection */}
            <div className="space-y-2">
              <Label htmlFor="paperSizeId">Khổ giấy in</Label>
              <Select value={paperSizeId} onValueChange={setPaperSizeId}>
                <SelectTrigger id="paperSizeId">
                  <SelectValue placeholder="Chọn khổ giấy" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">Chưa xác định</SelectItem>
                  {paperSizes?.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id.toString()}>
                      {ps.name} {ps.width && ps.height ? `(${ps.width}x${ps.height})` : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">-- Nhập thủ công --</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Paper Size Input */}
            {paperSizeId === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customPaperSize">Khổ giấy tùy chỉnh</Label>
                <Input
                  id="customPaperSize"
                  placeholder="Ví dụ: 31x43, 65x86..."
                  value={customPaperSize}
                  onChange={(e) => setCustomPaperSize(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú cho lệnh bình bài này..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !totalQuantity || totalQuantity < 1}
          >
            {loading ? "Đang tạo..." : "Tạo Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
