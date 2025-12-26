"use client";

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
} from "lucide-react";
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
  useHandToProduction,
} from "@/hooks/use-proofing-order";
import { PlateExportDialog } from "@/components/proofing/PlateExportDialog";
import { DieExportDialog } from "@/components/proofing/DieExportDialog";
import { IdSchema } from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { designStatusLabels, proofingStatusLabels } from "@/lib/status-utils";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { downloadFile } from "@/lib/download-utils";

export default function ProofingOrderDetailPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUpdateFileDialogOpen, setIsUpdateFileDialogOpen] = useState(false);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [isPlateExportDialogOpen, setIsPlateExportDialogOpen] = useState(false);
  const [isDieExportDialogOpen, setIsDieExportDialogOpen] = useState(false);
  const [isConfirmStatusDialogOpen, setIsConfirmStatusDialogOpen] =
    useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

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
  type ProofingOrderResponse = import("@/Schema/proofing-order.schema").ProofingOrderResponse;
  const order = orderResp as ProofingOrderResponse | null;
  const orderDesigns = order?.proofingOrderDesigns ?? [];

  const { mutate: updateProofing } = useUpdateProofingOrder();
  const { mutate: uploadProofing, loading: isUploadingFile } =
    useUploadProofingFile();
  const { mutate: updateFileMutate, loading: isUpdatingFile } =
    useUpdateProofingFile();
  const { mutate: uploadImageMutate, loading: isUploadingImage } =
    useUploadProofingImage();
  const { mutate: handToProductionMutate, isPending: isHandingToProduction } =
    useHandToProduction();

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

  const handleStatusChangeClick = () => {
    // Chỉ cho phép khi status là waiting_for_file
    if (order?.status === "waiting_for_file") {
      setIsConfirmStatusDialogOpen(true);
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
            <h1 className="text-xl font-semibold">
              {order.code}
            </h1>
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
          {order.status === "waiting_for_file" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={handleStatusChangeClick}
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
                    Số design
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
                    <p className="font-medium text-sm">{order.materialType?.name || "—"}</p>
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
                    <div className="relative group h-20 rounded border overflow-hidden bg-muted cursor-pointer"
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
                        downloadFile(order.proofingFileUrl, order.code || `BB-${order.id}`);
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Tải xuống
                  </Button>
                  {!order.isPlateExported && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => setIsUpdateFileDialogOpen(true)}
                    >
                      <Edit className="h-3 w-3" />
                      Cập nhật
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Designs List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Danh sách Design ({orderDesigns.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-9">
                      <TableHead className="h-9 px-2 text-[10px]">Ảnh</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Mã</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Tên</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Kích thước</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">SL</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Mặt</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Quy trình</TableHead>
                      <TableHead className="h-9 px-2 text-[10px]">Cán màn</TableHead>
                      <TableHead className="h-9 px-2 text-right text-[10px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDesigns.map((pod) => (
                      <TableRow key={pod.id} className="h-14">
                        <TableCell className="px-2 py-1">
                          {pod.design.designImageUrl ? (
                            <img
                              src={pod.design.designImageUrl || "/placeholder.svg"}
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
                          <p className="font-medium text-xs">{pod.design.code}</p>
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
                            <p>{pod.design.width} × {pod.design.height} cm</p>
                            <p className="text-[10px] text-muted-foreground">
                              {pod.design.areaCm2} cm²
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <p className="text-xs">{pod.quantity.toLocaleString()}</p>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <span className="text-xs">
                            {pod.design.sidesClassificationOption?.value || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <span className="text-xs">
                            {pod.design.processClassificationOption?.value || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <span className="text-xs">
                            {pod.laminationType
                              ? pod.laminationType === "bóng"
                                ? "Bóng"
                                : pod.laminationType === "mờ"
                                ? "Mờ"
                                : pod.laminationType
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
                                onClick={() => {
                                  setViewingImageUrl(pod.design.designImageUrl);
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
                                onClick={() => {
                                  if (pod.design.designFileUrl) {
                                    downloadFile(
                                      pod.design.designFileUrl,
                                      pod.design.code || `DES-${pod.design.id}`
                                    );
                                  }
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      {order.plateExport?.vendorName || "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Có kẽm:</span>{" "}
                      {order.plateExport?.receivedAt
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
                    {order.dieExport?.imageUrl && (
                      <div className="relative h-16 rounded border overflow-hidden bg-black/5 cursor-pointer"
                        onClick={() => {
                          setViewingImageUrl(order.dieExport?.imageUrl || null);
                          setImageViewerOpen(true);
                        }}
                      >
                        <img
                          src={order.dieExport.imageUrl}
                          alt="Khuôn bế"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {order.dieExport?.notes && (
                      <p className="text-[10px] italic text-muted-foreground line-clamp-2">
                        "{order.dieExport.notes}"
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
                      !order.approvedById ||
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
                  {!order.approvedById && (
                    <p className="text-[10px] text-destructive mt-1 text-center">
                      * Cần được duyệt
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
                    <p className="font-medium text-xs">{order.createdBy?.fullName || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {order.createdBy?.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-[10px] font-normal">
                  Người xử lý
                </Label>
                {order.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">{order.assignedTo.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {order.assignedTo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chưa phân công</p>
                )}
              </div>

              {order.approvedBy && (
                <>
                  <Separator className="my-2" />
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-[10px] font-normal">
                      Người duyệt
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                        <UserIcon className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-xs text-green-700">
                          {order.approvedBy?.fullName || "—"}
                        </p>
                        {order.approvedAt && (
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.approvedAt).toLocaleString("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    {order.finalQuantity && (
                      <div className="mt-1.5 p-1.5 bg-green-50 rounded border border-green-200">
                        <p className="text-[10px] text-green-800 font-medium">
                          SL duyệt: {order.finalQuantity.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

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
                  <p className="font-medium">{order.materialType?.name || "—"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {order.materialType?.code || "—"}
                  </p>
                  {order.materialType?.pricePerCm2 && (
                    <p className="text-[10px]">
                      Giá: {order.materialType.pricePerCm2.toFixed(4)} đ/cm²
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
            <DialogDescription className="space-y-2">
              <p>
                Bạn có chắc chắn muốn chuyển trạng thái từ{" "}
                <strong>
                  {proofingStatusLabels[order?.status || ""] || order?.status}
                </strong>{" "}
                sang{" "}
                <strong>
                  {proofingStatusLabels["waiting_for_production"] ||
                    "Chờ sản xuất"}
                </strong>{" "}
                không?
              </p>
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

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload file bình bài</DialogTitle>
            <DialogDescription>
              Tải lên file bình bài đã xử lý
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chọn file</Label>
              <Input
                type="file"
                accept=".pdf,.ai,.psd,.jpg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Đã chọn: {uploadFile.name} (
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleUploadFile} disabled={!uploadFile}>
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
    </div>
  );
}
