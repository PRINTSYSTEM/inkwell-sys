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
import { useCustomer } from "@/hooks/use-customer";
import { useVendor } from "@/hooks/use-vendor";
import { useProductionOrder, useUpdateProductionStep } from "@/hooks/use-production";
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

  const { data: customerData } = useCustomer(stockOut?.customerId || null, !!stockOut?.customerId);
  const { data: vendorData } = useVendor(stockOut?.vendorId || null, !!stockOut?.vendorId);

  const { data: production } = useProductionOrder(
    stockOut?.productionOrderId || null,
    !!stockOut?.productionOrderId
  );
  const { mutate: updateStep } = useUpdateProductionStep();

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

  const [isEditing, setIsEditing] = useState(false);
  const [editReceiverName, setEditReceiverName] = useState("");
  const [editReceiverAddress, setEditReceiverAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<any[]>([]);
  const { mutate: updateStockOut, isPending: isUpdating } = useUpdateStockOut();

  useEffect(() => {
    if (stockOut) {
      setEditReceiverName(stockOut.receiverName ?? "");
      setEditReceiverAddress(
        stockOut.receiverAddress ??
        (stockOut.customer?.address ||
          customerData?.address ||
          stockOut.vendor?.address ||
          vendorData?.address ||
          stockOut.supplier?.address ||
          stockOut.vendorAddress ||
          "")
      );
      setEditNotes(stockOut.notes ?? "");
      setEditItems(
        (stockOut.items || []).map((item: any) => ({
          ...item,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? "",
        }))
      );
    }
  }, [stockOut, customerData, vendorData]);

  const handleStartEdit = () => {
    if (stockOut) {
      setEditReceiverName(stockOut.receiverName ?? "");
      setEditReceiverAddress(
        stockOut.receiverAddress ??
        (stockOut.customer?.address ||
          customerData?.address ||
          stockOut.vendor?.address ||
          vendorData?.address ||
          stockOut.supplier?.address ||
          stockOut.vendorAddress ||
          "")
      );
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
      setEditReceiverAddress(
        stockOut.receiverAddress ??
        (stockOut.customer?.address ||
          customerData?.address ||
          stockOut.vendor?.address ||
          vendorData?.address ||
          stockOut.supplier?.address ||
          stockOut.vendorAddress ||
          "")
      );
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
          receiverAddress: editReceiverAddress.trim() || null,
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

  const autoCompleteProductionStep = () => {
    if (production?.steps) {
      const materialExportStep = production.steps.find(
        (step: any) => step.stepType === "material_export" && step.status !== "done"
      );
      if (materialExportStep?.id) {
        const outputQty =
          materialExportStep.inputQty ||
          stockOut?.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) ||
          0;
        updateStep({
          stepId: materialExportStep.id,
          data: {
            status: "done",
            outputQty: outputQty,
          },
        });
      }
    }
  };

  const handleComplete = () => {
    if (!stockOut?.id) return;
    completeStockOut(stockOut.id, {
      onSuccess: () => {
        toast.success("Đã hoàn thành phiếu xuất kho");
        autoCompleteProductionStep();
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
            autoCompleteProductionStep();
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
            navigate("/stock/summary");
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
                onClick={() => navigate("/stock/summary")}
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

  const partnerName =
    stockOut.customer?.name ||
    customerData?.name ||
    stockOut.vendorName ||
    stockOut.vendor?.name ||
    vendorData?.name ||
    stockOut.supplier?.name ||
    "";
  const partnerAddress =
    stockOut.customer?.address ||
    customerData?.address ||
    stockOut.vendor?.address ||
    vendorData?.address ||
    stockOut.supplier?.address ||
    stockOut.vendorAddress ||
    "";
  const partnerPhone =
    stockOut.customer?.phone ||
    customerData?.phone ||
    stockOut.vendor?.phone ||
    vendorData?.phone ||
    stockOut.supplier?.phone ||
    stockOut.vendorPhone ||
    "";
  
  const rawWarehouseName = stockOut.warehouse || stockOut.warehouseName || "";
  const isOutsourceOrReturn = ["outsource", "outsource_print", "return_vendor"].includes(purposeLower);
  const warehouseName =
    !rawWarehouseName || isOutsourceOrReturn
      ? "CÔNG TY QUANG ĐẠT"
      : rawWarehouseName;

  const rawWarehouseAddress = stockOut.warehouseAddress || "";
  const warehouseAddress =
    !rawWarehouseAddress || isOutsourceOrReturn
      ? "97/3 Đường Tân Thời Nhất 8, P. Đông Hưng Thuận, TP. HCM"
      : rawWarehouseAddress;

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
                  onClick={() => navigate("/stock/summary")}
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
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      Phiếu xuất kho{" "}
                      {stockOut.code ? `#${stockOut.code}` : `#${stockOut.id}`}
                      <div className="scale-90 font-normal">
                        {getStatusBadge(stockOut.status)}
                      </div>
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
                    {(status === "pending" || status === "draft") && (
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
            
            {/* Paper Voucher Container */}
            <div className="bg-white text-slate-950 p-6 sm:p-8 shadow-xl shadow-slate-200/50 rounded-xl border border-slate-200/60 font-sans print:shadow-none print:border-none print:p-0 print:text-black mx-auto max-w-4xl transition-all duration-300 space-y-4">
                {/* Header Section */}
                <div className="grid grid-cols-2 text-xs leading-relaxed">
                  <div className="space-y-0.5">
                    <div>
                      <span className="font-bold">Đơn vị:</span> CÔNG TY TNHH SX TMDV QUỐC TẾ QUANG ĐẠT
                    </div>
                    <div>
                      <span className="font-bold">Địa chỉ:</span> 97/3 Đường Tân Thời Nhất 8, P. Đông Hưng Thuận, TP. HCM
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-sm">Mẫu số 02 - VT</div>
                    <div className="italic text-[10px] text-slate-600 print:text-black">
                      (Ban hành theo Thông tư số 200/2014/TT-BTC
                    </div>
                    <div className="italic text-[10px] text-slate-600 print:text-black">
                      Ngày 22/12/2014 của Bộ Tài chính)
                    </div>
                  </div>
                </div>

                {/* Title Section */}
                <div className="text-center my-6 space-y-1">
                  <h2 className="text-2xl font-bold tracking-wider uppercase text-slate-900 print:text-black">
                    PHIẾU XUẤT KHO
                  </h2>
                  <div className="text-xs text-slate-800 print:text-black font-medium">
                    Ngày...<span className="font-bold">{day}</span>...tháng...<span className="font-bold">{month}</span>...năm...<span className="font-bold">{year}</span>...
                  </div>
                  <div className="text-xs font-semibold text-slate-800 print:text-black">
                    Số: ........<span className="font-mono font-bold text-red-600 print:text-black">{stockOut.code || stockOut.id}</span>........
                  </div>
                </div>

                {/* Receiver & Reason Info Block */}
                <div className="text-xs space-y-3.5 my-6 leading-relaxed">
                  {/* Row 1 */}
                  <div className="flex items-end gap-1.5 w-full">
                    <span className="shrink-0 text-slate-700 print:text-black font-medium">- Họ và tên người nhận hàng:</span>
                    <span className="font-semibold text-slate-900 print:text-black border-b border-dotted border-slate-400 flex-1 pb-0.5 min-h-[1.5rem] text-left flex items-end">
                      {isEditing ? (
                        <Input
                          value={editReceiverName}
                          onChange={(e) => setEditReceiverName(e.target.value)}
                          className="h-6 py-0 px-2 border border-dashed border-blue-400 focus-visible:ring-0 focus-visible:border-blue-600 focus-visible:bg-blue-50 w-full text-xs font-semibold bg-blue-50/30 text-blue-900 rounded"
                          placeholder="Họ tên người nhận..."
                        />
                      ) : (
                        stockOut.receiverName || partnerName || "—"
                      )}
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-6 w-full">
                    <div className="flex items-end gap-1.5 flex-1 w-full min-w-0">
                      <span className="shrink-0 text-slate-700 print:text-black font-medium">- Địa chỉ (bộ phận):</span>
                      <span className="text-slate-900 print:text-black border-b border-dotted border-slate-400 flex-1 pb-0.5 min-h-[1.5rem] text-left flex items-end font-medium">
                        {isEditing ? (
                          <Input
                            value={editReceiverAddress}
                            onChange={(e) => setEditReceiverAddress(e.target.value)}
                            className="h-6 py-0 px-2 border border-dashed border-blue-400 focus-visible:ring-0 focus-visible:border-blue-600 focus-visible:bg-blue-50 w-full text-xs bg-blue-50/30 text-blue-900 rounded"
                            placeholder="Địa chỉ..."
                          />
                        ) : (
                          stockOut.receiverAddress || partnerAddress || "—"
                        )}
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 shrink-0 w-full sm:w-auto">
                      <span className="shrink-0 text-slate-700 print:text-black font-medium">SĐT:</span>
                      <span className="text-slate-900 print:text-black border-b border-dotted border-slate-400 pb-0.5 min-h-[1.5rem] text-left w-full sm:w-36 font-semibold">
                        {partnerPhone || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-end gap-1.5 w-full">
                    <span className="shrink-0 text-slate-700 print:text-black font-medium">- Lý do xuất kho:</span>
                    <span className="text-slate-900 print:text-black border-b border-dotted border-slate-400 flex-1 pb-0.5 min-h-[1.5rem] text-left flex items-end">
                      {isEditing ? (
                        <Input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="h-6 py-0 px-2 border border-dashed border-blue-400 focus-visible:ring-0 focus-visible:border-blue-600 focus-visible:bg-blue-50 w-full text-xs bg-blue-50/30 text-blue-900 rounded"
                          placeholder="Lý do xuất kho..."
                        />
                      ) : (
                        stockOut.notes || (stockOut.purpose ? stockOutPurposeLabels[stockOut.purpose.toLowerCase()] || stockOut.purpose : "—")
                      )}
                    </span>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-6 w-full">
                    <div className="flex items-end gap-1.5 flex-1 w-full min-w-0">
                      <span className="shrink-0 text-slate-700 print:text-black font-medium">- Xuất tại kho:</span>
                      <span className="text-slate-900 print:text-black border-b border-dotted border-slate-400 flex-1 pb-0.5 min-h-[1.25rem] text-left font-semibold">
                        {warehouseName}
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 flex-[2] w-full min-w-0">
                      <span className="shrink-0 text-slate-700 print:text-black font-medium">Địa điểm:</span>
                      <span className="text-slate-900 print:text-black border-b border-dotted border-slate-400 flex-1 pb-0.5 min-h-[1.25rem] text-left font-semibold">
                        {warehouseAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="my-6 overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/50 print:bg-transparent border-b border-black">
                        <th className="border border-black font-bold text-center py-2.5 px-1 w-12 text-slate-900 print:text-black">
                          STT
                        </th>
                        <th className="border border-black font-bold text-left py-2.5 px-2 text-slate-900 print:text-black">
                          Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sp, hàng hoá
                        </th>
                        <th className="border border-black font-bold text-center py-2.5 px-1 w-20 text-slate-900 print:text-black">
                          ĐVT
                        </th>
                        <th className="border border-black font-bold text-right py-2.5 px-2 w-28 text-slate-900 print:text-black">
                          SỐ LƯỢNG
                        </th>
                        <th className="border border-black font-bold text-left py-2.5 px-2 w-40 text-slate-900 print:text-black">
                          GHI CHÚ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr className="border border-black">
                          <td
                            colSpan={5}
                            className="text-center py-8 text-slate-400 italic border border-black"
                          >
                            Không có vật tư nào trong phiếu xuất
                          </td>
                        </tr>
                      ) : (
                        (isEditing ? editItems : items).map((item: any, index: number) => {
                          const isOutsourcePrint = purposeLower === "outsource" || purposeLower === "outsource_print";
                          const isCuonItem = (item.unit?.toLowerCase().includes("cuộn") || item.itemName?.toLowerCase().includes("cuộn")) && !item.itemName?.toLowerCase().includes("m tới");
                          
                          return (
                            <tr
                              key={index}
                              className="border border-black hover:bg-slate-50/30 print:hover:bg-transparent"
                            >
                              <td className="border border-black text-center py-2 px-1 font-mono text-slate-600 print:text-black">
                                {index + 1}
                              </td>
                              <td className="border border-black font-semibold text-slate-900 print:text-black py-2 px-2 leading-relaxed">
                                {item.itemName || "—"}
                                {isOutsourcePrint && isCuonItem ? " (m tới)" : ""}
                              </td>
                              <td className="border border-black text-center py-2 px-1 text-slate-700 print:text-black">
                                {item.unit || "—"}
                              </td>
                              <td className="border border-black text-right py-2 px-2 font-bold tabular-nums text-slate-900 print:text-black">
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
                                    className="h-7 w-24 text-xs font-semibold text-right ml-auto bg-blue-50/30 text-blue-900 border-blue-300 focus-visible:ring-blue-500/30 focus:border-blue-500 focus:bg-blue-50"
                                  />
                                ) : (
                                  (item.quantity || 0).toLocaleString("vi-VN")
                                )}
                              </td>
                              <td className="border border-black py-2 px-2 text-slate-600 print:text-black leading-normal">
                                {isEditing ? (
                                  <Input
                                    value={item.notes || ""}
                                    onChange={(e) => handleEditItemChange(index, "notes", e.target.value)}
                                    placeholder="Ghi chú dòng..."
                                    className="h-7 text-xs bg-blue-50/30 text-blue-900 border-blue-300 focus-visible:ring-blue-500/30 focus:border-blue-500 focus:bg-blue-50 w-full"
                                  />
                                ) : (
                                  item.notes || "—"
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Block */}
                <div className="grid grid-cols-3 text-center text-xs mt-12 gap-y-16 leading-relaxed">
                  <div>
                    <div className="font-bold text-slate-900 print:text-black">Người lập</div>
                    <div className="italic text-slate-500 print:text-black mt-0.5">(Ký, họ tên)</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 print:text-black">Người nhận hàng</div>
                    <div className="italic text-slate-500 print:text-black mt-0.5">(Ký, họ tên)</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 print:text-black">Thủ kho</div>
                    <div className="italic text-slate-500 print:text-black mt-0.5">(Ký, họ tên)</div>
                  </div>
                </div>

                <div className="w-1/3 text-center text-xs mt-8">
                  <div className="font-bold text-slate-900 print:text-black">Quản trị viên</div>
                  <div className="italic text-slate-500 print:text-black mt-0.5">(Ký, họ tên)</div>
                </div>
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

