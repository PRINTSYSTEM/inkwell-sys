import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface DateRangePickerProps {
  value?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  
  // Calendar props
  numberOfMonths?: number;
  disabledDates?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  
  // Display options
  showClear?: boolean;
  showPresets?: boolean;
  formatStr?: string;
  
  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
}

interface DatePreset {
  label: string;
  range: DateRange;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onValueChange,
  placeholder = "Chọn khoảng thời gian",
  disabled = false,
  className,
  
  numberOfMonths = 2,
  disabledDates,
  minDate,
  maxDate,
  
  showClear = true,
  showPresets = true,
  formatStr = 'dd/MM/yyyy',
  
  onOpen,
  onClose
}) => {
  const [open, setOpen] = useState(false);

  const createPresets = (): DatePreset[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const thisYear = new Date(today.getFullYear(), 0, 1);
    const lastYear = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);

    return [
      {
        label: 'Hôm nay',
        range: { from: today, to: today }
      },
      {
        label: 'Hôm qua',
        range: { from: yesterday, to: yesterday }
      },
      {
        label: '7 ngày qua',
        range: { from: last7Days, to: today }
      },
      {
        label: '30 ngày qua',
        range: { from: last30Days, to: today }
      },
      {
        label: 'Tháng này',
        range: { from: thisMonth, to: today }
      },
      {
        label: 'Tháng trước',
        range: { from: lastMonth, to: lastMonthEnd }
      },
      {
        label: 'Năm này',
        range: { from: thisYear, to: today }
      },
      {
        label: 'Năm trước',
        range: { from: lastYear, to: lastYearEnd }
      }
    ];
  };

  const presets = createPresets();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const handleClear = () => {
    onValueChange?.(undefined);
  };

  const handlePresetSelect = (preset: DatePreset) => {
    onValueChange?.(preset.range);
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      return placeholder;
    }

    if (!range.to) {
      return format(range.from, formatStr, { locale: vi });
    }

    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, formatStr, { locale: vi });
    }

    return `${format(range.from, formatStr, { locale: vi })} - ${format(range.to, formatStr, { locale: vi })}`;
  };

  const isDateDisabled = (date: Date) => {
    if (disabledDates?.(date)) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">
              {formatDateRange(value)}
            </span>
            {value?.from && showClear && (
              <Button
                variant="ghost"
                size="sm" 
                className="h-4 w-4 p-0 hover:bg-transparent ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            {showPresets && (
              <div className="border-r p-3 space-y-1 min-w-[160px]">
                <div className="text-sm font-medium mb-2">Lựa chọn nhanh</div>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                
                {value?.from && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8 text-muted-foreground"
                        onClick={handleClear}
                      >
                        <X className="mr-2 h-3 w-3" />
                        Xóa lựa chọn
                      </Button>
                    </div>
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
                disabled={isDateDisabled}
                locale={vi}
              />
            </div>
          </div>
          
          {/* Selected range display */}
          {value?.from && (
            <div className="border-t p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Đã chọn: </span>
                  <Badge variant="secondary">
                    {formatDateRange(value)}
                  </Badge>
                </div>
                
                {value.from && value.to && (
                  <div className="text-xs text-muted-foreground">
                    {Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} ngày
                  </div>
                )}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};