import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaterials, useUpdateMaterial } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { formatCurrency } from "@/lib/status-utils";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MaterialResponse } from "@/Schema";

export default function CurrentStockPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterialType, setSelectedMaterialType] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editingItem, setEditingItem] = useState<MaterialResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const updateMaterialMutation = useUpdateMaterial();

  const {
    data: materialsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useMaterials({
    page: currentPage,
    size: itemsPerPage,
    search: searchQuery || "",
    materialTypeId:
      selectedMaterialType === "all" ? undefined : Number(selectedMaterialType),
  });

  const { data: materialTypes } = useMaterialTypeList();

  const totalItems = materialsData?.total || 0;
  const totalQuantity =
    materialsData?.items?.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    ) || 0;
  
  // Calculate total value based on available unitPrice * quantity
  const totalValue =
    materialsData?.items?.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0,
    ) || 0;

  const openEdit = (item: MaterialResponse) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.id) return;

    const form = new FormData(e.target as HTMLFormElement);
    const name = form.get("name") as string;
    const lengthVal = form.get("length") ? Number(form.get("length")) : null;
    const widthVal = form.get("width") ? Number(form.get("width")) : null;
    const heightVal = form.get("height") ? Number(form.get("height")) : null;
    const quantityVal = form.get("quantity") ? Number(form.get("quantity")) : null;
    const unit = form.get("unit") as string;
    const unitPriceVal = form.get("unitPrice") ? Number(form.get("unitPrice")) : null;

    updateMaterialMutation.mutate(
      {
        id: editingItem.id,
        data: {
          name: name || null,
          materialTypeId: editingItem.materialTypeId || null,
          length: lengthVal,
          width: widthVal,
          height: heightVal,
          quantity: quantityVal,
          unit: unit || null,
          unitPrice: unitPriceVal,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingItem(null);
          refetch();
        },
      },
    );
  };

  return (
    <>
      <Helmet>
        <title>Tồn kho nguyên vật liệu | Print Production ERP</title>
        <meta
          name="description"
          content="Xem Tồn kho nguyên vật liệu của các vật tư"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tồn kho nguyên vật liệu
            </h1>
            <p className="text-muted-foreground">
              Xem Tồn kho nguyên vật liệu của các vật tư trong kho
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Tổng số mặt hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Tổng số lượng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-xl font-bold">
                {totalQuantity.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Tổng giá trị
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã, tên vật tư..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-md"
            />
          </div>

          <Select
            value={selectedMaterialType}
            onValueChange={setSelectedMaterialType}
          >
            <SelectTrigger className="w-full sm:w-[200px] rounded-md">
              <SelectValue placeholder="Loại vật liệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vật liệu</SelectItem>
              {materialTypes?.items?.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="min-w-[180px]">Tên vật tư</TableHead>
                <TableHead className="min-w-[120px]">Kích thước</TableHead>
                <TableHead className="w-[100px]">Đơn vị</TableHead>
                <TableHead className="text-right w-[120px]">Đơn giá</TableHead>
                <TableHead className="text-right w-[100px]">Số lượng</TableHead>
                <TableHead className="text-right w-[120px]">Ngày tạo</TableHead>
                <TableHead className="text-right w-[120px]">Người tạo</TableHead>
                <TableHead className="text-right w-[100px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !materialsData?.items || materialsData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu tồn kho nào.
                  </TableCell>
                </TableRow>
              ) : (
                materialsData.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate(`/reports/inventory/stock-card/${item.id}`)
                    }
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      #{item.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.length || "—"}
                      {item.width ? `x${item.width}` : ""}
                      {item.height ? `x${item.height}` : ""}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.unit || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.unitPrice !== undefined && item.unitPrice !== null
                        ? formatCurrency(item.unitPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-blue-600">
                      {item.quantity !== undefined
                        ? item.quantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.createdBy || "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {materialsData && materialsData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {materialsData.totalPages} (
              {materialsData.total} mặt hàng)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {materialsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(materialsData.totalPages, p + 1),
                  )
                }
                disabled={currentPage === materialsData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin chất liệu</DialogTitle>
            <DialogDescription>
              Thay đổi thông tin chi tiết và đơn giá của chất liệu. Nhấp vào Lưu khi hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="name">Tên chất liệu</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="quantity">Số lượng</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  defaultValue={editingItem?.quantity ?? ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unit">Đơn vị tính</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={editingItem?.unit || ""}
                  placeholder="tờ, cuộn, cái..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="unitPrice">Đơn giá (VND)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="any"
                defaultValue={editingItem?.unitPrice ?? ""}
                placeholder="Nhập đơn giá mới..."
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="length">Chiều dài</Label>
                <Input
                  id="length"
                  name="length"
                  type="number"
                  step="any"
                  defaultValue={editingItem?.length ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="width">Chiều rộng</Label>
                <Input
                  id="width"
                  name="width"
                  type="number"
                  step="any"
                  defaultValue={editingItem?.width ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height">Chiều cao</Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  step="any"
                  defaultValue={editingItem?.height ?? ""}
                  placeholder="Không có"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={updateMaterialMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateMaterialMutation.isPending}>
                {updateMaterialMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
