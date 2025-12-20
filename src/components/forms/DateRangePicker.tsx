import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangePickerProps {
  value?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  numberOfMonths?: number;
  showClear?: boolean;
  showPresets?: boolean;
}

interface DatePreset {
  label: string;
  range: DateRange;
}

const createPresets = (): DatePreset[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 6);

  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 29);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: "Hôm nay", range: { from: today, to: today } },
    { label: "Hôm qua", range: { from: yesterday, to: yesterday } },
    { label: "7 ngày qua", range: { from: last7Days, to: today } },
    { label: "30 ngày qua", range: { from: last30Days, to: today } },
    { label: "Tháng này", range: { from: thisMonthStart, to: today } },
    { label: "Tháng trước", range: { from: lastMonthStart, to: lastMonthEnd } },
  ];
};

export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Chọn ngày",
  disabled = false,
  className,
  numberOfMonths = 2,
  showClear = true,
  showPresets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const presets = createPresets();

  const handlePresetSelect = (preset: DatePreset) => {
    onValueChange?.(preset.range);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(undefined);
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;

    const fromStr = format(value.from, "dd/MM/yyyy", { locale: vi });
    if (!value.to || value.from.getTime() === value.to.getTime()) {
      return fromStr;
    }
    return `${fromStr} - ${format(value.to, "dd/MM/yyyy", { locale: vi })}`;
  };

  const getDayCount = () => {
    if (!value?.from || !value?.to) return null;
    const days =
      Math.ceil(
        (value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    return days;
  };

  const dayCount = getDayCount();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal h-9 bg-muted/50 border-0 hover:bg-muted",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="truncate">{formatDateRange()}</span>
          {dayCount && (
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {dayCount} ngày
            </span>
          )}
          {value?.from && showClear ? (
            <X
              className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-popover border shadow-lg z-50"
        align="start"
        sideOffset={4}
      >
        <div className="flex">
          {/* Presets sidebar */}
          {showPresets && (
            <div className="border-r p-2 space-y-1 w-[10em] bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1.5">
                Lựa chọn nhanh
              </p>
              {presets.map((preset) => {
                const isActive =
                  value?.from?.getTime() === preset.range.from?.getTime() &&
                  value?.to?.getTime() === preset.range.to?.getTime();

                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "w-full text-left text-xs px-1.5 py-1 rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
              {value?.from && (
                <>
                  <div className="border-t my-2" />
                  <button
                    onClick={() => onValueChange?.(undefined)}
                    className="w-full text-left text-xs px-1.5 py-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
                  >
                    <X className="h-3 w-3" />
                    Xóa lựa chọn
                  </button>
                </>
              )}
            </div>
          )}

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onValueChange}
              numberOfMonths={numberOfMonths}
              locale={vi}
              className="pointer-events-auto"
            />
          </div>
        </div>

        {/* Footer with selected info */}
        {value?.from && (
          <div className="border-t px-4 py-2 bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Đã chọn:</span>
              <span className="font-medium">{formatDateRange()}</span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
