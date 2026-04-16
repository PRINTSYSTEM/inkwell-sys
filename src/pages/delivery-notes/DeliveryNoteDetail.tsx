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
  Package,
  Hash,
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
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/status-utils";
import type { DeliveryNoteLineResponse } from "@/Schema/delivery-note.schema";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

// ============================================================
// LINE STATUS BADGE
// ============================================================
function LineStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="secondary">—</Badge>;
  const s = status.toLowerCase();
  if (s === "delivered" || s === "success" || s === "completed")
    return (
      <Badge className="bg-green-500 text-white text-xs">
        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
        Đã giao
      </Badge>
    );
  if (s === "failed" || s.includes("fail"))
    return (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="h-2.5 w-2.5 mr-1" />
        Thất bại
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs">
      {status}
    </Badge>
  );
}

// ============================================================
// DELIVERY LINE ROW
// ============================================================
function DeliveryLineRow({ line }: { line: DeliveryNoteLineResponse }) {
  const hasAddress = !!(line as any).customerAddress;
  const addr = (line as any).customerAddress as {
    label?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    address?: string | null;
  } | null;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell>
        <div className="space-y-0.5">
          <div className="font-mono font-semibold text-sm">
            {line.designCode || "—"}
          </div>
          {(line as any).orderCode && (
            <div className="text-xs text-muted-foreground font-mono">
              {(line as any).orderCode}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium line-clamp-2">
          {line.designName || "—"}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className="font-semibold text-sm">
          {line.deliveryQty?.toLocaleString("vi-VN") ?? "—"}
        </span>
        {line.orderedQty && (
          <div className="text-xs text-muted-foreground">
            / {line.orderedQty.toLocaleString("vi-VN")}
          </div>
        )}
      </TableCell>
      <TableCell>
        {hasAddress && addr ? (
          <div className="space-y-0.5 text-xs">
            {addr.label && (
              <div className="font-medium text-foreground">{addr.label}</div>
            )}
            {addr.recipientName && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3 flex-shrink-0" />
                {addr.recipientName}
              </div>
            )}
            {addr.recipientPhone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                {addr.recipientPhone}
              </div>
            )}
            {addr.address && (
              <div className="flex items-start gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{addr.address}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="font-medium text-sm">
          {line.lineAmount != null ? formatCurrency(line.lineAmount) : "—"}
        </div>
      </TableCell>
      <TableCell>
        <LineStatusBadge status={line.status} />
      </TableCell>
    </TableRow>
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

  const {
    data: deliveryNote,
    isLoading,
    isError,
    error,
  } = useDeliveryNote(deliveryNoteId || null, !!deliveryNoteId);

  const updateStatusMutation = useUpdateDeliveryNoteStatus();
  const exportPDFMutation = useExportDeliveryNotePDF();
  const recreateMutation = useRecreateDeliveryNote();

  const handleOpenUpdateDialog = (newStatus?: string) => {
    setStatus(newStatus || deliveryNote?.status || "");
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
        lines: null, // null = BE auto-recreates from all failed lines
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

  const statusRanks: Record<string, number> = {
    draft: 0,
    pending: 1,
    delivering: 2,
    delivered: 3,
    failed: 3,
  };

  const currentStatus = deliveryNote.status?.toLowerCase() || "draft";
  const currentRank = statusRanks[currentStatus] ?? 0;

  // Stats from lines
  const lines = (deliveryNote as any).lines as DeliveryNoteLineResponse[] | null;
  const hasLines = lines && lines.length > 0;
  const totalDeliveryQty = (deliveryNote as any).totalDeliveryQty as number | undefined;
  const totalPendingLines = (deliveryNote as any).totalPendingLines as number | undefined;
  const totalDeliveredLines = (deliveryNote as any).totalDeliveredLines as number | undefined;
  const totalFailedLines = (deliveryNote as any).totalFailedLines as number | undefined;

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
              {/* Status Stepper */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit items-center">
                {[
                  { value: "draft", label: "Lưu nháp" },
                  { value: "pending", label: "Chờ giao" },
                  { value: "delivering", label: "Đang giao" },
                  { value: "delivered", label: "Thành công" },
                  { value: "failed", label: "Thất bại" },
                ].map((opt) => {
                  const matchVal =
                    currentStatus === "completed" ||
                    currentStatus === "success"
                      ? "delivered"
                      : currentStatus;
                  const isActive = matchVal === opt.value;
                  const disabled =
                    Math.abs(statusRanks[opt.value] - currentRank) > 1 ||
                    updateStatusMutation.isPending;

                  return (
                    <button
                      key={opt.value}
                      disabled={disabled}
                      onClick={() => {
                        if (opt.value === "failed") {
                          handleOpenUpdateDialog("failed");
                        } else {
                          updateStatusMutation.mutate({
                            id: deliveryNote.id!,
                            data: { status: opt.value },
                          });
                        }
                      }}
                      className={`
                        px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap
                        ${!isActive && !disabled ? "hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400" : ""}
                        ${disabled && !isActive ? "opacity-40 cursor-not-allowed hover:bg-transparent text-slate-500" : ""}
                        ${isActive && opt.value === "delivered" ? "bg-green-500 text-white shadow-md hover:bg-green-600" : ""}
                        ${isActive && opt.value === "failed" ? "bg-red-500 text-white shadow-md hover:bg-red-600" : ""}
                        ${isActive && (opt.value === "pending" || opt.value === "delivering") ? "bg-blue-500 text-white shadow-md hover:bg-blue-600" : ""}
                        ${isActive && opt.value === "draft" ? "bg-slate-600 dark:bg-slate-700 text-white shadow-md" : ""}
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
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
              disabled={exportPDFMutation.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportPDFMutation.isPending ? "Đang xuất..." : "Xuất PDF"}
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
                {(deliveryNote.failureTypeName as string | undefined) ||
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

      {/* Summary Stats */}
      {hasLines && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Package className="h-3 w-3" />
              Tổng SL giao
            </div>
            <div className="text-xl font-bold text-primary">
              {totalDeliveryQty?.toLocaleString("vi-VN") ?? lines.length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Chờ giao</div>
            <div className="text-xl font-bold text-blue-500">
              {totalPendingLines ?? "—"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Đã giao</div>
            <div className="text-xl font-bold text-green-500">
              {totalDeliveredLines ?? "—"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Thất bại</div>
            <div className="text-xl font-bold text-red-500">
              {totalFailedLines ?? "—"}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lines Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Chi tiết dòng hàng
                {hasLines && (
                  <Badge variant="secondary" className="ml-auto">
                    {lines.length} dòng
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {hasLines ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-4">Mã hàng / Đơn</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">SL giao</TableHead>
                        <TableHead>Địa chỉ giao</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <DeliveryLineRow
                          key={line.id ?? idx}
                          line={line}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Không có dòng hàng nào
                </div>
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
              {/* Recipient info (legacy / fallback) */}
              {deliveryNote.recipientName && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Người nhận</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {deliveryNote.recipientName}
                      </span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {deliveryNote.recipientPhone && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Số điện thoại</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{deliveryNote.recipientPhone}</span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {deliveryNote.deliveryAddress && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Địa chỉ giao hàng</Label>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">
                        {deliveryNote.deliveryAddress}
                      </span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* No recipient info when using per-line addresses */}
              {!deliveryNote.recipientName && !deliveryNote.deliveryAddress && (
                <p className="text-sm text-muted-foreground">
                  Địa chỉ giao được cấu hình riêng cho từng dòng hàng.
                </p>
              )}

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

              {deliveryNote.confirmedAt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Xác nhận</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDateTime(deliveryNote.confirmedAt)}</span>
                    </div>
                    {deliveryNote.confirmedBy && (
                      <div className="flex items-center gap-2 mt-1 ml-6">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{deliveryNote.confirmedBy.fullName || "—"}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {deliveryNote.handedOverAt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Bàn giao</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDateTime(deliveryNote.handedOverAt)}</span>
                    </div>
                    {deliveryNote.handedOverBy && (
                      <div className="flex items-center gap-2 mt-1 ml-6">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {deliveryNote.handedOverBy.fullName || "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {deliveryNote.cancelledAt && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Hủy</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDateTime(deliveryNote.cancelledAt)}</span>
                    </div>
                    {deliveryNote.cancelledBy && (
                      <div className="flex items-center gap-2 mt-1 ml-6">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {deliveryNote.cancelledBy.fullName || "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Line summary (groups by order) */}
          {hasLines && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4" />
                  Đơn hàng liên quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from(
                  new Map(
                    lines.map((l) => [(l as any).orderCode || l.id, l])
                  ).values()
                )
                  .reduce<{ orderCode: string | null; count: number }[]>((acc, l) => {
                    const code = (l as any).orderCode as string | null;
                    const existing = acc.find((a) => a.orderCode === code);
                    if (existing) {
                      existing.count++;
                    } else {
                      acc.push({ orderCode: code, count: 1 });
                    }
                    return acc;
                  }, [])
                  .map(({ orderCode, count }) => (
                    <div
                      key={orderCode}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-mono text-muted-foreground">
                        {orderCode || "—"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {count} dòng
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
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
              Hệ thống sẽ tự động gom tất cả các dòng giao thất bại của phiếu
              này và tạo một phiếu giao hàng mới, giữ nguyên địa chỉ và số
              lượng ban đầu.
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
