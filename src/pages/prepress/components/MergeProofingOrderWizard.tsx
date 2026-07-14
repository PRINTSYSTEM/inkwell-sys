import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProofingCart } from "@/context/proofing-cart-context";
import {
  useAvailableBins,
  useProofingOrder,
  useAddDesignsToProofingOrder,
} from "@/hooks/use-proofing-order";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  Copy,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { proofingStatusLabels } from "@/lib/status-utils";

interface MergeProofingOrderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrders?: any[];
}

export function MergeProofingOrderWizard({
  open,
  onOpenChange,
  existingOrders = [],
}: MergeProofingOrderWizardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useProofingCart();
  const { mutateAsync: addDesigns, isPending: isSubmitting } = useAddDesignsToProofingOrder();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBinId, setSelectedBinId] = useState<number | null>(null);
  const [addedQuantities, setAddedQuantities] = useState<Record<number, string>>({});

  // Reset wizard state on open/close
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedBinId(null);
      setAddedQuantities({});
    }
  }, [open]);

  // Step 1: Validation of DesignType
  // Let's resolve the designTypeId for each cart item safely
  const cartItemsWithResolvedTypes = useMemo(() => {
    return cartItems.map(item => {
      const typeId = (item as any).designTypeId ?? (item as any).designType?.id ?? null;
      return { ...item, resolvedDesignTypeId: typeId };
    });
  }, [cartItems]);

  const hasMixedTypes = useMemo(() => {
    if (cartItemsWithResolvedTypes.length <= 1) return false;
    const firstType = cartItemsWithResolvedTypes[0].resolvedDesignTypeId;
    return cartItemsWithResolvedTypes.some(item => item.resolvedDesignTypeId !== firstType);
  }, [cartItemsWithResolvedTypes]);

  const activeDesignTypeId = useMemo(() => {
    return cartItemsWithResolvedTypes[0]?.resolvedDesignTypeId ?? null;
  }, [cartItemsWithResolvedTypes]);

  const activeDesignTypeName = useMemo(() => {
    return cartItems[0]?.designTypeName || "Chưa xác định";
  }, [cartItems]);

  // Step 2: Fetch available compatible proofing orders (bins)
  const { data: availableBins = [], isLoading: isLoadingBins } = useAvailableBins(
    activeDesignTypeId,
    open && step === 2 && activeDesignTypeId !== null
  );

  // Step 2 & 3: Fetch detail of the selected destination proofing order (bin)
  const { data: destinationDetail, isLoading: isLoadingDetail } = useProofingOrder(
    selectedBinId,
    open && selectedBinId !== null
  );

  // Merge availableBins with existingOrders and destinationDetail to get complete details
  const resolvedBins = useMemo(() => {
    return availableBins.map(bin => {
      const found = existingOrders?.find(o => o.id === bin.id) || (bin.id === selectedBinId ? destinationDetail : null);
      if (found) {
        return {
          ...bin,
          ...found,
        };
      }
      return bin;
    });
  }, [availableBins, existingOrders, selectedBinId, destinationDetail]);

  // Initialize quantities for Step 3
  useEffect(() => {
    if (step === 3 && cartItems.length > 0) {
      const initial: Record<number, string> = {};
      cartItems.forEach((item) => {
        initial[item.readyDesignId] = String(item.quantity ?? 1000);
      });
      setAddedQuantities(initial);
    }
  }, [step, cartItems]);

  // Helper functions to get material and papersize labels from design list inside order
  const getMaterialLabel = (bin: any) => {
    const designs = bin.proofingOrderDesigns || [];
    if (designs.length > 0) {
      const materials = Array.from(
        new Set(
          designs.map((pod: any) => {
            const matName = pod.design?.materialType?.name || pod.materialTypeName || bin.materialTypeName || "—";
            const basisWeight = pod.design?.basisWeight || bin.basisWeight;
            return `${matName}${basisWeight ? ` ${basisWeight}gsm` : ""}`;
          })
        )
      );
      const filtered = materials.filter(m => m !== "—");
      if (filtered.length > 0) return filtered.join(", ");
    }
    return bin.materialTypeName || "—";
  };

  const getPaperSizeLabel = (bin: any) => {
    if (bin.paperSize?.name) return bin.paperSize.name;
    if (bin.customPaperSize) return bin.customPaperSize;
    if (bin.rollWidth) return `Cuộn (Rộng: ${bin.rollWidth} mm)`;
    return "—";
  };

  // Check if a design is a duplicate (By design code to prevent ID collisions)
  const duplicateMap = useMemo(() => {
    const map = new Set<string>();
    if (!destinationDetail?.proofingOrderDesigns) return map;
    destinationDetail.proofingOrderDesigns.forEach((pod) => {
      if (pod.design?.code) {
        map.add(pod.design.code.trim().toLowerCase());
      }
    });
    return map;
  }, [destinationDetail]);

  const isDuplicate = (item: any) => {
    if (item.designCode && duplicateMap.has(item.designCode.trim().toLowerCase())) {
      return true;
    }
    return false;
  };

  const getExistingQuantity = (item: any) => {
    if (!destinationDetail?.proofingOrderDesigns) return 0;
    const found = destinationDetail.proofingOrderDesigns.find(
      (pod) =>
        pod.design?.code && item.designCode && pod.design.code.trim().toLowerCase() === item.designCode.trim().toLowerCase()
    );
    return found?.quantity ?? 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (hasMixedTypes) {
        toast.error("Không thể tiếp tục vì các thiết kế trong giỏ không cùng loại");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedBinId) {
        toast.warning("Vui lòng chọn một bài bình đích");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleConfirmMerge = async () => {
    if (!selectedBinId) return;

    const itemsPayload = cartItems
      .map((item) => {
        const qty = parseInt(addedQuantities[item.readyDesignId] || "0", 10);
        return {
          readyDesignId: item.readyDesignId,
          designId: item.designId,
          orderDetailId: (item.orderDetailId && item.orderDetailId > 0) ? item.orderDetailId : null,
          quantity: qty,
        };
      })
      .filter((item) => item.quantity > 0);

    if (itemsPayload.length === 0) {
      toast.warning("Vui lòng nhập số lượng thêm lớn hơn 0 cho ít nhất một thiết kế");
      return;
    }

    try {
      await addDesigns({
        id: selectedBinId,
        request: {
          materialTypeId: destinationDetail?.materialTypeId ?? null,
          items: itemsPayload,
        },
        suppressToast: true,
      });

      // Clear cart items that were successfully added
      clearCart();

      // Invalidate query caches
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders", "available-bins"] });

      toast.success("Ghép bài bình thành công", {
        description: `Đã thêm ${itemsPayload.length} thiết kế vào bài bình ${destinationDetail?.code || ""}`,
      });

      onOpenChange(false);

      // Navigate to the proofing order detail page and highlight newly added designs
      const addedIds = itemsPayload.map(item => item.designId || item.readyDesignId).join(",");
      navigate(`/proofing/${selectedBinId}?highlightDesignId=${addedIds}`);
    } catch (err: any) {
      toast.error("Lỗi ghép bài bình", {
        description: err.response?.data?.message || err.message || "Không thể nạp thiết kế vào bài bình",
      });
    }
  };

  const handleQtyChange = (readyDesignId: number, val: string) => {
    if (val === "" || /^\d+$/.test(val)) {
      setAddedQuantities((prev) => ({
        ...prev,
        [readyDesignId]: val,
      }));
    }
  };

  const hasDuplicateDesigns = cartItems.some((item) => isDuplicate(item));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[94vw] max-h-[85vh] flex flex-col p-6">
        {/* Style block for visual blink effect on duplicate items */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes border-pulse {
            0%, 100% { border-color: rgb(245, 158, 11); background-color: rgba(254, 243, 199, 0.4); }
            50% { border-color: rgba(245, 158, 11, 0.2); background-color: rgba(254, 243, 199, 0.1); }
          }
          .animate-border-pulse {
            animation: border-pulse 1s ease-in-out 2;
          }
          @keyframes border-pulse-green {
            0%, 100% { border-color: rgb(34, 197, 94); background-color: rgba(240, 253, 244, 0.4); }
            50% { border-color: rgba(34, 197, 94, 0.2); background-color: rgba(240, 253, 244, 0.1); }
          }
          .animate-border-pulse-green {
            animation: border-pulse-green 1s ease-in-out 2;
          }
        ` }} />

        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Copy className="w-5 h-5 text-blue-600" />
            Ghép thiết kế vào bài bình hiện có
          </DialogTitle>
          <div className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>Hoàn thành 3 bước để ghép các thiết kế chờ vào bài bình</span>
            {/* Step Indicators */}
            <div className="flex items-center gap-2 text-xs font-semibold mr-4">
              <span className={`px-2 py-0.5 rounded-full ${step === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>1. Xem giỏ</span>
              <span className="text-slate-300">/</span>
              <span className={`px-2 py-0.5 rounded-full ${step === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>2. Chọn bài bình</span>
              <span className="text-slate-300">/</span>
              <span className={`px-2 py-0.5 rounded-full ${step === 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>3. Xác nhận số lượng</span>
            </div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* STEP 1: Review Cart */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-800">
                  <Info className="w-4.5 h-4.5 text-blue-600" />
                  <div>
                    Các thiết kế được chọn để ghép bài phải có cùng một <strong>Loại thiết kế</strong>.
                    Hiện tại: <Badge className="ml-1 bg-blue-100 text-blue-800 font-bold border-blue-200">{activeDesignTypeName}</Badge>
                  </div>
                </div>
              </div>

              {hasMixedTypes && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-bold">
                    Phát hiện các thiết kế khác loại trong giỏ ghép bài! Vui lòng xóa bớt thiết kế để đảm bảo tất cả thiết kế cùng một loại (ví dụ: cùng là Hộp, hoặc cùng là Nhãn).
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 text-center">Ảnh</TableHead>
                      <TableHead>Mã hàng</TableHead>
                      <TableHead>Tên thiết kế</TableHead>
                      <TableHead>Loại thiết kế</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Chất liệu</TableHead>
                      <TableHead className="text-right">SL có sẵn</TableHead>
                      <TableHead className="w-12 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItemsWithResolvedTypes.map((item) => {
                      const isMismatched = item.resolvedDesignTypeId !== activeDesignTypeId;
                      return (
                        <TableRow
                          key={item.readyDesignId}
                          className={isMismatched ? "bg-red-50/30 dark:bg-red-950/10 text-red-900" : ""}
                        >
                          <TableCell className="text-center py-1">
                            {item.designImageUrl ? (
                              <img
                                src={item.designImageUrl}
                                alt={item.designCode}
                                className="h-8 w-8 object-cover rounded border mx-auto"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-slate-100 rounded border flex items-center justify-center text-[9px] text-muted-foreground mx-auto">
                                No Pic
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-xs">{item.designCode}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs" title={item.designName}>
                            {item.designName}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant={isMismatched ? "destructive" : "outline"} className="text-[10px]">
                              {item.designTypeName || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.length && item.width
                              ? `${item.length} x ${item.width}${item.height ? ` x ${item.height}` : ""} mm`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{item.materialTypeName || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-xs tabular-nums">
                            {item.availableQuantity?.toLocaleString("vi-VN") || "0"}
                          </TableCell>
                          <TableCell className="text-center py-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeFromCart(item.readyDesignId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* STEP 2: Select Destination Proofing Order */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border p-3 rounded-lg text-xs">
                <span className="font-bold text-slate-700 mr-2">Loại thiết kế bài bình đích:</span>
                <Badge className="bg-blue-600 text-white font-bold">{activeDesignTypeName}</Badge>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Danh sách hiển thị các bài bình đang ở trạng thái <strong>Chờ xử lý, Tạm dừng</strong>, hoặc <strong>Sản xuất trả về</strong> có cùng Loại thiết kế.
                </p>
              </div>

              {isLoadingBins ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs">Đang tìm danh sách bài bình phù hợp...</span>
                </div>
              ) : resolvedBins.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-white">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">Không có bài bình nào phù hợp!</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Hiện tại không có bài bình nào của loại <strong>{activeDesignTypeName}</strong> ở các trạng thái có thể ghép bài (Chờ xử lý, Tạm dừng, Trả về). Vui lòng tạo một bài bình mới.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border bg-white overflow-hidden max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-10 text-center"></TableHead>
                        <TableHead>Mã bài bình</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Loại bài</TableHead>
                        <TableHead>Chất liệu</TableHead>
                        <TableHead>Khổ giấy</TableHead>
                        <TableHead className="text-right">Số lượng tờ in</TableHead>
                        <TableHead className="text-right">Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolvedBins.map((bin) => {
                        const isSelected = selectedBinId === bin.id;
                        return (
                          <TableRow
                            key={bin.id}
                            className={`cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50/50 hover:bg-blue-50" : ""
                              }`}
                            onClick={() => setSelectedBinId(bin.id)}
                          >
                            <TableCell className="text-center py-2">
                              <input
                                type="radio"
                                checked={isSelected}
                                onChange={() => setSelectedBinId(bin.id)}
                                className="h-4 w-4 text-blue-600"
                              />
                            </TableCell>
                            <TableCell className="font-bold text-xs">{bin.code || `Bình Bài #${bin.id}`}</TableCell>
                            <TableCell className="text-xs">
                              <Badge
                                variant="outline"
                                className={
                                  bin.status === "paused"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                                    : bin.status === "production_returned"
                                      ? "bg-red-50 text-red-700 border-red-200 font-bold"
                                      : "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                                }
                              >
                                {proofingStatusLabels[bin.status || ""] || bin.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px] font-bold">
                                {bin.designTypeName || bin.designType?.name || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{getMaterialLabel(bin)}</TableCell>
                            <TableCell className="text-xs">
                              {getPaperSizeLabel(bin)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-xs tabular-nums">
                              {(bin.totalQuantity || 0).toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {bin.createdAt ? format(new Date(bin.createdAt), "dd/MM/yyyy") : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Show check results once a bin is selected */}
              {selectedBinId && (
                <div className="mt-4 border-t pt-4">
                  {isLoadingDetail ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Đang kiểm tra chi tiết các thiết kế trùng lặp...</span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border rounded-lg p-3">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                        <span>Đã kiểm tra bài bình {destinationDetail?.code || ""}:</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 space-y-1">
                        <div>
                          • Số thiết kế hiện có trong bài bình: <strong>{destinationDetail?.proofingOrderDesigns?.length || 0}</strong>
                        </div>
                        {hasDuplicateDesigns ? (
                          <div className="text-amber-800 font-bold flex items-center gap-1.5 mt-1 bg-amber-50 border border-amber-100 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>
                              Phát hiện thiết kế đã có sẵn trong bài bình! Khi ghép bài, số lượng mới nhập sẽ được <strong>cộng thêm</strong> vào số lượng cũ.
                            </span>
                          </div>
                        ) : (
                          <div className="text-green-800 font-medium flex items-center gap-1.5 mt-1 bg-green-50 border border-green-100 p-2 rounded">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Không phát hiện thiết kế trùng lặp. Tất cả thiết kế sẽ được thêm mới hoàn toàn.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirm Quantities */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50/30 border border-blue-100 p-3 rounded-lg text-xs leading-relaxed text-blue-900">
                <div>Bài bình đích: <strong className="text-blue-800">{destinationDetail?.code || ""}</strong> ({destinationDetail?.materialType?.name || "—"})</div>
                <div className="mt-1">
                  Nhập số lượng bổ sung cần nạp cho từng thiết kế dưới đây. Đối với các thiết kế trùng lặp (có nhãn màu cam), số lượng sẽ được cộng thêm vào bài bình.
                </div>
              </div>

              <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 text-center">Ảnh</TableHead>
                      <TableHead>Mã hàng</TableHead>
                      <TableHead>Tên thiết kế</TableHead>
                      <TableHead className="text-center w-28">Trạng thái</TableHead>
                      <TableHead className="text-right w-24">Hiện tại</TableHead>
                      <TableHead className="text-center w-36">Số lượng thêm</TableHead>
                      <TableHead className="text-right w-28">Tổng số mới</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => {
                      const isItemDuplicate = isDuplicate(item);
                      const currentQty = getExistingQuantity(item);
                      const addQtyStr = addedQuantities[item.readyDesignId] || "";
                      const addQty = parseInt(addQtyStr || "0", 10);
                      const totalQty = currentQty + addQty;

                      const showBlink = !isItemDuplicate || (isItemDuplicate && addQty > 0);
                      const blinkClass = !isItemDuplicate 
                        ? "animate-border-pulse-green border-y border-green-300"
                        : "animate-border-pulse border-y border-amber-300";

                      return (
                        <TableRow
                          key={item.readyDesignId}
                          className={showBlink ? blinkClass : ""}
                        >
                          <TableCell className="text-center py-1">
                            {item.designImageUrl ? (
                              <img
                                src={item.designImageUrl}
                                alt={item.designCode}
                                className="h-8 w-8 object-cover rounded border mx-auto"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-slate-100 rounded border flex items-center justify-center text-[9px] text-muted-foreground mx-auto">
                                No Pic
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-xs">{item.designCode}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs" title={item.designName}>
                            {item.designName}
                          </TableCell>
                          <TableCell className="text-center py-1.5">
                            {isItemDuplicate ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-wide">
                                Trùng - Cộng dồn
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50/50 font-bold text-[9px] uppercase tracking-wide">
                                Thêm mới
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs tabular-nums text-slate-500">
                            {isItemDuplicate ? currentQty.toLocaleString("vi-VN") : "—"}
                          </TableCell>
                          <TableCell className="text-center py-1">
                            <Input
                              type="number"
                              value={addQtyStr}
                              onChange={(e) => handleQtyChange(item.readyDesignId, e.target.value)}
                              onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              className="h-8 text-xs font-bold tabular-nums w-28 mx-auto focus-visible:ring-blue-600"
                              placeholder="Số lượng..."
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs tabular-nums text-blue-700">
                            {isItemDuplicate ? totalQty.toLocaleString("vi-VN") : addQty.toLocaleString("vi-VN")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <DialogFooter className="flex-shrink-0 border-t pt-4 flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={isSubmitting}
              className="gap-1.5 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Hủy
          </Button>

          {step < 3 ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              disabled={cartItems.length === 0 || hasMixedTypes || (step === 2 && !selectedBinId) || isLoadingDetail}
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tiếp theo
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmMerge}
              disabled={isSubmitting || isLoadingDetail}
              className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang ghép bài...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận & Ghép bài
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
