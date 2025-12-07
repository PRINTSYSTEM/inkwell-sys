"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import { DesignFileUploadDialog } from "@/components/design/design-file-upload";
import { TimelineEntryDialog } from "@/components/design/timeline-entry-dialog";

import {
  useDesign,
  useDesignTimeline,
  useUploadDesignFile,
  useUploadDesignImage,
  useAddDesignTimelineEntry,
  useUpdateDesign,
} from "@/hooks";
import type {
  DesignResponse,
  DesignTimelineEntryResponse,
} from "@/Schema/design.schema";
import DesignCode from "@/components/design/design-code";
import { StatusBadge } from "@/components/ui/status-badge";
import { designStatusLabels } from "@/lib/status-utils";

export default function DesignDetailPage() {
  const params = useParams();
  const router = useNavigate();

  const designId = Number(params.id);
  const enabled = !Number.isNaN(designId);

  // ==== DATA FROM API ====
  const { data: design, isLoading: designLoading } = useDesign(
    enabled ? designId : null,
    enabled
  );

  const { data: timelineData, isLoading: timelineLoading } = useDesignTimeline(
    enabled ? designId : null,
    enabled
  );

  const timelineEntries: DesignTimelineEntryResponse[] =
    timelineData ?? design?.timelineEntries ?? [];

  // ==== MUTATIONS ====
  const { mutate: uploadDesignFile, loading: uploadingDesignFile } =
    useUploadDesignFile();

  const { mutate: uploadDesignImage, loading: uploadingDesignImage } =
    useUploadDesignImage();

  const { mutate: addTimelineEntry, loading: addingTimeline } =
    useAddDesignTimelineEntry();

  const { mutate: updateDesignStatus } = useUpdateDesign();

  // ==== LOCAL UI STATE ====
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);

  // draft status để chọn trên UI
  const [statusDraft, setStatusDraft] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loading = designLoading;

  useEffect(() => {
    if (design?.designStatus) {
      setStatusDraft(design.designStatus);
    } else {
      setStatusDraft("");
    }
  }, [design?.designStatus]);

  // ==== HANDLERS (CALL API) ====

  // Upload file .ai + ảnh preview
  const handleDesignFileUpload = async (file: File, image: File) => {
    if (!enabled) return;
    try {
      // nếu muốn upload cả file .ai:
      await uploadDesignFile({ id: designId, file });
      await uploadDesignImage({ id: designId, file: image });
      setShowFileUpload(false);
    } catch {
      // toast đã được handle trong hook
    }
  };

  // Thêm timeline entry
  const handleTimelineAdd = async (image: File, description: string) => {
    if (!enabled) return;
    try {
      await addTimelineEntry({
        id: designId,
        file: image,
        description,
      });
      setShowTimelineDialog(false);
    } catch {
      // toast đã được handle trong hook
    }
  };

  // Cập nhật trạng thái thiết kế
  const handleSaveStatus = () => {
    if (!enabled || !statusDraft || statusDraft === design?.designStatus) {
      return;
    }

    setUpdatingStatus(true);
    updateDesignStatus(
      {
        id: designId,
        data: {
          designStatus: statusDraft,
        },
      },
      {
        onSettled: () => {
          setUpdatingStatus(false);
        },
      }
    );
  };

  // ==== RENDER ====

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
            <Button onClick={() => router("/design/all")} size="sm">
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // tiện alias cho code ngắn
  const d: DesignResponse = design;
  const latestTimelineImageUrl =
    timelineEntries.length > 0
      ? timelineEntries[timelineEntries.length - 1].fileUrl
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router("/design/all")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {d.code ?? `DES-${d.id}`}
              </h1>
              <StatusBadge
                status={d.designStatus}
                label={designStatusLabels[d.designStatus]}
              />
              <span className="text-xs text-muted-foreground">
                • ĐH #{d.orderId}
              </span>
            </div>

            <DesignCode
              code={d.code}
              designName={d.designName}
              quantity={d.quantity}
              dimensions={d.dimensions}
              createdAt={d.createdAt.toString()}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* ==== BASIC INFO CARD ==== */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Designer */}
              <div className="flex items-start gap-2 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">
                <User className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {d.designer.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.designer.email} • {d.designer.phone}
                  </p>
                </div>
              </div>

              {/* Status select + update */}
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  TRẠNG THÁI THIẾT KẾ
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={statusDraft || ""}
                    onValueChange={(v) => setStatusDraft(v)}
                  >
                    <SelectTrigger className="h-8 w-fit min-w-[180px]">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(designStatusLabels).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      updatingStatus ||
                      !statusDraft ||
                      statusDraft === d.designStatus
                    }
                    onClick={handleSaveStatus}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Cập nhật
                  </Button>
                </div>
              </div>

              {/* Design Type & Material */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-purple-50/50 dark:bg-purple-950/20 rounded">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers className="h-3 w-3 text-purple-600" />
                    <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
                      Loại TK
                    </p>
                  </div>
                  <p className="font-semibold text-xs">{d.designType.name}</p>
                </div>
                <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Box className="h-3 w-3 text-amber-600" />
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Chất liệu
                    </p>
                  </div>
                  <p className="font-semibold text-xs">{d.materialType.name}</p>
                </div>
              </div>

              <Separator />

              {/* Specs */}
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
                    <p className="font-bold text-xs">{d.dimensions ?? "—"}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Số lượng
                    </p>
                    <p className="font-bold text-xs">
                      {d.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Diện tích
                    </p>
                    <p className="font-bold text-xs">
                      {d.areaCm2 != null
                        ? `${(d.areaCm2 / 10000).toFixed(1)}m²`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing */}
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
                      {d.unitPrice != null
                        ? `${d.unitPrice.toLocaleString()}đ`
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Tổng
                    </p>
                    <p className="font-bold text-sm text-emerald-600">
                      {d.totalPrice != null
                        ? `${d.totalPrice.toLocaleString()}đ`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements / Notes */}
              {(d.requirements || d.additionalNotes) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {d.requirements && (
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                          YÊU CẦU
                        </p>
                        <p className="text-xs leading-relaxed">
                          {d.requirements}
                        </p>
                      </div>
                    )}
                    {d.additionalNotes && (
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                          GHI CHÚ
                        </p>
                        <p className="text-xs leading-relaxed">
                          {d.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ==== DESIGN FILE CARD ==== */}
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
                  disabled={uploadingDesignFile || uploadingDesignImage}
                  onClick={() => setShowFileUpload(true)}
                >
                  {d.designFileUrl ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {d.designFileUrl ? "Thay đổi" : "Upload"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!d.designFileUrl ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Chưa có file thiết kế
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload file .ai và hình ảnh chụp
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowFileUpload(true)}
                    disabled={uploadingDesignFile || uploadingDesignImage}
                  >
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
                      design?.designImageUrl &&
                      setViewingImage({
                        url: design?.designImageUrl,
                        title: "File bảng thiết kế",
                      })
                    }
                  >
                    <img
                      src={design?.designImageUrl}
                      alt="Design file preview"
                      className="w-full h-64 object-cover"
                    />
                    {design?.designImageUrl && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>

                  {/* File info & actions */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1 truncate">
                          {d.designFileUrl?.split("/").pop()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Đã upload file thiết kế</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {d.designFileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          asChild
                        >
                          <a
                            href={d.designFileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Tải file
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFileUpload(true)}
                        disabled={uploadingDesignFile || uploadingDesignImage}
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

        {/* ==== TIMELINE ==== */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                Timeline tiến trình ({timelineEntries.length})
              </CardTitle>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowTimelineDialog(true)}
                disabled={addingTimeline}
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm timeline
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Đang tải timeline...
              </div>
            ) : timelineEntries.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Chưa có timeline nào</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Thêm hình ảnh và mô tả công việc
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowTimelineDialog(true)}
                  disabled={addingTimeline}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Thêm ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex gap-4 p-4 rounded-lg border hover:border-purple-500 transition-all bg-muted/20"
                  >
                    {/* Number badge */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Image */}
                    <div
                      className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        setViewingImage({
                          url: entry.fileUrl,
                          title: entry.description ?? "",
                        })
                      }
                    >
                      <img
                        src={entry.fileUrl || "/placeholder.svg"}
                        alt={entry.description ?? ""}
                        className="w-24 h-24 object-cover rounded-lg border-2 hover:border-purple-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-2 leading-tight">
                        {entry.description ?? "(Không có mô tả)"}
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
                        <a href={entry.fileUrl} download>
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
        mode={d.designFileUrl ? "edit" : "create"}
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
