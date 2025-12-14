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
  UserIcon,
  Calendar,
  Package,
  Layers,
  FileImage,
  AlertCircle,
  Edit,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import {
  useProofingOrder,
  useUploadProofingFile,
  useUpdateProofingOrder,
} from "@/hooks/use-proofing-order";
import { safeParseSchema } from "@/Schema";
import { ProofingOrderResponseSchema } from "@/Schema/proofing-order.schema";
import { IdSchema } from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { designStatusLabels, proofingStatusLabels } from "@/lib/status-utils";

export default function ProofingOrderDetailPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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

  useEffect(() => {
    if (order?.status) setNewStatus(order.status);
  }, [order?.status]);

  const { mutate: updateProofing } = useUpdateProofingOrder();
  const { mutate: uploadProofing } = useUploadProofingFile();

  const handleUpdateStatus = async () => {
    if (!order?.id) return;
    try {
      await updateProofing({ id: order.id, data: { status: newStatus } });
      setIsUpdateStatusOpen(false);
    } catch (error) {
      toast({
        variant: "warning",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile || !order?.id) return;
    try {
      await uploadProofing({ proofingOrderId: order.id, file: uploadFile });
      setIsUploadDialogOpen(false);
      setUploadFile(null);
    } catch (error) {
      toast({
        variant: "warning",
        title: "Lỗi",
        description: "Không thể upload file",
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
            onClick={() => navigate("/proofing-orders")}
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
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setIsUpdateStatusOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Cập nhật trạng thái
          </Button>
          {!order.proofingFileUrl && (
            <Button
              className="gap-2"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload file bình bài
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
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Ghi chú</Label>
                <p className="text-sm">{order.notes || "Không có ghi chú"}</p>
              </div>

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
                        <a
                          href={order.proofingFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                          Xem file
                        </a>
                      </Button>
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
                      <TableHead>Trạng thái</TableHead>
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
                        <TableCell>
                          <StatusBadge
                            status={pod.design.designStatus as string}
                            label={
                              designStatusLabels[
                                pod.design.designStatus as string
                              ]
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {pod.design.designImageUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={pod.design.designImageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
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

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Thay đổi trạng thái xử lý của lệnh bình bài
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(proofingStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateStatus}>Cập nhật</Button>
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
    </div>
  );
}
