import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { DetailOrderInfoCard } from "@/pages/prepress/detail-components/DetailOrderInfoCard";
import { DetailDesignsListCard } from "@/pages/prepress/detail-components/DetailDesignsListCard";
import { DetailPlateExportCard } from "@/pages/prepress/detail-components/DetailPlateExportCard";
import { DetailDieExportCard } from "@/pages/prepress/detail-components/DetailDieExportCard";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

interface ReadOnlyProofingDetailModalProps {
  proofingOrderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReadOnlyProofingDetailModal({
  proofingOrderId,
  open,
  onOpenChange,
}: ReadOnlyProofingDetailModalProps) {
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const { data: order, isLoading } = useProofingOrder(
    proofingOrderId && proofingOrderId > 0 ? proofingOrderId : null,
    Boolean(open && proofingOrderId && proofingOrderId > 0)
  );

  const orderDesigns = order?.proofingOrderDesigns || [];

  const hasDieCutDesigns =
    orderDesigns.some(
      (pod: any) =>
        pod.design?.designType?.code === "H" ||
        pod.design?.designType?.code === "D" ||
        pod.design?.processClassification === "die_cut"
    ) ||
    (order?.proofingOrderDies && order.proofingOrderDies.length > 0);

  const isDieExported = order?.proofingOrderDies?.some(
    (d: any) => d.isExported
  );

  const completedAtFormatted = order?.completedAt
    ? format(new Date(order.completedAt), "dd/MM/yyyy HH:mm", { locale: vi })
    : "—";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1500px] max-h-[92vh] flex flex-col p-4 font-sans bg-slate-50 text-xs">
          {/* Header Bar */}
          <DialogHeader className="p-0 pb-3 border-b border-slate-200 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 px-2 text-slate-600 hover:bg-slate-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-slate-900">
                  {order?.code || proofingOrderId}
                </span>
                <span className="text-xs text-slate-400 font-medium">CHI TIẾT MÃ BÀI</span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[11px] ml-2">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                  {order?.status === "completed" ? "Hoàn thành" : order?.status || "Hoàn thành"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              {order?.completedAt && (
                <div>
                  Thời gian hoàn thành: <strong className="text-slate-800 font-mono">{completedAtFormatted}</strong>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Modal Body */}
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 text-[#93631F] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Đang tải thông tin chi tiết bài bình...</p>
            </div>
          ) : !order ? (
            <div className="py-16 text-center text-slate-500">
              Không tìm thấy thông tin chi tiết bài bình #{proofingOrderId}.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pt-3 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[0.8fr_2.4fr_1fr] gap-3.5 w-full items-start">
                {/* 1. Thông tin bình bài (Left Column) */}
                <DetailOrderInfoCard
                  order={order}
                  editingField={null}
                  inlineTotalQuantity=""
                  setInlineTotalQuantity={() => {}}
                  inlinePaperSizeId=""
                  setInlinePaperSizeId={() => {}}
                  inlineCustomPaperSize=""
                  setInlineCustomPaperSize={() => {}}
                  inlineNotes=""
                  setInlineNotes={() => {}}
                  paperSizes={[]}
                  uniqueProcessClassifications={[]}
                  uniqueLaminationTypes={[]}
                  uniqueSpecifications={[]}
                  isUpdatingInfo={false}
                  handleStartEditField={() => {}}
                  handleStartEditAllFields={() => {}}
                  handleCancelEditField={() => {}}
                  handleSaveField={() => {}}
                  setIsUploadDialogOpen={() => {}}
                  setImageViewerOpen={() => {}}
                  setViewingImageUrl={setViewingImageUrl}
                  isProofer={false}
                />

                {/* 2. Danh sách mã hàng (Middle Wide Column) */}
                <DetailDesignsListCard
                  order={order}
                  orderDesigns={orderDesigns}
                  editingQuantityDesignId={null}
                  setEditingQuantityDesignId={() => {}}
                  inlineQuantityValue=""
                  setInlineQuantityValue={() => {}}
                  handleUpdateDesignQuantity={() => {}}
                  updatingDesignId={null}
                  setIsAddDesignDialogOpen={() => {}}
                  setSelectedDesignForRelatedDies={() => {}}
                  setIsRelatedDiesDialogOpen={() => {}}
                  setViewingImageUrl={setViewingImageUrl}
                  setImageViewerOpen={() => {}}
                  setRemoveDesignTarget={() => {}}
                  setIsConfirmRemoveDesignDialogOpen={() => {}}
                  isRemovingDesign={false}
                  isProofer={false}
                />

                {/* 3. Right Stacked Column (Top: Kẽm, Bottom: Khuôn bế) */}
                <div className="space-y-3.5 flex flex-col">
                  {/* Xuất bản kẽm (Top) */}
                  <DetailPlateExportCard
                    order={order}
                    setIsPlateExportDialogOpen={() => {}}
                    setEditingPlateExport={() => {}}
                    handleHandToProduction={() => {}}
                    isHandingToProduction={false}
                    isProofer={false}
                  />

                  {/* Khuôn bế (Bottom) */}
                  {hasDieCutDesigns && (
                    <DetailDieExportCard
                      order={order}
                      hasDieCutDesigns={hasDieCutDesigns}
                      isDieExported={isDieExported}
                      setIsDieExportDialogOpen={() => {}}
                      handleOpenReplaceDieDialog={() => {}}
                      handleRemoveDie={() => {}}
                      isRemovingDie={false}
                      onEditDie={() => {}}
                      setIsDieListDialogOpen={() => {}}
                      setImageViewerOpen={() => {}}
                      setViewingImageUrl={setViewingImageUrl}
                      isProofer={false}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog for Zooming Thumbnails inside Modal */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />
    </>
  );
}
