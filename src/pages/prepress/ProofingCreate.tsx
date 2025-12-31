import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { DesignItem, ViewFilter, SortOption } from "@/types/proofing";
import { useProofingSelection } from "@/hooks/useProofingSelection";
import { DesignTable } from "@/components/proofing/DesignTable";
import { DesignCardSkeleton } from "@/components/proofing/DesignCardSkeleton";
import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  List,
  FolderTree,
  FileText,
  Loader2,
  Hash,
  Maximize2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import {
  useAvailableOrderDetailsForProofing,
  usePaperSizes,
  useCreateProofingOrderFromDesigns,
} from "@/hooks/use-proofing-order";
import { ROUTE_PATHS } from "@/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48];

export default function ProofingOrderPage() {
  const navigate = useNavigate();

  // Selection state (left list)
  const {
    selectedDesigns,
    selectedIds,
    currentMaterialTypeId,
    toggleSelection,
    clearSelection,
    isSelected,
    canSelect,
  } = useProofingSelection();

  // Filter states
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<number[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>(
    []
  );
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  // View states
  const [groupByOrder, setGroupByOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Inline proofing order configuration state (right panel)
  const [notes, setNotes] = useState("");
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState<number>(1);
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [paperSizeId, setPaperSizeId] = useState<string>("none");
  const [customPaperSize, setCustomPaperSize] = useState("");

  // API call with smart filtering
  const { data, isLoading } = useAvailableOrderDetailsForProofing({
    materialTypeId: currentMaterialTypeId,
  });

  // Paper sizes + create hook
  const { data: paperSizes } = usePaperSizes();
  const { mutate: createProofingOrder, loading: isCreating } =
    useCreateProofingOrderFromDesigns();

  // Debug: Log when materialTypeId changes
  useEffect(() => {
    console.log("🎯 ProofingCreate - Material Type Changed:", {
      currentMaterialTypeId,
      selectedDesignsCount: selectedDesigns.length,
    });
  }, [currentMaterialTypeId, selectedDesigns.length]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    currentMaterialTypeId,
    selectedDesignTypes,
    selectedMaterialTypes,
    viewFilter,
  ]);

  // Sync default quantities when selection changes (default = lấy hết)
  useEffect(() => {
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
  }, [selectedDesigns]);

  // Get current material type name for banner
  const currentMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !data) return "";
    const material = data.materialTypeOptions.find(
      (m) => m.id === currentMaterialTypeId
    );
    return material?.name || "";
  }, [currentMaterialTypeId, data]);

  const materialTypeName =
    selectedDesigns.length > 0 ? selectedDesigns[0].materialTypeName : "";

  // Apply client-side filters and sorting (left list)
  const filteredAndSortedDesigns = useMemo(() => {
    if (!data) {
      console.log("⚠️ ProofingCreate - No data available");
      return [];
    }

    if (!data.designs) {
      console.warn("⚠️ ProofingCreate - data.designs is undefined:", data);
      return [];
    }

    let result = [...data.designs];

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

    // Filter by view (selected/unselected)
    if (viewFilter === "selected") {
      result = result.filter((d) => selectedIds.has(d.id));
    } else if (viewFilter === "unselected") {
      result = result.filter((d) => !selectedIds.has(d.id));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "code-asc":
          return a.code.localeCompare(b.code);
        case "code-desc":
          return b.code.localeCompare(a.code);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "quantity-desc":
          return b.quantity - a.quantity;
        case "quantity-asc":
          return a.quantity - b.quantity;
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [
    data,
    selectedDesignTypes,
    selectedMaterialTypes,
    currentMaterialTypeId,
    viewFilter,
    sortOption,
    selectedIds,
  ]);

  // Group by order if enabled
  const groupedByOrder = useMemo(() => {
    if (!groupByOrder) return null;

    const groups = new Map<string, DesignItem[]>();
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
  const totalPages = Math.ceil(filteredAndSortedDesigns.length / itemsPerPage);
  const paginatedDesigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDesigns.slice(start, start + itemsPerPage);
  }, [filteredAndSortedDesigns, currentPage, itemsPerPage]);

  const handleClearFilters = () => {
    setSelectedDesignTypes([]);
    setSelectedMaterialTypes([]);
  };

  const handleClearSelection = () => {
    clearSelection();
    setDesignQuantities({});
  };

  // ===== Inline proofing order logic (right panel) =====
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

  const handleSubmitProofingOrder = async () => {
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

      const orderDetailItems = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const quantity = Number.isInteger(qty)
            ? qty
            : Math.floor(qty as number);
          if (quantity <= 0) {
            throw new Error("Số lượng phải lớn hơn 0");
          }
          return {
            orderDetailId: parseInt(id, 10),
            quantity: quantity as number,
          };
        });

      if (orderDetailItems.length === 0) {
        toast.error("Lỗi", {
          description:
            "Vui lòng nhập số lượng lấy cho ít nhất một thiết kế (lớn hơn 0)",
        });
        return;
      }

      const payload = {
        orderDetailItems,
        totalQuantity: proofingSheetQuantity,
        notes: notes?.trim() || undefined,
        paperSizeId:
          paperSizeId === "none" || paperSizeId === "custom"
            ? undefined
            : Number(paperSizeId),
        customPaperSize:
          paperSizeId === "custom" && customPaperSize?.trim()
            ? customPaperSize.trim()
            : undefined,
      };

      const result = await createProofingOrder(payload);

      // On success: reset and chuyển ngay sang màn chi tiết lệnh bình bài
      clearSelection();
      setDesignQuantities({});
      setNotes("");
      setProofingSheetQuantity(1);
      setPaperSizeId("none");
      setCustomPaperSize("");

      if (result && (result as any).id) {
        navigate(`${ROUTE_PATHS.PROOFING.ROOT}/${(result as any).id}`);
      } else {
        navigate(ROUTE_PATHS.PROOFING.ROOT);
      }
    } catch (error) {
      console.error("Failed to create proofing order:", error);
    }
  };

  return (
    <div className="h-[calc(100vh-var(--header-height,64px))] w-full max-w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b bg-card/50 backdrop-blur-sm">
        <div className="px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Thiết kế chờ bình bài</h1>
            <p className="text-xs text-muted-foreground">
              Tổng cộng {data?.totalCount || 0} thiết kế •{" "}
              {selectedDesigns.length} đã chọn
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedDesigns.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1 text-xs">
                {selectedDesigns.length} thiết kế đã chọn
              </Badge>
            )}

            {/* Toggle View */}
            {/* View mode removed: always use table view */}

            {/* Group by Order Toggle */}
            <Button
              variant={groupByOrder ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByOrder(!groupByOrder)}
              className="gap-2 h-8"
            >
              <FolderTree className="h-4 w-4" />
              <span className="hidden md:inline">
                {groupByOrder ? "Bỏ nhóm" : "Nhóm theo đơn"}
              </span>
            </Button>

            {/* Create Proofing Order Button (global CTA) */}
            <Button
              onClick={handleSubmitProofingOrder}
              disabled={
                selectedDesigns.length === 0 ||
                !hasValidQuantities ||
                proofingSheetQuantity < 1 ||
                isCreating
              }
              className="gap-2 h-9 min-w-[160px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Tạo lệnh bình bài
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* BODY: 2 COLUMNS */}
      <div className="flex-1 flex min-h-0 w-full max-w-full overflow-hidden">
        {/* LEFT: DESIGN LIST + FILTERS */}
        <div className="basis-1/2 min-w-0 border-r flex flex-col min-h-0 bg-card/30">
          <div className="p-4 border-b">
            <FilterSection
              designTypeOptions={data?.designTypeOptions || []}
              materialTypeOptions={data?.materialTypeOptions || []}
              selectedDesignTypes={selectedDesignTypes}
              selectedMaterialTypes={selectedMaterialTypes}
              currentMaterialTypeId={currentMaterialTypeId}
              viewFilter={viewFilter}
              sortOption={sortOption}
              onDesignTypeChange={setSelectedDesignTypes}
              onMaterialTypeChange={setSelectedMaterialTypes}
              onViewFilterChange={setViewFilter}
              onSortChange={setSortOption}
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

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span>Đang tải danh sách thiết kế...</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <DesignCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : paginatedDesigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                  Không có thiết kế nào phù hợp.
                </div>
              ) : groupByOrder && groupedByOrder ? (
                <div className="space-y-6">
                  {groupedByOrder.map((group) => (
                    <div key={group.orderCode} className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold text-sm">
                            {group.orderCode}
                          </p>
                          {(group.customerName ||
                            group.customerCompanyName) && (
                            <p className="text-xs text-muted-foreground">
                              {group.customerCompanyName || group.customerName}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-auto text-xs">
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
          </ScrollArea>

          {/* Pagination (left list) */}
          {filteredAndSortedDesigns.length > 0 && (
            <div className="shrink-0 border-t px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAndSortedDesigns.length
                  )}{" "}
                  của {filteredAndSortedDesigns.length} thiết kế
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map(
                    (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === pageNum}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* RIGHT: INLINE PROOFING ORDER CONFIG */}
        <div className="basis-1/2 min-w-0 flex flex-col min-h-0">
          {/* Right header */}
          <div className="shrink-0 border-b bg-card/50 px-4 py-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Lệnh bình bài mới</p>
              <p className="text-xs text-muted-foreground">
                {selectedDesigns.length > 0
                  ? `${selectedDesigns.length} thiết kế • ${selectedCount} đã nhập số lượng`
                  : "Chọn thiết kế ở cột bên trái để thêm vào lệnh"}
              </p>
            </div>
            {materialTypeName && (
              <Badge variant="secondary" className="text-xs">
                {materialTypeName}
              </Badge>
            )}
          </div>

          {selectedDesigns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-sm text-muted-foreground">
              Chưa có thiết kế nào được chọn.
              <br />
              Hãy click chọn thiết kế ở cột bên trái, hệ thống sẽ tự động thêm
              vào bảng bên phải.
            </div>
          ) : (
            <div className="flex-1 flex min-h-0">
              {/* Left: Designs table with quantities */}
              <div className="flex-1 overflow-hidden border-r">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 z-10">
                      <TableRow>
                        <TableHead className="w-10 text-center text-xs">
                          #
                        </TableHead>
                        <TableHead className="min-w-[200px] text-xs">
                          Thiết kế
                        </TableHead>
                        <TableHead className="w-20 text-right text-xs">
                          Đặt hàng
                        </TableHead>
                        <TableHead className="w-24 text-right text-xs">
                          Còn lại
                        </TableHead>
                        <TableHead className="w-40 text-xs">
                          Số lượng lấy
                        </TableHead>
                        <TableHead className="w-24 text-right text-xs">
                          Sau khi lấy
                        </TableHead>
                        <TableHead className="w-12 text-center text-xs">
                          Trạng thái
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

                        const isValid = currentQty > 0 && currentQty <= maxQty;
                        const isExceeded = currentQty > maxQty;
                        const hasAvailableQuantity =
                          design.availableQuantity !== undefined;

                        return (
                          <TableRow
                            key={design.id}
                            className={cn(
                              "hover:bg-muted/30",
                              isValid && "bg-emerald-50/40",
                              isExceeded && "bg-destructive/5"
                            )}
                          >
                            <TableCell className="text-center text-xs text-muted-foreground font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {design.name}
                                </div>
                                <code className="text-[11px] text-muted-foreground font-mono">
                                  {design.code}
                                </code>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-medium">
                                {design.quantity.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {hasAvailableQuantity ? (
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    design.availableQuantity! > 0
                                      ? "text-emerald-600"
                                      : design.availableQuantity! === 0
                                        ? "text-amber-600"
                                        : "text-destructive"
                                  )}
                                >
                                  {design.availableQuantity!.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">
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
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                  /{maxQty.toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  remainingQty > 0
                                    ? "text-blue-600"
                                    : remainingQty === 0 && currentQty > 0
                                      ? "text-amber-600"
                                      : "text-muted-foreground"
                                )}
                              >
                                {remainingQty.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {isExceeded ? (
                                <span className="text-[11px] text-destructive font-medium">
                                  Quá
                                </span>
                              ) : isValid ? (
                                <span className="text-[11px] text-emerald-600 font-medium">
                                  OK
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  -
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Right: Config panel */}
              <div className="w-[360px] flex flex-col border-l bg-muted/20 shrink-0">
                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {/* Proofing Sheet Quantity */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="proofingSheetQuantity"
                          className="text-sm font-medium"
                        >
                          Số lượng giấy in
                          <span className="text-destructive"> *</span>
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="proofingSheetQuantity"
                            type="number"
                            min="1"
                            max="2147483647"
                            step="1"
                            className="pl-9 h-10 font-semibold"
                            placeholder="Nhập Số lượng giấy in"
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
                        <p className="text-[11px] text-muted-foreground">
                          Số lượng giấy in được in ra (không phải tổng số lượng
                          thiết kế).
                        </p>
                      </div>

                      {/* Paper Size */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="paperSizeId"
                          className="text-sm font-medium"
                        >
                          Khổ giấy in
                        </Label>
                        <Select
                          value={paperSizeId}
                          onValueChange={setPaperSizeId}
                        >
                          <SelectTrigger id="paperSizeId" className="h-10">
                            <Maximize2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Chọn khổ giấy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Chưa xác định</SelectItem>
                            {paperSizes?.map((ps) => (
                              <SelectItem key={ps.id} value={ps.id.toString()}>
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
                      {paperSizeId === "custom" ? (
                        <div className="space-y-2">
                          <Label
                            htmlFor="customPaperSize"
                            className="text-sm font-medium"
                          >
                            Khổ giấy tùy chỉnh
                          </Label>
                          <Input
                            id="customPaperSize"
                            className="h-10"
                            placeholder="Ví dụ: 31×43, 65×86..."
                            value={customPaperSize}
                            onChange={(e) => setCustomPaperSize(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Kích thước
                          </Label>
                          <div className="h-10 flex items-center px-3 rounded-md border bg-background text-sm text-muted-foreground">
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

                    {/* Notes */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Ghi chú
                      </h3>
                      <Textarea
                        id="notes"
                        className="min-h-[100px] resize-none"
                        placeholder="Nhập ghi chú cho lệnh bình bài này (tùy chọn)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer summary */}
                <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div>
                    {selectedCount > 0 && (
                      <span>
                        {selectedCount}/{selectedDesigns.length} thiết kế đã
                        nhập số lượng • Tổng lấy{" "}
                        {totalSelectedQuantity.toLocaleString()} sp
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {!hasValidQuantities && (
                      <div>
                        Vui lòng nhập số lượng &gt; 0 cho ít nhất 1 thiết kế.
                      </div>
                    )}
                    {proofingSheetQuantity < 1 && (
                      <div>Số lượng giấy in phải &gt;= 1.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
