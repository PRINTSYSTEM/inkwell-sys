import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, SlidersHorizontal, Calendar as CalendarIcon, X, ChevronDown, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface ProductionListFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  dateFilterType?: string;
  onDateFilterTypeChange?: (value: string) => void;
  customFromDate?: string;
  onCustomFromDateChange?: (value: string) => void;
  customToDate?: string;
  onCustomToDateChange?: (value: string) => void;
  selectedDesignTypeId?: string | number | null;
  onDesignTypeChange?: (value: string) => void;
  designTypes?: any[];
  deliverySlaFilter?: string;
  onDeliverySlaFilterChange?: (value: string) => void;
  productMaterialFilter?: string;
  onProductMaterialChange?: (value: string) => void;
  assigneeFilter?: string;
  onAssigneeChange?: (value: string) => void;
  onResetFilters?: () => void;
  onOpenDelayReport?: () => void;
}

const FALLBACK_FLOW_OPTIONS = [
  { id: 1, code: "F01", name: "Hộp thường" },
  { id: 2, code: "F02", name: "Hộp metalize" },
  { id: 3, code: "F03", name: "Hộp duplex bồi sóng" },
  { id: 4, code: "F04", name: "Hộp metalize bồi sóng" },
  { id: 5, code: "F05", name: "Nhãn giấy" },
  { id: 6, code: "F06", name: "Folder (Bìa kẹp file)" },
  { id: 7, code: "F07", name: "Nhãn metalize" },
  { id: 8, code: "F08", name: "Decal giấy tờ" },
  { id: 9, code: "F09", name: "Decal metalize tờ" },
  { id: 10, code: "F10", name: "Túi PE/PA" },
  { id: 11, code: "F11", name: "Túi Metalize" },
  { id: 12, code: "F12", name: "Túi PE/PA xếp hông" },
  { id: 13, code: "F13", name: "Túi Metalize xếp hông" },
  { id: 14, code: "F14", name: "Túi PE/PA zipper" },
  { id: 15, code: "F15", name: "Túi cuộn PE/PA/Metalize" },
  { id: 16, code: "F16", name: "Túi cuộn zipper" },
  { id: 17, code: "F17", name: "Decal cuộn thường" },
  { id: 18, code: "F18", name: "Decal cuộn metalize" },
  { id: 19, code: "F19", name: "Túi giấy" },
];

export function ProductionListFilter({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  dateFilterType = "all",
  onDateFilterTypeChange,
  customFromDate = "",
  onCustomFromDateChange,
  customToDate = "",
  onCustomToDateChange,
  selectedDesignTypeId = "all",
  onDesignTypeChange,
  designTypes = [],
  deliverySlaFilter = "ALL",
  onDeliverySlaFilterChange,
  onResetFilters,
  onOpenDelayReport,
}: ProductionListFilterProps) {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Format active date label
  const getDateLabel = () => {
    if (dateFilterType === "today") return "Hôm nay";
    if (dateFilterType === "yesterday") return "Hôm qua";
    if (dateFilterType === "7-days" || dateFilterType === "week") return "7 ngày qua";
    if (dateFilterType === "month") return "Tháng này";
    if (dateFilterType === "last_month") return "Tháng trước";
    if (dateFilterType === "custom" || customFromDate) {
      if (customFromDate && customToDate && customFromDate !== customToDate) {
        const [fY, fM, fD] = customFromDate.split("-");
        const [tY, tM, tD] = customToDate.split("-");
        return `${fD}/${fM} - ${tD}/${tM}`;
      }
      if (customFromDate) {
        const [fY, fM, fD] = customFromDate.split("-");
        return `Ngày ${fD}/${fM}/${fY}`;
      }
      return "Khoảng ngày";
    }
    return "Tất cả ngày";
  };

  const isDateFiltered = dateFilterType !== "all" || Boolean(customFromDate);

  const availableDesignTypes = designTypes && designTypes.length > 0 ? designTypes : FALLBACK_FLOW_OPTIONS;

  return (
    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
      {/* 1. Search input */}
      <div className="relative min-w-[200px] sm:min-w-[230px] flex-1 lg:flex-initial">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm mã lệnh, sản phẩm..."
          className="pl-8 pr-7 h-8 text-xs bg-card border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 2. Trạng thái sản xuất */}
      <div className="w-[140px]">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 text-xs bg-card border-slate-200 font-medium">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
            <SelectItem value="in_production" className="text-xs">🔵 Đang SX</SelectItem>
            <SelectItem value="pending_material" className="text-xs">⚪ Chưa xuất NVL</SelectItem>
            <SelectItem value="warning" className="text-xs">🟡 Sắp quá hạn</SelectItem>
            <SelectItem value="overdue" className="text-xs">🔴 Quá hạn</SelectItem>
            <SelectItem value="completed" className="text-xs">🟢 Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 2b. Tình trạng giao hàng (Delivery SLA Status) */}
      <div className="w-[150px]">
        <Select value={deliverySlaFilter} onValueChange={onDeliverySlaFilterChange}>
          <SelectTrigger className="h-8 text-xs bg-card border-slate-200 font-medium">
            <SelectValue placeholder="Tình trạng giao hàng" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="ALL" className="text-xs font-semibold">Tất cả SLA</SelectItem>
            <SelectItem value="NORMAL" className="text-xs">🟢 Kịp tiến độ</SelectItem>
            <SelectItem value="WARNING" className="text-xs">🟡 Sắp đến hạn</SelectItem>
            <SelectItem value="OVERDUE" className="text-xs">🔴 Quá hạn</SelectItem>
            <SelectItem value="ON_TIME" className="text-xs">✅ Đúng hạn</SelectItem>
            <SelectItem value="COMPLETED_LATE" className="text-xs">🔴 Trễ hạn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Loại thiết kế (F01 - F19) */}
      <div className="w-[155px]">
        <Select
          value={String(selectedDesignTypeId ?? "all")}
          onValueChange={onDesignTypeChange}
        >
          <SelectTrigger className="h-8 text-xs bg-card border-slate-200 font-medium">
            <SelectValue placeholder="Loại sản phẩm" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto z-[100]">
            <SelectItem value="all" className="text-xs font-semibold">Tất cả loại sản phẩm</SelectItem>
            {availableDesignTypes.map((dt: any) => {
              const idVal = String(dt.id ?? dt.designTypeId ?? "");
              const label = dt.code ? `${dt.code} - ${dt.name}` : dt.name;
              return (
                <SelectItem key={idVal} value={idVal} className="text-xs">
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Bộ chọn Ngày chuyên nghiệp (Professional Date Selector Popover) */}
      <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs font-medium gap-1.5 px-2.5 cursor-pointer transition-colors border-slate-200",
              isDateFiltered
                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold"
                : "bg-card text-slate-700 hover:bg-slate-50"
            )}
          >
            <CalendarIcon className={cn("h-3.5 w-3.5", isDateFiltered ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
            <span>{getDateLabel()}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-3.5 space-y-3 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 z-[100]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Mốc thời gian nhanh</span>
              {isDateFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    onDateFilterTypeChange?.("all");
                    onCustomFromDateChange?.("");
                    onCustomToDateChange?.("");
                  }}
                  className="text-rose-500 hover:underline text-[10px] lowercase font-normal"
                >
                  Xóa lọc ngày
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Tất cả", value: "all" },
                { label: "Hôm nay", value: "today" },
                { label: "Hôm qua", value: "yesterday" },
                { label: "7 ngày qua", value: "7-days" },
                { label: "Tháng này", value: "month" },
                { label: "Tháng trước", value: "last_month" },
              ].map((preset) => {
                const isSelected = dateFilterType === preset.value && !customFromDate;
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => {
                      onDateFilterTypeChange?.(preset.value);
                      onCustomFromDateChange?.("");
                      onCustomToDateChange?.("");
                      setIsDatePopoverOpen(false);
                    }}
                    className={cn(
                      "h-7 text-xs font-normal border-slate-200",
                      isSelected
                        ? "bg-slate-800 text-white font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chọn ngày cụ thể hoặc khoảng ngày
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 mb-1 block font-medium">Từ ngày / Chọn 1 ngày:</span>
                <DatePicker
                  value={customFromDate}
                  onChange={(val) => {
                    onCustomFromDateChange?.(val);
                    onDateFilterTypeChange?.("custom");
                  }}
                  placeholder="dd/mm/yyyy"
                  className="h-7 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 mb-1 block font-medium">Đến ngày (Tùy chọn):</span>
                <DatePicker
                  value={customToDate}
                  onChange={(val) => {
                    onCustomToDateChange?.(val);
                    onDateFilterTypeChange?.("custom");
                  }}
                  placeholder="dd/mm/yyyy"
                  className="h-7 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
                />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 italic leading-snug">
              💡 Để tìm ngày 01/09: Nhập <b>01/09/2026</b> vào ô "Từ ngày" (hoặc chọn trên lịch).
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCustomFromDateChange?.("");
                  onCustomToDateChange?.("");
                  onDateFilterTypeChange?.("all");
                  setIsDatePopoverOpen(false);
                }}
                className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Đặt lại
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (customFromDate) {
                    onDateFilterTypeChange?.("custom");
                  }
                  setIsDatePopoverOpen(false);
                }}
                className="h-7 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Action buttons */}
      {onResetFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="h-8 text-xs font-bold gap-1 bg-card text-slate-600 hover:bg-slate-100 px-2 cursor-pointer border-slate-200"
          title="Đặt lại tất cả bộ lọc"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Đặt lại</span>
        </Button>
      )}

      {onOpenDelayReport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDelayReport}
          className="h-8 text-xs font-bold gap-1 text-red-600 bg-red-50 hover:bg-red-100 border-red-200 px-2.5 cursor-pointer"
          title="Xem báo cáo trễ tiến độ"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Báo cáo trễ</span>
        </Button>
      )}
    </div>
  );
}

