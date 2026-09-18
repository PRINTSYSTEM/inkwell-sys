import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
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
import { Checkbox } from "@/components/ui/checkbox";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { useProductionDeliveryReport, useProductionDeliverySummary } from "@/hooks/use-production-timing";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX, normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";

const safeFormatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return dateStr;
  }
};

export function ProductionDeliveryReportTab() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [dueFromDate, setDueFromDate] = useState("");
  const [dueToDate, setDueToDate] = useState("");
  const [designTypeId, setDesignTypeId] = useState<string>("ALL");
  const [deliverySlaStatus, setDeliverySlaStatus] = useState<string>("ALL");
  const [lateOnly, setLateOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Design Types for filter
  const { data: designTypesData } = useDesignTypeList({ status: "active" });
  const designTypes = Array.isArray(designTypesData)
    ? designTypesData
    : (designTypesData as any)?.items || [];

  const queryParams = {
    pageNumber,
    pageSize,
    dueFromDate: dueFromDate || undefined,
    dueToDate: dueToDate || undefined,
    designTypeId: designTypeId === "ALL" ? undefined : Number(designTypeId),
    deliverySlaStatus: deliverySlaStatus === "ALL" ? undefined : deliverySlaStatus,
    lateOnly: lateOnly ? true : undefined,
    search: search.trim() || undefined,
  };

  const summaryParams = {
    dueFromDate: dueFromDate || undefined,
    dueToDate: dueToDate || undefined,
    designTypeId: designTypeId === "ALL" ? undefined : Number(designTypeId),
    deliverySlaStatus: deliverySlaStatus === "ALL" ? undefined : deliverySlaStatus,
    lateOnly: lateOnly ? true : undefined,
    search: search.trim() || undefined,
  };

  const {
    data: reportData,
    isLoading: isReportLoading,
  } = useProductionDeliveryReport(queryParams);

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
  } = useProductionDeliverySummary(summaryParams);

  const items = reportData?.items || [];
  const totalCount = reportData?.total ?? (reportData as any)?.totalCount ?? 0;
  const totalPages = reportData?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1);

  // Handle Export Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const normalized = normalizeParams(summaryParams);
      const response = await apiRequest.get(API_SUFFIX.PRODUCTION_DELIVERY_REPORT_EXCEL, {
        params: normalized,
        responseType: "blob",
      });

      const nowStr = format(new Date(), "yyyyMMdd_HHmmss");
      const defaultFilename = `Bao_Cao_SLA_Giao_Hang_${nowStr}.xlsx`;
      let filename = defaultFilename;

      const contentDisposition = response.headers?.["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Đã xuất Excel báo cáo SLA giao hàng thành công!");
    } catch (err: any) {
      console.error("Export Excel error", err);
      toast.error(err?.response?.data?.message || "Không thể xuất file Excel báo cáo");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleResetFilters = () => {
    setDueFromDate("");
    setDueToDate("");
    setDesignTypeId("ALL");
    setDeliverySlaStatus("ALL");
    setLateOnly(false);
    setSearch("");
    setPageNumber(1);
  };

  const renderSlaBadge = (status?: string | null) => {
    if (!status || status === "NOT_APPLIED") {
      return (
        <Badge className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none">
          🟢 Kịp tiến độ (Dự kiến)
        </Badge>
      );
    }
    if (status === "NORMAL") {
      return (
        <Badge className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none">
          🟢 Kịp tiến độ
        </Badge>
      );
    }
    if (status === "WARNING") {
      return (
        <Badge className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-none">
          🟡 Sắp đến hạn
        </Badge>
      );
    }
    if (status === "OVERDUE") {
      return (
        <Badge className="text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-none">
          🔴 Quá hạn
        </Badge>
      );
    }
    if (status === "ON_TIME") {
      return (
        <Badge className="text-[10px] font-bold bg-emerald-700 text-white border-none">
          ✅ Đúng hạn
        </Badge>
      );
    }
    if (status === "COMPLETED_LATE") {
      return (
        <Badge className="text-[10px] font-bold bg-rose-700 text-white border-none">
          🔴 Trễ hạn
        </Badge>
      );
    }
    return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-900/80 border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Tổng số LSX
              <Clock className="h-3.5 w-3.5 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-slate-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {summaryData?.total ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              Kịp tiến độ
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-emerald-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {summaryData?.normalCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200/80 dark:border-amber-800/50 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center justify-between">
              Sắp đến hạn
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-amber-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {summaryData?.warningCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-950/40 dark:to-rose-900/20 border-rose-200/80 dark:border-rose-800/50 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center justify-between">
              Quá hạn
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-rose-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-bold text-rose-700 dark:text-rose-300">
                {summaryData?.overdueCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100/60 dark:from-teal-950/40 dark:to-teal-900/20 border-teal-200/80 dark:border-teal-800/50 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-teal-700 dark:text-teal-400 flex items-center justify-between">
              Đúng hạn (KCS)
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-teal-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-bold text-teal-700 dark:text-teal-300">
                {summaryData?.onTimeCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/60 dark:from-red-950/40 dark:to-red-900/20 border-red-200/80 dark:border-red-800/50 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center justify-between">
              Trễ hạn (KCS)
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-red-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-bold text-red-700 dark:text-red-300">
                {summaryData?.completedLateCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200/80 dark:border-purple-800/50 shadow-2xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-purple-700 dark:text-purple-400 flex items-center justify-between">
              Tổng Vi Phạm KPI
              <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isSummaryLoading ? (
              <div className="h-7 w-12 bg-purple-200 animate-pulse rounded mt-1" />
            ) : (
              <div className="text-xl font-black text-purple-800 dark:text-purple-300">
                {summaryData?.totalViolated ?? ((summaryData?.overdueCount ?? 0) + (summaryData?.completedLateCount ?? 0))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Mã LSX, Bình bài..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPageNumber(1);
                  }}
                  className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Due From Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Hạn giao từ:</span>
                <Input
                  type="date"
                  value={dueFromDate}
                  onChange={(e) => {
                    setDueFromDate(e.target.value);
                    setPageNumber(1);
                  }}
                  className="h-8 text-xs w-36 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Due To Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Đến ngày:</span>
                <Input
                  type="date"
                  value={dueToDate}
                  onChange={(e) => {
                    setDueToDate(e.target.value);
                    setPageNumber(1);
                  }}
                  className="h-8 text-xs w-36 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Design Type Filter */}
              <div className="w-40">
                <Select
                  value={designTypeId}
                  onValueChange={(val) => {
                    setDesignTypeId(val);
                    setPageNumber(1);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Loại thiết kế" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Tất cả loại thiết kế</SelectItem>
                    {designTypes.map((dt: any) => (
                      <SelectItem key={dt.id} value={String(dt.id)} className="text-xs">
                        {dt.code ? `${dt.code} - ${dt.name}` : dt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery SLA Status Filter */}
              <div className="w-40">
                <Select
                  value={deliverySlaStatus}
                  onValueChange={(val) => {
                    setDeliverySlaStatus(val);
                    setPageNumber(1);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Trạng thái SLA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Tất cả SLA</SelectItem>
                    <SelectItem value="NORMAL" className="text-xs">🟢 Kịp tiến độ</SelectItem>
                    <SelectItem value="WARNING" className="text-xs">🟡 Sắp đến hạn</SelectItem>
                    <SelectItem value="OVERDUE" className="text-xs">🔴 Quá hạn</SelectItem>
                    <SelectItem value="ON_TIME" className="text-xs">✅ Đúng hạn</SelectItem>
                    <SelectItem value="COMPLETED_LATE" className="text-xs">🔴 Trễ hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Late Only Checkbox */}
              <div className="flex items-center gap-1.5 pl-1 cursor-pointer select-none">
                <Checkbox
                  id="lateOnly"
                  checked={lateOnly}
                  onCheckedChange={(checked) => {
                    setLateOnly(Boolean(checked));
                    setPageNumber(1);
                  }}
                />
                <label htmlFor="lateOnly" className="text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer">
                  Chỉ đơn trễ (Vi phạm)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs border-slate-200 text-slate-600"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Đặt lại
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
              >
                {isExportingExcel ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <Table className="text-xs">
          <TableHeader className="bg-slate-50 dark:bg-slate-950 border-b">
            <TableRow className="text-slate-700 dark:text-slate-300 font-bold">
              <TableHead className="w-24">Mã LSX</TableHead>
              <TableHead className="w-32">Mã Bình bài</TableHead>
              <TableHead className="w-36">Loại thiết kế</TableHead>
              <TableHead className="w-32 text-center">Trạng thái LSX</TableHead>
              <TableHead className="w-36">Hạn giao hàng</TableHead>
              <TableHead className="w-32 text-center">Trạng thái SLA</TableHead>
              <TableHead className="w-28 text-center">Giờ còn / Trễ</TableHead>
              <TableHead className="w-36">KCS Hoàn thành</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isReportLoading ? (
              <TableSkeleton cols={8} rows={6} rowHeight="h-12" />
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                  Không tìm thấy dữ liệu báo cáo SLA giao hàng phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row: any, idx: number) => {
                const remaining = row.deliveryRemainingHours;
                const late = row.deliveryLateHours;

                return (
                  <TableRow key={row.productionOrderId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <TableCell className="font-bold font-mono text-primary">
                      LSX-{row.productionOrderId}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {row.proofingOrderCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                      {row.designTypeName || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800">
                        {row.productionStatus || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {safeFormatDate(row.plannedDeliveryAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderSlaBadge(row.deliverySlaStatus)}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {late != null && late > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">Trễ +{late.toFixed(1)}h</span>
                      ) : remaining != null ? (
                        <span className={cn(remaining <= 12 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                          Còn {remaining.toFixed(1)}h
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 dark:text-slate-400">
                      {safeFormatDate(row.kcsCompletedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-bold text-slate-700 dark:text-slate-300">{items.length}</span> / <span className="font-bold text-slate-700 dark:text-slate-300">{totalCount}</span> lệnh
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="h-7 text-xs px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Trang trước
            </Button>
            <span className="font-mono px-2">
              {pageNumber} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              className="h-7 text-xs px-2"
            >
              Trang sau
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
