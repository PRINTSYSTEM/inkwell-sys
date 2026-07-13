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
  onDesignTypeChange: (ids: number[]) => void;
  onMaterialTypeChange: (ids: number[]) => void;
  onClearFilters: () => void;
  hasActiveFilters?: boolean;
  isConfiguring?: boolean;
  selectedCount?: number;
  onAddToExistingClick?: () => void;
}

export function FilterSection({
  designTypeOptions,
  materialTypeOptions,
  selectedDesignTypes,
  selectedMaterialTypes,
  currentMaterialTypeId,
  onDesignTypeChange,
  onMaterialTypeChange,
  onClearFilters,
  hasActiveFilters = false,
  isConfiguring = false,
  selectedCount = 0,
  onAddToExistingClick,
}: FilterSectionProps) {
  const isAnyFilterActive =
    selectedDesignTypes.length > 0 ||
    selectedMaterialTypes.length > 0 ||
    selectedCount > 0;

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
    <div className="space-y-4 relative">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Design Type Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {designTypeOptions.map((option) => {
            const isSelected =
              selectedDesignTypes.length === 1 &&
              selectedDesignTypes[0] === option.id;
            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  isConfiguring ? "h-7 px-2 text-[11px]" : "h-8 text-xs",
                )}
                onClick={() => toggleDesignType(option.id)}
              >
                <span className="truncate">{option.name}</span>
                <Badge
                  variant={option.count > 0 ? "secondary" : "outline"}
                  className={cn(
                    isConfiguring ? "ml-1 h-4 px-1 text-[9px]" : "ml-2 h-5 px-1.5 text-[10px]",
                    isSelected && "bg-background/20 text-primary-foreground",
                  )}
                >
                  {option.count}
                </Badge>
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
              Chất liệu
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

        {/* Clear all filters button - big green button with red border */}
        {isAnyFilterActive && (
          <Button
            size="sm"
            onClick={onClearFilters}
            className={cn(
              "bg-green-600 text-white hover:bg-green-700 border-2 border-red-500 font-extrabold shadow-md transition-all active:scale-95",
              isConfiguring ? "h-8 text-[12px] px-3.5" : "h-10 text-sm px-5"
            )}
          >
            Xóa tất cả
          </Button>
        )}

        {selectedCount > 0 && !isConfiguring && (
          <Button
            size="sm"
            onClick={onAddToExistingClick}
            className={cn(
              "bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95",
              isConfiguring ? "h-8 text-[12px] px-3.5" : "h-10 text-sm px-5"
            )}
          >
            Thêm vào bài có sẵn
          </Button>
        )}
      </div>
    </div>
  );
}
