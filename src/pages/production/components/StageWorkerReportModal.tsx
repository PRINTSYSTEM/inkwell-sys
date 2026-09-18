import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  TableFooter,
} from "@/components/ui/table";
import {
  Users,
  Calendar,
  Loader2,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Target,
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  useStageWorkerReport,
  exportStageWorkerReportExcel,
  type StageWorkerReportItem,
  type StageWorkerOrderResponse,
} from "@/hooks/use-production";
import {
  useKpiReport,
  useKpiDrilldown,
  useKpiTrend,
  type KpiGroupBy,
  type KpiReportItem,
} from "@/hooks/use-kpi";
import {
  useWorkerCapacitySummary,
  useStageWorkerDetails,
  type WorkerCapacitySummaryItem,
} from "@/hooks/use-capacity";
import { apiRequest } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface StageWorkerReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "worker_report" | "kpi_report" | "capacity_report";
}

export function StageWorkerReportModal({
  isOpen,
  onOpenChange,
  defaultTab = "worker_report",
}: StageWorkerReportModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // ==========================================
  // TAB 1: WORKER COUNT REPORT STATE
  // ==========================================
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedStageCode, setSelectedStageCode] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const { data: reportData, isLoading } = useStageWorkerReport(
    fromDate || undefined,
    toDate || undefined
  );

  const { data: drilldownData, isLoading: isDrilldownLoading } = useQuery<StageWorkerOrderResponse[]>({
    queryKey: ["stage-worker-report-drilldown", selectedStageCode, fromDate, toDate],
    enabled: !!selectedStageCode && isOpen && activeTab === "worker_report",
    queryFn: async () => {
      const res = await apiRequest.get(
        `/production/stage-worker-report/${selectedStageCode}/orders`,
        {
          params: {
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          },
        }
      );
      return res.data;
    },
  });

  const reportItems = React.useMemo<StageWorkerReportItem[]>(() => {
    if (!reportData) return [];
    if (Array.isArray(reportData)) return reportData;
    if (Array.isArray((reportData as any)?.items)) return (reportData as any).items;
    if (Array.isArray((reportData as any)?.stages)) return (reportData as any).stages;
    if (Array.isArray((reportData as any)?.data)) return (reportData as any).data;
    return [];
  }, [reportData]);

  const drilldownItems = React.useMemo<StageWorkerOrderResponse[]>(() => {
    if (!drilldownData) return [];
    if (Array.isArray(drilldownData)) return drilldownData;
    if (Array.isArray((drilldownData as any)?.items)) return (drilldownData as any).items;
    if (Array.isArray((drilldownData as any)?.orders)) return (drilldownData as any).orders;
    if (Array.isArray((drilldownData as any)?.data)) return (drilldownData as any).data;
    return [];
  }, [drilldownData]);

  const totalWorkerCount = reportItems.reduce(
    (acc, curr) => acc + (curr.totalWorkerCount || 0),
    0
  );

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportStageWorkerReportExcel(fromDate || undefined, toDate || undefined);
      toast.success("Đã xuất báo cáo số công ra file Excel thành công!");
    } catch (err) {
      toast.error("Không thể xuất file Excel báo cáo. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };

  const safeFormatDate = (dStr?: string) => {
    if (!dStr) return "—";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return "—";
      return format(d, "dd/MM/yyyy HH:mm");
    } catch {
      return dStr;
    }
  };

  // ==========================================
  // TAB 2: KPI & PRODUCTIVITY REPORT STATE
  // ==========================================
  const defaultKpiToDate = format(new Date(), "yyyy-MM-dd");
  const defaultKpiFromDate = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const [kpiFromDate, setKpiFromDate] = useState<string>(defaultKpiFromDate);
  const [kpiToDate, setKpiToDate] = useState<string>(defaultKpiToDate);
  const [groupBy, setGroupBy] = useState<KpiGroupBy>("Stage");
  const [kpiSearchQuery, setKpiSearchQuery] = useState<string>("");

  const [kpiDrilldownKey, setKpiDrilldownKey] = useState<string | number | null>(null);
  const [kpiDrilldownTitle, setKpiDrilldownTitle] = useState<string>("");
  const [isKpiDrilldownOpen, setIsKpiDrilldownOpen] = useState<boolean>(false);

  const { data: kpiReportData, isLoading: isKpiLoading, refetch: refetchKpi } = useKpiReport({
    fromDate: kpiFromDate,
    toDate: kpiToDate,
    groupBy,
  });

  const { data: kpiTrendData } = useKpiTrend("Week", undefined, 6);

  const { data: kpiDrilldownList, isLoading: isKpiDrilldownLoading } = useKpiDrilldown(
    groupBy,
    kpiDrilldownKey ?? undefined,
    kpiFromDate,
    kpiToDate
  );

  const kpiSummary = kpiReportData?.summary || {
    totalPrintSheets: 0,
    totalWorkers: 0,
    overallAvgProductivity: 0,
    overallWeightedKpiPercent: 0,
    totalCompletedSteps: 0,
  };

  const rawKpiItems = kpiReportData?.items || [];
  const filteredKpiItems = rawKpiItems.filter((item) => {
    if (!kpiSearchQuery.trim()) return true;
    const q = kpiSearchQuery.toLowerCase();
    const nameStr =
      item.stageName ||
      item.orderCode ||
      item.flowName ||
      item.dateLabel ||
      String(item.stageId || "");
    return nameStr.toLowerCase().includes(q);
  });

  const handleOpenKpiDrilldown = (item: KpiReportItem) => {
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
      setKpiDrilldownKey(key);
      setKpiDrilldownTitle(title);
      setIsKpiDrilldownOpen(true);
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

  // ==========================================
  // TAB 3: CAPACITY PLANNING STATE
  // ==========================================
  const [capDate, setCapDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedCapStageId, setSelectedCapStageId] = useState<number | null>(null);
  const [selectedCapStageName, setSelectedCapStageName] = useState<string>("");

  const { data: capacitySummaryData, isLoading: isCapLoading } = useWorkerCapacitySummary(
    capDate,
    capDate
  );

  const { data: capStageDetails, isLoading: isCapDetailsLoading } = useStageWorkerDetails(
    selectedCapStageId,
    capDate
  );

  const renderCapacityStatusBadge = (status: WorkerCapacitySummaryItem["status"]) => {
    switch (status) {
      case "sufficient":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none">
            🟢 Đủ người
          </Badge>
        );
      case "short":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-none">
            🔴 Thiếu người
          </Badge>
        );
      case "surplus":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-none">
            🟡 Dư người
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            ⚪ Không có việc
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-amber-900 dark:text-amber-400" />
            Báo cáo & Quản lý Công — KPI — Năng lực Sản xuất
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Trung tâm quản lý số công nhân sự, % đạt KPI trọng số sản lượng và lực lượng công khả dụng.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 pt-1">
          <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 h-10">
            <TabsTrigger value="worker_report" className="text-xs font-bold gap-1.5 cursor-pointer">
              <Users className="w-4 h-4 text-emerald-600" /> 👥 Số công theo khâu
            </TabsTrigger>
            <TabsTrigger value="kpi_report" className="text-xs font-bold gap-1.5 cursor-pointer">
              <Target className="w-4 h-4 text-amber-600" /> 🎯 Năng suất & KPI (Volume-Weighted)
            </TabsTrigger>
            <TabsTrigger value="capacity_report" className="text-xs font-bold gap-1.5 cursor-pointer">
              <Zap className="w-4 h-4 text-blue-600" /> ⚡ Năng lực công khả dụng (Daily Capacity)
            </TabsTrigger>
          </TabsList>

          {/* ========================================== */}
          {/* TAB 1: WORKER COUNT REPORT */}
          {/* ========================================== */}
          <TabsContent value="worker_report" className="space-y-4 mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>Thời gian tạo LSX:</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-background border-input"
                />
                <span>đến</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-background border-input"
                />
                {(fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                    className="h-8 text-xs text-muted-foreground hover:bg-muted"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="h-8 text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Xuất Excel</span>
                </Button>

                <Badge className="bg-primary text-primary-foreground font-extrabold px-3 py-1.5 text-xs shadow-2xs">
                  Tổng số công: {totalWorkerCount} công
                </Badge>
              </div>
            </div>

            {selectedStageCode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStageCode(null)}
                    className="h-8 text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khâu
                  </Button>
                  <span className="text-xs font-bold text-foreground">
                    Chi tiết LSX của khâu: <Badge className="ml-1 font-mono">{selectedStageCode}</Badge>
                  </span>
                </div>

                {isDrilldownLoading ? (
                  <div className="py-12 text-center text-muted-foreground flex justify-center items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Đang tải danh sách LSX đóng góp công...
                  </div>
                ) : drilldownItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground italic bg-muted/20 rounded-lg border">
                    Không có LSX nào có dữ liệu số công cho khâu này trong khoảng thời gian chọn.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="text-xs font-bold">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Mã LSX / Bình bài</TableHead>
                          <TableHead>Ngày tạo LSX</TableHead>
                          <TableHead className="text-right">Số công khâu này</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drilldownItems.map((order, idx) => {
                          const codeDisplay =
                            order.orderCode ||
                            order.code ||
                            order.proofingOrderCode ||
                            (order.productionOrderId ? `LSX${order.productionOrderId}` : "—");

                          return (
                            <TableRow key={order.productionOrderId || order.id || idx} className="text-xs">
                              <TableCell className="text-center font-semibold text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono font-bold text-primary">
                                {codeDisplay}
                              </TableCell>
                              <TableCell className="font-mono text-muted-foreground">
                                {safeFormatDate(order.createdAt)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-600 text-sm">
                                {order.workerCount} công
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/60 sticky top-0 z-10">
                    <TableRow className="text-xs font-bold uppercase">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Mã khâu (Stage)</TableHead>
                      <TableHead>Tên khâu</TableHead>
                      <TableHead className="text-right">Số LSX đóng góp</TableHead>
                      <TableHead className="text-right">Tổng số công</TableHead>
                      <TableHead className="w-24 text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          <div className="flex justify-center items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span>Đang tổng hợp báo cáo số công...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : reportItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground italic">
                          Chưa có dữ liệu báo cáo số công trong kỳ chọn.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportItems.map((item, idx) => {
                        const orderCountVal = item.orderCount ?? item.totalOrdersCount ?? 0;

                        return (
                          <TableRow
                            key={item.stageCode || idx}
                            onClick={() => setSelectedStageCode(item.stageCode)}
                            className="text-xs hover:bg-muted/60 cursor-pointer transition-colors"
                          >
                            <TableCell className="text-center font-bold text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-foreground">
                              <Badge variant="outline" className="font-mono text-[11px] bg-slate-50">
                                {item.stageCode}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-foreground">
                              {item.stageName || item.stageCode}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {orderCountVal} bài
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-emerald-600 text-sm">
                              {item.totalWorkerCount} công
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStageCode(item.stageCode);
                                }}
                                className="h-7 text-[11px] text-primary font-bold hover:bg-primary/10 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" /> Chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>

                  {reportItems.length > 0 && (
                    <TableFooter className="bg-muted/80 sticky bottom-0">
                      <TableRow className="text-xs font-bold border-t">
                        <TableCell colSpan={3} className="text-right font-black uppercase text-foreground">
                          TỔNG CỘNG
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-emerald-600 text-sm">
                          {totalWorkerCount} công
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ========================================== */}
          {/* TAB 2: KPI & PRODUCTIVITY REPORT */}
          {/* ========================================== */}
          <TabsContent value="kpi_report" className="space-y-4 mt-0">
            {/* KPI Top Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kỳ báo cáo KPI:</span>
                <Input
                  type="date"
                  value={kpiFromDate}
                  onChange={(e) => setKpiFromDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-background border-input"
                />
                <span>đến</span>
                <Input
                  type="date"
                  value={kpiToDate}
                  onChange={(e) => setKpiToDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-background border-input"
                />

                <span className="ml-2 font-bold">Gom nhóm:</span>
                <Select value={groupBy} onValueChange={(val) => setGroupBy(val as KpiGroupBy)}>
                  <SelectTrigger className="w-36 h-8 text-xs bg-background font-bold">
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
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchKpi()}
                  className="h-8 text-xs font-bold gap-1 bg-background"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isKpiLoading && "animate-spin")} /> Làm mới KPI
                </Button>
              </div>
            </div>

            {/* KPI Summary 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border bg-card shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Tổng tờ in hoàn thành</span>
                <p className="text-xl font-extrabold font-mono text-foreground">
                  {kpiSummary.totalPrintSheets.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Tổng số công nhân sự</span>
                <p className="text-xl font-extrabold font-mono text-emerald-600">
                  {kpiSummary.totalWorkers.toLocaleString("vi-VN")} công
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Năng suất TB (Tờ/Công)</span>
                <p className="text-xl font-extrabold font-mono text-amber-700 dark:text-amber-300">
                  {kpiSummary.overallAvgProductivity.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">% Đạt KPI Trọng Số Volume</span>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black font-mono text-foreground">
                    {kpiSummary.overallWeightedKpiPercent.toFixed(1)}%
                  </p>
                  {renderKpiBadge(kpiSummary.overallWeightedKpiPercent)}
                </div>
              </div>
            </div>

            {/* KPI Aggregated Table */}
            <div className="border rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">Đối tượng ({groupBy})</TableHead>
                    <TableHead className="text-right font-bold">Tổng tờ in</TableHead>
                    <TableHead className="text-right font-bold">Số công</TableHead>
                    <TableHead className="text-right font-bold">Năng suất TB</TableHead>
                    <TableHead className="text-center font-bold min-w-[140px]">% Đạt KPI Trọng số</TableHead>
                    <TableHead className="w-20 text-center font-bold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isKpiLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                          <span>Đang tổng hợp dữ liệu KPI...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredKpiItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                        Không có dữ liệu KPI trong kỳ chọn.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKpiItems.map((item, idx) => {
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
                          <TableCell className="text-right font-mono font-bold text-emerald-600">
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
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenKpiDrilldown(item)}
                              className="h-6 text-[11px] font-bold text-amber-900 dark:text-amber-400 hover:underline p-1 cursor-pointer"
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
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* TAB 3: DAILY WORKER CAPACITY PLANNING */}
          {/* ========================================== */}
          <TabsContent value="capacity_report" className="space-y-4 mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ngày kiểm tra công năng lực:</span>
                <Input
                  type="date"
                  value={capDate}
                  onChange={(e) => setCapDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-background border-input font-bold"
                />
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1">🟢 Đủ người</span>
                <span className="flex items-center gap-1">🔴 Thiếu người</span>
                <span className="flex items-center gap-1">🟡 Dư người</span>
                <span className="flex items-center gap-1">⚪ Không có việc</span>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">Khâu sản xuất</TableHead>
                    <TableHead className="text-center font-bold">Trạng thái công</TableHead>
                    <TableHead className="text-right font-bold">Công khả dụng (Available)</TableHead>
                    <TableHead className="text-right font-bold">Công yêu cầu (Required)</TableHead>
                    <TableHead className="text-right font-bold">Tổng tờ in</TableHead>
                    <TableHead className="text-right font-bold">Thừa / Thiếu</TableHead>
                    <TableHead className="w-24 text-center font-bold">Chi tiết LSX</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCapLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span>Đang tính toán năng lực công khả dụng...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !capacitySummaryData || capacitySummaryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground italic">
                        Không có dữ liệu năng lực công sản xuất ngày {capDate}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    capacitySummaryData.map((st, idx) => (
                      <TableRow key={st.stageId || idx} className="hover:bg-muted/30 border-b">
                        <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-foreground">
                          {st.stageName} <span className="text-[10px] font-mono text-muted-foreground">({st.stageCode})</span>
                        </TableCell>
                        <TableCell className="text-center">{renderCapacityStatusBadge(st.status)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-blue-700 dark:text-blue-300">
                          {st.availableWorkerCount} công
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-700 dark:text-amber-300">
                          {st.requiredWorkerCount} công
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {st.totalPrintSheets.toLocaleString("vi-VN")} tờ
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {st.shortageWorkers > 0 ? (
                            <span className="text-red-600 font-extrabold">Thiếu {st.shortageWorkers} công</span>
                          ) : st.surplusWorkers > 0 ? (
                            <span className="text-amber-600 font-bold">Dư {st.surplusWorkers} công</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">Vừa đủ</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCapStageId(st.stageId);
                              setSelectedCapStageName(st.stageName);
                            }}
                            className="h-6 text-[11px] font-bold text-blue-600 hover:underline p-1 cursor-pointer"
                          >
                            Xem LSX <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* KPI Drilldown Sub-Dialog */}
      <Dialog open={isKpiDrilldownOpen} onOpenChange={setIsKpiDrilldownOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Chi tiết công đoạn KPI — {kpiDrilldownTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 max-h-[400px] overflow-y-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Mã LSX</TableHead>
                  <TableHead className="font-bold">Khâu</TableHead>
                  <TableHead className="text-right font-bold">Số tờ</TableHead>
                  <TableHead className="text-right font-bold">Số công</TableHead>
                  <TableHead className="text-right font-bold">Năng suất TT</TableHead>
                  <TableHead className="text-center font-bold">% Đạt KPI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isKpiDrilldownLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Đang tải chi tiết KPI...
                    </TableCell>
                  </TableRow>
                ) : !kpiDrilldownList || kpiDrilldownList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground italic">
                      Chưa có dữ liệu bước hoàn thành.
                    </TableCell>
                  </TableRow>
                ) : (
                  kpiDrilldownList.map((st, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20 border-b">
                      <TableCell className="font-mono font-bold text-amber-900 dark:text-amber-300">
                        {st.orderCode}
                      </TableCell>
                      <TableCell className="font-bold">{st.stageName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {st.printSheetCount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600">
                        {st.workerCount}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {st.actualProductivity.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderKpiBadge(st.kpiAchievementPercent)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Capacity Stage Details Sub-Dialog */}
      <Dialog open={!!selectedCapStageId} onOpenChange={(open) => !open && setSelectedCapStageId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Chi tiết LSX yêu cầu công — Khâu {selectedCapStageName} ({capDate})
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 max-h-[350px] overflow-y-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 text-center font-bold">#</TableHead>
                  <TableHead className="font-bold">Mã LSX</TableHead>
                  <TableHead className="text-right font-bold">Số tờ in</TableHead>
                  <TableHead className="text-right font-bold">Công đề xuất (Required)</TableHead>
                  <TableHead className="text-center font-bold">Ngày xếp lịch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCapDetailsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Đang tải danh sách LSX...
                    </TableCell>
                  </TableRow>
                ) : !capStageDetails || capStageDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">
                      Chưa có LSX nào được xếp lịch cho khâu này trong ngày {capDate}.
                    </TableCell>
                  </TableRow>
                ) : (
                  capStageDetails.map((dt, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20 border-b">
                      <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-bold text-primary">{dt.orderCode}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {dt.printSheetCount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-amber-700 dark:text-amber-300">
                        {dt.requiredWorkers} công
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {dt.schedulingDay}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
