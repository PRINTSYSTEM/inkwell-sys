import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Package,
  Calendar,
  Building2,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Hash,
  User,
  Factory,
  Truck,
  Box,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useStockOut,
  useCompleteStockOut,
  useCancelStockOut,
  useDeleteStockOut,
} from "@/hooks/use-stock";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

const formatDateOnly = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Không có";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTimeFull = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Không có";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function StockOutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stockOutId = Number.parseInt(id || "0", 10);

  const {
    data: stockOut,
    isLoading,
    isError,
    error,
  } = useStockOut(stockOutId || null, !!stockOutId);

  const { mutate: completeStockOut, isPending: isCompleting } =
    useCompleteStockOut();
  const { mutate: cancelStockOut, isPending: isCancelling } = useCancelStockOut();
  const { mutate: deleteStockOut, isPending: isDeleting } = useDeleteStockOut();

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "complete" | "cancel" | "delete" | null;
    title: string;
    description: string;
    confirmText: string;
    confirmVariant?: "default" | "destructive";
  }>({
    open: false,
    type: null,
    title: "",
    description: "",
    confirmText: "",
    confirmVariant: "default",
  });

  const handleComplete = () => {
    if (!stockOut?.id) return;
    setConfirmDialog({
      open: true,
      type: "complete",
      title: "Xác nhận hoàn thành phiếu xuất kho",
      description:
        "Bạn có chắc chắn muốn hoàn thành phiếu xuất kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = () => {
    if (!stockOut?.id) return;
    setConfirmDialog({
      open: true,
      type: "cancel",
      title: "Xác nhận hủy phiếu xuất kho",
      description:
        "Bạn có chắc chắn muốn hủy phiếu xuất kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleDelete = () => {
    if (!stockOut?.id) return;
    setConfirmDialog({
      open: true,
      type: "delete",
      title: "Xác nhận xóa phiếu xuất kho",
      description:
        "Bạn có chắc chắn muốn xóa phiếu xuất kho này? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu.",
      confirmText: "Xóa",
      confirmVariant: "destructive",
    });
  };

  const handleConfirm = () => {
    if (!stockOut?.id || !confirmDialog.type) return;

    switch (confirmDialog.type) {
      case "complete":
        completeStockOut(stockOut.id, {
          onSuccess: () => {
            toast.success("Đã hoàn thành phiếu xuất kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "cancel":
        cancelStockOut(stockOut.id, {
          onSuccess: () => {
            toast.success("Đã hủy phiếu xuất kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "delete":
        deleteStockOut(stockOut.id, {
          onSuccess: () => {
            toast.success("Đã xóa phiếu xuất kho");
            setConfirmDialog({ ...confirmDialog, open: false });
            navigate("/stock/stock-outs");
          },
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
          <p className="text-slate-600">Đang tải phiếu xuất kho...</p>
        </div>
      </div>
    );
  }

  if (isError || !stockOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <h1 className="text-xl font-semibold text-slate-900">
                Không tìm thấy phiếu xuất kho
              </h1>
              <p className="text-slate-600">
                Phiếu xuất kho không tồn tại hoặc đã bị xóa
              </p>
              <Button onClick={() => navigate("/stock/stock-outs")}>
                Quay lại danh sách
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = stockOut.items || [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const status = stockOut.status || "pending";

  return (
    <>
      <Helmet>
        <title>
          Phiếu xuất kho #{stockOut.code || stockOut.id} | Inkwell System
        </title>
      </Helmet>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/20 overflow-hidden">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/stock/stock-outs")}
                  className="cursor-pointer transition-colors duration-200 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
                <div className="h-6 w-px bg-slate-300" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      Phiếu xuất kho{" "}
                      {stockOut.code ? `#${stockOut.code}` : `#${stockOut.id}`}
                    </h1>
                    <p className="text-xs text-slate-500">
                      Chi tiết phiếu xuất kho
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleComplete}
                      disabled={isCompleting}
                      className="cursor-pointer transition-colors duration-200"
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Hoàn thành
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="cursor-pointer transition-colors duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Hủy
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="cursor-pointer transition-colors duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            {/* Status and Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 px-4 py-2.5 border-b border-slate-200/60">
                <CardTitle className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-2.5">
                {stockOut.status && (
                  <StatusBadge
                    status={stockOut.status}
                    label={stockOut.statusName || stockOut.status}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 px-6 py-4 border-b border-slate-200/60">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Tổng số lượng
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4">
                <p className="text-lg font-bold text-slate-900">
                  {totalQuantity.toLocaleString("vi-VN")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Information Card */}
          <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 px-4 py-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Thông tin phiếu xuất kho
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Column 1: Thông tin cơ bản */}
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                    <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Ngày xuất kho
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {stockOut.stockOutDate
                          ? formatDateTimeFull(stockOut.stockOutDate)
                          : "Chưa có"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                    <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Lý do xuất
                      </p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {stockOut.purpose || "Không có"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Box className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Loại vật phẩm
                      </p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {stockOut.itemType || "Không có"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Thông tin liên quan */}
                <div className="space-y-3.5">
                  {stockOut.productionOrder && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Factory className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          Lệnh sản xuất
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {stockOut.productionOrder.code ||
                            `Lệnh sản xuất #${stockOut.productionOrder.id}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {stockOut.deliveryNote && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          Phiếu giao hàng
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {stockOut.deliveryNote.code ||
                            `Phiếu giao hàng #${stockOut.deliveryNote.id}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {stockOut.customer && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          Khách hàng
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {stockOut.customer.name || "Không có"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Thông tin hệ thống */}
                <div className="space-y-3.5">
                  {stockOut.createdBy && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-9 w-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          Người tạo
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {stockOut.createdBy.fullName || "Không có"}
                        </p>
                      </div>
                    </div>
                  )}

                  {stockOut.createdAt && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-9 w-9 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          Ngày tạo
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {formatDateTimeFull(stockOut.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {stockOut.notes && (
                <>
                  <Separator className="my-4" />
                  <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-200/60">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-700">
                        Ghi chú
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3 pl-6">
                      {stockOut.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Items Table Card */}
          <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden flex-1 flex flex-col min-h-0">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 px-4 py-3 border-b border-slate-200/60 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Danh sách vật phẩm ({items.length})
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
                    <TableRow className="bg-slate-50/95">
                      <TableHead className="font-semibold text-slate-700 text-xs py-2 px-3 w-12">
                        STT
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-xs py-2 px-3">
                        Tên vật phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-xs py-2 px-3">
                        Mã vật phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-xs py-2 px-3 w-20">
                        Đơn vị
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-xs py-2 px-3 text-right w-24">
                        Số lượng
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-xs py-2 px-3 w-32">
                        Ghi chú
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-slate-500 text-xs"
                        >
                          Không có vật phẩm nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-slate-50/50 transition-colors duration-150"
                        >
                          <TableCell className="text-slate-600 text-xs py-2 px-3">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 text-xs py-2 px-3">
                            {item.itemName || "Không có"}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs py-2 px-3">
                            {item.itemCode || "Không có"}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs py-2 px-3">
                            {item.unit || "Không có"}
                          </TableCell>
                          <TableCell className="text-right text-slate-600 text-xs py-2 px-3">
                            {(item.quantity || 0).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs py-2 px-3 truncate max-w-[120px]">
                            {item.notes || "Không có"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                confirmDialog.confirmVariant === "destructive"
                  ? "bg-red-100"
                  : "bg-orange-100"
              }`}>
                {confirmDialog.confirmVariant === "destructive" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {confirmDialog.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              className="cursor-pointer transition-colors duration-200"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant={confirmDialog.confirmVariant || "default"}
              onClick={handleConfirm}
              disabled={
                (confirmDialog.type === "complete" && isCompleting) ||
                (confirmDialog.type === "cancel" && isCancelling) ||
                (confirmDialog.type === "delete" && isDeleting)
              }
              className={`cursor-pointer transition-colors duration-200 ${
                confirmDialog.confirmVariant === "destructive"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {(confirmDialog.type === "complete" && isCompleting) ||
              (confirmDialog.type === "cancel" && isCancelling) ||
              (confirmDialog.type === "delete" && isDeleting) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                confirmDialog.confirmText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

