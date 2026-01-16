import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, X } from "lucide-react";

export type SortOrder = "asc" | "desc";

export type SortOption = { value: string; label: string };

type SortControlsProps = {
  sortColumn: string;
  sortOrder: SortOrder;
  onSortColumnChange: (value: string) => void;
  onSortOrderChange: (value: SortOrder) => void;
  onClear?: () => void;
  options: SortOption[];
  placeholder?: string;
  className?: string;
};

export function SortControls({
  sortColumn,
  sortOrder,
  onSortColumnChange,
  onSortOrderChange,
  onClear,
  options,
  placeholder = "Sort column (vd: createdAt, name...)",
  className,
}: SortControlsProps) {
  const normalizedSortColumn = sortColumn.trim();
  const canClear = !!onClear && normalizedSortColumn.length > 0;
  const columnSelectValue = normalizedSortColumn.length > 0 ? normalizedSortColumn : "__none__";
  const orderDisabled = normalizedSortColumn.length === 0;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0 ${className ?? ""}`}
    >
      <Select
        value={columnSelectValue}
        onValueChange={(v) => onSortColumnChange(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className="h-10 sm:h-9 w-full sm:w-[260px] min-w-0 text-sm">
          <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Không sắp xếp</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sortOrder}
        onValueChange={(v) => onSortOrderChange(v as SortOrder)}
        disabled={orderDisabled}
      >
        <SelectTrigger className="h-10 sm:h-9 w-full sm:w-[140px] min-w-0 text-sm">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Tăng dần</SelectItem>
          <SelectItem value="desc">Giảm dần</SelectItem>
        </SelectContent>
      </Select>

      {canClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 sm:h-9 w-full sm:w-9 sm:px-0 min-h-[44px] sm:min-h-0"
          onClick={onClear}
          title="Xóa sắp xếp"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

