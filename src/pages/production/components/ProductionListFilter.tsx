import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductionListFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  dateFilterType?: string;
  onDateFilterTypeChange?: (value: string) => void;
  selectedDesignTypeId?: string | number | null;
  onDesignTypeChange?: (value: string) => void;
  productMaterialFilter?: string;
  onProductMaterialChange?: (value: string) => void;
  assigneeFilter?: string;
  onAssigneeChange?: (value: string) => void;
  onResetFilters?: () => void;
  sortColumn?: string;
  sortOrder?: any;
  onSortColumnChange?: (value: string) => void;
  onSortOrderChange?: (value: any) => void;
  onClearSort?: () => void;
  onOpenDelayReport?: () => void;
}

export function ProductionListFilter({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  dateFilterType = "all",
  onDateFilterTypeChange,
  selectedDesignTypeId = "all",
  onDesignTypeChange,
  productMaterialFilter = "all",
  onProductMaterialChange,
  assigneeFilter = "all",
  onAssigneeChange,
  onResetFilters,
}: ProductionListFilterProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 w-full items-center bg-card p-2.5 rounded-xl border shadow-2xs">
      {/* 1. Search input */}
      <div className="relative col-span-1 lg:col-span-1">
        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Tìm kiếm</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Mã lệnh, khách hàng, sản phẩm..."
            className="pl-8 h-8 text-xs bg-background border-slate-200"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Ngày lên bài */}
      <div className="col-span-1">
        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Ngày lên bài</label>
        <Select value={dateFilterType} onValueChange={onDateFilterTypeChange}>
          <SelectTrigger className="h-8 text-xs bg-background border-slate-200">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tất cả ngày</SelectItem>
            <SelectItem value="today" className="text-xs">Hôm nay</SelectItem>
            <SelectItem value="yesterday" className="text-xs">Hôm qua</SelectItem>
            <SelectItem value="week" className="text-xs">Tuần này</SelectItem>
            <SelectItem value="month" className="text-xs">Tháng này</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Trạng thái */}
      <div className="col-span-1">
        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Trạng thái</label>
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 text-xs bg-background border-slate-200">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
            <SelectItem value="in_production" className="text-xs">🔵 Đang SX</SelectItem>
            <SelectItem value="pending_material" className="text-xs">⚪ Chưa xuất NVL</SelectItem>
            <SelectItem value="warning" className="text-xs">🟡 Sắp quá hạn</SelectItem>
            <SelectItem value="overdue" className="text-xs">🔴 Quá hạn</SelectItem>
            <SelectItem value="completed" className="text-xs">🟢 Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4. Loại thiết kế (F01 - F19) */}
      <div className="col-span-1">
        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Loại thiết kế (F01 - F19)</label>
        <Select
          value={String(selectedDesignTypeId || "all")}
          onValueChange={onDesignTypeChange}
        >
          <SelectTrigger className="h-8 text-xs bg-background border-slate-200">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="all" className="text-xs">Tất cả Flow (F01 - F19)</SelectItem>
            <SelectItem value="F01" className="text-xs">F01 - Hộp thường</SelectItem>
            <SelectItem value="F02" className="text-xs">F02 - Hộp metalize</SelectItem>
            <SelectItem value="F03" className="text-xs">F03 - Hộp duplex bồi sóng</SelectItem>
            <SelectItem value="F04" className="text-xs">F04 - Hộp metalize bồi sóng</SelectItem>
            <SelectItem value="F05" className="text-xs">F05 - Nhãn giấy</SelectItem>
            <SelectItem value="F06" className="text-xs">F06 - Folder (Bìa kẹp file)</SelectItem>
            <SelectItem value="F07" className="text-xs">F07 - Nhãn metalize</SelectItem>
            <SelectItem value="F08" className="text-xs">F08 - Decal giấy tờ</SelectItem>
            <SelectItem value="F09" className="text-xs">F09 - Decal metalize tờ</SelectItem>
            <SelectItem value="F10" className="text-xs">F10 - Túi PE/PA</SelectItem>
            <SelectItem value="F11" className="text-xs">F11 - Túi Metalize</SelectItem>
            <SelectItem value="F12" className="text-xs">F12 - Túi PE/PA xếp hông</SelectItem>
            <SelectItem value="F13" className="text-xs">F13 - Túi Metalize xếp hông</SelectItem>
            <SelectItem value="F14" className="text-xs">F14 - Túi PE/PA zipper</SelectItem>
            <SelectItem value="F15" className="text-xs">F15 - Túi cuộn PE/PA/Metalize</SelectItem>
            <SelectItem value="F16" className="text-xs">F16 - Túi cuộn zipper</SelectItem>
            <SelectItem value="F17" className="text-xs">F17 - Decal cuộn thường</SelectItem>
            <SelectItem value="F18" className="text-xs">F18 - Decal cuộn metalize</SelectItem>
            <SelectItem value="F19" className="text-xs">F19 - Túi giấy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 5. Sản phẩm / Chất liệu */}
      <div className="col-span-1">
        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Sản phẩm / Chất liệu</label>
        <Select value={productMaterialFilter} onValueChange={onProductMaterialChange}>
          <SelectTrigger className="h-8 text-xs bg-background border-slate-200">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tất cả chất liệu</SelectItem>
            <SelectItem value="box" className="text-xs">Hộp giấy / Duplex / Ivory</SelectItem>
            <SelectItem value="label" className="text-xs">Nhãn Couche / Metalize</SelectItem>
            <SelectItem value="bag" className="text-xs">Túi PE / PA / Kraft</SelectItem>
            <SelectItem value="decal" className="text-xs">Decal cuộn / tờ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 6. Người phụ trách */}
      <div className="col-span-1">
        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Người phụ trách</label>
        <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
          <SelectTrigger className="h-8 text-xs bg-background border-slate-200">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tất cả nhân sự</SelectItem>
            <SelectItem value="admin" className="text-xs">Quản trị hệ thống</SelectItem>
            <SelectItem value="lead1" className="text-xs">Trưởng ca In</SelectItem>
            <SelectItem value="lead2" className="text-xs">Trưởng ca Thành phẩm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 7. Action buttons */}
      <div className="col-span-1 flex items-end gap-1.5 pt-4">
        <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 bg-card flex-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
          <span>Bộ lọc khác</span>
        </Button>

        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-8 text-xs font-bold gap-1 bg-card text-slate-600 hover:bg-slate-100 px-2.5"
            title="Đặt lại tất cả bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </Button>
        )}
      </div>
    </div>
  );
}
