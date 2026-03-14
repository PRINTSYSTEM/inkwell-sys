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

import { PrepressDesignFilter } from "./components/PrepressDesignFilter";
import { PrepressOrdersHeader } from "./components/PrepressOrdersHeader";
import { PrepressOrdersTable } from "./components/PrepressOrdersTable";
import { PrepressDesignTable } from "./components/PrepressDesignTable";
import { PrepressOrderRow } from "./components/PrepressOrderRow";
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

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-hidden">
          <Card className="h-full overflow-hidden">
            <CardContent className="h-full p-0">
              {!hasActiveFilters ? (
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
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <PrepressDesignFilter
                    hasActiveFilters={hasActiveFilters}
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
                    onClearSelection={clearSelection}
                  />

                  <PrepressDesignTable
                    designs={availableDesignsData?.designs || []}
                    isLoading={isLoadingDesigns}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    canSelect={canSelect}
                    onReject={openRejectDialog}
                    isRejecting={isRejecting}
                    designsPage={designsPage}
                    setDesignsPage={setDesignsPage}
                    designsTotalPages={designsTotalPages}
                    selectedDesignsCount={selectedDesigns.length}
                    onOpenInventoryView={() => setIsInventoryViewDialogOpen(true)}
                  />

                  <div className="shrink-0 border-t p-4 flex items-center justify-between gap-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                       <Button
                        variant="default"
                        size="sm"
                        className="gap-2 font-semibold"
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

                            // 2) Add selected designs
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
                                  orderDetailId: d.id,
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

                            toast.success("Thành công", {
                                description: `Đã tạo lệnh bình bài ${order.orderCode} và thêm ${selectedDesigns.length} mã hàng.`,
                            });

                            clearSelection();
                            navigate(`/proofing/${order.id}`);
                          } catch (e) {
                            console.error("Create proofing from designs failed:", e);
                          }
                        }}
                      >
                        {(isCreating || isAddingDesigns) && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Tạo bình bài ({selectedDesigns.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedDesigns.length === 0}
                        onClick={clearSelection}
                      >
                        Bỏ chọn tất cả
                      </Button>
                    </div>
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
