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
    <div className="w-full">
      <Table className="min-w-full">
        <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-200 dark:border-slate-800">
          <TableRow className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300">
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[70px] text-center">Thứ tự</TableHead>
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[120px]">Mã chất liệu</TableHead>
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 min-w-[180px]">Tên chất liệu</TableHead>
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[130px] text-right">Giá/m²</TableHead>
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[110px] text-right">SL tối thiểu</TableHead>
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[100px] text-center">Trạng thái</TableHead>
            <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[90px] text-center pr-3">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id} className="h-9 text-xs border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 transition-colors">
              <TableCell className="text-center py-1.5 font-mono font-medium text-slate-500">
                #{material.displayOrder}
              </TableCell>
              <TableCell className="py-1.5">
                <Badge variant="outline" className="font-mono text-[11px] font-bold">
                  {material.code}
                </Badge>
              </TableCell>
              <TableCell className="py-1.5">
                <div className="min-w-0">
                  <TruncatedText text={material.name} className="font-bold text-slate-800 dark:text-slate-200" />
                  {material.description && (
                    <TruncatedText
                      text={material.description}
                      className="text-[11px] text-slate-400 mt-0.5"
                    />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right py-1.5">
                <div className="flex items-center justify-end gap-1 font-bold text-slate-900 dark:text-slate-100">
                  <span>
                    {material.pricePerM2
                      ? material.pricePerM2.toLocaleString("vi-VN")
                      : "0"}
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">đ/m²</span>
                </div>
              </TableCell>
              <TableCell className="text-right py-1.5 font-semibold text-slate-700 dark:text-slate-300">
                {material.minimumQuantity != null
                  ? material.minimumQuantity.toLocaleString("vi-VN")
                  : "-"}
              </TableCell>
              <TableCell className="text-center py-1.5">
                <Badge
                  variant={
                    material.status === "active" ? "default" : "secondary"
                  }
                  className={
                    material.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px]"
                  }
                >
                  {material.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </Badge>
              </TableCell>
              <TableCell className="py-1.5 pr-3">
                <div className="flex items-center gap-1 justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(material)}
                    className="h-7 w-7 text-slate-500 hover:text-slate-900 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(material)}
                    className="h-7 w-7 text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
