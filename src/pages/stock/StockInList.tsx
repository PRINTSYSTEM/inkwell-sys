import { useState, useMemo } from "react";
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
  DollarSign,
} from "lucide-react";
import { StockInDetailDialog } from "./components/StockInDetailDialog";
import { CreateOtherExpenseLiabilityDialog } from "./components/CreateOtherExpenseLiabilityDialog";
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
  const [typeFilter, setTypeFilter] = useState<string>("purchase");
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [vendorFilter, setVendorFilter] = useState<string>("");

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("purchase");
    setItemTypeFilter("");
    setVendorFilter("");
    setStatusFilter("");
    setDateRange(undefined);
    setPage(1);
  };

  const { data: vendorsData } = useActiveVendors();

  const { data, isLoading, refetch } = useStockIns({
    pageNumber: page,
    pageSize,
    search: debouncedSearchTerm || undefined,
    type: typeFilter === "all" ? undefined : typeFilter || "purchase",
    status: statusFilter === "all" ? undefined : statusFilter || undefined,
    itemType: itemTypeFilter || undefined,
  });

  const { mutate: deleteStockIn } = useDeleteStockIn();
  const { mutate: completeStockIn } = useCompleteStockIn();
  const { mutate: cancelStockIn } = useCancelStockIn();

  const rawStockIns = data?.items || [];
  const stockIns = useMemo(() => {
    return rawStockIns.filter((stockIn: any) => {
      if (typeFilter === "purchase" || typeFilter === "") {
        const typeStr = (stockIn.type || stockIn.purpose || stockIn.typeCode || "").toLowerCase();
        if (
          typeStr === "production_completion" ||
          typeStr === "production" ||
          typeStr === "from_production" ||
          typeStr === "from_lsx" ||
          Boolean(stockIn.productionOrderId)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rawStockIns, typeFilter]);

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

  const [selectedStockInId, setSelectedStockInId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOtherExpenseOpen, setIsCreateOtherExpenseOpen] = useState(false);

  const handleExportExcel = async () => {
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleViewDetails = (id: number | undefined) => {
    if (id) {
      setSelectedStockInId(id);
      setIsDetailOpen(true);
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

      <div className="h-full flex flex-col space-y-2.5 overflow-hidden">
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Nhập Kho</h1>
            <p className="text-muted-foreground text-xs">Danh sách phiếu nhập kho nguyên vật liệu và thành phẩm</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate("/stock/stock-ins/create")}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo phiếu nhập kho
            </Button>
            <Button
              onClick={() => setIsCreateOtherExpenseOpen(true)}
              variant="outline"
              className="h-8 text-xs border-amber-300 bg-amber-50/60 hover:bg-amber-100 text-amber-900 gap-1.5 font-semibold"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Nhập công nợ chi phí khác
            </Button>
          </div>
        </div>

        {/* COMPACT TOOLBAR FILTERS ROW */}
        <div className="shrink-0 flex flex-col xl:flex-row items-center justify-between gap-2.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/50 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto flex-1">
              {/* Search Text */}
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm theo mã phiếu, nhà cung cấp..."
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
              <div className="w-full sm:w-[170px]">
                <Select
                  value={typeFilter || "purchase"}
                  onValueChange={(v) => {
                    setTypeFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer font-medium">
                    <SelectValue placeholder="Loại phiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Nhập từ NCC (Mua hàng)</SelectItem>
                    <SelectItem value="all">Tất cả loại phiếu</SelectItem>
                    <SelectItem value="production_completion">
                      Hoàn thành SX
                    </SelectItem>
                    <SelectItem value="return">Trả hàng</SelectItem>
                    <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vendor Selector */}
              <div className="w-full sm:w-[150px]">
                <Select
                  value={vendorFilter || "all"}
                  onValueChange={(v) => {
                    setVendorFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer">
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

              {/* Item Type Selector */}
              <div className="w-full sm:w-[150px]">
                <Select
                  value={itemTypeFilter || "all"}
                  onValueChange={(v) => {
                    setItemTypeFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer">
                    <SelectValue placeholder="Dạng vật tư" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vật tư</SelectItem>
                    <SelectItem value="material">Chất liệu / Vật tư chính</SelectItem>
                    <SelectItem value="auxiliary">Vật tư phụ trợ</SelectItem>
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

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Xuất Excel
              </Button>

              {/* Reset Button */}
              {(search || typeFilter || vendorFilter || statusFilter || dateRange) && (
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
            <Card className="flex-1 min-h-0 flex flex-col border-slate-200/60 shadow-md rounded-xl overflow-hidden bg-white">
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
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
                    <div className="flex-1 min-h-0 overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-100/90 backdrop-blur-sm z-10">
                          <TableRow className="border-b border-slate-200/60 whitespace-nowrap">
                            <TableHead className="w-[140px] font-semibold text-slate-700">
                              Số phiếu
                            </TableHead>
                            <TableHead className="w-[120px] font-semibold text-slate-700">
                              Ngày
                            </TableHead>
                            <TableHead className="min-w-[160px] font-semibold text-slate-700">
                              Nhà cung cấp
                            </TableHead>
                            <TableHead className="min-w-[220px] font-semibold text-slate-700">
                              Vật phẩm
                            </TableHead>
                            <TableHead className="w-[60px] font-semibold text-slate-700">
                              ĐVT
                            </TableHead>
                            <TableHead className="w-[100px] text-right font-semibold text-slate-700">
                              Đơn giá
                            </TableHead>
                            <TableHead className="w-[100px] font-semibold text-slate-700">
                              Mã bài
                            </TableHead>
                            <TableHead className="w-[120px] text-right font-semibold text-slate-700">
                              Tiền công
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
                            <TableHead className="w-[110px] text-right font-semibold text-slate-700">Thao tác</TableHead>
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
                              <TableCell className="text-sm text-slate-700">
                                <div className="space-y-1">
                                  {stockIn.items && stockIn.items.length > 0 ? (
                                    stockIn.items.map((item: any, idx: number) => (
                                      <div key={idx} className="break-words whitespace-normal" title={item.itemName || item.materialName || "—"}>
                                        {item.itemName || item.materialName || "—"}
                                      </div>
                                    ))
                                  ) : (
                                    "—"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                <div className="space-y-1">
                                  {stockIn.items && stockIn.items.length > 0 ? (
                                    stockIn.items.map((item: any, idx: number) => (
                                      <div key={idx}>
                                        {item.unit || "—"}
                                      </div>
                                    ))
                                  ) : (
                                    "—"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                                <div className="space-y-1">
                                  {stockIn.items && stockIn.items.length > 0 ? (
                                    stockIn.items.map((item: any, idx: number) => (
                                      <div key={idx}>
                                        {item.unitPrice != null ? formatCurrency(item.unitPrice) : "—"}
                                      </div>
                                    ))
                                  ) : (
                                    "—"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                <div className="space-y-1">
                                  {stockIn.items && stockIn.items.length > 0 ? (
                                    stockIn.items.map((item: any, idx: number) => (
                                      <div key={idx} className="font-mono text-xs">
                                        {item.proofingOrderId || "—"}
                                      </div>
                                    ))
                                  ) : (
                                    "—"
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums text-slate-600">
                                {stockIn.laborCost != null
                                  ? formatCurrency(stockIn.laborCost)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums text-slate-700">
                                <div>
                                  {stockIn.totalQuantity
                                    ? stockIn.totalQuantity.toLocaleString("vi-VN")
                                    : "—"}
                                </div>
                                {(() => {
                                  const totalRam = stockIn.items?.reduce((sum: number, item: any) => sum + (item.ramQuantity || 0), 0) || 0;
                                  if (totalRam > 0) {
                                    return (
                                      <div className="text-[13px] text-slate-400 font-normal">
                                        {totalRam.toLocaleString("vi-VN")} gram
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums text-slate-700">
                                {stockIn.totalAmount != null
                                  ? formatCurrency(stockIn.totalAmount)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                {getStatusBadge(stockIn.status)}
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col items-end gap-1">
                                  {stockIn.status !== "completed" &&
                                    stockIn.status !== "cancelled" && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleComplete(stockIn.id);
                                        }}
                                        className="h-7 w-[90px] bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-[11px] rounded-md shadow-sm cursor-pointer justify-center"
                                      >
                                        Hoàn thành
                                      </Button>
                                    )}
                                  {stockIn.status !== "cancelled" && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancel(stockIn.id);
                                      }}
                                      className="h-7 w-[90px] bg-red-600 hover:bg-red-700 text-white font-medium text-[11px] rounded-md shadow-sm cursor-pointer justify-center"
                                    >
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
                    <div className="shrink-0 flex items-center justify-between p-2.5 border-t border-slate-200/60 bg-slate-50/50">
                      <div className="text-xs text-slate-600">
                        Trang <span className="font-semibold">{page}</span> /{" "}
                        <span className="font-semibold">{totalPages}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="h-7 text-xs px-2.5 cursor-pointer"
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
                          className="h-7 text-xs px-2.5 cursor-pointer"
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

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${confirmDialog.confirmVariant === "destructive"
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
              className={`cursor-pointer transition-colors duration-200 text-white ${confirmDialog.confirmVariant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/25"
                  : "bg-[#93631F] hover:bg-[#7a521a] shadow-[#93631F]/25"
                }`}
            >
              {confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock In Detail Popup Dialog */}
      <StockInDetailDialog
        stockInId={selectedStockInId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Create Other Expense Liability Dialog */}
      <CreateOtherExpenseLiabilityDialog
        open={isCreateOtherExpenseOpen}
        onOpenChange={setIsCreateOtherExpenseOpen}
      />
    </>
  );
}
