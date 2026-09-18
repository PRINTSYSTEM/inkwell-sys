import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Layers,
  Users,
  Search,
  RefreshCw,
  FileCheck,
  Target,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  useKpiReport,
  useKpiDrilldown,
  useKpiTrend,
  KpiGroupBy,
  KpiReportItem,
} from "@/hooks/use-kpi";

export default function ProductionKpiReportPage() {
  const defaultToDate = format(new Date(), "yyyy-MM-dd");
  const defaultFromDate = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>(defaultToDate);
  const [groupBy, setGroupBy] = useState<KpiGroupBy>("Stage");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Drilldown Modal state
  const [drilldownGroupKey, setDrilldownGroupKey] = useState<string | number | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState<string>("");
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  // Queries
  const { data: reportData, isLoading, refetch } = useKpiReport({
    fromDate,
    toDate,
    groupBy,
  });

  const { data: trendData } = useKpiTrend("Week", undefined, 8);

  const { data: drilldownItems, isLoading: isLoadingDrilldown } = useKpiDrilldown(
    groupBy,
    drilldownGroupKey ?? undefined,
    fromDate,
    toDate
  );

  const summary = reportData?.summary || {
    totalPrintSheets: 0,
    totalWorkers: 0,
    overallAvgProductivity: 0,
    overallWeightedKpiPercent: 0,
    totalCompletedSteps: 0,
  };

  const rawItems = reportData?.items || [];
  const filteredItems = rawItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameStr =
      item.stageName ||
      item.orderCode ||
      item.flowName ||
      item.dateLabel ||
      String(item.stageId || "");
    return nameStr.toLowerCase().includes(q);
  });

  const handleOpenDrilldown = (item: KpiReportItem) => {
    let key: string | number | null = null;
    let title = "";

    if (groupBy === "Stage") {
      key = item.stageId ?? item.stageCode ?? null;
      title = `Khâu: ${item.stageName || item.stageCode}`;
    } else if (groupBy === "Lsx") {
      key = item.productionOrderId ?? item.orderCode ?? null;
      title = `LSX: ${item.orderCode || item.productionOrderId}`;
    } else if (groupBy === "Flow") {
      key = item.flowId ?? item.flowCode ?? null;
      title = `Flow: ${item.flowName || item.flowCode}`;
    } else {
      key = item.dateLabel || null;
      title = `Kỳ: ${item.dateLabel}`;
    }

    if (key !== null) {
      setDrilldownGroupKey(key);
      setDrilldownTitle(title);
      setIsDrilldownOpen(true);
    }
  };

  const renderKpiBadge = (percent: number) => {
    let colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    if (percent < 80) {
      colorClass = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    } else if (percent < 100) {
      colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    }
    return (
      <Badge className={cn("font-mono font-extrabold text-[11px] px-2 py-0.5", colorClass)}>
        {percent.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden gap-3 p-3 bg-slate-50/50 dark:bg-background">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2 shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-900 dark:text-amber-500" />
            Báo cáo Thống kê KPI & Năng suất Sản xuất
          </h1>
          <p className="text-xs text-muted-foreground">
            Đánh giá hiệu suất nhân sự theo sản lượng tờ in (Volume-Weighted KPI) toàn bộ 19 Flow sản xuất.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card border rounded-md px-2 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-6 text-[11px] w-32 border-none bg-transparent p-0 focus-visible:ring-0"
            />
            <span className="text-muted-foreground">đến</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-6 text-[11px] w-32 border-none bg-transparent p-0 focus-visible:ring-0"
            />
          </div>

          <Select value={groupBy} onValueChange={(val) => setGroupBy(val as KpiGroupBy)}>
            <SelectTrigger className="w-36 h-8 text-xs bg-card font-bold">
              <SelectValue placeholder="Gom nhóm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Stage">Gom theo Khâu</SelectItem>
              <SelectItem value="Lsx">Gom theo LSX</SelectItem>
              <SelectItem value="Flow">Gom theo Flow</SelectItem>
              <SelectItem value="Date">Gom theo Ngày</SelectItem>
              <SelectItem value="Week">Gom theo Tuần</SelectItem>
              <SelectItem value="Month">Gom theo Tháng</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs font-semibold gap-1 bg-card"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} /> Làm mới
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <Card className="bg-card shadow-2xs border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Tổng Tờ In Sản Xuất</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-foreground mt-1">
            {summary.totalPrintSheets.toLocaleString("vi-VN")}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-0.5">tờ in hoàn thành</span>
        </Card>

        <Card className="bg-card shadow-2xs border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Tổng Công Nhân Sự</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-foreground mt-1">
            {summary.totalWorkers.toLocaleString("vi-VN")}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-0.5">công huy động trong kỳ</span>
        </Card>

        <Card className="bg-card shadow-2xs border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Năng Suất Trung Bình</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200 mt-1">
            {summary.overallAvgProductivity.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-0.5">tờ / công / ngày</span>
        </Card>

        <Card className="bg-card shadow-2xs border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">% Đạt KPI Trọng Số</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black font-mono text-foreground">
              {summary.overallWeightedKpiPercent.toFixed(1)}%
            </p>
            {renderKpiBadge(summary.overallWeightedKpiPercent)}
          </div>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Volume-Weighted KPI</span>
        </Card>
      </div>

      {/* Main Aggregated Report Section */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row gap-3">
        {/* Left / Main Table */}
        <Card className="flex-1 min-h-0 flex flex-col shadow-2xs border overflow-hidden">
          <CardHeader className="p-3 border-b bg-card shrink-0 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-foreground">
                Bảng Thống Kê KPI (Gom theo {groupBy === "Stage" ? "Khâu" : groupBy})
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {filteredItems.length} kết quả
              </Badge>
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên khâu, LSX..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 text-xs pl-8 bg-muted/20"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-10 text-center font-bold">#</TableHead>
                  <TableHead className="font-bold">Đối tượng ({groupBy})</TableHead>
                  <TableHead className="text-right font-bold">Tổng tờ in</TableHead>
                  <TableHead className="text-right font-bold">Số công</TableHead>
                  <TableHead className="text-right font-bold">Năng suất TB</TableHead>
                  <TableHead className="text-center font-bold min-w-[140px]">% Đạt KPI Trọng số</TableHead>
                  <TableHead className="text-center font-bold">Đã xong</TableHead>
                  <TableHead className="w-20 text-center font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Đang tải dữ liệu báo cáo KPI...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy dữ liệu KPI phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, idx) => {
                    const titleName =
                      item.stageName ||
                      item.orderCode ||
                      item.flowName ||
                      item.dateLabel ||
                      `Dòng ${idx + 1}`;
                    const codeSub = item.stageCode || item.flowCode || "";

                    return (
                      <TableRow key={idx} className="hover:bg-muted/30 border-b">
                        <TableCell className="text-center font-bold text-muted-foreground">
                          {idx + 1}
                        </TableCell>

                        <TableCell className="font-bold">
                          <div className="flex items-center gap-1.5">
                            <span>{titleName}</span>
                            {codeSub && (
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                {codeSub}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold">
                          {item.totalPrintSheets.toLocaleString("vi-VN")}
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          {item.totalWorkers}
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold">
                          {item.avgProductivity.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
                        </TableCell>

                        <TableCell className="text-center p-2">
                          <div className="flex items-center justify-center gap-2">
                            <Progress
                              value={Math.min(100, item.weightedKpiAchievementPercent)}
                              className="w-16 h-2"
                            />
                            {renderKpiBadge(item.weightedKpiAchievementPercent)}
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-mono text-[11px]">
                          <span className="font-bold text-emerald-600">{item.completedStepsCount}</span> /{" "}
                          <span className="text-muted-foreground">{item.totalStepsInGroup}</span>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDrilldown(item)}
                            className="h-6 text-[11px] font-bold text-amber-900 dark:text-amber-400 hover:underline p-1"
                          >
                            Chi tiết <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Side: Trend WoW / MoM Card */}
        <Card className="w-full lg:w-72 xl:w-80 shrink-0 shadow-2xs border flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="p-3 border-b bg-card shrink-0">
            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Biến động Xu hướng WoW (8 Tuần)
            </CardTitle>
          </CardHeader>

          <CardContent className="p-2 space-y-2 flex-1 min-h-0 overflow-y-auto">
            {trendData?.items?.map((tr, idx) => {
              const isUp = tr.trendDirection === "up";
              const isDown = tr.trendDirection === "down";

              return (
                <div
                  key={idx}
                  className="p-2 rounded-lg border bg-card hover:bg-muted/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{tr.periodLabel}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0 flex items-center gap-0.5",
                        isUp && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                        isDown && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                        !isUp && !isDown && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isUp && <TrendingUp className="w-3 h-3" />}
                      {isDown && <TrendingDown className="w-3 h-3" />}
                      {!isUp && !isDown && <Minus className="w-3 h-3" />}
                      {tr.changePercent > 0 ? `+${tr.changePercent}%` : `${tr.changePercent}%`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 text-[10.5px] text-muted-foreground pt-0.5">
                    <div>
                      Sản lượng: <strong className="text-foreground font-mono">{tr.totalPrintSheets.toLocaleString("vi-VN")}</strong>
                    </div>
                    <div className="text-right">
                      KPI: <strong className="text-foreground font-mono">{tr.weightedKpiAchievementPercent.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Drill-down Dialog */}
      <Dialog open={isDrilldownOpen} onOpenChange={setIsDrilldownOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <FileCheck className="w-5 h-5 text-amber-900 dark:text-amber-400" />
              Chi tiết công đoạn đóng góp KPI — {drilldownTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Danh sách chi tiết từng công đoạn hoàn thành trong kỳ chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">Mã LSX</TableHead>
                  <TableHead className="font-bold">Khâu</TableHead>
                  <TableHead className="text-right font-bold">Số tờ in</TableHead>
                  <TableHead className="text-right font-bold">Số công</TableHead>
                  <TableHead className="text-right font-bold">Năng suất TT</TableHead>
                  <TableHead className="text-right font-bold">KPI Mục tiêu</TableHead>
                  <TableHead className="text-center font-bold">% Đạt KPI</TableHead>
                  <TableHead className="text-right font-bold">Hoàn thành</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoadingDrilldown ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Đang tải chi tiết drill-down...
                    </TableCell>
                  </TableRow>
                ) : !drilldownItems || drilldownItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Không tìm thấy chi tiết công đoạn.
                    </TableCell>
                  </TableRow>
                ) : (
                  drilldownItems.map((st, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20 border-b">
                      <TableCell className="font-mono font-bold text-amber-900 dark:text-amber-300">
                        {st.orderCode}
                      </TableCell>

                      <TableCell className="font-bold">
                        {st.stageName} <span className="text-[10px] font-mono text-muted-foreground">({st.stageCode})</span>
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold">
                        {st.printSheetCount.toLocaleString("vi-VN")}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {st.workerCount}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold">
                        {st.actualProductivity.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
                      </TableCell>

                      <TableCell className="text-right font-mono text-muted-foreground">
                        {st.targetSheetsPerWorker.toLocaleString("vi-VN")}
                      </TableCell>

                      <TableCell className="text-center">
                        {renderKpiBadge(st.kpiAchievementPercent)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                        {st.completedAt ? format(new Date(st.completedAt), "dd/MM/yyyy HH:mm") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
