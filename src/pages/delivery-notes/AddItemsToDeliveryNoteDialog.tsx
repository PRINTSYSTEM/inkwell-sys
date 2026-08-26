import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Package,
  Plus,
  AlertTriangle,
  Loader2,
  History,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import {
  useAvailableOrderDetailsForDeliveryNote,
  useAddDeliveryNoteLines,
} from "@/hooks/use-delivery-note";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";
import type { OrderDetailForDeliveryResponse } from "@/Schema/delivery-note.schema";
import { toast } from "sonner";

interface AddItemsToDeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNoteId: number;
  deliveryNoteCode?: string;
  isTransit?: boolean;
  isCompleted?: boolean;
  onSuccess?: () => void;
}

interface ItemFormState {
  orderDetailId: number;
  deliveryQty: number;
  note: string;
}

export default function AddItemsToDeliveryNoteDialog({
  open,
  onOpenChange,
  deliveryNoteId,
  deliveryNoteCode,
  isTransit = false,
  isCompleted = false,
  onSuccess,
}: AddItemsToDeliveryNoteDialogProps) {
  const {
    data: availableItems,
    isLoading,
    isError,
  } = useAvailableOrderDetailsForDeliveryNote(deliveryNoteId, {
    enabled: open && !!deliveryNoteId,
  });

  const addLinesMutation = useAddDeliveryNoteLines();

  const [selectedItems, setSelectedItems] = useState<Map<number, ItemFormState>>(
    new Map()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmTransitOpen, setConfirmTransitOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingProofingOrderId, setViewingProofingOrderId] = useState<number | null>(null);

  // Reset selection on dialog open/close
  React.useEffect(() => {
    if (!open) {
      setSelectedItems(new Map());
      setSearchQuery("");
      setConfirmTransitOpen(false);
    }
  }, [open]);

  const itemsList = useMemo(() => {
    if (!availableItems || !Array.isArray(availableItems)) return [];
    return availableItems;
  }, [availableItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return itemsList;
    const q = searchQuery.toLowerCase().trim();
    return itemsList.filter((item) => {
      const designCode = item.designCode?.toLowerCase() || "";
      const designName = item.designName?.toLowerCase() || "";
      const orderCode = item.orderCode?.toLowerCase() || "";
      const customerName = item.customerName?.toLowerCase() || "";
      const proofingCodes = (item.proofingOrderCodes || []).join(" ").toLowerCase();

      return (
        designCode.includes(q) ||
        designName.includes(q) ||
        orderCode.includes(q) ||
        customerName.includes(q) ||
        proofingCodes.includes(q)
      );
    });
  }, [itemsList, searchQuery]);

  const handleToggleItem = (item: OrderDetailForDeliveryResponse) => {
    const id = item.orderDetailId;
    if (!id) return;

    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const remaining = item.remainingToDeliver ?? item.orderedQty ?? 1;
        next.set(id, {
          orderDetailId: id,
          deliveryQty: remaining > 0 ? remaining : 1,
          note: "",
        });
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems(new Map());
    } else {
      const next = new Map<number, ItemFormState>();
      filteredItems.forEach((item) => {
        if (item.orderDetailId) {
          const remaining = item.remainingToDeliver ?? item.orderedQty ?? 1;
          next.set(item.orderDetailId, {
            orderDetailId: item.orderDetailId,
            deliveryQty: remaining > 0 ? remaining : 1,
            note: "",
          });
        }
      });
      setSelectedItems(next);
    }
  };

  const handleUpdateQty = (orderDetailId: number, qty: number, max: number) => {
    const validQty = Math.max(1, Math.min(qty, max));
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const cur = next.get(orderDetailId);
      if (cur) {
        next.set(orderDetailId, { ...cur, deliveryQty: validQty });
      }
      return next;
    });
  };

  const handleUpdateNote = (orderDetailId: number, note: string) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const cur = next.get(orderDetailId);
      if (cur) {
        next.set(orderDetailId, { ...cur, note });
      }
      return next;
    });
  };

  const handlePreSubmit = () => {
    if (selectedItems.size === 0) {
      toast.error("Vui lòng chọn ít nhất một mặt hàng để thêm vào phiếu");
      return;
    }

    if (isTransit || isCompleted) {
      setConfirmTransitOpen(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    const lines = Array.from(selectedItems.values()).map((item) => ({
      orderDetailId: item.orderDetailId,
      deliveryQty: item.deliveryQty,
      note: item.note.trim() || undefined,
    }));

    try {
      await addLinesMutation.mutateAsync({
        deliveryNoteId,
        data: { lines },
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch {
      // Error handled by mutation hook
    }
  };

  const totalSelectedQty = useMemo(() => {
    let sum = 0;
    selectedItems.forEach((item) => {
      sum += item.deliveryQty || 0;
    });
    return sum;
  }, [selectedItems]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Thêm hàng vào phiếu giao hàng
                  {deliveryNoteCode && (
                    <span className="font-mono text-primary font-bold">
                      #{deliveryNoteCode}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Chọn các mặt hàng khả dụng của khách hàng để bổ sung vào phiếu giao hàng hiện tại.
                </DialogDescription>
              </div>
              {isCompleted ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Phiếu đã kết thúc (Xuất kho & Mở lại)
                </Badge>
              ) : isTransit ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold px-2.5 py-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                  Phiếu đang giao (Xuất kho ngay)
                </Badge>
              ) : null}
            </div>

            {/* Search Filter */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Tìm theo mã hàng, tên sản phẩm, mã bài, mã đơn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-muted/40"
              />
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-auto p-4 max-h-[58vh]">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="py-12 text-center text-sm text-destructive">
                Không thể tải danh sách hàng khả dụng. Vui lòng thử lại sau.
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                {searchQuery
                  ? "Không tìm thấy mặt hàng nào phù hợp"
                  : "Không có mặt hàng khả dụng nào để thêm vào phiếu này"}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40 text-xs">
                    <TableRow>
                      <TableHead className="w-10 pl-3">
                        <Checkbox
                          checked={
                            selectedItems.size === filteredItems.length &&
                            filteredItems.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12">Hình</TableHead>
                      <TableHead className="w-32">Mã hàng / Đơn</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead className="w-28">Mã bài</TableHead>
                      <TableHead className="w-28 text-right">Còn lại</TableHead>
                      <TableHead className="w-32 text-right">SL thêm</TableHead>
                      <TableHead className="w-40">Ghi chú dòng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const id = item.orderDetailId;
                      if (!id) return null;
                      const isSelected = selectedItems.has(id);
                      const currentForm = selectedItems.get(id);
                      const remaining = item.remainingToDeliver ?? item.orderedQty ?? 0;

                      return (
                        <TableRow
                          key={id}
                          className={`text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary/[0.04] dark:bg-primary/[0.02]"
                              : "hover:bg-muted/30"
                          }`}
                          onClick={() => handleToggleItem(item)}
                        >
                          <TableCell
                            className="pl-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleItem(item)}
                            />
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="h-9 w-9 rounded-md bg-muted/60 border overflow-hidden flex items-center justify-center">
                              {item.designThumbnailUrl || item.designImageUrl ? (
                                <img
                                  src={item.designThumbnailUrl || item.designImageUrl || ""}
                                  alt={item.designCode || ""}
                                  className="h-full w-full object-cover cursor-zoom-in"
                                  onClick={() =>
                                    setPreviewImage(
                                      item.designImageUrl || item.designThumbnailUrl || null
                                    )
                                  }
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                              {item.designCode || "—"}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {item.orderCode || "—"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium max-w-[220px] truncate" title={item.designName || ""}>
                              {item.designName || "—"}
                            </div>
                            {item.customerName && (
                              <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                                {item.customerName}
                              </div>
                            )}
                            {item.deliveryHistory && item.deliveryHistory.length > 0 && (
                              <div
                                className="mt-1 flex items-center gap-1 text-[10px] text-stone-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <History className="h-3 w-3 text-stone-400" />
                                <span>Đã có {item.deliveryHistory.length} phiếu giao</span>
                              </div>
                            )}
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {item.proofingOrderCodes && item.proofingOrderCodes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.proofingOrderCodes.map((c) => {
                                  const match = c.match(/\d+/);
                                  const pId = match ? parseInt(match[0], 10) : null;
                                  return (
                                    <Badge
                                      key={c}
                                      variant="outline"
                                      className="font-mono text-[10px] px-1.5 py-0 hover:bg-amber-100 hover:text-amber-900 cursor-pointer text-amber-700 border-amber-300 gap-0.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (pId) setViewingProofingOrderId(pId);
                                      }}
                                      title="Bấm để xem chi tiết bài bình"
                                    >
                                      {c}
                                      <ExternalLink className="h-2.5 w-2.5 opacity-70 inline" />
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right font-semibold text-stone-800 dark:text-stone-200">
                            {new Intl.NumberFormat("vi-VN").format(remaining)}
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <Input
                                type="number"
                                min={1}
                                max={remaining}
                                value={currentForm?.deliveryQty ?? remaining}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  handleUpdateQty(id, isNaN(val) ? 1 : val, remaining);
                                }}
                                className="h-8 text-xs font-bold text-right bg-background"
                              />
                            ) : (
                              <span className="text-muted-foreground text-right block text-xs">
                                —
                              </span>
                            )}
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <Input
                                type="text"
                                placeholder="Ghi chú..."
                                value={currentForm?.note ?? ""}
                                onChange={(e) => handleUpdateNote(id, e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 px-6 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Đã chọn:{" "}
              <strong className="text-primary font-bold">{selectedItems.size}</strong>{" "}
              mặt hàng (Tổng SL:{" "}
              <strong className="text-stone-900 dark:text-stone-100 font-bold">
                {new Intl.NumberFormat("vi-VN").format(totalSelectedQty)}
              </strong>
              )
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={addLinesMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handlePreSubmit}
                disabled={selectedItems.size === 0 || addLinesMutation.isPending}
                className="gap-1.5 font-semibold"
              >
                {addLinesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Thêm {selectedItems.size > 0 ? `(${selectedItems.size})` : ""} vào phiếu
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transit/Completion Confirmation Dialog */}
      <AlertDialog open={confirmTransitOpen} onOpenChange={setConfirmTransitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận thêm hàng vào phiếu giao hàng
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
              <p>
                Phiếu giao hàng{" "}
                <strong className="font-mono">#{deliveryNoteCode}</strong> đang ở trạng
                thái <strong>{isCompleted ? "Kết thúc (completed)" : "Đang giao (in_transit)"}</strong>.
              </p>
              {isCompleted ? (
                <p className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                  ⚠️ Hàng vừa thêm sẽ được xuất kho ngay theo phiếu và phiếu sẽ được mở lại sang trạng thái <strong>"Đang giao"</strong>.
                </p>
              ) : (
                <p className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                  ⚠️ Hàng vừa thêm sẽ được <strong>xuất kho ngay theo phiếu</strong> và cập nhật trạng thái đơn hàng tương ứng.
                </p>
              )}
              <p>Bạn có chắc chắn muốn thực hiện?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={addLinesMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSubmit}
              disabled={addLinesMutation.isPending}
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              {addLinesMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              )}
              Xác nhận thêm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl p-2 bg-black/90 border-0">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[80vh] w-full object-contain rounded"
            />
          </DialogContent>
        </Dialog>
      )}

      <ReadOnlyProofingDetailModal
        proofingOrderId={viewingProofingOrderId}
        open={!!viewingProofingOrderId}
        onOpenChange={(open) => !open && setViewingProofingOrderId(null)}
      />
    </>
  );
}
