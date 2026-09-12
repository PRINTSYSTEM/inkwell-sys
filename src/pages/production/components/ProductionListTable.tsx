import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileImage,
  Flame,
  ChevronLeft,
  ChevronRight,
  Factory,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProductionOrderResponse } from "@/Schema";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";
import { TableSkeleton } from "@/components/ui/skeleton-components";

interface ProductionListTableProps {
  isLoading: boolean;
  productions: ProductionOrderResponse[];
  searchTerm: string;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  pageInput: string;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  onProductionClick: (id: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputBlur: () => void;
  onSelectOrder?: (order: ProductionOrderResponse) => void;
}

// Horizontal Stepper for Table Row Progress
function HorizontalProductionProgress({ steps, isLate }: { steps?: any[]; isLate?: boolean }) {
  const activeStep = (steps && steps.length > 0)
    ? steps.find((s: any) => s.status === "in_progress" || s.status === "overdue" || s.isCurrent) || steps[0]
    : { stepName: "Bán thành phẩm", duration: "45 phút" };

  const stepName = activeStep.stepName || activeStep.stepTypeName || "Đang xử lý";
  const durationText = activeStep.duration || "45 phút";

  return (
    <div className="flex flex-col items-center justify-center space-y-1 w-full max-w-[220px] mx-auto">
      {/* Horizontal Line with Colored Dots */}
      <div className="flex items-center gap-1 w-full justify-between px-3 relative">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-0" />
        {[0, 1, 2, 3, 4].map((i) => {
          const isDone = i < 2;
          const isCurrent = i === 2;
          return (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full z-10 transition-colors border",
                isCurrent
                  ? isLate
                    ? "bg-red-500 border-red-600 ring-2 ring-red-200 dark:ring-red-950 animate-pulse"
                    : "bg-emerald-500 border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-950"
                  : isDone
                    ? "bg-emerald-500 border-emerald-600"
                    : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              )}
            />
          );
        })}
      </div>
      <span className={cn("text-[11px] font-bold truncate max-w-[180px]", isLate ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
        {stepName} ({durationText})
      </span>
    </div>
  );
}

export function ProductionListTable({
  isLoading,
  productions,
  searchTerm,
  totalCount,
  currentPage,
  itemsPerPage,
  totalPages,
  pageInput,
  tableContainerRef,
  onProductionClick,
  onPreviousPage,
  onNextPage,
  onPageInputChange,
  onPageInputBlur,
  onSelectOrder,
}: ProductionListTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingProofingId, setViewingProofingId] = useState<number | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === productions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(productions.map((p) => p.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto rounded-xl border bg-card shadow-2xs"
      >
        {isLoading ? (
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 border-b">
              <TableRow className="text-[11px] font-bold uppercase">
                <TableHead className="w-10 text-center"><Checkbox /></TableHead>
                <TableHead className="w-28 font-bold">Mã lệnh</TableHead>
                <TableHead className="w-20">Loại</TableHead>
                <TableHead className="w-56">Sản phẩm / Chất liệu</TableHead>
                <TableHead className="w-36">Khách hàng</TableHead>
                <TableHead className="w-32">Ngày lên bài</TableHead>
                <TableHead className="w-28 text-center">Trạng thái</TableHead>
                <TableHead className="w-48 text-center">Tiến độ sản xuất</TableHead>
                <TableHead className="w-28 text-center">Báo động</TableHead>
                <TableHead className="w-16 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={10} rows={8} rowHeight="h-14" />
            </TableBody>
          </Table>
        ) : productions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
            <Factory className="h-12 w-12 mb-3 text-muted-foreground/60" />
            <p className="text-sm font-semibold">Không tìm thấy Lệnh sản xuất nào phù hợp</p>
          </div>
        ) : (
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted/60 z-10 border-b text-[11px] font-extrabold uppercase">
              <TableRow>
                <TableHead className="w-10 text-center py-2.5">
                  <Checkbox
                    checked={selectedIds.length === productions.length && productions.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-28 py-2.5 font-bold">Mã lệnh</TableHead>
                <TableHead className="w-20 py-2.5">Loại</TableHead>
                <TableHead className="w-56 py-2.5">Sản phẩm / Chất liệu</TableHead>
                <TableHead className="w-36 py-2.5">Khách hàng</TableHead>
                <TableHead className="w-32 py-2.5">Ngày lên bài</TableHead>
                <TableHead className="w-28 text-center py-2.5">Trạng thái</TableHead>
                <TableHead className="w-48 text-center py-2.5">Tiến độ sản xuất</TableHead>
                <TableHead className="w-28 text-center py-2.5">Báo động</TableHead>
                <TableHead className="w-16 text-right py-2.5 pr-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((item: any) => {
                const isSelected = selectedIds.includes(item.id);
                const orderCode = item.proofingOrderCode || item.code || `LSX${String(item.id).padStart(6, "0")}`;
                const flowCode = item.flowCode || item.flowId || "F03";
                const productName = item.productName || item.proofingOrderTitle || "Hộp duplex bồi sóng";
                const specification = item.specification || "32×24×10 cm";
                const customerName = item.customerName || "Cty An Phát";
                const createdAtStr = item.createdAt ? format(new Date(item.createdAt), "dd/MM HH:mm") : "10/09 08:15";
                const dueDateStr = item.dueDate ? format(new Date(item.dueDate), "dd/MM") : "12/09";
                const statusText = item.statusDisplay || item.status || "Đang SX";

                const isLate = statusText.toLowerCase().includes("trễ") || statusText.toLowerCase().includes("quá hạn") || statusText.toLowerCase().includes("late");
                const isWarn = statusText.toLowerCase().includes("cảnh báo") || statusText.toLowerCase().includes("sắp");
                const isPendingNVL = statusText.toLowerCase().includes("chưa xuất") || statusText.toLowerCase().includes("vật tư");
                const isCompleted = statusText.toLowerCase().includes("hoàn thành") || statusText.toLowerCase().includes("done");

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "hover:bg-muted/60 transition-colors cursor-pointer border-b",
                      isSelected && "bg-amber-50/50 dark:bg-amber-950/20"
                    )}
                    onClick={() => onSelectOrder && onSelectOrder(item)}
                  >
                    {/* Checkbox */}
                    <TableCell className="text-center py-2.5 px-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>

                    {/* Mã lệnh */}
                    <TableCell className="py-2.5 font-bold font-mono text-primary hover:underline">
                      {orderCode}
                    </TableCell>

                    {/* Loại */}
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200">
                        {flowCode}
                      </Badge>
                    </TableCell>

                    {/* Sản phẩm / Chất liệu */}
                    <TableCell className="py-2.5">
                      <div className="flex flex-col leading-tight">
                        <span className="font-bold text-foreground text-xs">{productName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{specification}</span>
                      </div>
                    </TableCell>

                    {/* Khách hàng */}
                    <TableCell className="py-2.5 font-medium text-foreground">
                      {customerName}
                    </TableCell>

                    {/* Ngày lên bài / Hạn giao */}
                    <TableCell className="py-2.5 text-muted-foreground font-mono text-[11px] leading-tight">
                      <div className="font-bold text-foreground">{createdAtStr}</div>
                      <div className="text-[10px] text-slate-400">{dueDateStr}</div>
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell className="text-center py-2.5">
                      <Badge
                        className={cn(
                          "text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap",
                          isLate
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : isWarn
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : isPendingNVL
                                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : isCompleted
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        )}
                      >
                        {isLate ? "🔴 Quá hạn" : isWarn ? "🟡 Sắp quá hạn" : isPendingNVL ? "⚪ Chưa xuất NVL" : isCompleted ? "🟢 Hoàn thành" : "🔵 Đang SX"}
                      </Badge>
                    </TableCell>

                    {/* Tiến độ sản xuất */}
                    <TableCell className="py-2.5">
                      <HorizontalProductionProgress steps={item.steps} isLate={isLate} />
                    </TableCell>

                    {/* Báo động */}
                    <TableCell className="text-center py-2.5 font-mono text-xs font-bold">
                      {isLate ? (
                        <span className="text-red-600 dark:text-red-400 font-extrabold">+35 phút</span>
                      ) : isWarn ? (
                        <span className="text-amber-600 dark:text-amber-400">Còn 20 phút</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">Còn 120 phút</span>
                      )}
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell className="text-right py-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => onSelectOrder && onSelectOrder(item)}
                        title="Xem chi tiết lệnh"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between py-2.5 px-3 border-t bg-card text-xs font-medium text-muted-foreground">
        <div>
          Hiển thị <strong>{productions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{" "}
          <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> trong tổng số{" "}
          <strong>{totalCount}</strong> lệnh
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={currentPage <= 1}
            className="h-7 text-xs font-bold px-2"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Trang trước
          </Button>

          <span className="text-xs font-bold px-2 font-mono">
            Trang {currentPage} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="h-7 text-xs font-bold px-2"
          >
            Trang sau <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Proofing Modal */}
      {viewingProofingId && (
        <ReadOnlyProofingDetailModal
          proofingOrderId={viewingProofingId}
          open={!!viewingProofingId}
          onOpenChange={(open) => !open && setViewingProofingId(null)}
        />
      )}
    </div>
  );
}
