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
            <TableHead>Mã Design</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Vật liệu</TableHead>
            <TableHead>Kích thước</TableHead>
            <TableHead className="text-right">SL</TableHead>
            <TableHead className="text-right">Đơn giá</TableHead>
            <TableHead>Order</TableHead>
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
                  {/* {design.unitPrice.toLocaleString()}đ */}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {design.orderId}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
