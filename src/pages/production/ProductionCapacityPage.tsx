import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  Download,
  Settings,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  X,
  Play,
} from "lucide-react";
import {
  useCapacityKpiSummary,
  useCapacitySummary,
  useCapacityWeeklyHeatmap,
  useCapacityReallocationSuggestions,
  useSimulateCapacityReallocation,
} from "@/hooks/use-capacity";
import type {
  CapacityStageSummaryResponse,
  CapacityReallocationCandidate,
} from "@/types/capacity";

export default function ProductionCapacityPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("today");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedFlow, setSelectedFlow] = useState<string>("all");
  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  // Real API Queries
  const { data: kpiData, isLoading: isLoadingKpis, refetch: refetchKpis } = useCapacityKpiSummary();
  const { data: summaryData, isLoading: isLoadingSummary, refetch: refetchSummary } = useCapacitySummary({ fromDate: selectedDate, toDate: selectedDate });
  const { data: heatmapData, isLoading: isLoadingHeatmap, refetch: refetchHeatmap } = useCapacityWeeklyHeatmap({ startDate: selectedDate });
  const { data: suggestionsData, isLoading: isLoadingSuggestions, refetch: refetchSuggestions } = useCapacityReallocationSuggestions(selectedStageId, selectedDate);
  const simulateMutation = useSimulateCapacityReallocation();

  const kpis = kpiData || {
    totalOrders: 0,
    scheduledOrders: 0,
    unscheduledOrders: 0,
    overloadedStagesCount: 0,
    nearCapacityStagesCount: 0,
    avgUtilizationPercent: 0,
  };
  const stageSummaries = summaryData || [];
  const heatmap = heatmapData || [];
  const candidates = suggestionsData?.candidates || [];

  const currentStage = stageSummaries.find((s) => s.stageId === selectedStageId) || stageSummaries[0] || {
    stageId: selectedStageId || 1,
    stageCode: "print",
    stageName: "Chưa chọn khâu",
    workDate: selectedDate,
    orderCount: 0,
    demandHours: 0,
    capacityHours: 0,
    differenceHours: 0,
    utilizationPercent: 0,
    isOverloaded: false,
    status: "Chưa có dữ liệu",
  };

  // Calculate total reduced hours from selected candidate checkboxes
  const totalHoursToReduce = useMemo(() => {
    return candidates
      .filter((c) => selectedCandidates.includes(c.productionOrderId))
      .reduce((sum, c) => sum + c.estimatedHours, 0);
  }, [candidates, selectedCandidates]);

  const toggleCandidate = (id: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSimulate = () => {
    const reallocations = candidates
      .filter((c) => selectedCandidates.includes(c.productionOrderId))
      .map((c) => ({
        productionOrderId: c.productionOrderId,
        targetWorkDate: c.suggestedTargetDate,
      }));

    simulateMutation.mutate({ reallocations });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto space-y-4 p-4 bg-slate-50/50 dark:bg-background">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Kế hoạch sản xuất & Công suất khâu
          </h1>
          <p className="text-xs text-muted-foreground">
            Theo dõi tải công việc, phát hiện quá tải, hỗ trợ phân phối lệnh sản xuất hợp lý
          </p>
        </div>

        {/* Filter Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons */}
          <div className="flex items-center rounded-lg border bg-card p-1 shadow-sm text-xs font-semibold">
            <button
              className={cn("px-2.5 py-1 rounded-md transition-all", selectedTimeRange === "today" ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted")}
              onClick={() => setSelectedTimeRange("today")}
            >
              Hôm nay (10/09)
            </button>
            <button
              className={cn("px-2.5 py-1 rounded-md transition-all", selectedTimeRange === "week" ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted")}
              onClick={() => setSelectedTimeRange("week")}
            >
              Tuần này
            </button>
            <button
              className={cn("px-2.5 py-1 rounded-md transition-all", selectedTimeRange === "month" ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted")}
              onClick={() => setSelectedTimeRange("month")}
            >
              Tháng này
            </button>
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-36 h-8 text-xs font-semibold bg-card"
          />

          <Select value={selectedFlow} onValueChange={setSelectedFlow}>
            <SelectTrigger className="w-36 h-8 text-xs bg-card">
              <SelectValue placeholder="Tất cả Flow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả Flow (F01 - F19)</SelectItem>
              <SelectItem value="F01">F01 - Hộp thường</SelectItem>
              <SelectItem value="F02">F02 - Hộp metalize</SelectItem>
              <SelectItem value="F03">F03 - Hộp duplex bồi sóng</SelectItem>
              <SelectItem value="F04">F04 - Hộp metalize bồi sóng</SelectItem>
              <SelectItem value="F05">F05 - Nhãn giấy</SelectItem>
              <SelectItem value="F06">F06 - Folder (Bìa kẹp file)</SelectItem>
              <SelectItem value="F07">F07 - Nhãn metalize</SelectItem>
              <SelectItem value="F08">F08 - Decal giấy tờ</SelectItem>
              <SelectItem value="F09">F09 - Decal metalize tờ</SelectItem>
              <SelectItem value="F10">F10 - Túi PE/PA</SelectItem>
              <SelectItem value="F11">F11 - Túi Metalize</SelectItem>
              <SelectItem value="F12">F12 - Túi PE/PA xếp hông</SelectItem>
              <SelectItem value="F13">F13 - Túi Metalize xếp hông</SelectItem>
              <SelectItem value="F14">F14 - Túi PE/PA zipper</SelectItem>
              <SelectItem value="F15">F15 - Túi cuộn PE/PA/Metalize</SelectItem>
              <SelectItem value="F16">F16 - Túi cuộn zipper</SelectItem>
              <SelectItem value="F17">F17 - Decal cuộn thường</SelectItem>
              <SelectItem value="F18">F18 - Decal cuộn metalize</SelectItem>
              <SelectItem value="F19">F19 - Túi giấy</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 bg-card">
            <Download className="w-3.5 h-3.5" />
            Xuất báo cáo
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs font-bold gap-1">
            <Settings className="w-3.5 h-3.5" />
            Cấu hình công suất
          </Button>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <Card className="bg-card shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Tổng lệnh</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{kpis.totalOrders}</p>
          <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> ↑ 12% so với hôm qua
          </p>
        </Card>

        {/* KPI 2 */}
        <Card className="bg-card shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Đã phân bổ lịch</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{kpis.scheduledOrders}</p>
          <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> ↑ 8% so với hôm qua
          </p>
        </Card>

        {/* KPI 3 */}
        <Card className="bg-card shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Chưa phân bổ</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{kpis.unscheduledOrders}</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block font-medium">Cần xếp lịch</span>
        </Card>

        {/* KPI 4 */}
        <Card className="bg-card shadow-sm border border-red-200 dark:border-red-900/50 bg-red-50/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 dark:text-red-400">Khâu quá tải</span>
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{kpis.overloadedStagesCount}</p>
          <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Cần dời lịch bớt</span>
        </Card>

        {/* KPI 5 */}
        <Card className="bg-card shadow-sm border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Khâu gần đầy</span>
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{kpis.nearCapacityStagesCount}</p>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Tải 80% - 100%</span>
        </Card>

        {/* KPI 6 */}
        <Card className="bg-card shadow-sm border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Tỷ lệ công suất TB</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{kpis.avgUtilizationPercent}%</p>
          <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5 mt-0.5">
            Mức khai thác hiệu quả
          </p>
        </Card>
      </div>

      {/* Main Grid: Left Tables & Right Drawer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Stage Load Table + Heatmap + Orders Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Table 1: Tải công việc theo từng khâu */}
          <Card className="shadow-sm border">
            <CardHeader className="py-2.5 px-4 border-b bg-card">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Tải công việc theo từng khâu (Ngày {selectedDate})</span>
                <span className="text-xs font-normal text-muted-foreground">Bấm vào dòng khâu để xem chi tiết</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold">Khâu</TableHead>
                    <TableHead className="font-bold text-center">Số lệnh</TableHead>
                    <TableHead className="font-bold text-right">Nhu cầu (giờ)</TableHead>
                    <TableHead className="font-bold text-right">Công suất (giờ)</TableHead>
                    <TableHead className="font-bold w-36">Tải %</TableHead>
                    <TableHead className="font-bold text-right">Còn / Thiếu</TableHead>
                    <TableHead className="font-bold text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stageSummaries.map((stage) => {
                    const isSelected = stage.stageId === selectedStageId;
                    const isOver = stage.isOverloaded || stage.utilizationPercent > 100;
                    const isNear = stage.utilizationPercent >= 80 && stage.utilizationPercent <= 100;

                    return (
                      <TableRow
                        key={stage.stageId}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/60",
                          isSelected && "bg-primary/5 font-semibold border-l-4 border-l-primary"
                        )}
                        onClick={() => setSelectedStageId(stage.stageId)}
                      >
                        <TableCell className="font-bold text-foreground">{stage.stageName}</TableCell>
                        <TableCell className="text-center font-medium">{stage.orderCount ?? 0}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{(stage.demandHours ?? 0).toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{(stage.capacityHours ?? 0).toFixed(1)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{(stage.utilizationPercent ?? 0).toFixed(0)}%</span>
                            </div>
                            <Progress
                              value={Math.min(stage.utilizationPercent ?? 0, 100)}
                              className={cn(
                                "h-2",
                                isOver ? "[&>div]:bg-red-500" : isNear ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell className={cn("text-right font-mono font-bold", (stage.differenceHours ?? 0) < 0 ? "text-red-600" : "text-emerald-600")}>
                          {(stage.differenceHours ?? 0) > 0 ? `+${(stage.differenceHours ?? 0).toFixed(1)}` : (stage.differenceHours ?? 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold border-none px-2 py-0.5",
                              isOver ? "bg-red-100 text-red-700" : isNear ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {stage.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Table 2: Ma trận Heatmap 7 ngày tới */}
          <Card className="shadow-sm border">
            <CardHeader className="py-2.5 px-4 border-b bg-card">
              <CardTitle className="text-sm font-bold">Tải công việc theo khâu (7 ngày tới)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-xs text-center">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-left w-24">Khâu</TableHead>
                    {Object.keys(heatmap[0]?.dailyUtilization || {}).map((day) => (
                      <TableHead key={day} className="font-bold text-center min-w-[70px]">{day}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmap.map((row) => (
                    <TableRow key={row.stageId}>
                      <TableCell className="font-bold text-left text-foreground">{row.stageName}</TableCell>
                      {Object.entries(row.dailyUtilization).map(([day, val]) => {
                        const isOver = val > 100;
                        const isNear = val >= 80 && val <= 100;
                        return (
                          <TableCell key={day} className="p-1">
                            <div
                              className={cn(
                                "py-1.5 px-2 rounded text-[11px] font-bold transition-all",
                                isOver ? "bg-red-500 text-white" : isNear ? "bg-amber-400 text-amber-950" : "bg-emerald-100 text-emerald-800"
                              )}
                            >
                              {val}%
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Table 3: Danh sách Lệnh tại khâu selected */}
          <Card className="shadow-sm border">
            <CardHeader className="py-2.5 px-4 border-b bg-card flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">
                Danh sách lệnh tại khâu {currentStage.stageName} (Ngày {selectedDate})
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {candidates.length} lệnh
              </Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="font-bold">Mã lệnh</TableHead>
                    <TableHead className="font-bold">Flow</TableHead>
                    <TableHead className="font-bold">Sản phẩm</TableHead>
                    <TableHead className="font-bold">Khách hàng</TableHead>
                    <TableHead className="font-bold text-right">Số lượng</TableHead>
                    <TableHead className="font-bold text-right">Thời gian dk</TableHead>
                    <TableHead className="font-bold text-center">Deadline</TableHead>
                    <TableHead className="font-bold text-center">Ưu tiên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        Không có lệnh nào tại khâu này trong ngày {selectedDate}
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((c) => (
                      <TableRow key={c.productionOrderId} className="hover:bg-muted/50">
                        <TableCell><Checkbox /></TableCell>
                        <TableCell className="font-bold text-primary font-mono">{c.proofingOrderCode || `PO#${c.productionOrderId}`}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] font-bold">Flow</Badge></TableCell>
                        <TableCell className="font-medium">Lệnh sản xuất #{c.productionOrderId}</TableCell>
                        <TableCell className="text-muted-foreground">Khách hàng</TableCell>
                        <TableCell className="text-right font-mono font-semibold">-</TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground">{c.estimatedHours}h</TableCell>
                        <TableCell className="text-center font-semibold">{c.deadline}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold border-none px-2 py-0.5",
                              c.priorityDisplay === "Cao" ? "bg-red-100 text-red-700" : c.priorityDisplay === "TB" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {c.priorityDisplay || "TB"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Drawer Panel (4 cols): Chi tiết khâu & Đề xuất dời lịch AI */}
        <div className="lg:col-span-4">
          <Card className="shadow-md border border-red-200 dark:border-red-900/50 bg-card sticky top-4">
            <CardHeader className="py-3 px-4 border-b bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  Chi tiết khâu: {currentStage.stageName}
                </CardTitle>
                <Badge className="bg-red-600 text-white font-bold text-[10px]">
                  Quá tải
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Alert Overload Message Box */}
              <div className="p-3 rounded-lg bg-red-100/70 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  Khâu {currentStage.stageName} đang quá tải trong ngày {selectedDate}
                </p>
                <p className="text-[11px] leading-relaxed">
                  Nhu cầu <strong className="text-red-700">{(currentStage.demandHours ?? 0).toFixed(1)} giờ</strong> vượt công suất <strong className="text-emerald-700">{(currentStage.capacityHours ?? 0).toFixed(1)} giờ</strong>. Cần điều chỉnh giảm <strong className="text-red-700">{Math.abs(currentStage.differenceHours ?? 0).toFixed(1)} giờ</strong>.
                </p>
              </div>

              {/* Tabs: Tổng quan | Danh sách lệnh | Đề xuất dời lịch AI */}
              <Tabs defaultValue="ai_suggestions" className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-8 text-xs bg-muted">
                  <TabsTrigger value="overview" className="text-[11px] px-1 font-bold">Tổng quan</TabsTrigger>
                  <TabsTrigger value="orders" className="text-[11px] px-1 font-bold">Lệnh ({currentStage.orderCount ?? 0})</TabsTrigger>
                  <TabsTrigger value="ai_suggestions" className="text-[11px] px-1 font-bold flex items-center gap-1 text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3 h-3" /> Đề xuất AI
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview */}
                <TabsContent value="overview" className="pt-3 space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Số lệnh xếp lịch:</span>
                    <span className="font-bold">{currentStage.orderCount ?? 0} lệnh</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Thời gian dự kiến:</span>
                    <span className="font-bold font-mono text-red-600">{(currentStage.demandHours ?? 0).toFixed(1)} giờ</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Công suất khả dụng:</span>
                    <span className="font-bold font-mono text-emerald-600">{(currentStage.capacityHours ?? 0).toFixed(1)} giờ</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Tỷ lệ tải:</span>
                    <span className="font-extrabold text-red-600">{(currentStage.utilizationPercent ?? 0).toFixed(1)}%</span>
                  </div>
                </TabsContent>

                {/* Tab 2: Orders List */}
                <TabsContent value="orders" className="pt-3 space-y-2 text-xs">
                  {candidates.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Không có lệnh nào</p>
                  ) : (
                    candidates.map((o) => (
                      <div key={o.productionOrderId} className="p-2 border rounded bg-muted/30 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-primary font-mono">{o.proofingOrderCode || `PO#${o.productionOrderId}`}</p>
                          <p className="text-[10px] text-muted-foreground">Deadline: {o.deadline}</p>
                        </div>
                        <span className="font-bold font-mono">{o.estimatedHours}h</span>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Tab 3: AI Smart Rescheduling Suggestions */}
                <TabsContent value="ai_suggestions" className="pt-3 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-purple-800 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 p-2 rounded border border-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Đề xuất điều chỉnh lịch (AI Smart Engine)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Dựa trên deadline và mức độ ưu tiên, hệ thống gợi ý các lệnh có thể dời lịch sang ngày khác để hạ tải công suất:
                  </p>

                  {/* Candidates List with Checkboxes */}
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {candidates.map((c) => {
                      const isChecked = selectedCandidates.includes(c.productionOrderId);

                      return (
                        <div
                          key={c.productionOrderId}
                          className={cn(
                            "p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 cursor-pointer hover:bg-muted/50",
                            isChecked ? "bg-purple-50/50 border-purple-300 dark:bg-purple-950/20" : "bg-card border-border"
                          )}
                          onClick={() => toggleCandidate(c.productionOrderId)}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleCandidate(c.productionOrderId)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold font-mono text-primary">{c.proofingOrderCode}</span>
                              <span className="font-bold text-foreground font-mono">{c.estimatedHours} giờ</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Deadline: <strong className="text-foreground">{c.deadline.split("T")[0]}</strong></span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0">{c.priorityDisplay}</Badge>
                            </div>
                            <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1 pt-0.5">
                              <ChevronRight className="w-3 h-3 shrink-0" />
                              <span>Gợi ý chuyển sang: {c.suggestedTargetDateDisplay}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal reduced hours summary */}
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-between text-xs font-bold border">
                    <span>Tổng thời gian có thể giảm:</span>
                    <span className="text-emerald-600 font-mono text-sm">{totalHoursToReduce.toFixed(1)} giờ</span>
                  </div>

                  {/* Simulation & Apply Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs font-bold gap-1"
                      onClick={handleSimulate}
                      disabled={simulateMutation.loading || selectedCandidates.length === 0}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Mô phỏng
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs font-bold gap-1 bg-purple-700 hover:bg-purple-800 text-white"
                      onClick={handleSimulate}
                      disabled={simulateMutation.loading || selectedCandidates.length === 0}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Tạo đề xuất điều chỉnh
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
