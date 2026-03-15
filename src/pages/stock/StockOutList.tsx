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
  LogOut,
  Filter,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, AlertCircle } from "lucide-react";

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

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: number | null;
    type: "complete" | "cancel" | "delete" | null;
    title: string;
    description: string;
    confirmText: string;
    confirmVariant?: "default" | "destructive";
  }>({
    open: false,
    id: null,
    type: null,
    title: "",
    description: "",
    confirmText: "",
    confirmVariant: "default",
  });

  const handleDelete = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "delete",
      title: "Xác nhận xóa phiếu xuất kho",
      description:
        "Bạn có chắc chắn muốn xóa phiếu xuất kho này? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu.",
      confirmText: "Xóa",
      confirmVariant: "destructive",
    });
  };

  const handleComplete = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "complete",
      title: "Xác nhận hoàn thành phiếu xuất kho",
      description:
        "Bạn có chắc chắn muốn hoàn thành phiếu xuất kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "cancel",
      title: "Xác nhận hủy phiếu xuất kho",
      description:
        "Bạn có chắc chắn muốn hủy phiếu xuất kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog.id || !confirmDialog.type) return;

    switch (confirmDialog.type) {
      case "complete":
        completeStockOut(confirmDialog.id, {
          onSuccess: () => {
            toast.success("Đã hoàn thành phiếu xuất kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "cancel":
        cancelStockOut(confirmDialog.id, {
          onSuccess: () => {
            toast.success("Đã hủy phiếu xuất kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "delete":
        deleteStockOut(confirmDialog.id, {
          onSuccess: () => {
            toast.success("Đã xóa phiếu xuất kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
    }
  };

  const handleExportExcel = async () => {
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

      <div className="min-h-screen bg-background">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#93631F] to-[#7a521a] flex items-center justify-center shadow-lg shadow-[#93631F]/25">
                    <LogOut className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      Quản lý xuất kho
                    </h1>
                    <p className="text-xs text-slate-500">
                      Quản lý các phiếu xuất kho Chất liệu
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/stock/stock-outs/create")}
                className="cursor-pointer transition-colors duration-200 bg-gradient-to-r from-[#93631F] to-[#7a521a] hover:opacity-90 shadow-lg shadow-[#93631F]/25 text-white border-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu xuất kho
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters Card */}
          <Card className="mb-6 border-slate-200/60 shadow-lg shadow-slate-200/50">
            <CardHeader className="bg-[#93631F]/5 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#93631F]/10 flex items-center justify-center">
                  <Filter className="h-5 w-5 text-[#93631F]" />
                </div>
                <CardTitle className="text-lg">Bộ lọc</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm theo mã phiếu, lý do xuất..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-11 transition-colors duration-200"
                  />
                </div>
                <DateRangePicker value={dateRange} onValueChange={setDateRange} />
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-11 cursor-pointer transition-colors duration-200">
                    <SelectValue placeholder="Lý do xuất" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="sale">Bán hàng</SelectItem>
                    <SelectItem value="material_export">Xuất nguyên liệu</SelectItem>
                    <SelectItem value="production">Sản xuất</SelectItem>
                    <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-11 cursor-pointer transition-colors duration-200">
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
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="cursor-pointer transition-colors duration-200"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Làm mới
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="cursor-pointer transition-colors duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Xuất Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="border-slate-200/60 shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#93631F]" />
                  <span className="ml-3 text-slate-600">Đang tải dữ liệu...</span>
                </div>
              ) : stockOuts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-16 w-16 rounded-full bg-[#93631F]/10 flex items-center justify-center mb-4">
                    <LogOut className="h-8 w-8 text-[#93631F]" />
                  </div>
                  <p className="text-slate-600 font-medium">Không có phiếu xuất kho nào</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Tạo phiếu xuất kho mới để bắt đầu
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#93631F]/5 border-b border-slate-200/60">
                          <TableHead className="w-[140px] font-semibold text-slate-700">
                            Số phiếu
                          </TableHead>
                          <TableHead className="w-[120px] font-semibold text-slate-700">
                            Ngày
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Loại phiếu
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Khách hàng
                          </TableHead>
                          <TableHead className="w-[120px] font-semibold text-slate-700">
                            Kho
                          </TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">
                            Tổng SL
                          </TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">
                            Tổng giá trị
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Tham chiếu
                          </TableHead>
                          <TableHead className="text-center font-semibold text-slate-700">
                            Trạng thái
                          </TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockOuts.map((stockOut) => (
                          <TableRow
                            key={stockOut.id}
                            className="group cursor-pointer hover:bg-[#93631F]/5 transition-colors duration-200 border-b border-slate-100"
                            onClick={() => handleViewDetails(stockOut.id)}
                          >
                            <TableCell className="font-medium font-mono text-sm">
                              {stockOut.code || `PXK-${stockOut.id}`}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
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
                                  <div className="text-xs text-slate-500">
                                    KH: {stockOut.customer.name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {stockOut.warehouse || stockOut.warehouseName || "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-slate-700">
                              {stockOut.totalQuantity
                                ? stockOut.totalQuantity.toLocaleString("vi-VN")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-slate-700">
                              {stockOut.totalValue
                                ? formatCurrency(stockOut.totalValue)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {stockOut.orderCode && (
                                  <div className="text-xs">
                                    <span className="text-slate-500">Đơn:</span>{" "}
                                    <span className="font-mono">{stockOut.orderCode}</span>
                                  </div>
                                )}
                                {stockOut.productionCode && (
                                  <div className="text-xs">
                                    <span className="text-slate-500">SX:</span>{" "}
                                    <span className="font-mono">
                                      {stockOut.productionCode}
                                    </span>
                                  </div>
                                )}
                                {!stockOut.orderCode &&
                                  !stockOut.productionCode &&
                                  "—"}
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
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 cursor-pointer"
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
                                    className="cursor-pointer"
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
                                          className="cursor-pointer"
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Chỉnh sửa
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleComplete(stockOut.id);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Hoàn thành
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancel(stockOut.id);
                                          }}
                                          className="text-destructive cursor-pointer"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Hủy
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(stockOut.id);
                                          }}
                                          className="text-destructive cursor-pointer"
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
                  </div>
                  <div className="flex items-center justify-between p-4 border-t border-slate-200/60 bg-slate-50/50">
                    <div className="text-sm text-slate-600">
                      Trang <span className="font-semibold">{page}</span> /{" "}
                      <span className="font-semibold">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="cursor-pointer transition-colors duration-200"
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="cursor-pointer transition-colors duration-200"
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
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                confirmDialog.confirmVariant === "destructive"
                  ? "bg-red-100"
                  : "bg-[#93631F]/10"
              }`}>
                {confirmDialog.confirmVariant === "destructive" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[#93631F]" />
                )}
              </div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {confirmDialog.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              className="cursor-pointer transition-colors duration-200"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant={confirmDialog.confirmVariant || "default"}
              onClick={handleConfirm}
              className={`cursor-pointer transition-colors duration-200 text-white ${
                confirmDialog.confirmVariant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/25"
                  : "bg-[#93631F] hover:bg-[#7a521a] shadow-[#93631F]/25"
              }`}
            >
              {confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
