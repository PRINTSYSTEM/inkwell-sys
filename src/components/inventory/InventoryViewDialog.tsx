import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Loader2, Search, Package, AlertTriangle } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useMaterials } from "@/hooks/use-material";
import { useActiveVendors } from "@/hooks/use-vendor";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface InventoryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryViewDialog({
  open,
  onOpenChange,
}: InventoryViewDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [materialType, setMaterialType] = useState<"cuon" | "to" | "all">("all");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  const { data: vendorsData } = useActiveVendors("material");

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, materialType, vendorId]);

  const { data, isLoading, error } = useMaterials({
    page: page,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
    type: materialType === "all" ? undefined : materialType,
    vendorId: vendorId ?? undefined,
  });

  const stockItems = data?.items || [];
  const totalCount = data?.total ?? 0;

  const filteredItems = showOutOfStock
    ? stockItems
    : stockItems.filter((item: any) => (item.currentStock ?? 0) > 0);

  const displayedCount = filteredItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle>Xem kho hàng</DialogTitle>
          <DialogDescription>
            Danh sách Tồn kho nguyên vật liệu của các vật liệu
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Filters */}
          <div className="shrink-0 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã hàng, tên vật liệu..."
                className="pl-10 rounded-xl border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none focus:border-slate-200 focus:ring-0"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={materialType}
                onValueChange={(value: "cuon" | "to" | "all") => {
                  setMaterialType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Thể loại vật tư" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thể loại</SelectItem>
                  <SelectItem value="cuon">Dạng cuộn</SelectItem>
                  <SelectItem value="to">Dạng tờ</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={vendorId ? String(vendorId) : "all"}
                onValueChange={(value) => {
                  const next =
                    value === "all" ? null : Number.parseInt(value, 10);
                  setVendorId(next);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lọc theo nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                  {vendorsData?.map((v: any) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name || v.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 px-2 border rounded-md bg-background h-10">
                <Checkbox
                  id="show-out-of-stock"
                  checked={showOutOfStock}
                  onCheckedChange={(checked) => setShowOutOfStock(!!checked)}
                />
                <Label
                  htmlFor="show-out-of-stock"
                  className="text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  Hiển thị hết hàng
                </Label>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="w-full overflow-x-auto p-4">
                <Table className="min-w-[1000px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="h-10 text-sm font-bold">
                        Mã hàng
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Tên vật liệu
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Thể loại
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Nhà cung cấp
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold text-right">
                        Tồn kho
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Đơn vị
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Trạng thái
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton cols={7} rows={10} rowHeight="h-14" />
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10">
                          <div className="flex flex-col items-center justify-center gap-2 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                            <p className="text-sm font-semibold text-foreground">
                              Không thể tải dữ liệu tồn kho
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vui lòng thử lại sau.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10">
                          <div className="flex flex-col items-center justify-center gap-2 text-center">
                            <Package className="h-10 w-10 text-muted-foreground opacity-60" />
                            <p className="text-sm font-semibold text-muted-foreground">
                              {searchTerm.trim() || !showOutOfStock
                                ? "Không tìm thấy vật liệu phù hợp"
                                : "Không có dữ liệu tồn kho"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item: any) => {
                        const quantity = item.currentStock ?? 0;
                        const isNegative = quantity < 0;
                        const isOutOfStock = quantity <= 0;
                        const isWarning = isNegative || isOutOfStock;

                        const foundVendor = vendorsData?.find((v: any) => v.id === item.vendorId);
                        const vendorName = foundVendor ? (foundVendor.name || foundVendor.code) : "—";

                        return (
                          <TableRow
                            key={item.id}
                            className={cn(
                              isWarning && "bg-red-50/50 dark:bg-red-950/10"
                            )}
                          >
                            <TableCell className="py-3 font-semibold font-mono text-sm">
                              #{item.id}
                            </TableCell>
                            <TableCell className="py-3 text-sm">
                              {item.name || "—"}
                            </TableCell>
                            <TableCell className="py-3 text-sm">
                              {item.type === "cuon" ? (
                                <Badge variant="secondary" className="text-xs">Cuộn</Badge>
                              ) : item.type === "to" ? (
                                <Badge variant="secondary" className="text-xs">Tờ</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-sm font-medium">
                              {vendorName}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "py-3 text-right font-semibold text-sm",
                                isNegative && "text-red-600 dark:text-red-400"
                              )}
                            >
                              {item.currentStock != null
                                ? item.currentStock.toLocaleString("vi-VN")
                                : "—"}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground">
                              {item.unit || "—"}
                            </TableCell>
                            <TableCell className="py-3">
                              {isOutOfStock ? (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Hết hàng
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-green-500 text-green-700 dark:text-green-400"
                                >
                                  Bình thường
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          {totalCount > 0 && (
            <div className="shrink-0 border-t px-4 py-2 text-xs text-muted-foreground flex justify-between">
              <div>
                Tổng số: <span className="font-semibold text-foreground">{totalCount}</span> vật liệu
              </div>
              {displayedCount !== totalCount && (
                <div>
                  Đang hiển thị: <span className="font-semibold text-foreground">{displayedCount}</span> vật liệu
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
