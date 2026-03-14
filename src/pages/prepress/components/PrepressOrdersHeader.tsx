import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FilterSection } from "@/components/proofing/FilterSection";
import type { FilterOption } from "@/types/proofing";

interface PrepressOrdersHeaderProps {
  designCode: string;
  setDesignCode: (code: string) => void;
  setOrdersPage: (page: number) => void;
  selectedMaterialTypeId: number | null;
  setSelectedMaterialTypeId: (id: number | null) => void;
  materialTypeOptionsForOrders: { id: number; name: string }[];
  // FilterSection props
  designTypeOptions: FilterOption[];
  materialTypeOptions: FilterOption[];
  selectedDesignTypes: number[];
  selectedMaterialTypes: number[];
  currentMaterialTypeId: number | null;
  searchTerm: string;
  onDesignTypeChange: (ids: number[]) => void;
  onMaterialTypeChange: (ids: number[]) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function PrepressOrdersHeader({
  designCode,
  setDesignCode,
  setOrdersPage,
  selectedMaterialTypeId,
  setSelectedMaterialTypeId,
  materialTypeOptionsForOrders,
  designTypeOptions,
  materialTypeOptions,
  selectedDesignTypes,
  selectedMaterialTypes,
  currentMaterialTypeId,
  searchTerm,
  onDesignTypeChange,
  onMaterialTypeChange,
  onSearchChange,
  onClearFilters,
}: PrepressOrdersHeaderProps) {
  const [materialTypeSearchOpen, setMaterialTypeSearchOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <div className="absolute -top-4 right-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-t shadow-sm z-10 font-mono pointer-events-none opacity-70">
        PrepressOrdersHeader.tsx
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hàng..."
            className="h-9 pl-10"
            value={designCode}
            onChange={(e) => {
              setDesignCode(e.target.value);
              setOrdersPage(1);
            }}
          />
        </div>
        <Popover
          open={materialTypeSearchOpen}
          onOpenChange={setMaterialTypeSearchOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="h-9 w-[200px] justify-between"
            >
              {selectedMaterialTypeId
                ? materialTypeOptionsForOrders.find(
                    (mt) => mt.id === selectedMaterialTypeId
                  )?.name || "Loại chất liệu"
                : "Loại chất liệu"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Tìm kiếm loại chất liệu..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy loại chất liệu</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedMaterialTypeId(null);
                      setMaterialTypeSearchOpen(false);
                      setOrdersPage(1);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedMaterialTypeId === null
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    Tất cả loại chất liệu
                  </CommandItem>
                  {materialTypeOptionsForOrders.map((mt) => (
                    <CommandItem
                      key={mt.id}
                      value={mt.name}
                      onSelect={() => {
                        setSelectedMaterialTypeId(mt.id);
                        setMaterialTypeSearchOpen(false);
                        setOrdersPage(1);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMaterialTypeId === mt.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {mt.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {(selectedMaterialTypeId || designCode.trim()) && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => {
              setDesignCode("");
              setSelectedMaterialTypeId(null);
              setOrdersPage(1);
            }}
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* FilterSection */}
      <FilterSection
        designTypeOptions={designTypeOptions}
        materialTypeOptions={materialTypeOptions}
        selectedDesignTypes={selectedDesignTypes}
        selectedMaterialTypes={selectedMaterialTypes}
        currentMaterialTypeId={currentMaterialTypeId}
        searchTerm={searchTerm}
        onDesignTypeChange={onDesignTypeChange}
        onMaterialTypeChange={onMaterialTypeChange}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}
