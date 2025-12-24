import { FilterOption, ViewFilter, SortOption } from '@/types/proofing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, X } from 'lucide-react';

interface FilterSectionProps {
  designTypeOptions: FilterOption[];
  materialTypeOptions: FilterOption[];
  selectedDesignTypes: number[];
  selectedMaterialTypes: number[];
  currentMaterialTypeId: number | null;
  viewFilter: ViewFilter;
  sortOption: SortOption;
  onDesignTypeChange: (ids: number[]) => void;
  onMaterialTypeChange: (ids: number[]) => void;
  onViewFilterChange: (filter: ViewFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
}

export function FilterSection({
  designTypeOptions,
  materialTypeOptions,
  selectedDesignTypes,
  selectedMaterialTypes,
  currentMaterialTypeId,
  viewFilter,
  sortOption,
  onDesignTypeChange,
  onMaterialTypeChange,
  onViewFilterChange,
  onSortChange,
  onClearFilters,
}: FilterSectionProps) {
  const hasActiveFilters =
    selectedDesignTypes.length > 0 || selectedMaterialTypes.length > 0;

  const toggleDesignType = (id: number) => {
    if (selectedDesignTypes.includes(id)) {
      onDesignTypeChange(selectedDesignTypes.filter((t) => t !== id));
    } else {
      onDesignTypeChange([...selectedDesignTypes, id]);
    }
  };

  const toggleMaterialType = (id: number) => {
    if (currentMaterialTypeId) return; // Disabled when design is selected
    if (selectedMaterialTypes.includes(id)) {
      onMaterialTypeChange(selectedMaterialTypes.filter((t) => t !== id));
    } else {
      onMaterialTypeChange([...selectedMaterialTypes, id]);
    }
  };

  // Auto-sync material type with selected design's materialTypeId
  const effectiveMaterialTypes = currentMaterialTypeId
    ? [currentMaterialTypeId]
    : selectedMaterialTypes;

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Design Type Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Loại Thiết Kế
              {selectedDesignTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedDesignTypes.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover">
            {designTypeOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={selectedDesignTypes.includes(option.id)}
                onCheckedChange={() => toggleDesignType(option.id)}
              >
                {option.name}
                <Badge variant="secondary" className="ml-auto">
                  {option.count}
                </Badge>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Material Type Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              disabled={!!currentMaterialTypeId}
            >
              Vật liệu
              {effectiveMaterialTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {effectiveMaterialTypes.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-popover">
            {materialTypeOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={effectiveMaterialTypes.includes(option.id)}
                onCheckedChange={() => toggleMaterialType(option.id)}
                disabled={!!currentMaterialTypeId}
              >
                {option.name}
                <Badge variant="secondary" className="ml-auto">
                  {option.count}
                </Badge>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Filter Tabs */}
        <Tabs
          value={viewFilter}
          onValueChange={(v) => onViewFilterChange(v as ViewFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="selected">Đã chọn</TabsTrigger>
            <TabsTrigger value="unselected">Chưa chọn</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort Dropdown */}
        <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="code-asc">Mã (A-Z)</SelectItem>
            <SelectItem value="code-desc">Mã (Z-A)</SelectItem>
            <SelectItem value="name-asc">Tên (A-Z)</SelectItem>
            <SelectItem value="name-desc">Tên (Z-A)</SelectItem>
            <SelectItem value="quantity-desc">SL (Cao → Thấp)</SelectItem>
            <SelectItem value="quantity-asc">SL (Thấp → Cao)</SelectItem>
            <SelectItem value="date-desc">Mới nhất</SelectItem>
            <SelectItem value="date-asc">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedDesignTypes.map((id) => {
            const option = designTypeOptions.find((o) => o.id === id);
            return option ? (
              <Badge
                key={`dt-${id}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {option.name}
                <button
                  onClick={() => toggleDesignType(id)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
          {!currentMaterialTypeId &&
            selectedMaterialTypes.map((id) => {
              const option = materialTypeOptions.find((o) => o.id === id);
              return option ? (
                <Badge
                  key={`mt-${id}`}
                  variant="outline"
                  className="gap-1 pr-1"
                >
                  {option.name}
                  <button
                    onClick={() => toggleMaterialType(id)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            Xóa tất cả
          </Button>
        </div>
      )}
    </div>
  );
}
