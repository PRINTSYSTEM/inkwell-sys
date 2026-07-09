import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Plus,
  FolderTree,
  Hash,
  Maximize2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Box,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useProofingOrder,
  useUploadProofingFile,
  useUploadProofingImage,
  useUpdateProofingOrder,
  useUpdateProofingFile,
  useUpdateProofingImage,
  useUploadProofingImages,
  useDeleteProofingImage,
  useHandToProduction,
  usePaperSizes,
  useAddDesignsToProofingOrder,
  useRemoveDesignFromProofingOrder,
  useCreatePaperSize,
  useAvailableQuantity,
  useProofingAvailableOrderDetailsDesignTypeSummary,
  useCancelProofingOrder,
  useRejectDesignFromProofingOrder,
  proofingKeys,
  useDeleteProofingOrder,
} from "@/hooks/use-proofing-order";
import { useProductionOrders } from "@/hooks/use-production";
import { useAvailableOrderDetailsForProofing, useAuth } from "@/hooks";
import { useProofingSelection } from "@/hooks/useProofingSelection";
import { ROLE } from "@/constants";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { DesignTable } from "@/components/proofing/DesignTable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DesignCardSkeleton } from "@/components/proofing/DesignCardSkeleton";
import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { AddDesignToProofingDialog } from "@/components/proofing/AddDesignToProofingDialog";
import { PlateExportDialog } from "@/components/proofing/PlateExportDialog";
import { DieExportDialog } from "@/components/proofing/DieExportDialog";
import { IdSchema } from "@/Schema";
import type {
  PlateExportResponse,
  DieExportResponse,
  ProofingOrderResponse,
} from "@/Schema";
import type { DesignItem } from "@/types/proofing";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  designStatusLabels,
  proofingStatusLabels,
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
  dieLocationLabels,
  dieStatusLabels,
} from "@/lib/status-utils";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { downloadFile } from "@/lib/download-utils";
import { Textarea } from "@/components/ui/textarea";
import type { UpdateProofingOrderRequest } from "@/Schema";
import { formatDesignDimensions, formatDieSize } from "@/utils/format-die-size";
import {
  useReplaceDie,
  useDies,
  useSearchDies,
  useAssignDieToProofingOrder,
  useRemoveDieFromProofingOrder,
  useRelatedDies,
} from "@/hooks/use-die";
import type {
  DieResponse,
  ReplaceDieRequest,
  AssignDieToProofingOrderRequest,
} from "@/Schema";
import { DieListDialog } from "@/components/dies/DieListDialog";

// Extracted detail components
import { DetailHeader } from "./detail-components/DetailHeader";
import { DetailOrderInfoCard } from "./detail-components/DetailOrderInfoCard";
import { DetailDesignsListCard } from "./detail-components/DetailDesignsListCard";
import { DetailPlateExportCard } from "./detail-components/DetailPlateExportCard";
import { DetailDieExportCard } from "./detail-components/DetailDieExportCard";
import { DetailEmptyOrderView } from "./detail-components/DetailEmptyOrderView";
import { PrepressDetailDialogs } from "./detail-components/PrepressDetailDialogs";
// PrepressDesignTable removed

// Component for inline quantity editing with API available quantity
function QuantityCell({
  pod,
  editingQuantityDesignId,
  inlineQuantityValue,
  setInlineQuantityValue,
  setEditingQuantityDesignId,
  handleUpdateDesignQuantity,
  updatingDesignId,
}: {
  pod: import("@/Schema/proofing-order.schema").ProofingOrderDesignResponse;
  editingQuantityDesignId: number | null;
  inlineQuantityValue: string;
  setInlineQuantityValue: (value: string) => void;
  setEditingQuantityDesignId: (id: number | null) => void;
  handleUpdateDesignQuantity: (designId: number) => void;
  updatingDesignId: number | null;
}) {
  const isEditing = editingQuantityDesignId === pod.id;
  const designId = pod.design?.id ?? null;

  // Get available quantity from API when editing this design
  const { data: availableQuantityFromApi, isLoading: isLoadingAvailableQty } =
    useAvailableQuantity(
      isEditing && designId ? designId : null,
      isEditing && !!designId,
    );

  // Extract quantity from API response (could be number or object)
  const extractAvailableQuantity = (data: unknown): number | null => {
    if (data == null) return null;
    if (typeof data === "number") return data;
    if (typeof data === "string") {
      const parsed = parseInt(data, 10);
      return !isNaN(parsed) ? parsed : null;
    }
    if (typeof data === "object" && data !== null) {
      // Try common field names
      const obj = data as Record<string, unknown>;
      if ("quantity" in obj && typeof obj.quantity === "number") {
        return obj.quantity;
      }
      if (
        "availableQuantity" in obj &&
        typeof obj.availableQuantity === "number"
      ) {
        return obj.availableQuantity;
      }
      if (
        "availableQuantityForProofing" in obj &&
        typeof obj.availableQuantityForProofing === "number"
      ) {
        return obj.availableQuantityForProofing;
      }
      // Log for debugging if structure is unexpected
      console.warn("Unexpected available quantity response structure:", data);
    }
    return null;
  };

  const apiAvailableQty = extractAvailableQuantity(availableQuantityFromApi);

  const maxAvailableQty =
    apiAvailableQty != null
      ? apiAvailableQty
      : pod.design?.availableQuantityForProofing != null
        ? pod.design.availableQuantityForProofing
        : undefined;

  if (isEditing) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="1"
            max={maxAvailableQty}
            value={inlineQuantityValue}
            onChange={(e) => setInlineQuantityValue(e.target.value)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const qty = parseInt(inlineQuantityValue, 10);
                if (!isNaN(qty) && qty >= 1) {
                  handleUpdateDesignQuantity(pod.id!);
                }
              } else if (e.key === "Escape") {
                setEditingQuantityDesignId(null);
                setInlineQuantityValue("");
              }
            }}
            className="h-7 w-24 text-xs font-semibold"
            autoFocus
            disabled={isLoadingAvailableQty || updatingDesignId === pod.id}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => {
              const qty = parseInt(inlineQuantityValue, 10);
              if (!isNaN(qty) && qty >= 1) {
                handleUpdateDesignQuantity(pod.id!);
              }
            }}
            disabled={updatingDesignId === pod.id || isLoadingAvailableQty}
          >
            {updatingDesignId === pod.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "✓"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setEditingQuantityDesignId(null);
              setInlineQuantityValue("");
            }}
            disabled={updatingDesignId === pod.id || isLoadingAvailableQty}
          >
            ✕
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          {isLoadingAvailableQty ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Đang tải số lượng...</span>
            </div>
          ) : apiAvailableQty != null ? (
            <>
              <p>
                Có thể bình bài:{" "}
                <span className="font-semibold text-foreground">
                  {apiAvailableQty.toLocaleString()}
                </span>
              </p>
              <p>
                Hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {pod.quantity?.toLocaleString() || "0"}
                </span>
              </p>
            </>
          ) : pod.design?.availableQuantityForProofing != null ? (
            <>
              <p>
                Có thể bình bài:{" "}
                <span className="font-semibold text-foreground">
                  {pod.design.availableQuantityForProofing.toLocaleString()}
                </span>
              </p>
              <p>
                Hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {pod.quantity?.toLocaleString() || "0"}
                </span>
              </p>
            </>
          ) : (
            <p>
              Hiện tại:{" "}
              <span className="font-semibold text-foreground">
                {pod.quantity?.toLocaleString() || "0"}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold">
        {pod.quantity?.toLocaleString() || "0"}
      </p>
      {pod.design?.availableQuantityForProofing != null && (
        <p className="text-[10px] text-muted-foreground">
          Còn: {pod.design.availableQuantityForProofing.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function ProofingOrderDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const highlightSearchTerm = searchParams.get("search") || "";

  const { user } = useAuth();
  const isProofer = user?.role === ROLE.ADMIN || user?.role === ROLE.MANAGER || user?.role === ROLE.PROOFER;

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUpdateFileDialogOpen, setIsUpdateFileDialogOpen] = useState(false);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);

  // Helper functions for file classification
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };
  const [isPlateExportDialogOpen, setIsPlateExportDialogOpen] = useState(false);
  const [editingPlateExport, setEditingPlateExport] =
    useState<PlateExportResponse | null>(null);
  const [isDieExportDialogOpen, setIsDieExportDialogOpen] = useState(false);
  const [isRemoveDieConfirmOpen, setIsRemoveDieConfirmOpen] = useState(false);
  const [removeTargetDieId, setRemoveTargetDieId] = useState<number | null>(null);
  const [isEditDieDialogOpen, setIsEditDieDialogOpen] = useState(false);
  const [editingDie, setEditingDie] = useState<any>(null);
  const [isConfirmStatusDialogOpen, setIsConfirmStatusDialogOpen] =
    useState(false);
  const [isConfirmStatusChangeDialogOpen, setIsConfirmStatusChangeDialogOpen] =
    useState(false);
  const [isHandToProductionDialogOpen, setIsHandToProductionDialogOpen] =
    useState(false);
  const [isUpdateInfoDialogOpen, setIsUpdateInfoDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [isAddDesignDialogOpen, setIsAddDesignDialogOpen] = useState(false);

  // Replace die dialog state
  const [isReplaceDieDialogOpen, setIsReplaceDieDialogOpen] = useState(false);
  const [replacingDieExport, setReplacingDieExport] =
    useState<DieExportResponse | null>(null);
  const [dieListInitialSize, setDieListInitialSize] = useState<
    string | undefined
  >(undefined);

  // Add die dialog state
  const [isAddDieDialogOpen, setIsAddDieDialogOpen] = useState(false);

  // Form state cho từng card

  // Confirm remove design dialog
  const [isConfirmRemoveDesignDialogOpen, setIsConfirmRemoveDesignDialogOpen] =
    useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [removeDesignTarget, setRemoveDesignTarget] = useState<{
    proofingOrderDesignId: number;
    designCode?: string;
    designName?: string;
  } | null>(null);

  // Form state for update info (Bình Bài)
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateNotes, setUpdateNotes] = useState<string>("");
  const [updatePaperSizeId, setUpdatePaperSizeId] = useState<string>("custom");
  const [updateCustomPaperSize, setUpdateCustomPaperSize] =
    useState<string>("");
  const [updateProofingFileUrl, setUpdateProofingFileUrl] =
    useState<string>("");
  const [updateTotalQuantity, setUpdateTotalQuantity] = useState<string>("");
  const [updateBasisWeight, setUpdateBasisWeight] = useState<string>("");
  const [updateRollWidth, setUpdateRollWidth] = useState<string>("");
  const [updateDesignQuantities, setUpdateDesignQuantities] = useState<
    Record<number, string>
  >({});
  const [updatingDesignId, setUpdatingDesignId] = useState<number | null>(null);
  const [editingQuantityDesignId, setEditingQuantityDesignId] = useState<
    number | null
  >(null);
  const [inlineQuantityValue, setInlineQuantityValue] = useState<string>("");
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);
  const [updateProofingFile, setUpdateProofingFile] = useState<File | null>(
    null,
  );

  // Inline editing state for order info
  const [editingField, setEditingField] = useState<
    "totalQuantity" | "paperSize" | "notes" | "basisWeight" | "rollWidth" | "code" | "all" | null
  >(null);
  const [inlineTotalQuantity, setInlineTotalQuantity] = useState<string>("");
  const [inlinePaperSizeId, setInlinePaperSizeId] = useState<string>("custom");
  const [inlineCustomPaperSize, setInlineCustomPaperSize] =
    useState<string>("");
  const [inlineNotes, setInlineNotes] = useState<string>("");
  const [inlineBasisWeight, setInlineBasisWeight] = useState<string>("");
  const [inlineRollWidth, setInlineRollWidth] = useState<string>("");
  const [inlineCode, setInlineCode] = useState<string>("");

  // Related dies dialog state
  const [isRelatedDiesDialogOpen, setIsRelatedDiesDialogOpen] = useState(false);
  const [selectedDesignForRelatedDies, setSelectedDesignForRelatedDies] =
    useState<{
      designId: number;
      designCode?: string;
      designName?: string;
    } | null>(null);

  // Cancellation state
  const [isConfirmCancelDialogOpen, setIsConfirmCancelDialogOpen] =
    useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const idValue = params.id ? Number(params.id) : Number.NaN;
  const idValid = IdSchema.safeParse(idValue).success;

  const {
    data: orderResp,
    isLoading,
    error,
    refetch: refetchOrder,
  } = useProofingOrder(idValid ? idValue : null, idValid);

  // Check for production orders for cancellation logic
  const { data: productionOrdersData, isLoading: isLoadingProductions } =
    useProductionOrders({
      proofingOrderId: idValid ? idValue : undefined,
      pageSize: 1,
    });
  const hasExternalProduction = (productionOrdersData?.items?.length ?? 0) > 0;

  // Use raw response directly instead of strict schema parsing
  // Schema validation is too strict for API responses with nullable fields
  // For display-only detail view, we can safely use raw data
  const order = (orderResp as ProofingOrderResponse | undefined) ?? null;
  const orderDesigns = order?.proofingOrderDesigns ?? [];

  // Compute isDieExported from dieExports array (if not provided by API)
  // Schema has dieExports but may not have isDieExported field
  const isDieExported = useMemo(() => {
    if (!order) return false;
    // Check if API provides isDieExported field (may be in response but not in schema)
    if (
      "isDieExported" in order &&
      typeof (order as any).isDieExported === "boolean"
    ) {
      return (order as any).isDieExported;
    }
    // Fallback: compute from dieExports array or proofingOrderDies array
    return (order.dieExports?.length ?? 0) > 0 || (order.proofingOrderDies?.length ?? 0) > 0;
  }, [order]);

  // Check if any design has processClassification === "die_cut" (Bế)
  const hasDieCutDesigns = useMemo(() => {
    if (!orderDesigns || orderDesigns.length === 0) return false;
    return orderDesigns.some(
      (pod) => pod.design?.processClassification === "die_cut",
    );
  }, [orderDesigns]);

  // Extract unique lamination types and process classifications from designs
  const uniqueLaminationTypes = useMemo(() => {
    if (!orderDesigns || orderDesigns.length === 0) return [];
    const types = new Set<string>();
    orderDesigns.forEach((pod) => {
      if (pod.design?.laminationType) {
        types.add(pod.design.laminationType);
      }
    });
    return Array.from(types);
  }, [orderDesigns]);

  const uniqueProcessClassifications = useMemo(() => {
    if (!orderDesigns || orderDesigns.length === 0) return [];
    const classifications = new Set<string>();
    orderDesigns.forEach((pod) => {
      if (pod.design?.processClassification) {
        classifications.add(pod.design.processClassification);
      }
    });
    return Array.from(classifications);
  }, [orderDesigns]);

  const uniqueSpecifications = useMemo(() => {
    if (!orderDesigns || orderDesigns.length === 0) return [];
    const specs = new Set<string>();
    orderDesigns.forEach((pod) => {
      const rawSpec =
        (pod.design as any)?.specification ||
        (pod.design as any)?.specifications ||
        (pod as any).specification ||
        (pod as any).specifications;

      if (Array.isArray(rawSpec)) {
        rawSpec.forEach((s: string) => {
          if (typeof s === "string" && s.trim()) specs.add(s.trim());
        });
      } else if (typeof rawSpec === "string" && rawSpec.trim()) {
        if (rawSpec.trim().startsWith("[") && rawSpec.trim().endsWith("]")) {
          try {
            const parsed = JSON.parse(rawSpec);
            if (Array.isArray(parsed)) {
              parsed.forEach((s: any) => {
                if (typeof s === "string" && s.trim()) specs.add(s.trim());
              });
            } else {
              specs.add(rawSpec.trim());
            }
          } catch (e) {
            specs.add(rawSpec.trim());
          }
        } else {
          specs.add(rawSpec.trim());
        }
      }
    });
    return Array.from(specs);
  }, [orderDesigns]);

  // ===== Completion readiness (for "Hoàn thành") =====
  const completionMissingItems = useMemo(() => {
    const missing: string[] = [];
    if (!order) return missing;

    const hasImage = !!order.imageUrl || (order.images && order.images.length > 0);
    if (!hasImage) missing.push("Chưa upload ảnh bình bài");

    const totalQty = order.totalQuantity ?? 0;
    if (!Number.isFinite(totalQty) || totalQty < 1)
      missing.push("Chưa nhập số lượng giấy in");

    const hasPaperSize = !!order.paperSizeId || !!order.customPaperSize?.trim();
    if (!hasPaperSize) missing.push("Chưa chọn khổ giấy in");

    if (!order.isPlateExported) missing.push("Chưa ghi nhận xuất kẽm");
    if (hasDieCutDesigns && !isDieExported)
      missing.push("Chưa ghi nhận xuất khuôn bế");

    const hasInvalidItemQty = orderDesigns.some((pod) => {
      const q = pod.quantity ?? 0;
      return !Number.isFinite(q) || q < 1;
    });
    if (hasInvalidItemQty) missing.push("Có mã hàng chưa có số lượng hợp lệ");

    return missing;
  }, [order, hasDieCutDesigns, orderDesigns, isDieExported]);

  const canMarkCompleted = completionMissingItems.length === 0;

  const { mutate: updateProofing } = useUpdateProofingOrder();
  const { mutate: uploadProofing, loading: isUploadingFile } =
    useUploadProofingFile();
  const { mutate: updateFileMutate, loading: isUpdatingFile } =
    useUpdateProofingFile();
  const { mutate: uploadImageMutate, loading: isUploadingImage } =
    useUploadProofingImage();
  const { mutate: updateImageMutate, loading: isUpdatingImage } =
    useUpdateProofingImage();
  const { mutate: uploadImagesMutate, loading: isUploadingImages } =
    useUploadProofingImages();
  const { mutate: deleteImageMutate, loading: isDeletingImage } =
    useDeleteProofingImage();
  const { mutate: handToProductionMutate, isPending: isHandingToProduction } =
    useHandToProduction();
  const {
    mutate: updateProofingOrder,
    mutateAsync: updateProofingOrderAsync,
    isPending: isUpdatingInfo,
  } = useUpdateProofingOrder();
  const { data: paperSizesData } = usePaperSizes();
  const paperSizes = paperSizesData || [];
  const { mutateAsync: addDesignsMutate, isPending: isAddingDesigns } =
    useAddDesignsToProofingOrder();
  const {
    mutate: removeDesignMutate,
    mutateAsync: removeDesignMutateAsync,
    isPending: isRemovingDesign,
  } = useRemoveDesignFromProofingOrder();
  const { mutateAsync: rejectDesignMutate, isPending: isRejecting } =
    useRejectDesignFromProofingOrder();

  const { mutateAsync: removeDieMutate, isPending: isRemovingDie } =
    useRemoveDieFromProofingOrder();

  const { mutateAsync: deleteProofingOrder, isPending: isDeleting } =
    useDeleteProofingOrder();

  const handleConfirmDelete = async () => {
    if (!order?.id) return;
    try {
      await deleteProofingOrder(order.id);
      setIsConfirmDeleteDialogOpen(false);
      navigate("/proofing");
    } catch (err) {
      console.error("Delete proofing order failed:", err);
    }
  };

  const closeRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleOpenRejectDialog = (pod: any) => {
    setRejectTarget(pod);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  // Check if order is empty (no designs)
  const isEmptyOrder = orderDesigns.length === 0;

  // Server-provided design type counts for available order details (used in empty-order filter UI)
  const { data: designTypesCount = [] } =
    useProofingAvailableOrderDetailsDesignTypeSummary(isEmptyOrder);

  // Selection state for adding designs (when order is empty)
  const {
    selectedDesigns,
    selectedIds,
    currentMaterialTypeId,
    toggleSelection: rawToggleSelection,
    clearSelection,
    isSelected,
    canSelect,
  } = useProofingSelection();

  const toggleSelection = (design: any) => {
    const isSelecting = !isSelected(design.id);
    rawToggleSelection(design);

    if (isSelecting) {
      setDesignQuantities((prev) => ({
        ...prev,
        [design.id]:
          design.availableQuantity !== undefined
            ? design.availableQuantity
            : design.quantity || 0,
      }));
    }
  };

  // Filter states for design selection
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<number[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>(
    [],
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // View states
  const [groupByOrder, setGroupByOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("");
  const itemsPerPage = 10;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Inline proofing order configuration state
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [isDieListDialogOpen, setIsDieListDialogOpen] = useState(false);

  // Config state for empty order (when adding designs for the first time)
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState<number>(0);
  const [paperSizeId, setPaperSizeId] = useState<string>("custom");
  const [customPaperSize, setCustomPaperSize] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const materialTypeId = isEmptyOrder
    ? (currentMaterialTypeId ?? null)
    : (order.materialTypeId ?? null);
  // Get available designs for adding (when order is empty, no material type filter)
  // Pass designTypeId from selectedDesignTypes (only first one if selected) to API filter
  const selectedDesignTypeId =
    isEmptyOrder && selectedDesignTypes.length > 0
      ? selectedDesignTypes[0]
      : null;
  // Pass designCode (search term) to API filter when searching
  const designCodeForApi =
    isEmptyOrder && debouncedSearch.trim().length > 0
      ? debouncedSearch.trim()
      : null;
  const { data: availableDesignsData, isLoading: isLoadingDesigns } =
    useAvailableOrderDetailsForProofing({
      materialTypeId,
      designTypeId: selectedDesignTypeId,
      designCode: designCodeForApi,
      pageNumber: currentPage,
      pageSize: itemsPerPage,
    });

  // Get available designs for adding (same material type, exclude already added designs) - for non-empty orders
  const availableDesignsForAdding = useMemo(() => {
    if (!availableDesignsData?.designs || !order) return [];
    const existingDesignIds = new Set(
      order.proofingOrderDesigns
        ?.map((pod) => pod.design?.id)
        .filter(Boolean) ?? [],
    );
    return availableDesignsData.designs.filter(
      (design) => !existingDesignIds.has(design.designId),
    );
  }, [availableDesignsData?.designs, order]);

  // Get current design (first design in proofing order) for filtering by specifications
  const currentDesignForAdding = useMemo((): DesignItem | null => {
    if (!order?.proofingOrderDesigns || order.proofingOrderDesigns.length === 0)
      return null;
    const firstDesign = order.proofingOrderDesigns[0]?.design;
    if (!firstDesign) return null;

    // Convert ProofingOrderDesignResponse.design to DesignItem format
    const pod = order.proofingOrderDesigns[0];
    return {
      id: pod.id || 0,
      code: firstDesign.code || "",
      name: firstDesign.designName || "",
      designTypeId: firstDesign.designTypeId || 0,
      designTypeName: firstDesign.designType?.name || "",
      materialTypeId: firstDesign.materialTypeId || 0,
      materialTypeName: firstDesign.materialType?.name || "",
      length: firstDesign.length || 0,
      width: firstDesign.width,
      height: firstDesign.height || 0,
      unit: "mm",
      quantity: pod.quantity || 0,
      unitPrice: 0,
      orderId: "",
      orderCode: "",
      customerName: "",
      thumbnailUrl: firstDesign.designImageUrl || "",
      createdAt: firstDesign.createdAt || "",
      designId: firstDesign.id,
      laminationType: firstDesign.laminationType ?? undefined,
      processClassificationOptionName:
        firstDesign.processClassification ?? undefined,
      sidesClassification: firstDesign.sidesClassification ?? undefined,
    };
  }, [order?.proofingOrderDesigns]);

  // Fetch design types
  const { data: designTypesData } = useDesignTypeList({
    status: "active",
  });

  // Handler to open die-list dialog prefilled with design code and size
  const handleFindDie = (_design: DesignItem, dimensions: string) => {
    setDieListInitialSize(dimensions || "");
    setIsDieListDialogOpen(true);
  };

  const { mutate: createPaperSize, loading: isCreatingPaperSize } =
    useCreatePaperSize();

  // Transform design types to FilterOption format with count
  const designTypeOptions = useMemo(() => {
    if (!designTypesData) return [];

    const designTypeItems = Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData.items ?? []);

    // Count designs by designTypeId
    const countMap = new Map<number, number>();
    if (Array.isArray(designTypesCount) && designTypesCount.length > 0) {
      designTypesCount.forEach((row) => {
        const id = row?.designTypeId;
        if (typeof id === "number") {
          countMap.set(id, row?.count ?? 0);
        }
      });
    } else if (availableDesignsData?.designs) {
      availableDesignsData.designs.forEach((design) => {
        const count = countMap.get(design.designTypeId) || 0;
        countMap.set(design.designTypeId, count + 1);
      });
    }

    const baseOptions = designTypeItems.map((dt) => ({
      id: dt.id,
      name: dt.name || "",
      count: countMap.get(dt.id) || 0,
    }));

    const result: typeof baseOptions = [];
    baseOptions.forEach((opt) => {
      result.push(opt);
      const optNameLower = opt.name.toLowerCase();
      if ((optNameLower.includes("nhãn") || optNameLower.includes("nhan")) && !optNameLower.includes("cuộn") && !optNameLower.includes("cuon")) {
        result.push({
          id: 999001,
          name: "Nhãn Metaline",
          count: countMap.get(999001) || 0,
        });
      } else if ((optNameLower.includes("túi") || optNameLower.includes("tui")) && !optNameLower.includes("cuộn") && !optNameLower.includes("cuon")) {
        result.push({
          id: 999002,
          name: "Túi Metaline",
          count: countMap.get(999002) || 0,
        });
      }
    });

    return result;
  }, [designTypesData, availableDesignsData?.designs, designTypesCount]);

  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Reset auto-selected flag when switching orders
  useEffect(() => {
    setHasAutoSelected(false);
  }, [order?.id]);

  // Auto-select the design type with the highest count when loading an empty proofing order
  useEffect(() => {
    if (
      isEmptyOrder &&
      !hasAutoSelected &&
      selectedDesignTypes.length === 0 &&
      designTypeOptions.length > 0
    ) {
      let maxCount = 0;
      let targetId: number | null = null;

      designTypeOptions.forEach((option) => {
        if (option.count > maxCount) {
          maxCount = option.count;
          targetId = option.id;
        }
      });

      if (targetId !== null && maxCount > 0) {
        setSelectedDesignTypes([targetId]);
        setHasAutoSelected(true);
      }
    }
  }, [isEmptyOrder, designTypeOptions, selectedDesignTypes, hasAutoSelected]);

  // Helper functions to check design type
  const isNhanDesignType = (designTypeName: string): boolean => {
    return (
      designTypeName.toLowerCase().includes("nhãn") ||
      designTypeName.toLowerCase().includes("nhan")
    );
  };

  const isDecalDesignType = (designTypeName: string): boolean => {
    return designTypeName.toLowerCase().includes("decal");
  };

  // Apply client-side filters (for empty order)
  // Note: designTypeId and designCode are now filtered by API
  // Only apply material type and lamination type filters client-side if needed
  const filteredAndSortedDesigns = useMemo(() => {
    if (!availableDesignsData || !availableDesignsData.designs) return [];
    return [...availableDesignsData.designs];
  }, [availableDesignsData]);

  // Group by order if enabled
  const groupedByOrder = useMemo(() => {
    if (!groupByOrder) return null;

    const groups = new Map<string, typeof filteredAndSortedDesigns>();
    filteredAndSortedDesigns.forEach((design) => {
      const key = design.orderCode || design.orderId || "unknown";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(design);
    });

    return Array.from(groups.entries()).map(([orderCode, designs]) => ({
      orderCode,
      customerName: designs[0]?.customerName || "",
      customerCompanyName: designs[0]?.customerCompanyName || "",
      designs,
    }));
  }, [filteredAndSortedDesigns, groupByOrder]);

  // Pagination from API response (server-side pagination)
  const totalCount = availableDesignsData?.total ?? 0;
  const totalPages = availableDesignsData?.totalPages ?? 1;

  // Use designs directly from API (already paginated, then apply client-side filters if needed)
  const paginatedDesigns = filteredAndSortedDesigns;

  // Reset pagination when filter changes (but not when page changes from API)
  useEffect(() => {
    if (isEmptyOrder) {
      // Only reset if filters changed, not if page changed
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [
    isEmptyOrder,
    currentMaterialTypeId,
    selectedDesignTypes,
    selectedMaterialTypes,
    debouncedSearch,
    // Note: Don't include currentPage in dependencies to avoid reset loop
  ]);

  // Sync pageInput with currentPage
  useEffect(() => {
    if (isEmptyOrder) {
      setPageInput(currentPage.toString());
    }
  }, [isEmptyOrder, currentPage]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (isEmptyOrder && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [isEmptyOrder, currentPage]);

  // Sync default quantities when selection changes
  useEffect(() => {
    if (isEmptyOrder) {
      setDesignQuantities((prev) => {
        const next: Record<number, number> = {};

        selectedDesigns.forEach((design) => {
          const existing = prev[design.id];
          if (existing != null) {
            next[design.id] = existing;
          } else {
            const baseAvailableQty =
              design.availableQuantity !== undefined &&
                design.availableQuantity >= 0
                ? design.availableQuantity
                : design.quantity;
            next[design.id] = baseAvailableQty;
          }
        });

        return next;
      });
    }
  }, [isEmptyOrder, selectedDesigns]);

  // Get current material type name for banner
  const currentMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !availableDesignsData) return "";
    const material = availableDesignsData.materialTypeOptions.find(
      (m) => m.id === currentMaterialTypeId,
    );
    return material?.name || "";
  }, [currentMaterialTypeId, availableDesignsData]);

  const materialTypeName =
    selectedDesigns.length > 0 ? selectedDesigns[0].materialTypeName : "";

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleClearFilters = () => {
    setSelectedDesignTypes([]);
    setSelectedMaterialTypes([]);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    clearSelection();
    setDesignQuantities({});
  };

  // Handle quantity change
  const handleQuantityChange = (
    id: number,
    value: string,
    maxQty: number,
    availableQty?: number,
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      const maxAvailable =
        availableQty !== undefined && availableQty >= 0 ? availableQty : maxQty;
      const clampedValue = Math.min(Math.max(0, numValue), maxAvailable);
      setDesignQuantities((prev) => ({
        ...prev,
        [id]: clampedValue,
      }));
    }
  };

  const hasValidQuantities = useMemo(() => {
    return selectedDesigns.some((design) => {
      const qty = designQuantities[design.id] || 0;
      return qty > 0;
    });
  }, [selectedDesigns, designQuantities]);

  const selectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  // Parse custom paper size for empty order config
  const parsedCustomPaperSize = useMemo(() => {
    if (!customPaperSize || paperSizeId !== "custom") return null;
    const trimmed = customPaperSize.trim();
    // Support multiple formats: 31×43, 31x43, 31 X 43, 31 x 43, etc.
    const match = trimmed.match(/^(\d+)\s*[×xX*]\s*(\d+)$/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
    return null;
  }, [customPaperSize, paperSizeId]);

  const existingPaperSize = useMemo(() => {
    if (!parsedCustomPaperSize || !paperSizes) return null;
    const found = paperSizes.find(
      (ps) =>
        ps.width === parsedCustomPaperSize.width &&
        ps.height === parsedCustomPaperSize.height,
    );
    return found ?? null;
  }, [parsedCustomPaperSize, paperSizes]);

  const showCreateButton = useMemo(() => {
    return (
      paperSizeId === "custom" &&
      !!parsedCustomPaperSize &&
      !existingPaperSize &&
      customPaperSize.trim().length > 0
    );
  }, [paperSizeId, parsedCustomPaperSize, existingPaperSize, customPaperSize]);

  // Handler to create paper size for empty order config
  const handleCreatePaperSize = async () => {
    if (!parsedCustomPaperSize) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập khổ giấy hợp lệ (ví dụ: 31×43)",
      });
      return;
    }

    if (existingPaperSize) {
      setPaperSizeId(existingPaperSize.id.toString());
      return;
    }

    try {
      const newPaperSize = await createPaperSize({
        name: `${parsedCustomPaperSize.width}×${parsedCustomPaperSize.height}`,
        width: parsedCustomPaperSize.width,
        height: parsedCustomPaperSize.height,
        isCustom: true,
      });

      if (newPaperSize?.id) {
        setPaperSizeId(newPaperSize.id.toString());
        setCustomPaperSize("");
        toast.success("Thành công", {
          description: "Đã tạo khổ giấy mới",
        });
      }
    } catch (error) {
      console.error("Failed to create paper size:", error);
      toast.error("Lỗi", {
        description: "Không thể tạo khổ giấy mới",
      });
    }
  };

  // Parse custom paper size for update dialog
  const parsedUpdateCustomPaperSize = useMemo(() => {
    if (!updateCustomPaperSize || updatePaperSizeId !== "custom") return null;
    const trimmed = updateCustomPaperSize.trim();
    // Support multiple formats: 31×43, 31x43, 31 X 43, 31 x 43, etc.
    const match = trimmed.match(/^(\d+)\s*[×xX*]\s*(\d+)$/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
    return null;
  }, [updateCustomPaperSize, updatePaperSizeId]);

  const existingUpdatePaperSize = useMemo(() => {
    if (!parsedUpdateCustomPaperSize || !paperSizes) return null;
    // Fix: Check by width and height instead of name to handle different formats (15x15 vs 15×15)
    const found = paperSizes.find(
      (ps) =>
        ps.width === parsedUpdateCustomPaperSize.width &&
        ps.height === parsedUpdateCustomPaperSize.height,
    );
    // Fix: Return null instead of undefined to match condition check
    return found ?? null;
  }, [parsedUpdateCustomPaperSize, paperSizes]);

  // Helper function to create paper size for update if needed
  const ensurePaperSizeExistsForUpdate = async (
    customSize: string,
    currentPaperSizeId: string,
  ): Promise<number | null> => {
    if (currentPaperSizeId !== "custom" || !customSize?.trim()) {
      return currentPaperSizeId === "none" || currentPaperSizeId === "custom"
        ? null
        : Number(currentPaperSizeId);
    }

    // Parse custom paper size
    const trimmed = customSize.trim();
    const match = trimmed.match(/^(\d+)\s*[×xX*]\s*(\d+)$/);
    if (!match) {
      return null;
    }

    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return null;
    }

    // Check if paper size already exists
    const existing = paperSizes.find(
      (ps) => ps.width === width && ps.height === height,
    );

    if (existing) {
      return existing.id;
    }

    // Create new paper size
    try {
      const newPaperSize = await createPaperSize({
        name: `${width}×${height}`,
        width: width,
        height: height,
        isCustom: true,
      });
      return newPaperSize?.id || null;
    } catch (error) {
      console.error("Failed to create paper size:", error);
      throw error;
    }
  };

  // Handle submit designs to existing proofing order
  const handleSubmitDesigns = async () => {
    if (!order?.id) return;

    try {
      const invalidDesigns = selectedDesigns.filter((design) => {
        const qty = designQuantities[design.id] || 0;
        if (qty <= 0) return false;
        const maxAllowedQty =
          design.availableQuantity !== undefined &&
            design.availableQuantity >= 0
            ? design.availableQuantity
            : design.quantity;
        return qty > maxAllowedQty;
      });

      if (invalidDesigns.length > 0) {
        toast.error("Lỗi", {
          description:
            "Số lượng lấy vượt quá số lượng còn lại chưa bình bài. Vui lòng kiểm tra lại.",
        });
        return;
      }

      // Validate that we have at least one design with quantity > 0
      const hasValidQuantities = selectedDesigns.some((design) => {
        const qty = designQuantities[design.id] || 0;
        return qty > 0;
      });

      if (!hasValidQuantities) {
        toast.error("Lỗi", {
          description:
            "Vui lòng nhập số lượng lấy cho ít nhất một mã hàng (lớn hơn 0)",
        });
        return;
      }

      // Validate materialTypeId
      if (!currentMaterialTypeId || selectedDesigns.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn mã hàng để thêm vào bình bài",
        });
        return;
      }

      // Map designQuantities to items array with orderDetailId, readyDesignId and quantity
      const items = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          if (!design) return null;
          const quantity = Number.isInteger(qty) ? qty : Math.floor(qty);
          if (quantity <= 0) return null;

          const isPoolDesign = design.queueItemId?.startsWith("RD_") || false;
          return {
            orderDetailId: isPoolDesign ? null : design.id,
            readyDesignId: design.readyDesignId ?? design.designId ?? null,
            quantity: quantity,
          };
        })
        .filter(
          (item): item is { orderDetailId: number | null; readyDesignId: number | null; quantity: number } =>
            item !== null,
        );

      if (items.length === 0) {
        toast.error("Lỗi", {
          description: "Không tìm thấy mã hàng để thêm vào bình bài",
        });
        return;
      }

      // According to schema: AddDesignsToProofingOrderRequest only has materialTypeId and items
      const addDesignsPayload = {
        materialTypeId: currentMaterialTypeId,
        items: items,
      };

      // Add designs to proofing order
      await addDesignsMutate({
        id: order.id,
        request: addDesignsPayload,
        suppressToast: true,
      });

      // If this is an empty order (first time adding designs), also update config
      if (isEmptyOrder) {
        const updateData: UpdateProofingOrderRequest = {};

        // Update notes if provided
        if (notes?.trim()) {
          updateData.notes = notes.trim() || null;
        }

        // Handle paper size
        if (paperSizeId === "custom" && customPaperSize?.trim()) {
          try {
            const createdPaperSizeId = await ensurePaperSizeExistsForUpdate(
              customPaperSize,
              paperSizeId,
            );
            if (createdPaperSizeId) {
              updateData.paperSizeId = createdPaperSizeId;
              updateData.customPaperSize = null;
            } else {
              updateData.paperSizeId = null;
              updateData.customPaperSize = customPaperSize || null;
            }
          } catch (error) {
            console.error("Failed to create paper size:", error);
            // Continue with update even if paper size creation fails
            updateData.paperSizeId = null;
            updateData.customPaperSize = customPaperSize || null;
          }
        } else if (paperSizeId !== "none" && paperSizeId !== "custom") {
          const paperSizeIdNum = parseInt(paperSizeId, 10);
          if (!isNaN(paperSizeIdNum)) {
            updateData.paperSizeId = paperSizeIdNum;
            updateData.customPaperSize = null;
          }
        } else {
          updateData.paperSizeId = null;
          updateData.customPaperSize = null;
        }

        // Handle totalQuantity (proofingSheetQuantity)
        if (proofingSheetQuantity > 0) {
          updateData.totalQuantity = proofingSheetQuantity;
        }

        // Only call update API if there are changes
        const hasChanges = Object.keys(updateData).length > 0;
        if (hasChanges) {
          try {
            await updateProofingOrderAsync({
              id: order.id,
              data: updateData,
              suppressToast: true,
            });
            // Query will be automatically invalidated by the hook's onSuccess
          } catch (error) {
            console.error("Failed to update proofing order config:", error);
            // Error is handled by the hook, but don't fail the whole operation
          }
        }
      }

      // On success: reset and the page will automatically refresh
      toast.success("Thành công", {
        description: isEmptyOrder 
          ? "Đã thêm thiết kế và cấu hình bài bình thành công" 
          : "Đã thêm thiết kế vào bài bình thành công",
      });
      clearSelection();
      setDesignQuantities({});
      // Reset config state when order is no longer empty
      setProofingSheetQuantity(0);
      setPaperSizeId("custom");
      setCustomPaperSize("");
      setNotes("");
    } catch (error) {
      console.error("Failed to add designs to proofing order:", error);
      // Error is already handled by the hooks via toast
    }
  };

  const handleUpdateStatus = async () => {
    if (!order?.id) return;

    // Kiểm tra lại xem đã có file bình bài chưa
    if (!order.proofingFileUrl) {
      toast.error("Lỗi", {
        description:
          "Vui lòng tải lên file bình bài trước khi chuyển trạng thái",
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

  // Inline editing handlers
  const handleStartEditField = (
    field: "totalQuantity" | "paperSize" | "notes" | "basisWeight" | "rollWidth" | "code",
  ) => {
    if (!order || order.status === "completed") return;
    // If another field is being edited, cancel it first
    if (editingField && editingField !== field) {
      handleCancelEditField();
    }
    setEditingField(field);
    if (field === "totalQuantity") {
      setInlineTotalQuantity((order.totalQuantity ?? 0).toString());
    } else if (field === "paperSize") {
      setInlinePaperSizeId(
        order.paperSizeId ? order.paperSizeId.toString() : "custom",
      );
      setInlineCustomPaperSize(order.customPaperSize || "");
    } else if (field === "notes") {
      setInlineNotes(order.notes || "");
    } else if (field === "basisWeight") {
      setInlineBasisWeight((order.basisWeight ?? "").toString());
    } else if (field === "rollWidth") {
      setInlineRollWidth((order.rollWidth ?? "").toString());
    } else if (field === "code") {
      setInlineCode(order.code || "");
    }
  };

  const handleStartEditAllFields = () => {
    if (!order || order.status === "completed") return;
    setEditingField("all");
    setInlineTotalQuantity((order.totalQuantity ?? 0).toString());
    setInlinePaperSizeId(
      order.paperSizeId ? order.paperSizeId.toString() : "custom",
    );
    setInlineCustomPaperSize(order.customPaperSize || "");
    setInlineNotes(order.notes || "");
    setInlineBasisWeight((order.basisWeight ?? "").toString());
    setInlineRollWidth((order.rollWidth ?? "").toString());
    setInlineCode(order.code || "");
  };

  const handleCancelEditField = () => {
    setEditingField(null);
    setInlineTotalQuantity("");
    setInlinePaperSizeId("custom");
    setInlineCustomPaperSize("");
    setInlineNotes("");
    setInlineBasisWeight("");
    setInlineRollWidth("");
    setInlineCode("");
  };

  const handleSaveField = async () => {
    if (!order?.id || !editingField) return;

    const updateData: UpdateProofingOrderRequest = {};

    const processTotalQuantity = () => {
      const qty = parseInt(inlineTotalQuantity, 10);
      if (isNaN(qty) || qty < 1) {
        toast.error("Lỗi", {
          description: "Số giấy in phải là số nguyên lớn hơn 0",
        });
        return false;
      }
      if (qty !== order.totalQuantity) {
        updateData.totalQuantity = qty;
      }
      return true;
    };

    const processPaperSize = async () => {
      if (inlinePaperSizeId === "custom" && inlineCustomPaperSize?.trim()) {
        try {
          const createdPaperSizeId = await ensurePaperSizeExistsForUpdate(
            inlineCustomPaperSize,
            inlinePaperSizeId,
          );
          if (createdPaperSizeId) {
            updateData.paperSizeId = createdPaperSizeId;
            updateData.customPaperSize = null;
          } else {
            updateData.paperSizeId = null;
            updateData.customPaperSize = inlineCustomPaperSize || null;
          }
        } catch (error) {
          toast.error("Lỗi", {
            description: "Không thể tạo khổ giấy mới",
          });
          return false;
        }
      } else if (
        inlinePaperSizeId !== "none" &&
        inlinePaperSizeId !== "custom"
      ) {
        const paperSizeIdNum = parseInt(inlinePaperSizeId, 10);
        if (!isNaN(paperSizeIdNum)) {
          updateData.paperSizeId = paperSizeIdNum;
          updateData.customPaperSize = null;
        }
      } else {
        updateData.paperSizeId = null;
        updateData.customPaperSize = null;
      }
      return true;
    };

    const processNotes = () => {
      if (inlineNotes !== order.notes) {
        updateData.notes = inlineNotes || null;
      }
      return true;
    };

    const processBasisWeight = () => {
      const gsm = inlineBasisWeight ? parseInt(inlineBasisWeight, 10) : null;
      if (inlineBasisWeight && (isNaN(gsm as number) || (gsm as number) < 1)) {
        toast.error("Lỗi", {
          description: "Định lượng (GSM) phải là số nguyên lớn hơn 0",
        });
        return false;
      }
      if (gsm !== order.basisWeight) {
        updateData.basisWeight = gsm;
      }
      return true;
    };

    const processRollWidth = () => {
      const roll = inlineRollWidth ? parseInt(inlineRollWidth, 10) : null;
      if (inlineRollWidth && (isNaN(roll as number) || (roll as number) < 1)) {
        toast.error("Lỗi", {
          description: "Khổ cuộn phải là số nguyên lớn hơn 0",
        });
        return false;
      }
      if (roll !== order.rollWidth) {
        updateData.rollWidth = roll;
      }
      return true;
    };

    const processCode = () => {
      const codeVal = inlineCode.trim();
      if (!codeVal) {
        toast.error("Lỗi", {
          description: "Mã bài không được để trống",
        });
        return false;
      }
      if (codeVal !== order.code) {
        updateData.code = codeVal;
      }
      return true;
    };

    if (editingField === "totalQuantity") {
      if (!processTotalQuantity()) return;
    } else if (editingField === "paperSize") {
      if (!(await processPaperSize())) return;
    } else if (editingField === "notes") {
      processNotes();
    } else if (editingField === "basisWeight") {
      if (!processBasisWeight()) return;
    } else if (editingField === "rollWidth") {
      if (!processRollWidth()) return;
    } else if (editingField === "code") {
      if (!processCode()) return;
    } else if (editingField === "all") {
      if (!processTotalQuantity()) return;
      if (!(await processPaperSize())) return;
      processNotes();
      if (!processBasisWeight()) return;
      if (!processRollWidth()) return;
      if (!processCode()) return;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      try {
        await updateProofingOrderAsync({
          id: order.id,
          data: updateData,
        });
        // Query will be automatically invalidated by the hook's onSuccess
        setEditingField(null);
        // Toast is already shown by the hook
      } catch (error) {
        // Error is handled by the hook
        // Don't close editing mode on error
      }
    } else {
      setEditingField(null);
    }
  };

  const handleOpenUpdateInfoDialog = () => {
    if (!order) return;
    setUpdateStatus(order.status || "");
    setUpdateNotes(order.notes || "");
    setUpdatePaperSizeId(
      order.paperSizeId ? order.paperSizeId.toString() : "custom",
    );
    setUpdateCustomPaperSize(order.customPaperSize || "");
    setUpdateTotalQuantity((order.totalQuantity ?? 0).toString());
    setUpdateBasisWeight((order.basisWeight ?? "").toString());
    setUpdateRollWidth((order.rollWidth ?? "").toString());

    // Không động tới file/ảnh và số lượng ở đây, flow này chỉ lo ghi chú + khổ giấy
    setIsUpdateInfoDialogOpen(true);
  };

  const handleUpdateInfo = async () => {
    if (!order?.id) return;

    const updateData: UpdateProofingOrderRequest = {};

    if (updateNotes !== order.notes) {
      updateData.notes = updateNotes || null;
    }

    const gsmNum = updateBasisWeight ? parseInt(updateBasisWeight, 10) : null;
    if (updateBasisWeight && (isNaN(gsmNum as number) || (gsmNum as number) < 1)) {
      toast.error("Lỗi", { description: "Định lượng (GSM) phải là số nguyên lớn hơn 0" });
      return;
    }
    if (gsmNum !== order.basisWeight) {
      updateData.basisWeight = gsmNum;
    }

    const rollNum = updateRollWidth ? parseInt(updateRollWidth, 10) : null;
    if (updateRollWidth && (isNaN(rollNum as number) || (rollNum as number) < 1)) {
      toast.error("Lỗi", { description: "Khổ cuộn phải là số nguyên lớn hơn 0" });
      return;
    }
    if (rollNum !== order.rollWidth) {
      updateData.rollWidth = rollNum;
    }

    // Create paper size if needed (for custom paper size)
    if (updatePaperSizeId === "custom" && updateCustomPaperSize?.trim()) {
      try {
        const createdPaperSizeId = await ensurePaperSizeExistsForUpdate(
          updateCustomPaperSize,
          updatePaperSizeId,
        );
        if (createdPaperSizeId) {
          updateData.paperSizeId = createdPaperSizeId;
          updateData.customPaperSize = null;
        } else {
          updateData.paperSizeId = null;
          updateData.customPaperSize = updateCustomPaperSize || null;
        }
      } catch (error) {
        toast.error("Lỗi", {
          description: "Không thể tạo khổ giấy mới",
        });
        return;
      }
    } else if (updatePaperSizeId !== "none" && updatePaperSizeId !== "custom") {
      const paperSizeIdNum = parseInt(updatePaperSizeId, 10);
      if (!isNaN(paperSizeIdNum)) {
        updateData.paperSizeId = paperSizeIdNum;
        updateData.customPaperSize = null;
      }
    } else {
      updateData.paperSizeId = null;
      updateData.customPaperSize = null;
    }
    // Handle totalQuantity
    if (updateTotalQuantity) {
      const totalQtyNum = parseInt(updateTotalQuantity, 10);
      if (
        !isNaN(totalQtyNum) &&
        totalQtyNum >= 1 &&
        totalQtyNum !== order.totalQuantity
      ) {
        updateData.totalQuantity = totalQtyNum;
      }
    }

    // Note: designUpdates are now handled separately via handleUpdateDesignQuantity
    // Each design item is updated individually, not all at once

    // Only call update API if there are changes (excluding image which was already uploaded)
    const hasChanges = Object.keys(updateData).length > 0;
    if (hasChanges) {
      try {
        await updateProofingOrderAsync({
          id: order.id,
          data: updateData,
        });
        // Query will be automatically invalidated by the hook's onSuccess
      } catch (error) {
        // Error is handled by the hook
        return;
      }
    }

    setIsUpdateInfoDialogOpen(false);
    toast.success("Thành công", {
      description: "Đã cập nhật thông tin bình bài",
    });
  };

  // Handle update quantity for a single design item
  const handleUpdateDesignQuantity = async (designId: number) => {
    if (!order?.id) return;

    // Use inlineQuantityValue if editing, otherwise use updateDesignQuantities
    const qtyStr =
      editingQuantityDesignId === designId
        ? inlineQuantityValue
        : updateDesignQuantities[designId];

    if (!qtyStr) return;

    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error("Lỗi", {
        description: "Số lượng phải là số nguyên lớn hơn 0",
      });
      return;
    }

    const originalDesign = order.proofingOrderDesigns?.find(
      (pod) => pod.id === designId,
    );
    if (!originalDesign) {
      toast.error("Lỗi", {
        description: "Không tìm thấy mã hàng",
      });
      return;
    }

    // If quantity hasn't changed, no need to update
    if (originalDesign.quantity === qty) {
      // Clear the input and exit editing mode
      if (editingQuantityDesignId === designId) {
        setEditingQuantityDesignId(null);
        setInlineQuantityValue("");
      } else {
        setUpdateDesignQuantities((prev) => {
          const next = { ...prev };
          delete next[designId];
          return next;
        });
      }
      return;
    }

    setUpdatingDesignId(designId);

    try {
      const updateData: UpdateProofingOrderRequest = {
        designUpdates: [
          {
            proofingOrderDesignId: designId,
            quantity: qty,
          },
        ],
      };

      await updateProofingOrderAsync({
        id: order.id,
        data: updateData,
      });
      // Query will be automatically invalidated by the hook's onSuccess

      // Clear the input and exit editing mode after successful update
      if (editingQuantityDesignId === designId) {
        setEditingQuantityDesignId(null);
        setInlineQuantityValue("");
      } else {
        setUpdateDesignQuantities((prev) => {
          const next = { ...prev };
          delete next[designId];
          return next;
        });
      }

      toast.success("Thành công", {
        description: `Đã cập nhật số lượng cho ${originalDesign.design?.code || "mã hàng"}`,
      });
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setUpdatingDesignId(null);
    }
  };
  const handleOldStatusChangeClick = () => {
    // Chỉ cho phép khi status là waiting_for_file (logic cũ)
    if (order?.status === "waiting_for_file") {
      if (!order.proofingFileUrl) {
        toast.error("Chưa thể chuyển trạng thái", {
          description: "Vui lòng tải lên file bình bài trước khi chuyển trạng thái.",
        });
        return;
      }
      setIsConfirmStatusDialogOpen(true);
    }
  };

  // Xác định trạng thái tiếp theo và label nút dựa trên trạng thái hiện tại
  const getNextStatusInfo = () => {
    if (!order?.status) return null;

    const currentStatus = order.status;

    // not_completed or production_returned → completed
    if (currentStatus === "not_completed" || currentStatus === "production_returned") {
      return {
        nextStatus: "completed",
        buttonLabel: "Hoàn thành",
        confirmMessage: "Bạn có chắc chắn muốn đánh dấu mã bài là hoàn thành?",
      };
    }

    // completed → paused
    if (currentStatus === "completed") {
      return {
        nextStatus: "paused",
        buttonLabel: "Tạm dừng",
        confirmMessage: "Bạn có chắc chắn muốn tạm dừng mã bài này?",
      };
    }

    // paused → completed
    if (currentStatus === "paused") {
      return {
        nextStatus: "completed",
        buttonLabel: "Tiếp tục",
        confirmMessage: "Bạn có chắc chắn muốn tiếp tục mã bài này?",
      };
    }

    return null;
  };

  const { mutate: cancelProofing, isPending: isCanceling } =
    useCancelProofingOrder();



  const handleCancelProofingOrder = () => {
    if (isLoadingProductions) {
      toast.info("Đang kiểm tra lệnh sản xuất, vui lòng đợi...");
      return;
    }

    const hasProduction =
      hasExternalProduction || (order?.productions?.length ?? 0) > 0;

    if (hasProduction) {
      toast.error("Không thể hủy bình bài đã có lệnh sản xuất.");
      return;
    }
    setCancelReason("");
    setIsConfirmCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!order?.id || !cancelReason.trim()) return;

    cancelProofing(
      { id: order.id, reason: cancelReason },
      {
        onSuccess: () => {
          setIsConfirmCancelDialogOpen(false);
          setCancelReason("");
          navigate("/proofing");
        },
      },
    );
  };

  const nextStatusInfo = getNextStatusInfo();

  const handleStatusChangeClick = () => {
    if (nextStatusInfo) {
      if (
        nextStatusInfo.nextStatus === "completed" &&
        (order?.status === "not_completed" || order?.status === "production_returned")
      ) {
        if (!canMarkCompleted) {
          toast.error("Chưa thể hoàn thành vì còn thiếu thông tin:", {
            description: (
              <div className="mt-2 text-stone-850 dark:text-stone-200">
                <p className="font-semibold text-xs text-red-650 dark:text-red-400 mb-1">Vui lòng kiểm tra và hoàn thành các mục sau:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  {completionMissingItems.map((item) => (
                    <li key={item} className="text-red-600 dark:text-red-400">{item}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 8000,
          });
          return;
        }
        handleConfirmHandToProduction();
      } else {
        setPendingStatus(nextStatusInfo.nextStatus);
        setIsConfirmStatusChangeDialogOpen(true);
      }
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!order?.id || !pendingStatus) {
      setIsConfirmStatusChangeDialogOpen(false);
      setPendingStatus(null);
      return;
    }

    try {
      await updateProofing({ id: order.id, data: { status: pendingStatus } });
      setIsConfirmStatusChangeDialogOpen(false);
      setPendingStatus(null);
      toast.success("Thành công", {
        description: `Đã cập nhật trạng thái sang ${proofingStatusLabels[pendingStatus] || pendingStatus}`,
      });
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleConfirmHandToProduction = async () => {
    if (!order?.id) {
      setIsHandToProductionDialogOpen(false);
      return;
    }

    // Kiểm tra điều kiện trước khi hand to production
    const needsDieExport =
      orderDesigns.some(
        (pod) => pod.design?.processClassification === "die_cut",
      ) && !isDieExported;

    if (!order.isPlateExported || (needsDieExport && !isDieExported)) {
      toast.error("Lỗi", {
        description: needsDieExport
          ? "Cần hoàn thành xuất kẽm và khuôn bế trước khi chuyển xuống sản xuất"
          : "Cần hoàn thành xuất kẽm trước khi chuyển xuống sản xuất",
      });
      return;
    }

    try {
      // Cập nhật trạng thái sang completed trước
      await updateProofing({ id: order.id, data: { status: "completed" } });


    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
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

  const handleOpenReplaceDieDialog = (dieExport: DieExportResponse) => {
    setReplacingDieExport(dieExport);
    setIsReplaceDieDialogOpen(true);
  };


  const handleRemoveDie = (dieId: number) => {
    setRemoveTargetDieId(dieId);
    setIsRemoveDieConfirmOpen(true);
  };

  const handleConfirmRemoveDie = async () => {
    if (!order?.id || removeTargetDieId === null) return;

    try {
      await removeDieMutate({
        proofingOrderId: order.id,
        dieId: removeTargetDieId,
      },
        {
          onSuccess: () => {
            setIsRemoveDieConfirmOpen(false);
            setRemoveTargetDieId(null);
          },
        },
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenAddDieDialog = () => {
    setIsAddDieDialogOpen(true);
  };
  const handleRemoveDesignClick = (pod: any) => {
    setRemoveDesignTarget({
      proofingOrderDesignId: pod.id!,
      designCode: pod.design?.code,
      designName: pod.design?.designName,
    });
    setIsConfirmRemoveDesignDialogOpen(true);
  };

  const handleConfirmRemoveDesign = () => {
    if (!order?.id || !removeDesignTarget) return;
    removeDesignMutate(
      {
        proofingOrderId: order.id,
        proofingOrderDesignId: removeDesignTarget.proofingOrderDesignId,
      },
      {
        onSuccess: (data) => {
          if (data === null) {
            toast.success("Thành công", {
              description: "Bình bài đã bị xóa",
            });
            navigate("/proofing");
          } else {
            setIsConfirmRemoveDesignDialogOpen(false);
            setRemoveDesignTarget(null);
          }
        },
      },
    );
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!order?.id) return;
    const imageFiles = files.filter((f) => isImageFile(f));

    if (imageFiles.length === 0) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn ít nhất 1 ảnh (JPG, PNG) để tải lên",
      });
      return;
    }

    try {
      await uploadImagesMutate({ proofingOrderId: order.id, files: imageFiles });
      setIsUploadDialogOpen(false);
      setUploadFiles([]);
    } catch (error) {
      console.error("Failed to upload images", error);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!order?.id) return;
    try {
      await deleteImageMutate({ proofingOrderId: order.id, imageId });
    } catch (error) {
      console.error("Failed to delete image", error);
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
      toast.error("Lỗi", {
        description: "Không thể tải lên file",
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
        description: "Không thể tải lên ảnh",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="h-full bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Không tìm thấy mã bài</p>
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
    <div className="relative h-full flex flex-col overflow-hidden bg-background p-4">
      {/* Header */}
      <DetailHeader
        order={order}
        isEmptyOrder={isEmptyOrder}
        hasDieCutDesigns={hasDieCutDesigns}
        nextStatusInfo={nextStatusInfo}
        canMarkCompleted={canMarkCompleted}
        completionMissingItems={completionMissingItems}
        onBack={() => navigate("/proofing")}
        onOpenDieList={() => setIsDieListDialogOpen(true)}
        onUploadClick={() => setIsUploadDialogOpen(true)}
        onStatusChangeClick={handleStatusChangeClick}
        onOldStatusChangeClick={handleOldStatusChangeClick}
        onCancelClick={handleCancelProofingOrder}
        isProofer={isProofer}
        editingField={editingField}
        inlineCode={inlineCode}
        setInlineCode={setInlineCode}
        isUpdatingInfo={isUpdatingInfo}
        handleStartEditField={handleStartEditField}
        handleCancelEditField={handleCancelEditField}
        handleSaveField={handleSaveField}
        onDeleteClick={() => setIsConfirmDeleteDialogOpen(true)}
        isDeleting={isDeleting}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isEmptyOrder ? (
          <div className="flex-1 flex flex-row gap-4 overflow-hidden">
            {/* Left: selectable designs */}
            <div className="w-2/3 min-w-0 flex flex-col">
              <div className="flex-1 flex flex-col overflow-hidden border rounded-xl bg-card">
                {/* Filters Header */}
                <div className="shrink-0 p-4 border-b space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Thiết kế chờ bình bài ({paginatedDesigns.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Đã chọn: {selectedCount}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDieListDialogOpen(true)}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Danh sách khuôn bế
                    </Button>
                  </div>

                  <FilterSection
                    designTypeOptions={designTypeOptions}
                    materialTypeOptions={(
                      availableDesignsData?.materialTypeOptions || []
                    ).map((m) => ({
                      id: m.id,
                      name: m.name || "",
                      count: 0,
                    }))}
                    selectedDesignTypes={selectedDesignTypes}
                    selectedMaterialTypes={selectedMaterialTypes}
                    currentMaterialTypeId={currentMaterialTypeId}
                    onDesignTypeChange={setSelectedDesignTypes}
                    onMaterialTypeChange={setSelectedMaterialTypes}
                    onClearFilters={handleClearFilters}
                    hasActiveFilters={
                      selectedDesignTypes.length > 0 ||
                      selectedMaterialTypes.length > 0 ||
                      searchTerm.trim().length > 0
                    }
                  />
                </div>

                {/* Table Area */}
                <ScrollArea className="flex-1">
                  <div className="p-0">
                    <DesignTable
                      designs={paginatedDesigns}
                      selectedIds={selectedIds}
                      onToggle={isProofer ? (design) => {
                        toggleSelection(design);
                        // Auto-filter by design type if selecting for the first time
                        if (
                          selectedIds.size === 0 &&
                          typeof design.designTypeId === "number"
                        ) {
                          setSelectedDesignTypes([design.designTypeId]);
                        }
                      } : undefined}
                      canSelect={isProofer ? canSelect : () => false}
                      onFindDie={handleFindDie}
                    />
                  </div>
                </ScrollArea>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                  <div className="shrink-0 p-3 border-t bg-muted/20 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Trang {currentPage} / {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: configuration panel (existing) */}
            <div className="w-1/3 min-w-0 shrink-0 h-full flex flex-col">
              <DetailEmptyOrderView
                toggleSelection={toggleSelection}
                selectedDesigns={selectedDesigns}
                selectedCount={selectedCount}
                materialTypeName={materialTypeName}
                designQuantities={designQuantities}
                setDesignQuantities={setDesignQuantities}
                paperSizes={paperSizes}
                paperSizeId={paperSizeId}
                setPaperSizeId={setPaperSizeId}
                customPaperSize={customPaperSize}
                setCustomPaperSize={setCustomPaperSize}
                showCreateButton={showCreateButton}
                handleCreatePaperSize={handleCreatePaperSize}
                isCreatingPaperSize={isCreatingPaperSize}
                proofingSheetQuantity={proofingSheetQuantity}
                setProofingSheetQuantity={setProofingSheetQuantity}
                notes={notes}
                setNotes={setNotes}
                handleSubmitDesigns={handleSubmitDesigns}
                isAddingDesigns={isAddingDesigns}
                isProofer={isProofer}
                nextOrderId={order?.code || order?.id}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[0.7fr_1.9fr_0.7fr_0.7fr] gap-4 w-full">
              <DetailOrderInfoCard
                order={order}
                editingField={editingField}
                inlineTotalQuantity={inlineTotalQuantity}
                setInlineTotalQuantity={setInlineTotalQuantity}
                inlinePaperSizeId={inlinePaperSizeId}
                setInlinePaperSizeId={setInlinePaperSizeId}
                inlineCustomPaperSize={inlineCustomPaperSize}
                setInlineCustomPaperSize={setInlineCustomPaperSize}
                inlineNotes={inlineNotes}
                setInlineNotes={setInlineNotes}
                inlineBasisWeight={inlineBasisWeight}
                setInlineBasisWeight={setInlineBasisWeight}
                inlineRollWidth={inlineRollWidth}
                setInlineRollWidth={setInlineRollWidth}
                paperSizes={paperSizes}
                uniqueProcessClassifications={uniqueProcessClassifications}
                uniqueLaminationTypes={uniqueLaminationTypes}
                uniqueSpecifications={uniqueSpecifications}
                isUpdatingInfo={isUpdatingInfo}
                handleStartEditField={handleStartEditField}
                handleStartEditAllFields={handleStartEditAllFields}
                handleCancelEditField={handleCancelEditField}
                handleSaveField={handleSaveField}
                setIsUploadDialogOpen={setIsUploadDialogOpen}
                setImageViewerOpen={setImageViewerOpen}
                setViewingImageUrl={setViewingImageUrl}
                onDeleteImage={handleDeleteImage}
                isProofer={isProofer}
              />

              <DetailDesignsListCard
                order={order}
                orderDesigns={orderDesigns}
                editingQuantityDesignId={editingQuantityDesignId}
                setEditingQuantityDesignId={setEditingQuantityDesignId}
                inlineQuantityValue={inlineQuantityValue}
                setInlineQuantityValue={setInlineQuantityValue}
                handleUpdateDesignQuantity={handleUpdateDesignQuantity}
                updatingDesignId={updatingDesignId}
                setIsAddDesignDialogOpen={setIsAddDesignDialogOpen}
                setRemoveDesignTarget={setRemoveDesignTarget}
                setIsConfirmRemoveDesignDialogOpen={
                  setIsConfirmRemoveDesignDialogOpen
                }
                isRemovingDesign={isRemovingDesign}
                setImageViewerOpen={setImageViewerOpen}
                setViewingImageUrl={setViewingImageUrl}
                setSelectedDesignForRelatedDies={
                  setSelectedDesignForRelatedDies
                }
                setIsRelatedDiesDialogOpen={setIsRelatedDiesDialogOpen}
                onReject={handleOpenRejectDialog}
                isRejecting={isRejecting}
                onFindDie={handleFindDie}
                highlightSearchTerm={highlightSearchTerm}
                isProofer={isProofer}
              />

              <DetailPlateExportCard
                order={order}
                setIsPlateExportDialogOpen={setIsPlateExportDialogOpen}
                setEditingPlateExport={setEditingPlateExport}
                handleHandToProduction={handleConfirmHandToProduction}
                isHandingToProduction={isHandingToProduction}
                isProofer={isProofer}
              />

              {hasDieCutDesigns ? (
                <DetailDieExportCard
                  order={order}
                  hasDieCutDesigns={hasDieCutDesigns}
                  isDieExported={isDieExported}
                  setIsDieExportDialogOpen={setIsDieExportDialogOpen}
                  handleOpenReplaceDieDialog={handleOpenReplaceDieDialog}
                  handleRemoveDie={handleRemoveDie}
                  isRemovingDie={isRemovingDie}
                  onEditDie={(die) => {
                    setEditingDie(die);
                    setIsEditDieDialogOpen(true);
                  }}
                  setIsDieListDialogOpen={setIsDieListDialogOpen}
                  setImageViewerOpen={setImageViewerOpen}
                  setViewingImageUrl={setViewingImageUrl}
                  isProofer={isProofer}
                />
              ) : (
                <div /> /* Empty div to maintain grid if no die cut designs */
              )}
            </div>
          </div>
        )}
      </div>

      <PrepressDetailDialogs
        order={order}
        isConfirmCancelDialogOpen={isConfirmCancelDialogOpen}
        setIsConfirmCancelDialogOpen={setIsConfirmCancelDialogOpen}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        handleConfirmCancel={handleConfirmCancel}
        isCanceling={isCanceling}
        isConfirmDeleteDialogOpen={isConfirmDeleteDialogOpen}
        setIsConfirmDeleteDialogOpen={setIsConfirmDeleteDialogOpen}
        handleConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
        isUploadDialogOpen={isUploadDialogOpen}
        setIsUploadDialogOpen={setIsUploadDialogOpen}
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
        uploadImage={uploadImage}
        setUploadImage={setUploadImage}
        handleUploadFiles={handleUploadFiles}
        handleUploadImage={handleUploadImage}
        isUploadingImage={isUploadingImage}
        isImageUploadDialogOpen={isImageUploadDialogOpen}
        setIsImageUploadDialogOpen={setIsImageUploadDialogOpen}
        isConfirmRemoveDesignDialogOpen={isConfirmRemoveDesignDialogOpen}
        setIsConfirmRemoveDesignDialogOpen={setIsConfirmRemoveDesignDialogOpen}
        removeDesignTarget={removeDesignTarget}
        handleConfirmRemoveDesign={handleConfirmRemoveDesign}
        isRemovingDesign={isRemovingDesign}
        imageViewerOpen={imageViewerOpen}
        setImageViewerOpen={setImageViewerOpen}
        viewingImageUrl={viewingImageUrl}
        setViewingImageUrl={setViewingImageUrl}
        isPlateExportDialogOpen={isPlateExportDialogOpen}
        setIsPlateExportDialogOpen={setIsPlateExportDialogOpen}
        editingPlateExport={editingPlateExport}
        setEditingPlateExport={setEditingPlateExport}
        handlePlateExportSuccess={handlePlateExportSuccess}
        isDieExportDialogOpen={isDieExportDialogOpen}
        setIsDieExportDialogOpen={setIsDieExportDialogOpen}
        handleDieExportSuccess={handleDieExportSuccess}
        isConfirmStatusChangeDialogOpen={isConfirmStatusChangeDialogOpen}
        setIsConfirmStatusChangeDialogOpen={setIsConfirmStatusChangeDialogOpen}
        nextStatusInfo={nextStatusInfo}
        pendingStatus={pendingStatus}
        setPendingStatus={setPendingStatus}
        handleConfirmStatusChange={handleConfirmStatusChange}
        isDieListDialogOpen={isDieListDialogOpen}
        setIsDieListDialogOpen={setIsDieListDialogOpen}
        dieListInitialSize={dieListInitialSize}
        isRemoveDieConfirmOpen={isRemoveDieConfirmOpen}
        setIsRemoveDieConfirmOpen={setIsRemoveDieConfirmOpen}
        handleConfirmRemoveDie={handleConfirmRemoveDie}
        isRemovingDie={isRemovingDie}
        isEditDieDialogOpen={isEditDieDialogOpen}
        setIsEditDieDialogOpen={setIsEditDieDialogOpen}
        editingDie={editingDie}
        setEditingDie={setEditingDie}
        isHandToProductionDialogOpen={isHandToProductionDialogOpen}
        setIsHandToProductionDialogOpen={setIsHandToProductionDialogOpen}
        hasDieCutDesigns={hasDieCutDesigns}
        isDieExported={isDieExported}
        handleConfirmHandToProduction={handleConfirmHandToProduction}
        isHandingToProduction={isHandingToProduction}
        isAddDesignDialogOpen={isAddDesignDialogOpen}
        setIsAddDesignDialogOpen={setIsAddDesignDialogOpen}
        availableDesignsForAdding={availableDesignsForAdding}
        currentDesignForAdding={currentDesignForAdding}
        addDesignsMutate={addDesignsMutate}
        isAddingDesigns={isAddingDesigns}
        isReplaceDieDialogOpen={isReplaceDieDialogOpen}
        setIsReplaceDieDialogOpen={setIsReplaceDieDialogOpen}
        replacingDieExport={replacingDieExport}
        setReplacingDieExport={setReplacingDieExport}
        isAddDieDialogOpen={isAddDieDialogOpen}
        setIsAddDieDialogOpen={setIsAddDieDialogOpen}
        selectedDesignForRelatedDies={selectedDesignForRelatedDies}
        setSelectedDesignForRelatedDies={setSelectedDesignForRelatedDies}
        isRelatedDiesDialogOpen={isRelatedDiesDialogOpen}
        setIsRelatedDiesDialogOpen={setIsRelatedDiesDialogOpen}
        isRejectDialogOpen={isRejectDialogOpen}
        setIsRejectDialogOpen={setIsRejectDialogOpen}
        rejectTarget={rejectTarget}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleConfirmReject={async () => {
          if (!rejectTarget || !order?.id) return;
          try {
            // 1. Remove design from proofing order first
            await removeDesignMutateAsync({
              proofingOrderId: order.id,
              proofingOrderDesignId: rejectTarget.id,
            });

            // 2. Reject/return design to design department
            await rejectDesignMutate({
              designId: rejectTarget.designId || rejectTarget.design?.id || rejectTarget.id,
              reason: rejectReason.trim() || null,
            });

            setIsRejectDialogOpen(false);
            setRejectTarget(null);
            setRejectReason("");
            queryClient.invalidateQueries({
              queryKey: proofingKeys.detail(order.id),
            });
          } catch (err) {
            console.error("Reject design failed:", err);
          }
        }}
        isRejecting={isRejecting || isRemovingDesign}
      />
    </div>
  );
}
