import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useStockOut,
  useCompleteStockOut,
  useCancelStockOut,
  useDeleteStockOut,
} from "@/hooks/use-stock";
import {
  formatDate,
  formatCurrency,
  stockOutPurposeLabels,
  stockOutStatusLabels,
} from "@/lib/status-utils";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  User,
  Printer,
} from "lucide-react";
import { apiRequest, API_SUFFIX } from "@/apis";

interface StockOutDetailDialogProps {
  stockOutId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockOutDetailDialog({
  stockOutId,
  open,
  onOpenChange,
}: StockOutDetailDialogProps) {
  const { data: stockOut, isLoading, isError } = useStockOut(stockOutId || 0, open && !!stockOutId);

  const { mutate: completeStockOut, isPending: isCompleting } = useCompleteStockOut();
  const { mutate: cancelStockOut, isPending: isCancelling } = useCancelStockOut();
  const { mutate: deleteStockOut, isPending: isDeleting } = useDeleteStockOut();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleComplete = () => {
    if (!stockOut?.id) return;
    completeStockOut(stockOut.id, {
      onSuccess: () => {
        toast.success("Đã hoàn thành phiếu xuất kho");
      },
    });
  };

  const handleCancel = () => {
    if (!stockOut?.id) return;
    if (!confirm("Bạn có chắc chắn muốn hủy phiếu xuất kho này?")) return;
    cancelStockOut(stockOut.id, {
      onSuccess: () => {
        toast.success("Đã hủy phiếu xuất kho");
      },
    });
  };

  const handleExportPdf = async () => {
    if (!stockOut?.id) return;
    try {
      setIsExportingPdf(true);
      const response = await apiRequest.get(API_SUFFIX.STOCK_OUT_PDF(stockOut.id), {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Phieu_Xuat_Kho_${stockOut.code || stockOut.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Không thể xuất file PDF phiếu xuất kho");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white border border-slate-200 shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Chi tiết phiếu xuất kho {stockOut?.code ? `#${stockOut.code}` : ""}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Thông tin chi tiết danh mục vật tư/thành phẩm xuất kho và lý do xuất
            </DialogDescription>
          </div>
          {stockOut && (
            <div className="mr-6">
              <StatusBadge status={stockOut.status} label={stockOutStatusLabels[stockOut.status] || stockOut.status || "—"} />
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs">Đang tải dữ liệu phiếu xuất kho...</span>
          </div>
        ) : isError || !stockOut ? (
          <div className="p-8 text-center text-red-500 text-xs">
            Không thể tải thông tin phiếu xuất kho hoặc phiếu đã bị xóa.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Thẻ Thông Tin Tổng Quan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Người nhận / Đơn vị
                </span>
                <p className="font-semibold text-slate-800">
                  {stockOut.receiverName || stockOut.customer?.name || stockOut.vendor?.name || "Khách lẻ / Nội bộ"}
                </p>
                {stockOut.receiverAddress && (
                  <span className="text-[10px] text-slate-500">ĐC: {stockOut.receiverAddress}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Lý do xuất kho
                </span>
                <p className="font-semibold text-slate-800">
                  {stockOutPurposeLabels[stockOut.reason] || stockOut.reason || "Khác"}
                </p>
                {stockOut.productionOrderCode && (
                  <span className="text-[10px] text-blue-600 font-medium">
                    ĐHSX: #{stockOut.productionOrderCode}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày xuất & Người lập
                </span>
                <p className="font-semibold text-slate-800">
                  {formatDate(stockOut.stockOutDate || stockOut.createdDate)}
                </p>
                {stockOut.createdByUser && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {stockOut.createdByUser.fullName || stockOut.createdByUser.username}
                  </span>
                )}
              </div>
            </div>

            {/* Ghi chú */}
            {stockOut.notes && (
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-xs">
                <span className="text-slate-500 block mb-0.5">Ghi chú:</span>
                <p className="text-slate-800 italic">{stockOut.notes}</p>
              </div>
            )}

            {/* Bảng Mặt Hàng Xuất Kho */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" /> Danh sách vật tư / hàng hóa ({stockOut.items?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-100/80">
                    <TableRow>
                      <TableHead className="w-12 text-center">STT</TableHead>
                      <TableHead>Tên vật tư / Quy cách</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-center">ĐVT</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right font-bold">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!stockOut.items || stockOut.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                          Không có mặt hàng nào trong phiếu này.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockOut.items.map((item: any, idx: number) => {
                        const qty = item.quantity;
                        const unit = item.unit;
                        const unitPrice = item.unitPrice || 0;
                        const lineTotal = (qty || 0) * unitPrice;

                        return (
                          <TableRow key={item.id || idx} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-medium text-slate-500">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-slate-800">{item.itemName || item.displayName || "Mặt hàng không tên"}</div>
                              {item.itemCode && <span className="text-[10px] text-slate-400">Mã: {item.itemCode}</span>}
                              {item.notes && <div className="text-[10px] text-slate-500 italic">{item.notes}</div>}
                            </TableCell>
                            <TableCell className="text-right font-medium text-slate-800">
                              {qty?.toLocaleString("vi-VN") || 0}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">{unit || "—"}</TableCell>
                            <TableCell className="text-right text-slate-700">
                              {unitPrice ? `${formatCurrency(unitPrice)} ₫` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {lineTotal ? `${formatCurrency(lineTotal)} ₫` : "0 ₫"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Tổng cộng */}
              <div className="flex justify-end mt-3">
                <div className="bg-blue-50/80 border border-blue-200/80 px-4 py-2 rounded-lg text-right">
                  <span className="text-xs text-blue-800 font-medium">Tổng giá trị xuất kho: </span>
                  <strong className="text-sm font-bold text-blue-900 ml-2">
                    {formatCurrency(stockOut.totalAmount ?? 0)} ₫
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf || !stockOut}
              className="h-8 text-xs gap-1.5"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Xuất PDF
            </Button>
            {stockOut?.status === "PENDING" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
                className="h-8 text-xs gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Hủy phiếu
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Đóng
            </Button>
            {stockOut?.status === "PENDING" && (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Hoàn tất xuất kho
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
