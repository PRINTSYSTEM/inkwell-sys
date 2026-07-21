import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMaterialSpecsByMaterialType } from "@/hooks/use-material-spec";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TruncatedText } from "@/components/ui/truncated-text";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useDesign,
  useDesignTimeline,
  useUploadDesignFile,
  useUploadDesignImage,
  useAddDesignTimelineEntry,
  useUpdateDesign,
  useReprintDesign,
  useCancelDesign,
  useMarkDesignUrgent,
  useUpdateDesignCode,
} from "@/hooks/use-design";
import { useMaterialsByDesignType } from "@/hooks/use-material-type";
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
  XCircle,
  Zap,
  Flame,
} from "lucide-react";

import {
  type DesignStatus,
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
  designStatusConfig,
  designStatusLabels,
} from "@/lib/status-utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import type { OrderDetailResponse } from "@/Schema";
import DesignCodeGeneratorComponent from "@/components/DesignCodeGenerator";
import DesignCode from "@/components/design/design-code";
import { downloadFile } from "@/lib/download-utils";

// Helper functions to check design type
const isNhanDesignType = (designTypeName: string | undefined): boolean => {
  if (!designTypeName) return false;
  return (
    designTypeName.toLowerCase().includes("nhãn") ||
    designTypeName.toLowerCase().includes("nhan")
  );
};

const isHopDesignType = (designTypeName: string | undefined): boolean => {
  if (!designTypeName) return false;
  return (
    designTypeName.toLowerCase().includes("hộp") ||
    designTypeName.toLowerCase().includes("hop")
  );
};

const isTuiXepHongDesignType = (
  designTypeName: string | undefined
): boolean => {
  if (!designTypeName) return false;
  return (
    designTypeName.toLowerCase().includes("túi xếp hông") ||
    designTypeName.toLowerCase().includes("tui xep hong") ||
    designTypeName.toLowerCase().includes("túi xếp") ||
    designTypeName.toLowerCase().includes("tui xep")
  );
};

const isTuiDesignType = (designTypeName: string | undefined): boolean => {
  if (!designTypeName) return false;
  return (
    designTypeName.toLowerCase().includes("túi") ||
    designTypeName.toLowerCase().includes("tui")
  );
};

const isTuiCuonDesignType = (designTypeName: string | undefined): boolean => {
  if (!designTypeName) return false;
  return (
    designTypeName.toLowerCase().includes("cuộn") ||
    designTypeName.toLowerCase().includes("cuon")
  );
};

const isDecalDesignType = (designTypeName: string | undefined): boolean => {
  if (!designTypeName) return false;
  return designTypeName.toLowerCase().includes("decal");
};

const isDecalCuonDesignType = (designTypeName: string | undefined): boolean => {
  if (!designTypeName) return false;
  return (
    designTypeName.toLowerCase().includes("decal") &&
    (designTypeName.toLowerCase().includes("cuộn") ||
      designTypeName.toLowerCase().includes("cuon"))
  );
};

function getTimelineVisual(entry: DesignTimelineEntryResponse) {
  const description = (entry.description as string | undefined) || "";
  const normalized = description.toLowerCase();
  type TimelineEntryLike = { imageUrl?: string; fileUrl?: string };
  const e = entry as TimelineEntryLike;
  const hasImage = Boolean(e.imageUrl || e.fileUrl);

  if (hasImage) {
    return {
      variant: "image" as const,
      badgeClass:
        "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-100 border-violet-200 dark:border-violet-700",
      dotClass:
        "bg-gradient-to-br from-violet-500 to-violet-600 border-violet-300 dark:border-violet-700",
      icon: ImageIcon,
      label: "Ảnh / file",
    };
  }

  if (normalized.includes("trạng thái") || normalized.includes("status")) {
    return {
      variant: "status" as const,
      badgeClass:
        "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 border-emerald-200 dark:border-emerald-700",
      dotClass:
        "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-300 dark:border-emerald-700",
      icon: CheckCircle2,
      label: "Trạng thái",
    };
  }

  return {
    variant: "note" as const,
    badgeClass:
      "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-100 border-blue-200 dark:border-blue-700",
    dotClass:
      "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 dark:border-blue-700",
    icon: FileText,
    label: "Ghi chú",
  };
}

function groupTimelineByDate(entries: DesignTimelineEntryResponse[]) {
  const groups: { date: string; items: DesignTimelineEntryResponse[] }[] = [];
  const map = new Map<string, DesignTimelineEntryResponse[]>();

  entries.forEach((entry) => {
    const createdAt = entry.createdAt as string | undefined;
    const dateKey = createdAt ? createdAt.slice(0, 10) : "Khác";
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)?.push(entry);
  });

  for (const [date, items] of map.entries()) {
    groups.push({ date, items });
  }

  return groups;
}

function formatTimelineDateLabel(date: string) {
  if (date === "Khác") return "Khác";
  try {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

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
  const [reprintDialogOpen, setReprintDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reprintQuantity, setReprintQuantity] = useState(1000);
  const [reprintNotes, setReprintNotes] = useState("");
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingOverPreview, setIsDraggingOverPreview] = useState(false);
  const [gusseted, setGusseted] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    designName: "",
    length: 0,
    width: 0,
    height: 0,
    adhesiveOffset: undefined as number | undefined,
    requirements: "",
    additionalNotes: "",
    requestedQuantity: undefined as number | undefined,
    materialTypeId: undefined as number | undefined,
    sidesClassificationOptionId: undefined as number | undefined,
    processClassificationOptionId: undefined as number | undefined,
    sidesClassification: "" as string | undefined,
    processClassification: "" as string | undefined,
    laminationType: "" as string | undefined,
    basisWeight: undefined as number | undefined,
  });

  // Load materials by design type to check material name during editing
  const { data: materialsByDesignType = [], isLoading: materialsLoading } =
    useMaterialsByDesignType(
      ((design as unknown as { designType?: { id?: number } })?.designType
        ?.id as number | undefined)
    );

  // Load material specifications for selected material type
  const { data: materialSpecs = [] } = useMaterialSpecsByMaterialType(
    editFormData.materialTypeId || null,
    !!editFormData.materialTypeId
  );

  const designTypeName = design?.designType?.name;
  const isDecal = isDecalDesignType(designTypeName);
  const isDecalCuon = isDecalCuonDesignType(designTypeName);

  const selectedMaterialName = isEditing
    ? (materialsByDesignType || []).find((m) => m.id === editFormData.materialTypeId)?.name || ""
    : (design as any)?.materialType?.name || "";

  const isDecalPaper = (isDecal || isDecalCuon) && (
    selectedMaterialName.toLowerCase().includes("giấy") ||
    selectedMaterialName.toLowerCase().includes("giay")
  );

  const hasSpecs = materialSpecs && materialSpecs.length > 0 && !isDecalPaper && !(
    materialSpecs.length === 1 &&
    (materialSpecs[0].basisWeight === 0 || materialSpecs[0].basisWeight === null || materialSpecs[0].basisWeight === undefined)
  );

  // Auto-select default basis weight when material specs load during editing
  useEffect(() => {
    if (isEditing && editFormData.materialTypeId && materialSpecs.length > 0) {
      if (!hasSpecs) {
        setEditFormData((prev) => ({ ...prev, basisWeight: undefined }));
      } else {
        if (editFormData.basisWeight === undefined || editFormData.basisWeight === null || editFormData.basisWeight === 0) {
          const defaultSpec = materialSpecs.find((spec) => spec.isDefault);
          if (defaultSpec && defaultSpec.basisWeight !== undefined) {
            setEditFormData((prev) => ({ ...prev, basisWeight: defaultSpec.basisWeight }));
          } else if (materialSpecs.length === 1 && materialSpecs[0].basisWeight !== undefined) {
            setEditFormData((prev) => ({ ...prev, basisWeight: materialSpecs[0].basisWeight }));
          }
        }
      }
    }
  }, [editFormData.materialTypeId, materialSpecs, isEditing, hasSpecs, editFormData.basisWeight]);

  // Reset basisWeight when materialTypeId changes during edit
  useEffect(() => {
    if (isEditing && design) {
      const designMaterialId = (design.materialTypeId as number | undefined) ||
        ((design.materialType as unknown as { id?: number })?.id as number | undefined);
      if (editFormData.materialTypeId !== designMaterialId) {
        setEditFormData((prev) => ({ ...prev, basisWeight: undefined }));
      }
    }
  }, [editFormData.materialTypeId, isEditing, design]);

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
  const reprintDesignMutation = useReprintDesign();
  const cancelDesign = useCancelDesign();
  const markUrgentMutation = useMarkDesignUrgent();
  const [markingUrgent, setMarkingUrgent] = useState(false);
  const updateDesignCodeMutation = useUpdateDesignCode();
  const [editCodeDialogOpen, setEditCodeDialogOpen] = useState(false);
  const [newDesignCode, setNewDesignCode] = useState("");

  // Filter active materials or the currently selected material of this design (even if inactive)
  const filteredDropdownMaterials = useMemo(() => {
    const currentMaterialId =
      (design?.materialTypeId as number | undefined) ||
      ((design?.materialType as unknown as { id?: number })?.id as
        | number
        | undefined);

    return (materialsByDesignType || []).filter(
      (mt) => mt.status === "active" || mt.id === currentMaterialId
    );
  }, [materialsByDesignType, design]);


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
    user?.role === ROLE.SALE ||
    user?.role === ROLE.ADMIN;

  const canChangeStatus =
    canUpdateStatus &&
    !isFinalStatus(currentStatus) &&
    validNextStatuses.length > 0;

  const canTransitionTo = (targetStatus: DesignStatus): boolean => {
    void targetStatus;
    return true;
  };

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

  const handleMarkUrgent = async () => {
    if (!designId) return;
    setMarkingUrgent(true);
    try {
      await markUrgentMutation.mutate(designId);
      refetchDesign();
    } catch {
      // handled in hook
    } finally {
      setMarkingUrgent(false);
    }
  };

  const handleOpenEditCode = () => {
    if (d.code) {
      setNewDesignCode(d.code);
    } else {
      setNewDesignCode("");
    }
    setEditCodeDialogOpen(true);
  };

  const handleSaveCode = async () => {
    if (!newDesignCode.trim()) {
      toast.error("Vui lòng nhập mã thiết kế");
      return;
    }
    try {
      await updateDesignCodeMutation.mutate({
        id: designId,
        code: newDesignCode.trim(),
      });
      setEditCodeDialogOpen(false);
      refetchDesign();
    } catch {
      // handled in hook
    }
  };

  // ==== HANDLERS - STATUS ====
  const handleStatusTransition = async (targetStatus: DesignStatus) => {
    if (!targetStatus || !design) return;

    if (!isValidStatusTransition(currentStatus, targetStatus)) {
      const errorMessage = getTransitionErrorMessage(
        currentStatus,
        targetStatus
      );

      toast.error("Không thể thay đổi trạng thái", {
        description: errorMessage,
      });
      return;
    }

    setUpdatingStatus(true);

    try {
      await updateDesign.mutateAsync({
        id: designId,
        data: {
          designStatus: targetStatus,
          requestedQuantity:
            typeof design.requestedQuantity === "number"
              ? design.requestedQuantity
              : null,
        },
        suppressToast: true,
      });

      toast.success("Thành công", {
        description: `Trạng thái đã được cập nhật thành ${designStatusLabels[targetStatus]}`,
      });

      refetchDesign();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message;
      if (
        (targetStatus === "confirmed_for_printing" && msg === "debt_exceeded") ||
        msg?.toLowerCase().includes("debt")
      ) {
        toast.error("Không thể chốt in", {
          description:
            "Khách hàng đang vượt hạn mức công nợ. Vui lòng kiểm tra lại công nợ trước khi chốt in.",
        });
      } else {
        toast.error("Lỗi", {
          description: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
        });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==== HANDLERS - FILE & TIMELINE ====
  // Helper function to check if file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  // Helper function to check if file is a design file (.ai)
  const isDesignFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith(".ai") || file.type === "application/postscript";
  };

  const handleDesignFileUpload = async (files: File[]) => {
    if (!enabled) return;

    // Phân loại files
    const designFiles = files.filter((f) => isDesignFile(f));
    const imageFiles = files.filter((f) => isImageFile(f));

    if (designFiles.length === 0 && imageFiles.length === 0) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn ít nhất 1 file ảnh hoặc file thiết kế (.ai)",
      });
      return;
    }

    const errors: string[] = [];
    const successes: string[] = [];

    // Upload file thiết kế
    if (designFiles.length > 0) {
      try {
        await uploadFile({ id: designId, file: designFiles[0] });
        successes.push(`File thiết kế: ${designFiles[0].name}`);
      } catch (error) {
        errors.push(`File thiết kế "${designFiles[0].name}" lỗi`);
      }
    }

    // Upload ảnh
    if (imageFiles.length > 0) {
      try {
        await uploadImage({ id: designId, file: imageFiles[0] });
        successes.push(`Ảnh: ${imageFiles[0].name}`);
      } catch (error) {
        errors.push(`Ảnh "${imageFiles[0].name}" lỗi`);
      }
    }

    // Hiển thị thông báo kết quả
    if (errors.length === 0) {
      toast.success("Thành công", {
        description: "Đã tải lên file đã chọn",
      });
      refetchDesign();
    } else if (successes.length > 0) {
      toast.warning("Một phần thành công", {
        description: `${successes.join(", ")}. Lỗi: ${errors.join(", ")}`,
      });
      refetchDesign();
    } else {
      toast.error("Lỗi", {
        description: errors.join(", "),
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleDesignFileUpload(files);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!enabled) return;

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      await handleDesignFileUpload(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleTimelineAdd = async (image: File, description: string) => {
    if (!enabled) return;
    try {
      // Call mutate and wait for it to complete
      const result = await addTimeline({
        id: designId,
        file: image,
        description,
      });
      setShowTimelineDialog(false);

      // Refetch timeline to update the list
      const { data: updatedTimelineData } = await refetchTimeline();

      // Open image viewer dialog to show the uploaded image
      // Use result.imageUrl if available, otherwise get from the first entry in updated timeline
      const imageUrl =
        result?.fileUrl || updatedTimelineData?.items?.[0]?.fileUrl;
      if (imageUrl) {
        setViewingImage({
          url: imageUrl as string,
          title: description || "Timeline mới",
        });
      }

      toast.success("Thành công", {
        description: "Đã thêm timeline mới",
      });
    } catch {
      toast.error("Lỗi", {
        description: "Không thể thêm timeline",
      });
    }
  };

  // ==== HANDLERS - EDIT DESIGN ====
  const handleStartEdit = () => {
    if (!design) return;
    setGusseted(design.width ? design.width > 0 : false);
    setEditFormData({
      designName: design.designName || "",
      length: design.length || 0,
      width: design.width || 0,
      height: design.height || 0,
      adhesiveOffset:
        (design.adhesiveOffset as number | undefined) || undefined,
      requestedQuantity: (design.requestedQuantity as number | undefined) || undefined,
      requirements: design.latestRequirements || "",
      additionalNotes: design.notes || "",
      materialTypeId:
        (design.materialTypeId as number | undefined) ||
        ((design.materialType as unknown as { id?: number })?.id as
          number | undefined) ||
        undefined,
      sidesClassificationOptionId:
        (design.sidesClassificationOptionId as number | undefined) || undefined,
      processClassificationOptionId:
        (design.processClassificationOptionId as number | undefined) ||
        undefined,
      sidesClassification:
        (design.sidesClassification as string | undefined) || "",
      processClassification:
        (design.processClassification as string | undefined) || "",
      laminationType:
        (design.laminationType as string | undefined) ||
        (orderDetails?.[0]?.laminationType as string | undefined) ||
        "",
      basisWeight: design.basisWeight || undefined,
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
      adhesiveOffset: undefined,
      requestedQuantity: undefined,
      requirements: "",
      additionalNotes: "",
      materialTypeId: undefined,
      sidesClassificationOptionId: undefined,
      processClassificationOptionId: undefined,
      sidesClassification: "",
      processClassification: "",
      laminationType: "",
      basisWeight: undefined,
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
          adhesiveOffset: editFormData.adhesiveOffset ?? null,
          requestedQuantity:
            currentStatus === "confirmed_for_printing"
              ? ((design.requestedQuantity as number | undefined) ?? null)
              : typeof editFormData.requestedQuantity === "number"
              ? editFormData.requestedQuantity
              : null,
          requirements: editFormData.requirements || null,
          additionalNotes: editFormData.additionalNotes || null,
          materialTypeId: editFormData.materialTypeId || null,
          sidesClassificationOptionId:
            editFormData.sidesClassificationOptionId || null,
          processClassificationOptionId:
            editFormData.processClassificationOptionId || null,
          sidesClassification: editFormData.sidesClassification || null,
          processClassification: editFormData.processClassification || null,
          laminationType: editFormData.laminationType || null,
          basisWeight: editFormData.basisWeight ?? null,
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

  const handleReprintSubmit = async () => {
    if (!reprintQuantity || reprintQuantity <= 0) return;
    try {
      await reprintDesignMutation.mutate({
        id: designId,
        quantity: reprintQuantity,
        notes: reprintNotes.trim() || undefined
      });
      setReprintDialogOpen(false);
    } catch {
      // Handled in mutation hook toast
    }
  };

  const handleCancelSubmit = async () => {
    try {
      await cancelDesign.mutate(designId);
      setCancelDialogOpen(false);
      refetchDesign();
    } catch {
      // Handled in mutation hook toast
    }
  };

  const canEditDesign =
    (user?.role === ROLE.DESIGN ||
      user?.role === ROLE.DESIGN_LEAD ||
      user?.role === ROLE.SALE ||
      user?.role === ROLE.ADMIN) &&
    !hasProofingOrder &&
    currentStatus !== "confirmed_for_printing" &&
    currentStatus !== "cancelled";

  const canEditCode =
    user?.role === ROLE.DESIGN ||
    user?.role === ROLE.DESIGN_LEAD ||
    user?.role === ROLE.ADMIN;

  // Calculate dimensions - must be before early returns to maintain hook order
  const calculatedDimensions = useMemo(() => {
    if (!design) return "";
    const d = design as DesignResponse;
    return d.width
      ? `${d.length ?? ""} x ${d.width ?? ""} x ${d.height ?? ""}`
      : `${d.length ?? ""} x ${d.height ?? ""}`;
  }, [design, design?.length, design?.width, design?.height]);

  // ==== LOADING / ERROR ====
  if (designLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (designError || !design) {
    return (
      <div className="h-full flex items-center justify-center p-6">
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

  // Check design type for conditional editing
  const isNhan = isNhanDesignType(designTypeName);
  const isHop = isHopDesignType(designTypeName);
  const isTui = isTuiDesignType(designTypeName);
  const isTuiCuon = isTuiCuonDesignType(designTypeName);
  const isTuiXepHong =
    isTuiXepHongDesignType(designTypeName) ||
    (isTui && (isEditing ? gusseted : (d.width ?? 0) > 0));
  const canEditWidth = isHop || isTuiXepHong; // Only box and side-fold bag can edit width
  const canEditAdhesiveOffset = isNhan; // Only label can edit adhesive offset
  const showBasisWeight = !!(isEditing ? hasSpecs : (d.basisWeight && d.basisWeight > 0 && !isDecalPaper));

  // ==== MAIN LAYOUT ====
  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col bg-background overflow-hidden">


        {/* ===== BODY: 2 COLUMNS ===== */}
        <div className="flex-1 flex min-h-0">
          {/* ===== LEFT: INFO & SPECS ===== */}
          <div className="flex-[7] min-w-0 border-r flex flex-col min-h-0 bg-card/30">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {/* Design summary */}
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 mt-0.5"
                    onClick={() => router(-1)}
                    title="Quay lại"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <DesignCode
                      code={d.code}
                      designName={d.designName}
                      dimensions={calculatedDimensions}
                      extraNote={d.extraNote as string}
                      createdAt={d.createdAt}
                      adhesiveOffset={d.adhesiveOffset}
                      customerName={d.customer?.companyName || d.customer?.name || order?.customerName || order?.customer?.companyName || order?.customer?.name}
                      designerName={d.designer?.fullName ?? "Chưa phân công"}
                      showCopy={false}
                      updatedAt={d.updatedAt}
                      onEditCode={canEditCode ? handleOpenEditCode : undefined}
                    />
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

                {/* Status transition helper / Actions */}
                {(canChangeStatus || canExportDocuments || canCompleteOrder || currentStatus === "confirmed_for_printing") && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        {design?.isUrgent ? (
                          <Badge variant="destructive" className="h-8 gap-1.5 px-3 font-semibold text-xs flex items-center bg-red-600 hover:bg-red-600 text-white shadow-md border-red-500">
                            <Flame className="h-3.5 w-3.5 text-red-200 animate-bounce" />
                            <span>HÀNG GẤP</span>
                          </Badge>
                        ) : (
                          currentStatus === "confirmed_for_printing" && (
                            <Button
                              size="sm"
                              className="gap-1.5 h-8 font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                              onClick={handleMarkUrgent}
                              disabled={markingUrgent}
                            >
                              <Zap className="h-3.5 w-3.5 text-amber-100" />
                              <span>Báo Gấp</span>
                            </Button>
                          )
                        )}
                        {canUpdateStatus && currentStatus !== "cancelled" && currentStatus !== "confirmed_for_printing" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setCancelDialogOpen(true)}
                            disabled={cancelDesign.loading || updatingStatus}
                          >
                            Hủy thiết kế
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Trạng thái hiện tại:
                        </span>
                        <StatusBadge
                          status={currentStatus}
                          label={designStatusLabels[currentStatus]}
                          className="text-sm font-bold px-2.5 py-0.5"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Next status transitions */}
                        {canChangeStatus && (
                          <>
                            {currentStatus === "waiting_for_customer_approval" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 h-8 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400"
                                  onClick={() => handleStatusTransition("editing")}
                                  disabled={updatingStatus}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Sửa thiết kế</span>
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleStatusTransition("confirmed_for_printing")}
                                  disabled={updatingStatus}
                                >
                                  <CheckCircleIcon className="h-3.5 w-3.5" />
                                  <span>Chốt in</span>
                                </Button>
                              </>
                            )}

                            {currentStatus !== "waiting_for_customer_approval" &&
                              currentStatus !== "confirmed_for_printing" &&
                              validNextStatuses.length > 0 &&
                              validNextStatuses.map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  onClick={() => handleStatusTransition(status)}
                                  disabled={updatingStatus}
                                >
                                  {designStatusLabels[status]}
                                </Button>
                              ))}
                          </>
                        )}

                        {/* Export & Complete Order actions */}
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
                              <span>Xuất Hóa đơn</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleExportDeliveryNote}
                              disabled={exportingDeliveryNote}
                              className="h-8 gap-1.5"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Phiếu Giao hàng</span>
                            </Button>
                          </>
                        )}

                        {canCompleteOrder && (
                          <Button
                            size="sm"
                            onClick={handleCompleteOrder}
                            disabled={updatingOrder}
                            className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            <span>Hoàn thành đơn hàng</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Specs / Material / Process - stacked (no tabs) */}
                <div className="space-y-3">
                  {/* Specs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-semibold">
                        Kích thước tổng thể
                      </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleCancelEdit}
                                className="h-9 text-sm font-bold px-4 shadow-sm"
                                disabled={updateDesign.isPending}
                              >
                                Hủy
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateDesign.isPending}
                                className="h-9 text-sm font-bold px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                              >
                                {updateDesign.isPending ? "Đang lưu..." : "Lưu"}
                              </Button>
                            </>
                          ) : (
                            canEditDesign && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-sm gap-1.5 border-primary text-primary hover:bg-primary/5 px-4 font-bold"
                                onClick={handleStartEdit}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Sửa
                              </Button>
                            )
                          )}
                        </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <div
                          className={`grid gap-2 ${canEditWidth ? "grid-cols-3" : "grid-cols-2"}`}
                        >
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dài (mm)</Label>
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
                              className="h-9 font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-1"
                            />
                          </div>
                          {canEditWidth && (
                            <div>
                              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rộng (mm)</Label>
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
                                className="h-9 font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-1"
                              />
                            </div>
                          )}
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cao (mm)</Label>
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
                              className="h-9 font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-1"
                            />
                          </div>
                        </div>
                        {canEditAdhesiveOffset && (
                          <div className="mt-2">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mép dán (mm)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={editFormData.adhesiveOffset || ""}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  adhesiveOffset:
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value),
                                }))
                              }
                              className="h-9 max-w-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-1"
                              min="0"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Khoảng cách từ mép đến vị trí dán keo (nếu có)
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            {d.adhesiveOffset != null &&
                              typeof d.adhesiveOffset === "number" &&
                              d.adhesiveOffset > 0 ? (
                              <div className="text-center">
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                  {d.length ?? "—"}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 font-semibold">
                                  Dài (mm)
                                </p>
                                <div className="mt-1 pt-1 border-t border-blue-200 dark:border-blue-700">
                                  <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight">
                                    <span className="font-medium">Bao gồm:</span>{" "}
                                    <span className="font-bold">
                                      {d.adhesiveOffset}mm
                                    </span>{" "}
                                    mép dán
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                  {d.length ?? "—"}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 font-semibold">
                                  Dài (mm)
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                            <p className="text-xl font-bold text-green-900 dark:text-green-100">
                              {d.width ?? "—"}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 font-semibold">
                              Rộng (mm)
                            </p>
                          </div>
                          <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                            <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                              {d.height ?? "—"}
                            </p>
                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 font-semibold">
                              Cao (mm)
                            </p>
                          </div>
                        </div>

                        {d.adhesiveOffset != null &&
                          typeof d.adhesiveOffset === "number" &&
                          d.adhesiveOffset > 0 && (
                            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border border-orange-200 dark:border-orange-800 text-sm mt-2">
                              <span className="font-semibold text-orange-900 dark:text-orange-100">
                                Mép dán
                              </span>
                              <span className="font-bold text-orange-700 dark:text-orange-300">
                                {d.adhesiveOffset} mm
                              </span>
                            </div>
                          )}

                        {orderDetails?.[0]?.quantity && (
                          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              Số lượng
                            </span>
                            <span className="font-bold text-blue-700 dark:text-blue-300">
                              {typeof orderDetails[0].quantity === "number"
                                ? new Intl.NumberFormat("vi-VN").format(
                                  orderDetails[0].quantity
                                )
                                : orderDetails[0].quantity}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Material & Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    {/* Tên thiết kế */}
                    <Card className="col-span-12 md:col-span-8 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20">
                      <CardContent className="p-2.5">
                        <p className="text-xs text-teal-700 dark:text-teal-300 uppercase mb-1.5 font-bold">
                          Tên thiết kế
                        </p>
                        {isEditing && canEditDesign ? (
                          <Input
                            value={editFormData.designName || ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                designName: e.target.value,
                              }))
                            }
                            placeholder="Nhập tên thiết kế"
                            className="h-9 text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-1"
                            maxLength={255}
                          />
                        ) : (
                          <p className="font-bold text-sm text-teal-900 dark:text-teal-100 break-all">
                            {d.designName ?? "—"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Loại thiết kế */}
                    <Card className="col-span-12 md:col-span-4 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
                      <CardContent className="p-2.5">
                        <p className="text-xs text-purple-700 dark:text-purple-300 uppercase mb-1.5 font-bold">
                          Loại thiết kế
                        </p>
                        <p className="font-bold text-sm text-purple-900 dark:text-purple-100">
                          {d.designType?.name ?? "—"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Chất liệu */}
                    <Card
                      className={cn(
                        "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20",
                        showBasisWeight
                          ? "col-span-12 md:col-span-5"
                          : "col-span-12 md:col-span-8"
                      )}
                    >
                      <CardContent className="p-2.5 space-y-1.5">
                        <p className="text-xs text-amber-700 dark:text-amber-300 uppercase mb-1.5 font-bold">
                          Chất liệu
                        </p>
                        {isEditing && canEditDesign ? (
                          <Select
                            value={
                              editFormData.materialTypeId
                                ? String(editFormData.materialTypeId)
                                : ""
                            }
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                materialTypeId: value
                                  ? Number(value)
                                  : undefined,
                              }))
                            }
                            disabled={materialsLoading}
                          >
                            <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
                              <SelectValue
                                placeholder={
                                  materialsLoading
                                    ? "Đang tải chất liệu..."
                                    : "Chọn chất liệu"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredDropdownMaterials.map((mt) => (
                                <SelectItem key={mt.id} value={String(mt.id)}>
                                  {mt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-bold text-sm text-amber-900 dark:text-amber-100">
                            {d.materialType?.name ?? "—"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Định lượng (GSM) */}
                    {showBasisWeight && (
                      <Card className="col-span-12 md:col-span-3 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 animate-in fade-in duration-200">
                        <CardContent className="p-2.5 space-y-1.5">
                          <p className="text-xs text-amber-700 dark:text-amber-300 uppercase mb-1.5 font-bold">
                            Định lượng (GSM)
                          </p>
                          {isEditing && canEditDesign ? (
                            <Select
                              value={
                                editFormData.basisWeight
                                  ? String(editFormData.basisWeight)
                                  : ""
                              }
                              onValueChange={(value) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  basisWeight: value
                                    ? Number(value)
                                    : undefined,
                                }))
                              }
                            >
                              <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
                                <SelectValue placeholder="Chọn định lượng..." />
                              </SelectTrigger>
                              <SelectContent>
                                {materialSpecs.map((spec) => (
                                  <SelectItem key={spec.id} value={spec.basisWeight?.toString() || ""}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{spec.name || `${spec.basisWeight} ${spec.defaultUnit || "gsm"}`}</span>
                                      {spec.isDefault && (
                                        <Badge variant="outline" className="ml-2 border-amber-500 text-amber-500 bg-amber-50 text-[10px] scale-90 shrink-0">
                                          Mặc định
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="font-bold text-sm text-amber-900 dark:text-amber-100">
                              {d.basisWeight} gsm
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Requested Quantity */}
                    <Card className="col-span-12 md:col-span-4 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                      <CardContent className="p-2.5">
                        <p className="text-xs text-blue-700 dark:text-blue-300 uppercase mb-1.5 font-bold">
                          Số lượng
                        </p>
                        {isEditing && canEditDesign ? (
                          <Input
                            type="number"
                            min="0"
                            value={editFormData.requestedQuantity ?? ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                requestedQuantity:
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                              }))
                            }
                            className="h-9 w-full font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-1"
                          />
                        ) : (
                          <p className="font-bold text-sm text-blue-900 dark:text-blue-100">
                            {typeof d.requestedQuantity === "number"
                              ? new Intl.NumberFormat("vi-VN").format(
                                d.requestedQuantity
                              )
                              : "—"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Số mặt in */}
                    {(d.sidesClassification || d.sidesClassificationOption) && (
                      <Card className="col-span-12 md:col-span-3 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-2.5">
                          <p className="text-xs text-muted-foreground uppercase mb-1 font-bold">
                            {d.designType?.name?.toLowerCase().includes("decal") ? "Loại sản phẩm" : "Số mặt in"}
                          </p>
                          {isEditing && canEditDesign ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.entries(sidesClassificationLabels).map(
                                ([value, label]) => {
                                  const displayLabel =
                                    d.designType?.name?.toLowerCase().includes("decal")
                                      ? value === "one_side"
                                        ? "Decal lẻ"
                                        : value === "two_side"
                                          ? "Decal bộ"
                                          : label
                                      : label;
                                  return (
                                    <Button
                                      key={value}
                                      size="sm"
                                      variant={
                                        editFormData.sidesClassification ===
                                          value
                                          ? "default"
                                          : "outline"
                                      }
                                      className="h-7 px-2 text-xs rounded-full"
                                      onClick={() =>
                                        setEditFormData((prev) => ({
                                          ...prev,
                                          sidesClassification: value,
                                        }))
                                      }
                                    >
                                      {displayLabel}
                                    </Button>
                                  );
                                }
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-bold">
                              {d.sidesClassification
                                ? d.designType?.name?.toLowerCase().includes("decal")
                                  ? d.sidesClassification === "one_side"
                                    ? "Decal lẻ"
                                    : d.sidesClassification === "two_side"
                                      ? "Decal bộ"
                                      : sidesClassificationLabels[
                                      d.sidesClassification
                                      ] || d.sidesClassification
                                  : sidesClassificationLabels[
                                  d.sidesClassification
                                  ] || d.sidesClassification
                                : (
                                  d.sidesClassificationOption as
                                  | { value?: string }
                                  | undefined
                                )?.value || "—"}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Quy cách sản xuất */}
                    {(d.processClassification || d.processClassificationOption) && (
                      <Card className="col-span-12 md:col-span-3 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-2.5">
                          <p className="text-xs text-muted-foreground uppercase mb-1 font-bold">
                            Quy cách sản xuất
                          </p>
                          {isEditing && canEditDesign ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.entries(
                                processClassificationLabels
                              ).map(([value, label]) => (
                                <Button
                                  key={value}
                                  size="sm"
                                  variant={
                                    editFormData.processClassification ===
                                      value
                                      ? "default"
                                      : "outline"
                                  }
                                  className="h-7 px-2 text-xs rounded-full"
                                  onClick={() =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      processClassification: value,
                                    }))
                                  }
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-bold">
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
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Cán màng */}
                    {(d.laminationType || orderDetails?.[0]?.laminationType) && (
                      <Card className="col-span-12 md:col-span-3 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-2.5">
                          <p className="text-xs text-muted-foreground uppercase mb-1 font-bold">
                            Cán màng
                          </p>
                          {isEditing && canEditDesign ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.entries(laminationTypeLabels).map(
                                ([value, label]) => (
                                  <Button
                                    key={value}
                                    size="sm"
                                    variant={
                                      editFormData.laminationType === value
                                        ? "default"
                                        : "outline"
                                    }
                                    className="h-7 px-2 text-xs rounded-full"
                                    onClick={() =>
                                      setEditFormData((prev) => ({
                                        ...prev,
                                        laminationType: value,
                                      }))
                                    }
                                  >
                                    {label}
                                  </Button>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-bold">
                              {laminationTypeLabels[
                                (d.laminationType ||
                                  orderDetails?.[0]?.laminationType) as string
                              ] || "—"}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Túi xếp hông */}
                    {isTui && !isTuiCuon && (
                      <Card className="col-span-12 md:col-span-3 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-2.5 space-y-1.5">
                          <p className="text-xs text-muted-foreground uppercase mb-1.5 font-bold">
                            Túi xếp hông
                          </p>
                          {isEditing && canEditDesign ? (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={gusseted ? "default" : "outline"}
                                onClick={() => {
                                  setGusseted(true);
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    processClassification: "die_cut",
                                  }));
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                Có
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!gusseted ? "default" : "outline"}
                                onClick={() => {
                                  setGusseted(false);
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    width: 0,
                                    processClassification: "cut",
                                  }));
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                Không
                              </Button>
                            </div>
                          ) : (
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {(d.width ?? 0) > 0 ? "Có" : "Không"}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                        Ghi chú
                      </span>
                    </div>

                    {isEditing && canEditDesign ? (
                      <Textarea
                        value={editFormData.additionalNotes}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            additionalNotes: e.target.value,
                          }))
                        }
                        rows={3}
                        className="text-sm bg-background/50"
                        placeholder="Chưa có ghi chú..."
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                        {d.notes?.trim() || (
                          <span className="italic text-muted-foreground">
                            Chưa có ghi chú
                          </span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>




              </div>
            </ScrollArea>
          </div>

          {/* ===== RIGHT: FILE & TIMELINE ===== */}
          <div className="flex-[3] flex flex-col min-h-0 min-w-0">
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
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {d.designFileUrl ? "Thay file" : "Tải lên file"}
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
              </div>
            </div>

            {/* Content: left preview, right timeline */}
            <div className="flex-1 min-h-0 flex">
              {/* File preview */}
              <div className="w-1/2 shrink-0 border-r p-4 flex flex-col gap-4 bg-muted/20">
                {!d.designImageUrl && !d.designFileUrl && !d.excelFileUrl ? (
                  <Card
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <UploadCloud className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm font-semibold mb-1">
                        Chưa có file thiết kế
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        Kéo thả ảnh hoặc file .ai vào đây để tải lên
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card
                      className="relative overflow-hidden border-2 hover:border-violet-500 transition-colors cursor-pointer"
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (enabled) setIsDraggingOverPreview(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingOverPreview(false);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={async (e) => {
                        setIsDraggingOverPreview(false);
                        await handleDrop(e);
                      }}
                    >
                      <div
                        className={`relative aspect-square group ${d.designImageUrl ? "cursor-pointer" : ""
                          }`}
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
                        {d.designImageUrl && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Eye className="h-8 w-8 text-white" />
                              <span className="text-xs text-white font-medium">
                                Xem ảnh lớn
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {isDraggingOverPreview && (
                        <div className="absolute inset-0 bg-violet-600/35 backdrop-blur-sm border-2 border-dashed border-violet-500 flex flex-col items-center justify-center gap-2 z-20 animate-in fade-in duration-200 pointer-events-none">
                          <UploadCloud className="h-10 w-10 text-white animate-bounce" />
                          <span className="text-sm font-semibold text-white">
                            Thả file để cập nhật
                          </span>
                        </div>
                      )}
                    </Card>

                    {(d.designFileUrl || d.excelFileUrl) && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold truncate">
                            {d.designFileUrl?.split("/").pop() || "Tệp đính kèm"}
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
                    )}
                  </>
                )}
              </div>

              {/* Timeline */}
              <ScrollArea className="flex-1 w-1/2 min-w-0">
                <div
                  className="w-full min-w-0 max-w-full"
                  style={{ padding: "20px", maxWidth: "100%", width: "100%" }}
                >
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-base">
                        Timeline tiến trình
                      </span>
                    </div>
                    {timelineLoading && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
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
                        <p className="font-semibold">
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
                      <p className="text-base font-semibold">
                        Chưa có timeline
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Click để thêm mới
                      </p>
                    </div>
                  ) : (
                    <div
                      className="relative w-full min-w-0 max-w-full"
                      style={{ maxWidth: "100%", width: "100%" }}
                    >
                      {/* Line - dừng ở giữa dot cuối cùng (dot cũ nhất) */}
                      <div
                        className="absolute left-4 top-0 w-px bg-gradient-to-b from-violet-300 via-blue-300 to-emerald-300 dark:from-violet-800 dark:via-blue-800 dark:to-emerald-800"
                        style={{
                          height: `calc(100% - 2rem)`,
                        }}
                      />

                      <div
                        className="space-y-6 pl-2 min-w-0 w-full max-w-full"
                        style={{ maxWidth: "100%", width: "100%" }}
                      >
                        {groupTimelineByDate(timelineEntries).map((group) => (
                          <div key={group.date} className="space-y-3 min-w-0">
                            {/* Date header */}
                            <div className="flex items-center gap-2 pl-6">
                              <div className="h-px flex-1 bg-border/60" />
                              <div className="px-3 py-1 rounded-full text-[11px] font-semibold border bg-muted/60 text-muted-foreground uppercase tracking-wide">
                                {formatTimelineDateLabel(group.date)}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {timelineEntries.map((entry, index) => {
                                const timelineNumber =
                                  timelineEntries.length - index;
                                const isLast =
                                  index === timelineEntries.length - 1;
                                return (
                                  <div
                                    key={entry.id}
                                    className="relative flex gap-4 group"
                                  >
                                    {/* Dot */}
                                    <div className="relative z-10 shrink-0 flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-background shadow-md flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">
                                          {timelineNumber}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Card */}
                                    <Card
                                      className={`flex-1 group-hover:border-purple-400/70 transition-colors ${entry.imageUrl ? "cursor-pointer" : ""
                                        }`}
                                      onClick={() => {
                                        if (entry.imageUrl) {
                                          setViewingImage({
                                            url: entry.imageUrl as string,
                                            title:
                                              (entry.title as string) ||
                                              `Timeline #${timelineNumber}`,
                                          });
                                        }
                                      }}
                                    >
                                      <CardContent
                                        className="p-4 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => {
                                          if (entry.fileUrl) {
                                            setViewingImage({
                                              url: entry.fileUrl as string,
                                              title:
                                                (entry.title as string) ||
                                                `Timeline #${timelineNumber}`,
                                            });
                                          }
                                        }}
                                      >
                                        <CursorTooltip
                                          content={entry.description}
                                          delayDuration={200}
                                          className="p-4 max-w-md"
                                        >
                                          <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="font-medium text-sm truncate max-w-[60px] cursor-pointer">
                                                {entry.description}
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

                                            {entry.createdByName && (
                                              <p className="text-[11px] text-muted-foreground">
                                                Người tạo:{" "}
                                                <span className="font-medium">
                                                  {
                                                    entry.createdByName as string
                                                  }
                                                </span>
                                              </p>
                                            )}
                                          </div>
                                        </CursorTooltip>
                                      </CardContent>
                                    </Card>
                                  </div>
                                );
                              })}
                            </div>
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

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
          accept=".ai,image/*"
          multiple
        />

        <TimelineEntryDialog
          open={showTimelineDialog}
          onOpenChange={setShowTimelineDialog}
          onAdd={handleTimelineAdd}
        />

        {/* Reprint Dialog */}
        <Dialog open={reprintDialogOpen} onOpenChange={setReprintDialogOpen}>
          <DialogContent className="max-w-md bg-background border border-border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="pb-3 border-b border-border/40">
              <DialogTitle className="text-lg font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                Yêu cầu tái bản thiết kế
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Nhập số lượng sản phẩm cần sản xuất thêm cho thiết kế này. Hệ thống sẽ tạo một yêu cầu in mới trong kho sẵn sàng.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Số lượng tái bản *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="VD: 1000"
                  value={reprintQuantity || ""}
                  onChange={(e) => setReprintQuantity(Number(e.target.value))}
                  className="h-11 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Ghi chú tái bản</Label>
                <Textarea
                  placeholder="Nhập lý do hoặc yêu cầu tái bản đặc biệt nếu có..."
                  value={reprintNotes}
                  onChange={(e) => setReprintNotes(e.target.value)}
                  className="min-h-[80px] bg-background"
                />
              </div>
            </div>
            <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setReprintDialogOpen(false)}
                disabled={reprintDesignMutation.loading}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleReprintSubmit}
                disabled={reprintDesignMutation.loading || !reprintQuantity || reprintQuantity <= 0}
                className="font-semibold"
              >
                {reprintDesignMutation.loading ? "Đang xử lý..." : "Xác nhận tái bản"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Design Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-md bg-background border border-border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="pb-3 border-b border-border/40">
              <DialogTitle className="text-lg font-bold text-destructive">
                Hủy thiết kế
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Bạn có chắc chắn muốn hủy thiết kế này? Hành động này không thể hoàn tác và sẽ cập nhật trạng thái thiết kế thành đã hủy.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                disabled={cancelDesign.loading}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubmit}
                disabled={cancelDesign.loading}
                className="font-semibold"
              >
                {cancelDesign.loading ? "Đang xử lý..." : "Xác nhận hủy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog sửa mã thiết kế */}
        <Dialog open={editCodeDialogOpen} onOpenChange={setEditCodeDialogOpen}>
          <DialogContent className="max-w-md bg-background border border-border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="pb-3 border-b border-border/40">
              <DialogTitle className="text-lg font-bold text-foreground">
                Cập nhật mã thiết kế thủ công
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Nhập mã thiết kế mới cho thiết kế này. Hệ thống sẽ cập nhật mã trên toàn hệ thống.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Mã thiết kế mới *</Label>
                <Input
                  placeholder="VD: KH001-T018"
                  value={newDesignCode}
                  onChange={(e) => setNewDesignCode(e.target.value)}
                  className="h-11 bg-background"
                  maxLength={100}
                />
              </div>
            </div>
            <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setEditCodeDialogOpen(false)}
                disabled={updateDesignCodeMutation.loading}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSaveCode}
                disabled={updateDesignCodeMutation.loading || !newDesignCode.trim()}
                className="font-semibold"
              >
                {updateDesignCodeMutation.loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
