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
} from "@/hooks/use-proofing-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { useProofingSelection } from "@/hooks/useProofingSelection";

import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import { laminationTypeLabels, processClassificationLabels, proofingStatusLabels, sidesClassificationLabels } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";

import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";
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
  const [materialTypeSearchOpen, setMaterialTypeSearchOpen] = useState(false);
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

  // Helper function to highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-red-500 text-white font-semibold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

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
    <div className="h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background">
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
             

              <Button
                size="sm"
                className="gap-2"
                disabled={isCreating}
                onClick={async () => {
                  try {
                    const result = await createProofingOrder({} as any);
                    if (result?.id) {
                      navigate(`/proofing/${result.id}`);
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
            </div>
          </div>
        </header>

        {/* Filter section (replaces statistics cards) */}
        <Card className="shrink-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-foreground">
                  Bộ lọc thiết kế chờ bình bài
                </div>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleClearFilters}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Về danh sách mã bài
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Chưa chọn bộ lọc: hiển thị danh sách mã bài
                  </div>
                )}
              </div>

              <FilterSection
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
              />

              {currentMaterialTypeId && (
                <FilterNoticeBanner
                  materialTypeName={
                    materialTypeOptions.find(
                      (m) => m.id === currentMaterialTypeId
                    )?.name || ""
                  }
                  onClear={handleClearSelection}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="shrink-0">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-hidden">
          <Card className="h-full overflow-hidden">
            <CardContent className="h-full p-0">
              {!hasActiveFilters ? (
                <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
                  {/* Search header */}
                  <div className="shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Tìm theo mã hàng..."
                          className="h-9 pl-10"
                          value={designCode}
                          onChange={(e) => {
                            setDesignCode(e.target.value);
                            setOrdersPage(1);
                          }}
                          onReset={() => {
                            setDesignCode("");
                            setOrdersPage(1);
                          }}
                        />
                      </div>
                      <Popover
                        open={materialTypeSearchOpen}
                        onOpenChange={setMaterialTypeSearchOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="h-9 w-[200px] justify-between"
                          >
                            {selectedMaterialTypeId
                              ? materialTypeOptionsForOrders.find(
                                  (mt) => mt.id === selectedMaterialTypeId
                                )?.name || "Loại chất liệu"
                              : "Loại chất liệu"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Tìm kiếm loại chất liệu..." />
                            <CommandList>
                              <CommandEmpty>
                                Không tìm thấy loại chất liệu
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    setSelectedMaterialTypeId(null);
                                    setMaterialTypeSearchOpen(false);
                                    setOrdersPage(1);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedMaterialTypeId === null
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  Tất cả loại chất liệu
                                </CommandItem>
                                {materialTypeOptionsForOrders.map((mt) => (
                                  <CommandItem
                                    key={mt.id}
                                    value={mt.name}
                                    onSelect={() => {
                                      setSelectedMaterialTypeId(mt.id);
                                      setMaterialTypeSearchOpen(false);
                                      setOrdersPage(1);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedMaterialTypeId === mt.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {mt.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {(selectedMaterialTypeId || designCode.trim()) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2"
                          onClick={() => {
                            setDesignCode("");
                            setSelectedMaterialTypeId(null);
                            setOrdersPage(1);
                          }}
                        >
                          <X className="h-4 w-4" />
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Incomplete Orders Table */}
                  <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
                    <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Mã bài chưa hoàn thành ({incompleteOrders.length})
                      </h3>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div ref={ordersTableRef} className="w-full">
                          <div className="w-full overflow-x-auto p-4">
                            <Table className="min-w-[980px]">
                              <TableHeader>
                                <TableRow>
                                  {shouldShowExpand && (
                                    <TableHead className="h-10 text-sm font-bold w-12">
                                    </TableHead>
                                  )}
                                  <TableHead className="h-10 text-sm font-bold">
                                    Mã bài
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    SL mã hàng
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Trạng thái
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Xuất kẽm
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Xuất khuôn
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Loại chất liệu
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Ngày tạo
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {loadingOrders ? (
                                  <TableSkeleton
                                    cols={shouldShowExpand ? 8 : 7}
                                    rows={5}
                                    rowHeight="h-14"
                                  />
                                ) : incompleteOrders.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={shouldShowExpand ? 8 : 7} className="py-10">
                                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                                        <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                                        <p className="text-sm font-semibold text-muted-foreground">
                                          Không có mã bài chưa hoàn thành
                                        </p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  incompleteOrders.map((order) => {
                                    const isExpanded = shouldShowExpand ? expandedOrderIds.has(order.id) : false;
                                    const designs = order.proofingOrderDesigns ?? [];
                                    const orderCodeMatches = shouldShowExpand && order.code?.toLowerCase().includes(searchTermLower);
                                    
                                    return (
                                      <>
                                        <TableRow
                                          key={order.id}
                                          className="hover:bg-muted/50 cursor-pointer"
                                          onClick={() => navigate(`/proofing/${order.id}`)}
                                        >
                                          {shouldShowExpand && (
                                            <TableCell className="py-3 w-12">
                                              <div className="flex items-center justify-center">
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            </TableCell>
                                          )}
                                          <TableCell className="py-3 font-semibold">
                                            {shouldShowExpand && orderCodeMatches
                                              ? highlightText(order.code || "", debouncedDesignCode.trim())
                                              : order.code}
                                          </TableCell>
                                      <TableCell className="py-3 font-semibold">
                                        {order.proofingOrderDesigns?.length ?? 0}
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <StatusBadge
                                          status={order.status || ""}
                                          label={
                                            proofingStatusLabels[
                                              order.status || ""
                                            ] ||
                                            order.status ||
                                            "Không xác định"
                                          }
                                          className={cn(
                                            "text-xs font-semibold",
                                            "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                          )}
                                        />
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <StatusBadge
                                          status={
                                            order.plateExport
                                              ? "exported"
                                              : "not_exported"
                                          }
                                          label={
                                            order.plateExport
                                              ? "Đã xuất"
                                              : "Chưa xuất"
                                          }
                                          className={cn(
                                            "text-xs font-semibold",
                                            order.plateExport
                                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                              : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                          )}
                                        />
                                      </TableCell>
                                      <TableCell className="py-3">
                                        {order.proofingOrderDesigns?.some(
                                          (pod) =>
                                            pod.design?.processClassification ===
                                            "die_cut"
                                        ) ? (
                                          <StatusBadge
                                            status={
                                              (order.dieExports?.length ?? 0) > 0
                                                ? "exported"
                                                : "not_exported"
                                            }
                                            label={
                                              (order.dieExports?.length ?? 0) > 0
                                                ? "Đã xuất"
                                                : "Chưa xuất"
                                            }
                                            className={cn(
                                              "text-xs font-semibold",
                                              (order.dieExports?.length ?? 0) > 0
                                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                            )}
                                          />
                                        ) : (
                                          <span className="text-xs font-semibold text-muted-foreground">
                                            Không có
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-3 font-semibold">
                                        {order.proofingOrderDesigns?.[0]?.design
                                          ?.materialType?.name || "—"}
                                      </TableCell>
                                      <TableCell className="py-3 font-semibold">
                                        {order.createdAt
                                          ? new Date(
                                              order.createdAt
                                            ).toLocaleDateString("vi-VN")
                                          : "—"}
                                      </TableCell>
                                    </TableRow>
                                    {shouldShowExpand && isExpanded && designs.length > 0 && (
                                      <TableRow key={`${order.id}-expanded`}>
                                        <TableCell 
                                          colSpan={shouldShowExpand ? 8 : 7} 
                                          className="p-0 bg-muted/20"
                                        >
                                          <div className="p-4">
                                            <div className="border rounded-lg overflow-hidden">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-muted/40">
                                                    <TableHead className="h-9 text-xs font-bold w-16">Ảnh</TableHead>
                                                    <TableHead className="h-9 text-xs font-bold">Mã hàng</TableHead>
                                                    <TableHead className="h-9 text-xs font-bold">Kích thước</TableHead>
                                                    <TableHead className="h-9 text-xs font-bold text-right">Số lượng</TableHead>
                                                    <TableHead className="h-9 text-xs font-bold">Quy cách</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {designs.map((pod) => {
                                                    const designCode = pod.design?.code || "";
                                                    const designCodeMatches = designCode.toLowerCase().includes(searchTermLower);
                                                    const length = pod.design?.length;
                                                    const width = pod.design?.width;
                                                    const height = pod.design?.height;
                                                    
                                                    // Build full info for tooltip
                                                    const fullInfo = (
                                                      <div className="space-y-2 text-sm max-w-md">
                                                        <div className="font-semibold text-base border-b pb-2">
                                                          {pod.design?.designName || "—"}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                          <div>
                                                            <span className="text-muted-foreground">
                                                              Mã hàng:
                                                            </span>
                                                            <span className="ml-2 font-mono">
                                                              {designCode || "—"}
                                                            </span>
                                                          </div>

                                                         

                                                          <div>
                                                            <span className="text-muted-foreground">
                                                              Chất liệu:
                                                            </span>
                                                            <span className="ml-2">
                                                              {pod.design?.materialType?.name || "—"}
                                                            </span>
                                                          </div>

                                                          <div>
                                                            <span className="text-muted-foreground">
                                                              Kích thước:
                                                            </span>
                                                            <span className="ml-2">
                                                              {formatDesignDimensions(
                                                                length,
                                                                width,
                                                                height
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

                                                         
                                                        </div>

                                                        {(pod.design?.processClassification ||
                                                          pod.design?.sidesClassification ||
                                                          pod.design?.laminationType) && (
                                                          <div className="pt-2 flex flex-wrap gap-1 justify-between border-t space-y-1">
                                                            {pod.design?.processClassification && (
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
                                                            {pod.design?.laminationType && (
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
                                                        {pod.design?.latestRequirements && (
                                                          <div className="pt-2 border-t space-y-1">
                                                            <div className="font-semibold text-xs text-muted-foreground">
                                                              Yêu cầu:
                                                            </div>
                                                            <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                                                              {pod.design.latestRequirements}
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* Ghi chú */}
                                                        {pod.design?.notes && (
                                                          <div className="pt-2 border-t space-y-1">
                                                            <div className="font-semibold text-xs text-muted-foreground">
                                                              Ghi chú:
                                                            </div>
                                                            <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                                                              {pod.design.notes}
                                                            </div>
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
                                                        <TableRow className="hover:bg-muted/30">
                                                          <TableCell className="py-2">
                                                            {pod.design?.designImageUrl ? (
                                                              <img
                                                                src={pod.design.designImageUrl}
                                                                alt={pod.design?.designName || designCode}
                                                                className="w-12 h-12 object-cover rounded border"
                                                              />
                                                            ) : (
                                                              <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                                                <FileImage className="h-5 w-5 text-muted-foreground" />
                                                              </div>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="py-2 font-mono text-sm font-semibold">
                                                            {shouldShowExpand && designCodeMatches
                                                              ? highlightText(designCode, debouncedDesignCode.trim())
                                                              : designCode || "—"}
                                                          </TableCell>
                                                          <TableCell className="py-2 text-sm">
                                                            {length != null && height != null
                                                              ? width && width > 0
                                                                ? `${length} × ${width} × ${height} mm`
                                                                : `${length} × ${height} mm`
                                                              : "—"}
                                                          </TableCell>
                                                          <TableCell className="py-2 text-sm text-right font-semibold">
                                                            {pod.quantity != null
                                                              ? pod.quantity.toLocaleString("vi-VN")
                                                              : "—"}
                                                          </TableCell>
                                                          <TableCell className="py-2 text-sm">
                                                            {formatDesignDimensions(
                                                              length,
                                                              width,
                                                              height,
                                                              1,
                                                              " × "
                                                            )}{" "}
                                                            {length != null || height != null ? "mm" : ""}
                                                          </TableCell>
                                                        </TableRow>
                                                      </CursorTooltip>
                                                    );
                                                  })}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                  );
                                })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Completed Orders Table */}
                  <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
                    <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Mã bài đã hoàn thành ({completedOrders.length})
                      </h3>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="w-full">
                          <div className="w-full overflow-x-auto p-4">
                            <Table className="min-w-[980px]">
                              <TableHeader>
                                <TableRow>
                                  {shouldShowExpand && (
                                    <TableHead className="h-10 text-sm font-bold w-12">
                                    </TableHead>
                                  )}
                                  <TableHead className="h-10 text-sm font-bold">
                                    Mã bài
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    SL mã hàng
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Trạng thái
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Xuất kẽm
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Xuất khuôn
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Loại chất liệu
                                  </TableHead>
                                  <TableHead className="h-10 text-sm font-bold">
                                    Ngày tạo
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {loadingOrders ? (
                                  <TableSkeleton
                                    cols={shouldShowExpand ? 8 : 7}
                                    rows={5}
                                    rowHeight="h-14"
                                  />
                                ) : completedOrders.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={shouldShowExpand ? 8 : 7} className="py-10">
                                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                                        <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                                        <p className="text-sm font-semibold text-muted-foreground">
                                          Không có mã bài đã hoàn thành
                                        </p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                              ) : (
                                  completedOrders.map((order) => {
                                    const isExpanded = shouldShowExpand ? expandedOrderIds.has(order.id) : false;
                                    const designs = order.proofingOrderDesigns ?? [];
                                    const orderCodeMatches = shouldShowExpand && order.code?.toLowerCase().includes(searchTermLower);
                                    
                                    return (
                                      <>
                                        <TableRow
                                          key={order.id}
                                          className="hover:bg-muted/50 cursor-pointer"
                                          onClick={() => navigate(`/proofing/${order.id}`)}
                                        >
                                          {shouldShowExpand && (
                                            <TableCell className="py-3 w-12">
                                              <div className="flex items-center justify-center">
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            </TableCell>
                                          )}
                                          <TableCell className="py-3 font-semibold">
                                            {shouldShowExpand && orderCodeMatches
                                              ? highlightText(order.code || "", debouncedDesignCode.trim())
                                              : order.code}
                                          </TableCell>
                                      <TableCell className="py-3 font-semibold">
                                        {order.proofingOrderDesigns?.length ?? 0}
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <StatusBadge
                                          status={order.status || ""}
                                          label={
                                            proofingStatusLabels[
                                              order.status || ""
                                            ] ||
                                            order.status ||
                                            "Không xác định"
                                          }
                                          className={cn(
                                            "text-xs font-semibold",
                                            "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                          )}
                                        />
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <StatusBadge
                                          status={
                                            order.plateExport
                                              ? "exported"
                                              : "not_exported"
                                          }
                                          label={
                                            order.plateExport
                                              ? "Đã xuất"
                                              : "Chưa xuất"
                                          }
                                          className={cn(
                                            "text-xs font-semibold",
                                            order.plateExport
                                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                              : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                          )}
                                        />
                                      </TableCell>
                                      <TableCell className="py-3">
                                        {order.proofingOrderDesigns?.some(
                                          (pod) =>
                                            pod.design?.processClassification ===
                                            "die_cut"
                                        ) ? (
                                          <StatusBadge
                                            status={
                                              (order.dieExports?.length ?? 0) > 0
                                                ? "exported"
                                                : "not_exported"
                                            }
                                            label={
                                              (order.dieExports?.length ?? 0) > 0
                                                ? "Đã xuất"
                                                : "Chưa xuất"
                                            }
                                            className={cn(
                                              "text-xs font-semibold",
                                              (order.dieExports?.length ?? 0) > 0
                                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                            )}
                                          />
                                        ) : (
                                          <span className="text-xs font-semibold text-muted-foreground">
                                            Không có
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-3 font-semibold">
                                        {order.proofingOrderDesigns?.[0]?.design
                                          ?.materialType?.name || "—"}
                                      </TableCell>
                                      <TableCell className="py-3 font-semibold">
                                        {order.createdAt
                                          ? new Date(
                                              order.createdAt
                                            ).toLocaleDateString("vi-VN")
                                          : "—"}
                                    </TableCell>
                                  </TableRow>
                                  {shouldShowExpand && isExpanded && designs.length > 0 && (
                                    <TableRow key={`${order.id}-expanded`}>
                                      <TableCell 
                                        colSpan={shouldShowExpand ? 8 : 7} 
                                        className="p-0 bg-muted/20"
                                      >
                                        <div className="p-4">
                                          <div className="text-sm font-semibold text-foreground mb-3">
                                            Danh sách mã hàng ({designs.length})
                                          </div>
                                          <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                              <TableHeader>
                                                <TableRow className="bg-muted/40">
                                                  <TableHead className="h-9 text-xs font-bold w-16">Ảnh</TableHead>
                                                  <TableHead className="h-9 text-xs font-bold">Mã hàng</TableHead>
                                                  <TableHead className="h-9 text-xs font-bold">Kích thước</TableHead>
                                                  <TableHead className="h-9 text-xs font-bold text-right">Số lượng</TableHead>
                                                  <TableHead className="h-9 text-xs font-bold">Quy cách</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {designs.map((pod) => {
                                                  const designCode = pod.design?.code || "";
                                                  const designCodeMatches = designCode.toLowerCase().includes(searchTermLower);
                                                  const length = pod.design?.length;
                                                  const width = pod.design?.width;
                                                  const height = pod.design?.height;
                                                  
                                                  // Build full info for tooltip
                                                  const fullInfo = (
                                                    <div className="space-y-2 text-sm max-w-md">
                                                      <div className="font-semibold text-base border-b pb-2">
                                                        {pod.design?.designName || "—"}
                                                      </div>

                                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                        <div>
                                                          <span className="text-muted-foreground">
                                                            Mã hàng:
                                                          </span>
                                                          <span className="ml-2 font-mono">
                                                            {designCode || "—"}
                                                          </span>
                                                        </div>

                                                        <div>
                                                          <span className="text-muted-foreground">
                                                            Loại:
                                                          </span>
                                                          <span className="ml-2">
                                                            {pod.design?.designType?.name || "—"}
                                                          </span>
                                                        </div>

                                                        <div>
                                                          <span className="text-muted-foreground">
                                                            Chất liệu:
                                                          </span>
                                                          <span className="ml-2">
                                                            {pod.design?.materialType?.name || "—"}
                                                          </span>
                                                        </div>

                                                        <div>
                                                          <span className="text-muted-foreground">
                                                            Kích thước:
                                                          </span>
                                                          <span className="ml-2">
                                                            {formatDesignDimensions(
                                                              length,
                                                              width,
                                                              height
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
                                                            {pod.design?.designer?.fullName || "—"}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      {(pod.design?.processClassification ||
                                                        pod.design?.sidesClassification ||
                                                        pod.design?.laminationType) && (
                                                        <div className="pt-2 flex flex-wrap gap-1 justify-between border-t space-y-1">
                                                          {pod.design?.processClassification && (
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
                                                          {pod.design?.laminationType && (
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
                                                      {pod.design?.latestRequirements && (
                                                        <div className="pt-2 border-t space-y-1">
                                                          <div className="font-semibold text-xs text-muted-foreground">
                                                            Yêu cầu:
                                                          </div>
                                                          <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                                                            {pod.design.latestRequirements}
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Ghi chú */}
                                                      {pod.design?.notes && (
                                                        <div className="pt-2 border-t space-y-1">
                                                          <div className="font-semibold text-xs text-muted-foreground">
                                                            Ghi chú:
                                                          </div>
                                                          <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                                                            {pod.design.notes}
                                                          </div>
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
                                                      <TableRow className="hover:bg-muted/30">
                                                        <TableCell className="py-2">
                                                          {pod.design?.designImageUrl ? (
                                                            <img
                                                              src={pod.design.designImageUrl}
                                                              alt={pod.design?.designName || designCode}
                                                              className="w-12 h-12 object-cover rounded border"
                                                            />
                                                          ) : (
                                                            <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                                              <FileImage className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                          )}
                                                        </TableCell>
                                                        <TableCell className="py-2 font-mono text-sm font-semibold">
                                                          {shouldShowExpand && designCodeMatches
                                                            ? highlightText(designCode, debouncedDesignCode.trim())
                                                            : designCode || "—"}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-sm">
                                                          {length != null && height != null
                                                            ? width && width > 0
                                                              ? `${length} × ${width} × ${height} mm`
                                                              : `${length} × ${height} mm`
                                                            : "—"}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-sm text-right font-semibold">
                                                          {pod.quantity != null
                                                            ? pod.quantity.toLocaleString("vi-VN")
                                                            : "—"}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-sm">
                                                          {formatDesignDimensions(
                                                            length,
                                                            width,
                                                            height,
                                                            1,
                                                            " × "
                                                          )}{" "}
                                                          {length != null || height != null ? "mm" : ""}
                                                        </TableCell>
                                                      </TableRow>
                                                    </CursorTooltip>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                                );
                              })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </ScrollArea>
                    </div>
                  </div>

                  {/* Orders pagination */}
                  {ordersTotalCount > 0 && (
                    <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-3 bg-background">
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
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="shrink-0 border-b p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Thiết kế chờ bình bài
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Đã chọn: {selectedDesigns.length}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={
                          selectedDesigns.length === 0 ||
                          isCreating ||
                          isAddingDesigns ||
                          currentMaterialTypeId == null
                        }
                        onClick={async () => {
                          try {
                            if (selectedDesigns.length === 0) return;
                            if (currentMaterialTypeId == null) {
                              toast.error("Lỗi", {
                                description:
                                  "Vui lòng chọn ít nhất 1 thiết kế để xác định chất liệu.",
                              });
                              return;
                            }

                            // 1) Create empty proofing order
                            const order = await createProofingOrder({} as any);
                            if (!order?.id) {
                              toast.error("Lỗi", {
                                description: "Không thể tạo lệnh bình bài mới.",
                              });
                              return;
                            }

                            // 2) Add selected designs (default qty = max available)
                            const items = selectedDesigns
                              .map((d) => {
                                const qtyBase =
                                  d.availableQuantity != null
                                    ? d.availableQuantity
                                    : d.quantity;
                                const qty = Math.max(
                                  1,
                                  Math.floor(qtyBase || 0)
                                );
                                return {
                                  orderDetailId: d.id, // d.id is orderDetailId
                                  quantity: qty,
                                };
                              })
                              .filter((x) => x.quantity > 0);

                            if (items.length === 0) {
                              toast.error("Lỗi", {
                                description:
                                  "Không tìm thấy thiết kế hợp lệ để thêm vào bình bài.",
                              });
                              return;
                            }

                            await addDesignsMutate({
                              id: order.id,
                              request: {
                                materialTypeId: currentMaterialTypeId,
                                items,
                              },
                            });

                            // 3) Navigate to detail
                            navigate(`/proofing/${order.id}`);
                          } catch (e) {
                            console.error(
                              "Create proofing from designs failed:",
                              e
                            );
                            // errors are already surfaced via hook toasts
                          }
                        }}
                      >
                        {(isCreating || isAddingDesigns) && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Tạo bình bài
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div ref={designsTableRef} className="p-4 space-y-3">
                        {isLoadingDesigns ? (
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải danh sách thiết kế...
                          </div>
                        ) : (availableDesignsData?.designs?.length ?? 0) ===
                          0 ? (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                            <p className="mt-3 text-sm font-semibold text-muted-foreground">
                              Không có thiết kế nào phù hợp.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs text-muted-foreground">
                                Tổng:{" "}
                                <span className="font-semibold text-foreground">
                                  {designsTotalCount}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() =>
                                    setDesignsPage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={
                                    designsPage === 1 || isLoadingDesigns
                                  }
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Input
                                  type="number"
                                  min={1}
                                  max={designsTotalPages}
                                  value={designsPageInput}
                                  onChange={(e) =>
                                    setDesignsPageInput(e.target.value)
                                  }
                                  onBlur={handleDesignsPageInputBlur}
                                  className="h-8 w-16 text-center text-xs"
                                  disabled={isLoadingDesigns}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() =>
                                    setDesignsPage((p) =>
                                      Math.min(designsTotalPages, p + 1)
                                    )
                                  }
                                  disabled={
                                    designsPage >= designsTotalPages ||
                                    isLoadingDesigns
                                  }
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="rounded-lg border overflow-hidden">
                              <div className="w-full overflow-x-auto">
                                <Table className="min-w-[980px]">
                                  <TableHeader className="bg-muted/20">
                                    <TableRow>
                                      <TableHead className="text-sm font-bold">
                                        Đơn hàng
                                      </TableHead>
                                      <TableHead className="text-sm font-bold">
                                        Mã hàng
                                      </TableHead>
                                      <TableHead className="text-sm font-bold">
                                        Số lượng
                                      </TableHead>
                                      <TableHead className="text-sm font-bold">
                                        Quy cách
                                      </TableHead>
                                      <TableHead className="text-sm font-bold">
                                        Chất liệu
                                      </TableHead>
                                      <TableHead className="text-sm font-bold">
                                        Loại
                                      </TableHead>
                                      <TableHead className="w-[220px] text-right text-sm font-bold">
                                        Thao tác
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TooltipProvider>
                                      {(availableDesignsData?.designs ?? []).map(
                                        (design) => {
                                          const isSelected = selectedIds.has(
                                            design.id
                                          );
                                          const selectable = canSelect(design);

                                          const tooltipContent = `Mã hàng: ${design.code}\nTên: ${design.name}\nSố lượng: ${design.availableQuantity != null ? design.availableQuantity.toLocaleString("vi-VN") : design.quantity.toLocaleString("vi-VN")}\nQuy cách: ${formatDesignDimensions(design.length, design.width, design.height, 1, " × ")} ${design.unit}\nChất liệu: ${design.materialTypeName}\n${design.orderCode ? `\nĐơn hàng: ${design.orderCode}` : ""}`;

                                          return (
                                            <Tooltip key={design.id}>
                                              <TooltipTrigger asChild>
                                                <TableRow
                                                  className={cn(
                                                    "cursor-pointer",
                                                    isSelected && "bg-primary/5",
                                                    !selectable &&
                                                      !isSelected &&
                                                      "opacity-50"
                                                  )}
                                                  onClick={() => {
                                                    if (selectable || isSelected)
                                                      toggleSelection(design);
                                                  }}
                                                >
                                            <TableCell className="py-3">
                                              <span className="font-semibold text-sm text-primary">
                                                {design.orderCode ||
                                                  design.orderId}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-3 font-mono text-sm font-semibold">
                                              {design.code}
                                            </TableCell>
                                            <TableCell className="py-3">
                                              <span className="text-sm font-semibold">
                                                {design.availableQuantity != null
                                                  ? design.availableQuantity.toLocaleString(
                                                      "vi-VN"
                                                    )
                                                  : design.quantity.toLocaleString(
                                                      "vi-VN"
                                                    )}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                              <span className="text-sm font-medium">
                                                {formatDesignDimensions(
                                                  design.length,
                                                  design.width,
                                                  design.height,
                                                  1,
                                                  " × "
                                                )}{" "}
                                                {design.unit}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                              <span className="text-sm font-medium">
                                                {design.materialTypeName}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                              <span className="text-sm font-medium">
                                                {design.designTypeName}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                              <div className="inline-flex items-center justify-end gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  disabled={isRejecting}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openRejectDialog(design);
                                                  }}
                                                >
                                                  Hoàn hàng
                                                </Button>
                                              </div>
                                            </TableCell>
                                                </TableRow>
                                              </TooltipTrigger>
                                              <TooltipContent side="right" className="max-w-xs whitespace-pre-line">
                                                {tooltipContent}
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        }
                                      )}
                                    </TooltipProvider>
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {selectedDesigns.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">
                                  Đang chọn: {selectedDesigns.length}
                                </Badge>
                                {currentMaterialTypeId && (
                                  <Badge variant="outline">
                                    Material ID: {currentMaterialTypeId}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
