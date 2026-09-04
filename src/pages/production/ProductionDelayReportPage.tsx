import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { ProductionTimingBadge } from "@/components/production";
import { useProductionDelayReport, useProductionDelaySummary } from "@/hooks/use-production-timing";
import { cn } from "@/lib/utils";

const STEP_OPTIONS = [
  { value: "ALL", label: "Tất cả khâu" },
  { value: "dispatch", label: "Điều lệnh" },
  { value: "material_export", label: "Xuất vật tư" },
  { value: "print", label: "Lệnh in" },
  { value: "lamination", label: "Cán màng" },
  { value: "mounting", label: "Bồi" },
  { value: "pressing", label: "Ép kim" },
  { value: "die_cut", label: "Bế" },
  { value: "cut", label: "Cắt" },
  { value: "glue", label: "Dán" },
  { value: "packaging", label: "Đóng gói / KCS" },
];

const safeFormatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return dateStr;
  }
};

export default function ProductionDelayReportPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stepType, setStepType] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [search, setSearch] = useState("");

  const queryParams = {
    pageNumber,
    pageSize,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    stepType: stepType === "ALL" ? undefined : stepType,
    level: level === "ALL" ? undefined : level,
    search: search.trim() || undefined,
  };

  const summaryParams = {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    stepType: stepType === "ALL" ? undefined : stepType,
  };

  const { data: reportData, isLoading: isReportLoading, refetch: refetchReport } = useProductionDelayReport(queryParams);
  const { data: summaryData, isLoading: isSummaryLoading, refetch: refetchSummary } = useProductionDelaySummary(summaryParams);

  const items = reportData?.items || [];
  const totalCount = reportData?.total ?? (reportData as any)?.totalCount ?? 0;
  const totalPages = reportData?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1);

  const handleRefresh = () => {
    refetchReport();
    refetchSummary();
  };

  return (
    <div className="p-4 md:p-6 space-y-3.5 max-w-7xl mx-auto flex flex-col h-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Báo cáo LSX trễ tiến độ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhật ký ghi nhận tự động và thống kê trễ các công đoạn sản xuất.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRefresh}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 shrink-0">
        <Card className="bg-amber-500/10 border-amber-300/50 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Cảnh báo vàng
              </p>
              <h3 className="text-xl font-black text-amber-900 dark:text-amber-100 mt-0.5">
                {isSummaryLoading ? "..." : (summaryData?.warningCount ?? 0)}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/20 text-amber-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-300/50 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
                Quá hạn đỏ
              </p>
              <h3 className="text-xl font-black text-red-900 dark:text-red-100 mt-0.5">
                {isSummaryLoading ? "..." : (summaryData?.lateCount ?? 0)}
              </h3>
            </div>
            <div className="p-2 bg-red-500/20 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-300/50 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Đã giải quyết
              </p>
              <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
                {isSummaryLoading ? "..." : (summaryData?.resolvedCount ?? 0)}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/20 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-100 dark:bg-slate-800 border shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Trễ trung bình
              </p>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {isSummaryLoading ? "..." : `${(summaryData?.averageLateHours ?? 0).toFixed(1)}h`}
              </h3>
            </div>
            <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-100 dark:bg-slate-800 border shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Trễ lớn nhất
              </p>
              <h3 className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">
                {isSummaryLoading ? "..." : `${(summaryData?.maxLateHours ?? 0).toFixed(1)}h`}
              </h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-2xs shrink-0">
        <CardContent className="p-2.5 px-3 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 font-bold text-xs text-slate-700 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </div>

          <div className="relative min-w-[150px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <Input
              placeholder="Mã bài..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Select
            value={stepType}
            onValueChange={(v) => {
              setStepType(v);
              setPageNumber(1);
            }}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Chọn khâu" />
            </SelectTrigger>
            <SelectContent>
              {STEP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={level}
            onValueChange={(v) => {
              setLevel(v);
              setPageNumber(1);
            }}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Chọn mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả mức độ</SelectItem>
              <SelectItem value="warning" className="text-xs font-semibold text-amber-600">Vàng (Cảnh báo)</SelectItem>
              <SelectItem value="late" className="text-xs font-bold text-red-600">Đỏ (Quá hạn)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>Từ:</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPageNumber(1);
              }}
              className="h-8 text-xs w-[130px]"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>Đến:</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPageNumber(1);
              }}
              className="h-8 text-xs w-[130px]"
            />
          </div>

          {(search || stepType !== "ALL" || level !== "ALL" || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStepType("ALL");
                setLevel("ALL");
                setFromDate("");
                setToDate("");
                setPageNumber(1);
              }}
              className="h-8 text-xs text-slate-500 hover:text-slate-900"
            >
              Xóa lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="shadow-xs flex-1 min-h-0 flex flex-col">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
              <TableRow className="uppercase text-[10.5px] font-bold text-slate-600">
                <TableHead className="w-[120px]">Mã Bình Bài</TableHead>
                <TableHead className="w-[110px]">Khâu sản xuất</TableHead>
                <TableHead className="w-[100px]">Mức độ</TableHead>
                <TableHead className="w-[130px]">Mốc bắt đầu</TableHead>
                <TableHead className="w-[130px]">Hạn chót</TableHead>
                <TableHead className="w-[100px] text-right">Đã trôi qua</TableHead>
                <TableHead className="w-[130px]">Lần đầu ghi nhận</TableHead>
                <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isReportLoading ? (
                <TableSkeleton cols={8} rows={5} />
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    Không tìm thấy nhật ký trễ tiến độ nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => {
                  const isLate = row.level === "late";
                  const isResolved = !!row.resolvedAt;

                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/80 text-xs">
                      <TableCell className="font-mono font-bold text-slate-900">
                        {row.proofingOrderCode || `LSX #${row.productionOrderId}`}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {row.stepTypeName || row.stepType}
                      </TableCell>
                      <TableCell>
                        <ProductionTimingBadge timingStatus={row.level} variant="pill" showTooltip={false} />
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">
                        {safeFormatDate(row.referenceAt)}
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">
                        {safeFormatDate(row.dueAt)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-right text-slate-900">
                        {row.elapsedHours != null ? `${row.elapsedHours.toFixed(1)}h` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-slate-500">
                        {safeFormatDate(row.firstSeenAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isResolved ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-[9.5px]">
                            Đã giải quyết
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={cn("font-bold text-[9.5px]", isLate ? "bg-red-50 text-red-700 border-red-300" : "bg-amber-50 text-amber-700 border-amber-300")}>
                            Đang cảnh báo
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Footer */}
        <div className="p-3 border-t flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="text-xs text-slate-500">
            Hiển thị <strong className="font-semibold text-slate-900">{items.length}</strong> / <strong className="font-semibold text-slate-900">{totalCount}</strong> kết quả
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1 || isReportLoading}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Trước
            </Button>
            <span className="text-xs font-semibold px-2">
              Trang {pageNumber} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={pageNumber >= totalPages || isReportLoading}
            >
              Sau
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
