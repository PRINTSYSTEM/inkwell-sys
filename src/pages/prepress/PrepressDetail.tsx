import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
  Plus,
  FolderTree,
  Hash,
  Maximize2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Box,
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
import { useNavigate, useParams } from "react-router-dom";
import {
  useProofingOrder,
  useUploadProofingFile,
  useUploadProofingImage,
  useUpdateProofingOrder,
  useUpdateProofingFile,
  useUpdateProofingImage,
  useHandToProduction,
  usePaperSizes,
  useAddDesignsToProofingOrder,
  useRemoveDesignFromProofingOrder,
  useCreatePaperSize,
  useAvailableQuantity,
  useProofingAvailableOrderDetailsDesignTypeSummary,
} from "@/hooks/use-proofing-order";
import { useAvailableOrderDetailsForProofing } from "@/hooks";
import { useProofingSelection } from "@/hooks/useProofingSelection";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { DesignTable } from "@/components/proofing/DesignTable";
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
} from "@/hooks/use-die";
import type {
  DieResponse,
  ReplaceDieRequest,
  AssignDieToProofingOrderRequest,
} from "@/Schema";
import { DieListDialog } from "@/components/dies/DieListDialog";

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
      isEditing && !!designId
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

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUpdateFileDialogOpen, setIsUpdateFileDialogOpen] = useState(false);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);

  // Helper functions for file classification
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  const isProofingFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return (
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".ai") ||
      fileName.endsWith(".psd") ||
      file.type === "application/pdf" ||
      file.type === "application/postscript"
    );
  };
  const [isPlateExportDialogOpen, setIsPlateExportDialogOpen] = useState(false);
  const [isDieExportDialogOpen, setIsDieExportDialogOpen] = useState(false);
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
  const [selectedNewDieId, setSelectedNewDieId] = useState<number | null>(null);
  const [replaceDieNotes, setReplaceDieNotes] = useState<string>("");
  const [dieSearchTerm, setDieSearchTerm] = useState<string>("");

  // Add die dialog state
  const [isAddDieDialogOpen, setIsAddDieDialogOpen] = useState(false);
  const [selectedDieIdForAdd, setSelectedDieIdForAdd] = useState<number | null>(
    null
  );
  const [addDieNotes, setAddDieNotes] = useState<string>("");
  const [addDieSearchTerm, setAddDieSearchTerm] = useState<string>("");

  // Form state cho từng card
  const [isQuantityEditOpen, setIsQuantityEditOpen] = useState(false);

  // Confirm remove design dialog
  const [isConfirmRemoveDesignDialogOpen, setIsConfirmRemoveDesignDialogOpen] =
    useState(false);
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
    null
  );

  // Inline editing state for order info
  const [editingField, setEditingField] = useState<
    "totalQuantity" | "paperSize" | "notes" | null
  >(null);
  const [inlineTotalQuantity, setInlineTotalQuantity] = useState<string>("");
  const [inlinePaperSizeId, setInlinePaperSizeId] = useState<string>("custom");
  const [inlineCustomPaperSize, setInlineCustomPaperSize] =
    useState<string>("");
  const [inlineNotes, setInlineNotes] = useState<string>("");

  const idValue = params.id ? Number(params.id) : Number.NaN;
  const idValid = IdSchema.safeParse(idValue).success;

  const {
    data: orderResp,
    isLoading,
    error,
  } = useProofingOrder(idValid ? idValue : null, idValid);

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
    // Fallback: compute from dieExports array
    return (order.dieExports?.length ?? 0) > 0;
  }, [order]);

  // Check if any design has processClassification === "die_cut" (Bế)
  const hasDieCutDesigns = useMemo(() => {
    if (!orderDesigns || orderDesigns.length === 0) return false;
    return orderDesigns.some(
      (pod) => pod.design?.processClassification === "die_cut"
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

  // ===== Completion readiness (for "Hoàn thành") =====
  const completionMissingItems = useMemo(() => {
    const missing: string[] = [];
    if (!order) return missing;

    if (!order.proofingFileUrl) missing.push("Chưa upload file bình bài");
    if (!order.imageUrl) missing.push("Chưa upload ảnh bình bài");

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
  const { mutate: removeDesignMutate, isPending: isRemovingDesign } =
    useRemoveDesignFromProofingOrder();

  // Replace die hooks
  const { mutate: replaceDieMutate, isPending: isReplacingDie } =
    useReplaceDie();

  // Assign and remove die hooks
  const { mutate: assignDieMutate, isPending: isAssigningDie } =
    useAssignDieToProofingOrder();
  const { mutate: removeDieMutate, isPending: isRemovingDie } =
    useRemoveDieFromProofingOrder();

  // Search dies for replacement
  const [debouncedDieSearch] = useDebounce(dieSearchTerm, 300);
  const dieSearchParams = useMemo(() => {
    if (!isReplaceDieDialogOpen) return undefined;
    return {
      dieName: debouncedDieSearch.trim() || undefined,
      isUsable: true,
      pageSize: 50,
    };
  }, [isReplaceDieDialogOpen, debouncedDieSearch]);

  // Search dies for adding
  const [debouncedAddDieSearch] = useDebounce(addDieSearchTerm, 300);
  const addDieSearchParams = useMemo(() => {
    if (!isAddDieDialogOpen) return undefined;
    return {
      dieName: debouncedAddDieSearch.trim() || undefined,
      isUsable: true,
      pageSize: 50,
    };
  }, [isAddDieDialogOpen, debouncedAddDieSearch]);

  const { data: searchDiesData, isLoading: isLoadingDies } =
    useSearchDies(dieSearchParams);
  const availableDies = searchDiesData?.items || [];

  const { data: addDieSearchData, isLoading: isLoadingAddDies } =
    useSearchDies(addDieSearchParams);
  const availableDiesForAdd = addDieSearchData?.items || [];

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
    toggleSelection,
    clearSelection,
    isSelected,
    canSelect,
  } = useProofingSelection();

  // Filter states for design selection
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<number[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>(
    []
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
        .filter(Boolean) ?? []
    );
    return availableDesignsData.designs.filter(
      (design) => !existingDesignIds.has(design.designId)
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

    return designTypeItems.map((dt) => ({
      id: dt.id,
      name: dt.name || "",
      count: countMap.get(dt.id) || 0,
    }));
  }, [designTypesData, availableDesignsData?.designs, designTypesCount]);

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

  // Check if all selected designs are nhãn giấy or decal (these can have different laminationType)
  const areAllSelectedDesignsNhanOrDecal = useMemo(() => {
    if (selectedDesigns.length === 0) return false;
    return selectedDesigns.every(
      (design) =>
        isNhanDesignType(design.designTypeName || "") ||
        isDecalDesignType(design.designTypeName || "")
    );
  }, [selectedDesigns]);

  // Get laminationType from selected designs (if any)
  const selectedLaminationType = useMemo(() => {
    if (selectedDesigns.length === 0) return null;
    // Get laminationType from first selected design
    return selectedDesigns[0]?.laminationType || null;
  }, [selectedDesigns]);

  // Apply client-side filters (for empty order)
  // Note: designTypeId and designCode are now filtered by API
  // Only apply material type and lamination type filters client-side if needed
  const filteredAndSortedDesigns = useMemo(() => {
    if (!availableDesignsData || !availableDesignsData.designs) return [];

    let result = [...availableDesignsData.designs];

    // Filter by material type (only when no design is selected and not filtered by API)
    if (!currentMaterialTypeId && selectedMaterialTypes.length > 0) {
      result = result.filter((d) =>
        selectedMaterialTypes.includes(d.materialTypeId)
      );
    }

    // Filter by laminationType (when designs are selected)
    // EXCEPTION: Nhãn giấy và Decal không bắt buộc phải có laminationType giống nhau
    // Chỉ áp dụng filter laminationType nếu KHÔNG phải tất cả selected designs đều là nhãn giấy hoặc decal
    if (
      selectedLaminationType !== null &&
      selectedDesigns.length > 0 &&
      !areAllSelectedDesignsNhanOrDecal
    ) {
      result = result.filter((d) => {
        // Match designs with same laminationType (including both null/undefined)
        if (
          selectedLaminationType === null ||
          selectedLaminationType === undefined
        ) {
          return d.laminationType === null || d.laminationType === undefined;
        }
        return d.laminationType === selectedLaminationType;
      });
    }

    return result;
  }, [
    availableDesignsData,
    selectedMaterialTypes,
    currentMaterialTypeId,
    selectedLaminationType,
    selectedDesigns.length,
    areAllSelectedDesignsNhanOrDecal,
  ]);

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
      (m) => m.id === currentMaterialTypeId
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
    availableQty?: number
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
        ps.height === parsedCustomPaperSize.height
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
        ps.height === parsedUpdateCustomPaperSize.height
    );
    // Fix: Return null instead of undefined to match condition check
    return found ?? null;
  }, [parsedUpdateCustomPaperSize, paperSizes]);

  // Helper function to create paper size for update if needed
  const ensurePaperSizeExistsForUpdate = async (
    customSize: string,
    currentPaperSizeId: string
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
      (ps) => ps.width === width && ps.height === height
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

      // Map designQuantities to items array with orderDetailId and quantity
      const items = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          if (!design) return null;
          const quantity = Number.isInteger(qty) ? qty : Math.floor(qty);
          if (quantity <= 0) return null;
          return {
            orderDetailId: design.id, // design.id is the orderDetailId
            quantity: quantity,
          };
        })
        .filter(
          (item): item is { orderDetailId: number; quantity: number } =>
            item !== null
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
              paperSizeId
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
            });
            // Query will be automatically invalidated by the hook's onSuccess
          } catch (error) {
            console.error("Failed to update proofing order config:", error);
            // Error is handled by the hook, but don't fail the whole operation
          }
        }
      }

      // On success: reset and the page will automatically refresh
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
    field: "totalQuantity" | "paperSize" | "notes"
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
        order.paperSizeId ? order.paperSizeId.toString() : "custom"
      );
      setInlineCustomPaperSize(order.customPaperSize || "");
    } else if (field === "notes") {
      setInlineNotes(order.notes || "");
    }
  };

  const handleCancelEditField = () => {
    setEditingField(null);
    setInlineTotalQuantity("");
    setInlinePaperSizeId("custom");
    setInlineCustomPaperSize("");
    setInlineNotes("");
  };

  const handleSaveField = async () => {
    if (!order?.id || !editingField) return;

    const updateData: UpdateProofingOrderRequest = {};

    if (editingField === "totalQuantity") {
      const qty = parseInt(inlineTotalQuantity, 10);
      if (isNaN(qty) || qty < 1) {
        toast.error("Lỗi", {
          description: "Số giấy in phải là số nguyên lớn hơn 0",
        });
        return;
      }
      if (qty !== order.totalQuantity) {
        updateData.totalQuantity = qty;
      }
    } else if (editingField === "paperSize") {
      // Handle paper size
      if (inlinePaperSizeId === "custom" && inlineCustomPaperSize?.trim()) {
        try {
          const createdPaperSizeId = await ensurePaperSizeExistsForUpdate(
            inlineCustomPaperSize,
            inlinePaperSizeId
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
          return;
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
    } else if (editingField === "notes") {
      if (inlineNotes !== order.notes) {
        updateData.notes = inlineNotes || null;
      }
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
      order.paperSizeId ? order.paperSizeId.toString() : "custom"
    );
    setUpdateCustomPaperSize(order.customPaperSize || "");
    setUpdateTotalQuantity((order.totalQuantity ?? 0).toString());

    // Không động tới file/ảnh và số lượng ở đây, flow này chỉ lo ghi chú + khổ giấy
    setIsUpdateInfoDialogOpen(true);
  };

  const handleOpenQuantityEdit = () => {
    if (!order) return;

    setUpdateTotalQuantity((order.totalQuantity ?? 0).toString());

    const initialQuantities: Record<number, string> = {};
    order.proofingOrderDesigns?.forEach((pod) => {
      if (pod.id) {
        initialQuantities[pod.id] = pod.quantity?.toString() || "";
      }
    });
    setUpdateDesignQuantities(initialQuantities);
    setIsQuantityEditOpen(true);
  };
  const handleUpdateInfo = async () => {
    if (!order?.id) return;

    const updateData: UpdateProofingOrderRequest = {};

    // Status update is hidden from dialog, so skip it
    // if (updateStatus && updateStatus !== order.status) {
    //   updateData.status = updateStatus;
    // }
    if (updateNotes !== order.notes) {
      updateData.notes = updateNotes || null;
    }

    // Create paper size if needed (for custom paper size)
    if (updatePaperSizeId === "custom" && updateCustomPaperSize?.trim()) {
      try {
        const createdPaperSizeId = await ensurePaperSizeExistsForUpdate(
          updateCustomPaperSize,
          updatePaperSizeId
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
      (pod) => pod.id === designId
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
      setIsConfirmStatusDialogOpen(true);
    }
  };

  // Xác định trạng thái tiếp theo và label nút dựa trên trạng thái hiện tại
  const getNextStatusInfo = () => {
    if (!order?.status) return null;

    const currentStatus = order.status;

    // not_completed → completed
    if (currentStatus === "not_completed") {
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

  const nextStatusInfo = getNextStatusInfo();

  const handleStatusChangeClick = () => {
    if (nextStatusInfo) {
      setPendingStatus(nextStatusInfo.nextStatus);
      setIsConfirmStatusChangeDialogOpen(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!order?.id || !pendingStatus) {
      setIsConfirmStatusChangeDialogOpen(false);
      setPendingStatus(null);
      return;
    }

    // Nếu chuyển sang "completed" từ "not_completed", hiện dialog hand to production
    if (pendingStatus === "completed" && order.status === "not_completed") {
      setIsConfirmStatusChangeDialogOpen(false);
      setIsHandToProductionDialogOpen(true);
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
        (pod) => pod.design?.processClassification === "die_cut"
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

      // Sau đó hand to production
      handToProductionMutate(order.id, {
        onSuccess: () => {
          setIsHandToProductionDialogOpen(false);
          setPendingStatus(null);
        },
      });
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
    setSelectedNewDieId(null);
    setReplaceDieNotes("");
    setDieSearchTerm("");
    setIsReplaceDieDialogOpen(true);
  };

  const handleReplaceDie = async () => {
    if (!order?.id || !replacingDieExport?.dieId || !selectedNewDieId) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn khuôn mới để thay thế",
      });
      return;
    }

    try {
      const replaceData: ReplaceDieRequest = {
        newDieId: selectedNewDieId,
        notes: replaceDieNotes.trim() || null,
      };

      await replaceDieMutate({
        proofingOrderId: order.id,
        currentDieId: replacingDieExport.dieId,
        data: replaceData,
      });

      setIsReplaceDieDialogOpen(false);
      setReplacingDieExport(null);
      setSelectedNewDieId(null);
      setReplaceDieNotes("");
      setDieSearchTerm("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRemoveDie = async (dieId: number) => {
    if (!order?.id) return;

    if (
      !confirm(
        "Bạn có chắc chắn muốn gỡ khuôn bế này khỏi bình bài? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      await removeDieMutate({
        proofingOrderId: order.id,
        dieId,
      });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleOpenAddDieDialog = () => {
    setSelectedDieIdForAdd(null);
    setAddDieNotes("");
    setAddDieSearchTerm("");
    setIsAddDieDialogOpen(true);
  };

  const handleAddDie = async () => {
    if (!order?.id || !selectedDieIdForAdd) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn khuôn bế để thêm",
      });
      return;
    }

    try {
      const assignData: AssignDieToProofingOrderRequest = {
        dieId: selectedDieIdForAdd,
        notes: addDieNotes.trim() || undefined,
      };

      await assignDieMutate({
        proofingOrderId: order.id,
        data: assignData,
      });

      setIsAddDieDialogOpen(false);
      setSelectedDieIdForAdd(null);
      setAddDieNotes("");
      setAddDieSearchTerm("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!order?.id) return;

    // Phân loại files
    const proofingFiles = files.filter((f) => isProofingFile(f));
    const imageFiles = files.filter((f) => isImageFile(f));

    const errors: string[] = [];
    const successes: string[] = [];

    // Upload file bình bài
    if (proofingFiles.length > 0) {
      try {
        await uploadProofing({
          proofingOrderId: order.id,
          file: proofingFiles[0],
        });
        successes.push(`File bình bài: ${proofingFiles[0].name}`);
      } catch (error) {
        errors.push(`File bình bài "${proofingFiles[0].name}" lỗi`);
      }
    } else {
      errors.push("Thiếu file bình bài (.pdf, .ai, .psd)");
    }

    // Upload ảnh
    if (imageFiles.length > 0) {
      try {
        await uploadImageMutate({
          proofingOrderId: order.id,
          file: imageFiles[0],
        });
        successes.push(`Ảnh: ${imageFiles[0].name}`);
      } catch (error) {
        errors.push(`Ảnh "${imageFiles[0].name}" lỗi`);
      }
    } else {
      errors.push("Thiếu file ảnh");
    }

    setIsUploadDialogOpen(false);
    setUploadFiles([]);

    // Hiển thị thông báo kết quả
    if (errors.length === 0) {
      toast.success("Thành công", {
        description: "Đã upload tất cả files",
      });
    } else if (successes.length > 0) {
      toast.warning("Một phần thành công", {
        description: `${successes.join(", ")}. Lỗi: ${errors.join(", ")}`,
      });
    } else {
      toast.error("Lỗi", {
        description: errors.join(", "),
      });
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
    <div className="h-full flex flex-col overflow-hidden bg-background p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/proofing")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{order.code ?? ""}</h1>
            <p className="text-xs text-muted-foreground">Chi tiết mã bài</p>
          </div>
        </div>
        {!isEmptyOrder && (
          <>
            {hasDieCutDesigns && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsDieListDialogOpen(true)}
              >
                <Box className="h-4 w-4" />
                Danh sách khuôn bế
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Trạng thái hiện tại:
              </span>{" "}
              <StatusBadge
                status={order.status ?? undefined}
                label={
                  proofingStatusLabels[order.status ?? ""] ?? order.status ?? ""
                }
              />
              {nextStatusInfo && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-block",
                          order?.status === "not_completed" &&
                            !canMarkCompleted &&
                            "cursor-not-allowed"
                        )}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-8 text-xs"
                          onClick={handleStatusChangeClick}
                          disabled={
                            order?.status === "not_completed" &&
                            !canMarkCompleted
                          }
                        >
                          <Edit className="h-3.5 w-3.5" />
                          {nextStatusInfo.buttonLabel}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {order?.status === "not_completed" && !canMarkCompleted && (
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            Chưa thể hoàn thành vì còn thiếu:
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {completionMissingItems.map((item) => (
                              <li key={item} className="text-sm">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {order.status === "waiting_for_file" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={handleOldStatusChangeClick}
                  disabled={!order.proofingFileUrl}
                  title={
                    !order.proofingFileUrl
                      ? "Vui lòng tải lên file bình bài trước"
                      : "Chuyển sang chờ sản xuất"
                  }
                >
                  <Edit className="h-3.5 w-3.5" />
                  Chuyển trạng thái
                </Button>
              )}
              {order.status !== "completed" && (
                <Button
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {order.proofingFileUrl ? "Thay đổi file " : "Tải lên file"}
                </Button>
              )}
              {order.isPlateExported && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                  <span>Đã xuất kẽm</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isEmptyOrder ? (
          // Render ProofingCreate-like UI when order is empty
          <div className="flex-1 flex min-h-0 w-full max-w-full overflow-hidden">
            {/* LEFT: DESIGN LIST + FILTERS */}
            <div className="basis-3/5 min-w-0 border-r flex flex-col min-h-0 bg-card/30">
              <div className="p-4 border-b">
                <FilterSection
                  designTypeOptions={designTypeOptions}
                  materialTypeOptions={
                    availableDesignsData?.materialTypeOptions || []
                  }
                  selectedDesignTypes={selectedDesignTypes}
                  selectedMaterialTypes={selectedMaterialTypes}
                  currentMaterialTypeId={currentMaterialTypeId}
                  searchTerm={searchTerm}
                  onDesignTypeChange={setSelectedDesignTypes}
                  onMaterialTypeChange={setSelectedMaterialTypes}
                  onSearchChange={setSearchTerm}
                  onClearFilters={handleClearFilters}
                />

                {currentMaterialTypeId && currentMaterialTypeName && (
                  <div className="mt-3">
                    <FilterNoticeBanner
                      materialTypeName={currentMaterialTypeName}
                      onClear={handleClearSelection}
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div
                  ref={tableContainerRef}
                  className="flex-1 overflow-auto p-4"
                >
                  {isLoadingDesigns ? (
                    <div className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                      <span>Đang tải danh sách mã hàng...</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <DesignCardSkeleton key={i} />
                        ))}
                      </div>
                    </div>
                  ) : paginatedDesigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-base font-semibold text-muted-foreground">
                      Không có mã hàng nào phù hợp.
                    </div>
                  ) : groupByOrder && groupedByOrder ? (
                    <div className="space-y-6">
                      {groupedByOrder.map((group) => (
                        <div key={group.orderCode} className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-bold text-base">
                                {group.orderCode}
                              </p>
                              {(group.customerName ||
                                group.customerCompanyName) && (
                                <p className="text-sm font-medium text-muted-foreground">
                                  {group.customerCompanyName ||
                                    group.customerName}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className="ml-auto text-sm font-semibold"
                            >
                              {group.designs.length} mã hàng
                            </Badge>
                          </div>
                          <DesignTable
                            designs={group.designs}
                            selectedIds={selectedIds}
                            canSelect={canSelect}
                            onToggle={toggleSelection}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <DesignTable
                      designs={paginatedDesigns}
                      selectedIds={selectedIds}
                      canSelect={canSelect}
                      onToggle={toggleSelection}
                    />
                  )}
                </div>
              </div>

              {/* Pagination (left list) - Server-side pagination */}
              {totalCount > 0 && (
                <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-3 text-sm text-muted-foreground bg-background">
                  <div className="text-sm font-medium text-muted-foreground">
                    Hiển thị{" "}
                    <span className="font-bold text-foreground">
                      {totalCount > 0
                        ? (currentPage - 1) * itemsPerPage + 1
                        : 0}
                    </span>
                    {" - "}
                    <span className="font-bold text-foreground">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-bold text-foreground">
                      {totalCount}
                    </span>{" "}
                    mã hàng
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || isLoadingDesigns}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Trang trước</span>
                    </Button>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Trang
                      </span>
                      <Input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onBlur={handlePageInputBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-14 h-8 text-center text-sm font-semibold"
                        disabled={isLoadingDesigns}
                      />
                      <span className="text-sm font-medium text-muted-foreground">
                        / {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages || isLoadingDesigns}
                    >
                      <span className="hidden sm:inline">Trang sau</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: INLINE PROOFING ORDER CONFIG */}
            <div className="basis-2/5 min-w-0 flex flex-col min-h-0">
              {/* Right header */}
              <div className="shrink-0 border-b bg-card/50 px-4 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-bold">
                    Thêm mã hàng vào bình bài
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedDesigns.length > 0
                      ? `${selectedDesigns.length} mã hàng • ${selectedCount} đã nhập số lượng`
                      : "Chọn mã hàng ở cột bên trái để thêm vào lệnh"}
                  </p>
                </div>
                {materialTypeName && (
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {materialTypeName}
                  </Badge>
                )}
              </div>

              {selectedDesigns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-base font-semibold text-muted-foreground">
                  Chưa có mã hàng nào được chọn.
                  <br />
                  Hãy click chọn mã hàng ở cột bên trái, hệ thống sẽ tự động
                  thêm vào bảng bên phải.
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Top: Designs table with quantities */}
                  <div className="flex-[7] overflow-hidden border-b">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-10">
                          <TableRow>
                            <TableHead className="w-10 text-center text-sm font-bold">
                              #
                            </TableHead>
                            <TableHead className="w-32 text-sm font-bold">
                              mã hàng
                            </TableHead>
                            <TableHead className="w-32 text-sm font-bold">
                              Kích thước (mm)
                            </TableHead>
                            <TableHead className="w-24 text-right text-sm font-bold">
                              Còn lại
                            </TableHead>
                            <TableHead className="w-40 text-sm font-bold">
                              Số lượng lấy
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDesigns.map((design, index) => {
                            const currentQty = designQuantities[design.id] || 0;

                            const baseAvailableQty =
                              design.availableQuantity !== undefined &&
                              design.availableQuantity >= 0
                                ? design.availableQuantity
                                : design.quantity;

                            const maxQty = baseAvailableQty;
                            const remainingQty = Math.max(
                              0,
                              baseAvailableQty - currentQty
                            );

                            const isValid =
                              currentQty > 0 && currentQty <= maxQty;
                            const isExceeded = currentQty > maxQty;
                            const hasAvailableQuantity =
                              design.availableQuantity !== undefined;

                            // Build full info for tooltip
                            const fullInfo = (
                              <div className="space-y-2 text-sm max-w-md">
                                <div className="font-semibold text-base border-b pb-2">
                                  {design.name}
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Mã hàng:
                                    </span>
                                    <span className="ml-2 font-mono">
                                      {design.code}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      Đơn hàng:
                                    </span>
                                    <span className="ml-2 font-semibold">
                                      {design.orderCode || design.orderId}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      Loại:
                                    </span>
                                    <span className="ml-2">
                                      {design.designTypeName}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      Chất liệu:
                                    </span>
                                    <span className="ml-2">
                                      {design.materialTypeName}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      Kích thước:
                                    </span>
                                    <span className="ml-2">
                                      {formatDesignDimensions(
                                        design.length,
                                        design.width,
                                        design.height
                                      )}{" "}
                                      mm
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      SL đặt:
                                    </span>
                                    <span className="ml-2 font-semibold">
                                      {design.quantity.toLocaleString()}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      SL có thể bình bài:
                                    </span>
                                    <span
                                      className={`ml-2 font-semibold ${
                                        design.availableQuantity &&
                                        design.availableQuantity > 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {design.availableQuantity?.toLocaleString() ||
                                        "—"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground">
                                      SL đang lấy:
                                    </span>
                                    <span className="ml-2 font-semibold text-primary">
                                      {currentQty.toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Nhân viên mã hàng:
                                    </span>
                                    <span className="ml-2">
                                      {design.designerName || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Nhân viên kế toán:
                                    </span>
                                    <span className="ml-2">
                                      {design.accountantName || "—"}
                                    </span>
                                  </div>
                                </div>

                                {(design.processClassificationOptionName ||
                                  design.sidesClassification ||
                                  design.laminationType) && (
                                  <div className="pt-2 border-t space-y-1">
                                    {design.processClassificationOptionName && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Quy cách:
                                        </span>
                                        <span className="ml-2">
                                          {processClassificationLabels[
                                            design
                                              .processClassificationOptionName
                                          ] ||
                                            design.processClassificationOptionName}
                                        </span>
                                      </div>
                                    )}

                                    {design.laminationType && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Cán màng:
                                        </span>
                                        <span className="ml-2">
                                          {laminationTypeLabels[
                                            design.laminationType
                                          ] || design.laminationType}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );

                            return (
                              <CursorTooltip
                                key={design.id}
                                content={fullInfo}
                                delayDuration={300}
                                className="p-4 max-w-md"
                              >
                                <TableRow
                                  className={cn(
                                    "hover:bg-muted/30",
                                    isValid && "bg-emerald-50/40",
                                    isExceeded && "bg-destructive/5"
                                  )}
                                >
                                  <TableCell className="text-center text-sm font-bold text-muted-foreground">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-bold text-base">
                                        {design.code}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                      {formatDesignDimensions(
                                        design.length,
                                        design.width,
                                        design.height
                                      )}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {hasAvailableQuantity ? (
                                      <span
                                        className={cn(
                                          "text-base font-bold",
                                          design.availableQuantity! > 0
                                            ? "text-emerald-600"
                                            : design.availableQuantity! === 0
                                              ? "text-amber-600"
                                              : "text-destructive"
                                        )}
                                      >
                                        {remainingQty.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-base font-semibold text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={maxQty}
                                        className={cn(
                                          "h-9 flex-1 text-right font-mono text-base font-semibold",
                                          isExceeded &&
                                            "border-destructive focus-visible:ring-destructive"
                                        )}
                                        value={currentQty || ""}
                                        onChange={(e) =>
                                          handleQuantityChange(
                                            design.id,
                                            e.target.value,
                                            design.quantity,
                                            design.availableQuantity
                                          )
                                        }
                                        placeholder="0"
                                      />
                                      <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap shrink-0">
                                        /{maxQty.toLocaleString()}
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CursorTooltip>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>

                  {/* Bottom: Config panel */}
                  <div className="flex-[3] border-t bg-muted/20 flex flex-col min-h-0">
                    <div className="p-2 space-y-2 overflow-y-auto flex-1">
                      {/* Row 1: Config items in one row */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Proofing Sheet Quantity */}
                        <div className="space-y-1">
                          <Label
                            htmlFor="proofingSheetQuantity"
                            className="text-xs font-bold"
                          >
                            Số lượng giấy in
                            <span className="text-destructive"> *</span>
                          </Label>
                          <div className="relative">
                            <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id="proofingSheetQuantity"
                              type="number"
                              min="1"
                              max="2147483647"
                              step="1"
                              className="pl-7 h-7 text-xs font-semibold"
                              placeholder="Nhập số lượng"
                              value={proofingSheetQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  setProofingSheetQuantity(0);
                                } else {
                                  const numValue = parseInt(value, 10);
                                  if (
                                    !isNaN(numValue) &&
                                    numValue > 0 &&
                                    numValue <= 2147483647
                                  ) {
                                    setProofingSheetQuantity(numValue);
                                  } else if (numValue > 2147483647) {
                                    setProofingSheetQuantity(2147483647);
                                  }
                                }
                              }}
                              required
                            />
                          </div>
                        </div>

                        {/* Paper Size */}
                        <div className="space-y-1">
                          <Label
                            htmlFor="paperSizeId"
                            className="text-xs font-bold"
                          >
                            Khổ giấy in
                          </Label>
                          <Select
                            value={paperSizeId}
                            onValueChange={setPaperSizeId}
                          >
                            <SelectTrigger
                              id="paperSizeId"
                              className="h-7 text-xs"
                            >
                              <Maximize2 className="h-3 w-3 mr-1.5 text-muted-foreground" />
                              <SelectValue
                                defaultValue="custom"
                                placeholder="Chọn khổ giấy"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">
                                -- Nhập thủ công --
                              </SelectItem>
                              {paperSizes?.map((ps) => (
                                <SelectItem
                                  key={ps.id}
                                  value={ps.id.toString()}
                                >
                                  {ps.name}
                                  {ps.width && ps.height
                                    ? ` (${ps.width}×${ps.height})`
                                    : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Custom Paper Size or Size Display */}
                        {paperSizeId === "custom" ? (
                          <div className="space-y-1">
                            <Label
                              htmlFor="customPaperSize"
                              className="text-xs font-bold"
                            >
                              Khổ giấy tùy chỉnh
                            </Label>
                            <div className="flex gap-1.5">
                              <Input
                                id="customPaperSize"
                                className="h-7 text-xs flex-1"
                                placeholder="31×43, 65×86..."
                                value={customPaperSize}
                                onChange={(e) =>
                                  setCustomPaperSize(e.target.value)
                                }
                                disabled={isCreatingPaperSize}
                              />
                              {showCreateButton && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 shrink-0"
                                  onClick={handleCreatePaperSize}
                                  disabled={isCreatingPaperSize}
                                >
                                  {isCreatingPaperSize ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            {existingPaperSize && (
                              <p className="text-[10px] font-medium text-muted-foreground">
                                Đã tồn tại:{" "}
                                {existingPaperSize.name ||
                                  `${existingPaperSize.width}×${existingPaperSize.height}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground">
                              Kích thước
                            </Label>
                            <div className="h-7 flex items-center px-2 rounded-md border bg-background text-xs font-semibold text-muted-foreground">
                              {paperSizeId !== "none" &&
                              paperSizes?.find(
                                (ps) => ps.id.toString() === paperSizeId
                              ) ? (
                                <span>
                                  {
                                    paperSizes.find(
                                      (ps) => ps.id.toString() === paperSizeId
                                    )?.width
                                  }{" "}
                                  ×{" "}
                                  {
                                    paperSizes.find(
                                      (ps) => ps.id.toString() === paperSizeId
                                    )?.height
                                  }
                                </span>
                              ) : (
                                <span className="italic">Chưa chọn</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Row 2: Notes */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-primary" />
                          Ghi chú
                        </Label>
                        <Textarea
                          id="notes"
                          className="min-h-[50px] text-xs resize-none"
                          placeholder="Nhập ghi chú (tùy chọn)..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="shrink-0 border-t px-3 py-2 bg-background">
                      <Button
                        onClick={handleSubmitDesigns}
                        disabled={
                          selectedDesigns.length === 0 ||
                          !hasValidQuantities ||
                          (isEmptyOrder
                            ? proofingSheetQuantity < 1
                            : order.totalQuantity < 1) ||
                          isAddingDesigns
                        }
                        className="w-full gap-1.5 h-8 text-xs"
                      >
                        {isAddingDesigns ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang thêm...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Thêm mã hàng vào bình bài
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Render normal detail view when order has designs
          <div
            className={`flex-1 grid gap-4 overflow-auto ${
              hasDieCutDesigns
                ? "lg:grid-cols-[300px_1fr_240px_300px]"
                : "lg:grid-cols-[300px_1fr_240px]"
            }`}
          >
            {/* Column 1: Thông tin lệnh bình bài */}
            <div className="space-y-4">
              {/* Compact Order Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Thông tin lệnh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Preview ảnh - đầu tiên */}
                  {order.imageUrl ? (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Xem trước ảnh
                      </Label>
                      <div
                        className="relative group h-20 rounded border overflow-hidden bg-muted cursor-pointer"
                        onClick={() => {
                          setViewingImageUrl(order.imageUrl!);
                          setImageViewerOpen(true);
                        }}
                      >
                        <img
                          src={order.imageUrl}
                          alt="Proofing Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      {!order.isPlateExported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => setIsImageUploadDialogOpen(true)}
                        >
                          Thay đổi
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Xem trước ảnh
                      </Label>
                      <div className="h-20 rounded border bg-muted flex items-center justify-center">
                        <FileImage className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Số giấy - SL hàng (cùng một dòng) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Số giấy in
                      </Label>
                      {editingField === "totalQuantity" ? (
                        <div className="space-y-1.5">
                          <Input
                            type="number"
                            min="1"
                            value={inlineTotalQuantity}
                            onChange={(e) =>
                              setInlineTotalQuantity(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveField();
                              } else if (e.key === "Escape") {
                                handleCancelEditField();
                              }
                            }}
                            className="h-7 text-sm font-bold"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              onClick={handleSaveField}
                              disabled={isUpdatingInfo}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              onClick={handleCancelEditField}
                              disabled={isUpdatingInfo}
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 group cursor-pointer"
                          onClick={() =>
                            order.status !== "completed" &&
                            handleStartEditField("totalQuantity")
                          }
                        >
                          <p
                            className={`font-bold text-sm ${
                              order.status !== "completed"
                                ? "group-hover:text-primary transition-colors"
                                : ""
                            }`}
                          >
                            {(order.totalQuantity ?? 0).toLocaleString()}
                          </p>
                          {order.status !== "completed" && (
                            <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        SL hàng
                      </Label>
                      <p className="font-bold text-sm">
                        {order.proofingOrderDesigns?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Khổ giấy */}
                  <div className="space-y-0.5">
                    <Label className="text-muted-foreground text-[10px] font-normal">
                      Khổ giấy
                    </Label>
                    {editingField === "paperSize" ? (
                      <div className="space-y-1.5">
                        <Select
                          value={inlinePaperSizeId}
                          onValueChange={setInlinePaperSizeId}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Chọn khổ giấy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">
                              -- Nhập thủ công --
                            </SelectItem>
                            {paperSizes.map((ps) => (
                              <SelectItem key={ps.id} value={ps.id.toString()}>
                                {ps.name}
                                {ps.width && ps.height
                                  ? ` (${ps.width}×${ps.height})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {inlinePaperSizeId === "custom" && (
                          <Input
                            value={inlineCustomPaperSize}
                            onChange={(e) =>
                              setInlineCustomPaperSize(e.target.value)
                            }
                            placeholder="Ví dụ: 60×60, 31×43..."
                            className="h-7 text-xs"
                          />
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px]"
                            onClick={handleSaveField}
                            disabled={isUpdatingInfo}
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={handleCancelEditField}
                            disabled={isUpdatingInfo}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 group cursor-pointer"
                        onClick={() =>
                          order.status !== "completed" &&
                          handleStartEditField("paperSize")
                        }
                      >
                        <p
                          className={`font-bold text-sm text-xs ${
                            order.status !== "completed"
                              ? "group-hover:text-primary transition-colors"
                              : ""
                          }`}
                        >
                          {order.paperSize?.name ||
                            order.customPaperSize ||
                            "Chưa xác định"}
                        </p>
                        {order.status !== "completed" && (
                          <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chất liệu */}
                  <div className="space-y-0.5">
                    <Label className="text-muted-foreground text-[10px] font-normal">
                      Chất liệu
                    </Label>
                    <div>
                      <p className="font-bold text-sm">
                        {order.materialType?.name || "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {order.materialType?.code || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Quy cách - Cán màng (cùng một dòng) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-[10px] font-bold flex items-center gap-1.5">
                        <Settings2 className="h-3 w-3" />
                        Quy cách
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueProcessClassifications.length > 0 ? (
                          uniqueProcessClassifications.map((classification) => (
                            <Badge
                              key={classification}
                              variant="secondary"
                              className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors"
                            >
                              {processClassificationLabels[classification] ||
                                classification}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ---
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-[10px] font-bold flex items-center gap-1.5">
                        <Layers className="h-3 w-3" />
                        Cán màng
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueLaminationTypes.length > 0 ? (
                          uniqueLaminationTypes.map((laminationType) => (
                            <Badge
                              key={laminationType}
                              variant="secondary"
                              className="text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                            >
                              {laminationTypeLabels[laminationType] ||
                                laminationType}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ---
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                    <div className="flex items-start gap-1.5">
                      <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold text-amber-900 dark:text-amber-100 text-[10px]">
                            Ghi chú
                          </p>
                          {order.status !== "completed" &&
                            editingField !== "notes" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleStartEditField("notes")}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                        </div>
                        {editingField === "notes" ? (
                          <div className="space-y-1.5">
                            <Textarea
                              value={inlineNotes}
                              onChange={(e) => setInlineNotes(e.target.value)}
                              placeholder="Nhập ghi chú..."
                              rows={3}
                              className="text-xs resize-none"
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Escape" &&
                                  !e.shiftKey &&
                                  !e.ctrlKey &&
                                  !e.metaKey
                                ) {
                                  handleCancelEditField();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px]"
                                onClick={handleSaveField}
                                disabled={isUpdatingInfo}
                              >
                                Lưu
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px]"
                                onClick={handleCancelEditField}
                                disabled={isUpdatingInfo}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`group ${
                              order.status !== "completed"
                                ? "cursor-pointer"
                                : ""
                            }`}
                            onClick={() =>
                              order.status !== "completed" &&
                              handleStartEditField("notes")
                            }
                          >
                            <p
                              className={`text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed text-xs ${
                                order.status !== "completed"
                                  ? "group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors"
                                  : ""
                              }`}
                            >
                              {order.notes || "---"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.proofingFileUrl && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        File:
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => {
                          if (order.proofingFileUrl) {
                            downloadFile(
                              order.proofingFileUrl,
                              order.code ?? `BB-${order.id ?? ""}`
                            );
                          }
                        }}
                      >
                        <Download className="h-3 w-3" />
                        Tải xuống
                      </Button>
                    </div>
                  )}

                  {order.status !== "completed" && (
                    <div className="pt-2 border-t space-y-3">
                      {/* File upload section */}
                      {!order.proofingFileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-7 text-xs w-full"
                          onClick={() => setIsUploadDialogOpen(true)}
                        >
                          <Upload className="h-3 w-3" />
                          Tải lên file bình bài
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Thông tin mã hàng */}
            <div className="space-y-4">
              {/* Compact Designs List */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Danh sách mã hàng ({orderDesigns?.length ?? 0})
                    </CardTitle>
                    {order && order.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => setIsAddDesignDialogOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm mã hàng
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="h-9 px-2 text-[10px] w-12">
                            STT
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Ảnh
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Mã hàng
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Kích thước
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            SL
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Số mặt in
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Quy cách
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Cán màng
                          </TableHead>
                          <TableHead className="h-9 px-2 text-right text-[10px]">
                            Thao tác
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDesigns.map((pod, index) => {
                          // Build full info for tooltip
                          const fullInfo = (
                            <div className="space-y-2 text-sm max-w-md">
                              <div className="font-semibold text-base border-b pb-2">
                                {pod.design.designName}
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                <div>
                                  <span className="text-muted-foreground">
                                    Mã hàng:
                                  </span>
                                  <span className="ml-2 font-mono">
                                    {pod.design.code}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    Loại:
                                  </span>
                                  <span className="ml-2">
                                    {pod.design.designType?.name || "—"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    Chất liệu:
                                  </span>
                                  <span className="ml-2">
                                    {pod.design.materialType?.name || "—"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    Kích thước:
                                  </span>
                                  <span className="ml-2">
                                    {formatDesignDimensions(
                                      pod.design.length,
                                      pod.design.width,
                                      pod.design.height
                                    )}{" "}
                                    mm
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    SL:
                                  </span>
                                  <span className="ml-2 font-semibold">
                                    {pod.quantity?.toLocaleString() || "0"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    Nhân viên mã hàng:
                                  </span>
                                  <span className="ml-2">
                                    {pod.design.designer?.fullName || "—"}
                                  </span>
                                </div>
                                {/* <div>
                              <span className="text-muted-foreground">
                                Nhân viên kế toán:
                              </span>
                              <span className="ml-2">
                                {pod.design.accountantName || "—"}
                              </span>
                            </div> */}
                              </div>

                              {(pod.design.processClassification ||
                                pod.design.sidesClassification ||
                                pod.design.laminationType) && (
                                <div className="pt-2 flex flex-wrap gap-1 justify-between border-t space-y-1">
                                  {pod.design.processClassification && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      <span className="text-muted-foreground">
                                        Quy cách:
                                      </span>
                                      <span className="ml-2">
                                        {processClassificationLabels[
                                          pod.design.processClassification
                                        ] || pod.design.processClassification}
                                      </span>
                                    </Badge>
                                  )}
                                  {pod.design.laminationType && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      <span className="text-muted-foreground">
                                        Cán màng:
                                      </span>
                                      <span className="ml-2">
                                        {laminationTypeLabels[
                                          pod.design.laminationType
                                        ] || pod.design.laminationType}
                                      </span>
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Yêu cầu */}
                              <div className="pt-2 border-t space-y-1">
                                <div className="font-semibold text-xs text-muted-foreground">
                                  Yêu cầu:
                                </div>
                                <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                                  {pod.design?.latestRequirements || "---"}
                                </div>
                              </div>

                              {/* Ghi chú */}
                              <div className="pt-2 border-t space-y-1">
                                <div className="font-semibold text-xs text-muted-foreground">
                                  Ghi chú:
                                </div>
                                <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                                  {pod.design?.notes || "---"}
                                </div>
                              </div>
                            </div>
                          );

                          return (
                            <CursorTooltip
                              key={pod.id}
                              content={fullInfo}
                              delayDuration={300}
                              className="p-4 max-w-md"
                            >
                              <TableRow className="h-14">
                                <TableCell className="px-2 py-1">
                                  <p className="text-xs text-muted-foreground">
                                    {index + 1}
                                  </p>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  {pod.design.designImageUrl ? (
                                    <img
                                      src={
                                        pod.design.designImageUrl ||
                                        "/placeholder.svg"
                                      }
                                      alt={pod.design.designName}
                                      className="w-10 h-10 object-cover rounded border cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingImageUrl(
                                          pod.design.designImageUrl
                                        );
                                        setImageViewerOpen(true);
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                                      <FileImage className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <p className="font-medium text-xs">
                                    {pod.design.code}
                                  </p>
                                </TableCell>

                                <TableCell className="px-2 py-1">
                                  <div className="text-xs">
                                    <p>
                                      {formatDesignDimensions(
                                        pod.design.length,
                                        pod.design.width,
                                        pod.design.height
                                      )}{" "}
                                      mm
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <QuantityCell
                                    pod={pod}
                                    editingQuantityDesignId={
                                      editingQuantityDesignId
                                    }
                                    inlineQuantityValue={inlineQuantityValue}
                                    setInlineQuantityValue={
                                      setInlineQuantityValue
                                    }
                                    setEditingQuantityDesignId={
                                      setEditingQuantityDesignId
                                    }
                                    handleUpdateDesignQuantity={
                                      handleUpdateDesignQuantity
                                    }
                                    updatingDesignId={updatingDesignId}
                                  />
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <span className="text-xs">
                                    {pod.design.sidesClassification
                                      ? sidesClassificationLabels[
                                          pod.design.sidesClassification
                                        ] || pod.design.sidesClassification
                                      : "—"}
                                  </span>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <span className="text-xs">
                                    {pod.design.processClassification
                                      ? processClassificationLabels[
                                          pod.design.processClassification
                                        ] || pod.design.processClassification
                                      : "—"}
                                  </span>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <span className="text-xs">
                                    {pod.design.laminationType
                                      ? laminationTypeLabels[
                                          pod.design.laminationType
                                        ] || pod.design.laminationType
                                      : "—"}
                                  </span>
                                </TableCell>
                                <TableCell className="px-2 py-1 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {order &&
                                      order.status !== "completed" &&
                                      pod.id && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingQuantityDesignId(pod.id!);
                                            setInlineQuantityValue(
                                              pod.quantity?.toString() || ""
                                            );
                                          }}
                                          disabled={
                                            editingQuantityDesignId ===
                                              pod.id ||
                                            updatingDesignId === pod.id
                                          }
                                          title="Cập nhật số lượng"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    {pod.design.designFileUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (pod.design.designFileUrl) {
                                            downloadFile(
                                              pod.design.designFileUrl,
                                              pod.design.code ||
                                                `DES-${pod.design.id}`
                                            );
                                          }
                                        }}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {order &&
                                      order.status !== "completed" &&
                                      pod.id && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRemoveDesignTarget({
                                              proofingOrderDesignId: pod.id!,
                                              designCode: pod.design?.code,
                                              designName:
                                                pod.design?.designName,
                                            });
                                            setIsConfirmRemoveDesignDialogOpen(
                                              true
                                            );
                                          }}
                                          disabled={isRemovingDesign}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CursorTooltip>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {order.status !== "completed" && (
                    <div className="border-t px-3 py-3 space-y-3">
                      {!isQuantityEditOpen && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-7 text-xs w-full"
                          onClick={handleOpenQuantityEdit}
                        >
                          <Edit className="h-3 w-3" />
                          Cập nhật số lượng mã hàng
                        </Button>
                      )}

                      {isQuantityEditOpen && (
                        <div className="rounded-md bg-muted/30 border px-3 py-3 space-y-3">
                          {/* Tổng số lượng */}
                          <div className="space-y-2">
                            <Label htmlFor="update-total-quantity">
                              Số giấy in
                            </Label>
                            <Input
                              id="update-total-quantity"
                              type="number"
                              min="1"
                              value={updateTotalQuantity}
                              onChange={(e) =>
                                setUpdateTotalQuantity(e.target.value)
                              }
                              placeholder="Nhập số giấy in..."
                            />
                          </div>

                          {/* Cập nhật số lượng theo mã hàng */}
                          {orderDesigns.length > 0 && (
                            <div className="space-y-2">
                              <Label>Cập nhật số lượng theo mã hàng</Label>
                              <div className="space-y-2 max-h-56 overflow-y-auto border rounded-lg p-3 bg-background/40">
                                {orderDesigns.map((pod) => {
                                  const designId = pod.id;
                                  if (!designId) return null;

                                  const currentQty =
                                    updateDesignQuantities[designId] || "";
                                  const hasChanged =
                                    currentQty &&
                                    parseInt(currentQty, 10) !== pod.quantity;
                                  const isUpdating =
                                    updatingDesignId === designId;

                                  return (
                                    <div
                                      key={designId}
                                      className="flex items-center gap-2 p-2 rounded border bg-muted/30"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                          {pod.design?.code ||
                                            `Design #${designId}`}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {pod.design?.designName || "—"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Hiện tại:{" "}
                                          {pod.quantity?.toLocaleString() || 0}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="1"
                                          value={currentQty}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            setUpdateDesignQuantities(
                                              (prev) => ({
                                                ...prev,
                                                [designId]: value,
                                              })
                                            );
                                          }}
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" &&
                                              hasChanged &&
                                              !isUpdating
                                            ) {
                                              handleUpdateDesignQuantity(
                                                designId
                                              );
                                            }
                                          }}
                                          onBlur={() => {
                                            if (hasChanged && !isUpdating) {
                                              handleUpdateDesignQuantity(
                                                designId
                                              );
                                            }
                                          }}
                                          placeholder={
                                            pod.quantity?.toString() ||
                                            "Số lượng"
                                          }
                                          className="w-24 text-sm"
                                          disabled={isUpdating}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-2 text-xs shrink-0"
                                          onClick={() =>
                                            handleUpdateDesignQuantity(designId)
                                          }
                                          disabled={
                                            !hasChanged ||
                                            isUpdating ||
                                            !currentQty ||
                                            parseInt(currentQty, 10) < 1
                                          }
                                        >
                                          {isUpdating ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            "Cập nhật"
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Nhập số lượng mới và nhấn "Cập nhật" hoặc Enter
                                cho từng mã hàng
                              </p>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsQuantityEditOpen(false);
                                setUpdateDesignQuantities({});
                              }}
                              disabled={updatingDesignId !== null}
                            >
                              Đóng
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Column 3: Thông tin xuất kẽm */}
            <div className="space-y-4">
              {/* Plate Export Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Xuất bản kẽm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Plate Export Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            order.isPlateExported
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <span className="font-bold text-xs">Xuất bản kẽm</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setIsPlateExportDialogOpen(true)}
                      >
                        {order.isPlateExported ? "Sửa" : "Ghi nhận"}
                      </Button>
                    </div>
                    {order.plateExport ? (
                      <div className="bg-muted/30 rounded p-2.5 text-xs space-y-2">
                        {/* Đơn vị */}
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-[10px]">
                            Đơn vị:
                          </span>
                          <p className="font-bold text-foreground">
                            {order.plateExport.vendorName || "—"}
                          </p>
                        </div>

                        {/* Số lượng kẽm */}
                        {order.plateExport.plateCount != null && (
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-[10px]">
                              Số lượng kẽm:
                            </span>
                            <p className="font-bold text-foreground">
                              {order.plateExport.plateCount} kẽm
                            </p>
                          </div>
                        )}

                        {/* Ngày gửi */}
                        {order.plateExport.sentAt && (
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-[10px]">
                              Ngày gửi:
                            </span>
                            <p className="font-bold text-foreground">
                              {format(
                                new Date(order.plateExport.sentAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        )}

                        {/* Ngày dự kiến nhận */}
                        {order.plateExport.estimatedReceiveAt && (
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-[10px]">
                              Dự kiến nhận:
                            </span>
                            <p className="font-bold text-foreground">
                              {format(
                                new Date(order.plateExport.estimatedReceiveAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        )}

                        {/* Ngày nhận kẽm */}
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-[10px]">
                            Có kẽm:
                          </span>
                          <p className="font-bold text-foreground">
                            {order.plateExport.receivedAt
                              ? format(
                                  new Date(order.plateExport.receivedAt),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "Đang chờ"}
                          </p>
                        </div>

                        {/* Ghi chú */}
                        {order.plateExport.notes && (
                          <div className="space-y-0.5 pt-1 border-t border-border/30">
                            <span className="text-muted-foreground text-[10px]">
                              Ghi chú:
                            </span>
                            <p className="text-foreground italic whitespace-pre-wrap line-clamp-3">
                              {order.plateExport.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic pl-3.5">
                        Chưa có thông tin
                      </p>
                    )}
                  </div>

                  {order.status === "waiting_for_production" && (
                    <div className="pt-2 border-t">
                      <Button
                        className="w-full gap-1.5 h-8 text-xs"
                        disabled={
                          !order.isPlateExported ||
                          (hasDieCutDesigns && !isDieExported) ||
                          isHandingToProduction
                        }
                        onClick={handleHandToProduction}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Bàn giao sản xuất
                      </Button>
                      {(!order.isPlateExported ||
                        (hasDieCutDesigns && !isDieExported)) && (
                        <p className="text-[10px] text-destructive mt-1 text-center">
                          * Cần hoàn thành xuất kẽm
                          {hasDieCutDesigns && " và khuôn bế"}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Column 4: Thông tin xuất bế - chỉ hiển thị khi có xuất bế */}
            {hasDieCutDesigns && (
              <div className="space-y-4">
                {/* Die Export Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      Xuất khuôn bế
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Die Export Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isDieExported ? "bg-green-500" : "bg-yellow-500"
                            }`}
                          />
                          <span className="font-bold text-xs">
                            Xuất khuôn bế
                            {order.dieExports &&
                              order.dieExports.length > 0 && (
                                <span className="ml-1.5 text-muted-foreground font-normal">
                                  ({order.dieExports.length})
                                </span>
                              )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {order.status !== "completed" &&
                            order.dieExports &&
                            order.dieExports.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs shrink-0"
                                onClick={handleOpenAddDieDialog}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Thêm
                              </Button>
                            )}
                          {!isDieExported && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs shrink-0"
                              onClick={() => setIsDieExportDialogOpen(true)}
                            >
                              Ghi nhận
                            </Button>
                          )}
                        </div>
                      </div>
                      {order.dieExports && order.dieExports.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {order.dieExports.map((dieExport, index) => (
                            <div
                              key={dieExport.id}
                              className="bg-muted/40 rounded-lg p-2.5 border border-border/50 hover:bg-muted/60 transition-colors"
                            >
                              {/* Main Content Row */}
                              <div className="flex items-start gap-2.5">
                                {/* Image */}
                                {dieExport.die?.imageUrl ? (
                                  <div
                                    className="relative w-14 h-14 rounded-md border overflow-hidden bg-background cursor-pointer hover:opacity-90 transition-opacity shrink-0 group"
                                    onClick={() => {
                                      setViewingImageUrl(
                                        dieExport.die?.imageUrl || null
                                      );
                                      setImageViewerOpen(true);
                                    }}
                                  >
                                    <img
                                      src={dieExport.die.imageUrl}
                                      alt={`Khuôn ${dieExport.die?.code || index + 1}`}
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <Eye className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  {/* Code & Name */}
                                  <div>
                                    <div className="font-bold text-xs text-foreground truncate">
                                      {dieExport.die?.code ||
                                        `Khuôn #${dieExport.dieId}`}
                                    </div>
                                  </div>

                                  {/* Details - Vertical layout to prevent break */}
                                  <div className="space-y-0.5 text-[10px]">
                                    {/* Kích thước */}
                                    {dieExport.die && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground font-medium">
                                          KT:
                                        </span>
                                        <span className="font-bold text-foreground">
                                          {formatDieSize(dieExport.die)}
                                        </span>
                                      </div>
                                    )}

                                    {/* Nhà cung cấp */}
                                    {dieExport.die?.vendorName && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground font-medium">
                                          NCC:
                                        </span>
                                        <span className="font-bold text-foreground truncate">
                                          {dieExport.die.vendorName}
                                        </span>
                                      </div>
                                    )}

                                    {/* Vị trí */}
                                    {dieExport.die?.location && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground font-medium">
                                          Vị trí:
                                        </span>
                                        <span className="font-bold text-foreground">
                                          {dieExport.die.location}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Ngày xuất */}
                                  {dieExport.createdAt && (
                                    <div className="text-[10px] text-muted-foreground font-medium pt-0.5 border-t border-border/30">
                                      Xuất:{" "}
                                      <span className="font-bold">
                                        {format(
                                          new Date(dieExport.createdAt),
                                          "dd/MM/yyyy HH:mm"
                                        )}
                                      </span>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {dieExport.notes && (
                                    <div className="text-[10px] italic text-muted-foreground font-medium pt-0.5 border-t border-border/30 line-clamp-2">
                                      {dieExport.notes}
                                    </div>
                                  )}
                                </div>

                                {/* Actions - Vertical stack */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() =>
                                      handleOpenReplaceDieDialog(dieExport)
                                    }
                                    disabled={
                                      !order || order.status === "completed"
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {order &&
                                    order.status !== "completed" &&
                                    dieExport.dieId && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                          handleRemoveDie(dieExport.dieId!)
                                        }
                                        disabled={isRemovingDie}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic pl-3.5 py-2">
                          Chưa có thông tin
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Status Change Dialog */}
      <Dialog
        open={isConfirmStatusDialogOpen}
        onOpenChange={setIsConfirmStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>Bạn có chắc chắn muốn chuyển trạng thái không?</p>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Từ
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Trạng thái hiện tại:
                  </span>{" "}
                  <StatusBadge
                    status={order?.status || ""}
                    label={
                      proofingStatusLabels[order?.status || ""] ||
                      order?.status ||
                      "—"
                    }
                  />
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Sang
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Trạng thái mới:
                  </span>{" "}
                  <StatusBadge
                    status="waiting_for_production"
                    label={
                      proofingStatusLabels["waiting_for_production"] ||
                      "Chờ sản xuất"
                    }
                  />
                </div>
              </div>
              {!order?.proofingFileUrl && (
                <p className="text-destructive text-sm font-medium mt-2">
                  ⚠️ Lưu ý: Bạn chưa tải lên file bình bài. Vui lòng tải lên
                  file trước khi chuyển trạng thái.
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

      {/* Confirm Remove Design Dialog */}
      <Dialog
        open={isConfirmRemoveDesignDialogOpen}
        onOpenChange={(open) => {
          setIsConfirmRemoveDesignDialogOpen(open);
          if (!open) setRemoveDesignTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa mã hàng khỏi bình bài</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Bạn có chắc chắn muốn xóa mã hàng này khỏi bình bài không? Thao
                tác này không thể hoàn tác.
              </p>
              {removeDesignTarget?.designCode && (
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Mã hàng:</span>{" "}
                  <span className="font-semibold">
                    {removeDesignTarget.designCode}
                  </span>
                  {removeDesignTarget.designName && (
                    <>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-foreground">
                        {removeDesignTarget.designName}
                      </span>
                    </>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmRemoveDesignDialogOpen(false)}
              disabled={isRemovingDesign}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={isRemovingDesign || !order || !removeDesignTarget}
              onClick={() => {
                if (!order || !removeDesignTarget) return;
                removeDesignMutate(
                  {
                    proofingOrderId: order.id,
                    proofingOrderDesignId:
                      removeDesignTarget.proofingOrderDesignId,
                  },
                  {
                    onSuccess: () => {
                      setIsConfirmRemoveDesignDialogOpen(false);
                      setRemoveDesignTarget(null);
                    },
                  }
                );
              }}
            >
              {isRemovingDesign ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog - Combined */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            setUploadFiles([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tải lên file bình bài và ảnh</DialogTitle>
            <DialogDescription>
              Chọn 1 file bình bài (.pdf, .ai, .psd) và 1 file ảnh cùng lúc
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1 min-h-0 flex flex-col">
            {/* Chọn nhiều file cùng lúc */}
            <div className="space-y-2 flex-shrink-0">
              <Label htmlFor="upload-files" className="text-sm font-medium">
                Chọn file bình bài và ảnh{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
                <Input
                  id="upload-files"
                  type="file"
                  accept=".pdf,.ai,.psd,image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);

                    // Phân loại files mới
                    const newProofingFiles = files.filter((f) =>
                      isProofingFile(f)
                    );
                    const newImageFiles = files.filter((f) => isImageFile(f));

                    // Kiểm tra số lượng
                    if (newProofingFiles.length > 1) {
                      toast.error("Lỗi", {
                        description: "Chỉ được chọn 1 file bình bài",
                      });
                      e.target.value = "";
                      return;
                    }

                    if (newImageFiles.length > 1) {
                      toast.error("Lỗi", {
                        description: "Chỉ được chọn 1 file ảnh",
                      });
                      e.target.value = "";
                      return;
                    }

                    // Kiểm tra tổng số file
                    if (files.length > 2) {
                      toast.error("Lỗi", {
                        description:
                          "Chỉ được chọn tối đa 1 file bình bài và 1 file ảnh",
                      });
                      e.target.value = "";
                      return;
                    }

                    // Kiểm tra nếu đã có file cùng loại thì thay thế
                    setUploadFiles((prev) => {
                      let updated = [...prev];

                      // Thay thế file proofing nếu có
                      if (newProofingFiles.length > 0) {
                        updated = updated.filter((f) => !isProofingFile(f));
                        updated.push(newProofingFiles[0]);
                      }

                      // Thay thế file ảnh nếu có
                      if (newImageFiles.length > 0) {
                        updated = updated.filter((f) => !isImageFile(f));
                        updated.push(newImageFiles[0]);
                      }

                      return updated;
                    });

                    // Reset input để có thể chọn lại cùng file
                    e.target.value = "";
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Chọn 1 file bình bài (.pdf, .ai, .psd) và 1 file ảnh (JPG,
                  PNG, ...)
                </p>
              </div>
            </div>

            {/* Hiển thị danh sách file đã chọn */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <Label className="text-sm font-medium flex-shrink-0">
                  Files đã chọn:
                </Label>
                <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-2">
                  {uploadFiles.map((file, index) => {
                    const isImage = isImageFile(file);
                    const isProofing = isProofingFile(file);
                    const fileType = isProofing
                      ? "File bình bài"
                      : isImage
                        ? "Ảnh"
                        : "File khác";

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 min-w-0"
                      >
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded border bg-background flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fileType} • {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            setUploadFiles((prev) => {
                              const newFiles = prev.filter(
                                (_, i) => i !== index
                              );
                              // Cleanup object URL if it's an image
                              if (isImageFile(prev[index])) {
                                const url = URL.createObjectURL(prev[index]);
                                URL.revokeObjectURL(url);
                              }
                              return newFiles;
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {(!uploadFiles.find((f) => isProofingFile(f)) ||
                  !uploadFiles.find((f) => isImageFile(f))) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 flex-shrink-0 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Cần có ít nhất 1 file bình bài và 1 file ảnh
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setUploadFiles([]);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => handleUploadFiles(uploadFiles)}
              disabled={
                !uploadFiles.find((f) => isProofingFile(f)) ||
                !uploadFiles.find((f) => isImageFile(f))
              }
            >
              <Upload className="h-4 w-4 mr-2" />
              Tải file lên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Image Dialog */}
      <Dialog
        open={isImageUploadDialogOpen}
        onOpenChange={setIsImageUploadDialogOpen}
      >
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
            <Button
              onClick={handleUploadImage}
              disabled={!uploadImage || isUploadingImage}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploadingImage ? "Đang upload..." : "Upload"}
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
      {order && (
        <PlateExportDialog
          open={isPlateExportDialogOpen}
          onOpenChange={setIsPlateExportDialogOpen}
          proofingOrderId={order.id}
          onSuccess={handlePlateExportSuccess}
        />
      )}

      {/* Die Export Dialog */}
      {order && (
        <DieExportDialog
          open={isDieExportDialogOpen}
          onOpenChange={setIsDieExportDialogOpen}
          proofingOrderId={order.id}
          proofingOrder={order}
          onSuccess={handleDieExportSuccess}
        />
      )}

      {/* Confirm Status Change Dialog */}
      <Dialog
        open={isConfirmStatusChangeDialogOpen}
        onOpenChange={setIsConfirmStatusChangeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            <DialogDescription>
              {nextStatusInfo?.confirmMessage ||
                "Bạn có chắc chắn muốn thay đổi trạng thái?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái hiện tại</Label>
              <StatusBadge
                status={order?.status || ""}
                label={
                  proofingStatusLabels[order?.status || ""] ||
                  order?.status ||
                  "—"
                }
              />
            </div>
            {pendingStatus && (
              <div className="space-y-2">
                <Label>Trạng thái mới</Label>
                <StatusBadge
                  status={pendingStatus}
                  label={proofingStatusLabels[pendingStatus] || pendingStatus}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmStatusChangeDialogOpen(false);
                setPendingStatus(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleConfirmStatusChange}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hand to Production Dialog */}
      <Dialog
        open={isHandToProductionDialogOpen}
        onOpenChange={setIsHandToProductionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành và chuyển xuống sản xuất</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đánh dấu mã bài là hoàn thành và chuyển
              xuống sản xuất?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái hiện tại</Label>
              <StatusBadge
                status={order?.status || ""}
                label={
                  proofingStatusLabels[order?.status || ""] ||
                  order?.status ||
                  "—"
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái mới</Label>
              <StatusBadge
                status="completed"
                label={proofingStatusLabels["completed"] || "Hoàn thành"}
              />
            </div>

            {/* Kiểm tra điều kiện */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-semibold">
                Điều kiện chuyển xuống sản xuất:
              </Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {order?.isPlateExported ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {order?.isPlateExported ? "Đã xuất kẽm" : "Chưa xuất kẽm"}
                  </span>
                </div>
                {hasDieCutDesigns && (
                  <div className="flex items-center gap-2">
                    {isDieExported ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {isDieExported
                        ? "Đã xuất khuôn bế"
                        : "Chưa xuất khuôn bế"}
                    </span>
                  </div>
                )}
              </div>
              {(!order?.isPlateExported ||
                (hasDieCutDesigns && !isDieExported)) && (
                <p className="text-xs text-destructive mt-2">
                  * Cần hoàn thành tất cả các điều kiện trên để chuyển xuống sản
                  xuất
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsHandToProductionDialogOpen(false);
                setPendingStatus(null);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmHandToProduction}
              disabled={
                isHandingToProduction ||
                !order?.isPlateExported ||
                (hasDieCutDesigns && !isDieExported)
              }
            >
              {isHandingToProduction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận và chuyển xuống sản xuất"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Design Dialog */}
      {order && (
        <AddDesignToProofingDialog
          open={isAddDesignDialogOpen}
          onOpenChange={setIsAddDesignDialogOpen}
          availableDesigns={availableDesignsForAdding}
          materialTypeName={order.materialType?.name}
          currentDesign={currentDesignForAdding}
          onSubmit={async (orderDetailItems) => {
            if (!order?.materialTypeId) {
              toast.error("Lỗi", {
                description: "Không thể lấy thông tin Chất liệu",
              });
              return;
            }
            // Map orderDetailItems to AddDesignsToProofingOrderRequest
            // API now requires items array with AddProofingOrderDetailItem (orderDetailId, quantity)
            const items = orderDetailItems.map((item) => ({
              orderDetailId: item.orderDetailId,
              quantity: item.quantity,
            }));

            if (items.length === 0) {
              toast.error("Lỗi", {
                description: "Không có chi tiết đơn hàng nào được chọn",
              });
              return;
            }

            // Errors are handled by the hook's onError.
            await addDesignsMutate({
              id: order.id,
              request: {
                materialTypeId: order.materialTypeId,
                items: items,
              },
            });
            // Query invalidation happens in the hook's onSuccess callback
            // The dialog will close automatically via the component's handleSubmit
          }}
          isSubmitting={isAddingDesigns}
        />
      )}

      {/* Replace Die Dialog */}
      <Dialog
        open={isReplaceDieDialogOpen}
        onOpenChange={(open) => {
          setIsReplaceDieDialogOpen(open);
          if (!open) {
            setReplacingDieExport(null);
            setSelectedNewDieId(null);
            setReplaceDieNotes("");
            setDieSearchTerm("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Thay thế khuôn bế</DialogTitle>
            <DialogDescription>
              Chọn khuôn mới để thay thế cho khuôn hiện tại
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col space-y-4 py-4 overflow-hidden">
            {/* Current Die Info */}
            {replacingDieExport && (
              <div className="bg-muted/50 rounded-lg p-3 border shrink-0">
                <Label className="text-xs font-semibold mb-2 block">
                  Khuôn hiện tại:
                </Label>
                <div className="flex items-center gap-3">
                  {replacingDieExport.die?.imageUrl && (
                    <img
                      src={replacingDieExport.die.imageUrl}
                      alt={replacingDieExport.die?.code}
                      className="w-12 h-12 rounded border object-contain bg-background"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {replacingDieExport.die?.code ||
                        `Khuôn #${replacingDieExport.dieId}`}
                    </div>
                    {replacingDieExport.die && (
                      <div className="text-xs text-muted-foreground mt-1">
                        KT: {formatDieSize(replacingDieExport.die)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2 shrink-0">
              <Label htmlFor="die-search">Tìm khuôn thay thế</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="die-search"
                  placeholder="Nhập mã hoặc tên khuôn..."
                  value={dieSearchTerm}
                  onChange={(e) => setDieSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Die List */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <Label className="text-xs font-semibold shrink-0">
                Chọn khuôn mới:
              </Label>
              <ScrollArea className="h-[300px] border rounded-lg">
                {isLoadingDies ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </div>
                ) : availableDies.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {dieSearchTerm.trim()
                      ? "Không tìm thấy khuôn phù hợp"
                      : "Nhập từ khóa để tìm khuôn"}
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {availableDies.map((die: DieResponse) => {
                      const isSelected = selectedNewDieId === die.id;
                      const isCurrentDie = die.id === replacingDieExport?.dieId;

                      return (
                        <div
                          key={die.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                            isCurrentDie && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (!isCurrentDie) {
                              setSelectedNewDieId(die.id || null);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {die.imageUrl ? (
                              <img
                                src={die.imageUrl}
                                alt={die.code || ""}
                                className="w-12 h-12 rounded border object-contain bg-background shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded border bg-muted/50 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {die.code || `Khuôn #${die.id}`}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>KT: {formatDieSize(die)}</span>
                                {die.vendorName && (
                                  <span>• NCC: {die.vendorName}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            )}
                            {isCurrentDie && (
                              <Badge
                                variant="secondary"
                                className="text-xs shrink-0"
                              >
                                Đang dùng
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Notes */}
            <div className="space-y-2 shrink-0">
              <Label htmlFor="replace-die-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="replace-die-notes"
                placeholder="Nhập ghi chú cho việc thay thế khuôn..."
                value={replaceDieNotes}
                onChange={(e) => setReplaceDieNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsReplaceDieDialogOpen(false);
                setReplacingDieExport(null);
                setSelectedNewDieId(null);
                setReplaceDieNotes("");
                setDieSearchTerm("");
              }}
              disabled={isReplacingDie}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReplaceDie}
              disabled={!selectedNewDieId || isReplacingDie}
            >
              {isReplacingDie ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang thay thế...
                </>
              ) : (
                "Thay thế"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Die Dialog */}
      <Dialog
        open={isAddDieDialogOpen}
        onOpenChange={(open) => {
          setIsAddDieDialogOpen(open);
          if (!open) {
            setSelectedDieIdForAdd(null);
            setAddDieNotes("");
            setAddDieSearchTerm("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Thêm khuôn bế</DialogTitle>
            <DialogDescription>
              Chọn khuôn bế để thêm vào bình bài
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col space-y-4 py-4 overflow-hidden">
            {/* Search */}
            <div className="space-y-2 shrink-0">
              <Label htmlFor="add-die-search">Tìm khuôn bế</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="add-die-search"
                  placeholder="Nhập mã hoặc tên khuôn..."
                  value={addDieSearchTerm}
                  onChange={(e) => setAddDieSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Die List */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <Label className="text-xs font-semibold shrink-0">
                Chọn khuôn:
              </Label>
              <ScrollArea className="h-[300px] border rounded-lg">
                {isLoadingAddDies ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </div>
                ) : availableDiesForAdd.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {addDieSearchTerm.trim()
                      ? "Không tìm thấy khuôn phù hợp"
                      : "Nhập từ khóa để tìm khuôn"}
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {availableDiesForAdd.map((die: DieResponse) => {
                      const isSelected = selectedDieIdForAdd === die.id;
                      // Exclude dies that are already assigned to this proofing order
                      const isAlreadyAssigned =
                        order?.dieExports?.some((de) => de.dieId === die.id) ??
                        false;

                      return (
                        <div
                          key={die.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                            isAlreadyAssigned && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (!isAlreadyAssigned) {
                              setSelectedDieIdForAdd(die.id || null);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {die.imageUrl ? (
                              <img
                                src={die.imageUrl}
                                alt={die.code || ""}
                                className="w-12 h-12 rounded border object-contain bg-background shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded border bg-muted/50 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {die.code || `Khuôn #${die.id}`}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>KT: {formatDieSize(die)}</span>
                                {die.vendorName && (
                                  <span>• NCC: {die.vendorName}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            )}
                            {isAlreadyAssigned && (
                              <Badge
                                variant="secondary"
                                className="text-xs shrink-0"
                              >
                                Đã có
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Notes */}
            <div className="space-y-2 shrink-0">
              <Label htmlFor="add-die-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="add-die-notes"
                placeholder="Nhập ghi chú cho khuôn bế..."
                value={addDieNotes}
                onChange={(e) => setAddDieNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDieDialogOpen(false);
                setSelectedDieIdForAdd(null);
                setAddDieNotes("");
                setAddDieSearchTerm("");
              }}
              disabled={isAssigningDie}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddDie}
              disabled={!selectedDieIdForAdd || isAssigningDie}
            >
              {isAssigningDie ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                "Thêm khuôn bế"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DieListDialog
        open={isDieListDialogOpen}
        onOpenChange={setIsDieListDialogOpen}
      />
    </div>
  );
}
