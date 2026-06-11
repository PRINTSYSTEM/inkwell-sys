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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  ArrowRight,
  AlertTriangle
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useStockOut,
  useCompleteStockOut,
  useCancelStockOut,
  useDeleteStockOut,
  useUpdateStockOut,
} from "@/hooks/use-stock";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  stockOutPurposeLabels,
  stockOutItemTypeLabels,
} from "@/lib/status-utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { downloadBlob } from "@/lib/download-utils";
import { apiRequest } from "@/lib/http";

const formatDateOnly = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Không có";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTimeFull = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Không có";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <StatusBadge status="unknown" label="—" />;
  const statusLower = status.toLowerCase();
  if (statusLower === "draft" || statusLower.includes("draft")) {
    return <StatusBadge status="draft" label="Nháp" />;
  }
  if (statusLower === "pending" || statusLower.includes("pending")) {
    return <StatusBadge status="pending" label="Chờ xử lý" />;
  }
  if (statusLower === "completed" || statusLower.includes("completed")) {
    return <StatusBadge status="completed" label="Hoàn thành" />;
  }
  if (statusLower === "cancelled" || statusLower.includes("cancelled")) {
    return <StatusBadge status="cancelled" label="Đã hủy" />;
  }
  return <StatusBadge status={status} label={status} />;
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

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Inline Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editReceiverName, setEditReceiverName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<any[]>([]);
  const { mutate: updateStockOut, isPending: isUpdating } = useUpdateStockOut();

  // Initialize edit states when data loads
  useEffect(() => {
    if (stockOut) {
      setEditReceiverName(stockOut.receiverName ?? "");
      setEditNotes(stockOut.notes ?? "");
      setEditItems(
        (stockOut.items || []).map((item: any) => ({
          ...item,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? "",
        }))
      );
    }
  }, [stockOut]);

  const handleStartEdit = () => {
    if (stockOut) {
      setEditReceiverName(stockOut.receiverName ?? "");
      setEditNotes(stockOut.notes ?? "");
      setEditItems(
        (stockOut.items || []).map((item: any) => ({
          ...item,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? "",
        }))
      );
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (stockOut) {
      setEditReceiverName(stockOut.receiverName ?? "");
      setEditNotes(stockOut.notes ?? "");
      setEditItems(
        (stockOut.items || []).map((item: any) => ({
          ...item,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? "",
        }))
      );
    }
  };

  const handleEditItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setEditItems(newItems);
  };

  const handleSaveUpdate = () => {
    if (!stockOut?.id) return;

    const hasInvalidQuantity = editItems.some(
      (item) => !item.quantity || item.quantity < 1
    );
    if (hasInvalidQuantity) {
      toast.error("Số lượng của tất cả vật phẩm phải lớn hơn hoặc bằng 1");
      return;
    }

    const updatedItems = editItems.map((item) => ({
      itemName: item.itemName,
      itemCode: item.itemCode,
      unit: item.unit,
      quantity: item.quantity,
      notes: item.notes,
      materialId: item.materialId,
      orderDetailId: item.orderDetailId,
    }));

    updateStockOut(
      {
        id: stockOut.id,
        data: {
          receiverName: editReceiverName.trim() || null,
          notes: editNotes.trim() || null,
          items: updatedItems,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Cập nhật phiếu xuất kho thành công");
        },
      }
    );
  };

  const handleExportExcel = async () => {
    if (!stockOut?.id) return;
    setIsExportingExcel(true);
    try {
      const response = await apiRequest.get(`/stock-outs/${stockOut.id}/excel`, {
        responseType: "blob",
      });
      
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      
      const filename = `phieu-xuat-kho-${stockOut.code || stockOut.id}.xlsx`;
      downloadBlob(blob, filename);
      toast.success("Xuất file Excel thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file Excel. Vui lòng thử lại!");
    } finally {
      setIsExportingExcel(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Đang tải phiếu xuất kho...</p>
        </div>
      </div>
    );
  }

  if (isError || !stockOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-blue-100">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-blue-500" />
              <h1 className="text-xl font-semibold text-slate-900">
                Không tìm thấy phiếu xuất kho
              </h1>
              <p className="text-slate-600">
                Phiếu xuất kho không tồn tại hoặc đã bị xóa
              </p>
              <Button 
                onClick={() => navigate("/stock/stock-outs")}
                className="bg-blue-600 hover:bg-blue-700"
              >
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

  const dateObj = stockOut.stockOutDate ? new Date(stockOut.stockOutDate) : stockOut.createdAt ? new Date(stockOut.createdAt) : new Date();
  const day = format(dateObj, "dd");
  const month = format(dateObj, "MM");
  const year = format(dateObj, "yyyy");

  const purposeLower = (stockOut.purpose || stockOut.type || "").toLowerCase();
  const isExcelPurpose = ["production", "outsource", "outsource_print", "return_vendor"].includes(purposeLower);
  const isAdjustmentPurpose = purposeLower === "adjustment";

  return (
    <>
      <Helmet>
        <title>
          Phiếu xuất kho #{stockOut.code || stockOut.id} | Inkwell System
        </title>
      </Helmet>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 overflow-hidden print:bg-white print:h-auto print:overflow-visible">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0 shadow-sm print:hidden">
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
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-primary" />
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
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveUpdate}
                      disabled={isUpdating}
                      className="cursor-pointer transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="cursor-pointer transition-colors duration-200"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Hủy
                    </Button>
                  </>
                ) : (
                  <>
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
                        onClick={handleStartEdit}
                        className="cursor-pointer transition-colors duration-200 border-blue-500/30 text-blue-600 hover:bg-blue-50/50 hover:border-blue-500/50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                    )}
                    {isExcelPurpose ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportExcel}
                        disabled={isExportingExcel}
                        className="cursor-pointer transition-colors duration-200 border-blue-500/30 text-blue-600 hover:bg-blue-50/50 hover:border-blue-500/50"
                      >
                        {isExportingExcel ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xuất...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Xuất Excel
                          </>
                        )}
                      </Button>
                    ) : isAdjustmentPurpose ? null : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="cursor-pointer transition-colors duration-200 text-slate-700 hover:text-slate-800 hover:bg-slate-50"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        In phiếu
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto print:overflow-visible print:bg-white print:h-auto print:p-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:max-w-none">
            
            {/* Screen View (Modern Dashboard UI) */}
            <div className="space-y-6 print:hidden">
              {/* Consolidated Information Card */}
              <Card className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-sky-500/5 px-4 py-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Thông tin phiếu xuất kho
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Mã phiếu */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Hash className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã phiếu</p>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                          {stockOut.code || `PXK-${stockOut.id}`}
                        </p>
                      </div>
                    </div>

                    {/* Ngày xuất */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày xuất</p>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">
                          {stockOut.stockOutDate ? formatDateTimeFull(stockOut.stockOutDate) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Trạng thái */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</p>
                        <div className="mt-0.5 flex items-center">
                          {getStatusBadge(stockOut.status)}
                        </div>
                      </div>
                    </div>

                    {/* Người nhận hàng */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người nhận hàng</p>
                        {isEditing ? (
                          <Input
                            value={editReceiverName}
                            onChange={(e) => setEditReceiverName(e.target.value)}
                            placeholder="Họ tên người nhận..."
                            className="h-8 text-xs font-semibold focus-visible:ring-blue-500/30 mt-1"
                          />
                        ) : (
                          <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                            {stockOut.receiverName || "—"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Khách hàng / Đối tác / NCC */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách hàng / Đối tác / NCC</p>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate" title={stockOut.customer?.name || stockOut.vendorName || stockOut.vendor?.name || stockOut.supplier?.name || "—"}>
                          {stockOut.customer?.name || stockOut.vendorName || stockOut.vendor?.name || stockOut.supplier?.name || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Kho xuất hàng */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Factory className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kho xuất hàng</p>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                          {stockOut.warehouse || stockOut.warehouseName || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Lý do xuất / Ghi chú (Full width in md/lg) */}
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/50 transition-colors duration-150 md:col-span-2 lg:col-span-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lý do xuất / Ghi chú</p>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5 whitespace-pre-wrap" title={stockOut.notes || stockOutPurposeLabels[stockOut.purpose?.toLowerCase()] || stockOut.purpose || "—"}>
                          {stockOut.notes || (stockOut.purpose ? stockOutPurposeLabels[stockOut.purpose.toLowerCase()] || stockOut.purpose : "—")}
                        </p>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Items Card */}
              <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    DANH SÁCH VẬT TƯ XUẤT KHO
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/75">
                      <TableRow className="text-xs border-b border-slate-200/60">
                        <TableHead className="w-12 text-center font-bold py-2.5 pl-4">STT</TableHead>
                        <TableHead className="font-bold py-2.5">Tên vật tư</TableHead>
                        <TableHead className="font-bold py-2.5">Mã vật tư</TableHead>
                        <TableHead className="w-24 text-center font-bold py-2.5">ĐVT</TableHead>
                        <TableHead className="w-32 text-right font-bold py-2.5">Số lượng xuất</TableHead>
                        <TableHead className="min-w-[200px] font-bold py-2.5 pr-4">Ghi chú dòng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-400 italic text-xs">
                            Không có vật tư nào trong phiếu
                          </TableCell>
                        </TableRow>
                      ) : (
                        (isEditing ? editItems : items).map((item: any, index: number) => (
                          <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                            <TableCell className="text-center font-mono text-slate-500 py-3.5 pl-4">
                              {index + 1}
                            </TableCell>
                            <TableCell className="py-3.5 font-semibold text-slate-800">
                              {item.itemName || "—"}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-slate-600">
                              {item.itemCode || "—"}
                            </TableCell>
                            <TableCell className="text-center text-slate-600 py-3.5">
                              {item.unit || "—"}
                            </TableCell>
                            <TableCell className="text-right py-2 font-bold tabular-nums text-slate-800">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity ?? ""}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    handleEditItemChange(index, "quantity", isNaN(val) ? 0 : val);
                                  }}
                                  className="h-8 w-24 text-xs font-semibold text-right ml-auto focus-visible:ring-blue-500/30"
                                />
                              ) : (
                                (item.quantity || 0).toLocaleString("vi-VN")
                              )}
                            </TableCell>
                            <TableCell className="py-2 pr-4 text-slate-600">
                              {isEditing ? (
                                <Input
                                  value={item.notes || ""}
                                  onChange={(e) => handleEditItemChange(index, "notes", e.target.value)}
                                  placeholder="Ghi chú dòng..."
                                  className="h-8 text-xs focus-visible:ring-blue-500/30"
                                />
                              ) : (
                                item.notes || "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Print View (Traditional Paper Layout) */}
            <div className="hidden print:block font-sans text-slate-900 bg-white p-0">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4 items-start border-none">
                {/* Left Header */}
                <div className="text-xs space-y-1">
                  <div className="flex gap-1">
                    <span className="font-bold shrink-0">Đơn vị:</span>
                    <span>CÔNG TY TNHH SX TMDV QUỐC TẾ QUANG ĐẠT</span>
                  </div>
                  <div className="flex gap-1 leading-relaxed">
                    <span className="font-bold shrink-0">Địa chỉ:</span>
                    <span>97/3 Đường Tân Thời Nhất 8, P. Đông Hưng Thuận, TP. HCM</span>
                  </div>
                </div>
                
                {/* Right Header */}
                <div className="text-right space-y-1 text-xs">
                  <div className="font-bold">Mẫu số 02 - VT</div>
                  <div className="italic text-[10px] text-slate-500 leading-normal">
                    (Ban hành theo Thông tư số 200/2014/TT-BTC<br/>
                    Ngày 22/12/2014 của Bộ Tài chính)
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center my-8 space-y-1">
                <h2 className="text-xl font-bold tracking-wider uppercase">
                  PHIẾU XUẤT KHO
                </h2>
                <div className="text-xs italic text-slate-600">
                  Ngày {day} tháng {month} năm {year}
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Số: {stockOut.code || `PXK-${stockOut.id}`}
                </div>
              </div>

              {/* Receiver & Reason Info Block */}
              <div className="text-xs space-y-3.5 my-6 leading-relaxed">
                <div className="flex items-end gap-1.5 w-full">
                  <span className="shrink-0">- Họ và tên người nhận hàng:</span>
                  <span className="font-semibold text-slate-800 border-b border-dashed border-slate-300 flex-1 pb-0.5 min-h-[1.25rem] text-left">
                    {stockOut.receiverName || "—"}
                  </span>
                </div>
                <div className="flex items-end gap-1.5 w-full">
                  <span className="shrink-0">- Lý do xuất kho:</span>
                  <span className="text-slate-800 border-b border-dashed border-slate-300 flex-1 pb-0.5 min-h-[1.25rem] text-left">
                    {stockOut.notes || (stockOut.purpose ? stockOutPurposeLabels[stockOut.purpose.toLowerCase()] || stockOut.purpose : "—")}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="my-6">
                <table className="w-full border-collapse border border-slate-800 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-800">
                      <th className="border-r border-slate-800 font-bold text-center py-2 px-1 w-12 text-slate-900">
                        STT
                      </th>
                      <th className="border-r border-slate-800 font-bold text-left py-2 px-2 text-slate-900">
                        Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sp, hàng hoá
                      </th>
                      <th className="border-r border-slate-800 font-bold text-center py-2 px-1 w-20 text-slate-900">
                        ĐVT
                      </th>
                      <th className="border-r border-slate-800 font-bold text-right py-2 px-2 w-28 text-slate-900">
                        SỐ LƯỢNG
                      </th>
                      <th className="font-bold text-left py-2 px-2 w-40 text-slate-900">
                        GHI CHÚ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr className="border-b border-slate-800">
                        <td
                          colSpan={5}
                          className="text-center py-8 text-slate-400 italic"
                        >
                          Không có vật tư nào trong phiếu xuất
                        </td>
                      </tr>
                    ) : (
                      items.map((item: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-slate-800"
                        >
                          <td className="border-r border-slate-800 text-center py-2 px-1 font-mono">
                            {index + 1}
                          </td>
                          <td className="border-r border-slate-800 font-medium text-slate-900 py-2 px-2 leading-relaxed">
                            {item.itemName || "—"}
                          </td>
                          <td className="border-r border-slate-800 text-center py-2 px-1">
                            {item.unit || "—"}
                          </td>
                          <td className="border-r border-slate-800 text-right py-2 px-2 font-semibold tabular-nums text-slate-900">
                            {(item.quantity || 0).toLocaleString("en-US")}
                          </td>
                          <td className="py-2 px-2 text-slate-600 leading-normal">
                            {item.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures Block */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs mt-12 mb-20">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Người lập</div>
                  <div className="italic text-slate-500">(Ký, họ tên)</div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Người nhận hàng</div>
                  <div className="italic text-slate-500">(Ký, họ tên)</div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Thủ kho</div>
                  <div className="italic text-slate-500">(Ký, họ tên)</div>
                </div>
              </div>

              {/* Creator name at the bottom left */}
              {stockOut.createdBy?.fullName && (
                <div className="text-xs font-bold text-slate-900 pl-4 mt-8">
                  {stockOut.createdBy.fullName}
                </div>
              )}
            </div>

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
                  : "bg-blue-100"
              }`}>
                {confirmDialog.confirmVariant === "destructive" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
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
                  : "bg-blue-600 hover:bg-blue-700"
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

