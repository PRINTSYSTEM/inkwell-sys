import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
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
import { useCurrentStock } from "@/hooks/use-inventory-report";
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
    data: stockData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCurrentStock({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || "",
  });

  const totalItems = stockData?.total || 0;
  const totalQuantity = stockData?.items?.reduce((sum, item) => sum + (item.currentQuantity || 0), 0) || 0;
  const totalValue = stockData?.items?.reduce((sum, item) => sum + (item.stockValue || 0), 0) || 0;

  return (
    <>
      <Helmet>
        <title>Tồn kho hiện tại | Print Production ERP</title>
        <meta
          name="description"
          content="Xem tồn kho hiện tại của các vật tư"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tồn kho hiện tại
            </h1>
            <p className="text-muted-foreground">
              Xem tồn kho hiện tại của các vật tư trong kho
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
              <SelectItem value="paper">Giấy</SelectItem>
              <SelectItem value="decal">Decal</SelectItem>
              <SelectItem value="ink">Mực</SelectItem>
              <SelectItem value="plate">Kẽm</SelectItem>
              <SelectItem value="other">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">Mã vật tư</TableHead>
                <TableHead className="min-w-[180px]">Tên vật tư</TableHead>
                <TableHead>Loại vật liệu</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn vị</TableHead>
                <TableHead className="text-right">Định mức</TableHead>
                <TableHead className="text-right">Giá trị tồn</TableHead>
                <TableHead className="text-right">Trạng thái</TableHead>
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
              ) : !stockData?.items || stockData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu tồn kho nào.
                  </TableCell>
                </TableRow>
              ) : (() => {
                const filteredItems = stockData.items.filter((item) => {
                  if (selectedMaterialType === "all") return true;
                  const name = item.itemName?.toLowerCase() || "";
                  const code = item.itemCode?.toLowerCase() || "";
                  if (selectedMaterialType === "paper") return name.includes("giấy") || name.includes("ivory") || name.includes("duplex") || name.includes("couche");
                  if (selectedMaterialType === "decal") return name.includes("decal");
                  if (selectedMaterialType === "ink") return code.includes("ink") || name.includes("mực");
                  if (selectedMaterialType === "plate") return code.includes("plate") || name.includes("kẽm");
                  if (selectedMaterialType === "other") return !name.includes("decal") && !name.includes("giấy") && !code.includes("ink") && !code.includes("plate");
                  return true;
                });

                if (filteredItems.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Không tìm thấy vật tư nào khớp với bộ lọc.
                      </TableCell>
                    </TableRow>
                  );
                }

                return filteredItems.map((item) => (
                  <TableRow 
                    key={item.itemCode || item.itemName}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/reports/inventory/stock-card/${item.itemCode}`)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {item.itemCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.itemName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {item.itemName?.toLowerCase().includes("decal") ? "Decal" : 
                         item.itemName?.toLowerCase().includes("ivory") ? "Giấy Ivory" : 
                         item.itemName?.toLowerCase().includes("duplex") ? "Giấy Duplex" : 
                         item.itemName?.toLowerCase().includes("couche") ? "Giấy Couche" : 
                         item.itemCode?.includes("INK") ? "Mực" : 
                         item.itemCode?.includes("PLATE") ? "Kẽm" : "Giấy"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.itemName?.match(/\d+x\d+/)?.[0] || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.currentQuantity !== undefined
                        ? item.currentQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.unit || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.minStock !== undefined
                        ? item.minStock.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {item.stockValue !== undefined
                        ? formatCurrency(item.stockValue)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                        {item.status || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {stockData && stockData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {stockData.totalPages} (
              {stockData.total} mặt hàng)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <RefreshCw className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {stockData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(stockData.totalPages, p + 1))
                }
                disabled={currentPage === stockData.totalPages || isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

