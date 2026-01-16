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
  Check,
} from "lucide-react";
import { useUpdateProductionStep } from "@/hooks/use-production";
import {
  useCreateStockOutForProduction,
  useStockOutsByProductionOrder,
  useStockOut,
} from "@/hooks/use-stock";
import type {
  ProductionStepResponse,
  ProductionOrderResponse,
  ProofingOrderResponse,
  CreateStockOutForProductionRequest,
} from "@/Schema";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMaterials } from "@/hooks";

interface MaterialExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: ProductionStepResponse;
  productionOrder: ProductionOrderResponse;
  proofingOrder?: ProofingOrderResponse | null;
  onCancel?: () => void; // Callback when user cancels without creating stock out
  onComplete?: () => void; // Callback when user completes the step after creating stock out
}

interface MaterialItem {
  itemName: string;
  itemCode?: string;
  unit?: string;
  quantity: number;
  notes?: string;
  materialId?: number;
  materialTypeId?: number;
}

export function MaterialExportDialog({
  open,
  onOpenChange,
  step,
  productionOrder,
  proofingOrder,
  onCancel,
  onComplete,
}: MaterialExportDialogProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [stockOutDate, setStockOutDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm", { locale: vi })
  );
  const [hasStockOutCreated, setHasStockOutCreated] = useState(false);

  // Fixed quantity from proofing order (cannot be edited)
  const fixedQuantity = proofingOrder?.totalQuantity || step.inputQty || 0;

  const { mutate: updateStep, isPending: updatingStep } =
    useUpdateProductionStep();
  const { mutate: createStockOutForProduction, isPending: isCreatingStockOut } =
    useCreateStockOutForProduction();

  // Fetch materials with same materialTypeId and sufficient quantity
  const { data: materialsData, isLoading: isLoadingMaterials } = useMaterials({
    page: 1,
    size: 1000,
    materialTypeId: proofingOrder?.materialType?.id,
  });

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

  // Filter materials that have enough quantity
  const availableMaterials = useMemo(() => {
    if (!materialsData?.items || fixedQuantity <= 0) return [];
    return materialsData.items.filter(
      (material) =>
        material.quantity !== undefined &&
        material.quantity >= fixedQuantity &&
        material.materialTypeId === proofingOrder?.materialType?.id
    );
  }, [materialsData?.items, fixedQuantity, proofingOrder?.materialType?.id]);

  // Get selected material details
  // When existingStockOut, search in all materialsData, otherwise only in availableMaterials
  const selectedMaterial = useMemo(() => {
    if (!selectedMaterialId) return null;
    // First try to find in availableMaterials
    const foundInAvailable = availableMaterials.find(
      (m) => m.id === selectedMaterialId
    );
    if (foundInAvailable) return foundInAvailable;
    // If not found and we have existingStockOut, search in all materialsData
    if (existingStockOut && materialsData?.items) {
      return (
        materialsData.items.find((m) => m.id === selectedMaterialId) || null
      );
    }
    return null;
  }, [
    selectedMaterialId,
    availableMaterials,
    existingStockOut,
    materialsData?.items,
  ]);

  // Fetch detailed stock-out information if exists
  const { data: stockOutDetail } = useStockOut(
    existingStockOut?.id || null,
    open && !!existingStockOut?.id
  );

  // Reset hasStockOutCreated when dialog opens
  useEffect(() => {
    if (open) {
      setHasStockOutCreated(false);
    }
  }, [open]);

  const isCancellationLocked = hasStockOutCreated || !!existingStockOut;

  // Load existing stock-out data into form when dialog opens
  useEffect(() => {
    if (open && stockOutDetail) {
      // Load selected material from existing stock-out
      if (stockOutDetail.items && stockOutDetail.items.length > 0) {
        const firstItem = stockOutDetail.items[0];
        // Find material by materialId
        if (firstItem.materialId) {
          setSelectedMaterialId(firstItem.materialId);
        }
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
      setSelectedMaterialId(null);
      setNotes("");
      setStockOutDate(format(new Date(), "yyyy-MM-dd'T'HH:mm", { locale: vi }));
    }
  }, [open, stockOutDetail, existingStockOut, proofingOrder, step]);

  const isProcessing = updatingStep || isCreatingStockOut;

  const handleClose = () => {
    if (isProcessing) return;

    // Close dialog first
    onOpenChange(false);

    // Then call onCancel to rollback step to ready (if needed)
    // This is called after dialog closes to avoid blocking the close action
    if (!hasStockOutCreated && !existingStockOut && onCancel) {
      // Use setTimeout to ensure dialog closes first
      setTimeout(() => {
        onCancel();
      }, 0);
    }
  };

  const handleMaterialSelect = (materialId: number) => {
    setSelectedMaterialId(materialId);
  };

  const handleSubmit = async () => {
    // If stock-out already exists, mark as created (don't close dialog, show complete button)
    if (existingStockOut) {
      setHasStockOutCreated(true); // Mark as created since it already exists
      toast.success("Phiếu xuất kho đã được tạo tự động", {
        description: `Phiếu xuất kho #${existingStockOut.id} đã tồn tại. Bấm "Hoàn thành" để hoàn thành bước.`,
      });
      // Don't close dialog, let user click "Hoàn thành" button
      return;
    }

    // Validate material selection
    if (!selectedMaterial || !selectedMaterial.id) {
      toast.error("Vui lòng chọn nguyên liệu");
      return;
    }

    if (!productionOrder.id) {
      toast.error("Không tìm thấy lệnh sản xuất");
      return;
    }

    // Check if selected material has enough quantity
    if (
      selectedMaterial.quantity === undefined ||
      selectedMaterial.quantity < fixedQuantity
    ) {
      toast.error("Nguyên liệu không đủ số lượng", {
        description: `Nguyên liệu "${selectedMaterial.name || ""}" chỉ có ${selectedMaterial.quantity?.toLocaleString("vi-VN") || 0} nhưng cần ${fixedQuantity.toLocaleString("vi-VN")}`,
      });
      return;
    }

    // Create stock-out for production
    const payload = {
      productionOrderId: productionOrder.id,
      itemType: "material_export",
      stockOutDate: stockOutDate
        ? new Date(stockOutDate).toISOString()
        : undefined,
      notes: notes.trim() || undefined,
      items: [
        {
          itemName: selectedMaterial.name || "",
          itemCode: selectedMaterial.name
            ? generateMaterialCode(selectedMaterial.name)
            : undefined,
          unit: "tấm", // Default unit
          quantity: fixedQuantity,
          notes: undefined,
          materialId: selectedMaterial.id,
        },
      ],
    };
    createStockOutForProduction(payload, {
      onSuccess: (data) => {
        // Mark that stock out has been created
        setHasStockOutCreated(true);

        // Step status is already updated to in_progress when dialog opens
        toast.success("Đã tạo phiếu xuất kho thành công", {
          description: `Phiếu xuất kho #${data?.id || ""} đã được tạo thành công. Bấm "Hoàn thành" để hoàn thành bước.`,
        });

        // Don't close dialog, let user click "Hoàn thành" button
      },
      onError: (error: any) => {
        toast.error("Không thể tạo phiếu xuất kho", {
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Đã xảy ra lỗi khi tạo phiếu xuất kho",
        });
      },
    });
  };

  // Generate material code from name (similar to StockOutCreate)
  const generateMaterialCode = (name: string): string => {
    if (!name) return "";
    let code = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s*cm\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    code = code
      .replace(/[\s_-]+/g, "-")
      .replace(/[^A-Za-z0-9xX-]/g, "")
      .replace(/-+/g, "-")
      .toUpperCase()
      .replace(/^-+|-+$/g, "");
    return code;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Once stock-out is created (or auto-created exists), don't allow cancel/close.
          if (isCancellationLocked) return;
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShoppingCart className="h-5 w-5" />
            </div>
            Xuất nguyên liệu
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
          </div>

          {/* Material Selection */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <Label className="text-sm font-semibold">
                Chọn nguyên liệu
                {existingStockOut && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (Đã tạo tự động)
                  </span>
                )}
              </Label>
              {!existingStockOut && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Số lượng: {fixedQuantity.toLocaleString("vi-VN")} tấm
                  </Badge>
                </div>
              )}
            </div>

            {isLoadingMaterials ? (
              <div className="flex-1 flex items-center justify-center border rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Đang tải danh sách nguyên liệu...
                  </p>
                </div>
              </div>
            ) : availableMaterials.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/30">
                <div className="text-center space-y-2 p-6">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Không có nguyên liệu phù hợp
                  </p>
                </div>
              </div>
            ) : existingStockOut && selectedMaterial ? (
              // Show selected material info when stock-out already exists
              <div className="flex-1 border rounded-lg p-4">
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">
                          {selectedMaterial.name ||
                            `Nguyên liệu #${selectedMaterial.id}`}
                        </h4>
                        {selectedMaterial.materialTypeName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedMaterial.materialTypeName}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-emerald-500 hover:bg-emerald-600">
                        Đã chọn
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">
                          Kích thước
                        </p>
                        <p className="text-xs font-medium">
                          {selectedMaterial.length && selectedMaterial.width
                            ? `${selectedMaterial.length}×${selectedMaterial.width}${
                                selectedMaterial.height
                                  ? `×${selectedMaterial.height}`
                                  : ""
                              }`
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">
                          Tồn kho
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {selectedMaterial.quantity?.toLocaleString("vi-VN") ||
                            0}{" "}
                          tấm
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Số lượng đã xuất:
                        </span>
                        <Badge
                          variant="default"
                          className="text-xs font-semibold"
                        >
                          {fixedQuantity.toLocaleString("vi-VN")} tấm
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableMaterials.map((material) => {
                      const isSelected = selectedMaterialId === material.id;
                      const hasEnoughQuantity =
                        material.quantity !== undefined &&
                        material.quantity >= fixedQuantity;

                      return (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() =>
                            !existingStockOut &&
                            handleMaterialSelect(material.id!)
                          }
                          disabled={isProcessing || !!existingStockOut}
                          className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                              : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                          } ${
                            isProcessing || existingStockOut
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-foreground truncate">
                                  {material.name ||
                                    `Nguyên liệu #${material.id}`}
                                </h4>
                                {material.materialTypeName && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {material.materialTypeName}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">
                                  Kích thước
                                </p>
                                <p className="text-xs font-medium">
                                  {material.length && material.width
                                    ? `${material.length}×${material.width}${
                                        material.height
                                          ? `×${material.height}`
                                          : ""
                                      }`
                                    : "—"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">
                                  Tồn kho
                                </p>
                                <p
                                  className={`text-xs font-semibold ${
                                    hasEnoughQuantity
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-orange-600 dark:text-orange-400"
                                  }`}
                                >
                                  {material.quantity?.toLocaleString("vi-VN") ||
                                    0}{" "}
                                  tấm
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                  Số lượng cần:
                                </span>
                                <Badge
                                  variant={
                                    hasEnoughQuantity
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="text-xs font-semibold"
                                >
                                  {fixedQuantity.toLocaleString("vi-VN")} tấm
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* Selected Material Summary */}
            {selectedMaterial && !existingStockOut && (
              <div className="shrink-0 mt-3 p-3 rounded-lg border bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Nguyên liệu đã chọn
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedMaterial.name ||
                        `Nguyên liệu #${selectedMaterial.id}`}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-base font-semibold px-3 py-1"
                  >
                    {fixedQuantity.toLocaleString("vi-VN")} tấm
                  </Badge>
                </div>
              </div>
            )}
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
          {!isCancellationLocked && (
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Hủy
            </Button>
          )}
          {/* Show "Hoàn thành" button if stock out has been created or exists */}
          {(hasStockOutCreated || existingStockOut) && onComplete ? (
            <Button
              onClick={() => {
                if (onComplete) {
                  onComplete();
                  handleClose();
                }
              }}
              disabled={isProcessing}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Hoàn thành
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={
                isProcessing ||
                (!existingStockOut && !selectedMaterialId) ||
                availableMaterials.length === 0
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
                  Tạo phiếu
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
