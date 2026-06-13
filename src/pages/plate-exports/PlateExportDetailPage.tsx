import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  User,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  FileText,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { usePlateExport } from "@/hooks/use-plate-export";
import { useUpdatePlateExport } from "@/hooks/use-proofing-order";
import type { UpdatePlateExportRequest } from "@/Schema";
import { toast } from "sonner";

export default function PlateExportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch plate export from API
  const {
    data: plateExport,
    isLoading,
    isError,
    error,
    refetch,
  } = usePlateExport(Number(id || "0"), !!id);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState<{
    plateCount: string;
    estimatedReceiveAt: string;
    receivedAt: string;
  }>({
    plateCount: "",
    estimatedReceiveAt: "",
    receivedAt: "",
  });

  const { mutate: updatePlateExport, loading: isUpdating } =
    useUpdatePlateExport();

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi });
  };

  const formatDateTimeForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setEditValues({
      plateCount: plateExport?.plateCount?.toString() || "",
      estimatedReceiveAt: formatDateTimeForInput(plateExport?.estimatedReceiveAt),
      receivedAt: formatDateTimeForInput(plateExport?.receivedAt),
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!plateExport?.id) return;

    const payload: UpdatePlateExportRequest = {
      plateCount:
        editValues.plateCount === "" || editValues.plateCount === null
          ? null
          : Number(editValues.plateCount),
      estimatedReceiveAt:
        editValues.estimatedReceiveAt === "" ||
        editValues.estimatedReceiveAt === null
          ? null
          : new Date(editValues.estimatedReceiveAt).toISOString(),
      receivedAt:
        editValues.receivedAt === "" || editValues.receivedAt === null
          ? null
          : new Date(editValues.receivedAt).toISOString(),
    };

    try {
      await updatePlateExport(plateExport.id, payload);
      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !plateExport) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Không thể tải thông tin xuất kẽm
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error
                  ? error.message
                  : "Đã xảy ra lỗi khi tải dữ liệu"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleBack}>
                  Quay lại
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOutsource = plateExport.productionMethod === "outsource";
  const detailTitle = isOutsource ? "Chi tiết in gia công" : "Chi tiết xuất kẽm";
  const infoTitle = isOutsource ? "Thông tin in gia công" : "Thông tin xuất kẽm";

  return (
    <>
      <Helmet>
        <title>
          {detailTitle} {plateExport.proofingOrderCode || `#${plateExport.id}`}
        </title>
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold font-mono">
                      {plateExport.proofingOrderCode || `${isOutsource ? "In gia công" : "Xuất kẽm"} #${plateExport.id}`}
                    </h1>
                    <Badge
                      variant={plateExport.isActive ? "default" : "secondary"}
                    >
                      {plateExport.isActive ? "Đang hoạt động" : "Không hoạt động"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tạo lúc {formatDateTime(plateExport.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {infoTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Mã bài
                      </p>
                      <p className="font-medium">
                        {plateExport.proofingOrderCode || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Số lượng kẽm
                      </p>
                      <p className="font-medium text-lg">
                        {plateExport.plateCount ?? "—"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Ngày gửi</p>
                        <p className="font-medium">
                          {formatDateTime(plateExport.sentAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Ngày nhận dự kiến
                        </p>
                        <p className="font-medium">
                          {formatDateTime(plateExport.estimatedReceiveAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Ngày nhận thực tế
                        </p>
                        {plateExport.receivedAt ? (
                          <p className="font-medium text-emerald-600">
                            {formatDateTime(plateExport.receivedAt)}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">Chưa nhận</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {plateExport.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Ghi chú
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {plateExport.notes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Vendor Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Nhà cung cấp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tên nhà cung cấp</p>
                      <p className="font-medium">
                        {plateExport.vendorName ||
                          plateExport.plateVendor?.name ||
                          "—"}
                      </p>
                    </div>
                  </div>
                  {plateExport.plateVendor?.id && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">ID nhà cung cấp</p>
                        <p className="font-medium font-mono">
                          {plateExport.plateVendor.id}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Created By */}
              {plateExport.createdBy && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Người tạo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tên người dùng</p>
                        <p className="font-medium">
                          {plateExport.createdBy.fullName ||
                            plateExport.createdBy.username ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin xuất kẽm</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin xuất kẽm cho mã bài{" "}
              {plateExport.proofingOrderCode || `#${plateExport.id}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plateCount">Số lượng kẽm</Label>
              <Input
                id="plateCount"
                type="number"
                min="1"
                max="6"
                value={editValues.plateCount}
                onChange={(e) =>
                  setEditValues({ ...editValues, plateCount: e.target.value })
                }
                placeholder="Nhập số lượng kẽm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedReceiveAt">Ngày nhận dự kiến</Label>
              <Input
                id="estimatedReceiveAt"
                type="datetime-local"
                value={editValues.estimatedReceiveAt}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    estimatedReceiveAt: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedAt">Ngày nhận thực tế</Label>
              <Input
                id="receivedAt"
                type="datetime-local"
                value={editValues.receivedAt}
                onChange={(e) =>
                  setEditValues({ ...editValues, receivedAt: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
