import { useState, useMemo, useEffect } from "react";
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
import { LayoutGrid, List, Plus } from "lucide-react";
import { useAvailableOrderDetailsForProofing } from "@/hooks";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCreateOrderSuccess = () => {
    clearSelection();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Designs Chờ Proofing</h1>
          <p className="text-muted-foreground">
            Tổng cộng {data?.total || 0} designs
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

          {/* Create Order Button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={selectedDesigns.length === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo Proofing Order
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
          <p className="text-muted-foreground">Không có design nào phù hợp.</p>
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
              của {filteredAndSortedDesigns.length} designs
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
        selectedDesigns={selectedDesigns}
        onSuccess={handleCreateOrderSuccess}
      />
    </div>
  );
}
