import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";

interface PrepressDesignFilterProps {
  hasActiveFilters: boolean;
  designTypeOptions: any[];
  materialTypeOptions: any[];
  selectedDesignTypes: number[];
  selectedMaterialTypes: number[];
  currentMaterialTypeId: number | null;
  searchTerm: string;
  onDesignTypeChange: (types: number[]) => void;
  onMaterialTypeChange: (types: number[]) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
  onClearSelection: () => void;
}

export function PrepressDesignFilter({
  hasActiveFilters,
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
  onClearSelection,
}: PrepressDesignFilterProps) {
  return (
    <Card className="relative shrink-0">
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
                onClick={onClearFilters}
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
            onDesignTypeChange={onDesignTypeChange}
            onMaterialTypeChange={onMaterialTypeChange}
            onSearchChange={onSearchChange}
            onClearFilters={onClearFilters}
          />

          {currentMaterialTypeId && (
            <FilterNoticeBanner
              materialTypeName={
                materialTypeOptions.find(
                  (m) => m.id === currentMaterialTypeId
                )?.name || ""
              }
              onClear={onClearSelection}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
