import React, { useMemo, useState, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  TrendingDown,
  UserCheck,
  Zap,
} from "lucide-react";
import { useDefectSummaryByUser } from "@/hooks/use-defect-record";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";

const DEFECT_SOURCES = [
  { value: "design", label: "Lỗi do thiết kế" },
  { value: "proofing", label: "Lỗi do bình bài" },
  { value: "production", label: "Lỗi do sản xuất" },
  { value: "management_decision", label: "Quyết định quản lý" },
];

export default function DefectReportPage() {
  // Filters: default from first day of month to today
  const [fromDate, setFromDate] = useState<string>(() => {
    const start = startOfMonth(new Date());
    return format(start, "yyyy-MM-dd");
  });
  
  const [toDate, setToDate] = useState<string>(() => {
    return format(new Date(), "yyyy-MM-dd");
  });

  const [defectSource, setDefectSource] = useState<string>("all");

  // Query parameters memoized
  const queryParams = useMemo(() => {
    const params: { fromDate?: string; toDate?: string; defectSource?: string } = {};
    if (fromDate) {
      // Set to start of day in local time, format to ISO string
      params.fromDate = new Date(fromDate + "T00:00:00").toISOString();
    }
    if (toDate) {
      // Set to end of day in local time, format to ISO string
      params.toDate = new Date(toDate + "T23:59:59").toISOString();
    }
    if (defectSource && defectSource !== "all") {
      params.defectSource = defectSource;
    }
    return params;
  }, [fromDate, toDate, defectSource]);

  // Fetch defect summary data
  const {
    data: summaryData = [],
    isLoading,
    isRefetching,
    refetch,
  } = useDefectSummaryByUser(queryParams, !!fromDate && !!toDate);

  // Stats calculations
  const stats = useMemo(() => {
    let totalRecords = 0;
    let totalQty = 0;
    let worstUser: { name: string; count: number } | null = null;

    summaryData.forEach((u) => {
      const records = u.totalDefectRecords ?? 0;
      const qty = u.totalDefectQuantity ?? 0;
      totalRecords += records;
      totalQty += qty;

      if (!worstUser || qty > worstUser.count) {
        worstUser = {
          name: u.userName || u.userId?.toString() || "N/A",
          count: qty,
        };
      }
    });

    return { totalRecords, totalQty, worstUser };
  }, [summaryData]);

  // Export CSV/Excel with UTF-8 BOM
  const handleExportExcel = () => {
    if (summaryData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const headers = [
      "Tên Nhân Viên",
      "Vai Trò",
      "Số Lần Bị Lỗi",
      "Tổng Số Lượng Lỗi",
      "Do Thiết Kế",
      "Do Bình Bài",
      "Do Sản Xuất",
      "Quyết Định Quản Lý",
    ];

    const rows = summaryData.map((u) => [
      u.userName || `ID: ${u.userId}`,
      u.userRole || "",
      u.totalDefectRecords ?? 0,
      u.totalDefectQuantity ?? 0,
      u.bySource?.design ?? 0,
      u.bySource?.proofing ?? 0,
      u.bySource?.production ?? 0,
      u.bySource?.managementDecision ?? 0,
    ]);

    const csvContent =
      "\ufeff" + // UTF-8 BOM
      [
        headers.join(","),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bao-cao-loi-tru-luong-${fromDate}-den-${toDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4 space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Báo cáo lỗi </h1>
            <p className="text-sm text-muted-foreground">
              Báo cáo tổng hợp lỗi 
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Tải lại
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportExcel}
              disabled={isLoading || summaryData.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="shrink-0 shadow-sm border bg-card">
          <CardContent className="py-4 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Từ ngày */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Từ ngày <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 bg-background"
                  required
                />
              </div>

              {/* Đến ngày */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Đến ngày <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 bg-background"
                  required
                />
              </div>

              {/* Nguồn lỗi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Nguồn lỗi</Label>
                <Select value={defectSource} onValueChange={setDefectSource}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nguồn lỗi</SelectItem>
                    {DEFECT_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          <Card className="shadow-sm border bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tổng số lần bị lỗi</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? "-" : stats.totalRecords}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tổng số lượng lỗi</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? "-" : stats.totalQty}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Số lượng lỗi cao nhất</p>
                <p className="text-base font-bold text-blue-900 truncate">
                  {isLoading ? "-" : stats.worstUser ? `${stats.worstUser.name} (${stats.worstUser.count})` : "Không có"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Table Card */}
        <Card className="flex-1 min-h-0 flex flex-col shadow-sm border overflow-hidden">
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Đang tổng hợp báo cáo lỗi...</span>
              </div>
            ) : summaryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center bg-muted/10">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Không có dữ liệu báo cáo</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Không tìm thấy bản ghi lỗi nào trong khoảng thời gian đã chọn.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-bold">Tên Nhân Viên</TableHead>
                    <TableHead className="w-[120px] font-bold">Vai Trò</TableHead>
                    <TableHead className="w-[120px] text-center font-bold">Số Lần Bị Lỗi</TableHead>
                    <TableHead className="w-[150px] text-center font-bold bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400">
                      Tổng Số Lượng Lỗi
                    </TableHead>
                    <TableHead className="w-[120px] text-center font-bold">Do Thiết Kế</TableHead>
                    <TableHead className="w-[120px] text-center font-bold">Do Bình Bài</TableHead>
                    <TableHead className="w-[120px] text-center font-bold">Do Sản Xuất</TableHead>
                    <TableHead className="w-[150px] text-center font-bold">Quyết Định QL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.map((userRow) => (
                    <TableRow key={userRow.userId} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">
                        {userRow.userName || `ID: ${userRow.userId}`}
                      </TableCell>
                      <TableCell className="capitalize text-xs text-muted-foreground">
                        {userRow.userRole || "Chưa xác định"}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {userRow.totalDefectRecords ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-bold bg-red-50/30 dark:bg-red-950/5 text-red-600 dark:text-red-400">
                        {userRow.totalDefectQuantity ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {userRow.bySource?.design ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {userRow.bySource?.proofing ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-orange-600 font-medium">
                        {userRow.bySource?.production ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {userRow.bySource?.managementDecision ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
