import type { FilterOption } from "@/types/proofing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSectionProps {
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
}

export function FilterSection({
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
}: FilterSectionProps) {
  const hasActiveFilters =
    selectedDesignTypes.length > 0 ||
    selectedMaterialTypes.length > 0 ||
    searchTerm.trim().length > 0;

  const toggleDesignType = (id: number) => {
    // Only allow selecting 1 design type at a time
    if (selectedDesignTypes.includes(id)) {
      // If clicking the same design type, deselect it
      onDesignTypeChange([]);
    } else {
      // Replace with the new selection (only 1 at a time)
      onDesignTypeChange([id]);
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
        {/* Design Type Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Loại thiết kế:
          </span>
          {designTypeOptions.map((option) => {
            const isSelected =
              selectedDesignTypes.length === 1 &&
              selectedDesignTypes[0] === option.id;
            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => toggleDesignType(option.id)}
              >
                {option.name}
              </Button>
            );
          })}
        </div>

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

        {/* Search by Code */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hàng..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>
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
          {searchTerm.trim().length > 0 && (
            <Badge variant="outline" className="gap-1 pr-1">
              Mã: {searchTerm}
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
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
