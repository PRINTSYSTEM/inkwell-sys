import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string; // Format: "YYYY-MM-DD" or ""
  onChange?: (val: string) => void; // Emits "YYYY-MM-DD" or ""
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  allowClear?: boolean;
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "dd/mm/yyyy",
  className,
  disabled = false,
  align = "start",
  allowClear = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Convert ISO "YYYY-MM-DD" -> "dd/MM/yyyy"
  const dateObj = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  React.useEffect(() => {
    if (value) {
      try {
        const d = new Date(value);
        if (isValid(d)) {
          setInputValue(format(d, "dd/MM/yyyy"));
          return;
        }
      } catch {
        // ignore
      }
    }
    setInputValue("");
  }, [value]);

  // Handle typing input with auto slash formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Allow user to clear
    if (!raw.trim()) {
      setInputValue("");
      onChange?.("");
      return;
    }

    // Filter only numbers and slashes
    const digitsOnly = raw.replace(/\D/g, "");
    let formatted = "";

    if (digitsOnly.length <= 2) {
      formatted = digitsOnly;
    } else if (digitsOnly.length <= 4) {
      formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else {
      formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    }

    setInputValue(formatted);

    // If 8 digits complete (DD/MM/YYYY -> 10 chars)
    if (digitsOnly.length === 8) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed) && format(parsed, "dd/MM/yyyy") === formatted) {
        onChange?.(format(parsed, "yyyy-MM-dd"));
      }
    }
  };

  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      onChange?.("");
      return;
    }

    const parsed = parse(inputValue, "dd/MM/yyyy", new Date());
    if (isValid(parsed) && format(parsed, "dd/MM/yyyy") === inputValue) {
      onChange?.(format(parsed, "yyyy-MM-dd"));
    } else if (value) {
      // Revert to valid value
      try {
        const d = new Date(value);
        if (isValid(d)) {
          setInputValue(format(d, "dd/MM/yyyy"));
          return;
        }
      } catch {
        // ignore
      }
      setInputValue("");
    } else {
      setInputValue("");
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date && isValid(date)) {
      const isoStr = format(date, "yyyy-MM-dd");
      setInputValue(format(date, "dd/MM/yyyy"));
      onChange?.(isoStr);
    } else {
      setInputValue("");
      onChange?.("");
    }
    setOpen(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className={cn(
          "w-full h-full bg-transparent px-2 pr-7 text-xs outline-none focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500",
          disabled && "cursor-not-allowed opacity-50"
        )}
      />

      <div className="absolute right-1 flex items-center gap-0.5">
        {allowClear && inputValue && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue("");
              onChange?.("");
            }}
            className="p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors focus:outline-none"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align={align}
            side="bottom"
            sideOffset={4}
            className="w-auto p-2 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xl rounded-xl z-[100]"
          >
            <Calendar
              mode="single"
              selected={dateObj}
              onSelect={handleSelectDate}
              locale={vi}
              initialFocus
              className="p-1"
            />
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                onClick={() => handleSelectDate(new Date())}
              >
                Hôm nay
              </Button>
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={() => handleSelectDate(undefined)}
                >
                  Xóa
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
