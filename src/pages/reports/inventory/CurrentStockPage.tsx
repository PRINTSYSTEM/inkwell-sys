import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
import { useMaterials } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CurrentStockPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    materialTypeId: selectedMaterialType === "all" ? undefined : Number(selectedMaterialType),
  });

  const { data: materialTypes } = useMaterialTypeList();

  const totalItems = materialsData?.total || 0;
  const totalQuantity = materialsData?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const totalValue = 0; // MaterialResponse doesn't have stockValue

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
              <div className="text-xl font-bold">{totalQuantity.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Tổng giá trị
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-xl font-bold">
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
          
          <Select value={selectedMaterialType} onValueChange={setSelectedMaterialType}>
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
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead className="min-w-[180px]">Tên vật tư</TableHead>
                <TableHead>Loại vật liệu</TableHead>
                <TableHead>Kích thước (LxWxH)</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Ngày tạo</TableHead>
                <TableHead className="text-right">Người tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !materialsData?.items || materialsData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                    onClick={() => navigate(`/reports/inventory/stock-card/${item.id}`)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      #{item.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {item.materialTypeName || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.length || "—"}
                      {item.width ? `x${item.width}` : ""}
                      {item.height ? `x${item.height}` : ""}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-blue-600">
                      {item.quantity !== undefined
                        ? item.quantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.createdBy || "—"}
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
                  setCurrentPage((p) => Math.min(materialsData.totalPages, p + 1))
                }
                disabled={currentPage === materialsData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

