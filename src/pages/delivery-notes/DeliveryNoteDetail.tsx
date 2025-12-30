import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Truck,
  Calendar,
  User,
  MapPin,
  Phone,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useDeliveryNote,
  useUpdateDeliveryNoteStatus,
  useExportDeliveryNotePDF,
  useRecreateDeliveryNote,
} from "@/hooks/use-delivery-note";
import { useOrder } from "@/hooks/use-order";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/status-utils";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

// Component for expandable order row
function OrderDetailRow({
  order,
  isExpanded,
  onToggle,
}: {
  order: {
    orderId?: number;
    orderCode?: string | null;
    customerName?: string | null;
    totalAmount?: number;
    deliveryAddress?: string | null;
  };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: orderDetail, isLoading: isLoadingOrder } = useOrder(
    order.orderId ?? null,
    isExpanded && !!order.orderId // Only fetch when expanded and orderId exists
  );

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="font-medium font-mono">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {order.orderCode || `#${order.orderId}`}
          </div>
        </TableCell>
        <TableCell>{order.customerName || "—"}</TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {order.totalAmount ? formatCurrency(order.totalAmount) : "—"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {order.deliveryAddress || "—"}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={4} className="p-0">
            <div className="bg-muted/30 p-4">
              {isLoadingOrder ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : orderDetail?.orderDetails &&
                orderDetail.orderDetails.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Chi tiết sản phẩm ({orderDetail.orderDetails.length})
                  </h4>
                  <div className="space-y-2">
                    {orderDetail.orderDetails.map((detail) => (
                      <div
                        key={detail.id}
                        className="bg-background border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-sm">
                              {detail.design?.designName || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {detail.design?.code || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Số lượng
                            </Label>
                            <p className="font-medium">
                              {detail.quantity?.toLocaleString("vi-VN") || "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Phụ hao
                            </Label>
                            <p className="font-medium">
                              {/* Phụ hao = quantity - proofedQuantity */}
                              {detail.proofedQuantity != null &&
                              detail.quantity != null
                                ? (
                                    detail.quantity - detail.proofedQuantity
                                  ).toLocaleString("vi-VN")
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Số lượng thực
                            </Label>
                            <p className="font-medium">
                              {detail.proofedQuantity?.toLocaleString(
                                "vi-VN"
                              ) ||
                                detail.quantity?.toLocaleString("vi-VN") ||
                                "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Đơn giá
                            </Label>
                            <p className="font-medium tabular-nums">
                              {detail.unitPrice
                                ? formatCurrency(detail.unitPrice)
                                : "—"}
                            </p>
                          </div>
                        </div>
                        {(detail.requirements || detail.additionalNotes) && (
                          <div className="pt-2 border-t">
                            <Label className="text-xs text-muted-foreground">
                              Ghi chú
                            </Label>
                            <div className="text-sm mt-1 space-y-1">
                              {detail.requirements && (
                                <p>
                                  <span className="font-medium">Yêu cầu:</span>{" "}
                                  {detail.requirements}
                                </p>
                              )}
                              {detail.additionalNotes && (
                                <p>
                                  <span className="font-medium">
                                    Ghi chú thêm:
                                  </span>{" "}
                                  {detail.additionalNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có chi tiết sản phẩm
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function DeliveryNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deliveryNoteId = Number.parseInt(id || "0", 10);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [failureReason, setFailureReason] = useState("");
  const [failureType, setFailureType] = useState<string>("");
  const [affectsDebt, setAffectsDebt] = useState(false);
  const [notes, setNotes] = useState("");
  const [isRecreateDialogOpen, setIsRecreateDialogOpen] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(
    new Set()
  );

  const {
    data: deliveryNote,
    isLoading,
    isError,
    error,
  } = useDeliveryNote(deliveryNoteId || null, !!deliveryNoteId);

  const updateStatusMutation = useUpdateDeliveryNoteStatus();
  const exportPDFMutation = useExportDeliveryNotePDF();
  const recreateMutation = useRecreateDeliveryNote();

  const handleOpenUpdateDialog = () => {
    setStatus(deliveryNote?.status || "");
    setFailureReason(deliveryNote?.failureReason || "");
    setFailureType(deliveryNote?.failureType || "");
    setAffectsDebt(deliveryNote?.affectsDebt || false);
    setNotes(deliveryNote?.notes || "");
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!deliveryNote?.id) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: deliveryNote.id,
        data: {
          status,
          failureReason: failureReason || undefined,
          failureType: failureType || undefined,
          affectsDebt: affectsDebt,
          notes: notes || undefined,
        },
      });
      setIsUpdateDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleExportPDF = async () => {
    if (!deliveryNote?.id) return;
    try {
      await exportPDFMutation.mutateAsync(deliveryNote.id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRecreate = async () => {
    if (!deliveryNote?.id) return;

    try {
      await recreateMutation.mutateAsync({
        originalDeliveryNoteId: deliveryNote.id,
        orderIds:
          deliveryNote.orders
            ?.map((o) => o.orderId)
            .filter((id): id is number => !!id) || undefined,
      });
      setIsRecreateDialogOpen(false);
      navigate("/delivery-notes");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="secondary">—</Badge>;

    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("success") ||
      statusLower.includes("completed") ||
      statusLower === "delivered"
    ) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Thành công
        </Badge>
      );
    }
    if (statusLower.includes("fail") || statusLower.includes("failed")) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Thất bại
        </Badge>
      );
    }
    if (statusLower === "pending" || statusLower.includes("pending")) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Chờ giao
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">{deliveryNote?.statusName || status}</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang tải phiếu giao hàng...</p>
        </div>
      </div>
    );
  }

  if (isError || !deliveryNote) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold">
            Không tìm thấy phiếu giao hàng
          </h1>
          <p className="text-muted-foreground">
            Phiếu giao hàng không tồn tại hoặc đã bị xóa
          </p>
          <Link to="/delivery-notes">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFailed =
    deliveryNote.status?.toLowerCase().includes("fail") ||
    deliveryNote.status?.toLowerCase() === "failed";
  const canRecreate = isFailed;

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/delivery-notes" className="w-fit">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {deliveryNote.code || `Phiếu giao hàng #${deliveryNote.id}`}
              </h1>
              {getStatusBadge(deliveryNote.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Tạo: {formatDateTime(deliveryNote.createdAt)}
              </span>
              {deliveryNote.createdBy && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {deliveryNote.createdBy.fullName || "—"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Xuất PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenUpdateDialog}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Cập nhật trạng thái
            </Button>
            {canRecreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRecreateDialogOpen(true)}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tạo lại phiếu
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {isFailed && (
        <Alert variant={deliveryNote.affectsDebt ? "default" : "destructive"}>
          <XCircle className="h-4 w-4" />
          <AlertTitle>Giao hàng thất bại</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Lý do:</strong> {deliveryNote.failureReason || "—"}
              </div>
              <div>
                <strong>Loại:</strong>{" "}
                {deliveryNote.failureTypeName ||
                  deliveryNote.failureType ||
                  "—"}
              </div>
              <div>
                <strong>Ảnh hưởng công nợ:</strong>{" "}
                {deliveryNote.affectsDebt ? (
                  <Badge variant="default" className="ml-2">
                    Có (Do khách)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    Không (Đơn hủy)
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Danh sách đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deliveryNote.orders && deliveryNote.orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryNote.orders.map((order) => {
                      const orderId = order.orderId;
                      if (!orderId) return null;
                      const isExpanded = expandedOrderIds.has(orderId);
                      return (
                        <OrderDetailRow
                          key={orderId}
                          order={order}
                          isExpanded={isExpanded}
                          onToggle={() => toggleOrderExpand(orderId)}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có đơn hàng nào
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {deliveryNote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {deliveryNote.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Thông tin giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Người nhận</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {deliveryNote.recipientName || "—"}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Số điện thoại</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{deliveryNote.recipientPhone || "—"}</span>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">
                  Địa chỉ giao hàng
                </Label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {deliveryNote.deliveryAddress || "—"}
                  </span>
                </div>
              </div>

              {deliveryNote.deliveredAt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Ngày giao</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDateTime(deliveryNote.deliveredAt)}</span>
                    </div>
                  </div>
                </>
              )}

              {deliveryNote.deliveredBy && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Người giao</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {(deliveryNote.deliveredBy as { fullName?: string })
                          ?.fullName || "—"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái phiếu giao hàng</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái giao hàng và thông tin liên quan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ giao</SelectItem>
                  <SelectItem value="delivered">Đã giao thành công</SelectItem>
                  <SelectItem value="failed">Giao thất bại</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "failed" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="failureType">Loại thất bại</Label>
                  <Select value={failureType} onValueChange={setFailureType}>
                    <SelectTrigger id="failureType">
                      <SelectValue placeholder="Chọn loại thất bại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Do khách hàng</SelectItem>
                      <SelectItem value="company">Do công ty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="failureReason">Lý do thất bại *</Label>
                  <Textarea
                    id="failureReason"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Nhập lý do thất bại..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="affectsDebt"
                    checked={affectsDebt}
                    onCheckedChange={(checked) =>
                      setAffectsDebt(checked === true)
                    }
                  />
                  <Label
                    htmlFor="affectsDebt"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ảnh hưởng đến công nợ (Đánh dấu nếu do khách hàng)
                  </Label>
                </div>

                {failureType === "customer" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Thất bại do khách hàng: Vẫn cộng tiền vào công nợ
                    </AlertDescription>
                  </Alert>
                )}

                {failureType === "company" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Thất bại do công ty: Không cộng công nợ, coi như đơn hủy
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={
                updateStatusMutation.isPending ||
                !status ||
                (status === "failed" && !failureReason)
              }
            >
              {updateStatusMutation.isPending ? "Đang cập nhật..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recreate Dialog */}
      <Dialog
        open={isRecreateDialogOpen}
        onOpenChange={setIsRecreateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lại phiếu giao hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tạo lại phiếu giao hàng cho các đơn hàng
              này?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRecreateDialogOpen(false)}
              disabled={recreateMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleRecreate}
              disabled={recreateMutation.isPending}
              variant="default"
            >
              {recreateMutation.isPending ? "Đang tạo..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
