import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingCart,
} from "lucide-react";
import { useUpdateProductionStep } from "@/hooks/use-production";
import type {
  ProductionStepResponse,
  ProductionOrderResponse,
  ProofingOrderResponse,
  CreateStockOutRequest,
} from "@/Schema";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

interface MaterialExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: ProductionStepResponse;
  productionOrder: ProductionOrderResponse;
  proofingOrder?: ProofingOrderResponse | null;
}

interface MaterialItem {
  itemName: string;
  itemCode?: string;
  unit?: string;
  quantity: number;
  notes?: string;
}

export function MaterialExportDialog({
  open,
  onOpenChange,
  step,
  productionOrder,
  proofingOrder,
}: MaterialExportDialogProps) {
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    {
      itemName: proofingOrder?.materialType?.name || "Nguyên liệu",
      itemCode: "",
      unit: "tấm", // Default unit for materials
      quantity: proofingOrder?.totalQuantity || step.inputQty || 0,
      notes: "",
    },
  ]);
  const [notes, setNotes] = useState("");
  const [stockOutDate, setStockOutDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm", { locale: vi })
  );

  const { mutate: updateStep, isPending: updatingStep } =
    useUpdateProductionStep();
  const [isCreatingStockOut, setIsCreatingStockOut] = useState(false);

  const isProcessing = updatingStep || isCreatingStockOut;

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };

  const handleAddMaterialItem = () => {
    setMaterialItems([
      ...materialItems,
      {
        itemName: "",
        itemCode: "",
        unit: "tấm",
        quantity: 0,
        notes: "",
      },
    ]);
  };

  const handleRemoveMaterialItem = (index: number) => {
    if (materialItems.length <= 1) {
      toast.error("Phải có ít nhất 1 nguyên liệu");
      return;
    }
    setMaterialItems(materialItems.filter((_, i) => i !== index));
  };

  const handleMaterialItemChange = (
    index: number,
    field: keyof MaterialItem,
    value: string | number | undefined
  ) => {
    const updated = [...materialItems];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialItems(updated);
  };

  const handleSubmit = async () => {
    // Validate materials
    const validItems = materialItems.filter(
      (item) => item.itemName.trim() && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error("Vui lòng nhập ít nhất một nguyên liệu với số lượng hợp lệ");
      return;
    }

    setIsCreatingStockOut(true);

    try {
      // Step 1: Create stock-out request
      const stockOutRequest: CreateStockOutRequest = {
        type: "material_export",
        productionId: productionOrder.id,
        orderId: productionOrder.proofingOrderId || undefined,
        stockOutDate: stockOutDate
          ? new Date(stockOutDate).toISOString()
          : undefined,
        notes: notes.trim() || "",
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          itemCode: (item.itemCode || "").trim(),
          unit: (item.unit || "").trim(),
          quantity: item.quantity,
          notes: (item.notes || "").trim(),
        })),
      };

      // Create stock-out and get response with ID
      const stockOutResponse = await apiRequest.post<{ id: number }>(
        API_SUFFIX.STOCK_OUTS,
        stockOutRequest
      );

      const stockOutId = stockOutResponse.data?.id;
      if (!stockOutId) {
        throw new Error("Không nhận được ID phiếu xuất kho từ server");
      }

      // Complete stock-out immediately (material is exported from warehouse)
      await apiRequest.post(API_SUFFIX.STOCK_OUT_COMPLETE(stockOutId));

      // Step 2: Update production step to IN_PROGRESS
      await updateStep({
        stepId: step.id!,
        data: {
          status: "in_progress",
          inputQty: step.inputQty || undefined,
        },
      });

      toast.success("Đã xuất nguyên liệu và bắt đầu bước sản xuất", {
        description: `Phiếu xuất kho #${stockOutId} đã được tạo và hoàn thành thành công`,
      });

      handleClose();
    } catch (error: any) {
      toast.error("Không thể xuất nguyên liệu", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Đã xảy ra lỗi khi tạo phiếu xuất kho",
      });
      console.error("Material export error:", error);
    } finally {
      setIsCreatingStockOut(false);
    }
  };

  const totalQuantity = useMemo(() => {
    return materialItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [materialItems]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShoppingCart className="h-5 w-5" />
            </div>
            Xuất nguyên liệu - {step.stepTypeName || step.stepType}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tạo phiếu xuất kho để lấy nguyên liệu cần thiết cho bước sản xuất
            này
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          {/* Production Info */}
          <div className="shrink-0 grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
            <div>
              <Label className="text-xs text-muted-foreground">Lệnh sản xuất</Label>
              <p className="text-sm font-semibold">
                {productionOrder.proofingOrderCode || `#${productionOrder.id}`}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Số lượng đầu vào</Label>
              <p className="text-sm font-semibold">{step.inputQty || 0}</p>
            </div>
          </div>

          {/* Material Items */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <Label className="text-sm font-semibold">Danh sách nguyên liệu</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMaterialItem}
                disabled={isProcessing}
                className="gap-2"
              >
                <Package className="h-3.5 w-3.5" />
                Thêm nguyên liệu
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-3">
                {materialItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="col-span-12 sm:col-span-4 space-y-2">
                      <Label className="text-xs">
                        Tên nguyên liệu <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) =>
                          handleMaterialItemChange(
                            index,
                            "itemName",
                            e.target.value
                          )
                        }
                        placeholder="Nhập tên nguyên liệu"
                        disabled={isProcessing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2 space-y-2">
                      <Label className="text-xs">Mã hàng</Label>
                      <Input
                        value={item.itemCode || ""}
                        onChange={(e) =>
                          handleMaterialItemChange(
                            index,
                            "itemCode",
                            e.target.value
                          )
                        }
                        placeholder="Mã hàng"
                        disabled={isProcessing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2 space-y-2">
                      <Label className="text-xs">Đơn vị</Label>
                      <Input
                        value={item.unit || ""}
                        onChange={(e) =>
                          handleMaterialItemChange(
                            index,
                            "unit",
                            e.target.value
                          )
                        }
                        placeholder="tấm"
                        disabled={isProcessing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-8 sm:col-span-2 space-y-2">
                      <Label className="text-xs">
                        Số lượng <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleMaterialItemChange(
                            index,
                            "quantity",
                            Number(e.target.value) || 0
                          )
                        }
                        disabled={isProcessing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1 flex items-end">
                      {materialItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMaterialItem(index)}
                          disabled={isProcessing}
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="col-span-12 sm:col-span-1 flex items-end">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-medium">{item.quantity || 0}</span>
                        <span>{item.unit || ""}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Total Summary */}
            <div className="shrink-0 mt-3 flex items-center justify-between p-3 rounded-lg border bg-primary/5">
              <span className="text-sm font-semibold">Tổng số lượng:</span>
              <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                {totalQuantity.toLocaleString("vi-VN")}
              </Badge>
            </div>
          </div>

          {/* Stock Out Date */}
          <div className="shrink-0 space-y-2">
            <Label htmlFor="stock-out-date" className="text-sm font-medium">
              Ngày xuất kho
            </Label>
            <Input
              id="stock-out-date"
              type="datetime-local"
              value={stockOutDate}
              onChange={(e) => setStockOutDate(e.target.value)}
              disabled={isProcessing}
              className="h-10"
            />
          </div>

          {/* Notes */}
          <div className="shrink-0 space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Ghi chú (tùy chọn)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về việc xuất kho..."
              disabled={isProcessing}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-4 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || totalQuantity === 0}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Xác nhận xuất kho
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
