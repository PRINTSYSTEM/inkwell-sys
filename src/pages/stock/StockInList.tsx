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
  Loader2,
  MoreHorizontal,
  Package,
  Filter,
  Building2,
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
  useStockIns,
  useDeleteStockIn,
  useCompleteStockIn,
  useCancelStockIn,
} from "@/hooks/use-stock";
import { useActiveVendors } from "@/hooks/use-vendor";
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

export default function StockInListPage() {
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
  const [vendorFilter, setVendorFilter] = useState<string>("");

  const { data: vendorsData } = useActiveVendors();

  const { data, isLoading, refetch } = useStockIns({
    pageNumber: page,
    pageSize,
    search: debouncedSearchTerm || undefined,
    type: typeFilter || undefined,
    status: statusFilter === "all" ? undefined : statusFilter || undefined,
  });

  const { mutate: deleteStockIn } = useDeleteStockIn();
  const { mutate: completeStockIn } = useCompleteStockIn();
  const { mutate: cancelStockIn } = useCancelStockIn();

  const stockIns = data?.items || [];
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
      title: "Xác nhận xóa phiếu nhập kho",
      description:
        "Bạn có chắc chắn muốn xóa phiếu nhập kho này? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu.",
      confirmText: "Xóa",
      confirmVariant: "destructive",
    });
  };

  const handleComplete = (id: number) => {
    completeStockIn(id);
  };

  const handleCancel = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "cancel",
      title: "Xác nhận hủy phiếu nhập kho",
      description:
        "Bạn có chắc chắn muốn hủy phiếu nhập kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog.id || !confirmDialog.type) return;

    switch (confirmDialog.type) {
      case "cancel":
        cancelStockIn(confirmDialog.id, {
          onSuccess: () => {
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "delete":
        deleteStockIn(confirmDialog.id, {
          onSuccess: () => {
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
      navigate(`/stock/stock-ins/${id}`);
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
        <title>Phiếu nhập kho | Print Production ERP</title>
        <meta name="description" content="Quản lý phiếu nhập kho" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Standard Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quản lý nhập kho</h1>
              <p className="text-muted-foreground mt-1">Quản lý các phiếu nhập kho Chất liệu</p>
            </div>
            <Button
              onClick={() => navigate("/stock/stock-ins/create")}
              className="cursor-pointer transition-colors duration-200 bg-gradient-to-r from-[#93631F] to-[#7a521a] hover:opacity-90 shadow-lg shadow-[#93631F]/25 text-white border-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo phiếu nhập kho
            </Button>
          </div>

          <div className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm theo mã phiếu, nhà cung cấp..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-11 transition-colors duration-200"
                  />
                </div>
                <DateRangePicker 
                  value={dateRange} 
                  onValueChange={(r) => {
                    setDateRange(r);
                    setPage(1);
                  }} 
                />
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(v) => {
                    setTypeFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 cursor-pointer transition-colors duration-200">
                    <SelectValue placeholder="Loại phiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="purchase">Mua hàng</SelectItem>
                    <SelectItem value="production_completion">
                      Hoàn thành SX
                    </SelectItem>
                    <SelectItem value="return">Trả hàng</SelectItem>
                    <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={vendorFilter || "all"}
                  onValueChange={(v) => {
                    setVendorFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 cursor-pointer transition-colors duration-200">
                    <SelectValue placeholder="Nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả NCC</SelectItem>
                    {vendorsData?.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        {vendor.name || vendor.code}
                      </SelectItem>
                    ))}
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
              ) : stockIns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-16 w-16 rounded-full bg-[#93631F]/10 flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-[#93631F]" />
                  </div>
                  <p className="text-slate-600 font-medium">
                    Không có phiếu nhập kho nào
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Tạo phiếu nhập kho mới để bắt đầu
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
                            Nhà cung cấp/Nguồn nhập
                          </TableHead>
                          <TableHead className="w-[120px] font-semibold text-slate-700">
                            Loại phiếu
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
                          <TableHead className="text-center font-semibold text-slate-700">
                            Trạng thái
                          </TableHead>
                           <TableHead className="w-[220px] text-right font-semibold text-slate-700">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockIns.map((stockIn) => (
                          <TableRow
                            key={stockIn.id}
                            className="group cursor-pointer hover:bg-[#93631F]/5 transition-colors duration-200 border-b border-slate-100"
                            onClick={() => handleViewDetails(stockIn.id)}
                          >
                            <TableCell className="font-medium font-mono text-sm">
                              {stockIn.code || `PNK-${stockIn.id}`}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {stockIn.stockInDate
                                ? formatDate(stockIn.stockInDate)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-700">
                              {stockIn.supplier?.name || stockIn.vendorName || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {stockIn.type === "purchase"
                                ? "Mua hàng"
                                : stockIn.type === "production_completion"
                                  ? "Hoàn thành SX"
                                  : stockIn.type === "return"
                                    ? "Trả hàng"
                                    : stockIn.type === "adjustment"
                                      ? "Điều chỉnh"
                                      : stockIn.type || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {stockIn.warehouse || stockIn.warehouseName || "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-slate-700">
                              {stockIn.totalQuantity
                                ? stockIn.totalQuantity.toLocaleString("vi-VN")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-slate-700">
                              {stockIn.totalValue
                                ? formatCurrency(stockIn.totalValue)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(stockIn.status)}
                             </TableCell>
                             <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                               <div className="flex items-center justify-end gap-2">
                                 {stockIn.status !== "completed" &&
                                   stockIn.status !== "cancelled" && (
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleComplete(stockIn.id);
                                       }}
                                       className="h-8 border-emerald-500/30 hover:border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 font-medium text-xs rounded-md shadow-sm cursor-pointer"
                                     >
                                       <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                                       Hoàn thành
                                     </Button>
                                   )}
                                 {stockIn.status !== "cancelled" && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleCancel(stockIn.id);
                                     }}
                                     className="h-8 border-red-200 hover:border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium text-xs rounded-md shadow-sm cursor-pointer"
                                   >
                                     <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
                                     Hủy
                                   </Button>
                                 )}
                               </div>
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
