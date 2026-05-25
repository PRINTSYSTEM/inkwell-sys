import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  RefreshCw,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Maximize2,
  Layers,
  Boxes,
  Tag,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useMaterial, useMaterialHistory } from "@/hooks/use-material";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import type { DateRange } from "react-day-picker";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function MaterialHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const materialId = id ? parseInt(id, 10) : null;
  const isNumericId = materialId !== null && !isNaN(materialId);

  // States
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // API Queries
  const { 
    data: materialDetail, 
    isLoading: isLoadingMaterial,
    isError: isErrorMaterial,
    error: errorMaterial,
  } = useMaterial(
    isNumericId ? materialId : null,
    isNumericId
  );

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory,
    refetch: refetchHistory,
  } = useMaterialHistory(
    isNumericId ? materialId : null,
    {
      pageNumber: currentPage,
      pageSize: 10,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      transactionType: transactionType === "all" ? undefined : transactionType,
    },
    isNumericId
  );

  const isLoading = isLoadingMaterial || isLoadingHistory;
  const isError = isErrorMaterial || isErrorHistory;
  const error = errorMaterial || errorHistory;

  // Local Client-side Filtering for search query
  const filteredItems = useMemo(() => {
    if (!historyData?.items) return [];
    if (!searchQuery) return historyData.items;
    const query = searchQuery.toLowerCase();
    return historyData.items.filter(
      (entry) =>
        (entry.referenceCode || "").toLowerCase().includes(query) ||
        (entry.note || "").toLowerCase().includes(query) ||
        (entry.createdByName || "").toLowerCase().includes(query) ||
        (entry.referenceType || "").toLowerCase().includes(query)
    );
  }, [historyData?.items, searchQuery]);

  // Total summary statistics computed from returned data
  const summaryStats = useMemo(() => {
    if (!historyData?.items) return { totalIn: 0, totalOut: 0 };
    let totalIn = 0;
    let totalOut = 0;
    historyData.items.forEach((item) => {
      if (item.transactionType === "StockIn") {
        totalIn += item.quantity || 0;
      } else if (item.transactionType === "StockOut") {
        totalOut += item.quantity || 0;
      }
    });
    return { totalIn, totalOut };
  }, [historyData?.items]);

  const handleVoucherClick = (
    voucherType: string | null | undefined,
    voucherId: number | null | undefined
  ) => {
    if (!voucherId) return;

    const voucherTypeLower = voucherType?.toLowerCase() || "";
    if (
      voucherTypeLower.includes("stockin") ||
      voucherTypeLower === "stockin" ||
      voucherTypeLower.includes("nhap")
    ) {
      navigate(`/stock/stock-ins/${voucherId}`);
    } else if (
      voucherTypeLower.includes("stockout") ||
      voucherTypeLower === "stockout" ||
      voucherTypeLower.includes("xuat")
    ) {
      navigate(`/stock/stock-outs/${voucherId}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Lịch sử vật tư | Print Production ERP</title>
        <meta name="description" content="Chi tiết lịch sử nhập xuất nguyên vật liệu" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/stock/summary")}
              className="shrink-0 border-slate-200 h-9 w-9 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5 text-slate-600" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-800">
                  Lịch sử vật tư: {materialDetail?.name || "—"}
                </h1>
                <Badge variant="outline" className="font-mono text-xs rounded-lg border-slate-200 bg-slate-50/50">
                  ID: #{materialId}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kho: Chính | Đơn vị tính: {materialDetail?.unit || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onValueChange={(val) => {
                setDateRange(val);
                setCurrentPage(1);
              }}
              className="w-[280px]"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
              onClick={() => {
                refetchHistory();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoadingHistory ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Specifications Card */}
        {materialDetail && (
          <Card className="shadow-sm border border-slate-200/60 rounded-2xl overflow-hidden bg-gradient-to-r from-amber-500/[0.015] to-emerald-500/[0.015]">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <Boxes className="h-4.5 w-4.5 text-[#93631F]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Thông số kỹ thuật & Chi tiết vật tư
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tên vật tư
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{materialDetail.name || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Phân loại
                </span>
                <div>
                  <Badge variant="secondary" className="font-medium text-xs bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-md border-none px-2 py-0.5">
                    {materialDetail.materialTypeName || "—"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" /> Quy cách khổ (LxWxH)
                </span>
                <p className="text-sm font-semibold font-mono text-slate-800">
                  {materialDetail.length || "—"}
                  {materialDetail.width ? ` x ${materialDetail.width}` : ""}
                  {materialDetail.height ? ` x ${materialDetail.height}` : ""}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <User className="h-3 w-3" /> Người khởi tạo / Ngày tạo
                </span>
                <p className="text-xs font-semibold text-slate-700">
                  {materialDetail.createdBy || "Thủ kho"} - {materialDetail.createdAt ? new Date(materialDetail.createdAt).toLocaleDateString("vi-VN") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-955 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">Lỗi tải dữ liệu</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {error instanceof Error
                ? error.message
                : "Không thể lấy thông tin lịch sử từ máy chủ. Vui lòng kiểm tra lại kết nối mạng."}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats Overview */}
        {historyData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số lượt giao dịch</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{historyData.total || "0"}</p>
              </div>
            </div>

            <div className="bg-emerald-500/[0.03] p-4 rounded-2xl border border-emerald-500/10 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">Tổng nhập trong kỳ</p>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">
                  {summaryStats.totalIn.toLocaleString()} <span className="text-xs text-emerald-600/80 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>

            <div className="bg-rose-500/[0.03] p-4 rounded-2xl border border-rose-500/10 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80">Tổng xuất trong kỳ</p>
                <p className="text-lg font-bold text-rose-700 mt-0.5">
                  {summaryStats.totalOut.toLocaleString()} <span className="text-xs text-rose-600/80 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Transaction Type Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo mã chứng từ, ghi chú diễn giải..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-xl border-slate-200/80 h-10 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <Select
            value={transactionType}
            onValueChange={(val) => {
              setTransactionType(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-slate-200/80 h-10 text-xs focus:ring-emerald-500 cursor-pointer">
              <SelectValue placeholder="Chọn loại giao dịch" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs cursor-pointer">Tất cả giao dịch</SelectItem>
              <SelectItem value="StockIn" className="text-xs cursor-pointer text-emerald-600 font-semibold">Nhập kho (Stock In)</SelectItem>
              <SelectItem value="StockOut" className="text-xs cursor-pointer text-rose-600 font-semibold">Xuất kho (Stock Out)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction History Ledger Table */}
        <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200/60 text-xs">
                <TableHead className="font-bold py-3 pl-4">Ngày giờ</TableHead>
                <TableHead className="font-bold py-3">Số chứng từ</TableHead>
                <TableHead className="font-bold py-3">Diễn giải giao dịch</TableHead>
                <TableHead className="text-right font-bold py-3">Số lượng Nhập</TableHead>
                <TableHead className="text-right font-bold py-3">Số lượng Xuất</TableHead>
                <TableHead className="text-right font-bold py-3">Tồn cuối</TableHead>
                <TableHead className="font-bold py-3 pr-4">Loại giao dịch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="py-4">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-slate-400 text-xs font-semibold py-8"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <TrendingUp className="h-8 w-8 text-slate-300" />
                      <p>Không có giao dịch nào được ghi nhận trong thời gian này.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((entry, index) => (
                  <TableRow
                    key={entry.id || index}
                    className="cursor-pointer hover:bg-emerald-100/50 border-b border-slate-100 text-xs transition-colors duration-150"
                    onClick={() =>
                      handleVoucherClick(entry.referenceType, entry.referenceId)
                    }
                  >
                    <TableCell className="py-3.5 pl-4 font-medium text-slate-600">
                      {entry.createdAt ? formatDateTime(entry.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-600">
                      {entry.referenceCode || `Giao dịch #${entry.id}`}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800 leading-normal">{entry.note || "—"}</div>
                        {entry.createdByName && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <User className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                            <span>Người làm phiếu: {entry.createdByName}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3.5 font-bold tabular-nums text-emerald-600">
                      {entry.transactionType === "StockIn" && entry.quantity !== undefined
                        ? entry.quantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right py-3.5 font-bold tabular-nums text-rose-600">
                      {entry.transactionType === "StockOut" && entry.quantity !== undefined
                        ? entry.quantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right py-3.5 font-extrabold tabular-nums text-slate-800">
                      {entry.newQuantity !== undefined
                        ? entry.newQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      {entry.referenceType === "StockIn" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-md border-none px-2 py-0.5 font-semibold text-[10px]">
                          Phiếu nhập
                        </Badge>
                      ) : entry.referenceType === "StockOut" ? (
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 rounded-md border-none px-2 py-0.5 font-semibold text-[10px]">
                          Phiếu xuất
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-md border-none px-2 py-0.5 font-semibold text-[10px]">
                          {entry.referenceType || "Điều chỉnh"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {historyData && historyData.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs font-semibold text-slate-400">
              Trang {currentPage} / {historyData.totalPages} (Tổng số {historyData.total} giao dịch)
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer font-bold text-xs"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
                Trước
              </Button>
              <span className="text-xs font-bold text-slate-700 px-2.5">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer font-bold text-xs"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(historyData.totalPages, p + 1)
                  )
                }
                disabled={currentPage === historyData.totalPages || isLoading}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
