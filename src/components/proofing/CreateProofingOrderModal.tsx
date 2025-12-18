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
import { useCreateProofingOrderFromDesigns } from "@/hooks/use-proofing-order";

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

  // Set default quantity khi dialog mở
  useEffect(() => {
    if (open) {
      if (defaultTotalQuantity > 0) {
        setTotalQuantity(defaultTotalQuantity);
      } else {
        setTotalQuantity(1);
      }
    } else {
      // Reset khi dialog đóng
      setNotes("");
      setTotalQuantity(1);
    }
  }, [open, defaultTotalQuantity]);

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

      // Extract order detail IDs from selected designs
      const orderDetailIds = selectedDesigns.map((design) => design.id);

      await mutate({
        orderDetailIds,
        notes: notes || undefined,
        totalQuantity,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo Proofing Order</DialogTitle>
          <DialogDescription>
            Xác nhận tạo proofing order với {selectedDesigns.length} designs đã
            chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Designs Summary */}
          <div className="space-y-2">
            <Label>Designs đã chọn</Label>
            <div className="max-h-32 overflow-y-auto space-y-1 rounded-md border p-2">
              {selectedDesigns.map((design) => (
                <div
                  key={design.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{design.name}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {design.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Material Type (auto-filled) */}
          <div className="space-y-2">
            <Label>Vật liệu</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <Badge variant="secondary">{materialTypeName}</Badge>
              <span className="text-xs text-muted-foreground">
                (Tự động từ selection)
              </span>
            </div>
          </div>

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
            {defaultTotalQuantity > 0 && (
              <p className="text-xs text-muted-foreground">
                Tổng số lượng mặc định từ các designs:{" "}
                {defaultTotalQuantity.toLocaleString()}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú (tùy chọn)..."
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
