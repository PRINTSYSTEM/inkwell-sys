import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useReportExports, useDownloadReportExport } from "@/hooks/use-report-export";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { ReportExportResponse } from "@/Schema/report.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function ReportExportListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportCodeFilter, setReportCodeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: reportsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useReportExports({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    reportCode: reportCodeFilter !== "all" ? reportCodeFilter : undefined,
    search: searchQuery || undefined,
  });

  const { download, loading: isDownloading } = useDownloadReportExport();

  const handleDownload = async (id: number, fileName?: string | null) => {
    try {
      await download(id, fileName || undefined);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleViewReport = (report: ReportExportResponse) => {
    // Navigate to the report page with saved filters
    if (report.filterJson) {
      try {
        const filters = JSON.parse(report.filterJson);
        // Navigate based on reportCode
        const reportCode = report.reportCode || "";
        if (reportCode.includes("sales")) {
          // Navigate to sales report with filters
          const params = new URLSearchParams();
          if (filters.fromDate) params.append("fromDate", filters.fromDate);
          if (filters.toDate) params.append("toDate", filters.toDate);
          // Add more filters as needed
          navigate(`/reports/sales/by-period?${params.toString()}`);
        } else if (reportCode.includes("ar")) {
          navigate(`/accounting/ar/summary?${new URLSearchParams(filters).toString()}`);
        } else if (reportCode.includes("ap")) {
          navigate(`/accounting/ap/summary?${new URLSearchParams(filters).toString()}`);
        }
      } catch (error) {
        toast.error("Không thể xem lại báo cáo với filter đã lưu");
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Báo cáo đã xuất | Print Production ERP</title>
        <meta
          name="description"
          content="Danh sách các báo cáo đã xuất"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Báo cáo đã xuất
            </h1>
            <p className="text-muted-foreground">
              Danh sách các báo cáo đã xuất trong hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên báo cáo, loại báo cáo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1">
            <DateRangePicker value={dateRange} onValueChange={setDateRange} />
          </div>
          <Select
            value={reportCodeFilter}
            onValueChange={setReportCodeFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Loại báo cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="sales">Báo cáo bán hàng</SelectItem>
              <SelectItem value="ar">Công nợ phải thu</SelectItem>
              <SelectItem value="ap">Công nợ phải trả</SelectItem>
              <SelectItem value="inventory">Báo cáo tồn kho</SelectItem>
              <SelectItem value="expense">Báo cáo chi phí</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã báo cáo</TableHead>
                <TableHead>Loại báo cáo</TableHead>
                <TableHead>Tên báo cáo</TableHead>
                <TableHead className="text-center">Ngày xuất</TableHead>
                <TableHead>Người xuất</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Kích thước</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !reportsData?.items || reportsData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy báo cáo nào.
                  </TableCell>
                </TableRow>
              ) : (
                reportsData.items.map((report) => (
                  <TableRow key={report.id} className="group">
                    <TableCell className="font-medium font-mono text-sm">
                      {report.reportCode || `#${report.id}`}
                    </TableCell>
                    <TableCell>
                      {report.reportCode
                        ? report.reportCode
                            .split("-")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {report.reportName || report.fileName || "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {report.exportedAt
                        ? formatDateTime(report.exportedAt)
                        : "—"}
                    </TableCell>
                    <TableCell>{report.exportedByName || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          report.status === "completed" ||
                          report.status === "success"
                            ? "default"
                            : report.status === "failed" ||
                              report.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {report.status === "completed" ||
                        report.status === "success"
                          ? "Hoàn thành"
                          : report.status === "failed" ||
                            report.status === "error"
                            ? "Lỗi"
                            : report.status === "processing"
                              ? "Đang xử lý"
                              : report.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {report.fileSize
                        ? `${(report.fileSize / 1024).toFixed(2)} KB`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {report.filterJson && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xem lại báo cáo với filter đã lưu"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {(report.status === "completed" ||
                          report.status === "success") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(report.id, report.fileName)
                            }
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Tải
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {reportsData && reportsData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {reportsData.totalPages} (
              {reportsData.total} báo cáo)
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
                {currentPage} / {reportsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(reportsData.totalPages, p + 1))
                }
                disabled={currentPage === reportsData.totalPages || isLoading}
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

