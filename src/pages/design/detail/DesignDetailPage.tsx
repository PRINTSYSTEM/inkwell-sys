import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { toast } from "sonner";
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
  FileText,
  ChevronDown,
  ChevronRight,
  Settings,
  Info,
  Workflow,
  UploadCloud,
  Image as ImageIcon,
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
import {
  orderStatusLabels,
  sidesClassificationLabels,
  processClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import type { OrderDetailResponse } from "@/Schema";
import DesignCodeGeneratorComponent from "@/components/DesignCodeGenerator";
import DesignCode from "@/components/design/design-code";
import { downloadFile } from "@/lib/download-utils";

export default function DesignDetailPage() {
  const params = useParams();
  const router = useNavigate();
  const { user } = useAuth();

  const designId = Number(params.id);
  const enabled = !Number.isNaN(designId);

  // ==== DATA ====
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

  const timelineEntries: DesignTimelineEntryResponse[] =
    timelineData?.items ?? [];

  // ==== LOCAL UI STATE ====
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    designName: "",
    length: 0,
    width: 0,
    height: 0,
    requirements: "",
    additionalNotes: "",
    sidesClassificationOptionId: undefined as number | undefined,
    processClassificationOptionId: undefined as number | undefined,
  });

  const [pendingStatus, setPendingStatus] = useState<DesignStatus | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    specs: true,
    process: false,
    notes: true,
  });

  const updateDesign = useUpdateDesign();
  const { mutate: uploadFile } = useUploadDesignFile();
  const { mutate: uploadImage } = useUploadDesignImage();
  const { mutate: addTimeline } = useAddDesignTimelineEntry();

  // ==== ORDER BY DESIGN ====
  const { data: orderDetails } = useQuery<OrderDetailResponse[]>({
    queryKey: ["order-details", "by-design", designId],
    enabled: enabled && !!designId,
    queryFn: async () => {
      try {
        const res = await apiRequest.get<OrderDetailResponse[]>(
          API_SUFFIX.PROOFING_AVAILABLE_ORDER_DETAILS,
          {
            params: {},
          }
        );
        return res.data.filter((od) => od.designId === designId);
      } catch {
        return [];
      }
    },
  });

  const orderId = orderDetails?.[0]?.orderId || null;
  const hasProofingOrder = orderDetails && orderDetails.length > 0;

  const { data: order, isLoading: orderLoading } = useOrder(
    orderId,
    enabled && !!orderId
  );

  const { mutate: exportInvoice, loading: exportingInvoice } =
    useExportOrderInvoice();
  const { mutate: exportDeliveryNote, loading: exportingDeliveryNote } =
    useExportOrderDeliveryNote();
  const { mutate: updateOrder, isPending: updatingOrder } = useUpdateOrder();

  const currentStatus = (design?.status ?? "received_info") as DesignStatus;
  const validNextStatuses = getValidNextStatuses(currentStatus);

  const canUpdateStatus =
    user?.role === ROLE.DESIGN ||
    user?.role === ROLE.DESIGN_LEAD ||
    user?.role === ROLE.ADMIN;

  const canChangeStatus =
    canUpdateStatus &&
    !isFinalStatus(currentStatus) &&
    validNextStatuses.length > 0;

  const canTransitionTo = (targetStatus: DesignStatus): boolean => {
    if (
      currentStatus === "designing" &&
      targetStatus === "waiting_for_customer_approval"
    ) {
      return !!design?.designFileUrl;
    }
    return true;
  };

  const needsDesignFile =
    currentStatus === "designing" &&
    validNextStatuses.includes("waiting_for_customer_approval") &&
    !design?.designFileUrl;

  const canExportDocuments =
    (user?.role === ROLE.ACCOUNTING || user?.role === ROLE.ADMIN) &&
    order?.status === "production_completed";

  const canCompleteOrder =
    user?.role === ROLE.ACCOUNTING && order?.status === "delivering";

  // ==== HANDLERS - ORDER ====
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
      toast.success("Thành công", {
        description: "Đã hoàn thành đơn hàng",
      });
    } catch {
      // handled in hook
    }
  };

  // ==== HANDLERS - STATUS ====
  const handleStatusTransition = (targetStatus: DesignStatus) => {
    if (!targetStatus) return;
    setPendingStatus(targetStatus);
    setShowConfirmDialog(true);
  };

  const handleConfirmStatus = async () => {
    if (!design || !pendingStatus) {
      return;
    }

    if (!isValidStatusTransition(currentStatus, pendingStatus)) {
      const errorMessage = getTransitionErrorMessage(
        currentStatus,
        pendingStatus
      );

      toast.error("Không thể thay đổi trạng thái", {
        description: errorMessage,
      });

      setShowConfirmDialog(false);
      setPendingStatus(null);
      return;
    }

    if (
      currentStatus === "designing" &&
      pendingStatus === "waiting_for_customer_approval"
    ) {
      if (!design.designFileUrl) {
        toast.error("Không thể chuyển trạng thái", {
          description:
            "Vui lòng upload file thiết kế trước khi chuyển sang trạng thái 'Chờ khách duyệt'",
        });

        setShowConfirmDialog(false);
        setPendingStatus(null);
        return;
      }
    }

    setUpdatingStatus(true);

    try {
      await updateDesign.mutateAsync({
        id: designId,
        data: { designStatus: pendingStatus },
      });

      toast.success("Thành công", {
        description: `Trạng thái đã được cập nhật thành ${designStatusLabels[pendingStatus]}`,
      });

      setShowConfirmDialog(false);
      setPendingStatus(null);
      refetchDesign();
    } catch {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==== HANDLERS - FILE & TIMELINE ====
  const handleDesignFileUpload = async (file: File, image: File) => {
    if (!enabled) return;
    try {
      await uploadFile({ id: designId, file });
      await uploadImage({ id: designId, file: image });
      setShowFileUpload(false);
      toast.success("Thành công", {
        description: "Đã upload file thiết kế",
      });
      refetchDesign();
    } catch {
      toast.error("Lỗi", {
        description: "Không thể upload file",
      });
    }
  };

  const handleTimelineAdd = async (image: File, description: string) => {
    if (!enabled) return;
    try {
      await addTimeline({ id: designId, file: image, description });
      setShowTimelineDialog(false);
      toast.success("Thành công", {
        description: "Đã thêm timeline mới",
      });
      refetchTimeline();
    } catch {
      toast.error("Lỗi", {
        description: "Không thể thêm timeline",
      });
    }
  };

  // ==== HANDLERS - EDIT DESIGN ====
  const handleStartEdit = () => {
    if (!design) return;
    setEditFormData({
      designName: design.designName || "",
      length: design.length || 0,
      width: design.width || 0,
      height: design.height || 0,
      requirements: design.latestRequirements || "",
      additionalNotes: design.notes || "",
      sidesClassificationOptionId:
        (design.sidesClassificationOptionId as number | undefined) || undefined,
      processClassificationOptionId:
        (design.processClassificationOptionId as number | undefined) ||
        undefined,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      designName: "",
      length: 0,
      width: 0,
      height: 0,
      requirements: "",
      additionalNotes: "",
      sidesClassificationOptionId: undefined,
      processClassificationOptionId: undefined,
    });
  };

  const handleSaveEdit = async () => {
    if (!design) return;
    try {
      await updateDesign.mutateAsync({
        id: designId,
        data: {
          designName: editFormData.designName || null,
          length: editFormData.length || null,
          width: editFormData.width || null,
          height: editFormData.height || null,
          requirements: editFormData.requirements || null,
          additionalNotes: editFormData.additionalNotes || null,
          sidesClassificationOptionId:
            editFormData.sidesClassificationOptionId || null,
          processClassificationOptionId:
            editFormData.processClassificationOptionId || null,
        },
      });
      toast.success("Thành công", {
        description: "Đã cập nhật thông tin thiết kế",
      });
      setIsEditing(false);
      refetchDesign();
    } catch {
      toast.error("Lỗi", {
        description: "Không thể cập nhật thiết kế. Vui lòng thử lại.",
      });
    }
  };

  const canEditDesign =
    (user?.role === ROLE.DESIGN ||
      user?.role === ROLE.DESIGN_LEAD ||
      user?.role === ROLE.ADMIN) &&
    !hasProofingOrder;

  // ==== LOADING / ERROR ====
  if (designLoading) {
    return (
      <div className="h-[calc(100vh-var(--header-height,64px))] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (designError || !design) {
    return (
      <div className="h-[calc(100vh-var(--header-height,64px))] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {designError ? (
            (() => {
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
            })()
          ) : (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold truncate">
                    Không tìm thấy
                  </h3>
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
          )}
        </div>
      </div>
    );
  }

  const d = design as DesignResponse;

  // ==== MAIN LAYOUT ====
  return (
    <ErrorBoundary>
      <div className="h-[calc(100vh-var(--header-height,64px))] flex flex-col bg-background overflow-hidden">
        {/* ===== HEADER ===== */}
        <header className="shrink-0 border-b bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-2 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => router(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">
                {d.code ?? `DES-${d.id}`}
              </h1>
              <StatusBadge
                status={currentStatus}
                label={designStatusLabels[currentStatus]}
                className="shrink-0"
              />
              {d.designName && (
                <span className="text-xs text-muted-foreground truncate hidden sm:block">
                  • {d.designName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canChangeStatus && validNextStatuses.length > 0 && (
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handleStatusTransition(validNextStatuses[0])}
                  disabled={
                    updatingStatus || !canTransitionTo(validNextStatuses[0])
                  }
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {designStatusLabels[validNextStatuses[0]]}
                  </span>
                </Button>
              )}

              {canExportDocuments && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportInvoice}
                    disabled={exportingInvoice}
                    className="h-8 gap-1.5"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Hóa đơn</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportDeliveryNote}
                    disabled={exportingDeliveryNote}
                    className="h-8 gap-1.5"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Giao hàng</span>
                  </Button>
                </>
              )}

              {canCompleteOrder && (
                <Button
                  size="sm"
                  onClick={handleCompleteOrder}
                  disabled={updatingOrder}
                  className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Hoàn thành</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* ===== BODY: 2 COLUMNS ===== */}
        <div className="flex-1 flex min-h-0">
          {/* ===== LEFT: INFO & SPECS ===== */}
          <div className="basis-1/2 min-w-0 border-r flex flex-col min-h-0 bg-card/30">
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                {/* Design summary */}
                <DesignCode
                  code={d.code}
                  designName={d.designName}
                  dimensions={d.dimensions}
                  extraNote={d.extraNote as string}
                  createdAt={d.createdAt}
                />

                {/* Designer info */}
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {d.designer?.fullName ?? "Chưa phân công"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {d.designer?.email ??
                            d.designer?.phone ??
                            "Chưa có thông tin"}
                        </p>
                      </div>
                      {canEditDesign && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={handleStartEdit}
                          title="Chỉnh sửa thiết kế"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status transition helper */}
                {canChangeStatus && (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Workflow className="h-4 w-4 text-primary" />
                        Chuyển trạng thái
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {needsDesignFile && (
                        <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-xs">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-amber-800 dark:text-amber-200">
                            Cần upload file thiết kế trước khi chuyển sang trạng
                            thái &quot;Chờ khách duyệt&quot;.
                          </p>
                        </div>
                      )}

                      <div className="grid gap-2">
                        {validNextStatuses.map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            variant={
                              nextStatus === "confirmed_for_printing"
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleStatusTransition(nextStatus)}
                            disabled={
                              updatingStatus || !canTransitionTo(nextStatus)
                            }
                            className={`w-full justify-start gap-2 h-10 ${
                              nextStatus === "confirmed_for_printing"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "hover:bg-primary/5"
                            }`}
                          >
                            <ArrowRight className="h-4 w-4" />
                            <span className="font-medium">
                              {designStatusLabels[nextStatus]}
                            </span>
                          </Button>
                        ))}
                      </div>

                      {updatingStatus && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Đang cập nhật trạng thái...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tabs: Specs / Material / Process */}
                <Tabs defaultValue="specs" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/50">
                    <TabsTrigger
                      value="specs"
                      className="text-xs gap-1.5 data-[state=active]:bg-background"
                    >
                      <Ruler className="h-4 w-4" />
                      Kích thước
                    </TabsTrigger>
                    <TabsTrigger
                      value="material"
                      className="text-xs gap-1.5 data-[state=active]:bg-background"
                    >
                      <Layers className="h-4 w-4" />
                      Vật liệu
                    </TabsTrigger>
                    <TabsTrigger
                      value="process"
                      className="text-xs gap-1.5 data-[state=active]:bg-background"
                    >
                      <Settings className="h-4 w-4" />
                      Quy trình
                    </TabsTrigger>
                  </TabsList>

                  {/* Specs */}
                  <TabsContent value="specs" className="mt-4 space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Dài (mm)</Label>
                            <Input
                              type="number"
                              value={editFormData.length || ""}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  length:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                }))
                              }
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Rộng (mm)</Label>
                            <Input
                              type="number"
                              value={editFormData.width || ""}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  width:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                }))
                              }
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Cao (mm)</Label>
                            <Input
                              type="number"
                              value={editFormData.height || ""}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  height:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                }))
                              }
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                            disabled={updateDesign.isPending}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateDesign.isPending}
                            className="flex-1"
                          >
                            {updateDesign.isPending ? "Đang lưu..." : "Lưu"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Kích thước tổng thể
                          </span>
                          {canEditDesign && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs gap-1"
                              onClick={handleStartEdit}
                            >
                              <Pencil className="h-3 w-3" />
                              Sửa
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                              {d.length ?? "—"}
                            </p>
                            <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-1 font-medium">
                              Dài (mm)
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                            <p className="text-xl font-bold text-green-900 dark:text-green-100">
                              {d.width ?? "—"}
                            </p>
                            <p className="text-[10px] text-green-700 dark:text-green-300 mt-1 font-medium">
                              Rộng (mm)
                            </p>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                            <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                              {d.height ?? "—"}
                            </p>
                            <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-1 font-medium">
                              Cao (mm)
                            </p>
                          </div>
                        </div>

                        {d.areaCm2 != null && typeof d.areaCm2 === "number" && (
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800 text-sm">
                            <span className="font-medium text-green-900 dark:text-green-100">
                              Diện tích
                            </span>
                            <span className="font-bold text-green-700 dark:text-green-300">
                              {(d.areaCm2 / 100).toFixed(2)} cm²
                            </span>
                          </div>
                        )}

                        {orderDetails?.[0]?.quantity && (
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              Số lượng
                            </span>
                            <span className="font-bold text-blue-700 dark:text-blue-300">
                              {orderDetails[0].quantity.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Material */}
                  <TabsContent value="material" className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
                        <CardContent className="p-4">
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 uppercase mb-2 font-semibold">
                            Loại thiết kế
                          </p>
                          <p className="font-bold text-sm text-purple-900 dark:text-purple-100">
                            {d.designType?.name ?? "—"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
                        <CardContent className="p-4">
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase mb-2 font-semibold">
                            Chất liệu
                          </p>
                          <p className="font-bold text-sm text-amber-900 dark:text-amber-100">
                            {d.materialType?.name ?? "—"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Process */}
                  <TabsContent value="process" className="mt-4 space-y-3">
                    {(d.sidesClassification || d.sidesClassificationOption) && (
                      <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground uppercase mb-1.5 font-semibold">
                            Mặt cắt
                          </p>
                          <p className="text-sm font-semibold">
                            {d.sidesClassification
                              ? sidesClassificationLabels[
                                  d.sidesClassification
                                ] || d.sidesClassification
                              : (
                                  d.sidesClassificationOption as
                                    | { value?: string }
                                    | undefined
                                )?.value || "—"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {(d.processClassification ||
                      d.processClassificationOption) && (
                      <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground uppercase mb-1.5 font-semibold">
                            Quy trình SX
                          </p>
                          <p className="text-sm font-semibold">
                            {d.processClassification
                              ? processClassificationLabels[
                                  d.processClassification
                                ] || d.processClassification
                              : (
                                  d.processClassificationOption as
                                    | { value?: string }
                                    | undefined
                                )?.value || "—"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {(d.laminationType ||
                      orderDetails?.[0]?.laminationType) && (
                      <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground uppercase mb-1.5 font-semibold">
                            Cán màn
                          </p>
                          <p className="text-sm font-semibold">
                            {laminationTypeLabels[
                              (d.laminationType ||
                                orderDetails?.[0]?.laminationType) as string
                            ] || "—"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Notes */}
                {(d.notes || d.latestRequirements) && (
                  <Collapsible
                    open={expandedSections.notes}
                    onOpenChange={(open) =>
                      setExpandedSections((prev) => ({ ...prev, notes: open }))
                    }
                  >
                    <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/30 dark:hover:to-orange-950/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            Ghi chú &amp; Yêu cầu
                          </span>
                        </div>
                        {expandedSections.notes ? (
                          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="p-4 space-y-4 border-t border-amber-200 dark:border-amber-800">
                          {d.notes && (
                            <div>
                              <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase mb-2 font-semibold">
                                Ghi chú
                              </p>
                              <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100 leading-relaxed">
                                {d.notes}
                              </p>
                            </div>
                          )}
                          {d.latestRequirements && (
                            <div>
                              <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase mb-2 font-semibold">
                                Yêu cầu
                              </p>
                              <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100 leading-relaxed">
                                {d.latestRequirements}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <div>
                      <p className="font-medium">Tạo</p>
                      <p className="text-[10px]">
                        {d.createdAt
                          ? new Date(d.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <div>
                      <p className="font-medium">Cập nhật</p>
                      <p className="text-[10px]">
                        {d.updatedAt
                          ? new Date(d.updatedAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* ===== RIGHT: FILE & TIMELINE ===== */}
          <div className="basis-1/2 flex flex-col min-h-0 min-w-0">
            {/* Header actions */}
            <div className="shrink-0 px-5 py-3 border-b bg-card/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <FileImage className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="font-semibold text-base">
                  File thiết kế &amp; Timeline
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFileUpload(true)}
                    className="h-9 gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {d.designFileUrl ? "Thay file" : "Upload file"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowTimelineDialog(true)}
                    className="h-9 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm timeline
                  </Button>
                </div>
                {needsDesignFile && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Bắt buộc có file thiết kế để chuyển trạng thái.
                  </p>
                )}
              </div>
            </div>

            {/* Content: left preview, right timeline */}
            <div className="flex-1 min-h-0 flex">
              {/* File preview */}
              <div className="w-[320px] shrink-0 border-r p-4 flex flex-col gap-4 bg-muted/20">
                {!d.designFileUrl ? (
                  <Card
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => setShowFileUpload(true)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <UploadCloud className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm font-semibold mb-1">
                        Chưa có file thiết kế
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        Click để upload file thiết kế
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="overflow-hidden border-2 hover:border-violet-500 transition-colors">
                      <div
                        className="relative aspect-square cursor-pointer group"
                        onClick={() =>
                          d.designImageUrl &&
                          setViewingImage({
                            url: d.designImageUrl,
                            title: "File thiết kế",
                          })
                        }
                      >
                        <img
                          src={d.designImageUrl || "/placeholder.svg"}
                          alt="Design preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <Eye className="h-8 w-8 text-white" />
                            <span className="text-xs text-white font-medium">
                              Xem ảnh lớn
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold truncate">
                          {d.designFileUrl?.split("/").pop()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {d.designFileUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 gap-2"
                              onClick={() =>
                                d.designFileUrl &&
                                downloadFile(
                                  d.designFileUrl,
                                  d.code || `DES-${d.id}`
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                              AI
                            </Button>
                          )}
                          {d.excelFileUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 gap-2"
                              onClick={() =>
                                d.excelFileUrl &&
                                downloadFile(
                                  d.excelFileUrl,
                                  `${d.code || `DES-${d.id}`}.xlsx`
                                )
                              }
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                              Excel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Timeline */}
              <ScrollArea className="flex-1">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-base">
                        Timeline tiến trình
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({timelineEntries.length} mục)
                      </span>
                    </div>
                    {timelineLoading && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Đang tải timeline...
                      </span>
                    )}
                  </div>

                  {timelineLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                    </div>
                  ) : timelineError ? (
                    <div className="p-4 border border-destructive/30 rounded-lg flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Không thể tải timeline. Vui lòng thử lại.
                        </p>
                        <Button
                          size="sm"
                          variant="link"
                          className="px-0 h-6 text-xs"
                          onClick={() => refetchTimeline()}
                        >
                          Thử lại
                        </Button>
                      </div>
                    </div>
                  ) : timelineEntries.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-400 transition-colors"
                      onClick={() => setShowTimelineDialog(true)}
                    >
                      <History className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">Chưa có timeline</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click để thêm mới
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-purple-300 via-purple-400 to-purple-300 dark:from-purple-800 dark:via-purple-600 dark:to-purple-800" />

                      <div className="space-y-4 pl-2">
                        {timelineEntries.map((entry, index) => (
                          <div
                            key={entry.id}
                            className="relative flex gap-4 group"
                          >
                            {/* Dot */}
                            <div className="relative z-10 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-background shadow-md flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">
                                  {index + 1}
                                </span>
                              </div>
                            </div>

                            {/* Card */}
                            <Card className="flex-1 group-hover:border-purple-400/70 transition-colors">
                              <CardContent className="p-4 flex gap-3">
                                {entry.imageUrl && (
                                  <button
                                    type="button"
                                    className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted shrink-0 group/image"
                                    onClick={() =>
                                      setViewingImage({
                                        url: entry.imageUrl as string,
                                        title: `Timeline #${index + 1}`,
                                      })
                                    }
                                  >
                                    <img
                                      src={entry.imageUrl as string}
                                      alt={`Timeline ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                      <Eye className="h-4 w-4 text-white" />
                                    </div>
                                  </button>
                                )}

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {(entry.title as string) ||
                                        `Bước ${index + 1}`}
                                    </p>
                                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                      {entry.createdAt
                                        ? new Date(
                                            entry.createdAt
                                          ).toLocaleString("vi-VN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : ""}
                                    </span>
                                  </div>
                                  {entry.description && (
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {entry.description}
                                    </p>
                                  )}
                                  {entry.createdByName && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Người tạo:{" "}
                                      <span className="font-medium">
                                        {entry.createdByName as string}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* ===== DIALOGS ===== */}
        {viewingImage && (
          <ImageViewerDialog
            open={!!viewingImage}
            onOpenChange={(open) => {
              if (!open) setViewingImage(null);
            }}
            imageUrl={viewingImage.url}
            title={viewingImage.title}
          />
        )}

        <DesignFileUploadDialog
          open={showFileUpload}
          onOpenChange={setShowFileUpload}
          onUpload={handleDesignFileUpload}
        />

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
              <AlertDialogTitle>Xác nhận đổi trạng thái</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn chuyển trạng thái thiết kế từ{" "}
                <span className="font-medium">
                  {designStatusLabels[currentStatus]}
                </span>{" "}
                sang{" "}
                <span className="font-medium">
                  {pendingStatus
                    ? designStatusLabels[pendingStatus]
                    : "trạng thái mới"}
                </span>
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatingStatus}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Đang cập nhật..." : "Xác nhận"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
}
