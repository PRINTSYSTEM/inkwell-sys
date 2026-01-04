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
import type { PlateExportResponse, DieExportResponse } from "@/Schema";
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

  // Form state cho từng card
  const [isQuantityEditOpen, setIsQuantityEditOpen] = useState(false);

  // Form state for update info (Bình Bài)
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateNotes, setUpdateNotes] = useState<string>("");
  const [updatePaperSizeId, setUpdatePaperSizeId] = useState<string>("none");
  const [updateCustomPaperSize, setUpdateCustomPaperSize] =
    useState<string>("");
  const [updateProofingFileUrl, setUpdateProofingFileUrl] =
    useState<string>("");
  const [updateTotalQuantity, setUpdateTotalQuantity] = useState<string>("");
  const [updateDesignQuantities, setUpdateDesignQuantities] = useState<
    Record<number, string>
  >({});
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);
  const [updateProofingFile, setUpdateProofingFile] = useState<File | null>(
    null
  );

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
  type ProofingOrderResponse =
    import("@/Schema/proofing-order.schema").ProofingOrderResponse;
  const order = orderResp as ProofingOrderResponse | null;
  const orderDesigns = order?.proofingOrderDesigns ?? [];

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
  const { mutate: updateProofingOrder, isPending: isUpdatingInfo } =
    useUpdateProofingOrder();
  const { data: paperSizesData } = usePaperSizes();
  const paperSizes = paperSizesData || [];
  const { mutateAsync: addDesignsMutate, isPending: isAddingDesigns } =
    useAddDesignsToProofingOrder();
  const { mutate: removeDesignMutate, isPending: isRemovingDesign } =
    useRemoveDesignFromProofingOrder();

  // Check if order is empty (no designs)
  const isEmptyOrder = orderDesigns.length === 0;

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
  const [notes, setNotes] = useState("");
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState<number>(1);
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [paperSizeId, setPaperSizeId] = useState<string>("none");
  const [customPaperSize, setCustomPaperSize] = useState("");

  // Get available designs for adding (when order is empty, no material type filter)
  const { data: availableDesignsData, isLoading: isLoadingDesigns } =
    useAvailableOrderDetailsForProofing({
      materialTypeId: isEmptyOrder ? currentMaterialTypeId : null,
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

  // Fetch design types
  const { data: designTypesData } = useDesignTypeList({
    status: "active",
  });

  const { mutate: createPaperSize, loading: isCreatingPaperSize } =
    useCreatePaperSize();

  // Transform design types to FilterOption format with count
  const designTypeOptions = useMemo(() => {
    if (!designTypesData || !availableDesignsData?.designs) return [];

    const designTypeItems = Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData.items ?? []);

    // Count designs by designTypeId
    const countMap = new Map<number, number>();
    availableDesignsData.designs.forEach((design) => {
      const count = countMap.get(design.designTypeId) || 0;
      countMap.set(design.designTypeId, count + 1);
    });

    return designTypeItems.map((dt) => ({
      id: dt.id,
      name: dt.name || "",
      count: countMap.get(dt.id) || 0,
    }));
  }, [designTypesData, availableDesignsData?.designs]);

  // Apply client-side filters (for empty order)
  const filteredAndSortedDesigns = useMemo(() => {
    if (!availableDesignsData || !availableDesignsData.designs) return [];

    let result = [...availableDesignsData.designs];

    // Filter by design type
    if (selectedDesignTypes.length > 0) {
      result = result.filter((d) =>
        selectedDesignTypes.includes(d.designTypeId)
      );
    }

    // Filter by material type (only when no design is selected)
    if (!currentMaterialTypeId && selectedMaterialTypes.length > 0) {
      result = result.filter((d) =>
        selectedMaterialTypes.includes(d.materialTypeId)
      );
    }

    // Filter by search term (code)
    if (debouncedSearch.trim().length > 0) {
      const searchLower = debouncedSearch.trim().toLowerCase();
      result = result.filter((d) => d.code.toLowerCase().includes(searchLower));
    }

    return result;
  }, [
    availableDesignsData,
    selectedDesignTypes,
    selectedMaterialTypes,
    currentMaterialTypeId,
    debouncedSearch,
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

  // Pagination for left list
  const totalCount = filteredAndSortedDesigns.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedDesigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDesigns.slice(start, start + itemsPerPage);
  }, [filteredAndSortedDesigns, currentPage, itemsPerPage]);

  // Reset pagination when filter changes
  useEffect(() => {
    if (isEmptyOrder) {
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [
    isEmptyOrder,
    currentMaterialTypeId,
    selectedDesignTypes,
    selectedMaterialTypes,
    debouncedSearch,
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

  const totalSelectedQuantity = useMemo(() => {
    return Object.values(designQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [designQuantities]);

  const hasValidQuantities = useMemo(() => {
    return selectedDesigns.some((design) => {
      const qty = designQuantities[design.id] || 0;
      return qty > 0;
    });
  }, [selectedDesigns, designQuantities]);

  const selectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  // Parse custom paper size input
  const parsedCustomPaperSize = useMemo(() => {
    if (!customPaperSize || paperSizeId !== "custom") return null;
    const trimmed = customPaperSize.trim();
    const match = trimmed.match(/^(\d+)\s*[×xX]\s*(\d+)$/);
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
    return paperSizes.find(
      (ps) =>
        ps.width === parsedCustomPaperSize.width &&
        ps.height === parsedCustomPaperSize.height
    );
  }, [parsedCustomPaperSize, paperSizes]);

  const showCreateButton =
    paperSizeId === "custom" &&
    parsedCustomPaperSize !== null &&
    existingPaperSize === null;

  const handleCreatePaperSize = async () => {
    if (!parsedCustomPaperSize) return;
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
      }
    } catch (error) {
      console.error("Failed to create paper size:", error);
    }
  };

  // Handle submit designs to existing proofing order
  const handleSubmitDesigns = async () => {
    if (!order?.id) return;

    try {
      if (
        !proofingSheetQuantity ||
        proofingSheetQuantity < 1 ||
        !Number.isInteger(proofingSheetQuantity) ||
        proofingSheetQuantity > 2147483647
      ) {
        toast.error("Lỗi", {
          description:
            "Số lượng giấy in phải là số nguyên từ 1 đến 2,147,483,647",
        });
        return;
      }

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
            "Vui lòng nhập số lượng lấy cho ít nhất một thiết kế (lớn hơn 0)",
        });
        return;
      }

      // Validate materialTypeId
      if (!currentMaterialTypeId || selectedDesigns.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn thiết kế để thêm vào bình bài",
        });
        return;
      }

      // Map designQuantities to designIds
      const designIds = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, _]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          return design?.designId;
        })
        .filter((id): id is number => id !== undefined);

      if (designIds.length === 0) {
        toast.error("Lỗi", {
          description: "Không tìm thấy design IDs để thêm vào bình bài",
        });
        return;
      }

      const addDesignsPayload = {
        materialTypeId: currentMaterialTypeId,
        designIds: designIds,
        totalQuantity: proofingSheetQuantity,
        paperSizeId:
          paperSizeId === "none" || paperSizeId === "custom"
            ? null
            : Number(paperSizeId),
        customPaperSize:
          paperSizeId === "custom" && customPaperSize?.trim()
            ? customPaperSize.trim()
            : null,
        notes: notes?.trim() || null,
      };

      // Add designs to proofing order
      await addDesignsMutate({
        id: order.id,
        request: addDesignsPayload,
      });

      // On success: reset and the page will automatically refresh
      clearSelection();
      setDesignQuantities({});
      setNotes("");
      setProofingSheetQuantity(1);
      setPaperSizeId("none");
      setCustomPaperSize("");
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
          "Vui lòng upload file bình bài trước khi chuyển trạng thái",
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

  const handleOpenUpdateInfoDialog = () => {
    if (!order) return;
    setUpdateStatus(order.status || "");
    setUpdateNotes(order.notes || "");
    setUpdatePaperSizeId(
      order.paperSizeId ? order.paperSizeId.toString() : "none"
    );
    setUpdateCustomPaperSize(order.customPaperSize || "");

    // Không động tới file/ảnh và số lượng ở đây, flow này chỉ lo ghi chú + khổ giấy
    setIsUpdateInfoDialogOpen(true);
  };

  const handleOpenQuantityEdit = () => {
    if (!order) return;

    setUpdateTotalQuantity(order.totalQuantity?.toString() || "");

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
    if (updatePaperSizeId === "custom") {
      updateData.paperSizeId = null;
      updateData.customPaperSize = updateCustomPaperSize || null;
    } else if (updatePaperSizeId !== "none") {
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

    // Handle designUpdates
    const designUpdates: Array<{
      proofingOrderDesignId: number;
      quantity: number;
    }> = [];
    Object.entries(updateDesignQuantities).forEach(([designIdStr, qtyStr]) => {
      const designId = parseInt(designIdStr, 10);
      const qty = parseInt(String(qtyStr), 10);
      if (!isNaN(designId) && !isNaN(qty) && qty >= 1) {
        const originalDesign = order.proofingOrderDesigns?.find(
          (pod) => pod.id === designId
        );
        if (originalDesign && originalDesign.quantity !== qty) {
          designUpdates.push({
            proofingOrderDesignId: designId,
            quantity: qty,
          });
        }
      }
    });
    if (designUpdates.length > 0) {
      updateData.designUpdates = designUpdates;
    }

    // Only call update API if there are changes (excluding image which was already uploaded)
    const hasChanges = Object.keys(updateData).length > 0;
    if (hasChanges) {
      try {
        await updateProofingOrder({
          id: order.id,
          data: updateData,
        });
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
        confirmMessage:
          "Bạn có chắc chắn muốn đánh dấu lệnh bình bài là hoàn thành?",
      };
    }

    // completed → paused
    if (currentStatus === "completed") {
      return {
        nextStatus: "paused",
        buttonLabel: "Tạm dừng",
        confirmMessage: "Bạn có chắc chắn muốn tạm dừng lệnh bình bài này?",
      };
    }

    // paused → completed
    if (currentStatus === "paused") {
      return {
        nextStatus: "completed",
        buttonLabel: "Tiếp tục",
        confirmMessage: "Bạn có chắc chắn muốn tiếp tục lệnh bình bài này?",
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
    if (!order.isPlateExported || !order.isDieExported) {
      toast.error("Lỗi", {
        description:
          "Cần hoàn thành xuất kẽm và khuôn bế trước khi chuyển xuống sản xuất",
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
        description: "Không thể upload file",
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
        description: "Không thể upload ảnh",
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
            <h1 className="text-xl font-semibold">{order.code}</h1>
            <p className="text-xs text-muted-foreground">
              Chi tiết lệnh bình bài
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={order.status}
            label={proofingStatusLabels[order.status]}
          />
          {nextStatusInfo && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={handleStatusChangeClick}
            >
              <Edit className="h-3.5 w-3.5" />
              {nextStatusInfo.buttonLabel}
            </Button>
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
                  ? "Vui lòng upload file bình bài trước"
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
              {order.proofingFileUrl ? "Thay đổi file " : "Upload file"}
            </Button>
          )}

          {order.isPlateExported && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
              <span>Đã xuất kẽm</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isEmptyOrder ? (
          // Render ProofingCreate-like UI when order is empty
          <div className="flex-1 flex min-h-0 w-full max-w-full overflow-hidden">
            {/* LEFT: DESIGN LIST + FILTERS */}
            <div className="basis-1/2 min-w-0 border-r flex flex-col min-h-0 bg-card/30">
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
                      <span>Đang tải danh sách thiết kế...</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <DesignCardSkeleton key={i} />
                        ))}
                      </div>
                    </div>
                  ) : paginatedDesigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-base font-semibold text-muted-foreground">
                      Không có thiết kế nào phù hợp.
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
                              {group.designs.length} thiết kế
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

              {/* Pagination (left list) */}
              {totalCount > 0 && (
                <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-3 text-sm text-muted-foreground bg-background">
                  <div className="text-sm font-medium text-muted-foreground">
                    Hiển thị{" "}
                    <span className="font-bold text-foreground">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>
                    {" - "}
                    <span className="font-bold text-foreground">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-bold text-foreground">
                      {totalCount}
                    </span>{" "}
                    thiết kế
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
                      disabled={currentPage === totalPages || isLoadingDesigns}
                    >
                      <span className="hidden sm:inline">Trang sau</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: INLINE PROOFING ORDER CONFIG */}
            <div className="basis-1/2 min-w-0 flex flex-col min-h-0">
              {/* Right header */}
              <div className="shrink-0 border-b bg-card/50 px-4 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-bold">
                    Thêm mã hàng vào bình bài
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedDesigns.length > 0
                      ? `${selectedDesigns.length} thiết kế • ${selectedCount} đã nhập số lượng`
                      : "Chọn thiết kế ở cột bên trái để thêm vào lệnh"}
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
                  Chưa có thiết kế nào được chọn.
                  <br />
                  Hãy click chọn thiết kế ở cột bên trái, hệ thống sẽ tự động
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
                            <TableHead className="min-w-[200px] text-sm font-bold">
                              Thiết kế
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
                                      Vật liệu:
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
                                      {design.length} × {design.height}
                                      {design.width
                                        ? ` × ${design.width}`
                                        : ""}{" "}
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
                                      Nhân viên thiết kế:
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
                                          Cắt - Bế:
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
                                    {design.sidesClassification && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          1 - 2 mặt:
                                        </span>
                                        <span className="ml-2">
                                          {sidesClassificationLabels[
                                            design.sidesClassification
                                          ] || design.sidesClassification}
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
                                      <code className="text-sm font-semibold text-muted-foreground font-mono">
                                        {design.name}
                                      </code>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                      {design.length} × {design.height}
                                      {design.width ? ` × ${design.width}` : ""}
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
                    <div className="p-3 space-y-3 overflow-y-auto flex-1">
                      {/* Row 1: Config items in one row */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Proofing Sheet Quantity */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="proofingSheetQuantity"
                            className="text-sm font-bold"
                          >
                            Số lượng giấy in
                            <span className="text-destructive"> *</span>
                          </Label>
                          <div className="relative">
                            <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="proofingSheetQuantity"
                              type="number"
                              min="1"
                              max="2147483647"
                              step="1"
                              className="pl-8 h-8 text-sm font-semibold"
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
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="paperSizeId"
                            className="text-sm font-bold"
                          >
                            Khổ giấy in
                          </Label>
                          <Select
                            value={paperSizeId}
                            onValueChange={setPaperSizeId}
                          >
                            <SelectTrigger
                              id="paperSizeId"
                              className="h-8 text-sm"
                            >
                              <Maximize2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <SelectValue placeholder="Chọn khổ giấy" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Chưa xác định
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
                              <SelectItem value="custom">
                                -- Nhập thủ công --
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Custom Paper Size or Size Display */}
                        {paperSizeId === "custom" ? (
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="customPaperSize"
                              className="text-sm font-bold"
                            >
                              Khổ giấy tùy chỉnh
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="customPaperSize"
                                className="h-8 text-sm flex-1"
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
                                  className="h-8 px-3 shrink-0"
                                  onClick={handleCreatePaperSize}
                                  disabled={isCreatingPaperSize}
                                >
                                  {isCreatingPaperSize ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                  )}
                                  <span className="ml-1.5 text-xs">
                                    Tạo mới
                                  </span>
                                </Button>
                              )}
                            </div>
                            {existingPaperSize && (
                              <p className="text-xs font-medium text-muted-foreground">
                                Đã tồn tại:{" "}
                                {existingPaperSize.name ||
                                  `${existingPaperSize.width}×${existingPaperSize.height}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-muted-foreground">
                              Kích thước
                            </Label>
                            <div className="h-8 flex items-center px-2 rounded-md border bg-background text-sm font-semibold text-muted-foreground">
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
                      <div className="space-y-1.5">
                        <Label className="text-sm font-bold flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Ghi chú
                        </Label>
                        <Textarea
                          id="notes"
                          className="min-h-[60px] text-sm resize-none"
                          placeholder="Nhập ghi chú cho lệnh bình bài này (tùy chọn)..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Footer summary */}
                    <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-2 text-sm font-semibold text-muted-foreground bg-background">
                      <div>
                        {selectedCount > 0 && (
                          <span>
                            {selectedCount}/{selectedDesigns.length} thiết kế đã
                            nhập số lượng • Tổng lấy{" "}
                            <span className="font-bold text-foreground">
                              {totalSelectedQuantity.toLocaleString()}
                            </span>{" "}
                            sp
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {!hasValidQuantities && (
                          <div>
                            Vui lòng nhập số lượng &gt; 0 cho ít nhất 1 thiết
                            kế.
                          </div>
                        )}
                        {proofingSheetQuantity < 1 && (
                          <div>Số lượng giấy in phải &gt;= 1.</div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="shrink-0 border-t px-4 py-3 bg-background">
                      <Button
                        onClick={handleSubmitDesigns}
                        disabled={
                          selectedDesigns.length === 0 ||
                          !hasValidQuantities ||
                          proofingSheetQuantity < 1 ||
                          isAddingDesigns
                        }
                        className="w-full gap-2 h-9"
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
          <div className="flex-1 grid gap-4 lg:grid-cols-3 overflow-auto">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Compact Order Info Card (moved to right column) */}
              {false && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Thông tin lệnh
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-muted-foreground text-[10px] font-normal">
                          Mã lệnh
                        </Label>
                        <p className="font-semibold text-sm">{order.code}</p>
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-muted-foreground text-[10px] font-normal">
                          Tổng số lượng
                        </Label>
                        <p className="font-semibold text-sm">
                          {order.totalQuantity.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-muted-foreground text-[10px] font-normal">
                          Số lượng hàng
                        </Label>
                        <p className="font-semibold text-sm">
                          {order.proofingOrderDesigns.length}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-muted-foreground text-[10px] font-normal">
                          Khổ giấy
                        </Label>
                        <p className="font-semibold text-sm text-xs">
                          {order.paperSize?.name ||
                            order.customPaperSize ||
                            "Chưa xác định"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div className="space-y-0.5">
                        <Label className="text-muted-foreground text-[10px] font-normal">
                          Chất liệu
                        </Label>
                        <div>
                          <p className="font-medium text-sm">
                            {order.materialType?.name || "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {order.materialType?.code || "—"}
                          </p>
                        </div>
                      </div>
                      {order.imageUrl && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-[10px] font-normal">
                            Preview ảnh
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
                      )}
                    </div>

                    {order.notes && (
                      <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                        <div className="flex items-start gap-1.5">
                          <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-amber-900 dark:text-amber-100 mb-0.5 text-[10px]">
                              Ghi chú
                            </p>
                            <p className="text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed text-xs">
                              {order.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                                order.code || `BB-${order.id}`
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
                        {!isUpdateInfoDialogOpen && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-7 text-xs w-full"
                            onClick={handleOpenUpdateInfoDialog}
                          >
                            <Edit className="h-3 w-3" />
                            Cập nhật thông tin bình bài
                          </Button>
                        )}

                        {isUpdateInfoDialogOpen && (
                          <div className="rounded-md bg-muted/30 border px-3 py-3 space-y-3">
                            {/* Notes */}
                            <div className="space-y-2">
                              <Label htmlFor="update-notes">Ghi chú</Label>
                              <Textarea
                                id="update-notes"
                                value={updateNotes}
                                onChange={(e) => setUpdateNotes(e.target.value)}
                                placeholder="Nhập ghi chú..."
                                rows={3}
                              />
                            </div>

                            {/* Paper Size */}
                            <div className="space-y-2">
                              <Label htmlFor="update-paper-size">
                                Khổ giấy
                              </Label>
                              <Select
                                value={updatePaperSizeId}
                                onValueChange={setUpdatePaperSizeId}
                              >
                                <SelectTrigger id="update-paper-size">
                                  <SelectValue placeholder="Chọn khổ giấy" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Chưa xác định
                                  </SelectItem>
                                  {paperSizes.map((ps) => (
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
                                  <SelectItem value="custom">
                                    -- Nhập thủ công --
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Custom Paper Size */}
                            {updatePaperSizeId === "custom" && (
                              <div className="space-y-2">
                                <Label htmlFor="update-custom-paper-size">
                                  Khổ giấy tùy chỉnh
                                </Label>
                                <Input
                                  id="update-custom-paper-size"
                                  value={updateCustomPaperSize}
                                  onChange={(e) =>
                                    setUpdateCustomPaperSize(e.target.value)
                                  }
                                  placeholder="Ví dụ: 60x60"
                                />
                              </div>
                            )}

                            {/* Proofing File Upload */}
                            <div className="space-y-2">
                              <Label htmlFor="update-proofing-file">
                                File bình bài
                              </Label>
                              <Input
                                id="update-proofing-file"
                                type="file"
                                accept=".pdf,.ai,.psd,.jpg,.png"
                                onChange={(e) =>
                                  setUpdateProofingFile(
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                              {updateProofingFile && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">
                                    Đã chọn: {updateProofingFile.name} (
                                    {(
                                      updateProofingFile.size /
                                      1024 /
                                      1024
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </p>
                                </div>
                              )}
                              {order.proofingFileUrl && !updateProofingFile && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    File hiện tại:
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-xs"
                                    onClick={() => {
                                      if (order.proofingFileUrl) {
                                        downloadFile(
                                          order.proofingFileUrl,
                                          order.code || `BB-${order.id}`
                                        );
                                      }
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                    Tải xuống file hiện tại
                                  </Button>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Chọn file mới để thay thế file hiện tại
                              </p>
                            </div>

                            {/* Proofing Image Upload */}
                            <div className="space-y-2">
                              <Label htmlFor="update-image-file">
                                Ảnh bình bài
                              </Label>
                              <Input
                                id="update-image-file"
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setUpdateImageFile(
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                              {updateImageFile && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Đã chọn: {updateImageFile.name} (
                                    {(
                                      updateImageFile.size /
                                      1024 /
                                      1024
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </p>
                                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                    <img
                                      src={URL.createObjectURL(updateImageFile)}
                                      alt="Preview"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                              {order.imageUrl && !updateImageFile && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Ảnh hiện tại:
                                  </p>
                                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                    <img
                                      src={order.imageUrl}
                                      alt="Current preview"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Chọn ảnh mới để thay thế ảnh hiện tại
                              </p>
                            </div>

                            <Separator />

                            {/* Total Quantity */}
                            <div className="space-y-2">
                              <Label htmlFor="update-total-quantity">
                                Tổng số lượng
                              </Label>
                              <Input
                                id="update-total-quantity"
                                type="number"
                                min="1"
                                value={updateTotalQuantity}
                                onChange={(e) =>
                                  setUpdateTotalQuantity(e.target.value)
                                }
                                placeholder="Nhập tổng số lượng..."
                              />
                            </div>

                            {/* Design Updates */}
                            {orderDesigns.length > 0 && (
                              <div className="space-y-2">
                                <Label>Cập nhật số lượng theo design</Label>
                                <div className="space-y-2 max-h-56 overflow-y-auto border rounded-lg p-3 bg-background/40">
                                  {orderDesigns.map((pod) => {
                                    const designId = pod.id;
                                    if (!designId) return null;

                                    return (
                                      <div
                                        key={designId}
                                        className="flex items-center gap-3 p-2 rounded border bg-muted/30"
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
                                            {pod.quantity?.toLocaleString() ||
                                              0}
                                          </div>
                                        </div>
                                        <div className="w-24">
                                          <Input
                                            type="number"
                                            min="1"
                                            value={
                                              updateDesignQuantities[
                                                designId
                                              ] || ""
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setUpdateDesignQuantities(
                                                (prev) => ({
                                                  ...prev,
                                                  [designId]: value,
                                                })
                                              );
                                            }}
                                            placeholder="Số lượng"
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Chỉ cập nhật các design có thay đổi số lượng
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsUpdateInfoDialogOpen(false)}
                                disabled={
                                  isUpdatingInfo ||
                                  isUpdatingImage ||
                                  isUpdatingFile ||
                                  isUploadingImage ||
                                  isUploadingFile
                                }
                              >
                                Hủy
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleUpdateInfo}
                                disabled={
                                  isUpdatingInfo ||
                                  isUpdatingImage ||
                                  isUpdatingFile ||
                                  isUploadingImage ||
                                  isUploadingFile
                                }
                              >
                                {isUpdatingInfo ||
                                isUpdatingImage ||
                                isUpdatingFile ||
                                isUploadingImage ||
                                isUploadingFile ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isUpdatingFile
                                      ? "Đang cập nhật file..."
                                      : isUpdatingImage
                                        ? "Đang cập nhật ảnh..."
                                        : isUploadingFile
                                          ? "Đang upload file..."
                                          : isUploadingImage
                                            ? "Đang upload ảnh..."
                                            : "Đang cập nhật..."}
                                  </>
                                ) : (
                                  "Lưu thay đổi"
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Compact Designs List */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Danh sách mã hàng ({orderDesigns.length})
                    </CardTitle>
                    {order && order.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => setIsAddDesignDialogOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm thiết kế
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
                            Tên
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Kích thước
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            SL
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Mặt
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Quy trình
                          </TableHead>
                          <TableHead className="h-9 px-2 text-[10px]">
                            Cán màn
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
                                    Vật liệu:
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
                                    {pod.design.length * 10}×
                                    {pod.design.width * 10}
                                    {pod.design.height
                                      ? `×${pod.design.height * 10}`
                                      : ""}{" "}
                                    mm
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    SL:
                                  </span>
                                  <span className="ml-2 font-semibold">
                                    {pod.quantity.toLocaleString()}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground">
                                    Nhân viên thiết kế:
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
                                <div className="pt-2 border-t space-y-1">
                                  {pod.design.processClassification && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Cắt - Bế:
                                      </span>
                                      <span className="ml-2">
                                        {processClassificationLabels[
                                          pod.design.processClassification
                                        ] || pod.design.processClassification}
                                      </span>
                                    </div>
                                  )}
                                  {pod.design.sidesClassification && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        1 - 2 mặt:
                                      </span>
                                      <span className="ml-2">
                                        {sidesClassificationLabels[
                                          pod.design.sidesClassification
                                        ] || pod.design.sidesClassification}
                                      </span>
                                    </div>
                                  )}
                                  {pod.design.laminationType && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Cán màng:
                                      </span>
                                      <span className="ml-2">
                                        {laminationTypeLabels[
                                          pod.design.laminationType
                                        ] || pod.design.laminationType}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
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
                                  <div>
                                    <p className="font-medium text-xs line-clamp-1">
                                      {pod.design.designName}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {pod.design.designType.name}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <div className="text-xs">
                                    <p>
                                      {pod.design.length * 10} ×{" "}
                                      {pod.design.width * 10}
                                      {`${pod.design.height ? ` × ${pod.design.height * 10}` : ""}`}{" "}
                                      mm
                                    </p>
                                    {pod.design.areaM2 && (
                                      <p className="text-[10px] text-muted-foreground">
                                        {(pod.design.areaM2 * 10000).toFixed(0)}{" "}
                                        cm²
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <p className="text-xs">
                                    {pod.quantity.toLocaleString()}
                                  </p>
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
                                            if (
                                              confirm(
                                                "Bạn có chắc chắn muốn xóa design này khỏi bình bài?"
                                              )
                                            ) {
                                              removeDesignMutate({
                                                proofingOrderId: order.id,
                                                proofingOrderDesignId: pod.id!,
                                              });
                                            }
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
                              Tổng số lượng
                            </Label>
                            <Input
                              id="update-total-quantity"
                              type="number"
                              min="1"
                              value={updateTotalQuantity}
                              onChange={(e) =>
                                setUpdateTotalQuantity(e.target.value)
                              }
                              placeholder="Nhập tổng số lượng..."
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

                                  return (
                                    <div
                                      key={designId}
                                      className="flex items-center gap-3 p-2 rounded border bg-muted/30"
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
                                      <div className="w-24">
                                        <Input
                                          type="number"
                                          min="1"
                                          value={
                                            updateDesignQuantities[designId] ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            setUpdateDesignQuantities(
                                              (prev) => ({
                                                ...prev,
                                                [designId]: value,
                                              })
                                            );
                                          }}
                                          placeholder="Số lượng"
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Chỉ cập nhật các mã hàng có thay đổi số lượng
                              </p>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsQuantityEditOpen(false)}
                              disabled={
                                isUpdatingInfo ||
                                isUpdatingImage ||
                                isUpdatingFile ||
                                isUploadingImage ||
                                isUploadingFile
                              }
                            >
                              Hủy
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateInfo}
                              disabled={
                                isUpdatingInfo ||
                                isUpdatingImage ||
                                isUpdatingFile ||
                                isUploadingImage ||
                                isUploadingFile
                              }
                            >
                              {isUpdatingInfo ||
                              isUpdatingImage ||
                              isUpdatingFile ||
                              isUploadingImage ||
                              isUploadingFile ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {isUpdatingFile
                                    ? "Đang cập nhật file..."
                                    : isUpdatingImage
                                      ? "Đang cập nhật ảnh..."
                                      : isUploadingFile
                                        ? "Đang upload file..."
                                        : isUploadingImage
                                          ? "Đang upload ảnh..."
                                          : "Đang cập nhật..."}
                                </>
                              ) : (
                                "Lưu số lượng"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Compact Sidebar */}
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
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Mã lệnh
                      </Label>
                      <p className="font-semibold text-sm">{order.code}</p>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Tổng số lượng
                      </Label>
                      <p className="font-semibold text-sm">
                        {order.totalQuantity.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Số lượng hàng
                      </Label>
                      <p className="font-semibold text-sm">
                        {order.proofingOrderDesigns.length}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Khổ giấy
                      </Label>
                      <p className="font-semibold text-sm text-xs">
                        {order.paperSize?.name ||
                          order.customPaperSize ||
                          "Chưa xác định"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-0.5">
                      <Label className="text-muted-foreground text-[10px] font-normal">
                        Chất liệu
                      </Label>
                      <div>
                        <p className="font-medium text-sm">
                          {order.materialType?.name || "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {order.materialType?.code || "—"}
                        </p>
                      </div>
                    </div>
                    {order.imageUrl && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-[10px] font-normal">
                          Preview ảnh
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
                    )}
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                      <div className="flex items-start gap-1.5">
                        <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-amber-900 dark:text-amber-100 mb-0.5 text-[10px]">
                            Ghi chú
                          </p>
                          <p className="text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed text-xs">
                            {order.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                              order.code || `BB-${order.id}`
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
                      {!isUpdateInfoDialogOpen && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-7 text-xs w-full"
                          onClick={handleOpenUpdateInfoDialog}
                        >
                          <Edit className="h-3 w-3" />
                          Cập nhật thông tin bình bài
                        </Button>
                      )}

                      {isUpdateInfoDialogOpen && (
                        <div className="rounded-md bg-muted/30 border px-3 py-3 space-y-3">
                          {/* Notes */}
                          <div className="space-y-2">
                            <Label htmlFor="update-notes">Ghi chú</Label>
                            <Textarea
                              id="update-notes"
                              value={updateNotes}
                              onChange={(e) => setUpdateNotes(e.target.value)}
                              placeholder="Nhập ghi chú..."
                              rows={3}
                            />
                          </div>

                          {/* Paper Size */}
                          <div className="space-y-2">
                            <Label htmlFor="update-paper-size">Khổ giấy</Label>
                            <Select
                              value={updatePaperSizeId}
                              onValueChange={setUpdatePaperSizeId}
                            >
                              <SelectTrigger id="update-paper-size">
                                <SelectValue placeholder="Chọn khổ giấy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Chưa xác định
                                </SelectItem>
                                {paperSizes.map((ps) => (
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
                                <SelectItem value="custom">
                                  -- Nhập thủ công --
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Custom Paper Size */}
                          {updatePaperSizeId === "custom" && (
                            <div className="space-y-2">
                              <Label htmlFor="update-custom-paper-size">
                                Khổ giấy tùy chỉnh
                              </Label>
                              <Input
                                id="update-custom-paper-size"
                                value={updateCustomPaperSize}
                                onChange={(e) =>
                                  setUpdateCustomPaperSize(e.target.value)
                                }
                                placeholder="Ví dụ: 60x60"
                              />
                            </div>
                          )}

                          {/* Proofing File Upload */}
                          <div className="space-y-2">
                            <Label htmlFor="update-proofing-file">
                              File bình bài
                            </Label>
                            <Input
                              id="update-proofing-file"
                              type="file"
                              accept=".pdf,.ai,.psd,.jpg,.png"
                              onChange={(e) =>
                                setUpdateProofingFile(
                                  e.target.files?.[0] || null
                                )
                              }
                            />
                            {updateProofingFile && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  Đã chọn: {updateProofingFile.name} (
                                  {(
                                    updateProofingFile.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB)
                                </p>
                              </div>
                            )}
                            {order.proofingFileUrl && !updateProofingFile && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-2">
                                  File hiện tại:
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-xs"
                                  onClick={() => {
                                    if (order.proofingFileUrl) {
                                      downloadFile(
                                        order.proofingFileUrl,
                                        order.code || `BB-${order.id}`
                                      );
                                    }
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                  Tải xuống file hiện tại
                                </Button>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Chọn file mới để thay thế file hiện tại
                            </p>
                          </div>

                          {/* Proofing Image Upload */}
                          <div className="space-y-2">
                            <Label htmlFor="update-image-file">
                              Ảnh bình bài
                            </Label>
                            <Input
                              id="update-image-file"
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setUpdateImageFile(e.target.files?.[0] || null)
                              }
                            />
                            {updateImageFile && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Đã chọn: {updateImageFile.name} (
                                  {(updateImageFile.size / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB)
                                </p>
                                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                  <img
                                    src={URL.createObjectURL(updateImageFile)}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            )}
                            {order.imageUrl && !updateImageFile && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Ảnh hiện tại:
                                </p>
                                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                  <img
                                    src={order.imageUrl}
                                    alt="Current preview"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Chọn ảnh mới để thay thế ảnh hiện tại
                            </p>
                          </div>

                          <Separator />

                          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsUpdateInfoDialogOpen(false)}
                              disabled={
                                isUpdatingInfo ||
                                isUpdatingImage ||
                                isUpdatingFile ||
                                isUploadingImage ||
                                isUploadingFile
                              }
                            >
                              Hủy
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateInfo}
                              disabled={
                                isUpdatingInfo ||
                                isUpdatingImage ||
                                isUpdatingFile ||
                                isUploadingImage ||
                                isUploadingFile
                              }
                            >
                              {isUpdatingInfo ||
                              isUpdatingImage ||
                              isUpdatingFile ||
                              isUploadingImage ||
                              isUploadingFile ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {isUpdatingFile
                                    ? "Đang cập nhật file..."
                                    : isUpdatingImage
                                      ? "Đang cập nhật ảnh..."
                                      : isUploadingFile
                                        ? "Đang upload file..."
                                        : isUploadingImage
                                          ? "Đang upload ảnh..."
                                          : "Đang cập nhật..."}
                                </>
                              ) : (
                                "Lưu thay đổi"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compact Prepress Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Bình Bài
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
                        <span className="font-medium text-xs">
                          Xuất bản kẽm
                        </span>
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
                      <div className="bg-muted/30 rounded p-2 text-xs space-y-0.5">
                        <p className="truncate">
                          <span className="text-muted-foreground">Đơn vị:</span>{" "}
                          {order.plateExport.vendorName || "—"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Có kẽm:</span>{" "}
                          {order.plateExport.receivedAt
                            ? format(
                                new Date(order.plateExport.receivedAt),
                                "dd/MM HH:mm"
                              )
                            : "Đang chờ"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic pl-3.5">
                        Chưa có thông tin
                      </p>
                    )}
                  </div>

                  <Separator className="my-2" />

                  {/* Die Export Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            order.isDieExported
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <span className="font-medium text-xs">
                          Xuất khuôn bế
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setIsDieExportDialogOpen(true)}
                      >
                        {order.isDieExported ? "Sửa" : "Ghi nhận"}
                      </Button>
                    </div>
                    {order.dieExports?.[0] ? (
                      <div className="bg-muted/30 rounded p-2 text-xs space-y-1">
                        {/* Display image if available */}
                        {order.dieExports[0].imageUrl ? (
                          <div
                            className="relative h-16 rounded border overflow-hidden bg-black/5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setViewingImageUrl(
                                order.dieExports[0].imageUrl || null
                              );
                              setImageViewerOpen(true);
                            }}
                          >
                            <img
                              src={order.dieExports[0].imageUrl}
                              alt="Khuôn bế"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : null}
                        {order.dieExports[0].notes && (
                          <p className="text-[10px] italic text-muted-foreground line-clamp-2 mt-1">
                            {order.dieExports[0].notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic pl-3.5">
                        Chưa có thông tin
                      </p>
                    )}
                  </div>

                  {order.status === "waiting_for_production" && (
                    <div className="pt-2">
                      <Button
                        className="w-full gap-1.5 h-8 text-xs"
                        disabled={
                          !order.isPlateExported ||
                          !order.isDieExported ||
                          isHandingToProduction
                        }
                        onClick={handleHandToProduction}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Bàn giao sản xuất
                      </Button>
                      {(!order.isPlateExported || !order.isDieExported) && (
                        <p className="text-[10px] text-destructive mt-1 text-center">
                          * Cần hoàn thành xuất kẽm và khuôn bế
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
                  ⚠️ Lưu ý: Bạn chưa upload file bình bài. Vui lòng upload file
                  trước khi chuyển trạng thái.
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
            <DialogTitle>Upload file bình bài và ảnh</DialogTitle>
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
              Upload
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
              Bạn có chắc chắn muốn đánh dấu lệnh bình bài là hoàn thành và
              chuyển xuống sản xuất?
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
                <div className="flex items-center gap-2">
                  {order?.isDieExported ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {order?.isDieExported
                      ? "Đã xuất khuôn bế"
                      : "Chưa xuất khuôn bế"}
                  </span>
                </div>
              </div>
              {(!order?.isPlateExported || !order?.isDieExported) && (
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
                !order?.isDieExported
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
          onSubmit={async (
            orderDetailItems,
            proofingSheetQuantity,
            paperSizeId,
            customPaperSize,
            notes
          ) => {
            if (!order?.materialTypeId) {
              toast.error("Lỗi", {
                description: "Không thể lấy thông tin vật liệu",
              });
              return;
            }
            // Map orderDetailItems to AddDesignsToProofingOrderRequest
            // Note: API now requires designIds instead of orderDetailItems
            // We need to extract designIds from availableDesigns based on orderDetailId
            const designIds = orderDetailItems
              .map((item) => {
                const design = availableDesignsForAdding.find(
                  (d) => d.id === item.orderDetailId
                );
                return design?.designId;
              })
              .filter((id): id is number => id !== undefined);

            if (designIds.length === 0) {
              toast.error("Lỗi", {
                description: "Không tìm thấy design IDs",
              });
              return;
            }

            await addDesignsMutate({
              id: order.id,
              request: {
                materialTypeId: order.materialTypeId,
                designIds: designIds,
                totalQuantity:
                  proofingSheetQuantity > 0 ? proofingSheetQuantity : null,
                paperSizeId:
                  paperSizeId === "none" || paperSizeId === "custom"
                    ? null
                    : Number(paperSizeId),
                customPaperSize:
                  paperSizeId === "custom" && customPaperSize?.trim()
                    ? customPaperSize.trim()
                    : null,
                notes: notes?.trim() || null,
              },
            });
          }}
          isSubmitting={isAddingDesigns}
        />
      )}
    </div>
  );
}
