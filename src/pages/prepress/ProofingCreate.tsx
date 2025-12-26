import { useState, useMemo, useEffect } from "react";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { DesignItem, ViewFilter, SortOption, ViewMode } from "@/types/proofing";
import { useProofingSelection } from "@/hooks/useProofingSelection";
import { DesignCard } from "@/components/proofing/DesignCard";
import { DesignTable } from "@/components/proofing/DesignTable";
import { DesignCardSkeleton } from "@/components/proofing/DesignCardSkeleton";
import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";
import { CreateProofingOrderModal } from "@/components/proofing/CreateProofingOrderModal";
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
import { LayoutGrid, List, Plus, FolderTree, FileText } from "lucide-react";
import { useAvailableOrderDetailsForProofing } from "@/hooks";
import {
  useCreateProofingOrderFromDesigns,
  usePaperSizes,
} from "@/hooks/use-proofing-order";

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48];

export default function ProofingOrderPage() {
  // Selection state
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [groupByOrder, setGroupByOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [designsWithQuantity, setDesignsWithQuantity] = useState<DesignItem[]>([]);
  const [loadingQuantities, setLoadingQuantities] = useState(false);

  // API call with smart filtering
  const { data, isLoading } = useAvailableOrderDetailsForProofing({
    materialTypeId: currentMaterialTypeId,
  });

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

  // Get current material type name for banner
  const currentMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !data) return "";
    const material = data.materialTypeOptions.find(
      (m) => m.id === currentMaterialTypeId
    );
    return material?.name || "";
  }, [currentMaterialTypeId, data]);

  // Apply client-side filters and sorting
  const filteredAndSortedDesigns = useMemo(() => {
    if (!data) return [];

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

  // Pagination
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
  };

  // Hooks for modal
  const { data: paperSizes } = usePaperSizes();
  const { mutate: createProofingOrder, loading: isCreating } = useCreateProofingOrderFromDesigns();

  const handleCreateOrderSuccess = () => {
    clearSelection();
    setDesignsWithQuantity([]);
  };

  const handleSubmitProofingOrder = async (data: Parameters<typeof createProofingOrder>[0]) => {
    await createProofingOrder(data);
  };

  const handleOpenModal = async () => {
    if (selectedDesigns.length === 0) return;
    
    setLoadingQuantities(true);

    // Fetch available quantities for all selected designs in parallel
    try {
      const results = await Promise.allSettled(
        selectedDesigns.map(async (design) => {
          const designId = design.designId;
          if (!designId) {
            return { ...design, availableQuantity: undefined };
          }
          try {
            const res = await apiRequest.get<number>(
              API_SUFFIX.PROOFING_AVAILABLE_QUANTITY(designId)
            );
            return {
              ...design,
              availableQuantity:
                typeof res.data === "number" ? res.data : undefined,
            };
          } catch {
            return { ...design, availableQuantity: undefined };
          }
        })
      );

      const designs = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        // Fallback to original design if fetch failed
        return selectedDesigns[index] || selectedDesigns[0];
      });

      setDesignsWithQuantity(designs);
      // Open modal after fetching quantities
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch available quantities:", error);
      // Fallback to original designs if all fetches fail
      setDesignsWithQuantity(selectedDesigns);
      setIsModalOpen(true);
    } finally {
      setLoadingQuantities(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Thiết kế Chờ Bình Bài</h1>
          <p className="text-muted-foreground">
            Tổng cộng {data?.totalCount || 0} thiết kế
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selection Counter */}
          {selectedDesigns.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {selectedDesigns.length} đã chọn
            </Badge>
          )}

          {/* Toggle View */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Group by Order Toggle */}
          <Button
            variant={groupByOrder ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupByOrder(!groupByOrder)}
            className="gap-2"
          >
            <FolderTree className="h-4 w-4" />
            {groupByOrder ? "Bỏ nhóm" : "Nhóm theo đơn"}
          </Button>

          {/* Create Order Button */}
          <Button
            onClick={handleOpenModal}
            disabled={selectedDesigns.length === 0 || loadingQuantities}
            className="gap-2"
          >
            {loadingQuantities ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Tạo Lệnh Bình Bài
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Section */}
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

      {/* Filter Notice Banner */}
      {currentMaterialTypeId && currentMaterialTypeName && (
        <FilterNoticeBanner
          materialTypeName={currentMaterialTypeName}
          onClear={handleClearSelection}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <DesignCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedDesigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            Không có thiết kế nào phù hợp.
          </p>
        </div>
      ) : groupByOrder && groupedByOrder ? (
        <div className="space-y-6">
          {groupedByOrder.map((group) => (
            <div key={group.orderCode} className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{group.orderCode}</p>
                  {(group.customerName || group.customerCompanyName) && (
                    <p className="text-sm text-muted-foreground">
                      {group.customerCompanyName || group.customerName}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {group.designs.length} thiết kế
                </Badge>
              </div>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {group.designs.map((design) => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      isSelected={isSelected(design.id)}
                      canSelect={canSelect(design)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
              ) : (
                <DesignTable
                  designs={group.designs}
                  selectedIds={selectedIds}
                  canSelect={canSelect}
                  onToggle={toggleSelection}
                />
              )}
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {paginatedDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              isSelected={isSelected(design.id)}
              canSelect={canSelect(design)}
              onToggle={toggleSelection}
            />
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

      {/* Pagination */}
      {filteredAndSortedDesigns.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
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
              })}
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

      {/* Create Order Modal */}
      <CreateProofingOrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedDesigns={designsWithQuantity.length > 0 ? designsWithQuantity : selectedDesigns}
        paperSizes={paperSizes}
        onSubmit={handleSubmitProofingOrder}
        isSubmitting={isCreating}
        onSuccess={handleCreateOrderSuccess}
      />
    </div>
  );
}
