import { useState, useEffect } from "react";
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
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useStockIn,
  useCompleteStockIn,
  useCancelStockIn,
  useDeleteStockIn,
  useUpdateStockIn,
} from "@/hooks/use-stock";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  stockInSourceLabels,
  stockInItemTypeLabels,
} from "@/lib/status-utils";
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

export default function StockInDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stockInId = Number.parseInt(id || "0", 10);

  const {
    data: stockIn,
    isLoading,
    isError,
    error,
  } = useStockIn(stockInId || null, !!stockInId);

  const { mutate: completeStockIn, isPending: isCompleting } =
    useCompleteStockIn();
  const { mutate: cancelStockIn, isPending: isCancelling } = useCancelStockIn();
  const { mutate: deleteStockIn, isPending: isDeleting } = useDeleteStockIn();

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

  // Update Price & Notes Dialog state
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const { mutate: updateStockIn, isPending: isUpdating } = useUpdateStockIn();

  // Initialize edit items when dialog opens
  useEffect(() => {
    if (isUpdateDialogOpen && stockIn?.items) {
      setEditItems(
        stockIn.items.map((item: any) => ({
          ...item,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          laborCost: item.laborCost ?? 0,
          notes: item.notes ?? "",
          proofingOrderId: item.proofingOrderId ?? null,
        }))
      );
    }
  }, [isUpdateDialogOpen, stockIn]);

  const handleEditItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setEditItems(newItems);
  };

  const handleSaveUpdate = () => {
    if (!stockIn?.id) return;

    const hasInvalidQuantity = editItems.some(
      (item) => !item.quantity || item.quantity < 1
    );
    if (hasInvalidQuantity) {
      toast.error("Số lượng của tất cả vật phẩm phải lớn hơn hoặc bằng 1");
      return;
    }

    // Calculate new total amount as sum of (quantity * unitPrice) of all items
    const newTotalAmount = editItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );

    // Map items to update request format
    const updatedItems = editItems.map((item) => ({
      itemName: item.itemName,
      itemCode: item.itemCode,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      laborCost: item.laborCost,
      notes: item.notes,
      materialId: item.materialId,
      orderDetailId: item.orderDetailId,
      lineKind: item.lineKind,
      length: item.length,
      width: item.width,
      height: item.height,
      proofingOrderId: typeof item.proofingOrderId === 'string' ? (item.proofingOrderId.trim() || null) : (item.proofingOrderId ?? null),
    }));

    updateStockIn(
      {
        id: stockIn.id,
        data: {
          items: updatedItems,
          totalAmount: newTotalAmount,
        },
      },
      {
        onSuccess: () => {
          setIsUpdateDialogOpen(false);
        },
      }
    );
  };

  const handleComplete = () => {
    if (!stockIn?.id) return;
    setConfirmDialog({
      open: true,
      type: "complete",
      title: "Xác nhận hoàn thành phiếu nhập kho",
      description:
        "Bạn có chắc chắn muốn hoàn thành phiếu nhập kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = () => {
    if (!stockIn?.id) return;
    setConfirmDialog({
      open: true,
      type: "cancel",
      title: "Xác nhận hủy phiếu nhập kho",
      description:
        "Bạn có chắc chắn muốn hủy phiếu nhập kho này? Hành động này không thể hoàn tác.",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleDelete = () => {
    if (!stockIn?.id) return;
    setConfirmDialog({
      open: true,
      type: "delete",
      title: "Xác nhận xóa phiếu nhập kho",
      description:
        "Bạn có chắc chắn muốn xóa phiếu nhập kho này? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu.",
      confirmText: "Xóa",
      confirmVariant: "destructive",
    });
  };

  const handleConfirm = () => {
    if (!stockIn?.id || !confirmDialog.type) return;

    switch (confirmDialog.type) {
      case "complete":
        completeStockIn(stockIn.id, {
          onSuccess: () => {
            toast.success("Đã hoàn thành phiếu nhập kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "cancel":
        cancelStockIn(stockIn.id, {
          onSuccess: () => {
            toast.success("Đã hủy phiếu nhập kho");
            setConfirmDialog({ ...confirmDialog, open: false });
          },
        });
        break;
      case "delete":
        deleteStockIn(stockIn.id, {
          onSuccess: () => {
            toast.success("Đã xóa phiếu nhập kho");
            setConfirmDialog({ ...confirmDialog, open: false });
            navigate("/stock/stock-ins");
          },
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-slate-600 font-medium">Đang tải phiếu nhập kho...</p>
        </div>
      </div>
    );
  }

  if (isError || !stockIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <h1 className="text-xl font-semibold text-slate-900">
                Không tìm thấy phiếu nhập kho
              </h1>
              <p className="text-slate-600">
                Phiếu nhập kho không tồn tại hoặc đã bị xóa
              </p>
              <Button onClick={() => navigate("/stock/stock-ins")}>
                Quay lại danh sách
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = stockIn.items || [];
  const totalQuantity = items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const totalAmount = stockIn.totalAmount || 0;
  const status = stockIn.status || "pending";

  return (
    <>
      <Helmet>
        <title>
          Phiếu nhập kho #{stockIn.code || stockIn.id} | Inkwell System
        </title>
      </Helmet>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 overflow-hidden">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/stock/stock-ins")}
                  className="cursor-pointer transition-colors duration-200 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
                <div className="h-6 w-px bg-slate-300" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      Phiếu nhập kho{" "}
                      {stockIn.code ? `#${stockIn.code}` : `#${stockIn.id}`}
                    </h1>
                    <p className="text-xs text-slate-500">
                      Chi tiết phiếu nhập kho
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
                {(status === "pending" || status === "completed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUpdateDialogOpen(true)}
                    className="cursor-pointer transition-colors duration-200 border-[#93631F]/30 text-[#93631F] hover:bg-[#93631F]/5 hover:border-[#93631F]/50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Cập nhật số lượng, đơn giá & ghi chú
                  </Button>
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
            {/* Items Table Card - Moved to top */}
            <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden flex-1 flex flex-col min-h-[500px]">
              <CardHeader className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 px-4 py-3 border-b border-slate-200/60 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold text-slate-900">
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
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 w-12">
                          STT
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4">
                          Tên vật phẩm
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4">
                          Mã vật phẩm
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 w-24">
                          Đơn vị
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 text-right w-28">
                          Số lượng
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 text-right w-32">
                          Đơn giá
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 text-right w-32">
                          Tiền công
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 w-28">
                          Mã bài
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-sm py-3 px-4 w-40">
                          Ghi chú
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-12 text-slate-500 text-sm"
                          >
                            Không có vật phẩm nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => {
                          return (
                            <TableRow
                              key={index}
                              className="hover:bg-slate-50/50 transition-colors duration-150"
                            >
                              <TableCell className="text-slate-600 text-sm py-3 px-4">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium text-slate-900 text-sm py-3 px-4">
                                {item.itemName || "Không có"}
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm py-3 px-4">
                                {item.itemCode || "Không có"}
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm py-3 px-4">
                                {item.unit || "Không có"}
                              </TableCell>
                              <TableCell className="text-right text-slate-600 text-sm py-3 px-4">
                                {(item.quantity || 0).toLocaleString("vi-VN")}
                              </TableCell>
                              <TableCell className="text-right text-slate-600 text-sm py-3 px-4">
                                {item.unitPrice
                                  ? formatCurrency(item.unitPrice)
                                  : "Không có"}
                              </TableCell>
                              <TableCell className="text-right text-slate-600 text-sm py-3 px-4">
                                {item.laborCost !== undefined && item.laborCost !== null
                                  ? formatCurrency(item.laborCost)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm py-3 px-4">
                                {item.proofingOrderId || "—"}
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm py-3 px-4 truncate max-w-[160px]">
                                {item.notes || "Không có"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Status and Summary Cards - Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-3 py-2 border-b border-slate-200/60">
                  <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    Trạng thái
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-2.5">
                  {stockIn.status && (
                    <StatusBadge
                      status={stockIn.status}
                      label={
                        stockIn.statusName && stockIn.statusName.toLowerCase() !== "pending"
                          ? stockIn.statusName
                          : stockIn.status.toLowerCase() === "pending"
                          ? "Chờ xử lý"
                          : stockIn.statusName || stockIn.status
                      }
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-3 py-2 border-b border-slate-200/60">
                  <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Box className="h-3 w-3" />
                    Tổng số lượng
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-2.5">
                  <p className="text-base font-bold text-slate-900">
                    {totalQuantity.toLocaleString("vi-VN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-3 py-2 border-b border-slate-200/60">
                  <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Tổng giá trị
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-2.5">
                  <p className="text-base font-bold text-slate-900">
                    {formatCurrency(totalAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-3 py-2 border-b border-slate-200/60">
                  <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" />
                    Chi phí nhân công
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-2.5">
                  <p className="text-base font-bold text-slate-900">
                    {formatCurrency(stockIn.laborCost ?? 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Information Card - Compact */}
            <Card className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-3 py-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                      Thông tin phiếu nhập kho
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Column 1: Thông tin cơ bản */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-0.5">
                          Ngày nhập kho
                        </p>
                        <p className="text-xs font-semibold text-slate-900">
                          {stockIn.stockInDate
                            ? formatDateTimeFull(stockIn.stockInDate)
                            : "Chưa có"}
                        </p>
                      </div>
                    </div>

                    {stockIn.vendor && (
                      <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 mb-0.5">
                            Nhà cung cấp
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {stockIn.vendor.name || "Không có"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Hash className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-0.5">
                          Nguồn nhập
                        </p>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {stockIn.vendorName ||
                            (stockIn.source
                              ? stockInSourceLabels[stockIn.source.toLowerCase()] || stockIn.source
                              : "Không có")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Thông tin liên quan */}
                  <div className="space-y-2.5">
                    {stockIn.productionOrder && (
                      <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                        <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Factory className="h-3.5 w-3.5 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 mb-0.5">
                            Lệnh sản xuất
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {stockIn.productionOrder.code ||
                              `Lệnh sản xuất #${stockIn.productionOrder.id}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {stockIn.deliveryNote && (
                      <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <Truck className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 mb-0.5">
                            Phiếu giao hàng
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {stockIn.deliveryNote.code ||
                              `Phiếu giao hàng #${stockIn.deliveryNote.id}`}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Box className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-0.5">
                          Loại vật phẩm
                        </p>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {stockIn.itemType
                            ? stockInItemTypeLabels[stockIn.itemType.toLowerCase()] || stockIn.itemType
                            : "Không có"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Thông tin hệ thống */}
                  <div className="space-y-2.5">
                    {stockIn.createdBy && (
                      <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                        <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-pink-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 mb-0.5">
                            Người tạo
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {stockIn.createdBy.fullName || "Không có"}
                          </p>
                        </div>
                      </div>
                    )}

                    {stockIn.createdAt && (
                      <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                        <div className="h-8 w-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-cyan-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500 mb-0.5">
                            Ngày tạo
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {formatDateTimeFull(stockIn.createdAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {stockIn.notes && (
                  <>
                    <Separator className="my-3" />
                    <div className="p-2.5 rounded-lg bg-slate-50/50 border border-slate-200/60">
                      <div className="flex items-start gap-2 mb-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-semibold text-slate-700">
                          Ghi chú
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3 pl-6">
                        {stockIn.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  confirmDialog.confirmVariant === "destructive"
                    ? "bg-red-100"
                    : "bg-emerald-100"
                }`}
              >
                {confirmDialog.confirmVariant === "destructive" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-emerald-600" />
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
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
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
                  : "bg-emerald-600 hover:bg-emerald-700"
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

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-xl">
          <DialogHeader className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Cập nhật số lượng, đơn giá & ghi chú
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Chỉnh sửa số lượng, giá nhập và ghi chú của các vật phẩm trong phiếu. Tổng giá trị phiếu sẽ tự động cập nhật.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/95 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-semibold py-2.5">STT</TableHead>
                    <TableHead className="text-xs font-semibold py-2.5">Tên vật phẩm</TableHead>
                    <TableHead className="w-32 text-right text-xs font-semibold py-2.5">Số lượng</TableHead>
                    <TableHead className="w-32 text-xs font-semibold py-2.5">Đơn giá</TableHead>
                    <TableHead className="w-32 text-xs font-semibold py-2.5">Tiền công</TableHead>
                    <TableHead className="w-24 text-xs font-semibold py-2.5">Mã bài</TableHead>
                    <TableHead className="w-48 text-xs font-semibold py-2.5">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editItems.map((item, index) => {
                    return (
                      <TableRow key={index} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <TableCell className="text-center text-xs font-medium text-slate-500 py-3">
                          {index + 1}
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.itemName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.itemCode || "Không có mã"}</p>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity ?? ""}
                              onChange={(e) =>
                                handleEditItemChange(
                                  index,
                                  "quantity",
                                  e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="h-8 w-20 text-xs font-medium text-right focus-visible:ring-[#93631F]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] text-slate-500 whitespace-nowrap min-w-[24px] text-left">
                              {item.unit || "đv"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice ?? ""}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "unitPrice",
                                e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-xs font-medium focus-visible:ring-[#93631F]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.laborCost ?? ""}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "laborCost",
                                e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-xs font-medium focus-visible:ring-[#93631F]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="text"
                            value={item.proofingOrderId ?? ""}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "proofingOrderId",
                                e.target.value === "" ? null : e.target.value
                              )
                            }
                            placeholder="Mã bài"
                            className="h-8 text-xs font-medium focus-visible:ring-[#93631F]/30"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            value={item.notes || ""}
                            onChange={(e) =>
                              handleEditItemChange(index, "notes", e.target.value)
                            }
                            placeholder="Ghi chú cho vật phẩm..."
                            className="h-8 text-xs focus-visible:ring-[#93631F]/30"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Total Summary Row */}
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị phiếu mới</p>
                <p className="text-xs text-slate-500 mt-0.5">Tự động tính từ tổng thành tiền của các mặt hàng.</p>
              </div>
              <p className="text-xl font-black text-slate-900">
                {formatCurrency(
                  editItems.reduce(
                    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              className="cursor-pointer transition-all duration-200 hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSaveUpdate}
              disabled={isUpdating}
              className="cursor-pointer transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow active:scale-98"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
