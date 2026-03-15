import { ChevronLeft, ChevronRight, Check, ChevronsUpDown, Search, X } from "lucide-react";
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
  searchTerm: string;
  onDesignTypeChange: (ids: number[]) => void;
  onMaterialTypeChange: (ids: number[]) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
  // DesignTable props
  designs: DesignItem[];
  selectedIds: Set<number>;
  canSelect: (design: DesignItem) => boolean;
  onToggle: (design: DesignItem) => void;
  isLoadingDesigns?: boolean;

  // New props for split orders
  hasActiveFilters: boolean;
  incompleteOrders: any[];
  completedOrders: any[];
  loadingIncomplete: boolean;
  loadingCompleted: boolean;
  incompletePage: number;
  setIncompletePage: (page: number) => void;
  completedPage: number;
  setCompletedPage: (page: number) => void;
  incompleteTotalPages: number;
  completedTotalPages: number;
  incompleteOrdersPageInput: string;
  setIncompleteOrdersPageInput: (val: string) => void;
  handleIncompletePageInputBlur: () => void;
  completedOrdersPageInput: string;
  setCompletedOrdersPageInput: (val: string) => void;
  handleCompletedPageInputBlur: () => void;
  incompleteTotalCount: number;
  completedTotalCount: number;
  itemsPerPage: number;
  shouldShowExpand: boolean;
  expandedOrderIds: Set<number>;
  searchTermLower: string;
  debouncedDesignCode: string;
  onNavigate: (id: number) => void;
  ordersTableRef: React.RefObject<HTMLDivElement>;
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
  searchTerm,
  onDesignTypeChange,
  onMaterialTypeChange,
  onSearchChange,
  onClearFilters,
  designs,
  selectedIds,
  canSelect,
  onToggle,
  isLoadingDesigns,
  // New props
  hasActiveFilters,
  incompleteOrders,
  completedOrders,
  loadingIncomplete,
  loadingCompleted,
  incompletePage,
  setIncompletePage,
  completedPage,
  setCompletedPage,
  incompleteTotalPages,
  completedTotalPages,
  incompleteOrdersPageInput,
  setIncompleteOrdersPageInput,
  handleIncompletePageInputBlur,
  completedOrdersPageInput,
  setCompletedOrdersPageInput,
  handleCompletedPageInputBlur,
  incompleteTotalCount,
  completedTotalCount,
  itemsPerPage,
  shouldShowExpand,
  expandedOrderIds,
  searchTermLower,
  debouncedDesignCode,
  onNavigate,
  ordersTableRef,
}: PrepressOrdersHeaderProps) {
  const [materialTypeSearchOpen, setMaterialTypeSearchOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hàng..."
            className="h-9 pl-10"
            value={designCode}
            onChange={(e) => {
              setDesignCode(e.target.value);
              setIncompletePage(1);
              setCompletedPage(1);
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
                <CommandEmpty>Không tìm thấy loại chất liệu</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedMaterialTypeId(null);
                      setMaterialTypeSearchOpen(false);
                      setIncompletePage(1);
                      setCompletedPage(1);
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
                        setIncompletePage(1);
                        setCompletedPage(1);
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
              setIncompletePage(1);
              setCompletedPage(1);
            }}
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* FilterSection */}
      <FilterSection
        designTypeOptions={designTypeOptions}
        materialTypeOptions={materialTypeOptions}
        selectedDesignTypes={selectedDesignTypes}
        selectedMaterialTypes={selectedMaterialTypes}
        currentMaterialTypeId={currentMaterialTypeId}
        searchTerm={searchTerm}
        onDesignTypeChange={onDesignTypeChange}
        onMaterialTypeChange={onMaterialTypeChange}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
      />

      {/* DesignTable - shown when filters are active */}
      {hasActiveFilters && (
        <div className="mt-4">
          {isLoadingDesigns ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Đang tải thiết kế...</div>
          ) : designs.length > 0 ? (
            <DesignTable
              designs={designs}
              selectedIds={selectedIds}
              canSelect={canSelect}
              onToggle={onToggle}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy thiết kế nào</div>
          )}
        </div>
      )}

      {/* Split lists shown when filters NOT active */}
      {!hasActiveFilters && (
        <div className="mt-4 space-y-8">
          {/* Incomplete Orders Section */}
          <div className="space-y-4">
            <PrepressOrdersTable
              title="Mã bài chưa hoàn thành"
              count={incompleteTotalCount}
              orders={incompleteOrders}
              loading={loadingIncomplete}
              shouldShowExpand={shouldShowExpand}
              expandedOrderIds={expandedOrderIds}
              searchTermLower={searchTermLower}
              debouncedSearchTerm={debouncedDesignCode}
              onNavigate={onNavigate}
              tableRef={ordersTableRef}
            />
            {incompleteTotalCount > itemsPerPage && (
              <div className="flex items-center justify-between gap-3 bg-background px-1 py-1 border rounded-lg shadow-sm">
                <div className="text-xs text-muted-foreground ml-2">
                  Hiển thị{" "}
                  <span className="font-semibold text-foreground">
                    {(incompletePage - 1) * itemsPerPage + 1}
                  </span>
                  {" - "}
                  <span className="font-semibold text-foreground">
                    {Math.min(incompletePage * itemsPerPage, incompleteTotalCount)}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-foreground">{incompleteTotalCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setIncompletePage(Math.max(1, incompletePage - 1))}
                    disabled={incompletePage === 1 || loadingIncomplete}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={incompleteTotalPages}
                      value={incompleteOrdersPageInput}
                      onChange={(e) => setIncompleteOrdersPageInput(e.target.value)}
                      onBlur={handleIncompletePageInputBlur}
                      className="h-8 w-12 text-center text-xs"
                      disabled={loadingIncomplete}
                    />
                    <span className="text-xs text-muted-foreground">/ {incompleteTotalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setIncompletePage(Math.min(incompleteTotalPages, incompletePage + 1))}
                    disabled={incompletePage >= incompleteTotalPages || loadingIncomplete}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Completed Orders Section */}
          <div className="space-y-4">
            <PrepressOrdersTable
              title="Mã bài đã hoàn thành"
              count={completedTotalCount}
              orders={completedOrders}
              loading={loadingCompleted}
              shouldShowExpand={shouldShowExpand}
              expandedOrderIds={expandedOrderIds}
              searchTermLower={searchTermLower}
              debouncedSearchTerm={debouncedDesignCode}
              onNavigate={onNavigate}
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
                    {Math.min(completedPage * itemsPerPage, completedTotalCount)}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-foreground">{completedTotalCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setCompletedPage(Math.max(1, completedPage - 1))}
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
                      onChange={(e) => setCompletedOrdersPageInput(e.target.value)}
                      onBlur={handleCompletedPageInputBlur}
                      className="h-8 w-12 text-center text-xs"
                      disabled={loadingCompleted}
                    />
                    <span className="text-xs text-muted-foreground">/ {completedTotalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setCompletedPage(Math.min(completedTotalPages, completedPage + 1))}
                    disabled={completedPage >= completedTotalPages || loadingCompleted}
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
