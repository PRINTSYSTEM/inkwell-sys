"use client";

import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import {
  useProofingOrder,
  useUploadProofingFile,
  useUploadProofingImage,
  useUpdateProofingOrder,
  useUpdateProofingFile,
  useRecordPlateExport,
  useRecordDieExport,
  useHandToProduction,
} from "@/hooks/use-proofing-order";
import { safeParseSchema } from "@/Schema";
import { ProofingOrderResponseSchema } from "@/Schema/proofing-order.schema";
import { IdSchema } from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { designStatusLabels, proofingStatusLabels } from "@/lib/status-utils";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

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
  const [plateExportData, setPlateExportData] = useState({
    vendorName: "",
    sentAt: "",
    receivedAt: "",
    notes: "",
  });
  const [dieExportData, setDieExportData] = useState({
    notes: "",
  });

  const idValue = params.id ? Number(params.id) : Number.NaN;
  const idValid = IdSchema.safeParse(idValue).success;

  const {
    data: orderResp,
    isLoading,
    error,
  } = useProofingOrder(idValid ? idValue : null, idValid);
  const parsed = ProofingOrderResponseSchema.safeParse(orderResp);

  if (!parsed.success) {
    console.error(JSON.stringify(parsed.error.format(), null, 2));
  }
  const order = safeParseSchema(ProofingOrderResponseSchema, orderResp);
  const orderDesigns = order?.proofingOrderDesigns ?? [];

  const { mutate: updateProofing } = useUpdateProofingOrder();
  const { mutate: uploadProofing, loading: isUploadingFile } = useUploadProofingFile();
  const { mutate: updateFileMutate, loading: isUpdatingFile } = useUpdateProofingFile();
  const { mutate: uploadImageMutate, loading: isUploadingImage } = useUploadProofingImage();
  const { mutate: recordPlateMutate, isPending: isRecordingPlate } = useRecordPlateExport();
  const { mutate: recordDieMutate, isPending: isRecordingDie } = useRecordDieExport();
  const { mutate: handToProductionMutate, isPending: isHandingToProduction } = useHandToProduction();

  const handleUpdateStatus = async () => {
    if (!order?.id) return;

    // Kiểm tra lại xem đã có file bình bài chưa
    if (!order.proofingFileUrl) {
      toast({
        variant: "destructive",
        title: "Lỗi",
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
      toast({
        title: "Thành công",
        description: "Đã chuyển trạng thái sang chờ sản xuất",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
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

  const handleRecordPlate = async () => {
    if (!plateExportData.vendorName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đơn vị ghi kẽm",
        variant: "destructive",
      });
      return;
    }

    try {
      await recordPlateMutate({
        id: idValue,
        request: {
          vendorName: plateExportData.vendorName,
          sentAt: plateExportData.sentAt ? new Date(plateExportData.sentAt).toISOString() : undefined,
          receivedAt: plateExportData.receivedAt ? new Date(plateExportData.receivedAt).toISOString() : undefined,
          notes: plateExportData.notes,
        },
      });
      setIsPlateExportDialogOpen(false);
    } catch (error) {
      console.error("Failed to record plate export:", error);
    }
  };

  const handleRecordDie = async () => {
    try {
      await recordDieMutate({
        id: idValue,
        request: {
          notes: dieExportData.notes,
        },
      });
      setIsDieExportDialogOpen(false);
    } catch (error) {
      console.error("Failed to record die export:", error);
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
      toast({
        variant: "destructive",
        title: "Lỗi",
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
      toast({
        variant: "destructive",
        title: "Lỗi",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/proofing")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Chi tiết lệnh bình bài
            </h1>
            <p className="text-muted-foreground text-pretty">
              Mã lệnh: {order.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge
            status={order.status}
            label={proofingStatusLabels[order.status]}
          />
          {/* Chỉ hiển thị button khi status là waiting_for_file */}
          {order.status === "waiting_for_file" && (
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={handleStatusChangeClick}
              disabled={!order.proofingFileUrl}
              title={
                !order.proofingFileUrl
                  ? "Vui lòng upload file bình bài trước"
                  : "Chuyển sang chờ sản xuất"
              }
            >
              <Edit className="h-4 w-4" />
              Chuyển sang chờ sản xuất
            </Button>
          )}
          {!order.proofingFileUrl && (
            <Button
              className="gap-2"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload file bình bài
            </Button>
          )}
          {!order.imageUrl && (
            <Button
              className="gap-2 variant-outline"
              onClick={() => setIsImageUploadDialogOpen(true)}
            >
              <FileImage className="h-4 w-4" />
              Upload ảnh bình bài
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Thông tin lệnh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    Mã lệnh
                  </Label>
                  <p className="font-semibold text-lg">{order.code}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    Tổng số lượng
                  </Label>
                  <p className="font-semibold text-lg">
                    {order.totalQuantity.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    Loại chất liệu
                  </Label>
                  <div>
                    <p className="font-medium">{order.materialType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.materialType.code}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    Số design
                  </Label>
                  <p className="font-semibold text-lg">
                    {order.proofingOrderDesigns.length}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    Khổ giấy in
                  </Label>
                  <p className="font-semibold text-lg">
                    {order.paperSize?.name || order.customPaperSize || "Chưa xác định"}
                    {order.paperSize?.width && order.paperSize?.height && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({order.paperSize.width}x{order.paperSize.height})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Ghi chú</Label>
                <p className="text-sm">{order.notes || "Không có ghi chú"}</p>
              </div>

              {order.imageUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">
                      Ảnh bình bài (Preview)
                    </Label>
                    <div className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={order.imageUrl}
                        alt="Proofing Preview"
                        className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => {
                          setViewingImageUrl(order.imageUrl!);
                          setImageViewerOpen(true);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setViewingImageUrl(order.imageUrl!);
                            setImageViewerOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          Xem ảnh
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setIsImageUploadDialogOpen(true)}
                    >
                      Thay đổi ảnh
                    </Button>
                  </div>
                </>
              )}

              {order.proofingFileUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">
                      File bình bài
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        asChild
                      >
                        <a href={order.proofingFileUrl} download>
                          <Download className="h-4 w-4" />
                          Tải xuống
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Designs List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Danh sách Design ({orderDesigns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hình ảnh</TableHead>
                      <TableHead>Mã design</TableHead>
                      <TableHead>Tên design</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead className="text-right">File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDesigns.map((pod) => (
                      <TableRow key={pod.id}>
                        <TableCell>
                          {pod.design.designImageUrl ? (
                            <img
                              src={
                                pod.design.designImageUrl || "/placeholder.svg"
                              }
                              alt={pod.design.designName}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                              <FileImage className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {pod.design.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {pod.design.designName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pod.design.designType.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>
                              {pod.design.width} × {pod.design.height} cm
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pod.design.areaCm2} cm²
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{pod.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {pod.design.designImageUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewingImageUrl(pod.design.designImageUrl);
                                  setImageViewerOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {pod.design.designFileUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={pod.design.designFileUrl} download>
                                  <Download className="h-4 w-4" />
                                </a>
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

        {/* Right Column - Timeline & Info */}
        <div className="space-y-6">
          {/* Prepress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings2 className="h-4 w-4" />
                Thông tin Prepress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plate Export Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${order.isPlateExported ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium text-sm">Xuất bản kẽm</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setIsPlateExportDialogOpen(true)}
                  >
                    {order.isPlateExported ? "Cập nhật" : "Ghi nhận"}
                  </Button>
                </div>
                {order.plateExport ? (
                  <div className="bg-muted/30 rounded-md p-3 text-sm space-y-1">
                    <p><span className="text-muted-foreground mr-2">Đơn vị:</span> {order.plateExport.vendorName}</p>
                    <p><span className="text-muted-foreground mr-2">Gửi đi:</span> {order.plateExport.sentAt ? format(new Date(order.plateExport.sentAt), "dd/MM/yyyy HH:mm") : "-"}</p>
                    <p><span className="text-muted-foreground mr-2">Có kẽm:</span> {order.plateExport.receivedAt ? format(new Date(order.plateExport.receivedAt), "dd/MM/yyyy HH:mm") : "Đang chờ"}</p>
                    {order.plateExport.notes && <p className="text-xs italic text-muted-foreground mt-1 border-t pt-1">"{order.plateExport.notes}"</p>}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic pl-4">Chưa có thông tin xuất kẽm</p>
                )}
              </div>

              <Separator />

              {/* Die Export Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${order.isDieExported ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium text-sm">Xuất khuôn bế</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setIsDieExportDialogOpen(true)}
                  >
                    {order.isDieExported ? "Cập nhật" : "Ghi nhận"}
                  </Button>
                </div>
                {order.dieExport ? (
                  <div className="bg-muted/30 rounded-md p-3 text-sm space-y-2">
                    {order.dieExport.imageUrl && (
                      <div className="relative aspect-video rounded border overflow-hidden bg-black/5">
                        <img
                          src={order.dieExport.imageUrl}
                          alt="Khuôn bế"
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => {
                            setViewingImageUrl(order.dieExport!.imageUrl!);
                            setImageViewerOpen(true);
                          }}
                        />
                      </div>
                    )}
                    {order.dieExport.notes && <p className="text-xs italic text-muted-foreground">"{order.dieExport.notes}"</p>}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic pl-4">Chưa có thông tin khuôn bế</p>
                )}
              </div>

              {order.status === "waiting_for_production" && (
                <div className="pt-2">
                  <Button
                    className="w-full gap-2"
                    disabled={!order.isPlateExported || !order.approvedById || isHandingToProduction}
                    onClick={handleHandToProduction}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Bàn giao sản xuất
                  </Button>
                  {!order.isPlateExported && (
                    <p className="text-[10px] text-destructive mt-1 text-center">
                      * Cần ghi nhận xuất kẽm trước khi bàn giao
                    </p>
                  )}
                  {!order.approvedById && (
                    <p className="text-[10px] text-destructive mt-1 text-center">
                      * Cần được duyệt trước khi bàn giao
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* People Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Người liên quan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Người tạo
                </Label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{order.createdBy.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdBy.email}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Người xử lý
                </Label>
                {order.assignedTo ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{order.assignedTo.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.assignedTo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa phân công
                  </p>
                )}
              </div>

              {order.approvedBy && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">
                      Người duyệt
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">
                          {order.approvedBy.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.approvedAt!).toLocaleString("vi-VN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    {order.finalQuantity && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-800 font-medium">
                          Số lượng duyệt chốt: {order.finalQuantity.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Ngày tạo
                </Label>
                <p className="text-sm font-medium">
                  {new Date(order.createdAt).toLocaleString("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Cập nhật lần cuối
                </Label>
                <p className="text-sm font-medium">
                  {new Date(order.updatedAt).toLocaleString("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Material Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Thông tin chất liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Tên chất liệu
                </Label>
                <p className="font-medium">{order.materialType.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Mã chất liệu
                </Label>
                <p className="text-sm font-mono">{order.materialType.code}</p>
              </div>
              {order.materialType.description && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Mô tả</Label>
                  <p className="text-sm">{order.materialType.description}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Giá/cm²</Label>
                <p className="text-sm font-medium">
                  {order.materialType.pricePerCm2.toFixed(4)} đ
                </p>
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
      <Dialog open={isImageUploadDialogOpen} onOpenChange={setIsImageUploadDialogOpen}>
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
            <Button onClick={handleUploadImage} disabled={!uploadImage}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
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
      <Dialog open={isPlateExportDialogOpen} onOpenChange={setIsPlateExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận xuất bản kẽm</DialogTitle>
            <DialogDescription>
              Nhập thông tin đơn vị và thời gian gửi kẽm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Đơn vị ghi kẽm</Label>
              <Input
                id="vendorName"
                placeholder="Ví dụ: Thiên Nam, Ánh Sáng..."
                value={plateExportData.vendorName}
                onChange={(e) => setPlateExportData({ ...plateExportData, vendorName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sentAt">Thời gian gửi đi</Label>
                <Input
                  id="sentAt"
                  type="datetime-local"
                  value={plateExportData.sentAt}
                  onChange={(e) => setPlateExportData({ ...plateExportData, sentAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivedAt">Thời gian có kẽm (dự kiến)</Label>
                <Input
                  id="receivedAt"
                  type="datetime-local"
                  value={plateExportData.receivedAt}
                  onChange={(e) => setPlateExportData({ ...plateExportData, receivedAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plateNotes">Ghi chú</Label>
              <Input
                id="plateNotes"
                placeholder="Nhập ghi chú nếu có"
                value={plateExportData.notes}
                onChange={(e) => setPlateExportData({ ...plateExportData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlateExportDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRecordPlate} disabled={isRecordingPlate}>
              {isRecordingPlate ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Die Export Dialog */}
      <Dialog open={isDieExportDialogOpen} onOpenChange={setIsDieExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận khuôn bế</DialogTitle>
            <DialogDescription>
              Lưu thông tin về khuôn bế cho bình bài này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dieNotes">Ghi chú khuôn bế</Label>
              <Input
                id="dieNotes"
                placeholder="Nhập ghi chú, mã khuôn..."
                value={dieExportData.notes}
                onChange={(e) => setDieExportData({ ...dieExportData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDieExportDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRecordDie} disabled={isRecordingDie}>
              {isRecordingDie ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
