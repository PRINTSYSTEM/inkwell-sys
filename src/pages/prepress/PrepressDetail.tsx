import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Eye,
  User as UserIcon,
  Calendar,
  Package,
  Layers,
  FileImage,
  AlertCircle,
  Edit,
  Search,
  Settings2,
  Trash2,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import {
  useProofingOrder,
  useUploadProofingFile,
  useUploadProofingImage,
  useUpdateProofingOrder,
  useUpdateProofingFile,
  useUpdateProofingImage,
  useHandToProduction,
  usePaperSizes,
  useAddDesignsToProofingOrder,
  useRemoveDesignFromProofingOrder,
} from "@/hooks/use-proofing-order";
import { useAvailableOrderDetailsForProofing } from "@/hooks";
import { AddDesignToProofingDialog } from "@/components/proofing/AddDesignToProofingDialog";
import { PlateExportDialog } from "@/components/proofing/PlateExportDialog";
import { DieExportDialog } from "@/components/proofing/DieExportDialog";
import { IdSchema } from "@/Schema";
import type { PlateExportResponse, DieExportResponse } from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  designStatusLabels,
  proofingStatusLabels,
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { downloadFile } from "@/lib/download-utils";
import { Textarea } from "@/components/ui/textarea";
import type { UpdateProofingOrderRequest } from "@/Schema";

export default function ProofingOrderDetailPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUpdateFileDialogOpen, setIsUpdateFileDialogOpen] = useState(false);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);

  // Helper functions for file classification
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  const isProofingFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return (
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".ai") ||
      fileName.endsWith(".psd") ||
      file.type === "application/pdf" ||
      file.type === "application/postscript"
    );
  };
  const [isPlateExportDialogOpen, setIsPlateExportDialogOpen] = useState(false);
  const [isDieExportDialogOpen, setIsDieExportDialogOpen] = useState(false);
  const [isConfirmStatusDialogOpen, setIsConfirmStatusDialogOpen] =
    useState(false);
  const [isConfirmStatusChangeDialogOpen, setIsConfirmStatusChangeDialogOpen] =
    useState(false);
  const [isHandToProductionDialogOpen, setIsHandToProductionDialogOpen] =
    useState(false);
  const [isUpdateInfoDialogOpen, setIsUpdateInfoDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [isAddDesignDialogOpen, setIsAddDesignDialogOpen] = useState(false);

  // Form state for update info
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateNotes, setUpdateNotes] = useState<string>("");
  const [updatePaperSizeId, setUpdatePaperSizeId] = useState<string>("none");
  const [updateCustomPaperSize, setUpdateCustomPaperSize] =
    useState<string>("");
  const [updateProofingFileUrl, setUpdateProofingFileUrl] =
    useState<string>("");
  const [updateTotalQuantity, setUpdateTotalQuantity] = useState<string>("");
  const [updateDesignQuantities, setUpdateDesignQuantities] = useState<
    Record<number, string>
  >({});
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);
  const [updateProofingFile, setUpdateProofingFile] = useState<File | null>(
    null
  );

  const idValue = params.id ? Number(params.id) : Number.NaN;
  const idValid = IdSchema.safeParse(idValue).success;

  const {
    data: orderResp,
    isLoading,
    error,
  } = useProofingOrder(idValid ? idValue : null, idValid);

  // Use raw response directly instead of strict schema parsing
  // Schema validation is too strict for API responses with nullable fields
  // For display-only detail view, we can safely use raw data
  type ProofingOrderResponse =
    import("@/Schema/proofing-order.schema").ProofingOrderResponse;
  const order = orderResp as ProofingOrderResponse | null;
  const orderDesigns = order?.proofingOrderDesigns ?? [];

  const { mutate: updateProofing } = useUpdateProofingOrder();
  const { mutate: uploadProofing, loading: isUploadingFile } =
    useUploadProofingFile();
  const { mutate: updateFileMutate, loading: isUpdatingFile } =
    useUpdateProofingFile();
  const { mutate: uploadImageMutate, loading: isUploadingImage } =
    useUploadProofingImage();
  const { mutate: updateImageMutate, loading: isUpdatingImage } =
    useUpdateProofingImage();
  const { mutate: handToProductionMutate, isPending: isHandingToProduction } =
    useHandToProduction();
  const { mutate: updateProofingOrder, isPending: isUpdatingInfo } =
    useUpdateProofingOrder();
  const { data: paperSizesData } = usePaperSizes();
  const paperSizes = paperSizesData || [];
  const { mutate: addDesignsMutate, isPending: isAddingDesigns } =
    useAddDesignsToProofingOrder();
  const { mutate: removeDesignMutate, isPending: isRemovingDesign } =
    useRemoveDesignFromProofingOrder();

  // Get available designs for adding (same material type, exclude already added designs)
  const { data: availableDesignsData } = useAvailableOrderDetailsForProofing({
    materialTypeId: order?.materialTypeId ?? null,
  });

  const availableDesignsForAdding = useMemo(() => {
    if (!availableDesignsData?.designs || !order) return [];
    const existingDesignIds = new Set(
      order.proofingOrderDesigns
        ?.map((pod) => pod.design?.id)
        .filter(Boolean) ?? []
    );
    return availableDesignsData.designs.filter(
      (design) => !existingDesignIds.has(design.designId)
    );
  }, [availableDesignsData?.designs, order]);

  const handleUpdateStatus = async () => {
    if (!order?.id) return;

    // Kiểm tra lại xem đã có file bình bài chưa
    if (!order.proofingFileUrl) {
      toast.error("Lỗi", {
        description:
          "Vui lòng upload file bình bài trước khi chuyển trạng thái",
      });
      setIsConfirmStatusDialogOpen(false);
      return;
    }

    try {
      // Chỉ cho phép chuyển từ waiting_for_file sang waiting_for_production
      const targetStatus = "waiting_for_production";
      await updateProofing({ id: order.id, data: { status: targetStatus } });
      setIsConfirmStatusDialogOpen(false);
      toast.success("Thành công", {
        description: "Đã chuyển trạng thái sang chờ sản xuất",
      });
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleHandToProduction = async () => {
    if (!order?.id) return;
    handToProductionMutate(order.id);
  };

  const handleOpenUpdateInfoDialog = () => {
    if (!order) return;
    setUpdateStatus(order.status || "");
    setUpdateNotes(order.notes || "");
    setUpdatePaperSizeId(
      order.paperSizeId ? order.paperSizeId.toString() : "none"
    );
    setUpdateCustomPaperSize(order.customPaperSize || "");
    setUpdateProofingFileUrl(order.proofingFileUrl || "");
    setUpdateTotalQuantity(order.totalQuantity?.toString() || "");
    setUpdateImageFile(null); // Reset image file
    setUpdateProofingFile(null); // Reset proofing file

    // Initialize design quantities from current order designs
    const initialQuantities: Record<number, string> = {};
    order.proofingOrderDesigns?.forEach((pod) => {
      if (pod.id) {
        initialQuantities[pod.id] = pod.quantity?.toString() || "";
      }
    });
    setUpdateDesignQuantities(initialQuantities);

    setIsUpdateInfoDialogOpen(true);
  };

  const handleUpdateInfo = async () => {
    if (!order?.id) return;

    // If there's a proofing file, update it first
    if (updateProofingFile) {
      try {
        await updateFileMutate({
          proofingOrderId: order.id,
          file: updateProofingFile,
        });
        setUpdateProofingFile(null);
      } catch (error) {
        // Error is handled by the hook
        return; // Don't proceed with other updates if file update fails
      }
    }

    // If there's an image file, update it
    if (updateImageFile) {
      try {
        await updateImageMutate({
          proofingOrderId: order.id,
          file: updateImageFile,
        });
        setUpdateImageFile(null);
      } catch (error) {
        // Error is handled by the hook
        return; // Don't proceed with other updates if image update fails
      }
    }

    const updateData: UpdateProofingOrderRequest = {};

    // Status update is hidden from dialog, so skip it
    // if (updateStatus && updateStatus !== order.status) {
    //   updateData.status = updateStatus;
    // }
    if (updateNotes !== order.notes) {
      updateData.notes = updateNotes || null;
    }
    if (updatePaperSizeId === "custom") {
      updateData.paperSizeId = null;
      updateData.customPaperSize = updateCustomPaperSize || null;
    } else if (updatePaperSizeId !== "none") {
      const paperSizeIdNum = parseInt(updatePaperSizeId, 10);
      if (!isNaN(paperSizeIdNum)) {
        updateData.paperSizeId = paperSizeIdNum;
        updateData.customPaperSize = null;
      }
    } else {
      updateData.paperSizeId = null;
      updateData.customPaperSize = null;
    }
    // Don't update proofingFileUrl if a file is being uploaded (file upload will handle it)
    if (
      !updateProofingFile &&
      updateProofingFileUrl !== order.proofingFileUrl
    ) {
      updateData.proofingFileUrl = updateProofingFileUrl || null;
    }

    // Handle totalQuantity
    if (updateTotalQuantity) {
      const totalQtyNum = parseInt(updateTotalQuantity, 10);
      if (
        !isNaN(totalQtyNum) &&
        totalQtyNum >= 1 &&
        totalQtyNum !== order.totalQuantity
      ) {
        updateData.totalQuantity = totalQtyNum;
      }
    }

    // Handle designUpdates
    const designUpdates: Array<{
      proofingOrderDesignId: number;
      quantity: number;
    }> = [];
    Object.entries(updateDesignQuantities).forEach(([designIdStr, qtyStr]) => {
      const designId = parseInt(designIdStr, 10);
      const qty = parseInt(String(qtyStr), 10);
      if (!isNaN(designId) && !isNaN(qty) && qty >= 1) {
        const originalDesign = order.proofingOrderDesigns?.find(
          (pod) => pod.id === designId
        );
        if (originalDesign && originalDesign.quantity !== qty) {
          designUpdates.push({
            proofingOrderDesignId: designId,
            quantity: qty,
          });
        }
      }
    });
    if (designUpdates.length > 0) {
      updateData.designUpdates = designUpdates;
    }

    // Only call update API if there are changes (excluding image which was already uploaded)
    const hasChanges = Object.keys(updateData).length > 0;
    if (hasChanges) {
      try {
        await updateProofingOrder({
          id: order.id,
          data: updateData,
        });
      } catch (error) {
        // Error is handled by the hook
        return;
      }
    }

    setIsUpdateInfoDialogOpen(false);
    toast.success("Thành công", {
      description: "Đã cập nhật thông tin bình bài",
    });
  };

  const handleOldStatusChangeClick = () => {
    // Chỉ cho phép khi status là waiting_for_file (logic cũ)
    if (order?.status === "waiting_for_file") {
      setIsConfirmStatusDialogOpen(true);
    }
  };

  // Xác định trạng thái tiếp theo và label nút dựa trên trạng thái hiện tại
  const getNextStatusInfo = () => {
    if (!order?.status) return null;

    const currentStatus = order.status;

    // not_completed → completed
    if (currentStatus === "not_completed") {
      return {
        nextStatus: "completed",
        buttonLabel: "Hoàn thành",
        confirmMessage:
          "Bạn có chắc chắn muốn đánh dấu lệnh bình bài là hoàn thành?",
      };
    }

    // completed → paused
    if (currentStatus === "completed") {
      return {
        nextStatus: "paused",
        buttonLabel: "Tạm dừng",
        confirmMessage: "Bạn có chắc chắn muốn tạm dừng lệnh bình bài này?",
      };
    }

    // paused → completed
    if (currentStatus === "paused") {
      return {
        nextStatus: "completed",
        buttonLabel: "Tiếp tục",
        confirmMessage: "Bạn có chắc chắn muốn tiếp tục lệnh bình bài này?",
      };
    }

    return null;
  };

  const nextStatusInfo = getNextStatusInfo();

  const handleStatusChangeClick = () => {
    if (nextStatusInfo) {
      setPendingStatus(nextStatusInfo.nextStatus);
      setIsConfirmStatusChangeDialogOpen(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!order?.id || !pendingStatus) {
      setIsConfirmStatusChangeDialogOpen(false);
      setPendingStatus(null);
      return;
    }

    // Nếu chuyển sang "completed" từ "not_completed", hiện dialog hand to production
    if (pendingStatus === "completed" && order.status === "not_completed") {
      setIsConfirmStatusChangeDialogOpen(false);
      setIsHandToProductionDialogOpen(true);
      return;
    }

    try {
      await updateProofing({ id: order.id, data: { status: pendingStatus } });
      setIsConfirmStatusChangeDialogOpen(false);
      setPendingStatus(null);
      toast.success("Thành công", {
        description: `Đã cập nhật trạng thái sang ${proofingStatusLabels[pendingStatus] || pendingStatus}`,
      });
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleConfirmHandToProduction = async () => {
    if (!order?.id) {
      setIsHandToProductionDialogOpen(false);
      return;
    }

    // Kiểm tra điều kiện trước khi hand to production
    if (!order.isPlateExported || !order.isDieExported) {
      toast.error("Lỗi", {
        description:
          "Cần hoàn thành xuất kẽm và khuôn bế trước khi chuyển xuống sản xuất",
      });
      return;
    }

    try {
      // Cập nhật trạng thái sang completed trước
      await updateProofing({ id: order.id, data: { status: "completed" } });

      // Sau đó hand to production
      handToProductionMutate(order.id, {
        onSuccess: () => {
          setIsHandToProductionDialogOpen(false);
          setPendingStatus(null);
        },
      });
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleUpdateFile = async () => {
    if (!uploadFile) return;

    try {
      await updateFileMutate({
        proofingOrderId: idValue,
        file: uploadFile,
      });
      setIsUpdateFileDialogOpen(false);
      setUploadFile(null);
    } catch (error) {
      console.error("Failed to update proofing file:", error);
    }
  };

  const handlePlateExportSuccess = () => {
    // Dialog will handle refetch automatically via query invalidation
  };

  const handleDieExportSuccess = () => {
    // Dialog will handle refetch automatically via query invalidation
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!order?.id) return;

    // Phân loại files
    const proofingFiles = files.filter((f) => isProofingFile(f));
    const imageFiles = files.filter((f) => isImageFile(f));

    const errors: string[] = [];
    const successes: string[] = [];

    // Upload file bình bài
    if (proofingFiles.length > 0) {
      try {
        await uploadProofing({
          proofingOrderId: order.id,
          file: proofingFiles[0],
        });
        successes.push(`File bình bài: ${proofingFiles[0].name}`);
      } catch (error) {
        errors.push(`File bình bài "${proofingFiles[0].name}" lỗi`);
      }
    } else {
      errors.push("Thiếu file bình bài (.pdf, .ai, .psd)");
    }

    // Upload ảnh
    if (imageFiles.length > 0) {
      try {
        await uploadImageMutate({
          proofingOrderId: order.id,
          file: imageFiles[0],
        });
        successes.push(`Ảnh: ${imageFiles[0].name}`);
      } catch (error) {
        errors.push(`Ảnh "${imageFiles[0].name}" lỗi`);
      }
    } else {
      errors.push("Thiếu file ảnh");
    }

    setIsUploadDialogOpen(false);
    setUploadFiles([]);

    // Hiển thị thông báo kết quả
    if (errors.length === 0) {
      toast.success("Thành công", {
        description: "Đã upload tất cả files",
      });
    } else if (successes.length > 0) {
      toast.warning("Một phần thành công", {
        description: `${successes.join(", ")}. Lỗi: ${errors.join(", ")}`,
      });
    } else {
      toast.error("Lỗi", {
        description: errors.join(", "),
      });
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile || !order?.id) return;
    try {
      await uploadProofing({
        proofingOrderId: order.id,
        file: uploadFile,
      });
      setIsUploadDialogOpen(false);
      setUploadFile(null);
    } catch (error) {
      console.error("Failed to upload proofing file:", error);
      toast.error("Lỗi", {
        description: "Không thể upload file",
      });
    }
  };

  const handleUploadImage = async () => {
    if (!uploadImage || !order?.id) return;
    try {
      await uploadImageMutate({ proofingOrderId: order.id, file: uploadImage });
      setIsImageUploadDialogOpen(false);
      setUploadImage(null);
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể upload ảnh",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Không tìm thấy lệnh bình bài</p>
            <Button
              onClick={() => navigate("/proofing-orders")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/proofing")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{order.code}</h1>
            <p className="text-xs text-muted-foreground">
              Chi tiết lệnh bình bài
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={order.status}
            label={proofingStatusLabels[order.status]}
          />
          {nextStatusInfo && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={handleStatusChangeClick}
            >
              <Edit className="h-3.5 w-3.5" />
              {nextStatusInfo.buttonLabel}
            </Button>
          )}
          {order.status === "waiting_for_file" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={handleOldStatusChangeClick}
              disabled={!order.proofingFileUrl}
              title={
                !order.proofingFileUrl
                  ? "Vui lòng upload file bình bài trước"
                  : "Chuyển sang chờ sản xuất"
              }
            >
              <Edit className="h-3.5 w-3.5" />
              Chuyển trạng thái
            </Button>
          )}
          {!order.proofingFileUrl && !order.isPlateExported && (
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload file
            </Button>
          )}
          {!order.imageUrl && !order.isPlateExported && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => setIsImageUploadDialogOpen(true)}
            >
              <FileImage className="h-3.5 w-3.5" />
              Upload ảnh
            </Button>
          )}
          {order.isPlateExported && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
              <span>Đã xuất kẽm</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Compact Order Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Thông tin lệnh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-0.5">
                  <Label className="text-muted-foreground text-[10px] font-normal">
                    Mã lệnh
                  </Label>
                  <p className="font-semibold text-sm">{order.code}</p>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-muted-foreground text-[10px] font-normal">
                    Tổng số lượng
                  </Label>
                  <p className="font-semibold text-sm">
                    {order.totalQuantity.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-muted-foreground text-[10px] font-normal">
                    Số lượng hàng
                  </Label>
                  <p className="font-semibold text-sm">
                    {order.proofingOrderDesigns.length}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-muted-foreground text-[10px] font-normal">
                    Khổ giấy
                  </Label>
                  <p className="font-semibold text-sm text-xs">
                    {order.paperSize?.name ||
                      order.customPaperSize ||
                      "Chưa xác định"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-0.5">
                  <Label className="text-muted-foreground text-[10px] font-normal">
                    Chất liệu
                  </Label>
                  <div>
                    <p className="font-medium text-sm">
                      {order.materialType?.name || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {order.materialType?.code || "—"}
                    </p>
                  </div>
                </div>
                {order.imageUrl && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[10px] font-normal">
                      Preview ảnh
                    </Label>
                    <div
                      className="relative group h-20 rounded border overflow-hidden bg-muted cursor-pointer"
                      onClick={() => {
                        setViewingImageUrl(order.imageUrl!);
                        setImageViewerOpen(true);
                      }}
                    >
                      <img
                        src={order.imageUrl}
                        alt="Proofing Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    {!order.isPlateExported && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setIsImageUploadDialogOpen(true)}
                      >
                        Thay đổi
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                  <div className="flex items-start gap-1.5">
                    <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-0.5 text-[10px]">
                        Ghi chú
                      </p>
                      <p className="text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed text-xs">
                        {order.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {order.proofingFileUrl && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Label className="text-muted-foreground text-[10px] font-normal">
                    File:
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => {
                      if (order.proofingFileUrl) {
                        downloadFile(
                          order.proofingFileUrl,
                          order.code || `BB-${order.id}`
                        );
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Tải xuống
                  </Button>
                </div>
              )}

              {order.status !== "completed" && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs w-full"
                    onClick={handleOpenUpdateInfoDialog}
                  >
                    <Edit className="h-3 w-3" />
                    Cập nhật thông tin bình bài
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Designs List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Danh sách thiết kế ({orderDesigns.length})
                </CardTitle>
                {order && order.status !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => setIsAddDesignDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm thiết kế
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-9">
                      <TableHead className="h-9 px-2 text-[10px] w-12">
                        STT
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Ảnh
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Mã hàng
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Tên
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Kích thước
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">SL</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Mặt
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Quy trình
                      </TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">
                        Cán màn
                      </TableHead>
                      <TableHead className="h-9 px-2 text-right text-[10px]">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDesigns.map((pod, index) => {
                      // Build full info for tooltip
                      const fullInfo = (
                        <div className="space-y-2 text-sm max-w-md">
                          <div className="font-semibold text-base border-b pb-2">
                            {pod.design.designName}
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              <span className="text-muted-foreground">
                                Mã hàng:
                              </span>
                              <span className="ml-2 font-mono">
                                {pod.design.code}
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Loại:
                              </span>
                              <span className="ml-2">
                                {pod.design.designType?.name || "—"}
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Vật liệu:
                              </span>
                              <span className="ml-2">
                                {pod.design.materialType?.name || "—"}
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Kích thước:
                              </span>
                              <span className="ml-2">
                                {pod.design.length * 10}×{pod.design.width * 10}
                                {pod.design.height
                                  ? `×${pod.design.height * 10}`
                                  : ""}{" "}
                                mm
                              </span>
                            </div>

                            <div>
                              <span className="text-muted-foreground">SL:</span>
                              <span className="ml-2 font-semibold">
                                {pod.quantity.toLocaleString()}
                              </span>
                            </div>

                            {pod.design.areaM2 && (
                              <div>
                                <span className="text-muted-foreground">
                                  Diện tích:
                                </span>
                                <span className="ml-2">
                                  {(pod.design.areaM2 * 10000).toFixed(0)} cm²
                                </span>
                              </div>
                            )}
                          </div>

                          {(pod.design.processClassification ||
                            pod.design.sidesClassification ||
                            pod.design.laminationType) && (
                            <div className="pt-2 border-t space-y-1">
                              {pod.design.processClassification && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Cắt - Bế:
                                  </span>
                                  <span className="ml-2">
                                    {processClassificationLabels[
                                      pod.design.processClassification
                                    ] || pod.design.processClassification}
                                  </span>
                                </div>
                              )}
                              {pod.design.sidesClassification && (
                                <div>
                                  <span className="text-muted-foreground">
                                    1 - 2 mặt:
                                  </span>
                                  <span className="ml-2">
                                    {sidesClassificationLabels[
                                      pod.design.sidesClassification
                                    ] || pod.design.sidesClassification}
                                  </span>
                                </div>
                              )}
                              {pod.design.laminationType && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Cán màng:
                                  </span>
                                  <span className="ml-2">
                                    {laminationTypeLabels[
                                      pod.design.laminationType
                                    ] || pod.design.laminationType}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );

                      return (
                        <CursorTooltip
                          key={pod.id}
                          content={fullInfo}
                          delayDuration={300}
                          className="p-4 max-w-md"
                        >
                          <TableRow className="h-14">
                            <TableCell className="px-2 py-1">
                              <p className="text-xs text-muted-foreground">
                                {index + 1}
                              </p>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              {pod.design.designImageUrl ? (
                                <img
                                  src={
                                    pod.design.designImageUrl ||
                                    "/placeholder.svg"
                                  }
                                  alt={pod.design.designName}
                                  className="w-10 h-10 object-cover rounded border"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                                  <FileImage className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <p className="font-medium text-xs">
                                {pod.design.code}
                              </p>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <div>
                                <p className="font-medium text-xs line-clamp-1">
                                  {pod.design.designName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {pod.design.designType.name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <div className="text-xs">
                                <p>
                                  {pod.design.length * 10} ×{" "}
                                  {pod.design.width * 10}
                                  {`${pod.design.height ? ` × ${pod.design.height * 10}` : ""}`}{" "}
                                  mm
                                </p>
                                {pod.design.areaM2 && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {(pod.design.areaM2 * 10000).toFixed(0)} cm²
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <p className="text-xs">
                                {pod.quantity.toLocaleString()}
                              </p>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <span className="text-xs">
                                {pod.design.sidesClassification
                                  ? sidesClassificationLabels[
                                      pod.design.sidesClassification
                                    ] || pod.design.sidesClassification
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <span className="text-xs">
                                {pod.design.processClassification
                                  ? processClassificationLabels[
                                      pod.design.processClassification
                                    ] || pod.design.processClassification
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <span className="text-xs">
                                {pod.design.laminationType
                                  ? laminationTypeLabels[
                                      pod.design.laminationType
                                    ] || pod.design.laminationType
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 py-1 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {pod.design.designImageUrl && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingImageUrl(
                                        pod.design.designImageUrl
                                      );
                                      setImageViewerOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {pod.design.designFileUrl && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (pod.design.designFileUrl) {
                                        downloadFile(
                                          pod.design.designFileUrl,
                                          pod.design.code ||
                                            `DES-${pod.design.id}`
                                        );
                                      }
                                    }}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {order &&
                                  order.status !== "completed" &&
                                  pod.id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          confirm(
                                            "Bạn có chắc chắn muốn xóa design này khỏi bình bài?"
                                          )
                                        ) {
                                          removeDesignMutate({
                                            proofingOrderId: order.id,
                                            proofingOrderDesignId: pod.id!,
                                          });
                                        }
                                      }}
                                      disabled={isRemovingDesign}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CursorTooltip>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Compact Sidebar */}
        <div className="space-y-4">
          {/* Compact Prepress Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Prepress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Plate Export Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        order.isPlateExported ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                    <span className="font-medium text-xs">Xuất bản kẽm</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsPlateExportDialogOpen(true)}
                  >
                    {order.isPlateExported ? "Sửa" : "Ghi nhận"}
                  </Button>
                </div>
                {order.plateExport ? (
                  <div className="bg-muted/30 rounded p-2 text-xs space-y-0.5">
                    <p className="truncate">
                      <span className="text-muted-foreground">Đơn vị:</span>{" "}
                      {order.plateExport.vendorName || "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Có kẽm:</span>{" "}
                      {order.plateExport.receivedAt
                        ? format(
                            new Date(order.plateExport.receivedAt),
                            "dd/MM HH:mm"
                          )
                        : "Đang chờ"}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic pl-3.5">
                    Chưa có thông tin
                  </p>
                )}
              </div>

              <Separator className="my-2" />

              {/* Die Export Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        order.isDieExported ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                    <span className="font-medium text-xs">Xuất khuôn bế</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsDieExportDialogOpen(true)}
                  >
                    {order.isDieExported ? "Sửa" : "Ghi nhận"}
                  </Button>
                </div>
                {order.dieExport ? (
                  <div className="bg-muted/30 rounded p-2 text-xs space-y-1">
                    {/* Display multiple images if available */}
                    {order.dieExport.images &&
                    order.dieExport.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {order.dieExport.images.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative h-16 rounded border overflow-hidden bg-black/5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setViewingImageUrl(imageUrl);
                              setImageViewerOpen(true);
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={`Khuôn bế ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    ) : order.dieExport.imageUrl ? (
                      // Fallback for old single imageUrl
                      <div
                        className="relative h-16 rounded border overflow-hidden bg-black/5 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setViewingImageUrl(order.dieExport.imageUrl || null);
                          setImageViewerOpen(true);
                        }}
                      >
                        <img
                          src={order.dieExport.imageUrl}
                          alt="Khuôn bế"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : null}
                    {order.dieExport.notes && (
                      <p className="text-[10px] italic text-muted-foreground line-clamp-2 mt-1">
                        {order.dieExport.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic pl-3.5">
                    Chưa có thông tin
                  </p>
                )}
              </div>

              {order.status === "waiting_for_production" && (
                <div className="pt-2">
                  <Button
                    className="w-full gap-1.5 h-8 text-xs"
                    disabled={
                      !order.isPlateExported ||
                      !order.isDieExported ||
                      isHandingToProduction
                    }
                    onClick={handleHandToProduction}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Bàn giao sản xuất
                  </Button>
                  {(!order.isPlateExported || !order.isDieExported) && (
                    <p className="text-[10px] text-destructive mt-1 text-center">
                      * Cần hoàn thành xuất kẽm và khuôn bế
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact People & Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Thông tin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-[10px] font-normal">
                  Người tạo
                </Label>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-xs">
                      {order.createdBy?.fullName || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {order.createdBy?.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-[10px] font-normal">
                  Người thiết kế
                </Label>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <UserIcon className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-xs">
                      {orderDesigns[0]?.design?.designer?.fullName || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {orderDesigns[0]?.design?.designer?.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-[10px] font-normal">
                  Người duyệt công nợ
                </Label>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserIcon className="h-3.5 w-3.5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-xs">—</p>
                    <p className="text-[10px] text-muted-foreground">—</p>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-[10px] font-normal">
                  Thời gian
                </Label>
                <div className="text-xs space-y-0.5">
                  <p>
                    <span className="text-muted-foreground">Tạo:</span>{" "}
                    {new Date(order.createdAt).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Cập nhật:</span>{" "}
                    {new Date(order.updatedAt).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-[10px] font-normal">
                  Chất liệu
                </Label>
                <div className="text-xs space-y-0.5">
                  <p className="font-medium">
                    {order.materialType?.name || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {order.materialType?.code || "—"}
                  </p>
                  {order.materialType?.pricePerM2 && (
                    <p className="text-[10px]">
                      Giá: {(order.materialType.pricePerM2 / 10000).toFixed(4)}{" "}
                      đ/cm²
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Status Change Dialog */}
      <Dialog
        open={isConfirmStatusDialogOpen}
        onOpenChange={setIsConfirmStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>Bạn có chắc chắn muốn chuyển trạng thái không?</p>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Từ
                  </Label>
                  <StatusBadge
                    status={order?.status || ""}
                    label={
                      proofingStatusLabels[order?.status || ""] ||
                      order?.status ||
                      "—"
                    }
                  />
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Sang
                  </Label>
                  <StatusBadge
                    status="waiting_for_production"
                    label={
                      proofingStatusLabels["waiting_for_production"] ||
                      "Chờ sản xuất"
                    }
                  />
                </div>
              </div>
              {!order?.proofingFileUrl && (
                <p className="text-destructive text-sm font-medium mt-2">
                  ⚠️ Lưu ý: Bạn chưa upload file bình bài. Vui lòng upload file
                  trước khi chuyển trạng thái.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmStatusDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!order?.proofingFileUrl}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog - Combined */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            setUploadFiles([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Upload file bình bài và ảnh</DialogTitle>
            <DialogDescription>
              Chọn 1 file bình bài (.pdf, .ai, .psd) và 1 file ảnh cùng lúc
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1 min-h-0 flex flex-col">
            {/* Chọn nhiều file cùng lúc */}
            <div className="space-y-2 flex-shrink-0">
              <Label htmlFor="upload-files" className="text-sm font-medium">
                Chọn file bình bài và ảnh{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
                <Input
                  id="upload-files"
                  type="file"
                  accept=".pdf,.ai,.psd,image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);

                    // Phân loại files mới
                    const newProofingFiles = files.filter((f) =>
                      isProofingFile(f)
                    );
                    const newImageFiles = files.filter((f) => isImageFile(f));

                    // Kiểm tra số lượng
                    if (newProofingFiles.length > 1) {
                      toast.error("Lỗi", {
                        description: "Chỉ được chọn 1 file bình bài",
                      });
                      e.target.value = "";
                      return;
                    }

                    if (newImageFiles.length > 1) {
                      toast.error("Lỗi", {
                        description: "Chỉ được chọn 1 file ảnh",
                      });
                      e.target.value = "";
                      return;
                    }

                    // Kiểm tra tổng số file
                    if (files.length > 2) {
                      toast.error("Lỗi", {
                        description:
                          "Chỉ được chọn tối đa 1 file bình bài và 1 file ảnh",
                      });
                      e.target.value = "";
                      return;
                    }

                    // Kiểm tra nếu đã có file cùng loại thì thay thế
                    setUploadFiles((prev) => {
                      let updated = [...prev];

                      // Thay thế file proofing nếu có
                      if (newProofingFiles.length > 0) {
                        updated = updated.filter((f) => !isProofingFile(f));
                        updated.push(newProofingFiles[0]);
                      }

                      // Thay thế file ảnh nếu có
                      if (newImageFiles.length > 0) {
                        updated = updated.filter((f) => !isImageFile(f));
                        updated.push(newImageFiles[0]);
                      }

                      return updated;
                    });

                    // Reset input để có thể chọn lại cùng file
                    e.target.value = "";
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Chọn 1 file bình bài (.pdf, .ai, .psd) và 1 file ảnh (JPG,
                  PNG, ...)
                </p>
              </div>
            </div>

            {/* Hiển thị danh sách file đã chọn */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <Label className="text-sm font-medium flex-shrink-0">
                  Files đã chọn:
                </Label>
                <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-2">
                  {uploadFiles.map((file, index) => {
                    const isImage = isImageFile(file);
                    const isProofing = isProofingFile(file);
                    const fileType = isProofing
                      ? "File bình bài"
                      : isImage
                        ? "Ảnh"
                        : "File khác";

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
                            {fileType} • {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            setUploadFiles((prev) => {
                              const newFiles = prev.filter(
                                (_, i) => i !== index
                              );
                              // Cleanup object URL if it's an image
                              if (isImageFile(prev[index])) {
                                const url = URL.createObjectURL(prev[index]);
                                URL.revokeObjectURL(url);
                              }
                              return newFiles;
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {(!uploadFiles.find((f) => isProofingFile(f)) ||
                  !uploadFiles.find((f) => isImageFile(f))) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 flex-shrink-0 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Cần có ít nhất 1 file bình bài và 1 file ảnh
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
              disabled={
                !uploadFiles.find((f) => isProofingFile(f)) ||
                !uploadFiles.find((f) => isImageFile(f))
              }
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Image Dialog */}
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

      {/* Image Viewer Dialog */}
      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) {
              // Clear image URL when dialog closes
              setViewingImageUrl(null);
            }
          }}
        />
      )}
      {/* Plate Export Dialog */}
      {order && (
        <PlateExportDialog
          open={isPlateExportDialogOpen}
          onOpenChange={setIsPlateExportDialogOpen}
          proofingOrderId={order.id}
          onSuccess={handlePlateExportSuccess}
        />
      )}

      {/* Die Export Dialog */}
      {order && (
        <DieExportDialog
          open={isDieExportDialogOpen}
          onOpenChange={setIsDieExportDialogOpen}
          proofingOrderId={order.id}
          proofingOrder={order}
          onSuccess={handleDieExportSuccess}
        />
      )}

      {/* Confirm Status Change Dialog */}
      <Dialog
        open={isConfirmStatusChangeDialogOpen}
        onOpenChange={setIsConfirmStatusChangeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            <DialogDescription>
              {nextStatusInfo?.confirmMessage ||
                "Bạn có chắc chắn muốn thay đổi trạng thái?"}
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmStatusChangeDialogOpen(false);
                setPendingStatus(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleConfirmStatusChange}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hand to Production Dialog */}
      <Dialog
        open={isHandToProductionDialogOpen}
        onOpenChange={setIsHandToProductionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành và chuyển xuống sản xuất</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đánh dấu lệnh bình bài là hoàn thành và
              chuyển xuống sản xuất?
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

            {/* Kiểm tra điều kiện */}
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
                <div className="flex items-center gap-2">
                  {order?.isDieExported ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {order?.isDieExported
                      ? "Đã xuất khuôn bế"
                      : "Chưa xuất khuôn bế"}
                  </span>
                </div>
              </div>
              {(!order?.isPlateExported || !order?.isDieExported) && (
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
                !order?.isDieExported
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

      {/* Update Info Dialog */}
      <Dialog
        open={isUpdateInfoDialogOpen}
        onOpenChange={setIsUpdateInfoDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin bình bài</DialogTitle>
            <DialogDescription>
              Cập nhật các thông tin của lệnh bình bài
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="update-notes">Ghi chú</Label>
              <Textarea
                id="update-notes"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={4}
              />
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <Label htmlFor="update-paper-size">Khổ giấy</Label>
              <Select
                value={updatePaperSizeId}
                onValueChange={setUpdatePaperSizeId}
              >
                <SelectTrigger id="update-paper-size">
                  <SelectValue placeholder="Chọn khổ giấy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa xác định</SelectItem>
                  {paperSizes.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id.toString()}>
                      {ps.name}
                      {ps.width && ps.height
                        ? ` (${ps.width}×${ps.height})`
                        : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">-- Nhập thủ công --</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Paper Size */}
            {updatePaperSizeId === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="update-custom-paper-size">
                  Khổ giấy tùy chỉnh
                </Label>
                <Input
                  id="update-custom-paper-size"
                  value={updateCustomPaperSize}
                  onChange={(e) => setUpdateCustomPaperSize(e.target.value)}
                  placeholder="Ví dụ: 60x60"
                />
              </div>
            )}

            {/* Proofing File Upload */}
            <div className="space-y-2">
              <Label htmlFor="update-proofing-file">File bình bài</Label>
              <Input
                id="update-proofing-file"
                type="file"
                accept=".pdf,.ai,.psd,.jpg,.png"
                onChange={(e) =>
                  setUpdateProofingFile(e.target.files?.[0] || null)
                }
              />
              {updateProofingFile && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Đã chọn: {updateProofingFile.name} (
                    {(updateProofingFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
              {order.proofingFileUrl && !updateProofingFile && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    File hiện tại:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => {
                      if (order.proofingFileUrl) {
                        downloadFile(
                          order.proofingFileUrl,
                          order.code || `BB-${order.id}`
                        );
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Tải xuống file hiện tại
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Chọn file mới để thay thế file hiện tại
              </p>
            </div>

            {/* Proofing Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="update-image-file">Ảnh bình bài</Label>
              <Input
                id="update-image-file"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setUpdateImageFile(e.target.files?.[0] || null)
                }
              />
              {updateImageFile && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Đã chọn: {updateImageFile.name} (
                    {(updateImageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={URL.createObjectURL(updateImageFile)}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              {order.imageUrl && !updateImageFile && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Ảnh hiện tại:
                  </p>
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={order.imageUrl}
                      alt="Current preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Chọn ảnh mới để thay thế ảnh hiện tại
              </p>
            </div>

            <Separator />

            {/* Total Quantity */}
            <div className="space-y-2">
              <Label htmlFor="update-total-quantity">Tổng số lượng</Label>
              <Input
                id="update-total-quantity"
                type="number"
                min="1"
                value={updateTotalQuantity}
                onChange={(e) => setUpdateTotalQuantity(e.target.value)}
                placeholder="Nhập tổng số lượng..."
              />
            </div>

            {/* Design Updates */}
            {orderDesigns.length > 0 && (
              <div className="space-y-2">
                <Label>Cập nhật số lượng theo design</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {orderDesigns.map((pod) => {
                    const designId = pod.id;
                    if (!designId) return null;

                    return (
                      <div
                        key={designId}
                        className="flex items-center gap-3 p-2 rounded border bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {pod.design?.code || `Design #${designId}`}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {pod.design?.designName || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Hiện tại: {pod.quantity?.toLocaleString() || 0}
                          </div>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            value={updateDesignQuantities[designId] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setUpdateDesignQuantities((prev) => ({
                                ...prev,
                                [designId]: value,
                              }));
                            }}
                            placeholder="Số lượng"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Chỉ cập nhật các design có thay đổi số lượng
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateInfoDialogOpen(false)}
              disabled={
                isUpdatingInfo ||
                isUpdatingImage ||
                isUpdatingFile ||
                isUploadingImage ||
                isUploadingFile
              }
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateInfo}
              disabled={
                isUpdatingInfo ||
                isUpdatingImage ||
                isUpdatingFile ||
                isUploadingImage ||
                isUploadingFile
              }
            >
              {isUpdatingInfo ||
              isUpdatingImage ||
              isUpdatingFile ||
              isUploadingImage ||
              isUploadingFile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUpdatingFile
                    ? "Đang cập nhật file..."
                    : isUpdatingImage
                      ? "Đang cập nhật ảnh..."
                      : isUploadingFile
                        ? "Đang upload file..."
                        : isUploadingImage
                          ? "Đang upload ảnh..."
                          : "Đang cập nhật..."}
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Design Dialog */}
      {order && (
        <AddDesignToProofingDialog
          open={isAddDesignDialogOpen}
          onOpenChange={setIsAddDesignDialogOpen}
          availableDesigns={availableDesignsForAdding}
          materialTypeName={order.materialType?.name}
          onSubmit={async (orderDetailItems) => {
            await addDesignsMutate({
              id: order.id,
              orderDetailItems,
            });
          }}
          isSubmitting={isAddingDesigns}
        />
      )}
    </div>
  );
}
