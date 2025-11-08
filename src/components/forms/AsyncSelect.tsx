import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Search, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface AsyncSelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AsyncSelectProps {
  value?: string | number | (string | number)[];
  onValueChange?: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Data loading
  loadOptions: (search?: string) => Promise<AsyncSelectOption[]>;
  loadOnMount?: boolean;
  debounceMs?: number;
  minSearchLength?: number;
  
  // Display options
  showSearch?: boolean;
  showClear?: boolean;
  maxDisplayItems?: number;
  
  // Callbacks
  onSearch?: (search: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export const AsyncSelect: React.FC<AsyncSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả",
  loadingMessage = "Đang tải...",
  errorMessage = "Có lỗi xảy ra",
  multiple = false,
  disabled = false,
  className,
  
  loadOptions,
  loadOnMount = true,
  debounceMs = 300,
  minSearchLength = 0,
  
  showSearch = true,
  showClear = true,
  maxDisplayItems = 5,
  
  onSearch,
  onOpen,
  onClose
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AsyncSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const selectedValues = multiple 
    ? (Array.isArray(value) ? value : value !== undefined ? [value] : [])
    : (value !== undefined ? [value] : []);

  const selectedOptions = options.filter(option => 
    selectedValues.includes(option.value)
  );

  const loadOptionsWithSearch = useCallback(async (search?: string) => {
    if (search !== undefined && search.length < minSearchLength) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newOptions = await loadOptions(search);
      setOptions(newOptions);
    } catch (err) {
      setError(errorMessage);
      console.error('AsyncSelect loadOptions error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadOptions, minSearchLength, errorMessage]);

  // Load initial options
  useEffect(() => {
    if (loadOnMount) {
      loadOptionsWithSearch();
    }
  }, [loadOnMount, loadOptionsWithSearch]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (searchTerm.length >= minSearchLength || searchTerm === "") {
        loadOptionsWithSearch(searchTerm);
        onSearch?.(searchTerm);
      }
    }, debounceMs);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm, debounceMs, minSearchLength, loadOptionsWithSearch, onSearch, searchTimeout]);

  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onValueChange?.(newValues);
    } else {
      onValueChange?.(optionValue);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onValueChange?.(multiple ? [] : "");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      onOpen?.();
    } else {
      onClose?.();
      setSearchTerm("");
    }
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (!multiple) {
      return selectedOptions[0]?.label || placeholder;
    }

    if (selectedOptions.length === 1) {
      return selectedOptions[0].label;
    }

    if (selectedOptions.length <= maxDisplayItems) {
      return selectedOptions.map(option => option.label).join(", ");
    }

    return `${selectedOptions.slice(0, maxDisplayItems - 1).map(option => option.label).join(", ")} và ${selectedOptions.length - (maxDisplayItems - 1)} mục khác`;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            selectedOptions.length === 0 && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{getDisplayText()}</span>
          <div className="flex items-center space-x-1">
            {selectedOptions.length > 0 && showClear && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                ×
              </Button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          {showSearch && (
            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>
          )}
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">{loadingMessage}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-4">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {!loading && !error && options.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}

            {!loading && !error && options.length > 0 && (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value.toString()}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div>{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

