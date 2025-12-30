import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { Helmet } from "react-helmet-async";
import {
  useStockOuts,
  useDeleteStockOut,
  useCompleteStockOut,
  useCancelStockOut,
} from "@/hooks/use-stock";
import { formatDate, formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";

export default function StockOutListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { data, isLoading, refetch } = useStockOuts({
    pageNumber: page,
    pageSize,
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const { mutate: deleteStockOut } = useDeleteStockOut();
  const { mutate: completeStockOut } = useCompleteStockOut();
  const { mutate: cancelStockOut } = useCancelStockOut();

  const stockOuts = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa phiếu xuất kho này?")) {
      deleteStockOut(id);
    }
  };

  const handleComplete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn hoàn thành phiếu xuất kho này?")) {
      completeStockOut(id);
    }
  };

  const handleCancel = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn hủy phiếu xuất kho này?")) {
      cancelStockOut(id);
    }
  };

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleViewDetails = (id: number | undefined) => {
    if (id) {
      navigate(`/stock/stock-outs/${id}`);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <StatusBadge status="unknown" label="—" />;
    const statusLower = status.toLowerCase();
    if (statusLower === "draft" || statusLower.includes("draft")) {
      return <StatusBadge status="draft" label="Nháp" />;
    }
    if (statusLower === "completed" || statusLower.includes("completed")) {
      return <StatusBadge status="completed" label="Hoàn thành" />;
    }
    if (statusLower === "cancelled" || statusLower.includes("cancelled")) {
      return <StatusBadge status="cancelled" label="Đã hủy" />;
    }
    return <StatusBadge status={status} label={status} />;
  };

  return (
    <>
      <Helmet>
        <title>Phiếu xuất kho | Print Production ERP</title>
        <meta name="description" content="Quản lý phiếu xuất kho" />
      </Helmet>

      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý xuất kho</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các phiếu xuất kho vật liệu
            </p>
          </div>
          <Button onClick={() => navigate("/stock/stock-outs/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiếu xuất kho
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã phiếu, lý do xuất..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DateRangePicker value={dateRange} onValueChange={setDateRange} />
              <Select
                value={typeFilter || "all"}
                onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lý do xuất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="sale">Bán hàng</SelectItem>
                  <SelectItem value="production">Sản xuất</SelectItem>
                  <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter || "all"}
                onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button variant="outline" size="icon" onClick={handleExportExcel}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : stockOuts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có phiếu xuất kho nào
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[140px]">Số phiếu</TableHead>
                    <TableHead className="w-[120px]">Ngày</TableHead>
                    <TableHead>Lý do xuất</TableHead>
                    <TableHead className="w-[120px]">Kho</TableHead>
                    <TableHead className="text-right">Tổng SL</TableHead>
                    <TableHead className="text-right">Tổng giá trị</TableHead>
                    <TableHead>Tham chiếu</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockOuts.map((stockOut) => (
                    <TableRow
                      key={stockOut.id}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewDetails(stockOut.id)}
                    >
                      <TableCell className="font-medium font-mono text-sm">
                        {stockOut.code || `PXK-${stockOut.id}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stockOut.stockOutDate
                          ? formatDate(stockOut.stockOutDate)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {stockOut.type === "sale"
                              ? "Bán hàng"
                              : stockOut.type === "production"
                                ? "Sản xuất"
                                : stockOut.type === "adjustment"
                                  ? "Điều chỉnh"
                                  : stockOut.type || "—"}
                          </div>
                          {stockOut.customer?.name && (
                            <div className="text-xs text-muted-foreground">
                              KH: {stockOut.customer.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {stockOut.warehouse || stockOut.warehouseName || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {stockOut.totalQuantity
                          ? stockOut.totalQuantity.toLocaleString("vi-VN")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {stockOut.totalValue
                          ? formatCurrency(stockOut.totalValue)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {stockOut.orderCode && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Đơn:</span>{" "}
                              <span className="font-mono">
                                {stockOut.orderCode}
                              </span>
                            </div>
                          )}
                          {stockOut.productionCode && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">SX:</span>{" "}
                              <span className="font-mono">
                                {stockOut.productionCode}
                              </span>
                            </div>
                          )}
                          {!stockOut.orderCode && !stockOut.productionCode && "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(stockOut.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(stockOut.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {stockOut.status !== "completed" &&
                              stockOut.status !== "cancelled" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/stock/stock-outs/${stockOut.id}/edit`
                                      );
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleComplete(stockOut.id);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Hoàn thành
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancel(stockOut.id);
                                    }}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Hủy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(stockOut.id);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
