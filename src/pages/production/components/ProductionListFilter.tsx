import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortControls, type SortOrder } from "@/components/ui/sort-controls";

interface ProductionListFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  sortColumn: string;
  sortOrder: SortOrder;
  onSortColumnChange: (value: string) => void;
  onSortOrderChange: (value: SortOrder) => void;
  onClearSort: () => void;
  onOpenDelayReport?: () => void;
}

export function ProductionListFilter({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  sortColumn,
  sortOrder,
  onSortColumnChange,
  onSortOrderChange,
  onClearSort,
  onOpenDelayReport,
}: ProductionListFilterProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-1 min-w-0 w-full justify-end">
      <div className="relative min-w-0 w-full lg:max-w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm theo ID, người phụ trách, thiết kế..."
          className="pl-9 h-9 text-xs bg-background border border-input focus-visible:ring-1"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-row items-center gap-1.5 w-full lg:w-auto">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full lg:w-36 h-9 text-xs bg-background border border-input">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tất cả</SelectItem>
            <SelectItem value="waiting_for_production" className="text-xs">
              Chưa thực hiện
            </SelectItem>
            <SelectItem value="in_production" className="text-xs">Đang thực hiện</SelectItem>
            <SelectItem value="completed" className="text-xs">Đã hoàn thành</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-full lg:w-auto min-w-0">
          <SortControls
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSortColumnChange={onSortColumnChange}
            onSortOrderChange={onSortOrderChange}
            onClear={onClearSort}
            options={[
              { value: "createdAt", label: "Ngày tạo" },
              { value: "startedAt", label: "Ngày bắt đầu" },
              { value: "completedAt", label: "Ngày hoàn thành" },
              { value: "status", label: "Trạng thái" },
              { value: "progressPercent", label: "Tiến độ (%)" },
              { value: "id", label: "ID" },
            ]}
            placeholder="Sắp xếp theo"
            className="gap-1.5 [&_button]:h-9 [&_select]:h-9"
          />
        </div>

        {onOpenDelayReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDelayReport}
            className="h-9 text-xs font-bold border-amber-400 text-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 shadow-2xs gap-1.5 shrink-0"
          >
            <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Báo cáo trễ</span>
          </Button>
        )}
      </div>
    </div>
  );
}
