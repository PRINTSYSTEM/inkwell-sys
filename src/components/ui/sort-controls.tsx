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
  columnSelectWidth?: string;
  orderSelectWidth?: string;
};

export function SortControls({
  sortColumn,
  sortOrder,
  onSortColumnChange,
  onSortOrderChange,
  onClear,
  options,
  placeholder = "Sắp xếp theo",
  className,
  columnSelectWidth = "sm:w-[130px]",
  orderSelectWidth = "sm:w-[95px]",
}: SortControlsProps) {
  const normalizedSortColumn = sortColumn.trim();
  const canClear = !!onClear && normalizedSortColumn.length > 0;
  const columnSelectValue = normalizedSortColumn.length > 0 ? normalizedSortColumn : "__none__";
  const orderDisabled = normalizedSortColumn.length === 0;

  return (
    <div
      className={`flex items-center gap-1.5 w-auto flex-nowrap ${className ?? ""}`}
    >
      <Select
        value={columnSelectValue}
        onValueChange={(v) => onSortColumnChange(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className={`h-9 w-full ${columnSelectWidth} shrink-0 text-sm`}>
          <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
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
        <SelectTrigger className={`h-9 w-full ${orderSelectWidth} shrink-0 text-sm`}>
          <SelectValue placeholder="Thứ tự" />
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
          className="h-9 w-9 px-0 shrink-0"
          onClick={onClear}
          title="Xóa sắp xếp"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

