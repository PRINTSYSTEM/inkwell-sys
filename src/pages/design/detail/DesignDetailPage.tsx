"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "@/hooks/use-toast";
import {
  useDesign,
  useDesignTimeline,
  useUploadDesignFile,
  useUploadDesignImage,
  useAddDesignTimelineEntry,
  useUpdateDesign,
} from "@/hooks/use-design";
import { ErrorBoundary, ErrorDisplay } from "@/components/ui/error-components";

import {
  ArrowLeft,
  Package,
  Ruler,
  Download,
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
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
  Receipt,
  Truck,
  CheckCircle2 as CheckCircleIcon,
} from "lucide-react";

import {
  type DesignStatus,
  designStatusLabels,
  getValidNextStatuses,
  isValidStatusTransition,
  getTransitionErrorMessage,
  isFinalStatus,
} from "@/lib/design-status-transitions";
import { useNavigate, useParams } from "react-router-dom";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { DesignFileUploadDialog } from "@/components/design/design-file-upload";
import { TimelineEntryDialog } from "@/components/design/timeline-entry-dialog";

import type { DesignResponse, DesignTimelineEntryResponse } from "@/Schema";
import { ROLE } from "@/constants";
import {
  useAuth,
  useOrder,
  useExportOrderInvoice,
  useExportOrderDeliveryNote,
  useUpdateOrder,
} from "@/hooks";
import { StatusBadge } from "@/components/ui/status-badge";
import { orderStatusLabels } from "@/lib/status-utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import type { OrderDetailResponse } from "@/Schema";
import DesignCodeGeneratorComponent from "@/components/DesignCodeGenerator";
import DesignCode from "@/components/design/design-code";

export default function DesignDetailPage() {
  const params = useParams();
  const router = useNavigate();
  const { user } = useAuth();

  const designId = Number(params.id);
  const enabled = !Number.isNaN(designId);

  // ==== LOCAL UI STATE ====
  const {
    data: design,
    isLoading: designLoading,
    isError: designError,
    error: designErrorObj,
    refetch: refetchDesign,
  } = useDesign(enabled ? designId : null, enabled);

  const {
    data: timelineData,
    isLoading: timelineLoading,
    isError: timelineError,
    error: timelineErrorObj,
    refetch: refetchTimeline,
  } = useDesignTimeline(enabled ? designId : null, enabled);

  const timelineEntries: DesignTimelineEntryResponse[] = timelineData ?? [];

  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);

  const [pendingStatus, setPendingStatus] = useState<DesignStatus | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const updateDesign = useUpdateDesign();
  const { mutate: uploadFile } = useUploadDesignFile();
  const { mutate: uploadImage } = useUploadDesignImage();
  const { mutate: addTimeline } = useAddDesignTimelineEntry();

  // Fetch orderDetail by designId to get orderId
  // Note: This assumes there's an API endpoint or we need to fetch orders and filter
  // For now, we'll try to get orderId from available order details
  const { data: orderDetails } = useQuery<OrderDetailResponse[]>({
    queryKey: ["order-details", "by-design", designId],
    enabled: enabled && !!designId,
    queryFn: async () => {
      try {
        // Try to fetch orderDetails that contain this design
        // This might need a different API endpoint
        const res = await apiRequest.get<OrderDetailResponse[]>(
          API_SUFFIX.PROOFING_AVAILABLE_ORDER_DETAILS,
          {
            params: {},
          }
        );
        return res.data.filter((od) => od.designId === designId);
      } catch {
        // If API doesn't support this, return empty array
        return [];
      }
    },
  });

  // Get orderId from orderDetail
  const orderId = orderDetails?.[0]?.orderId || null;

  // Fetch order if we have orderId
  const { data: order, isLoading: orderLoading } = useOrder(
    orderId,
    enabled && !!orderId
  );

  // Export hooks
  const { mutate: exportInvoice, loading: exportingInvoice } =
    useExportOrderInvoice();
  const { mutate: exportDeliveryNote, loading: exportingDeliveryNote } =
    useExportOrderDeliveryNote();
  const { mutate: updateOrder, isPending: updatingOrder } = useUpdateOrder();

  // Use 'status' field from DesignResponse
  const currentStatus = (design?.status ?? "received_info") as DesignStatus;

  const validNextStatuses = getValidNextStatuses(currentStatus);

  // Only DESIGN, DESIGN_LEAD, ADMIN can update status
  const canUpdateStatus =
    user?.role === ROLE.DESIGN ||
    user?.role === ROLE.DESIGN_LEAD ||
    user?.role === ROLE.ADMIN;

  const canChangeStatus =
    canUpdateStatus &&
    !isFinalStatus(currentStatus) &&
    validNextStatuses.length > 0;

  // For single next status, we use the first one
  // For multiple, we show all options
  const hasMultipleOptions = validNextStatuses.length > 1;

  // Check if can transition to a specific status
  const canTransitionTo = (targetStatus: DesignStatus): boolean => {
    // Từ "designing" sang "waiting_for_customer_approval" phải có file
    if (
      currentStatus === "designing" &&
      targetStatus === "waiting_for_customer_approval"
    ) {
      return !!design?.designFileUrl;
    }
    return true;
  };

  // Check if missing design file when in designing status
  const needsDesignFile =
    currentStatus === "designing" &&
    validNextStatuses.includes("waiting_for_customer_approval") &&
    !design?.designFileUrl;

  // Check if user can see export buttons (accounting or admin)
  const canExportDocuments =
    (user?.role === ROLE.ACCOUNTING || user?.role === ROLE.ADMIN) &&
    order?.status === "production_completed";

  // Check if user can complete order (accounting only)
  const canCompleteOrder =
    user?.role === ROLE.ACCOUNTING && order?.status === "delivering";

  const handleExportInvoice = () => {
    if (orderId) {
      exportInvoice(orderId);
    }
  };

  const handleExportDeliveryNote = () => {
    if (orderId) {
      exportDeliveryNote(orderId);
    }
  };

  const handleCompleteOrder = async () => {
    if (!orderId) return;
    try {
      await updateOrder({
        id: orderId,
        data: { status: "completed" },
      });
      toast({
        title: "Thành công",
        description: "Đã hoàn thành đơn hàng",
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStatusTransition = (targetStatus: DesignStatus) => {
    if (!targetStatus) return;
    setPendingStatus(targetStatus);
    setShowConfirmDialog(true);
  };

  const handleConfirmStatus = async () => {
    if (!design || !pendingStatus) {
      return;
    }

    // Validate transition
    if (!isValidStatusTransition(currentStatus, pendingStatus)) {
      const errorMessage = getTransitionErrorMessage(
        currentStatus,
        pendingStatus
      );

      toast({
        title: "Không thể thay đổi trạng thái",
        description: errorMessage,
        variant: "destructive",
      });

      setShowConfirmDialog(false);
      setPendingStatus(null);
      return;
    }

    // Validate: Từ "designing" sang "waiting_for_customer_approval" phải có file thiết kế
    if (
      currentStatus === "designing" &&
      pendingStatus === "waiting_for_customer_approval"
    ) {
      if (!design.designFileUrl) {
        toast({
          title: "Không thể chuyển trạng thái",
          description:
            "Vui lòng upload file thiết kế trước khi chuyển sang trạng thái 'Chờ khách duyệt'",
          variant: "destructive",
        });

        setShowConfirmDialog(false);
        setPendingStatus(null);
        return;
      }
    }

    setUpdatingStatus(true);

    try {
      // API uses 'designStatus' field for updating
      await updateDesign.mutateAsync({
        id: designId,
        data: { designStatus: pendingStatus },
      });

      toast({
        title: "Thành công",
        description: `Trạng thái đã được cập nhật thành ${designStatusLabels[pendingStatus]}`,
      });

      setShowConfirmDialog(false);
      setPendingStatus(null);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==== HANDLERS FOR DESIGN FILE AND TIMELINE (PRESERVED LOGIC) ====
  const handleDesignFileUpload = async (file: File, image: File) => {
    if (!enabled) return;
    try {
      await uploadFile({ id: designId, file });
      await uploadImage({ id: designId, file: image });
      setShowFileUpload(false);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể upload file",
        variant: "destructive",
      });
    }
  };

  const handleTimelineAdd = async (image: File, description: string) => {
    if (!enabled) return;
    try {
      await addTimeline({ id: designId, file: image, description });
      setShowTimelineDialog(false);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể thêm timeline",
        variant: "destructive",
      });
    }
  };

  // ==== RENDER ====

  if (designLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary/20 border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (designError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {(() => {
            const message =
              designErrorObj && designErrorObj instanceof Error
                ? designErrorObj.message
                : "Không thể tải thiết kế";
            return (
              <ErrorDisplay
                error={message}
                onRetry={() => refetchDesign()}
                title="Lỗi tải dữ liệu thiết kế"
              />
            );
          })()}
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

  const d = design as DesignResponse;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* HEADER STICKY */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {d.code ?? `DES-${d.id}`}
                </h1>
                <StatusBadge
                  status={currentStatus}
                  label={designStatusLabels[currentStatus]}
                />
                {d.designName && (
                  <span className="text-xs text-muted-foreground truncate">
                    • {d.designName}
                  </span>
                )}
              </div>
              {/* Order Actions */}
              {order && (
                <div className="flex items-center gap-2">
                  {canExportDocuments && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportInvoice}
                        disabled={exportingInvoice}
                        className="gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        {exportingInvoice ? "Đang xuất..." : "Xuất hóa đơn"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportDeliveryNote}
                        disabled={exportingDeliveryNote}
                        className="gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        {exportingDeliveryNote
                          ? "Đang xuất..."
                          : "Xuất phiếu giao hàng"}
                      </Button>
                    </>
                  )}
                  {canCompleteOrder && (
                    <Button
                      size="sm"
                      onClick={handleCompleteOrder}
                      disabled={updatingOrder}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      {updatingOrder ? "Đang xử lý..." : "Hoàn thành đơn hàng"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <DesignCode
            code={d.code}
            designName={d.designName}
            dimensions={d.dimensions}
            extraNote={d.extraNote as string}
            createdAt={d.createdAt}
          />
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
                      {d.designer?.fullName ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {d.designer?.email ?? "-"} • {d.designer?.phone ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Trạng thái thiết kế
                  </p>

                  {/* Current status display */}
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-semibold text-sm">
                      {designStatusLabels[currentStatus]}
                    </span>
                  </div>

                  {/* Final status message */}
                  {isFinalStatus(currentStatus) && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-xs">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Hoàn thành
                        </p>
                        <p className="text-green-700 dark:text-green-300 mt-0.5">
                          Đây là trạng thái cuối cùng, không thể thay đổi.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning: Need design file */}
                  {needsDesignFile && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100">
                          Cần upload file thiết kế
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                          Vui lòng upload file thiết kế trước khi chuyển sang
                          trạng thái "Chờ khách duyệt"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status transition options */}
                  {canChangeStatus && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {hasMultipleOptions
                          ? "Chọn trạng thái tiếp theo:"
                          : "Trạng thái tiếp theo:"}
                      </p>

                      {hasMultipleOptions ? (
                        // Multiple options - show as button group
                        <div className="grid gap-2">
                          {validNextStatuses.map((nextStatus) => {
                            const canTransition = canTransitionTo(nextStatus);
                            return (
                              <Button
                                key={nextStatus}
                                size="sm"
                                variant={
                                  nextStatus === "confirmed_for_printing"
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  handleStatusTransition(nextStatus)
                                }
                                disabled={updatingStatus || !canTransition}
                                className={`w-full justify-start gap-2 ${nextStatus === "confirmed_for_printing"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                                  }`}
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                                {designStatusLabels[nextStatus]}
                                {nextStatus === "confirmed_for_printing" && (
                                  <span className="ml-auto text-[10px] opacity-75">
                                    (Hoàn thành)
                                  </span>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        // Single option - show info and button
                        <>
                          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-blue-900 dark:text-blue-100">
                              <span className="font-semibold">
                                {designStatusLabels[validNextStatuses[0]]}
                              </span>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusTransition(validNextStatuses[0])
                            }
                            disabled={
                              updatingStatus ||
                              !canTransitionTo(validNextStatuses[0])
                            }
                            className="w-full gap-2"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            Chuyển sang:{" "}
                            {designStatusLabels[validNextStatuses[0]]}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
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
                    <p className="font-semibold text-xs">
                      {d.designType?.name ?? "-"}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Box className="h-3 w-3 text-amber-600" />
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                        Chất liệu
                      </p>
                    </div>
                    <p className="font-semibold text-xs text-amber-900 dark:text-amber-100 uppercase">
                      {d.materialType?.name ?? "-"}
                    </p>
                  </div>
                </div>

                {/* STT 4, 7, 8: Classification Options */}
                {(d.sidesClassificationOption || d.processClassificationOption) && (
                  <div className="grid grid-cols-2 gap-2">
                    {d.sidesClassificationOption && (
                      <div className="p-2 border rounded-md">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Số mặt</p>
                        <p className="text-xs font-medium">{d.sidesClassificationOption.value}</p>
                      </div>
                    )}
                    {d.processClassificationOption && (
                      <div className="p-2 border rounded-md">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Gia công</p>
                        <p className="text-xs font-medium">{d.processClassificationOption.value}</p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Specs - Based on DesignResponse schema */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Ruler className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-xs font-semibold">Thông số kích thước</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {/* Chiều dài (mới) */}
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5 uppercase font-medium">L (Dài)</p>
                      <p className="font-bold text-xs">{d.length != null ? `${d.length} mm` : "—"}</p>
                    </div>
                    {/* Chiều rộng */}
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5 uppercase font-medium">W (Rộng)</p>
                      <p className="font-bold text-xs">{d.width != null ? `${d.width} mm` : "—"}</p>
                    </div>
                    {/* Chiều cao */}
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5 uppercase font-medium">H (Cao)</p>
                      <p className="font-bold text-xs">{d.height != null ? `${d.height} mm` : "—"}</p>
                    </div>
                    {/* Chiều sâu (mới) */}
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5 uppercase font-medium">D (Sâu)</p>
                      <p className="font-bold text-xs">{d.depth != null ? `${d.depth} mm` : "—"}</p>
                    </div>
                  </div>

                  <div className="mt-2 bg-muted/20 p-2 rounded flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Diện tích tính toán:</span>
                    <span className="font-bold">
                      {d.areaCm2 != null ? `${(d.areaCm2 / 100).toFixed(2)} cm²` : "—"}
                    </span>
                  </div>

                  {/* Dimensions string if available */}
                  {d.dimensions && (
                    <div className="mt-2 p-2 bg-muted/30 rounded text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        Kích thước (text)
                      </p>
                      <p className="font-semibold text-xs">{d.dimensions}</p>
                    </div>
                  )}
                </div>

                {/* Notes - From schema */}
                {d.notes && (
                  <>
                    <Separator />
                    <div className="bg-muted/30 p-2 rounded">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        GHI CHÚ
                      </p>
                      <p className="text-xs leading-relaxed">{d.notes}</p>
                    </div>
                  </>
                )}

                {/* Timestamps - From schema */}
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Tạo:{" "}
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Cập nhật:{" "}
                      {d.updatedAt
                        ? new Date(d.updatedAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ==== DESIGN FILE CARD (PRESERVED COMPONENT) ==== */}
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
                        d.designImageUrl &&
                        setViewingImage({
                          url: d.designImageUrl,
                          title: "File bảng thiết kế",
                        })
                      }
                    >
                      <img
                        src={d.designImageUrl || "/placeholder.svg"}
                        alt="Design file preview"
                        className="w-full h-64 object-cover"
                      />
                      {d.designImageUrl && (
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

                      <div className="flex flex-wrap gap-2">
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
                              Tải file AI
                            </a>
                          </Button>
                        )}
                        {d.excelFileUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            asChild
                          >
                            <a
                              href={d.excelFileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                              Tải Excel
                            </a>
                          </Button>
                        )}
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

          {/* ==== TIMELINE (PRESERVED COMPONENT) ==== */}
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
                  <p className="text-sm font-medium mb-1">
                    Chưa có timeline nào
                  </p>
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
                      {entry.fileUrl && (
                        <div
                          className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            setViewingImage({
                              url: entry.fileUrl!,
                              title: entry.description ?? "",
                            })
                          }
                        >
                          <img
                            src={entry.fileUrl}
                            alt={entry.description ?? ""}
                            className="w-24 h-24 object-cover rounded-lg border-2 hover:border-purple-500"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-2 leading-tight">
                          {entry.description ?? "(Không có mô tả)"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          {entry.createdBy?.fullName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{entry.createdBy.fullName}</span>
                            </div>
                          )}
                          {entry.createdAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(entry.createdAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        {entry.fileUrl && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image Viewer Dialog - Add this when you have the component */}
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

        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                Xác nhận thay đổi trạng thái
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>Bạn có chắc chắn muốn thay đổi trạng thái thiết kế?</p>

                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        HIỆN TẠI
                      </p>
                      <p className="font-semibold text-sm text-foreground">
                        {designStatusLabels[currentStatus]}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        SAU KHI ĐỔI
                      </p>
                      <p className="font-semibold text-sm text-primary">
                        {pendingStatus ? designStatusLabels[pendingStatus] : ""}
                      </p>
                    </div>
                  </div>

                  {pendingStatus === "confirmed_for_printing" && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-amber-800 dark:text-amber-200">
                        <strong>Lưu ý:</strong> Đây là trạng thái cuối cùng. Sau
                        khi chuyển sang trạng thái này, bạn sẽ không thể thay
                        đổi nữa.
                      </p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatingStatus}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmStatus}
                disabled={updatingStatus}
                className={
                  pendingStatus === "confirmed_for_printing"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                {updatingStatus ? "Đang cập nhật..." : "Xác nhận thay đổi"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
}
