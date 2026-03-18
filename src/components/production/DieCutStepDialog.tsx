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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Scissors,
  Package,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useUpdateProductionStep } from "@/hooks/use-production";
import {
  useStockOutsByProductionOrder,
  useCompleteStockOut,
} from "@/hooks/use-stock";
import { useTakeOutDie, useReturnDie } from "@/hooks/use-die";
import { useSearchDies } from "@/hooks/use-die";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import type {
  ProductionStepResponse,
  ProductionOrderResponse,
  ProofingOrderResponse,
  DieExportResponse,
  DieResponse,
} from "@/Schema";
import { formatDieSize } from "@/utils/format-die-size";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { dieStatusLabels, dieLocationLabels } from "@/lib/status-utils";

interface DieCutStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: ProductionStepResponse;
  productionOrder: ProductionOrderResponse;
  proofingOrder?: ProofingOrderResponse | null;
  mode: "start" | "complete"; // start: lấy khuôn bế, complete: trả khuôn bế
}

export function DieCutStepDialog({
  open,
  onOpenChange,
  step,
  productionOrder,
  proofingOrder,
  mode,
}: DieCutStepDialogProps) {
  const [selectedDieExportId, setSelectedDieExportId] = useState<number | null>(
    null
  );
  const [dieSearchTerm, setDieSearchTerm] = useState("");
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [outputQty, setOutputQty] = useState<number>(
    step.inputQty || proofingOrder?.totalQuantity || 0
  );
  const [defectQty, setDefectQty] = useState<number>(0);
  const [defectNotes, setDefectNotes] = useState("");
  const [notes, setNotes] = useState("");

  const [debouncedDieSearch] = useDebounce(dieSearchTerm, 300);

  const { mutate: updateStep, isPending: updatingStep } =
    useUpdateProductionStep();
  const { mutate: takeOutDie, isPending: takingOutDie } = useTakeOutDie();
  const { mutate: returnDie, isPending: returningDie } = useReturnDie();
  const { mutate: completeStockOut } = useCompleteStockOut();

  // Fetch stock outs for this production order to find material export stock out
  const { data: stockOutsData } = useStockOutsByProductionOrder(
    productionOrder?.id || null,
    open && !!productionOrder?.id && mode === "complete"
  );
  const stockOuts = stockOutsData || [];

  // Fetch dies from proofing order
  // Note: proofingOrder.dieExports or proofingOrder.proofingOrderDies contains the die exports
  // We'll use the dies directly from proofingOrder if available, otherwise fetch
  const proofingOrderDies = useMemo(() => {
    if (!proofingOrder) return [];
    return (
      proofingOrder.dieExports ||
      proofingOrder.proofingOrderDies ||
      []
    ) as DieExportResponse[];
  }, [proofingOrder]);

  // Search for additional dies if needed
  const dieSearchParams = useMemo(() => {
    if (!open || !debouncedDieSearch.trim()) return undefined;
    return {
      dieName: debouncedDieSearch.trim() || "",
      isUsable: true,
      pageSize: 20,
    };
  }, [open, debouncedDieSearch]);

  const { data: searchDiesData, isLoading: loadingSearchDies } =
    useSearchDies(dieSearchParams);
  const searchDies = searchDiesData?.items || [];

  const isProcessing = updatingStep || takingOutDie || returningDie;

  useEffect(() => {
    if (open && proofingOrderDies && proofingOrderDies.length > 0 && mode === "start") {
      // Auto-select first available die export
      const firstAvailable = proofingOrderDies.find(
        (dieExport: DieExportResponse) => dieExport.die?.isUsable
      );
      if (firstAvailable?.id) {
        setSelectedDieExportId(firstAvailable.id);
      }
    }
  }, [open, proofingOrderDies, mode]);

  const handleClose = () => {
    if (isProcessing) return;
    setSelectedDieExportId(null);
    setDieSearchTerm("");
    setOutputQty(step.inputQty || proofingOrder?.totalQuantity || 0);
    setDefectQty(0);
    setDefectNotes("");
    setNotes("");
    onOpenChange(false);
  };

  const handleStartStep = async () => {
    if (!selectedDieExportId) {
      toast.error("Vui lòng chọn khuôn bế để lấy");
      return;
    }

    try {
      // Step 1: Take out die (lấy khuôn bế)
      await new Promise<void>((resolve, reject) => {
        takeOutDie(selectedDieExportId, {
          onSuccess: () => {
            resolve();
          },
          onError: reject,
        });
      });

      // Step 2: Update production step to IN_PROGRESS
      await updateStep({
        stepId: step.id!,
        data: {
          status: "in_progress",
          inputQty: step.inputQty || undefined,
        },
      });

      toast.success("Đã lấy khuôn bế và bắt đầu bước sản xuất", {
        description: "Khuôn bế đã được lấy thành công",
      });

      handleClose();
    } catch (error: any) {
      toast.error("Không thể lấy khuôn bế", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Đã xảy ra lỗi khi lấy khuôn bế",
      });
    }
  };

  const handleCompleteStep = async () => {
    if (outputQty <= 0) {
      toast.error("Số lượng sản xuất phải lớn hơn 0");
      return;
    }

    if (defectQty < 0) {
      toast.error("Số lượng lỗi không thể âm");
      return;
    }

    if (!proofingOrderDies || proofingOrderDies.length === 0) {
      toast.error("Không tìm thấy thông tin khuôn bế để trả");
      return;
    }

    try {
      // Find die export that was taken out (should be the one being used)
      const dieExportToReturn = proofingOrderDies.find(
        (de: DieExportResponse) => de.id === selectedDieExportId
      ) || proofingOrderDies[0]; // Fallback to first one

      if (!dieExportToReturn?.id) {
        throw new Error("Không tìm thấy khuôn bế để trả");
      }

      // Step 1: Return die (trả khuôn bế)
      await new Promise<void>((resolve, reject) => {
        returnDie(dieExportToReturn.id, {
          onSuccess: () => {
            resolve();
          },
          onError: reject,
        });
      });

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

      toast.success("Đã trả khuôn bế và hoàn thành bước sản xuất", {
        description: `Số lượng sản xuất: ${outputQty}, Lỗi: ${defectQty || 0}`,
      });

      handleClose();
    } catch (error: any) {
      toast.error("Không thể hoàn thành bước sản xuất", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Đã xảy ra lỗi khi trả khuôn bế hoặc cập nhật bước sản xuất",
      });
    }
  };

  const availableDies = proofingOrderDies || [];
  const isStartMode = mode === "start";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative border-2 border-red-500/50">
          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 z-[9999] font-mono pointer-events-none rounded-bl">
            DieCutStepDialog.tsx
          </div>
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                <Scissors className="h-5 w-5" />
              </div>
              {isStartMode ? "Lấy khuôn bế" : "Trả khuôn bế"} -{" "}
              {step.stepTypeName || step.stepType}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isStartMode
                ? "Chọn khuôn bế để lấy từ kho và bắt đầu bước sản xuất"
                : "Nhập thông tin sản xuất và trả khuôn bế về kho"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
            {/* Production Info */}
            <div className="shrink-0 grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Lệnh sản xuất
                </Label>
                <p className="text-sm font-semibold">
                  {productionOrder.proofingOrderCode ||
                    `#${productionOrder.id}`}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Số lượng đầu vào
                </Label>
                <p className="text-sm font-semibold">{step.inputQty || 0}</p>
              </div>
            </div>

            {isStartMode ? (
              /* Start Mode: Select Die */
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="shrink-0 mb-3">
                  <Label className="text-sm font-semibold">
                    Danh sách khuôn bế từ bình bài
                  </Label>
                  {proofingOrderDies && proofingOrderDies.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Chọn khuôn bế cần lấy từ danh sách hoặc tìm kiếm thêm
                    </p>
                  )}
                </div>

                {availableDies.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
                    <Package className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Không có khuôn bế
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Bình bài này chưa có khuôn bế được gán. Vui lòng gán
                      khuôn bế tại trang chi tiết bình bài trước.
                    </p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 border rounded-lg">
                      <div className="p-4 space-y-3">
                        {availableDies.map((dieExport: DieExportResponse) => {
                          const die = dieExport.die;
                          if (!die) return null;

                          const isSelected = selectedDieExportId === dieExport.id;
                          const isUsable = die.isUsable;

                          return (
                            <div
                              key={dieExport.id}
                              onClick={() => {
                                if (isUsable) {
                                  setSelectedDieExportId(dieExport.id || null);
                                }
                              }}
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                  : isUsable
                                  ? "border-border hover:border-primary/50 hover:bg-accent/50"
                                  : "border-dashed bg-muted/50 opacity-60 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Die Image */}
                                {die.imageUrl && (
                                  <div
                                    className="relative w-20 h-20 rounded-lg border bg-muted overflow-hidden shrink-0 cursor-pointer group/image"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingImageUrl(die.imageUrl!);
                                      setImageViewerOpen(true);
                                    }}
                                  >
                                    <img
                                      src={die.imageUrl}
                                      alt={die.code || `Die ${die.id}`}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                )}

                                {/* Die Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-base font-mono">
                                          {die.code || `Khuôn #${die.id}`}
                                        </span>
                                        {isSelected && (
                                          <Badge className="bg-primary text-primary-foreground">
                                            Đã chọn
                                          </Badge>
                                        )}
                                        {!isUsable && (
                                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                                            Không dùng được
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                                        <CheckCircle2 className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                                    {die && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Kích thước:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {formatDieSize(die)}
                                        </span>
                                      </div>
                                    )}
                                    {die.location && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Vị trí:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {dieLocationLabels[die.location] ||
                                            die.location}
                                        </span>
                                      </div>
                                    )}
                                    {die.vendorName && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          NCC:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {die.vendorName}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {dieExport.notes && (
                                    <p className="text-xs text-muted-foreground italic">
                                      Ghi chú: {dieExport.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Search for additional dies */}
                    <div className="shrink-0 mt-3 space-y-2">
                      <Label className="text-sm font-medium">
                        Tìm kiếm khuôn bế khác (tùy chọn)
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={dieSearchTerm}
                          onChange={(e) => setDieSearchTerm(e.target.value)}
                          placeholder="Tìm kiếm khuôn bế..."
                          disabled={isProcessing}
                          className="pl-9 h-10"
                        />
                      </div>
                      {loadingSearchDies && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Đang tìm kiếm...
                        </div>
                      )}
                      {searchDies.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Kết quả tìm kiếm:
                          </p>
                          <ScrollArea className="max-h-48 border rounded-lg">
                            <div className="p-2 space-y-2">
                              {searchDies.map((die: DieResponse) => (
                                <div
                                  key={die.id}
                                  onClick={() => {
                                    // For search results, we'd need to assign to proofing order first
                                    // For now, just show info
                                    toast.info("Khuôn bế này cần được gán vào bình bài trước", {
                                      description: "Vui lòng gán khuôn bế tại trang chi tiết bình bài",
                                    });
                                  }}
                                  className="p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-semibold font-mono">
                                        {die.code || `Khuôn #${die.id}`}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {die.location
                                        ? dieLocationLabels[die.location] ||
                                          die.location
                                        : "Chưa có vị trí"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Complete Mode: Return Die & Enter Results */
              <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
                {/* Selected Die Info */}
                {proofingOrderDies && proofingOrderDies.length > 0 && (
                  <div className="shrink-0 p-4 rounded-lg border bg-muted/30">
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Khuôn bế đang sử dụng
                    </Label>
                    {proofingOrderDies.map((dieExport: DieExportResponse) => {
                      const die = dieExport.die;
                      if (!die) return null;
                      return (
                        <div
                          key={dieExport.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          {die.imageUrl && (
                            <div className="w-16 h-16 rounded-lg border bg-muted overflow-hidden shrink-0">
                              <img
                                src={die.imageUrl}
                                alt={die.code || `Die ${die.id}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold font-mono">
                              {die.code || `Khuôn #${die.id}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Production Results */}
                <div className="shrink-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="output-qty" className="text-sm font-medium">
                        Số lượng sản xuất <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="output-qty"
                        type="number"
                        min={1}
                        value={outputQty || ""}
                        onChange={(e) =>
                          setOutputQty(Number(e.target.value) || 0)
                        }
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
                        onChange={(e) =>
                          setDefectQty(Number(e.target.value) || 0)
                        }
                        disabled={isProcessing}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Ghi chú (tùy chọn)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú về quá trình sản xuất..."
                      disabled={isProcessing}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defect-notes" className="text-sm font-medium">
                      Ghi chú lỗi / sự cố {defectQty > 0 && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea
                      id="defect-notes"
                      value={defectNotes}
                      onChange={(e) => setDefectNotes(e.target.value)}
                      placeholder="Mô tả lỗi, sự cố (nếu có)..."
                      disabled={isProcessing}
                      className={`min-h-[100px] resize-none ${
                        defectQty > 0
                          ? "border-orange-300 focus-visible:ring-orange-500"
                          : ""
                      }`}
                    />
                    {defectQty > 0 && !defectNotes.trim() && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Vui lòng nhập ghi chú lỗi khi có số lượng lỗi
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Hủy
            </Button>
            <Button
              onClick={isStartMode ? handleStartStep : handleCompleteStep}
              disabled={
                isProcessing ||
                (isStartMode && !selectedDieExportId) ||
                (!isStartMode && (outputQty <= 0 || (defectQty > 0 && !defectNotes.trim())))
              }
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : isStartMode ? (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Lấy khuôn bế & Bắt đầu
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Trả khuôn bế & Hoàn thành
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) {
              setViewingImageUrl(null);
            }
          }}
        />
      )}
    </>
  );
}
