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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";
import type { DesignItem } from "@/types/proofing";

interface PrepressDesignTableProps {
  designs: any[];
  isLoading: boolean;
  selectedIds: Set<number>;
  onToggleSelection: (design: any) => void;
  canSelect: (design: any) => boolean;
  onReject: (design: any) => void;
  isRejecting: boolean;
  designsPage: number;
  setDesignsPage: (page: number | ((p: number) => number)) => void;
  designsTotalPages: number;
  selectedDesignsCount: number;
  onOpenInventoryView: () => void;
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
}: PrepressDesignTableProps) {
  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      <div className="shrink-0 border-b p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Thiết kế chờ bình bài ({designs.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Đã chọn: {selectedDesignsCount}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2 mr-4 border-r pr-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setDesignsPage((p) => Math.max(1, p - 1))}
              disabled={designsPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-medium">
              Trang {designsPage} / {designsTotalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() =>
                setDesignsPage((p) => Math.min(designsTotalPages, p + 1))
              }
              disabled={designsPage === designsTotalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onOpenInventoryView}
          >
            <span className="h-4 w-4">📦</span>
            Xem kho hàng
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="rounded-lg border overflow-hidden">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-sm font-bold">
                      Đơn hàng
                    </TableHead>
                    <TableHead className="text-sm font-bold">Mã hàng</TableHead>
                    <TableHead className="text-sm font-bold">
                      Số lượng
                    </TableHead>
                    <TableHead className="text-sm font-bold">
                      Quy cách
                    </TableHead>
                    <TableHead className="text-sm font-bold">
                      Chất liệu
                    </TableHead>
                    <TableHead className="text-sm font-bold">Loại</TableHead>
                    <TableHead className="w-[120px] text-right text-sm font-bold">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : designs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
                        const tooltipContent = `Mã hàng: ${design.code}\nTên: ${design.name}\nSố lượng: ${design.availableQuantity != null ? design.availableQuantity.toLocaleString("vi-VN") : design.quantity.toLocaleString("vi-VN")}\nQuy cách: ${formatDesignDimensions(design.length, design.width, design.height, 1, " × ")} ${design.unit}\nChất liệu: ${design.materialTypeName}\n${design.orderCode ? `\nĐơn hàng: ${design.orderCode}` : ""}`;

                        return (
                          <Tooltip key={design.id}>
                            <TooltipTrigger asChild>
                              <TableRow
                                className={cn(
                                  "cursor-pointer",
                                  isSelected && "bg-primary/5",
                                  !selectable && !isSelected && "opacity-50",
                                )}
                                onClick={() => {
                                  if (selectable || isSelected)
                                    onToggleSelection(design);
                                }}
                              >
                                <TableCell className="py-3">
                                  <span className="font-semibold text-sm text-primary">
                                    {design.orderCode || design.orderId}
                                  </span>
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
                                <TableCell className="py-2 text-right">
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
  );
}
