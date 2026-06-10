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

import { useListState } from "@/hooks/use-list-state";

export default function StockOutListPage() {
  const navigate = useNavigate();
  const {
    currentPage: page,
    setCurrentPage: setPage,
    searchTerm: search,
    setSearchTerm: setSearch,
    debouncedSearchTerm,
    statusFilter,
    setStatusFilter,
  } = useListState();
  
  const [pageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setDateRange(undefined);
    setPage(1);
  };

  const { data, isLoading, refetch } = useStockOuts({
    pageNumber: page,
    pageSize,
    search: debouncedSearchTerm || undefined,
    purpose: typeFilter || undefined,
    status: statusFilter === "all" ? undefined : statusFilter || undefined,
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
    if (statusLower === "pending" || statusLower.includes("pending")) {
      return <StatusBadge status="pending" label="Chờ xử lý" />;
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quản lý xuất kho</h1>
              <p className="text-muted-foreground mt-1">Quản lý các phiếu xuất kho Chất liệu</p>
            </div>
          </div>

          <div className="space-y-6">
          {/* COMPACT TOOLBAR FILTERS ROW */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-2.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/50 shadow-sm mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto flex-1">
              {/* Search Text */}
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm theo mã phiếu, lý do xuất..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-slate-200 focus-visible:ring-[#93631F] rounded-lg"
                />
              </div>

              {/* Date Range Picker */}
              <div className="w-full sm:w-[260px] [&_button]:h-9 [&_button]:text-xs [&_button]:rounded-lg [&_button]:border-slate-200">
                <DateRangePicker 
                  value={dateRange} 
                  onValueChange={(r) => {
                    setDateRange(r);
                    setPage(1);
                  }} 
                />
              </div>

              {/* Type Selector */}
              <div className="w-full sm:w-[150px]">
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(v) => {
                    setTypeFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer">
                    <SelectValue placeholder="Loại phiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại phiếu</SelectItem>
                    <SelectItem value="sale">Bán hàng</SelectItem>
                    <SelectItem value="material_export">Xuất nguyên liệu</SelectItem>
                    <SelectItem value="production">Sản xuất</SelectItem>
                    <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Selector */}
              <div className="w-full sm:w-[150px]">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="draft">Nháp</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 justify-end">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>



              {/* Reset Button */}
              {(search || typeFilter || statusFilter || dateRange) && (
                <Button
                  onClick={handleResetFilters}
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground hover:text-foreground hover:bg-accent text-xs font-semibold px-3 rounded-lg cursor-pointer transition-colors"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>

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
                            NCC
                          </TableHead>
                          <TableHead className="w-[120px] font-semibold text-slate-700">
                            Kho
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
                            <TableCell className="text-sm text-slate-600">
                              {stockOut.purpose === "return_vendor" || stockOut.type === "return_vendor"
                                ? "Trả NCC"
                                : stockOut.purposeName === "Trả hàng NCC" || stockOut.purposeName === "Trả hàng nhà cung cấp"
                                  ? "Trả NCC"
                                  : stockOut.purposeName ||
                                    (stockOut.type === "sale" || stockOut.purpose === "sale"
                                      ? "Bán hàng"
                                      : stockOut.type === "production" || stockOut.purpose === "production"
                                        ? "Sản xuất"
                                        : stockOut.type === "adjustment" || stockOut.purpose === "adjustment"
                                          ? "Điều chỉnh"
                                          : stockOut.type === "outsource" || stockOut.purpose === "outsource"
                                            ? "In gia công"
                                            : stockOut.type || stockOut.purpose || "—")}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-700">
                              {stockOut.customer?.name || stockOut.supplier?.name || stockOut.vendorName || stockOut.vendor?.name || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {stockOut.warehouse || stockOut.warehouseName || "—"}
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
