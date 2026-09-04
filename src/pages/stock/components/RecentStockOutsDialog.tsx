import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Info, Eye, FileText, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

import { stockOutPurposeLabels, stockOutStatusLabels } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";

interface RecentStockOutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockOuts: any[];
  isLoading: boolean;
  stockOutDate: string;
  onStockOutDateChange: (date: string) => void;
  stockOutPage: number;
  onStockOutPageChange: (page: number | ((prev: number) => number)) => void;
  totalStockOutPages: number;
  totalCount: number;
  onViewDetails: (id: number) => void;
  onViewAll: () => void;
  translatePurpose?: (purpose: string | null | undefined) => string;
  getStatusBadge?: (status: string | null | undefined) => React.ReactNode;
}

const defaultTranslatePurpose = (purpose: string | null | undefined) => {
  if (!purpose) return "Khác";
  return stockOutPurposeLabels[purpose] || purpose;
};

const defaultGetStatusBadge = (status: string | null | undefined) => {
  return <StatusBadge status={status} label={stockOutStatusLabels[status || ""] || status || "—"} />;
};

export function RecentStockOutsDialog({
  open,
  onOpenChange,
  stockOuts,
  isLoading,
  stockOutDate,
  onStockOutDateChange,
  stockOutPage,
  onStockOutPageChange,
  totalStockOutPages,
  totalCount,
  onViewDetails,
  onViewAll,
  translatePurpose = defaultTranslatePurpose,
  getStatusBadge = defaultGetStatusBadge,
}: RecentStockOutsDialogProps) {
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[80vh] max-h-[85vh] rounded-2xl border-none p-0 overflow-hidden shadow-2xl bg-slate-50 flex flex-col [&>button]:text-white [&>button]:hover:text-white/80 [&>button]:opacity-90 [&>button]:h-7 [&>button]:w-7 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:bg-white/15 [&>button]:hover:bg-white/25 [&>button]:rounded-full [&>button]:transition-all">
        <DialogHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-5 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5.5 w-5.5 text-slate-300" />
            Danh sách phiếu xuất kho theo ngày
          </DialogTitle>
          <DialogDescription className="text-white/80 text-xs mt-1">
            Tra cứu và xem nhanh các phiếu xuất kho đã lập theo ngày.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
                <Calendar className="h-3.5 w-3.5" />
                Lọc ngày xuất:
              </span>
              <Input
                type="date"
                value={stockOutDate}
                onChange={(e) => {
                  onStockOutDateChange(e.target.value);
                  onStockOutPageChange(1);
                }}
                className="h-8 text-xs bg-white border-slate-200 rounded-lg pr-2 cursor-pointer focus-visible:ring-slate-500 w-full sm:w-[180px]"
              />
              {stockOutDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onStockOutDateChange("");
                    onStockOutPageChange(1);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 rounded-lg px-2"
                >
                  Xóa ngày
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="text-xs text-slate-700 hover:bg-slate-50 border-slate-200 cursor-pointer h-8 rounded-lg font-bold w-full sm:w-auto"
            >
              Xem trang quản lý phiếu xuất
            </Button>
          </div>

          {/* List/Table */}
          <div className="flex-1 min-h-0 border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col">
            {isLoading ? (
              <div className="py-20 flex-1">
                <TableSkeletonRows cols={7} rows={6} />
              </div>
            ) : stockOuts.length === 0 ? (
              <div className="py-20 text-center flex-1 flex flex-col items-center justify-center">
                <Info className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">Chưa có phiếu xuất kho nào</p>
                <p className="text-xs text-slate-400 mt-1">Hệ thống chưa ghi nhận phiếu xuất kho nào phù hợp với ngày đã chọn.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 whitespace-nowrap text-xs border-b border-slate-200/60 sticky top-0 z-10">
                      <TableHead className="w-[120px] font-bold py-2.5 pl-4">Số phiếu</TableHead>
                      <TableHead className="w-[120px] font-bold py-2.5">Ngày xuất</TableHead>
                      <TableHead className="min-w-[140px] font-bold py-2.5">Loại Phiếu</TableHead>
                      <TableHead className="min-w-[200px] font-bold py-2.5">Khách hàng / Đối tác</TableHead>
                      <TableHead className="w-[150px] font-bold py-2.5">Kho xuất</TableHead>
                      <TableHead className="w-[120px] text-center font-bold py-2.5">Trạng thái</TableHead>
                      <TableHead className="w-[60px] text-center font-bold py-2.5 pr-4">Xem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockOuts.map((item: any) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                        onClick={() => onViewDetails(item.id)}
                      >
                        <TableCell className="font-mono font-bold py-3 pl-4 text-slate-800">
                          {item.code || `PXK-${item.id}`}
                        </TableCell>
                        <TableCell className="py-3 text-slate-600">
                          {item.stockOutDate ? formatDate(item.stockOutDate) : "—"}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-slate-700">
                          {translatePurpose(item.purposeName || item.purpose || item.type)}
                        </TableCell>
                        <TableCell className="py-3 text-slate-600 truncate max-w-[200px]" title={item.customer?.name || item.vendorName || item.vendor?.name || item.supplier?.name || "—"}>
                          {item.customer?.name || item.vendorName || item.vendor?.name || item.supplier?.name || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-slate-600">
                          {item.warehouse || item.warehouseName || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="inline-flex justify-center w-full">
                            {getStatusBadge(item.status)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center pr-4" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                            onClick={() => onViewDetails(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalStockOutPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <span className="text-[11px] font-medium text-slate-500">
                  Trang {stockOutPage} / {totalStockOutPages} ({totalCount} phiếu)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                    onClick={() => onStockOutPageChange(p => Math.max(1, p - 1))}
                    disabled={stockOutPage === 1 || isLoading}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                    onClick={() => onStockOutPageChange(p => Math.min(totalStockOutPages, p + 1))}
                    disabled={stockOutPage === totalStockOutPages || isLoading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 text-xs rounded-xl font-bold border-slate-200 bg-white hover:bg-slate-50 cursor-pointer px-5"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeletal loading helper for tables
function TableSkeletonRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <div className="p-4 space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
