import { useState, useMemo, useEffect } from "react";
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
  CheckCircle2,
  Package,
  Plus,
  X,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { useUpdateProductionStep } from "@/hooks/use-production";
import {
  useCreateStockIn,
  useStockOutsByProductionOrder,
  useCompleteStockOut,
} from "@/hooks/use-stock";
import type {
  ProductionStepResponse,
  ProductionOrderResponse,
  ProofingOrderResponse,
  CreateStockInRequest,
  StockInItemRequest,
} from "@/Schema";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: ProductionStepResponse;
  productionOrder: ProductionOrderResponse;
  proofingOrder?: ProofingOrderResponse | null;
}

interface StockInItem {
  itemName: string;
  itemCode?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export function CompletionDialog({
  open,
  onOpenChange,
  step,
  productionOrder,
  proofingOrder,
}: CompletionDialogProps) {
  const [stockInItems, setStockInItems] = useState<StockInItem[]>([
    {
      itemName: proofingOrder?.materialType?.name
        ? `Sản phẩm ${proofingOrder.materialType.name}`
        : "Sản phẩm hoàn thành",
      itemCode: proofingOrder?.code || "",
      unit: "sản phẩm",
      quantity: step.outputQty || proofingOrder?.totalQuantity || 0,
      unitPrice: undefined,
      notes: "",
    },
  ]);
  const [outputQty, setOutputQty] = useState<number>(
    step.outputQty || step.inputQty || proofingOrder?.totalQuantity || 0
  );
  const [defectQty, setDefectQty] = useState<number>(step.defectQty || 0);
  const [defectNotes, setDefectNotes] = useState(step.defectNotes || "");
  const [notes, setNotes] = useState("");
  const [stockInDate, setStockInDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm", { locale: vi })
  );
  const [isCreatingStockIn, setIsCreatingStockIn] = useState(false);

  const { mutate: updateStep, isPending: updatingStep } =
    useUpdateProductionStep();
  const { mutate: completeStockOut } = useCompleteStockOut();

  // Fetch stock outs for this production order to find material export stock out
  const { data: stockOutsData } = useStockOutsByProductionOrder(
    productionOrder?.id || null,
    open && !!productionOrder?.id
  );
  const stockOuts = stockOutsData || [];

  const isProcessing = updatingStep || isCreatingStockIn;

  useEffect(() => {
    if (open && step.outputQty) {
      setOutputQty(step.outputQty);
      // Update first item quantity to match outputQty
      setStockInItems((prev) =>
        prev.map((item, index) =>
          index === 0 ? { ...item, quantity: step.outputQty || item.quantity } : item
        )
      );
    }
  }, [open, step.outputQty]);

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };

  const handleAddItem = () => {
    setStockInItems([
      ...stockInItems,
      {
        itemName: "",
        itemCode: "",
        unit: "sản phẩm",
        quantity: 0,
        unitPrice: undefined,
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (stockInItems.length <= 1) {
      toast.error("Phải có ít nhất 1 sản phẩm");
      return;
    }
    setStockInItems(stockInItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof StockInItem,
    value: string | number | undefined
  ) => {
    const updated = [...stockInItems];
    updated[index] = { ...updated[index], [field]: value };
    setStockInItems(updated);

    // Update total outputQty when first item quantity changes
    if (index === 0 && field === "quantity") {
      setOutputQty(Number(value) || 0);
    }
  };

  const handleSubmit = async () => {
    // Validate output quantity
    if (outputQty <= 0) {
      toast.error("Số lượng sản xuất phải lớn hơn 0");
      return;
    }

    if (defectQty < 0) {
      toast.error("Số lượng lỗi không thể âm");
      return;
    }

    // Validate stock-in items
    const validItems = stockInItems.filter(
      (item) => item.itemName.trim() && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error("Vui lòng nhập ít nhất một sản phẩm với số lượng hợp lệ");
      return;
    }

    // Validate defect notes if defect quantity > 0
    if (defectQty > 0 && !defectNotes.trim()) {
      toast.error("Vui lòng nhập ghi chú lỗi khi có số lượng lỗi");
      return;
    }

    setIsCreatingStockIn(true);

    try {
      // Step 1: Create stock-in request (nhập sản phẩm vào kho)
      const stockInRequest: CreateStockInRequest = {
        source: "production",
        itemType: "production_completion",
        productionOrderId: productionOrder.id,
        orderId: productionOrder.proofingOrderId || undefined,
        stockInDate: stockInDate
          ? new Date(stockInDate).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
        items: validItems.map((item) => ({
          itemName: item.itemName.trim(),
          itemCode: (item.itemCode || "").trim() || undefined,
          unit: (item.unit || "").trim() || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice || undefined,
          notes: (item.notes || "").trim() || undefined,
        })),
      };

      // Create stock-in and get response with ID
      const stockInResponse = await apiRequest.post<{ id: number }>(
        API_SUFFIX.STOCK_INS,
        stockInRequest
      );

      const stockInId = stockInResponse.data?.id;
      if (!stockInId) {
        throw new Error("Không nhận được ID phiếu nhập kho từ server");
      }

      // Complete stock-in immediately (products are received into warehouse)
      await apiRequest.post(API_SUFFIX.STOCK_IN_COMPLETE(stockInId));

      // If this is a material_export step, find and complete the related stock-out
      if (step.stepType === "material_export" && productionOrder?.id) {
        // Find the stock-out for this production order that hasn't been completed yet
        const pendingStockOut = stockOuts.find(
          (so: any) =>
            so.productionOrderId === productionOrder.id &&
            so.status !== "completed" &&
            so.status !== "cancelled"
        );

        if (pendingStockOut?.id) {
          // Complete the stock-out
          completeStockOut(pendingStockOut.id, {
            onSuccess: () => {
              toast.success("Đã hoàn thành phiếu xuất kho");
            },
            onError: (error: any) => {
              toast.error("Không thể hoàn thành phiếu xuất kho", {
                description:
                  error?.response?.data?.message ||
                  error?.message ||
                  "Đã xảy ra lỗi",
              });
            },
          });
        }
      }

      // Step 2: Update production step to DONE
      const combinedNotes = [notes.trim(), defectNotes.trim()]
        .filter(Boolean)
        .join("\n\n");

      await updateStep({
        stepId: step.id!,
        data: {
          status: "done",
          outputQty: outputQty,
          defectQty: defectQty > 0 ? defectQty : undefined,
          defectNotes: combinedNotes || undefined,
        },
      });

      toast.success("Đã nhập sản phẩm vào kho và hoàn thành bước sản xuất", {
        description: `Phiếu nhập kho #${stockInId} đã được tạo. Số lượng: ${outputQty}, Lỗi: ${defectQty || 0}`,
      });

      handleClose();
    } catch (error: any) {
      toast.error("Không thể hoàn thành bước sản xuất", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Đã xảy ra lỗi khi tạo phiếu nhập kho hoặc cập nhật bước sản xuất",
      });
      console.error("Completion error:", error);
    } finally {
      setIsCreatingStockIn(false);
    }
  };

  const totalQuantity = useMemo(() => {
    return stockInItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [stockInItems]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative border-2 border-red-500/50">
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 z-[9999] font-mono pointer-events-none rounded-bl">
          CompletionDialog.tsx
        </div>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            Hoàn thành & Nhập kho - {step.stepTypeName || step.stepType}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Nhập thông tin sản phẩm đã sản xuất và tạo phiếu nhập kho
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          {/* Production Info */}
          <div className="shrink-0 grid grid-cols-3 gap-4 p-4 rounded-lg border bg-muted/30">
            <div>
              <Label className="text-xs text-muted-foreground">
                Lệnh sản xuất
              </Label>
              <p className="text-sm font-semibold">
                {productionOrder.proofingOrderCode || `#${productionOrder.id}`}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Số lượng đầu vào
              </Label>
              <p className="text-sm font-semibold">{step.inputQty || 0}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Số lượng đầu ra (ước tính)
              </Label>
              <p className="text-sm font-semibold text-primary">
                {step.outputQty || step.inputQty || 0}
              </p>
            </div>
          </div>

          {/* Production Results */}
          <div className="shrink-0 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="output-qty" className="text-sm font-medium">
                Số lượng sản xuất <span className="text-destructive">*</span>
              </Label>
              <Input
                id="output-qty"
                type="number"
                min={1}
                value={outputQty || ""}
                onChange={(e) => {
                  const newQty = Number(e.target.value) || 0;
                  setOutputQty(newQty);
                  // Update first item quantity
                  setStockInItems((prev) =>
                    prev.map((item, index) =>
                      index === 0 ? { ...item, quantity: newQty } : item
                    )
                  );
                }}
                disabled={isProcessing}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defect-qty" className="text-sm font-medium">
                Số lượng lỗi
              </Label>
              <Input
                id="defect-qty"
                type="number"
                min={0}
                value={defectQty || ""}
                onChange={(e) => setDefectQty(Number(e.target.value) || 0)}
                disabled={isProcessing}
                className="h-10"
              />
            </div>
          </div>

          {/* Stock-In Items */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <Label className="text-sm font-semibold">
                Danh sách sản phẩm nhập kho
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={isProcessing}
                className="gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm sản phẩm
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-3">
                {stockInItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="col-span-12 sm:col-span-4 space-y-2">
                      <Label className="text-xs">
                        Tên sản phẩm <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemChange(index, "itemName", e.target.value)
                        }
                        placeholder="Nhập tên sản phẩm"
                        disabled={isProcessing || index === 0}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2 space-y-2">
                      <Label className="text-xs">Mã hàng</Label>
                      <Input
                        value={item.itemCode || ""}
                        onChange={(e) =>
                          handleItemChange(
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
                          handleItemChange(
                            index,
                            "unit",
                            e.target.value
                          )
                        }
                        placeholder="sản phẩm"
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
                        onChange={(e) => {
                          const qty = Number(e.target.value) || 0;
                          handleItemChange(index, "quantity", qty);
                          if (index === 0) {
                            setOutputQty(qty);
                          }
                        }}
                        disabled={isProcessing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1 flex items-end">
                      {stockInItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
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
              <span className="text-sm font-semibold">Tổng số lượng nhập kho:</span>
              <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                {totalQuantity.toLocaleString("vi-VN")}
              </Badge>
            </div>
          </div>

          {/* Stock In Date */}
          <div className="shrink-0 space-y-2">
            <Label htmlFor="stock-in-date" className="text-sm font-medium">
              Ngày nhập kho
            </Label>
            <Input
              id="stock-in-date"
              type="datetime-local"
              value={stockInDate}
              onChange={(e) => setStockInDate(e.target.value)}
              disabled={isProcessing}
              className="h-10"
            />
          </div>

          {/* Defect Notes */}
          {defectQty > 0 && (
            <div className="shrink-0 space-y-2">
              <Label htmlFor="defect-notes" className="text-sm font-medium text-orange-600">
                Ghi chú lỗi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="defect-notes"
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                placeholder="Mô tả chi tiết các lỗi sản xuất..."
                disabled={isProcessing}
                className="min-h-[100px] resize-none border-orange-300 focus-visible:ring-orange-500"
              />
              {defectQty > 0 && !defectNotes.trim() && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Vui lòng nhập ghi chú lỗi khi có số lượng lỗi
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="shrink-0 space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Ghi chú (tùy chọn)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về việc nhập kho..."
              disabled={isProcessing}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              outputQty <= 0 ||
              totalQuantity === 0 ||
              (defectQty > 0 && !defectNotes.trim())
            }
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
                Nhập kho & Hoàn thành
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

