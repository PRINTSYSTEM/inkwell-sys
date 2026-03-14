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
  useProofingAvailableOrderDetailsDesignTypeSummary,
  useProofingOrders,
  useRejectDesignFromProofingOrder,
  usePaperSizes,
  useCreatePaperSize,
} from "@/hooks/use-proofing-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { useProofingSelection } from "@/hooks/useProofingSelection";

import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import { laminationTypeLabels, processClassificationLabels, proofingStatusLabels, sidesClassificationLabels } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";

import { PrepressDesignFilter } from "./components/PrepressDesignFilter";
import { PrepressOrdersHeader } from "./components/PrepressOrdersHeader";
import { PrepressOrdersTable } from "./components/PrepressOrdersTable";
import { PrepressDesignTable } from "./components/PrepressDesignTable";
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
    []
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const hasActiveFilters = useHasActiveProofingFilters({
    selectedDesignTypes,
    selectedMaterialTypes,
    searchTerm,
  });

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
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageInput, setOrdersPageInput] = useState<string>("");
  const ordersTableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 30;

  const queryParams = useMemo(() => {
    const raw = {
      status: null,
      designCode: debouncedDesignCode.trim() || null,
      materialTypeId: selectedMaterialTypeId,
      pageSize: itemsPerPage,
      pageNumber: ordersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, selectedMaterialTypeId, ordersPage]);

  const {
    data: ordersResp,
    isLoading: loadingOrders,
    error: ordersError,
  } = useProofingOrders(queryParams);

  const proofingOrders = useMemo<ProofingOrder[]>(() => {
    const items = ordersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ProofingOrder[];
  }, [ordersResp?.items]);

  // Split orders into incomplete and completed
  const incompleteOrders = useMemo(() => {
    return proofingOrders.filter((order) => order.status !== "completed");
  }, [proofingOrders]);

  const completedOrders = useMemo(() => {
    return proofingOrders.filter((order) => order.status === "completed");
  }, [proofingOrders]);

  const ordersTotalCount = ordersResp?.total ?? proofingOrders.length;
  const ordersTotalPages = Math.ceil(ordersTotalCount / itemsPerPage) || 1;

  useEffect(() => {
    setOrdersPageInput(ordersPage.toString());
  }, [ordersPage]);

  useEffect(() => {
    if (ordersTableRef.current) ordersTableRef.current.scrollTop = 0;
  }, [ordersPage]);

  useEffect(() => {
    // reset orders pagination when list filters change
    setOrdersPage(1);
    setOrdersPageInput("1");
  }, [debouncedDesignCode, selectedMaterialTypeId]);

  const handleOrdersPageInputBlur = () => {
    const page = parseInt(ordersPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= ordersTotalPages) {
      setOrdersPage(page);
    } else {
      setOrdersPageInput(ordersPage.toString());
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
      hasActiveFilters
        ? {
            materialTypeId: materialTypeIdForApi,
            designTypeId: selectedDesignTypeId,
            designCode: designCodeForApi,
            pageNumber: designsPage,
            pageSize: designsPageSize,
          }
        : undefined
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
    new Set()
  );

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<DesignItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ===== Config Panel State (inline DetailEmptyOrderView) =====
  const [newOrderId, setNewOrderId] = useState<number | null>(null);
  const [designQuantities, setDesignQuantities] = useState<Record<number, number>>({});
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState(0);
  const [paperSizeId, setPaperSizeId] = useState("custom");
  const [customPaperSize, setCustomPaperSize] = useState("");
  const [configNotes, setConfigNotes] = useState("");
  const { data: paperSizesData } = usePaperSizes();
  const paperSizes = paperSizesData || [];
  const { mutate: createPaperSizeMutate, loading: isCreatingPaperSize } = useCreatePaperSize();

  const configSelectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  const configMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !materialTypeOptions.length) return null;
    const found = materialTypeOptions.find((m: any) => m.id === currentMaterialTypeId);
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
    return paperSizes.find(
      (ps) => ps.width === parsedCustomPaperSize.width && ps.height === parsedCustomPaperSize.height
    ) ?? null;
  }, [parsedCustomPaperSize, paperSizes]);

  const showCreateButton = useMemo(() => {
    return paperSizeId === "custom" && !!parsedCustomPaperSize && !existingPaperSize && customPaperSize.trim().length > 0;
  }, [paperSizeId, parsedCustomPaperSize, existingPaperSize, customPaperSize]);

  const handleCreatePaperSize = async () => {
    if (!parsedCustomPaperSize) {
      toast.error("Lỗi", { description: "Vui lòng nhập khổ giấy hợp lệ (ví dụ: 31×43)" });
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
    if (!newOrderId) return;
    try {
      if (!currentMaterialTypeId || selectedDesigns.length === 0) {
        toast.error("Lỗi", { description: "Vui lòng chọn mã hàng để thêm vào bình bài" });
        return;
      }
      const items = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          if (!design) return null;
          return { orderDetailId: design.id, quantity: Math.floor(qty) };
        })
        .filter((item): item is { orderDetailId: number; quantity: number } => item !== null);

      if (items.length === 0) {
        toast.error("Lỗi", { description: "Vui lòng nhập số lượng cho ít nhất một mã hàng" });
        return;
      }

      await addDesignsMutate({
        id: newOrderId,
        request: { materialTypeId: currentMaterialTypeId, items },
      });

      toast.success("Thành công", { description: `Đã thêm ${items.length} mã hàng vào bình bài.` });
      setNewOrderId(null);
      setDesignQuantities({});
      setProofingSheetQuantity(0);
      setPaperSizeId("custom");
      setCustomPaperSize("");
      setConfigNotes("");
      clearSelection();
      navigate(`/proofing/${newOrderId}`);
    } catch (e) {
      console.error("Submit designs failed:", e);
    }
  };

  const handleCancelCreateOrder = () => {
    setNewOrderId(null);
    setDesignQuantities({});
    setProofingSheetQuantity(0);
    setPaperSizeId("custom");
    setCustomPaperSize("");
    setConfigNotes("");
    clearSelection();
  };

  const handleClearFilters = () => {
    setSelectedDesignTypes([]);
    setSelectedMaterialTypes([]);
    setSearchTerm("");
    setDesignsPage(1);
    setDesignsPageInput("1");
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
    if (shouldShowExpand && proofingOrders.length > 0) {
      const allOrderIds = new Set(proofingOrders.map((o) => o.id));
      setExpandedOrderIds(allOrderIds);
    } else {
      setExpandedOrderIds(new Set());
    }
  }, [shouldShowExpand, proofingOrders]);

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
    <div className="relative h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background">
      {/* File Label for Debugging */}
      <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md z-[100] font-mono pointer-events-none opacity-80">
        PrepressList.tsx
      </div>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
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
              {newOrderId ? (
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
                  onClick={async () => {
                    try {
                      const result = await createProofingOrder({} as any);
                      if (result?.id) {
                        setNewOrderId(result.id);
                        setDesignQuantities({});
                        setProofingSheetQuantity(0);
                        setPaperSizeId("custom");
                        setCustomPaperSize("");
                        setConfigNotes("");
                      } else {
                        toast.error("Không thể tạo lệnh");
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Tạo lệnh mới
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-hidden">
          <div className={cn("h-full flex gap-4")}>
          <Card className={cn("h-full overflow-hidden", newOrderId ? "flex-1 min-w-0" : "w-full")}>
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
                      setOrdersPage={setOrdersPage}
                      selectedMaterialTypeId={selectedMaterialTypeId}
                      setSelectedMaterialTypeId={setSelectedMaterialTypeId}
                      materialTypeOptionsForOrders={materialTypeOptionsForOrders}
                      designTypeOptions={designTypeOptions}
                      materialTypeOptions={materialTypeOptions}
                      selectedDesignTypes={selectedDesignTypes}
                      selectedMaterialTypes={selectedMaterialTypes}
                      currentMaterialTypeId={currentMaterialTypeId}
                      searchTerm={searchTerm}
                      onDesignTypeChange={setSelectedDesignTypes}
                      onMaterialTypeChange={setSelectedMaterialTypes}
                      onSearchChange={setSearchTerm}
                      onClearFilters={handleClearFilters}
                      designs={availableDesignsData?.designs || []}
                      selectedIds={selectedIds}
                      canSelect={canSelect}
                      onToggle={toggleSelection}
                      isLoadingDesigns={isLoadingDesigns}
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
                            setOrdersPage(1);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                          Xóa bộ lọc
                        </Button>
                      </div>
                    )}
                  </header>

                  {!hasActiveFilters && (
                  <>
                  <PrepressOrdersTable
                    title="Mã bài chưa hoàn thành"
                    count={incompleteOrders.length}
                    orders={incompleteOrders}
                    loading={loadingOrders}
                    shouldShowExpand={shouldShowExpand}
                    expandedOrderIds={expandedOrderIds}
                    searchTermLower={searchTermLower}
                    debouncedSearchTerm={debouncedDesignCode}
                    onNavigate={(id) => navigate(`/proofing/${id}`)}
                    tableRef={ordersTableRef}
                  />

                  <PrepressOrdersTable
                    title="Mã bài đã hoàn thành"
                    count={completedOrders.length}
                    orders={completedOrders}
                    loading={loadingOrders}
                    shouldShowExpand={shouldShowExpand}
                    expandedOrderIds={expandedOrderIds}
                    searchTermLower={searchTermLower}
                    debouncedSearchTerm={debouncedDesignCode}
                    onNavigate={(id) => navigate(`/proofing/${id}`)}
                  />

                  {/* Orders pagination */}
                  {ordersTotalCount > 0 && (
                    <div className="shrink-0 border-t py-2 flex items-center justify-between gap-3 bg-background">
                      <div className="text-xs text-muted-foreground">
                        Hiển thị{" "}
                        <span className="font-semibold text-foreground">
                          {(ordersPage - 1) * itemsPerPage + 1}
                        </span>
                        {" - "}
                        <span className="font-semibold text-foreground">
                          {Math.min(
                            ordersPage * itemsPerPage,
                            ordersTotalCount
                          )}
                        </span>{" "}
                        /{" "}
                        <span className="font-semibold text-foreground">
                          {ordersTotalCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            setOrdersPage((p) => Math.max(1, p - 1))
                          }
                          disabled={ordersPage === 1 || loadingOrders}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            Trang
                          </span>
                          <Input
                            type="number"
                            min={1}
                            max={ordersTotalPages}
                            value={ordersPageInput}
                            onChange={(e) => setOrdersPageInput(e.target.value)}
                            onBlur={handleOrdersPageInputBlur}
                            className="h-8 w-14 text-center text-xs"
                            disabled={loadingOrders}
                          />
                          <span className="text-xs text-muted-foreground">
                            / {ordersTotalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            setOrdersPage((p) =>
                              Math.min(ordersTotalPages, p + 1)
                            )
                          }
                          disabled={
                            ordersPage >= ordersTotalPages || loadingOrders
                          }
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>
            </CardContent>
          </Card>

          {/* Right panel: config panel when creating new order */}
          {newOrderId && (
            <div className="basis-2/5 min-w-0 shrink-0">
              <DetailEmptyOrderView
                selectedDesigns={selectedDesigns}
                selectedCount={configSelectedCount}
                materialTypeName={configMaterialTypeName}
                designQuantities={designQuantities}
                setDesignQuantities={setDesignQuantities}
                toggleSelection={toggleSelection}
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
                isAddingDesigns={isAddingDesigns}
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
                Xác nhận hoàn hàng để thiết kế được trả về phòng thiết kế xử lý
                lại.
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
  );
}
