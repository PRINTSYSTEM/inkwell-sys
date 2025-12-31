import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "@/components/ui/truncated-text";
import { MaterialTypeResponse } from "@/Schema";
import { Edit, Trash2, DollarSign } from "lucide-react";

interface MaterialTypeListProps {
  materials: MaterialTypeResponse[];
  onEdit: (material: MaterialTypeResponse) => void;
  onDelete: (material: MaterialTypeResponse) => void;
}

export function MaterialTypeList({
  materials,
  onEdit,
  onDelete,
}: MaterialTypeListProps) {
  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Chưa có chất liệu nào</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Thêm chất liệu đầu tiên cho loại thiết kế này để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px] text-center">Thứ tự</TableHead>
            <TableHead className="w-[140px]">Mã chất liệu</TableHead>
            <TableHead className="min-w-[200px]">Tên chất liệu</TableHead>
            <TableHead className="w-[150px] text-right">Giá/m²</TableHead>
            <TableHead className="w-[130px] text-right">SL tối thiểu</TableHead>
            <TableHead className="w-[110px] text-center">Trạng thái</TableHead>
            <TableHead className="w-[100px] text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id} className="hover:bg-muted/30">
              <TableCell className="text-center">
                <Badge variant="outline" className="font-mono text-xs">
                  #{material.displayOrder}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono text-xs">
                  {material.code}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <TruncatedText text={material.name} className="font-medium" />
                  {material.description && (
                    <TruncatedText
                      text={material.description}
                      className="text-xs text-muted-foreground mt-0.5"
                    />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="font-semibold text-sm">
                    {material.pricePerM2
                      ? material.pricePerM2.toLocaleString("vi-VN")
                      : "0"}
                  </span>
                  <span className="text-xs text-muted-foreground">đ/m²</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-sm">
                  {material.minimumQuantity != null
                    ? material.minimumQuantity.toLocaleString("vi-VN")
                    : "-"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={
                    material.status === "active" ? "default" : "secondary"
                  }
                  className={
                    material.status === "active"
                      ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400"
                      : ""
                  }
                >
                  {material.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(material)}
                    className="h-8 w-8 p-0"
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(material)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
