"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Ruler,
  Download,
  DollarSign,
  Clock,
  User,
  Layers,
  Box,
  FileImage,
  Plus,
  Eye,
  Pencil,
  Upload,
  History,
} from "lucide-react";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { useNavigate, useParams } from "react-router-dom";
import { DesignFileUploadDialog } from "@/components/design/design-file-upload";
import { TimelineEntryDialog } from "@/components/design/timeline-entry-dialog";

interface DesignType {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
  description: string;
  status: string;
  statusType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: any;
}

interface MaterialType {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
  description: string;
  price: number;
  pricePerCm2: number;
  designTypeId: number;
  status: string;
  statusType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: any;
}

interface TimelineEntry {
  id: number;
  imageUrl: string;
  description: string;
  createdAt: string;
  createdBy: any;
}

interface DesignFile {
  fileUrl: string;
  imageUrl: string;
  uploadedAt: string;
}

interface Design {
  id: number;
  code: string;
  orderId: number;
  designStatus: string;
  statusType: string;
  designerId: number;
  designer: any;
  designTypeId: number;
  designType: DesignType;
  materialTypeId: number;
  materialType: MaterialType;
  quantity: number;
  dimensions: string;
  width: number;
  height: number;
  areaCm2: number;
  unitPrice: number;
  totalPrice: number;
  requirements: string;
  additionalNotes: string;
  notes: string;
  designFile: DesignFile | null;
  timelineEntries: TimelineEntry[];
}

const MOCK_DESIGN = {
  id: 1,
  code: "TK-2024-001",
  orderId: 12345,
  designStatus: "designing",
  statusType: "Đang thiết kế",
  designer: {
    id: 8,
    username: "nguyenvana",
    email: "nguyenvana@example.com",
    fullName: "Nguyễn Văn A",
    phone: "0912345678",
  },
  designType: {
    id: 1,
    code: "BANNER",
    name: "Banner quảng cáo",
    description: "Banner quảng cáo ngoài trời",
    statusType: "Hoạt động",
  },
  materialType: {
    id: 2,
    code: "HIFLEX",
    name: "Hiflex chất lượng cao",
    price: 50000,
    pricePerCm2: 5,
  },
  quantity: 10,
  dimensions: "200x100",
  width: 200,
  height: 100,
  areaCm2: 20000,
  unitPrice: 100000,
  totalPrice: 1000000,
  requirements: "In màu đậm, chất lượng cao, chống nước",
  additionalNotes: "Giao hàng trước 15/03/2024",
  notes: "Khách hàng VIP, ưu tiên xử lý",
  designFile: {
    fileUrl: "https://example.com/banner-design.ai",
    imageUrl: "/final-banner-design.jpg",
    uploadedAt: "2024-03-12T14:00:00Z",
  },
  timelineEntries: [
    {
      id: 1,
      imageUrl: "/design-mockup-banner.jpg",
      description: "Bắt đầu thiết kế - Phác thảo layout cơ bản",
      createdAt: "2024-03-10T08:00:00Z",
      createdBy: {
        fullName: "Nguyễn Văn A",
        username: "nguyenvana",
      },
    },
    {
      id: 2,
      imageUrl: "/banner-design-version-2.jpg",
      description: "Chỉnh sửa màu sắc theo yêu cầu khách hàng",
      createdAt: "2024-03-11T10:30:00Z",
      createdBy: {
        fullName: "Nguyễn Văn A",
        username: "nguyenvana",
      },
    },
    {
      id: 3,
      imageUrl: "/final-banner-design.jpg",
      description: "Hoàn thành thiết kế - Đã kiểm tra và xuất file",
      createdAt: "2024-03-12T14:00:00Z",
      createdBy: {
        fullName: "Nguyễn Văn A",
        username: "nguyenvana",
      },
    },
  ],
};

export default function DesignDetailPage() {
  const params = useParams();
  const router = useNavigate();
  const [design, setDesign] = useState(MOCK_DESIGN);
  const [loading] = useState(false);
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);

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
      <Badge variant={config.variant} className="text-xs px-2 py-0.5">
        {config.label}
      </Badge>
    );
  };

  const handleDesignFileUpload = (file: File, image: File) => {
    const fileUrl = URL.createObjectURL(file);
    const imageUrl = URL.createObjectURL(image);

    setDesign({
      ...design,
      designFile: {
        fileUrl,
        imageUrl,
        uploadedAt: new Date().toISOString(),
      },
    });
  };

  const handleTimelineAdd = (image: File, description: string) => {
    const imageUrl = URL.createObjectURL(image);

    const newEntry: TimelineEntry = {
      id: Date.now(),
      imageUrl,
      description,
      createdAt: new Date().toISOString(),
      createdBy: design.designer,
    };

    setDesign({
      ...design,
      timelineEntries: [...design.timelineEntries, newEntry],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary/20 border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold truncate">Không tìm thấy</h3>
              <p className="text-sm text-muted-foreground">
                Thiết kế không tồn tại
              </p>
            </div>
            <Button onClick={() => router("/designs")} size="sm">
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router("/designs")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-bold truncate">{design.code}</h1>
              {getStatusBadge(design.designStatus, design.statusType)}
              <span className="text-xs text-muted-foreground">
                • ĐH #{design.orderId}
              </span>
            </div>

            <div>Mã thiết kế:</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Info Card - Compact */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Designer - Inline */}
              <div className="flex items-start gap-2 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">
                <User className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {design.designer.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {design.designer.email} • {design.designer.phone}
                  </p>
                </div>
              </div>

              {/* Design Type & Material - Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-purple-50/50 dark:bg-purple-950/20 rounded">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="h-3 w-3 text-purple-600" />
                    <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
                      Loại TK
                    </p>
                  </div>
                  <p className="font-semibold text-xs">
                    {design.designType.name}
                  </p>
                </div>
                <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Box className="h-3 w-3 text-amber-600" />
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Chất liệu
                    </p>
                  </div>
                  <p className="font-semibold text-xs">
                    {design.materialType.name}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Specs - Compact Grid */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Ruler className="h-3.5 w-3.5 text-green-600" />
                  <p className="text-xs font-semibold">Thông số</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Kích thước
                    </p>
                    <p className="font-bold text-xs">{design.dimensions}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Số lượng
                    </p>
                    <p className="font-bold text-xs">
                      {design.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Diện tích
                    </p>
                    <p className="font-bold text-xs">
                      {(design.areaCm2 / 10000).toFixed(1)}m²
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing - Compact */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <p className="text-xs font-semibold">Giá</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Đơn giá
                    </p>
                    <p className="font-bold text-sm text-emerald-600">
                      {design.unitPrice.toLocaleString()}đ
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Tổng
                    </p>
                    <p className="font-bold text-sm text-emerald-600">
                      {design.totalPrice.toLocaleString()}đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements - Compact */}
              {(design.requirements || design.additionalNotes) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {design.requirements && (
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                          YÊU CẦU
                        </p>
                        <p className="text-xs leading-relaxed">
                          {design.requirements}
                        </p>
                      </div>
                    )}
                    {design.additionalNotes && (
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                          GHI CHÚ
                        </p>
                        <p className="text-xs leading-relaxed">
                          {design.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-violet-500" />
                  File bảng thiết kế
                </CardTitle>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowFileUpload(true)}
                >
                  {design.designFile ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {design.designFile ? "Thay đổi" : "Upload"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!design.designFile ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Chưa có file thiết kế
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload file .ai và hình ảnh chụp
                  </p>
                  <Button size="sm" onClick={() => setShowFileUpload(true)}>
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Upload ngay
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image preview */}
                  <div
                    className="relative group cursor-pointer rounded-lg overflow-hidden border-2 hover:border-violet-500 transition-all"
                    onClick={() =>
                      setViewingImage({
                        url: design.designFile.imageUrl,
                        title: "File bảng thiết kế",
                      })
                    }
                  >
                    <img
                      src={design.designFile.imageUrl || "/placeholder.svg"}
                      alt="Design file preview"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  {/* File info & actions */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1">
                          banner-design.ai
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Upload:{" "}
                            {new Date(
                              design.designFile.uploadedAt
                            ).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        asChild
                      >
                        <a href={design.designFile.fileUrl} download>
                          <Download className="h-3.5 w-3.5 mr-2" />
                          Tải file .ai
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFileUpload(true)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Thay đổi
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                Timeline tiến trình ({design.timelineEntries.length})
              </CardTitle>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowTimelineDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm timeline
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {design.timelineEntries.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Chưa có timeline nào</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Thêm hình ảnh và mô tả công việc
                </p>
                <Button size="sm" onClick={() => setShowTimelineDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Thêm ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {design.timelineEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex gap-4 p-4 rounded-lg border hover:border-purple-500 transition-all bg-muted/20"
                  >
                    {/* Timeline number badge */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Timeline Image */}
                    <div
                      className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        setViewingImage({
                          url: entry.imageUrl,
                          title: entry.description,
                        })
                      }
                    >
                      <img
                        src={entry.imageUrl || "/placeholder.svg"}
                        alt={entry.description}
                        className="w-24 h-24 object-cover rounded-lg border-2 hover:border-purple-500"
                      />
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-2 leading-tight">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{entry.createdBy.fullName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(entry.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-transparent"
                        asChild
                      >
                        <a href={entry.imageUrl} download>
                          <Download className="h-3 w-3 mr-1.5" />
                          Tải hình ảnh
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Viewer Dialog */}
      {viewingImage && (
        <ImageViewerDialog
          open={!!viewingImage}
          onOpenChange={(open) => !open && setViewingImage(null)}
          imageUrl={viewingImage.url}
          title={viewingImage.title}
        />
      )}

      {/* File Upload Dialog */}
      <DesignFileUploadDialog
        open={showFileUpload}
        onOpenChange={setShowFileUpload}
        onUpload={handleDesignFileUpload}
        mode={design.designFile ? "edit" : "create"}
      />

      {/* Timeline Entry Dialog */}
      <TimelineEntryDialog
        open={showTimelineDialog}
        onOpenChange={setShowTimelineDialog}
        onAdd={handleTimelineAdd}
      />
    </div>
  );
}
