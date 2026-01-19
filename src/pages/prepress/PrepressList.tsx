import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Search,
  Box,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { proofingStatusLabels } from "@/lib/status-utils";
import { cn } from "@/lib/utils";

import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";
import { DieListDialog } from "@/components/dies/DieListDialog";

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
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageInput, setOrdersPageInput] = useState<string>("");
  const ordersTableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 30;

  const queryParams = useMemo(() => {
    const raw = {
      status: null,
      designCode: debouncedDesignCode.trim() || null,
      pageSize: itemsPerPage,
      pageNumber: ordersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, ordersPage]);

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

  const sortedOrders = useMemo(() => {
    return [...proofingOrders].sort((a, b) => {
      const aIsCompleted = a.status === "completed";
      const bIsCompleted = b.status === "completed";
      if (aIsCompleted === bIsCompleted) return 0;
      return aIsCompleted ? 1 : -1;
    });
  }, [proofingOrders]);

  const ordersTotalCount = ordersResp?.total ?? sortedOrders.length;
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
  }, [debouncedDesignCode]);

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
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsDieListDialogOpen(true)}
              >
                <Box className="h-4 w-4" />
                Danh sách khuôn bế
              </Button>

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

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-hidden">
          <Card className="h-full overflow-hidden">
            <CardContent className="h-full p-0">
              {!hasActiveFilters ? (
                <div className="flex h-full flex-col">
                  {/* Orders list header controls */}
                  <div className="shrink-0 border-b p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                      </div>
                    </div>
                  </div>

                  {/* Orders table */}
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div ref={ordersTableRef} className="min-h-0 w-full">
                        <div className="w-full overflow-x-auto p-4">
                          <Table className="min-w-[980px]">
                            <TableHeader className="sticky top-0 bg-background z-10">
                              <TableRow>
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
                                  Người tạo
                                </TableHead>
                                <TableHead className="h-10 text-sm font-bold">
                                  Ngày tạo
                                </TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {loadingOrders ? (
                                <TableSkeleton
                                  cols={7}
                                  rows={10}
                                  rowHeight="h-14"
                                />
                              ) : ordersError ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="py-10">
                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                      <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                                      <p className="text-sm font-semibold text-foreground">
                                        Không thể tải mã bài
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Vui lòng thử lại sau.
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : sortedOrders.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="py-10">
                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                      <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                                      <p className="text-sm font-semibold text-muted-foreground">
                                        {designCode.trim().length > 0
                                          ? "Không tìm thấy mã bài phù hợp"
                                          : "Chưa có mã bài nào"}
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                sortedOrders.map((order) => (
                                  <TableRow
                                    key={order.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                      navigate(`/proofing/${order.id}`)
                                    }
                                  >
                                    <TableCell className="py-3 font-semibold">
                                      {order.code}
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
                                          order.status === "completed"
                                            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                            : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
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
                                      {order.createdBy?.fullName || "—"}
                                    </TableCell>
                                    <TableCell className="py-3 font-semibold">
                                      {order.createdAt
                                        ? new Date(
                                            order.createdAt
                                          ).toLocaleDateString("vi-VN")
                                        : "—"}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </ScrollArea>
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
                                        Tên thiết kế
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
                                    {(availableDesignsData?.designs ?? []).map(
                                      (design) => {
                                        const isSelected = selectedIds.has(
                                          design.id
                                        );
                                        const selectable = canSelect(design);

                                        return (
                                          <TableRow
                                            key={design.id}
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
                                            <TableCell className="py-3 max-w-[360px]">
                                              <div
                                                className="truncate"
                                                title={design.name}
                                              >
                                                {design.name}
                                              </div>
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
                                        );
                                      }
                                    )}
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
