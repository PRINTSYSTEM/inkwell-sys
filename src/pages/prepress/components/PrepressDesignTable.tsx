import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";
import type { DesignItem } from "@/types/proofing";

interface PrepressDesignTableProps {
  designs: DesignItem[];
  isLoading: boolean;
  selectedIds: Set<number>;
  onToggleSelection: (design: DesignItem) => void;
  canSelect: (design: DesignItem) => boolean;
  onReject: (design: DesignItem) => void;
  isRejecting: boolean;
  designsPage: number;
  setDesignsPage: (page: number | ((p: number) => number)) => void;
  designsTotalPages: number;
  selectedDesignsCount: number;
  onOpenInventoryView: () => void;
  onFindDie?: (design: DesignItem) => void;
  setImageViewerOpen?: (val: boolean) => void;
  setViewingImageUrl?: (val: string | null) => void;
  // Filters
  searchTerm?: string;
  setSearchTerm?: (s: string) => void;
  designTypeOptions?: { id: number; name: string; count?: number }[];
  selectedDesignTypes?: number[];
  setSelectedDesignTypes?: (ids: number[]) => void;
  materialTypeOptions?: { id: number; name: string }[];
  selectedMaterialTypes?: number[];
  setSelectedMaterialTypes?: (ids: number[]) => void;
}

export function PrepressDesignTable({
  designs,
  isLoading,
  selectedIds,
  onToggleSelection,
  canSelect,
  onReject,
  isRejecting,
  designsPage,
  setDesignsPage,
  designsTotalPages,
  selectedDesignsCount,
  onOpenInventoryView,
  onFindDie,
  setImageViewerOpen,
  setViewingImageUrl,
  searchTerm,
  setSearchTerm,
  designTypeOptions,
  selectedDesignTypes,
  setSelectedDesignTypes,
  materialTypeOptions,
  selectedMaterialTypes,
  setSelectedMaterialTypes,
}: PrepressDesignTableProps) {
  return (
    <div className="border border-black relative">
      <span className="absolute top-0 left-0 bg-black text-white text-[10px] px-1 z-50">
        PrepressDesignTable.tsx
      </span>
      <div className="relative flex-1 overflow-hidden flex flex-col">
        <div className="shrink-0 border-b p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Thiết kế chờ bình bài ({designs.length})</p>
              <p className="text-xs text-muted-foreground">Đã chọn: {selectedDesignsCount}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={onOpenInventoryView}>
                <span className="h-4 w-4">📦</span>
                Danh sách khuôn bế
              </Button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3 w-full">
            <Input placeholder="Tìm theo mã hàng..." value={searchTerm || ""} onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)} className="flex-1" />
            {materialTypeOptions && setSelectedMaterialTypes && (
              <div className="w-44">
                <select className="w-full h-9 text-sm border rounded px-2" value={selectedMaterialTypes && selectedMaterialTypes.length === 1 ? String(selectedMaterialTypes[0]) : ""} onChange={(e) => {
                  const v = e.target.value;
                  if (!v) setSelectedMaterialTypes([]);
                  else setSelectedMaterialTypes([parseInt(v, 10)]);
                }}>
                  <option value="">Loại chất liệu</option>
                  {materialTypeOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Design type chips */}
          {designTypeOptions && setSelectedDesignTypes && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2">
              <button className={`text-xs px-2 py-1 rounded-full ${(!selectedDesignTypes || selectedDesignTypes.length===0) ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/10 text-muted-foreground'}`} onClick={() => setSelectedDesignTypes([])}>Tất cả</button>
              {designTypeOptions.map((dt) => {
                const active = selectedDesignTypes?.includes(dt.id) || false;
                return (
                  <button key={dt.id} onClick={() => {
                    if (!selectedDesignTypes) return;
                    if (active) setSelectedDesignTypes(selectedDesignTypes.filter(id => id !== dt.id));
                    else setSelectedDesignTypes([...selectedDesignTypes, dt.id]);
                  }} className={`text-xs px-2 py-1 rounded-full ${active ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/10 text-muted-foreground'}`}>
                    {dt.name} {dt.count ? `(${dt.count})` : ""}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="rounded-lg border overflow-hidden">
                <div className="w-full overflow-x-auto pr-12">
                <Table className="min-w-[980px] table-fixed">
                  <TableHeader className="bg-muted/20">
                    <TableRow className="h-16">
                      <TableHead className="text-sm font-bold w-20">Ảnh</TableHead>
                      <TableHead className="text-sm font-bold w-36">Mã hàng</TableHead>
                      <TableHead className="text-sm font-bold w-24">Số lượng</TableHead>
                      <TableHead className="text-sm font-bold w-36">Quy cách</TableHead>
                      <TableHead className="text-sm font-bold w-48">Chất liệu</TableHead>
                      <TableHead className="text-sm font-bold w-24">Loại</TableHead>
                      <TableHead className="w-12 text-right text-sm font-bold sticky right-0 bg-muted/20 z-20">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground"
                        >
                          Đang tải dữ liệu...
                        </TableCell>
                      </TableRow>
                    ) : designs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground"
                        >
                          Không tìm thấy thiết kế nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TooltipProvider>
                        {designs.map((design) => {
                          const isSelected = selectedIds.has(design.id);
                          const selectable = canSelect(design);
                          let tooltipContent = `Mã hàng: ${design.code}\nTên: ${design.name}\nSố lượng: ${design.availableQuantity != null ? design.availableQuantity.toLocaleString("vi-VN") : design.quantity.toLocaleString("vi-VN")}\nQuy cách: ${formatDesignDimensions(design.length, design.width, design.height, 1, " × ")} ${design.unit}\nChất liệu: ${design.materialTypeName}`;
                          if (design.orderCode) tooltipContent += `\nĐơn hàng: ${design.orderCode}`;
                          if (design.designerName) tooltipContent += `\nNgười thiết kế: ${design.designerName}`;
                          if (design.accountantName) tooltipContent += `\nNgười kế toán: ${design.accountantName}`;

                          return (
                            <Tooltip key={design.id}>
                              <TooltipTrigger asChild>
                                <TableRow
                                        className={cn(
                                          "cursor-pointer h-16",
                                          isSelected && "bg-green-100 ring-1 ring-green-200",
                                          !selectable && !isSelected && "opacity-50",
                                        )}
                                        onClick={() => {
                                          if (selectable || isSelected) {
                                            onToggleSelection(design);
                                            if (setSelectedDesignTypes && typeof design.designTypeId === 'number') {
                                              setSelectedDesignTypes([design.designTypeId]);
                                            }
                                          }
                                        }}
                                >
                                  <TableCell className="py-2 px-3 w-20 align-middle">
                                    <div className="w-12 h-10">
                                    {design.thumbnailUrl ? (
                                      <img
                                        src={design.thumbnailUrl}
                                        alt={design.code}
                                        className="w-12 h-10 object-contain rounded cursor-zoom-in"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (setViewingImageUrl) {
                                            setViewingImageUrl(design.thumbnailUrl || null);
                                          }
                                          if (setImageViewerOpen) {
                                            setImageViewerOpen(true);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-10 bg-muted rounded" />
                                    )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 font-mono text-sm font-semibold">
                                    {design.code}
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <span className="text-sm font-semibold">
                                      {design.availableQuantity != null
                                        ? design.availableQuantity.toLocaleString(
                                            "vi-VN",
                                          )
                                        : design.quantity.toLocaleString("vi-VN")}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <span className="text-sm font-medium">
                                      {formatDesignDimensions(
                                        design.length,
                                        design.width,
                                        design.height,
                                        1,
                                        " × ",
                                      )}{" "}
                                      {design.unit}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <span className="text-sm font-medium">
                                      {design.materialTypeName}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <span className="text-sm font-medium">
                                      {design.designTypeName}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2 text-right sticky right-0 bg-background z-10 flex items-center justify-end gap-2">
                                    {/* Hoàn hàng: always available to return design to production */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isRejecting}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onReject(design);
                                      }}
                                    >
                                      Hoàn hàng
                                    </Button>

                                    {/* If die-search is enabled and this is a box design, show magnifier */}
                                    {onFindDie && (design.designTypeName || "").toLowerCase().includes("hộp") && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8"
                                        disabled={isRejecting}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onFindDie(design);
                                        }}
                                        title="Tìm khuôn liên quan"
                                      >
                                        <Search className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-xs whitespace-pre-line"
                              >
                                {tooltipContent}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </TooltipProvider>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
