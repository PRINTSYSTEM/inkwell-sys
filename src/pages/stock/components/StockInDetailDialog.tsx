import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useStockIn,
  useCompleteStockIn,
  useCancelStockIn,
  useDeleteStockIn,
} from "@/hooks/use-stock";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  stockInSourceLabels,
  stockInItemTypeLabels,
  stockInStatusLabels,
} from "@/lib/status-utils";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  Building2,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  User,
  Printer,
} from "lucide-react";
import { apiRequest, API_SUFFIX } from "@/apis";

interface StockInDetailDialogProps {
  stockInId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockInDetailDialog({
  stockInId,
  open,
  onOpenChange,
}: StockInDetailDialogProps) {
  const { data: stockIn, isLoading, isError } = useStockIn(stockInId || 0, open && !!stockInId);

  const { mutate: completeStockIn, isPending: isCompleting } = useCompleteStockIn();
  const { mutate: cancelStockIn, isPending: isCancelling } = useCancelStockIn();
  const { mutate: deleteStockIn, isPending: isDeleting } = useDeleteStockIn();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const isThuanTienStockIn = stockIn?.vendor
    ? stockIn.vendor.name?.toLowerCase().trim() === "thuận tiền" ||
      stockIn.vendor.name?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === "thuan tien"
    : false;

  const handleComplete = () => {
    if (!stockIn?.id) return;
    completeStockIn(stockIn.id, {
      onSuccess: () => {
        toast.success("Đã hoàn thành phiếu nhập kho");
      },
    });
  };

  const handleCancel = () => {
    if (!stockIn?.id) return;
    if (!confirm("Bạn có chắc chắn muốn hủy phiếu nhập kho này?")) return;
    cancelStockIn(stockIn.id, {
      onSuccess: () => {
        toast.success("Đã hủy phiếu nhập kho");
      },
    });
  };

  const handleDelete = () => {
    if (!stockIn?.id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu nhập kho này? Hành động này không thể hoàn tác.")) return;
    deleteStockIn(stockIn.id, {
      onSuccess: () => {
        toast.success("Đã xóa phiếu nhập kho");
        onOpenChange(false);
      },
    });
  };

  const handleExportPdf = async () => {
    if (!stockIn?.id) return;
    try {
      setIsExportingPdf(true);
      const response = await apiRequest.get(`${API_SUFFIX.STOCK_IN_BY_ID(stockIn.id)}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Phieu_Nhap_Kho_${stockIn.code || stockIn.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Không thể xuất file PDF phiếu nhập kho");
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
              <Package className="w-5 h-5 text-amber-600" />
              Chi tiết phiếu nhập kho {stockIn?.code ? `#${stockIn.code}` : ""}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Thông tin chi tiết danh mục vật tư nhập kho và lịch sử ghi nhận
            </DialogDescription>
          </div>
          {stockIn && (
            <div className="mr-6">
              <StatusBadge status={stockIn.status} label={stockInStatusLabels[stockIn.status] || stockIn.status || "—"} />
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="text-xs">Đang tải dữ liệu phiếu nhập kho...</span>
          </div>
        ) : isError || !stockIn ? (
          <div className="p-8 text-center text-red-500 text-xs">
            Không thể tải thông tin phiếu nhập kho hoặc phiếu đã bị xóa.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Thẻ Thông Tin Tổng Quan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Nhà cung cấp
                </span>
                <p className="font-semibold text-slate-800">{stockIn.vendor?.name || "Không rõ"}</p>
                {stockIn.vendor?.code && (
                  <span className="text-[10px] text-slate-500">Mã NCC: {stockIn.vendor.code}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Nguồn nhập & Loại
                </span>
                <p className="font-semibold text-slate-800">
                  {stockInSourceLabels[stockIn.source] || stockIn.source || "Khác"}
                </p>
                <span className="text-[10px] text-slate-500">
                  Loại: {stockInItemTypeLabels[stockIn.itemType] || stockIn.itemType || "Khác"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày tạo & Người tạo
                </span>
                <p className="font-semibold text-slate-800">
                  {formatDate(stockIn.createdDate)}
                </p>
                {stockIn.createdByUser && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {stockIn.createdByUser.fullName || stockIn.createdByUser.username}
                  </span>
                )}
              </div>
            </div>

            {/* Thông tin hóa đơn / ghi chú */}
            {(stockIn.invoiceNumber || stockIn.notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {stockIn.invoiceNumber && (
                  <div className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-lg">
                    <span className="text-slate-500 block mb-0.5">Số hóa đơn / Chứng từ:</span>
                    <strong className="text-amber-900 font-semibold">{stockIn.invoiceNumber}</strong>
                  </div>
                )}
                {stockIn.notes && (
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg">
                    <span className="text-slate-500 block mb-0.5">Ghi chú:</span>
                    <p className="text-slate-800 italic">{stockIn.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bảng Mặt Hàng Nhập Kho */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" /> Danh sách vật tư / hàng hóa ({stockIn.items?.length || 0})
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
                    {!stockIn.items || stockIn.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                          Không có mặt hàng nào trong phiếu này.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockIn.items.map((item: any, idx: number) => {
                        const qty = isThuanTienStockIn ? item.ramQuantity : item.quantity;
                        const unit = isThuanTienStockIn ? "ram" : item.unit;
                        const unitPrice = isThuanTienStockIn && item.ramQuantity ? (item.unitPrice ?? 0) * 500 : item.unitPrice;
                        const lineTotal = (qty || 0) * (unitPrice || 0);

                        return (
                          <TableRow key={item.id || idx} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-medium text-slate-500">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-slate-800">{item.itemName || "Vật tư không tên"}</div>
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
                <div className="bg-amber-50/80 border border-amber-200/80 px-4 py-2 rounded-lg text-right">
                  <span className="text-xs text-amber-800 font-medium">Tổng giá trị nhập kho: </span>
                  <strong className="text-sm font-bold text-amber-900 ml-2">
                    {formatCurrency(stockIn.totalAmount ?? 0)} ₫
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
              disabled={isExportingPdf || !stockIn}
              className="h-8 text-xs gap-1.5"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Xuất PDF
            </Button>
            {stockIn?.status === "PENDING" && (
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
            {stockIn?.status === "PENDING" && (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Hoàn tất nhập kho
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
