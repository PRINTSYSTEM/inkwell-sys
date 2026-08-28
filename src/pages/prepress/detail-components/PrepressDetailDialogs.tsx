import { useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Trash2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Edit,
  Plus,
  Search,
  CheckCircle2,
  Package,
  Loader2,
  Eye,
  Check,
  Copy,
  Building2,
} from "lucide-react";
import { PlateExportDialog } from "@/components/proofing/PlateExportDialog";
import { DieExportDialog } from "@/components/proofing/DieExportDialog";
import { AddDesignToProofingDialog } from "@/components/proofing/AddDesignToProofingDialog";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { DieListDialog } from "@/components/dies/DieListDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  proofingStatusLabels,
  dieStatusLabels,
  dieLocationLabels,
} from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { formatDieSize } from "@/utils/format-die-size";
import { DieDialog } from "@/components/dies/DieDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRelatedDies } from "@/hooks/use-die";

interface PrepressDetailDialogsProps {
  order: any;
  // Upload files
  isUploadDialogOpen: boolean;
  setIsUploadDialogOpen: (val: boolean) => void;
  handleUploadFiles: (files: File[]) => void;
  uploadFiles: File[];
  setUploadFiles: (val: any) => void;
  // Upload image
  isImageUploadDialogOpen: boolean;
  setIsImageUploadDialogOpen: (val: boolean) => void;
  uploadImage: File | null;
  setUploadImage: (val: File | null) => void;
  handleUploadImage: () => void;
  isUploadingImage: boolean;
  // Image viewer
  viewingImageUrl: string | null;
  setViewingImageUrl: (val: string | null) => void;
  imageViewerOpen: boolean;
  setImageViewerOpen: (val: boolean) => void;
  // Plate export
  isPlateExportDialogOpen: boolean;
  setIsPlateExportDialogOpen: (val: boolean) => void;
  editingPlateExport: any;
  setEditingPlateExport: (val: any) => void;
  handlePlateExportSuccess: () => void;
  // Die export
  isDieExportDialogOpen: boolean;
  setIsDieExportDialogOpen: (val: boolean) => void;
  handleDieExportSuccess: () => void;
  // Status change
  isConfirmStatusChangeDialogOpen: boolean;
  setIsConfirmStatusChangeDialogOpen: (val: boolean) => void;
  nextStatusInfo: any;
  pendingStatus: string | null;
  setPendingStatus: (val: string | null) => void;
  handleConfirmStatusChange: () => void;
  // Hand to production
  isHandToProductionDialogOpen: boolean;
  setIsHandToProductionDialogOpen: (val: boolean) => void;
  isHandingToProduction: boolean;
  handleConfirmHandToProduction: () => void;
  hasDieCutDesigns: boolean;
  isDieExported: boolean;
  // Add design
  isAddDesignDialogOpen: boolean;
  setIsAddDesignDialogOpen: (val: boolean) => void;
  availableDesignsForAdding: any[];
  currentDesignForAdding: any;
  addDesignsMutate: any;
  isAddingDesigns: boolean;
  // Replace die
  isReplaceDieDialogOpen: boolean;
  setIsReplaceDieDialogOpen: (val: boolean) => void;
  replacingDieExport: any;
  setReplacingDieExport: (val: any) => void;
  // Add die
  isAddDieDialogOpen: boolean;
  setIsAddDieDialogOpen: (val: boolean) => void;
  isDieListDialogOpen: boolean;
  setIsDieListDialogOpen: (val: boolean) => void;
  dieListInitialSize?: string;
  // Die removal confirmation
  isRemoveDieConfirmOpen: boolean;
  setIsRemoveDieConfirmOpen: (val: boolean) => void;
  handleConfirmRemoveDie: () => void;
  isRemovingDie: boolean;
  // Die edit
  isEditDieDialogOpen: boolean;
  setIsEditDieDialogOpen: (val: boolean) => void;
  editingDie: any;
  setEditingDie: (val: any) => void;
  // Related dies
  isRelatedDiesDialogOpen: boolean;
  setIsRelatedDiesDialogOpen: (val: boolean) => void;
  selectedDesignForRelatedDies: any;
  setSelectedDesignForRelatedDies: (val: any) => void;
  // Remove design
  isConfirmRemoveDesignDialogOpen: boolean;
  setIsConfirmRemoveDesignDialogOpen: (val: boolean) => void;
  removeDesignTarget: any;
  handleConfirmRemoveDesign: () => void;
  isRemovingDesign: boolean;
  // Cancellation
  isConfirmCancelDialogOpen: boolean;
  setIsConfirmCancelDialogOpen: (val: boolean) => void;
  cancelReason: string;
  setCancelReason: (val: string) => void;
  handleConfirmCancel: () => void;
  isCanceling: boolean;
  // Reject (hoàn hàng)
  isRejectDialogOpen: boolean;
  setIsRejectDialogOpen: (val: boolean) => void;
  rejectTarget: any;
  rejectReason: string;
  setRejectReason: (val: string) => void;
  handleConfirmReject: () => void;
  isRejecting: boolean;
  // Delete proofing order
  isConfirmDeleteDialogOpen: boolean;
  setIsConfirmDeleteDialogOpen: (val: boolean) => void;
  handleConfirmDelete: () => void;
  isDeleting: boolean;
}

export function PrepressDetailDialogs(props: PrepressDetailDialogsProps) {
  const {
    order,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    handleUploadFiles,
    uploadFiles,
    setUploadFiles,
    isImageUploadDialogOpen,
    setIsImageUploadDialogOpen,
    uploadImage,
    setUploadImage,
    handleUploadImage,
    isUploadingImage,
    viewingImageUrl,
    setViewingImageUrl,
    imageViewerOpen,
    setImageViewerOpen,
    isPlateExportDialogOpen,
    setIsPlateExportDialogOpen,
    editingPlateExport,
    setEditingPlateExport,
    handlePlateExportSuccess,
    isDieExportDialogOpen,
    setIsDieExportDialogOpen,
    handleDieExportSuccess,
    isConfirmStatusChangeDialogOpen,
    setIsConfirmStatusChangeDialogOpen,
    nextStatusInfo,
    pendingStatus,
    setPendingStatus,
    handleConfirmStatusChange,
    isHandToProductionDialogOpen,
    setIsHandToProductionDialogOpen,
    isHandingToProduction,
    handleConfirmHandToProduction,
    hasDieCutDesigns,
    isDieExported,
    isAddDesignDialogOpen,
    setIsAddDesignDialogOpen,
    availableDesignsForAdding,
    currentDesignForAdding,
    addDesignsMutate,
    isAddingDesigns,
    isReplaceDieDialogOpen,
    setIsReplaceDieDialogOpen,
    replacingDieExport,
    setReplacingDieExport,
    isAddDieDialogOpen,
    setIsAddDieDialogOpen,
    isDieListDialogOpen,
    setIsDieListDialogOpen,
    dieListInitialSize,
    isRemoveDieConfirmOpen,
    setIsRemoveDieConfirmOpen,
    handleConfirmRemoveDie,
    isRemovingDie,
    isEditDieDialogOpen,
    setIsEditDieDialogOpen,
    editingDie,
    setEditingDie,
    isRelatedDiesDialogOpen,
    setIsRelatedDiesDialogOpen,
    selectedDesignForRelatedDies,
    setSelectedDesignForRelatedDies,
    isConfirmRemoveDesignDialogOpen,
    setIsConfirmRemoveDesignDialogOpen,
    removeDesignTarget,
    handleConfirmRemoveDesign,
    isRemovingDesign,
    isConfirmCancelDialogOpen,
    setIsConfirmCancelDialogOpen,
    cancelReason,
    setCancelReason,
    handleConfirmCancel,
    isCanceling,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    rejectTarget,
    rejectReason,
    setRejectReason,
    handleConfirmReject,
    isRejecting,
    isConfirmDeleteDialogOpen,
    setIsConfirmDeleteDialogOpen,
    handleConfirmDelete,
    isDeleting,
  } = props;

  const [dieExportInitialSelectedIds, setDieExportInitialSelectedIds] =
    useState<number[] | undefined>(undefined);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for file classification
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  if (!order) return null;

  return (
    <>
      {/* Upload Images Dialog (only images, multiple allowed, drag-and-drop supported) */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Tải lên ảnh bình bài</DialogTitle>
            <DialogDescription>
              Chọn hoặc kéo thả ảnh preview (JPG, PNG, WEBP...) cho bài bình này. Có thể chọn nhiều ảnh.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col space-y-4 py-3 overflow-hidden">
            <div className="space-y-1.5 shrink-0">
              <Label className="text-xs font-bold text-slate-800">Chọn hoặc kéo thả tệp ảnh</Label>
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center",
                  isDraggingUpload
                    ? "border-emerald-500 bg-emerald-50/70 shadow-inner scale-[1.01]"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-400"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUpload(false);
                  const files = Array.from(e.dataTransfer.files || []);
                  const images = files.filter((f) => isImageFile(f));
                  if (images.length > 0) {
                    setUploadFiles((prev: File[]) => [...prev, ...images]);
                  }
                }}
                onClick={() => uploadFileInputRef.current?.click()}
              >
                <input
                  ref={uploadFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const images = files.filter((f) => isImageFile(f));
                    setUploadFiles((prev: File[]) => [...prev, ...images]);
                    e.target.value = "";
                  }}
                />
                <div className="p-3 bg-white rounded-full shadow-2xs border border-slate-200 mb-2 text-emerald-600">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Kéo thả tệp ảnh vào đây hoặc <span className="text-emerald-700 underline font-semibold">bấm để chọn tệp</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hỗ trợ JPG, PNG, WEBP... (Có thể chọn hoặc kéo thả nhiều tệp cùng lúc)
                </p>
              </div>
            </div>

            {/* Hiển thị danh sách ảnh đã chọn */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <Label className="text-sm font-medium flex-shrink-0">
                  Ảnh đã chọn:
                </Label>
                <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-2">
                  {uploadFiles.map((file, index) => {
                    const isImage = isImageFile(file);

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 min-w-0"
                      >
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded border bg-background flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ảnh • {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            setUploadFiles((prev: File[]) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {!uploadFiles.find((f) => isImageFile(f)) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 flex-shrink-0 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Cần có ít nhất 1 ảnh để upload
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setUploadFiles([]);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => handleUploadFiles(uploadFiles)}
              disabled={!uploadFiles.find((f) => isImageFile(f))}
            >
              <Upload className="h-4 w-4 mr-2" />
              Tải ảnh lên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog
        open={isImageUploadDialogOpen}
        onOpenChange={setIsImageUploadDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload ảnh bình bài</DialogTitle>
            <DialogDescription>
              Tải lên ảnh preview của bản bình bài (JPG, PNG,...)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chọn ảnh</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadImage(e.target.files?.[0] || null)}
              />
              {uploadImage && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Đã chọn: {uploadImage.name} (
                    {(uploadImage.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <div className="aspect-video relative rounded-lg overflow-hidden border">
                    <img
                      src={URL.createObjectURL(uploadImage)}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageUploadDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUploadImage}
              disabled={!uploadImage || isUploadingImage}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploadingImage ? "Đang upload..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Design Dialog */}
      <Dialog
        open={isConfirmRemoveDesignDialogOpen}
        onOpenChange={setIsConfirmRemoveDesignDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Xác nhận xóa mã hàng
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ xóa mã hàng khỏi bài bình hiện tại. Bạn có chắc
              chắn muốn tiếp tục?
            </DialogDescription>
          </DialogHeader>

          {removeDesignTarget && (
            <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mã hàng:</span>
                <span className="text-sm font-bold">
                  {removeDesignTarget.designCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tên hàng:</span>
                <span className="text-sm font-medium">
                  {removeDesignTarget.designName}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmRemoveDesignDialogOpen(false)}
              disabled={isRemovingDesign}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemoveDesign}
              disabled={isRemovingDesign}
            >
              {isRemovingDesign ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) setViewingImageUrl(null);
          }}
        />
      )}

      {/* Plate Export Dialog */}
      <PlateExportDialog
        open={isPlateExportDialogOpen}
        onOpenChange={(open) => {
          setIsPlateExportDialogOpen(open);
          if (!open) setEditingPlateExport(null);
        }}
        proofingOrderId={order.id}
        plateExport={editingPlateExport}
        onSuccess={handlePlateExportSuccess}
      />

      {/* Die Export Dialog */}
      <DieExportDialog
        open={isDieExportDialogOpen}
        onOpenChange={(open) => {
          setIsDieExportDialogOpen(open);
          if (!open) setDieExportInitialSelectedIds(undefined);
        }}
        proofingOrderId={order.id}
        proofingOrder={order}
        onSuccess={handleDieExportSuccess}
        initialSelectedDieIds={dieExportInitialSelectedIds}
        initialSize={dieListInitialSize}
        initialCategory={
          order?.itemType?.toLowerCase().includes("decal") ||
          (order as any)?.designTypeName?.toLowerCase().includes("decal") ||
          (order as any)?.designType?.name?.toLowerCase().includes("decal") ||
          order?.proofingOrderDesigns?.[0]?.design?.designType?.name?.toLowerCase().includes("decal") ||
          order?.materialType?.name?.toLowerCase().includes("decal")
            ? "decal"
            : "box"
        }
      />

      {/* Die Dialog (for editing die info) */}
      <DieDialog
        open={isEditDieDialogOpen}
        onOpenChange={setIsEditDieDialogOpen}
        die={editingDie}
        onSuccess={() => {
          // Success is handled by the hook and invalidation
        }}
      />

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={isRemoveDieConfirmOpen}
        onOpenChange={setIsRemoveDieConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gỡ khuôn bế</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn gỡ khuôn bế này khỏi bình bài? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingDie}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRemoveDie();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemovingDie}
            >
              {isRemovingDie ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Xác nhận gỡ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isConfirmStatusChangeDialogOpen}
        onOpenChange={setIsConfirmStatusChangeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi trạng thái</AlertDialogTitle>
            <AlertDialogDescription>
              {nextStatusInfo?.confirmMessage ||
                "Bạn có chắc chắn muốn thay đổi trạng thái?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái hiện tại</Label>
              <StatusBadge
                status={order?.status || ""}
                label={
                  proofingStatusLabels[order?.status || ""] ||
                  order?.status ||
                  "—"
                }
              />
            </div>
            {pendingStatus && (
              <div className="space-y-2">
                <Label>Trạng thái mới</Label>
                <StatusBadge
                  status={pendingStatus}
                  label={proofingStatusLabels[pendingStatus] || pendingStatus}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsConfirmStatusChangeDialogOpen(false);
                setPendingStatus(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hand to Production Dialog */}
      <Dialog
        open={isHandToProductionDialogOpen}
        onOpenChange={setIsHandToProductionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành và chuyển xuống sản xuất</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đánh dấu mã bài là hoàn thành và chuyển
              xuống sản xuất?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái hiện tại</Label>
              <StatusBadge
                status={order?.status || ""}
                label={
                  proofingStatusLabels[order?.status || ""] ||
                  order?.status ||
                  "—"
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái mới</Label>
              <StatusBadge
                status="completed"
                label={proofingStatusLabels["completed"] || "Hoàn thành"}
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-semibold">
                Điều kiện chuyển xuống sản xuất:
              </Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {order?.isPlateExported ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {order?.isPlateExported ? "Đã xuất kẽm" : "Chưa xuất kẽm"}
                  </span>
                </div>
                {hasDieCutDesigns && (
                  <div className="flex items-center gap-2">
                    {isDieExported ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {isDieExported
                        ? "Đã xuất khuôn bế"
                        : "Chưa xuất khuôn bế"}
                    </span>
                  </div>
                )}
              </div>
              {(!order?.isPlateExported ||
                (hasDieCutDesigns && !isDieExported)) && (
                  <p className="text-xs text-destructive mt-2">
                    * Cần hoàn thành tất cả các điều kiện trên để chuyển xuống sản
                    xuất
                  </p>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsHandToProductionDialogOpen(false);
                setPendingStatus(null);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmHandToProduction}
              disabled={
                isHandingToProduction ||
                !order?.isPlateExported ||
                (hasDieCutDesigns && !isDieExported)
              }
            >
              {isHandingToProduction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận và chuyển xuống sản xuất"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Design Dialog */}
      <AddDesignToProofingDialog
        open={isAddDesignDialogOpen}
        onOpenChange={setIsAddDesignDialogOpen}
        availableDesigns={availableDesignsForAdding}
        materialTypeName={order.materialType?.name}
        currentDesign={currentDesignForAdding}
        onSubmit={async (orderDetailItems) => {
          if (!order?.materialTypeId) {
            toast.error("Lỗi", {
              description: "Không thể lấy thông tin Chất liệu",
            });
            return;
          }
          const items = orderDetailItems.map((item) => ({
            orderDetailId: item.orderDetailId,
            readyDesignId: item.readyDesignId,
            quantity: item.quantity,
            side: item.side || "both",
          }));
          if (items.length === 0) {
            toast.error("Lỗi", {
              description: "Không có chi tiết đơn hàng nào được chọn",
            });
            return;
          }
          await addDesignsMutate({
            id: order.id,
            request: { materialTypeId: order.materialTypeId, items: items },
          });
        }}
        isSubmitting={isAddingDesigns}
      />

      {/* Replace Die Dialog */}
      <DieExportDialog
        open={isReplaceDieDialogOpen}
        onOpenChange={(open) => {
          setIsReplaceDieDialogOpen(open);
          if (!open) setReplacingDieExport(null);
        }}
        proofingOrderId={order?.id}
        proofingOrder={order}
        mode="replace"
        replacingDieId={replacingDieExport?.dieId || replacingDieExport?.die?.id || replacingDieExport?.id}
        onSuccess={() => {
          setIsReplaceDieDialogOpen(false);
          setReplacingDieExport(null);
        }}
      />

      {/* Add Die Dialog */}
      <DieExportDialog
        open={isAddDieDialogOpen}
        onOpenChange={setIsAddDieDialogOpen}
        proofingOrderId={order?.id}
        proofingOrder={order}
        mode="add"
        onSuccess={() => {
          setIsAddDieDialogOpen(false);
        }}
      />

      <DieListDialog
        open={isDieListDialogOpen}
        onOpenChange={setIsDieListDialogOpen}
        initialSize={dieListInitialSize}
        initialDesignType={order?.items?.[0]?.designTypeName || (order as any)?.itemType || ""}
        onUseDie={(die) => {
          // Preselect the die in the export dialog and open it
          setDieExportInitialSelectedIds(die.id ? [die.id] : undefined);
          setIsDieListDialogOpen(false);
          setIsDieExportDialogOpen(true);
        }}
      />

      {/* Related Dies Dialog */}
      <Dialog
        open={isRelatedDiesDialogOpen}
        onOpenChange={(open) => {
          setIsRelatedDiesDialogOpen(open);
          if (!open) setSelectedDesignForRelatedDies(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              Khuôn liên quan
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedDesignForRelatedDies?.designCode && (
                <>
                  Khuôn phù hợp cho mã hàng:{" "}
                  <span className="font-semibold text-foreground">
                    {selectedDesignForRelatedDies.designCode}
                  </span>
                  {selectedDesignForRelatedDies.designName && (
                    <>
                      {" - "}
                      <span className="text-foreground">
                        {selectedDesignForRelatedDies.designName}
                      </span>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <RelatedDiesContent
            designId={selectedDesignForRelatedDies?.designId ?? null}
            designCode={selectedDesignForRelatedDies?.designCode}
            designName={selectedDesignForRelatedDies?.designName}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Cancel Proofing Order Dialog */}
      <Dialog
        open={isConfirmCancelDialogOpen}
        onOpenChange={setIsConfirmCancelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Xác nhận hủy bài bình
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy bài bình này không? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="cancel-reason"
                className="after:content-['*'] after:ml-0.5 after:text-destructive"
              >
                Lý do hủy bình bài
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Vui lòng nhập lý do hủy bình bài..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                * Lý do hủy là bắt buộc để tiếp tục.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmCancelDialogOpen(false)}
              disabled={isCanceling}
            >
              Bỏ qua
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim() || isCanceling}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận hủy"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Design (Hoàn hàng về phòng thiết kế) Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={(open) => {
          setIsRejectDialogOpen(open);
          if (!open) setRejectReason("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hoàn hàng về phòng thiết kế</AlertDialogTitle>
            <AlertDialogDescription>
              Xác nhận hoàn hàng để thiết kế được trả về phòng thiết kế xử lý
              lại.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {rejectTarget && (() => {
            const isDesignItem = !("design" in rejectTarget);
            const code = isDesignItem ? rejectTarget.code : rejectTarget.design?.code;
            const name = isDesignItem ? rejectTarget.name : rejectTarget.design?.designName;
            const orderCode = isDesignItem ? (rejectTarget.orderCode || rejectTarget.orderId) : rejectTarget.design?.latestOrderCode;

            return (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-sm font-semibold text-foreground">
                    {code}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {name}
                    {orderCode ? ` • ${orderCode}` : ""}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reject-reason-dialog">Lý do (bắt buộc)</Label>
                  <Textarea
                    id="reject-reason-dialog"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: sai thông tin, cần chỉnh file, thiếu chi tiết..."
                    className="min-h-[90px]"
                  />
                </div>
              </div>
            );
          })()}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
              }}
              disabled={isRejecting}
            >
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isRejecting || !rejectTarget}
            >
              {isRejecting ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Proofing Order Dialog */}
      <AlertDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Xác nhận xóa bình bài
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài bình rỗng này? Hành động này sẽ thực hiện xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsConfirmDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Component to display related dies
function RelatedDiesContent({
  designId,
  designCode,
  designName,
}: {
  designId: number | null;
  designCode?: string;
  designName?: string;
}) {
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [copiedDieId, setCopiedDieId] = useState<number | null>(null);

  const {
    data: relatedDies = [],
    isLoading,
    error,
  } = useRelatedDies(designId, !!designId);

  const handleCopyDieCode = async (dieCode: string, dieId: number) => {
    try {
      await navigator.clipboard.writeText(dieCode);
      setCopiedDieId(dieId);
      toast.success("Đã sao chép mã khuôn", {
        description: `Mã khuôn "${dieCode}" đã được sao chép vào clipboard`,
      });
      setTimeout(() => setCopiedDieId(null), 2000);
    } catch (error) {
      toast.error("Không thể sao chép mã khuôn", {
        description: "Đã xảy ra lỗi khi sao chép vào clipboard",
      });
    }
  };

  const renderDieItem = (die: any) => (
    <div
      key={die.id}
      className="group rounded-lg border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div
          className="relative w-20 h-20 rounded-lg border bg-muted overflow-hidden shrink-0 cursor-pointer group/image"
          onClick={() => {
            if (die.imageUrl) {
              setViewingImageUrl(die.imageUrl);
              setImageViewerOpen(true);
            }
          }}
        >
          {(() => {
            const thumbUrl = die.thumbnailUrl || die.imageUrl;
            return thumbUrl ? (
              <>
                <img
                  src={thumbUrl}
                  alt={die.code || `Die ${die.id}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            );
          })()}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-base text-foreground font-mono">
                {die.code || `Khuôn #${die.id}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyDieCode(die.code || `Khuôn #${die.id}`, die.id);
                }}
              >
                {copiedDieId === die.id ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-semibold",
                  die.isUsable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800",
                )}
              >
                {dieStatusLabels[die.status] ||
                  (die.isUsable ? "Sử dụng được" : "Không sử dụng được")}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
            {(die.length != null || die.height != null || die.size) && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Kích thước:</span>
                <span className="font-medium text-foreground">
                  {formatDieSize(die)}
                </span>
              </div>
            )}
            {die.vendorName && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">NCC:</span>
                <span className="font-medium text-foreground truncate">
                  {die.vendorName}
                </span>
              </div>
            )}
            {die.location && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Vị trí:</span>
                <span className="font-medium text-foreground">
                  {dieLocationLabels[die.location]}
                </span>
              </div>
            )}
          </div>
          {die.notes && (
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs text-muted-foreground line-clamp-2">
                <span className="font-medium">Ghi chú: </span>
                {die.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground">
              Đang tải khuôn liên quan...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-destructive">
            <Package className="h-8 w-8 mb-4 mx-auto" />
            <p className="text-sm font-semibold">Đã xảy ra lỗi</p>
          </div>
        ) : relatedDies.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground mb-4 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              Không tìm thấy khuôn liên quan
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {relatedDies.map((die: any) => renderDieItem(die))}
            </div>
          </ScrollArea>
        )}
      </div>

      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) setViewingImageUrl(null);
          }}
        />
      )}
    </>
  );
}
