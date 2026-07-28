import {
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FilterSection } from "@/components/proofing/FilterSection";
import { DesignTable } from "@/components/proofing/DesignTable";
import { PrepressOrdersTable } from "./PrepressOrdersTable";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { DateRange } from "react-day-picker";
import type { FilterOption, DesignItem } from "@/types/proofing";

interface PrepressOrdersHeaderProps {
  designCode: string;
  setDesignCode: (code: string) => void;
  selectedMaterialTypeId: number | null;
  setSelectedMaterialTypeId: (id: number | null) => void;
  materialTypeOptionsForOrders: { id: number; name: string }[];
  // FilterSection props
  designTypeOptions: FilterOption[];
  materialTypeOptions: FilterOption[];
  selectedDesignTypes: number[];
  selectedMaterialTypes: number[];
  currentMaterialTypeId: number | null;
  onDesignTypeChange: (ids: number[]) => void;
  onMaterialTypeChange: (ids: number[]) => void;
  onClearFilters: () => void;
  // DesignTable props for search results
  designs: DesignItem[];
  selectedIds: Set<number>;
  canSelect: (design: DesignItem) => boolean;
  onToggle: (design: DesignItem) => void;
  isLoadingDesigns?: boolean;

  // Actions for shared DesignTable
  onReject?: (design: DesignItem) => void;
  isRejecting?: boolean;
  onFindDie?: (design: DesignItem, dimensions: string) => void;

  // New props for split orders
  hasActiveFilters: boolean;
  incompleteOrders: any[];
  completedOrders: any[];
  productionReturnedOrders: any[];
  loadingIncomplete: boolean;
  loadingCompleted: boolean;
  loadingProductionReturned: boolean;
  incompletePage: number;
  setIncompletePage: (page: number) => void;
  completedPage: number;
  setCompletedPage: (page: number) => void;
  productionReturnedPage: number;
  setProductionReturnedPage: (page: number) => void;
  incompleteTotalPages: number;
  completedTotalPages: number;
  productionReturnedTotalPages: number;
  incompleteOrdersPageInput: string;
  setIncompleteOrdersPageInput: (val: string) => void;
  handleIncompletePageInputBlur: () => void;
  completedOrdersPageInput: string;
  setCompletedOrdersPageInput: (val: string) => void;
  handleCompletedPageInputBlur: () => void;
  productionReturnedOrdersPageInput: string;
  setProductionReturnedOrdersPageInput: (val: string) => void;
  handleProductionReturnedPageInputBlur: () => void;
  incompleteTotalCount: number;
  completedTotalCount: number;
  productionReturnedTotalCount: number;
  itemsPerPage: number;
  searchTermLower: string;
  debouncedDesignCode: string;
  onNavigate: (id: number) => void;
  ordersTableRef: React.RefObject<HTMLDivElement>;

  // Pagination for designs
  designsPage?: number;
  setDesignsPage?: (page: number) => void;
  designsTotalPages?: number;
  designsPageInput?: string;
  setDesignsPageInput?: (val: string) => void;
  handleDesignsPageInputBlur?: () => void;
  designsTotalCount?: number;
  designsPageSize?: number;
  expandedOrderIds?: Set<number>;
  isConfiguring?: boolean;
  selectedDesigns?: any[];
  shouldShowExpand?: boolean;
  isSelectionEnabled?: boolean;
  selectedCount?: number;
  onAddToExistingClick?: () => void;
  completedDateRange?: DateRange;
  setCompletedDateRange: (range: DateRange | undefined) => void;
  onlyCompleted?: boolean;
}

export function PrepressOrdersHeader({
  designCode,
  setDesignCode,
  selectedMaterialTypeId,
  setSelectedMaterialTypeId,
  materialTypeOptionsForOrders,
  designTypeOptions,
  materialTypeOptions,
  selectedDesignTypes,
  selectedMaterialTypes,
  currentMaterialTypeId,
  onDesignTypeChange,
  onMaterialTypeChange,
  onClearFilters,
  onNavigate,
  ordersTableRef,
  designs,
  selectedIds,
  canSelect,
  onToggle,
  isLoadingDesigns,
  // New props
  hasActiveFilters,
  incompleteOrders,
  completedOrders,
  productionReturnedOrders,
  loadingIncomplete,
  loadingCompleted,
  loadingProductionReturned,
  incompletePage,
  setIncompletePage,
  completedPage,
  setCompletedPage,
  productionReturnedPage,
  setProductionReturnedPage,
  incompleteTotalPages,
  completedTotalPages,
  productionReturnedTotalPages,
  incompleteOrdersPageInput,
  setIncompleteOrdersPageInput,
  handleIncompletePageInputBlur,
  completedOrdersPageInput,
  setCompletedOrdersPageInput,
  handleCompletedPageInputBlur,
  productionReturnedOrdersPageInput,
  setProductionReturnedOrdersPageInput,
  handleProductionReturnedPageInputBlur,
  incompleteTotalCount,
  completedTotalCount,
  productionReturnedTotalCount,
  itemsPerPage,
  searchTermLower,
  debouncedDesignCode,
  // Pagination for designs
  designsPage = 1,
  setDesignsPage,
  designsTotalPages = 1,
  designsPageInput = "1",
  setDesignsPageInput,
  handleDesignsPageInputBlur,
  designsTotalCount = 0,
  designsPageSize = 20,
  // Actions
  onReject,
  isRejecting,
  onFindDie,
  shouldShowExpand = false,
  expandedOrderIds = new Set(),
  isSelectionEnabled = true,
  isConfiguring = false,
  selectedDesigns = [],
  selectedCount = 0,
  onAddToExistingClick,
  completedDateRange,
  setCompletedDateRange,
  onlyCompleted = false,
}: PrepressOrdersHeaderProps) {
  const [materialTypeSearchOpen, setMaterialTypeSearchOpen] = useState(false);

  const isSearchActiveAndEmpty =
    !onlyCompleted &&
    !loadingIncomplete &&
    !loadingCompleted &&
    !loadingProductionReturned &&
    debouncedDesignCode.trim() !== "" &&
    incompleteTotalCount === 0 &&
    completedTotalCount === 0 &&
    productionReturnedTotalCount === 0;

  return (
    <div className="relative shrink-0">
      {/* FilterSection */}
      {!onlyCompleted && (
        <FilterSection
          designTypeOptions={designTypeOptions}
          materialTypeOptions={materialTypeOptions}
          selectedDesignTypes={selectedDesignTypes}
          selectedMaterialTypes={selectedMaterialTypes}
          currentMaterialTypeId={currentMaterialTypeId}
          onDesignTypeChange={onDesignTypeChange}
          onMaterialTypeChange={onMaterialTypeChange}
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
          isConfiguring={isConfiguring}
          selectedCount={selectedCount}
          onAddToExistingClick={onAddToExistingClick}
        />
      )}

      {/* DesignTable - shown when filters are active or search matches no orders */}
      {(hasActiveFilters || isSearchActiveAndEmpty) && (
        <div className="mt-4 space-y-4">
          {isSearchActiveAndEmpty && (
            <div className="rounded-lg border border-[#f5c2c2] bg-[#fdf2f2] p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              Không tìm thấy mã bài (lệnh bình) nào khớp. Đang tìm và hiển thị các thiết kế chờ bình bài khớp mã hàng <strong>"{debouncedDesignCode}"</strong>:
            </div>
          )}
          {isLoadingDesigns ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Đang tải thiết kế...
            </div>
          ) : designs.length > 0 ? (
            <>
              <DesignTable
                designs={designs}
                selectedIds={selectedIds}
                selectedDesigns={selectedDesigns}
                canSelect={canSelect}
                onToggle={onToggle}
                onReject={onReject}
                isRejecting={isRejecting}
                onFindDie={onFindDie}
                isSelectionEnabled={isSelectionEnabled}
                searchTerm={designCode}
                isConfiguring={isConfiguring}
              />
              {/* Designs Pagination */}
              {designsTotalCount > designsPageSize &&
                setDesignsPage &&
                setDesignsPageInput && (
                  <div className="flex items-center justify-between gap-3 bg-background px-1 py-1 border rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground ml-2">
                      Hiển thị{" "}
                      <span className="font-semibold text-foreground">
                        {(designsPage - 1) * designsPageSize + 1}
                      </span>
                      {" - "}
                      <span className="font-semibold text-foreground">
                        {Math.min(
                          designsPage * designsPageSize,
                          designsTotalCount,
                        )}
                      </span>{" "}
                      /{" "}
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
                          setDesignsPage(Math.max(1, designsPage - 1))
                        }
                        disabled={designsPage === 1 || isLoadingDesigns}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={designsTotalPages}
                          value={designsPageInput}
                          onChange={(e) => setDesignsPageInput(e.target.value)}
                          onBlur={handleDesignsPageInputBlur}
                          className="h-8 w-12 text-center text-xs"
                          disabled={isLoadingDesigns}
                        />
                        <span className="text-xs text-muted-foreground">
                          / {designsTotalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          setDesignsPage(
                            Math.min(designsTotalPages, designsPage + 1),
                          )
                        }
                        disabled={
                          designsPage >= designsTotalPages || isLoadingDesigns
                        }
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Không tìm thấy thiết kế nào khớp mã hàng <strong>"{debouncedDesignCode}"</strong> trong danh sách chờ bình bài.
            </div>
          )}
        </div>
      )}

      {/* Split lists shown when filters NOT active and search not empty/unmatched */}
      {!hasActiveFilters && !isSearchActiveAndEmpty && (
        <div className="mt-4 space-y-8">
          {/* Production Returned Orders Section */}
          {!onlyCompleted && productionReturnedTotalCount > 0 && (
            <div className="space-y-4">
              <PrepressOrdersTable
                title="Bình bài sản xuất trả về"
                count={productionReturnedTotalCount}
                orders={productionReturnedOrders}
                loading={loadingProductionReturned}
                shouldShowExpand={false}
                expandedOrderIds={new Set()}
                searchTermLower={searchTermLower}
                debouncedSearchTerm={debouncedDesignCode}
                onNavigate={onNavigate}
              />
              {productionReturnedTotalCount > itemsPerPage && (
                <div className="flex items-center justify-between gap-3 bg-background px-1 py-1 border rounded-lg shadow-sm">
                  <div className="text-xs text-muted-foreground ml-2">
                    Hiển thị{" "}
                    <span className="font-semibold text-foreground">
                      {(productionReturnedPage - 1) * itemsPerPage + 1}
                    </span>
                    {" - "}
                    <span className="font-semibold text-foreground">
                      {Math.min(
                        productionReturnedPage * itemsPerPage,
                        productionReturnedTotalCount,
                      )}
                    </span>{" "}
                    /{" "}
                    <span className="font-semibold text-foreground">
                      {productionReturnedTotalCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setProductionReturnedPage(Math.max(1, productionReturnedPage - 1))
                      }
                      disabled={productionReturnedPage === 1 || loadingProductionReturned}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={productionReturnedTotalPages}
                        value={productionReturnedOrdersPageInput}
                        onChange={(e) =>
                          setProductionReturnedOrdersPageInput(e.target.value)
                        }
                        onBlur={handleProductionReturnedPageInputBlur}
                        className="h-8 w-12 text-center text-xs"
                        disabled={loadingProductionReturned}
                      />
                      <span className="text-xs text-muted-foreground">
                        / {productionReturnedTotalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setProductionReturnedPage(
                          Math.min(productionReturnedTotalPages, productionReturnedPage + 1),
                        )
                      }
                      disabled={
                        productionReturnedPage >= productionReturnedTotalPages ||
                        loadingProductionReturned
                      }
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Incomplete Orders Section */}
          {!onlyCompleted && (
            <div className="space-y-4">
              <PrepressOrdersTable
              title="Bình bài chờ xử lý"
              count={incompleteTotalCount}
              orders={incompleteOrders}
              loading={loadingIncomplete}
              shouldShowExpand={false}
              expandedOrderIds={new Set()}
              searchTermLower={searchTermLower}
              debouncedSearchTerm={debouncedDesignCode}
              onNavigate={onNavigate}
              showAllDesignsByDefault={true}
            />

            </div>
          )}

          {/* Completed Orders Section */}
          <div className="space-y-4">
            <PrepressOrdersTable
              title="Bình bài đã hoàn tất"
              count={completedTotalCount}
              orders={completedOrders}
              loading={loadingCompleted}
              shouldShowExpand={false}
              expandedOrderIds={new Set()}
              searchTermLower={searchTermLower}
              debouncedSearchTerm={debouncedDesignCode}
              onNavigate={onNavigate}
              headerActions={
                <DateRangePicker
                  value={completedDateRange}
                  onValueChange={(range) => {
                    setCompletedDateRange(range);
                    setCompletedPage(1);
                  }}
                  placeholder="Lọc theo ngày hoàn thành"
                  showClear
                  className="h-8 text-xs w-[240px] bg-background border border-input"
                />
              }
            />
            {completedTotalCount > itemsPerPage && (
              <div className="flex items-center justify-between gap-3 bg-background px-1 py-1 border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground ml-2">
                  Hiển thị{" "}
                  <span className="font-semibold text-foreground">
                    {(completedPage - 1) * itemsPerPage + 1}
                  </span>
                  {" - "}
                  <span className="font-semibold text-foreground">
                    {Math.min(
                      completedPage * itemsPerPage,
                      completedTotalCount,
                    )}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-foreground">
                    {completedTotalCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      setCompletedPage(Math.max(1, completedPage - 1))
                    }
                    disabled={completedPage === 1 || loadingCompleted}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={completedTotalPages}
                      value={completedOrdersPageInput}
                      onChange={(e) =>
                        setCompletedOrdersPageInput(e.target.value)
                      }
                      onBlur={handleCompletedPageInputBlur}
                      className="h-8 w-12 text-center text-xs"
                      disabled={loadingCompleted}
                    />
                    <span className="text-xs text-muted-foreground">
                      / {completedTotalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      setCompletedPage(
                        Math.min(completedTotalPages, completedPage + 1),
                      )
                    }
                    disabled={
                      completedPage >= completedTotalPages || loadingCompleted
                    }
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
