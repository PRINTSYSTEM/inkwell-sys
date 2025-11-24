import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Ruler,
  FileText,
  Download,
  DollarSign,
  ImageIcon,
  Clock,
  User,
  Layers,
  Box,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDesign } from "@/hooks";

export default function DesignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: design, isLoading: loading } = useDesign(Number(id));

  const getStatusBadge = (status: string, statusType: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      received_info: { label: "Đã nhận thông tin", variant: "default" },
      designing: { label: "Đang thiết kế", variant: "secondary" },
      completed: { label: "Hoàn thành", variant: "outline" },
    };
    const config = statusMap[status] || {
      label: statusType || status,
      variant: "default",
    };
    return (
      <Badge variant={config.variant} className="font-medium px-3 py-1 text-sm">
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto" />
            <Package className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            Đang tải dữ liệu thiết kế...
          </p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Không tìm thấy thiết kế</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Thiết kế bạn tìm kiếm không tồn tại hoặc đã bị xóa
              </p>
            </div>
            <Button onClick={() => navigate("design/all")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("design/all")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                  {design.code}
                </h1>
                {getStatusBadge(design.designStatus, design.statusType)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Đơn hàng #{design.orderId}
                </span>
                <span className="mx-2">•</span>
                <span>Thiết kế ID: {design.id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 p-5 rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-blue-500/10 rounded">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Thiết kế viên
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Họ tên
                    </p>
                    <p className="font-semibold text-foreground">
                      {design.designer.fullName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Username
                    </p>
                    <p className="font-medium text-foreground">
                      {design.designer.username}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Email
                    </p>
                    <p className="font-medium text-foreground truncate">
                      {design.designer.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Điện thoại
                    </p>
                    <p className="font-medium text-foreground">
                      {design.designer.phone}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 p-5 rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-purple-500/10 rounded">
                    <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Loại thiết kế
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Tên loại
                    </p>
                    <p className="font-semibold text-foreground">
                      {design.designType.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Mã loại
                    </p>
                    <p className="font-medium text-foreground">
                      {design.designType.code}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Mô tả
                    </p>
                    <p className="font-medium text-foreground">
                      {design.designType.description || "Không có"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Trạng thái
                    </p>
                    <Badge variant="outline" className="w-fit">
                      {design.designType.statusType}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 p-5 rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-amber-500/10 rounded">
                    <Box className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Chất liệu
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Tên chất liệu
                    </p>
                    <p className="font-semibold text-foreground">
                      {design.materialType.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Mã chất liệu
                    </p>
                    <p className="font-medium text-foreground">
                      {design.materialType.code}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Giá chất liệu
                    </p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {design.materialType.price.toLocaleString("vi-VN")} VNĐ
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Giá/cm²
                    </p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {design.materialType.pricePerCm2.toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-green-500/10 rounded">
                    <Ruler className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Thông số kỹ thuật
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/30 p-4 rounded-lg border text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Kích thước
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {design.dimensions}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/30 p-4 rounded-lg border text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Chiều rộng
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {design.width} <span className="text-sm">cm</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/30 p-4 rounded-lg border text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Chiều cao
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {design.height} <span className="text-sm">cm</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/30 p-4 rounded-lg border text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Số lượng
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {design.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/30 p-4 rounded-lg border text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Diện tích
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {design.areaCm2.toLocaleString("vi-VN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-sm">cm²</span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-emerald-500/10 rounded">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Giá & Thanh toán
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/30 p-5 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Đơn giá
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {design.unitPrice.toLocaleString("vi-VN")}{" "}
                      <span className="text-base">VNĐ</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/30 p-5 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Tổng giá
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {design.totalPrice.toLocaleString("vi-VN")}{" "}
                      <span className="text-base">VNĐ</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/30 p-5 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Giá mỗi đơn vị
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {(design.totalPrice / design.quantity).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      <span className="text-base">VNĐ</span>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-slate-500/10 rounded">
                    <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Yêu cầu & Ghi chú
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-muted/50 p-5 rounded-lg border">
                    <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      Yêu cầu thiết kế
                    </p>
                    <p className="text-sm leading-relaxed">
                      {design.requirements || "Không có yêu cầu"}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-5 rounded-lg border">
                    <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      Ghi chú thêm
                    </p>
                    <p className="text-sm leading-relaxed">
                      {design.additionalNotes || "Không có ghi chú"}
                    </p>
                  </div>
                  {design.notes && (
                    <div className="sm:col-span-2 bg-muted/50 p-5 rounded-lg border">
                      <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        Ghi chú nội bộ
                      </p>
                      <p className="text-sm leading-relaxed">{design.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                File bảng thiết kế
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {design.designFileUrl ? (
                <div className="group relative flex items-center justify-between p-5 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">File thiết kế</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {design.designFileUrl.split("/").pop()}
                      </p>
                    </div>
                  </div>
                  <Button className="shrink-0" asChild>
                    <a href={design.designFileUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Chưa có file thiết kế
                  </p>
                </div>
              )}

              {design.excelFileUrl && (
                <div className="group relative flex items-center justify-between p-5 border-2 rounded-xl hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                      <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">File Excel</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {design.excelFileUrl.split("/").pop()}
                      </p>
                    </div>
                  </div>
                  <Button className="shrink-0" asChild>
                    <a href={design.excelFileUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Ảnh chụp file bảng thiết kế
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {design.designFileUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-xl flex items-center justify-center overflow-hidden border-2 group hover:border-purple-500 transition-colors">
                    <img
                      src={design.designFileUrl || "/placeholder.svg"}
                      alt="Preview thiết kế"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML =
                          '<div class="flex flex-col items-center justify-center gap-3"><div class="p-4 bg-muted rounded-full"><svg class="h-12 w-12 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div><p class="text-sm font-medium text-muted-foreground">Không thể xem trước file</p></div>';
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-transparent"
                    asChild
                  >
                    <a
                      href={design.designFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Xem ảnh đầy đủ
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-dashed">
                  <div className="p-4 bg-muted rounded-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Chưa có ảnh thiết kế
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {design.timelineEntries && design.timelineEntries.length > 0 ? (
                  design.timelineEntries.map((entry, index) => (
                    <div key={entry.id} className="flex gap-6 group">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 ring-4 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all" />
                        {index < design.timelineEntries.length - 1 && (
                          <div className="w-0.5 h-full bg-gradient-to-b from-orange-500/30 to-transparent min-h-24" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 p-5 rounded-xl border group-hover:border-orange-500/50 transition-colors">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 space-y-2">
                              <p className="font-semibold text-base text-foreground">
                                {entry.description}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3.5 w-3.5" />
                                <span className="font-medium">
                                  {entry.createdBy.fullName}
                                </span>
                                <span className="text-xs">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.createdBy.role}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {new Date(entry.createdAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </p>
                            </div>
                          </div>
                          {entry.fileUrl && (
                            <div className="mt-4 space-y-3">
                              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 group-hover:border-orange-500/50 transition-colors">
                                <img
                                  src={entry.fileUrl || "/placeholder.svg"}
                                  alt={`Timeline ${entry.id}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement!.innerHTML =
                                      '<div class="flex flex-col items-center justify-center gap-2 h-full"><div class="p-3 bg-muted rounded-full"><svg class="h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div><p class="text-xs text-muted-foreground">Không thể tải ảnh</p></div>';
                                  }}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  asChild
                                >
                                  <a
                                    href={entry.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                    Xem ảnh đầy đủ
                                  </a>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 bg-transparent"
                                  asChild
                                >
                                  <a href={entry.fileUrl} download>
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Tải xuống
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      Chưa có lịch sử thay đổi
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" onClick={() => navigate("design/all")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/orders/${design.orderId}`)}
              >
                <Package className="h-4 w-4 mr-2" />
                Xem đơn hàng
              </Button>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
