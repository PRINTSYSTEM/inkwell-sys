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
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingCart,
} from "lucide-react";
import { useUpdateProductionStep } from "@/hooks/use-production";
import {
  useCreateStockOutForProduction,
  useStockOutsByProductionOrder,
  useStockOut,
} from "@/hooks/use-stock";
import { useCurrentStock } from "@/hooks/use-inventory-report";
import type {
  ProductionStepResponse,
  ProductionOrderResponse,
  ProofingOrderResponse,
  CreateStockOutForProductionRequest,
} from "@/Schema";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
  materialTypeId?: number;
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
      materialTypeId: proofingOrder?.materialType?.id || undefined,
    },
  ]);
  const [notes, setNotes] = useState("");
  const [stockOutDate, setStockOutDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm", { locale: vi })
  );

  const { mutate: updateStep, isPending: updatingStep } =
    useUpdateProductionStep();
  const { mutate: createStockOutForProduction, isPending: isCreatingStockOut } =
    useCreateStockOutForProduction();

  // Get unique materialTypeIds from materialItems to check stock availability
  const materialTypeIds = useMemo(() => {
    const ids = materialItems
      .map((item) => item.materialTypeId)
      .filter((id): id is number => id !== undefined && id !== null);
    return [...new Set(ids)]; // Remove duplicates
  }, [materialItems]);

  // Fetch current stock to check availability (fetch all when dialog opens)
  const { data: currentStockData } = useCurrentStock(
    open && materialTypeIds.length > 0
      ? {
          pageSize: 1000, // Get all stock items to check availability
        }
      : undefined
  );

  // Fetch existing stock-out for this production order
  const { data: stockOutsData } = useStockOutsByProductionOrder(
    productionOrder?.id || null,
    open && !!productionOrder?.id
  );
  const stockOuts: any[] = Array.isArray(stockOutsData) ? stockOutsData : [];
  const existingStockOut = stockOuts.find(
    (so: any) =>
      so.productionOrderId === productionOrder?.id &&
      so.status !== "completed" &&
      so.status !== "cancelled"
  );

  // Fetch detailed stock-out information if exists
  const { data: stockOutDetail } = useStockOut(
    existingStockOut?.id || null,
    open && !!existingStockOut?.id
  );

  // Load existing stock-out data into form when dialog opens
  useEffect(() => {
    if (open && stockOutDetail) {
      // Load items from existing stock-out
      if (stockOutDetail.items && stockOutDetail.items.length > 0) {
        const mappedItems = stockOutDetail.items.map((item: any) => ({
          itemName: item.itemName || "",
          itemCode: item.itemCode || "",
          unit: item.unit || "tấm",
          quantity: item.quantity || 0,
          notes: item.notes || "",
          materialTypeId: item.materialTypeId || undefined,
        }));
        setMaterialItems(mappedItems);
      }

      // Load notes and date
      if (stockOutDetail.notes) {
        setNotes(stockOutDetail.notes);
      }
      if (stockOutDetail.stockOutDate) {
        const date = new Date(stockOutDetail.stockOutDate);
        setStockOutDate(format(date, "yyyy-MM-dd'T'HH:mm", { locale: vi }));
      }
    } else if (open && !stockOutDetail && !existingStockOut) {
      // Reset to default values if no existing stock-out
      const defaultMaterialTypeId = proofingOrder?.materialType?.id || undefined;
      const defaultItem = {
        itemName: proofingOrder?.materialType?.name || "Nguyên liệu",
        itemCode: "",
        unit: "tấm",
        quantity: proofingOrder?.totalQuantity || step.inputQty || 0,
        notes: "",
        materialTypeId: defaultMaterialTypeId,
      };
      setMaterialItems([defaultItem]);
      setNotes("");
      setStockOutDate(format(new Date(), "yyyy-MM-dd'T'HH:mm", { locale: vi }));
    }
  }, [open, stockOutDetail, existingStockOut, proofingOrder, step]);

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
        materialTypeId: proofingOrder?.materialType?.id || undefined,
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
    // If stock-out already exists, just close dialog (it was already created and step updated)
    if (existingStockOut) {
      toast.success("Phiếu xuất kho đã được tạo tự động", {
        description: `Phiếu xuất kho #${existingStockOut.id} đã tồn tại. Vui lòng hoàn thành bước để tự động hoàn thành phiếu.`,
      });
      handleClose();
      return;
    }

    // Validate materials
    const validItems = materialItems.filter(
      (item) => item.itemName.trim() && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error("Vui lòng nhập ít nhất một nguyên liệu với số lượng hợp lệ");
      return;
    }

    if (!productionOrder.id) {
      toast.error("Không tìm thấy lệnh sản xuất");
      return;
    }

    // Check if there's enough stock for each material
    const stockItems = currentStockData?.items || [];
    const insufficientStockItems: Array<{
      itemName: string;
      requestedQty: number;
      availableQty: number;
      materialTypeId?: number;
    }> = [];

    for (const item of validItems) {
      if (item.materialTypeId) {
        // Find stock for this material type by matching itemCode or materialTypeId
        // CurrentStockResponse has: itemCode, itemName, currentQuantity, materialTypeId (if available)
        const stockItem = stockItems.find(
          (stock: any) =>
            stock.materialTypeId === item.materialTypeId ||
            (item.itemCode && stock.itemCode === item.itemCode) ||
            (item.itemName && stock.itemName === item.itemName)
        );
        const availableQty = stockItem?.currentQuantity || 0;

        if (availableQty < item.quantity) {
          insufficientStockItems.push({
            itemName: item.itemName,
            requestedQty: item.quantity,
            availableQty: availableQty,
            materialTypeId: item.materialTypeId,
          });
        }
      }
    }

    // If there's insufficient stock, show error message
    if (insufficientStockItems.length > 0) {
      const errorMessages = insufficientStockItems.map(
        (item) =>
          `${item.itemName}: Yêu cầu ${item.requestedQty.toLocaleString("vi-VN")} ${validItems.find((i) => i.materialTypeId === item.materialTypeId)?.unit || ""} nhưng chỉ có ${item.availableQty.toLocaleString("vi-VN")} ${validItems.find((i) => i.materialTypeId === item.materialTypeId)?.unit || ""} trong kho`
      );
      toast.error("Không đủ nguyên liệu trong kho", {
        description: errorMessages.join("\n"),
        duration: 10000, // Show for 10 seconds
      });
      return;
    }

    // Create stock-out for production (fallback if auto-create failed)
    const payload = {
      productionOrderId: productionOrder.id,
      itemType: "material_export",
      stockOutDate: stockOutDate
        ? new Date(stockOutDate).toISOString()
        : undefined,
      notes: notes.trim() || undefined,
      items: validItems.map((item) => ({
        itemName: item.itemName.trim(),
        itemCode: (item.itemCode || "").trim() || undefined,
        unit: (item.unit || "").trim() || undefined,
        quantity: item.quantity,
        notes: (item.notes || "").trim() || undefined,
        materialTypeId: item.materialTypeId || undefined,
      })),
    };
    createStockOutForProduction(
      payload,
      {
        onSuccess: (data) => {
          // Step status is already updated to in_progress when dialog opens
          toast.success("Đã tạo phiếu xuất kho thành công", {
            description: `Phiếu xuất kho #${data?.id || ""} đã được tạo thành công. Vui lòng hoàn thành bước để tự động hoàn thành phiếu.`,
          });

          handleClose();
        },
        onError: (error: any) => {
          toast.error("Không thể tạo phiếu xuất kho", {
            description:
              error?.response?.data?.message ||
              error?.message ||
              "Đã xảy ra lỗi khi tạo phiếu xuất kho",
          });
        },
      }
    );
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
            {existingStockOut
              ? `Phiếu xuất kho #${existingStockOut.id} đã được tạo tự động. Kiểm tra thông tin bên dưới và hoàn thành bước để tự động hoàn thành phiếu.`
              : "Tạo phiếu xuất kho để lấy nguyên liệu cần thiết cho bước sản xuất này"}
          </DialogDescription>
          {existingStockOut && (
            <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Phiếu xuất kho #{existingStockOut.id} đã được tạo tự động
                </span>
              </div>
            </div>
          )}
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
              <Label className="text-sm font-semibold">
                Danh sách nguyên liệu
                {existingStockOut && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (Đã tạo tự động)
                  </span>
                )}
              </Label>
              {!existingStockOut && (
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
              )}
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
                        disabled={isProcessing || !!existingStockOut}
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
                        disabled={isProcessing || !!existingStockOut}
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
                        disabled={isProcessing || !!existingStockOut}
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
                        disabled={isProcessing || !!existingStockOut}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1 flex items-end">
                      {materialItems.length > 1 && !existingStockOut && (
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
              disabled={isProcessing || !!existingStockOut}
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
              disabled={isProcessing || !!existingStockOut}
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
            disabled={isProcessing || (!existingStockOut && totalQuantity === 0)}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : existingStockOut ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Đóng
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Tạo phiếu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
