import { DesignItem } from "@/types/proofing";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Building2, User, FileText, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DesignTableProps {
  designs: DesignItem[];
  selectedIds: Set<number>;
  canSelect: (design: DesignItem) => boolean;
  onToggle: (design: DesignItem) => void;
}

export function DesignTable({
  designs,
  selectedIds,
  canSelect,
  onToggle,
}: DesignTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-16">Ảnh</TableHead>
            <TableHead>Đơn hàng</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Mã Design</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Vật liệu</TableHead>
            <TableHead>Kích thước</TableHead>
            <TableHead className="text-right">SL đặt</TableHead>
            <TableHead className="text-right">SL có thể bình bài</TableHead>
            <TableHead>Yêu cầu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {designs.map((design) => {
            const isSelected = selectedIds.has(design.id);
            const selectable = canSelect(design);

            return (
              <TableRow
                key={design.id}
                className={cn(
                  "cursor-pointer",
                  isSelected && "bg-primary/5",
                  !selectable && !isSelected && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectable || isSelected) {
                    onToggle(design);
                  }
                }}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    disabled={!selectable && !isSelected}
                    onCheckedChange={() => {
                      if (selectable || isSelected) {
                        onToggle(design);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>
                  <img
                    src={design.thumbnailUrl}
                    alt={design.name}
                    className="w-10 h-10 rounded object-cover bg-muted"
                  />
                </TableCell>
                <TableCell>
                  {design.orderCode ? (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-xs text-primary">
                        {design.orderCode}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {design.orderId}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {design.customerName ? (
                    <div className="flex items-center gap-1.5">
                      {design.customerCompanyName ? (
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <User className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs truncate max-w-[120px]">
                        {design.customerCompanyName || design.customerName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {design.code}
                </TableCell>
                <TableCell className="font-medium">{design.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {design.designTypeName}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {design.materialTypeName}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {design.width}x{design.height} {design.unit}
                </TableCell>
                <TableCell className="text-right">
                  {design.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {design.availableQuantity !== undefined ? (
                    <span
                      className={`font-semibold ${
                        design.availableQuantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {design.availableQuantity.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {(design.requirements || design.additionalNotes) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-xs text-muted-foreground">
                              {design.requirements
                                ? "Có yêu cầu"
                                : "Có ghi chú"}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          {design.requirements && (
                            <>
                              <p className="font-semibold mb-1">Yêu cầu:</p>
                              <p className="mb-2">{design.requirements}</p>
                            </>
                          )}
                          {design.additionalNotes && (
                            <>
                              <p className="font-semibold mb-1">Ghi chú:</p>
                              <p>{design.additionalNotes}</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
