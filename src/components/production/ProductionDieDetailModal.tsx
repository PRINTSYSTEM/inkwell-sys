import React from "react";
import { Layers, Loader2, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDiesByProofingOrder } from "@/hooks/use-die";
import { formatDieSize } from "@/utils/format-die-size";
import { formatImageUrl } from "@/lib/utils";
import type { ProductionOrderResponse } from "@/Schema";

export interface ProductionDieDetailModalProps {
  item?: ProductionOrderResponse | null;
  order?: ProductionOrderResponse | null;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ProductionDieDetailModal({
  item: propItem,
  order: propOrder,
  open: propOpen,
  isOpen: propIsOpen,
  onOpenChange,
  onClose,
}: ProductionDieDetailModalProps) {
  const item = propItem || propOrder || null;
  const open = propOpen ?? propIsOpen ?? false;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onClose) onClose();
  };

  if (!item) return null;

  const proofingOrderId = item.proofingOrderId || item.proofingOrder?.id || null;
  const { data: diesByOrder, isLoading } = useDiesByProofingOrder(proofingOrderId, open);

  const dieFromOrder = item.proofingOrderDies?.[0] || (item as any).dieExport;
  const fetchedDie = diesByOrder?.[0];

  const proofingCode = item.proofingOrderCode || `PO-${item.id}`;
  // Only use specific die images; do NOT fall back to unrelated proofing app screenshots
  const rawImage =
    fetchedDie?.imageUrl ||
    fetchedDie?.thumbnailUrl ||
    dieFromOrder?.imageUrl ||
    dieFromOrder?.thumbnailUrl ||
    null;
  const imageUrl = formatImageUrl(typeof rawImage === "string" ? rawImage : null);

  const dieCode = fetchedDie?.code || dieFromOrder?.code || dieFromOrder?.dieCode || proofingCode;

  // Format die size with fallback to order paper size / dimensions
  const formattedDieSize = fetchedDie ? formatDieSize(fetchedDie) : null;
  const dieSize =
    formattedDieSize && formattedDieSize !== "—"
      ? formattedDieSize
      : dieFromOrder?.size || item.paperSizeName || (item as any).paperSize || "Khổ bài tiêu chuẩn";

  const isNewDie = dieFromOrder?.isNewDie ?? (fetchedDie ? false : null);
  const dieTypeLabel =
    isNewDie === true
      ? "Tạo khuôn bế mới"
      : isNewDie === false
      ? "Sử dụng khuôn bế cũ"
      : "Sử dụng khuôn bế cũ";

  const isReceived = fetchedDie ? fetchedDie.isUsable !== false : dieFromOrder?.isReceived;
  const statusLabel =
    isReceived === true
      ? "Trong kho bế"
      : isReceived === false
      ? "Chờ nhận / Đang gia công"
      : "Trong kho bế";

  const storageLocation =
    (fetchedDie as any)?.locationName ||
    (fetchedDie as any)?.storageLocation ||
    dieFromOrder?.location ||
    "Khu vực kho bế A1";

  const layoutCount =
    (fetchedDie as any)?.layoutCount ||
    dieFromOrder?.layoutCount ||
    (item.items?.[0] as any)?.layoutCount ||
    "—";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-white border-slate-200 p-6 rounded-2xl shadow-2xl z-50">
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-[#93631F]/10 text-[#93631F] rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
            <span>Thông tin khuôn bế kỹ thuật</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-7 w-7 text-[#93631F] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Đang tải chi tiết khuôn bế...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Die Image or Technical Placeholder */}
            <div className="w-full h-48 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={dieCode}
                  className="max-h-full max-w-full object-contain p-2 hover:scale-105 transition-transform cursor-pointer"
                  title="Click để phóng to"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                  <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-1">
                    <Layers className="h-8 w-8 stroke-1" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700">Mã bài: {dieCode}</span>
                  <span className="text-[11px] text-slate-400">Chưa tải lên file bản vẽ khuôn bế</span>
                </div>
              )}
            </div>

            {/* Structured 2-Column Metadata Grid */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Mã khuôn */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    MÃ KHUÔN
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {dieCode}
                  </span>
                </div>

                {/* Tình trạng */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    TÌNH TRẠNG KHO
                  </span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[11px] px-2 py-0.5">
                    {statusLabel}
                  </Badge>
                </div>

                {/* Kích thước */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    KÍCH THƯỚC KHUÔN
                  </span>
                  <span className="text-xs font-extrabold text-[#93631F] font-mono">
                    {dieSize}
                  </span>
                </div>

                {/* Loại khuôn */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    LOẠI KHUÔN
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {dieTypeLabel}
                  </span>
                </div>

                {/* Vị trí kho */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    VỊ TRÍ LƯU KHO
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {storageLocation}
                  </span>
                </div>

                {/* Số con / Layout */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    SỐ CON / BÀI
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {layoutCount}
                  </span>
                </div>
              </div>

              {/* Ghi chú */}
              {(dieFromOrder?.notes || fetchedDie?.notes) && (
                <div className="pt-1 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    GHI CHÚ KỸ THUẬT:
                  </span>
                  <p className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-slate-200">
                    {dieFromOrder?.notes || fetchedDie?.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full font-bold text-xs cursor-pointer h-9"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
