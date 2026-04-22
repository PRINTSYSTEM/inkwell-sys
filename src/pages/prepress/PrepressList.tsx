import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  FileImage,
  Loader2,
  Plus,
  Search,
  Box,
  RotateCcw,
  X,
  Check,
  ChevronsUpDown,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";

import {
  useAddDesignsToProofingOrder,
  useAvailableOrderDetailsForProofing,
  useCreateProofingOrder,
  useUpdateProofingOrder,
  useProofingAvailableOrderDetailsDesignTypeSummary,
  useProofingOrders,
  useRejectDesignFromProofingOrder,
  usePaperSizes,
  useCreatePaperSize,
} from "@/hooks/use-proofing-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { useProofingSelection } from "@/hooks/useProofingSelection";

import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import {
  laminationTypeLabels,
  processClassificationLabels,
  proofingStatusLabels,
  sidesClassificationLabels,
} from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";

import { PrepressDesignFilter } from "./components/PrepressDesignFilter";
import { PrepressOrdersHeader } from "./components/PrepressOrdersHeader";
import { PrepressOrdersTable } from "./components/PrepressOrdersTable";
import { PrepressOrderRow } from "./components/PrepressOrderRow";
import { DetailEmptyOrderView } from "./detail-components/DetailEmptyOrderView";
import { DieListDialog } from "@/components/dies/DieListDialog";
import { InventoryViewDialog } from "@/components/inventory/InventoryViewDialog";

import type { DesignItem } from "@/types/proofing";
import { useMaterialTypeList } from "@/hooks";

type ProofingOrder =
  import("@/Schema/proofing-order.schema").ProofingOrderResponse;

function useHasActiveProofingFilters(args: {
  selectedDesignTypes: number[];
  selectedMaterialTypes: number[];
  searchTerm: string;
}) {
  return (
    args.selectedDesignTypes.length > 0 ||
    args.selectedMaterialTypes.length > 0 ||
    args.searchTerm.trim().length > 0
  );
}

export default function PrepressList() {
  const navigate = useNavigate();

  // ===== Mode: Orders list (default) vs Waiting designs (when filters active) =====
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<number[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const [viewMode, setViewMode] = useState<"orders" | "designs">("orders");

  const hasActiveFilters = useHasActiveProofingFilters({
    selectedDesignTypes,
    selectedMaterialTypes,
    searchTerm,
  });

  // Switch to designs mode when any filter becomes active
  useEffect(() => {
    if (hasActiveFilters) {
      setViewMode("designs");
    }
  }, [hasActiveFilters]);

  // ===== Selection (for waiting designs) =====
  const {
    selectedDesigns,
    selectedIds,
    currentMaterialTypeId,
    toggleSelection,
    clearSelection,
    canSelect,
  } = useProofingSelection();

  // ===== Orders list (Proofing orders) =====
  const [designCode, setDesignCode] = useState("");
  const [debouncedDesignCode] = useDebounce(designCode, 300);
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState<
    number | null
  >(null);
  const [incompleteOrdersPage, setIncompleteOrdersPage] = useState(1);
  const [completedOrdersPage, setCompletedOrdersPage] = useState(1);
  const [incompleteOrdersPageInput, setIncompleteOrdersPageInput] =
    useState<string>("");
  const [completedOrdersPageInput, setCompletedOrdersPageInput] =
    useState<string>("");
  const ordersTableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  const incompleteQueryParams = useMemo(() => {
    const raw = {
      status: "not_completed",
      designCode: debouncedDesignCode.trim() || null,
      materialTypeId: selectedMaterialTypeId,
      pageSize: itemsPerPage,
      pageNumber: incompleteOrdersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, selectedMaterialTypeId, incompleteOrdersPage]);

  const completedQueryParams = useMemo(() => {
    const raw = {
      status: "completed",
      designCode: debouncedDesignCode.trim() || null,
      materialTypeId: selectedMaterialTypeId,
      pageSize: itemsPerPage,
      pageNumber: completedOrdersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, selectedMaterialTypeId, completedOrdersPage]);

  const { data: incompleteOrdersResp, isLoading: loadingIncompleteOrders } =
    useProofingOrders(incompleteQueryParams);

  const { data: completedOrdersResp, isLoading: loadingCompletedOrders } =
    useProofingOrders(completedQueryParams);

  const incompleteOrders = useMemo<ProofingOrder[]>(() => {
    const items = incompleteOrdersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ProofingOrder[];
  }, [incompleteOrdersResp?.items]);

  const completedOrders = useMemo<ProofingOrder[]>(() => {
    const items = completedOrdersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ProofingOrder[];
  }, [completedOrdersResp?.items]);

  const incompleteTotalCount = incompleteOrdersResp?.total ?? 0;
  const incompleteTotalPages =
    Math.ceil(incompleteTotalCount / itemsPerPage) || 1;

  const completedTotalCount = completedOrdersResp?.total ?? 0;
  const completedTotalPages =
    Math.ceil(completedTotalCount / itemsPerPage) || 1;

  useEffect(() => {
    setIncompleteOrdersPageInput(incompleteOrdersPage.toString());
  }, [incompleteOrdersPage]);

  useEffect(() => {
    setCompletedOrdersPageInput(completedOrdersPage.toString());
  }, [completedOrdersPage]);

  useEffect(() => {
    if (ordersTableRef.current) ordersTableRef.current.scrollTop = 0;
  }, [incompleteOrdersPage, completedOrdersPage]);

  useEffect(() => {
    // reset orders pagination when list filters change
    setIncompleteOrdersPage(1);
    setIncompleteOrdersPageInput("1");
    setCompletedOrdersPage(1);
    setCompletedOrdersPageInput("1");
  }, [debouncedDesignCode, selectedMaterialTypeId]);

  const handleIncompletePageInputBlur = () => {
    const page = parseInt(incompleteOrdersPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= incompleteTotalPages) {
      setIncompleteOrdersPage(page);
    } else {
      setIncompleteOrdersPageInput(incompleteOrdersPage.toString());
    }
  };

  const handleCompletedPageInputBlur = () => {
    const page = parseInt(completedOrdersPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= completedTotalPages) {
      setCompletedOrdersPage(page);
    } else {
      setCompletedOrdersPageInput(completedOrdersPage.toString());
    }
  };

  // ===== Waiting designs data (when filters active) =====
  const selectedDesignTypeId =
    selectedDesignTypes.length > 0 ? selectedDesignTypes[0] : null;

  const designCodeForApi =
    debouncedSearch.trim().length > 0 ? debouncedSearch : null;

  const [designsPage, setDesignsPage] = useState(1);
  const [designsPageInput, setDesignsPageInput] = useState<string>("");
  const designsTableRef = useRef<HTMLDivElement>(null);
  const designsPageSize = 10;

  const materialTypeIdForApi = currentMaterialTypeId
    ? currentMaterialTypeId
    : selectedMaterialTypes.length === 1
      ? selectedMaterialTypes[0]
      : null;

  const { data: availableDesignsData, isLoading: isLoadingDesigns } =
    useAvailableOrderDetailsForProofing(
      viewMode === "designs"
        ? {
            materialTypeId: materialTypeIdForApi,
            designTypeId: selectedDesignTypeId,
            designCode: designCodeForApi,
            pageNumber: designsPage,
            pageSize: designsPageSize,
          }
        : undefined,
    );

  const [materialSelected, setMaterialSelected] = useState<number | null>(null);
  const { data: materialTypesData } = useMaterialTypeList({});

  // Material types for orders list filter
  const materialTypeOptionsForOrders = useMemo(() => {
    const items = Array.isArray(materialTypesData)
      ? materialTypesData
      : (materialTypesData?.items ?? []);
    return items.map((mt: any) => ({
      id: mt.id,
      name: mt.name || "",
    }));
  }, [materialTypesData]);

  const designsTotalCount = availableDesignsData?.total ?? 0;
  const designsTotalPages = availableDesignsData?.totalPages ?? 1;

  useEffect(() => {
    setDesignsPageInput(designsPage.toString());
  }, [designsPage]);

  useEffect(() => {
    if (designsTableRef.current) designsTableRef.current.scrollTop = 0;
  }, [designsPage]);

  useEffect(() => {
    if (!hasActiveFilters) return;
    setDesignsPage(1);
    setDesignsPageInput("1");
  }, [
    hasActiveFilters,
    selectedDesignTypeId,
    materialTypeIdForApi,
    debouncedSearch,
  ]);

  const handleDesignsPageInputBlur = () => {
    const page = parseInt(designsPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= designsTotalPages) {
      setDesignsPage(page);
    } else {
      setDesignsPageInput(designsPage.toString());
    }
  };

  // ===== Filter option sources =====
  const { data: designTypesData } = useDesignTypeList({ status: "active" });
  const { data: designTypesCount = [] } =
    useProofingAvailableOrderDetailsDesignTypeSummary(true);

  const designTypeOptions = useMemo(() => {
    const items = Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData?.items ?? []);

    const countMap = new Map<number, number>();
    if (Array.isArray(designTypesCount) && designTypesCount.length > 0) {
      designTypesCount.forEach((row: any) => {
        const id = row?.designTypeId;
        if (typeof id === "number") countMap.set(id, row?.count ?? 0);
      });
    }

    return items.map((dt: any) => ({
      id: dt.id,
      name: dt.name || "",
      count: countMap.get(dt.id) || 0,
    }));
  }, [designTypesData, designTypesCount]);

  const materialTypeOptions = availableDesignsData?.materialTypeOptions ?? [];

  // ===== Actions =====
  const { mutateAsync: createProofingOrder, isPending: isCreating } =
    useCreateProofingOrder();
  const { mutateAsync: addDesignsMutate, isPending: isAddingDesigns } =
    useAddDesignsToProofingOrder();
  const { mutateAsync: rejectDesignMutate, isPending: isRejecting } =
    useRejectDesignFromProofingOrder();

  const [isDieListDialogOpen, setIsDieListDialogOpen] = useState(false);
  const [isInventoryViewDialogOpen, setIsInventoryViewDialogOpen] =
    useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(
    new Set(),
  );

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<DesignItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ===== Config Panel State (inline DetailEmptyOrderView) =====
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState(0);
  const [paperSizeId, setPaperSizeId] = useState("custom");
  const [customPaperSize, setCustomPaperSize] = useState("");
  const [configNotes, setConfigNotes] = useState("");
  const { data: paperSizesData } = usePaperSizes();
  const paperSizes = paperSizesData || [];
  const { mutate: createPaperSizeMutate, loading: isCreatingPaperSize } =
    useCreatePaperSize();
  const { mutateAsync: updateProofingOrder, isPending: isUpdatingOrder } =
    useUpdateProofingOrder();

  const configSelectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  const configMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !materialTypeOptions.length) return null;
    const found = materialTypeOptions.find(
      (m: any) => m.id === currentMaterialTypeId,
    );
    return found?.name || null;
  }, [currentMaterialTypeId, materialTypeOptions]);

  const parsedCustomPaperSize = useMemo(() => {
    if (!customPaperSize || paperSizeId !== "custom") return null;
    const trimmed = customPaperSize.trim();
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
    return (
      paperSizes.find(
        (ps) =>
          ps.width === parsedCustomPaperSize.width &&
          ps.height === parsedCustomPaperSize.height,
      ) ?? null
    );
  }, [parsedCustomPaperSize, paperSizes]);

  const showCreateButton = useMemo(() => {
    return (
      paperSizeId === "custom" &&
      !!parsedCustomPaperSize &&
      !existingPaperSize &&
      customPaperSize.trim().length > 0
    );
  }, [paperSizeId, parsedCustomPaperSize, existingPaperSize, customPaperSize]);

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
      const newPaperSize = await createPaperSizeMutate({
        name: `${parsedCustomPaperSize.width}×${parsedCustomPaperSize.height}`,
        width: parsedCustomPaperSize.width,
        height: parsedCustomPaperSize.height,
        isCustom: true,
      });
      if (newPaperSize?.id) {
        setPaperSizeId(newPaperSize.id.toString());
        setCustomPaperSize("");
        toast.success("Thành công", { description: "Đã tạo khổ giấy mới" });
      }
    } catch (error) {
      console.error("Failed to create paper size:", error);
      toast.error("Lỗi", { description: "Không thể tạo khổ giấy mới" });
    }
  };

  const handleConfigSubmitDesigns = async () => {
    try {
      if (!currentMaterialTypeId || selectedDesigns.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn mã hàng để thêm vào bình bài",
        });
        return;
      }
      const items = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          if (!design) return null;
          return { orderDetailId: design.id, quantity: Math.floor(qty) };
        })
        .filter(
          (item): item is { orderDetailId: number; quantity: number } =>
            item !== null,
        );

      if (items.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng nhập số lượng cho ít nhất một mã hàng",
        });
        return;
      }

      // 1. Create proofing order first
      const result = await createProofingOrder({} as any);
      const orderId = result?.id;
      if (!orderId) {
        toast.error("Không thể tạo lệnh bình bài");
        return;
      }

      // 2. Add designs to the new order
      await addDesignsMutate({
        id: orderId,
        request: { materialTypeId: currentMaterialTypeId, items },
      });

      // 3. Update order with configuration (Sheet Qty, Paper Size, Notes)
      await updateProofingOrder({
        id: orderId,
        data: {
          totalQuantity:
            proofingSheetQuantity > 0 ? proofingSheetQuantity : undefined,
          paperSizeId:
            paperSizeId && paperSizeId !== "custom"
              ? parseInt(paperSizeId, 10)
              : undefined,
          customPaperSize:
            paperSizeId === "custom" ? customPaperSize : undefined,
          notes: configNotes || undefined,
        },
      });

      toast.success("Thành công", {
        description: `Đã tạo lệnh bình bài #${orderId}.`,
      });
      setIsConfiguring(false);
      setDesignQuantities({});
      setProofingSheetQuantity(0);
      setPaperSizeId("custom");
      setCustomPaperSize("");
      setConfigNotes("");
      clearSelection();
      navigate(`/proofing/${orderId}`);
    } catch (e) {
      console.error("Submit designs failed:", e);
    }
  };

  const handleCancelCreateOrder = () => {
    setIsConfiguring(false);
    setDesignQuantities({});
    setProofingSheetQuantity(0);
    setPaperSizeId("custom");
    setCustomPaperSize("");
    setConfigNotes("");
    clearSelection();
  };

  const handleToggleDesign = (design: DesignItem) => {
    const isSelecting = !selectedIds.has(design.id);
    toggleSelection(design);

    if (isSelecting) {
      setDesignQuantities((prev) => ({
        ...prev,
        [design.id]:
          design.availableQuantity !== undefined
            ? design.availableQuantity
            : design.quantity || 0,
      }));
    }

    if (!isConfiguring) {
      setIsConfiguring(true);
    }
  };

  const handleClearFilters = () => {
    setSelectedDesignTypes([]);
    setSelectedMaterialTypes([]);
    setSearchTerm("");
    setDesignsPage(1);
    setDesignsPageInput("1");
    setViewMode("orders");
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  // Check if we should show expand functionality (when designCode search is active)
  const shouldShowExpand = debouncedDesignCode.trim().length > 0;
  const searchTermLower = debouncedDesignCode.trim().toLowerCase();

  const canCreateOrder = useMemo(() => {
    return selectedDesigns.length > 0 && currentMaterialTypeId != null;
  }, [selectedDesigns, currentMaterialTypeId]);

  // Auto-expand all orders when search is active
  useEffect(() => {
    if (
      shouldShowExpand &&
      (incompleteOrders.length > 0 || completedOrders.length > 0)
    ) {
      const allOrderIds = new Set([
        ...incompleteOrders.map((o) => o.id),
        ...completedOrders.map((o) => o.id),
      ]);
      setExpandedOrderIds(allOrderIds);
    } else {
      setExpandedOrderIds(new Set());
    }
  }, [shouldShowExpand, incompleteOrders, completedOrders]);

  const openRejectDialog = (design: DesignItem) => {
    setRejectTarget(design);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <div className="relative">
      <div className="relative h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background">
        <div className="mx-auto flex h-full w-full max-w-none flex-col gap-4 p-4">
          {/* Header */}
          <header className="shrink-0">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">Bình bài</h1>
                <p className="text-xs text-muted-foreground">
                  Danh sách mã bài & thiết kế chờ bình bài
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isConfiguring ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    onClick={handleCancelCreateOrder}
                  >
                    <X className="h-4 w-4" />
                    Hủy Tạo lệnh
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={isCreating}
                    onClick={() => {
                      setIsConfiguring(true);
                      setDesignQuantities({});
                      setProofingSheetQuantity(0);
                      setPaperSizeId("custom");
                      setCustomPaperSize("");
                      setConfigNotes("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Tạo lệnh mới
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="min-h-0 flex-1 overflow-hidden">
            <div className={cn("h-full flex gap-4")}>
              <Card
                className={cn(
                  "h-full overflow-hidden",
                  isConfiguring ? "w-2/3 min-w-0 flex-none" : "w-full",
                )}
              >
                <CardContent className="h-full p-0">
                  <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
                    <header className="shrink-0 space-y-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setIsDieListDialogOpen(true)}
                        >
                          <Box className="h-4 w-4" />
                          Danh sách khuôn bế
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setIsInventoryViewDialogOpen(true)}
                        >
                          <Package className="h-4 w-4" />
                          Xem kho hàng
                        </Button>
                      </div>

                      <PrepressOrdersHeader
                        designCode={designCode}
                        setDesignCode={setDesignCode}
                        selectedMaterialTypeId={selectedMaterialTypeId}
                        setSelectedMaterialTypeId={setSelectedMaterialTypeId}
                        materialTypeOptionsForOrders={
                          materialTypeOptionsForOrders
                        }
                        designTypeOptions={designTypeOptions}
                        materialTypeOptions={materialTypeOptions}
                        selectedDesignTypes={selectedDesignTypes}
                        selectedMaterialTypes={selectedMaterialTypes}
                        currentMaterialTypeId={currentMaterialTypeId}
                        searchTerm={searchTerm}
                        onDesignTypeChange={(ids) => {
                          setSelectedDesignTypes(ids);
                          setViewMode("designs");
                        }}
                        onMaterialTypeChange={setSelectedMaterialTypes}
                        onSearchChange={setSearchTerm}
                        onClearFilters={handleClearFilters}
                        designs={availableDesignsData?.designs || []}
                        selectedIds={selectedIds}
                        canSelect={canSelect}
                        onToggle={handleToggleDesign}
                        isLoadingDesigns={isLoadingDesigns}
                        // New props for split orders
                        hasActiveFilters={viewMode === "designs"}
                        incompleteOrders={incompleteOrders}
                        completedOrders={completedOrders}
                        loadingIncomplete={loadingIncompleteOrders}
                        loadingCompleted={loadingCompletedOrders}
                        incompletePage={incompleteOrdersPage}
                        setIncompletePage={setIncompleteOrdersPage}
                        completedPage={completedOrdersPage}
                        setCompletedPage={setCompletedOrdersPage}
                        incompleteTotalPages={incompleteTotalPages}
                        completedTotalPages={completedTotalPages}
                        incompleteOrdersPageInput={incompleteOrdersPageInput}
                        setIncompleteOrdersPageInput={
                          setIncompleteOrdersPageInput
                        }
                        handleIncompletePageInputBlur={
                          handleIncompletePageInputBlur
                        }
                        completedOrdersPageInput={completedOrdersPageInput}
                        setCompletedOrdersPageInput={
                          setCompletedOrdersPageInput
                        }
                        handleCompletedPageInputBlur={
                          handleCompletedPageInputBlur
                        }
                        incompleteTotalCount={incompleteTotalCount}
                        completedTotalCount={completedTotalCount}
                        itemsPerPage={itemsPerPage}
                        shouldShowExpand={shouldShowExpand}
                        expandedOrderIds={expandedOrderIds}
                        searchTermLower={searchTermLower}
                        debouncedDesignCode={debouncedDesignCode}
                        onNavigate={(id) => navigate(`/proofing/${id}`)}
                        ordersTableRef={ordersTableRef}
                        // Actions for shared DesignTable
                        onReject={openRejectDialog}
                        isRejecting={isRejecting}
                        onFindDie={() => setIsDieListDialogOpen(true)}
                        // Designs Pagination props
                        designsPage={designsPage}
                        setDesignsPage={setDesignsPage}
                        designsTotalPages={designsTotalPages}
                        designsPageInput={designsPageInput}
                        setDesignsPageInput={setDesignsPageInput}
                        handleDesignsPageInputBlur={handleDesignsPageInputBlur}
                        designsTotalCount={designsTotalCount}
                      />

                      {(selectedMaterialTypeId || designCode.trim()) && (
                        <div className="flex items-center gap-2 px-0 mt-[-8px]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={() => {
                              setDesignCode("");
                              setSelectedMaterialTypeId(null);
                              setIncompleteOrdersPage(1);
                              setCompletedOrdersPage(1);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Xóa bộ lọc
                          </Button>
                        </div>
                      )}
                    </header>

                    {/* Orders list components are now inside PrepressOrdersHeader if !hasActiveFilters */}
                  </div>
                </CardContent>
              </Card>

              {/* Right panel: config panel when creating new order */}
              {isConfiguring && (
                <div className="w-1/3 min-w-0 shrink-0 h-full flex flex-col">
                  <DetailEmptyOrderView
                    selectedDesigns={selectedDesigns}
                    selectedCount={configSelectedCount}
                    materialTypeName={configMaterialTypeName}
                    designQuantities={designQuantities}
                    setDesignQuantities={setDesignQuantities}
                    toggleSelection={handleToggleDesign}
                    proofingSheetQuantity={proofingSheetQuantity}
                    setProofingSheetQuantity={setProofingSheetQuantity}
                    paperSizeId={paperSizeId}
                    setPaperSizeId={setPaperSizeId}
                    customPaperSize={customPaperSize}
                    setCustomPaperSize={setCustomPaperSize}
                    notes={configNotes}
                    setNotes={setConfigNotes}
                    paperSizes={paperSizes}
                    showCreateButton={showCreateButton}
                    isCreatingPaperSize={isCreatingPaperSize}
                    handleCreatePaperSize={handleCreatePaperSize}
                    handleSubmitDesigns={handleConfigSubmitDesigns}
                    isAddingDesigns={
                      isCreating || isAddingDesigns || isUpdatingOrder
                    }
                  />
                </div>
              )}
            </div>
          </main>

          <DieListDialog
            open={isDieListDialogOpen}
            onOpenChange={setIsDieListDialogOpen}
          />

          <InventoryViewDialog
            open={isInventoryViewDialogOpen}
            onOpenChange={setIsInventoryViewDialogOpen}
          />

          <AlertDialog
            open={isRejectDialogOpen}
            onOpenChange={setIsRejectDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hoàn hàng về phòng thiết kế</AlertDialogTitle>
                <AlertDialogDescription>
                  Xác nhận hoàn hàng để thiết kế được trả về phòng thiết kế xử
                  lý lại.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {rejectTarget && (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-sm font-semibold text-foreground">
                      {rejectTarget.code}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rejectTarget.name}
                      {rejectTarget.orderCode || rejectTarget.orderId
                        ? ` • ${rejectTarget.orderCode || rejectTarget.orderId}`
                        : ""}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reject-reason">Lý do (tuỳ chọn)</Label>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ví dụ: sai thông tin, cần chỉnh file, thiếu chi tiết..."
                      className="min-h-[90px]"
                    />
                  </div>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    closeRejectDialog();
                  }}
                  disabled={isRejecting}
                >
                  Huỷ
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!rejectTarget) return;
                    try {
                      await rejectDesignMutate({
                        orderDetailId: rejectTarget.id,
                        reason: rejectReason.trim() || null,
                      });

                      // If this design is currently selected, unselect it.
                      // If it was the last selected item, also clearSelection()
                      // to ensure currentMaterialTypeId is reset.
                      const wasLastSelected =
                        selectedDesigns.length === 1 &&
                        selectedDesigns[0]?.id === rejectTarget.id;

                      if (selectedIds.has(rejectTarget.id)) {
                        toggleSelection(rejectTarget);
                      }

                      if (wasLastSelected) {
                        clearSelection();
                      }

                      closeRejectDialog();
                    } catch (err) {
                      console.error("Reject design failed:", err);
                      // error toast already handled by hook
                    }
                  }}
                  disabled={isRejecting || !rejectTarget}
                >
                  {isRejecting ? "Đang xử lý..." : "Xác nhận"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
