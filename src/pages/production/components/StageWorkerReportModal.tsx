import React, { useState } from "react";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Users, Calendar, Loader2, ArrowLeft, FileText, FileSpreadsheet } from "lucide-react";
import {
  useStageWorkerReport,
  exportStageWorkerReportExcel,
  type StageWorkerReportItem,
  type StageWorkerOrderResponse,
} from "@/hooks/use-production";
import { apiRequest } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

interface StageWorkerReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageWorkerReportModal({
  isOpen,
  onOpenChange,
}: StageWorkerReportModalProps) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedStageCode, setSelectedStageCode] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const { data: reportData, isLoading } = useStageWorkerReport(
    fromDate || undefined,
    toDate || undefined
  );

  // Drilldown query for selected stage
  const { data: drilldownData, isLoading: isDrilldownLoading } = useQuery<StageWorkerOrderResponse[]>({
    queryKey: ["stage-worker-report-drilldown", selectedStageCode, fromDate, toDate],
    enabled: !!selectedStageCode && isOpen,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary" />
            Báo cáo Thống kê Số Công theo Khâu (Worker Count Report)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Mốc thời gian báo cáo tính theo <strong>Ngày tạo LSX</strong> (created_at).
          </DialogDescription>
        </DialogHeader>

        {/* Date Filters & Top Actions */}
        <div className="space-y-4 py-2">
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

          {/* Drilldown View OR Summary Table */}
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
                <div className="border rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
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
            <div className="border rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/60">
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
                  <TableFooter className="bg-muted/80">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
