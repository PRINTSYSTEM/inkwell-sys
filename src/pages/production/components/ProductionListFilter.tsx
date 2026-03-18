import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
}: ProductionListFilterProps) {
  return (
    <div className="mb-4 shrink-0">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo ID hoặc người phụ trách..."
              className="pl-10 h-10 sm:h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9 text-sm bg-muted/50 border-0">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="WaitingForProduction">
                  Chưa thực hiện
                </SelectItem>
                <SelectItem value="InProduction">Đang thực hiện</SelectItem>
                <SelectItem value="Completed">Đã hoàn thành</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-full lg:w-[360px] min-w-0">
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
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
