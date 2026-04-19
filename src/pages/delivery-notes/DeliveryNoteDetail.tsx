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
  Check,
  PackageCheck,
  Send,
  X,
  ClipboardCheck,
  FileEdit,
  ChevronRight,
  MoreHorizontal,
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
import {
  formatCurrency,
  deliveryNoteStatusLabels,
  deliveryLineStatusLabels,
  deliveryFailureTypeLabels,
  getStatusColorClass,
} from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { ENTITY_CONFIG } from "@/config/entities.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const label = deliveryLineStatusLabels[status] || status;
  return <StatusBadge status={status} label={label} />;
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
        <span className="text-sm font-medium">
          {line.orderedQty?.toLocaleString("vi-VN") ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="text-sm font-medium text-blue-600">
          {line.netQtyTotal?.toLocaleString("vi-VN") ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="font-bold text-sm text-primary">
            {line.deliveryQty?.toLocaleString("vi-VN") ?? "—"}
          </span>
          {line.actualDeliveredQty != null && line.actualDeliveredQty !== line.deliveryQty && (
            <span className="text-[10px] text-green-600 font-medium">
              Thực giao: {line.actualDeliveredQty.toLocaleString("vi-VN")}
            </span>
          )}
        </div>
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
  const [cancelReason, setCancelReason] = useState("");
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
    setCancelReason((deliveryNote as any)?.cancelReason || "");
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
        id: Number(deliveryNote.id),
        data: {
          status,
          cancelReason: cancelReason || null,
          failureReason: failureReason || null,
          failureType: failureType || null,
          affectsDebt: affectsDebt,
          notes: notes || null,
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
    const label =
      deliveryNoteStatusLabels[status] || deliveryNote?.statusName || status;
    return <StatusBadge status={status} label={label} />;
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

  const currentStatus = (deliveryNote?.status || "draft").toLowerCase();

  const statusRanks: Record<string, number> = {
    draft: 0,
    confirmed: 1,
    pending: 1, // backward compatibility
    ready_to_ship: 2,
    handed_over: 3,
    in_transit: 4,
    delivering: 4, // backward compatibility
    completed: 5,
    delivered: 5, // backward compatibility
    partially_completed: 5,
    cancelled: 6,
  };

  const currentRank = statusRanks[currentStatus] ?? 0;

  const isFailed = currentStatus === "failed" || currentStatus === "failure";
  const isCancelled = currentStatus === "cancelled";
  const canRecreate = isFailed;

  // Next steps mapping
  const nextSteps: Record<string, { value: string; label: string; icon: any }> =
    {
      draft: { value: "confirmed", label: "Xác nhận", icon: Check },
      confirmed: {
        value: "ready_to_ship",
        label: "Sẵn sàng giao",
        icon: PackageCheck,
      },
      pending: {
        value: "ready_to_ship",
        label: "Sẵn sàng giao",
        icon: PackageCheck,
      },
      ready_to_ship: {
        value: "handed_over",
        label: "Bàn giao ĐVVC",
        icon: Send,
      },
      handed_over: { value: "in_transit", label: "Giao hàng", icon: Truck },
      in_transit: {
        value: "completed",
        label: "Hoàn tất",
        icon: ClipboardCheck,
      },
      delivering: {
        value: "completed",
        label: "Hoàn tất",
        icon: ClipboardCheck,
      },
    };

  const nextAction = nextSteps[currentStatus];

  // Stats from lines
  const lines = (deliveryNote as any).lines as
    | DeliveryNoteLineResponse[]
    | null;
  const hasLines = lines && lines.length > 0;
  const totalDeliveryQty = (deliveryNote as any).totalDeliveryQty as
    | number
    | undefined;
  const totalPendingLines = (deliveryNote as any).totalPendingLines as
    | number
    | undefined;
  const totalDeliveredLines = (deliveryNote as any).totalDeliveredLines as
    | number
    | undefined;
  const totalFailedLines = (deliveryNote as any).totalFailedLines as
    | number
    | undefined;

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
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {deliveryNote.code || `Phiếu giao hàng #${deliveryNote.id}`}
              </h1>
              <div className="flex items-center gap-2 rounded-full bg-card/60 px-3 py-1 text-xs shadow-sm border border-border">
                <span className="text-muted-foreground mr-1">Trạng thái:</span>
                {getStatusBadge(currentStatus)}
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

          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {nextAction &&
              !isCancelled &&
              currentStatus !== "completed" &&
              currentStatus !== "partially_completed" && (
                <Button
                  className="gap-2 shadow-sm"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: Number(deliveryNote.id),
                      data: { status: nextAction.value },
                    });
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  <nextAction.icon className="w-4 h-4" />
                  {updateStatusMutation.isPending
                    ? "Đang xử lý..."
                    : nextAction.label}
                </Button>
              )}

            {!isCancelled && currentStatus !== "completed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleExportPDF}
                  disabled={exportPDFMutation.isPending}
                >
                  <Download className="w-4 h-4" />
                  Xuất PDF
                </Button>

                {currentStatus !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleOpenUpdateDialog("cancelled")}
                  >
                    <X className="w-4 h-4" />
                    Hủy phiếu
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Thêm thao tác</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Thao tác khác</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleOpenUpdateDialog()}>
                      <FileEdit className="mr-2 h-4 w-4" />
                      Cập nhật chi tiết
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

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

            {/* Legend for the user to see the full flow */}
            <div className="hidden xl:flex items-center gap-1 ml-4 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
              {Object.keys(nextSteps).map((step, idx) => (
                <div key={step} className="flex items-center">
                  <span
                    className={`text-xs font-medium ${currentStatus === step ? "text-primary font-bold" : "text-muted-foreground"}`}
                  >
                    {deliveryNoteStatusLabels[step]}
                  </span>
                  {idx < Object.keys(nextSteps).length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />
                  )}
                </div>
              ))}
            </div>
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
                {deliveryNote.failureType &&
                  (deliveryFailureTypeLabels[deliveryNote.failureType] ||
                    deliveryNote.failureType)}
                {" — "}
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

      {isCancelled && (
        <Alert variant="warning" className="border-amber-200 bg-amber-50">
          <XCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            Phiếu giao hàng đã hủy
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="space-y-1 mt-1">
              <div>
                <strong>Lý do hủy:</strong>{" "}
                {(deliveryNote as any).cancelReason || "—"}
              </div>
              {deliveryNote.cancelledBy && (
                <div>
                  <strong>Người hủy:</strong>{" "}
                  {deliveryNote.cancelledBy.fullName || "—"}
                </div>
              )}
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
                        <TableHead className="text-right">SL đặt</TableHead>
                        <TableHead className="text-right">SL sản xuất</TableHead>
                        <TableHead className="text-right">SL giao</TableHead>
                        <TableHead>Địa chỉ giao</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <DeliveryLineRow key={line.id ?? idx} line={line} />
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
                    <Label className="text-muted-foreground">
                      Số điện thoại
                    </Label>
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
                    <Label className="text-muted-foreground">
                      Địa chỉ giao hàng
                    </Label>
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
                        <span>{deliveryNote.handedOverBy.fullName || "—"}</span>
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
                        <span>{deliveryNote.cancelledBy.fullName || "—"}</span>
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
                    lines.map((l) => [(l as any).orderCode || l.id, l]),
                  ).values(),
                )
                  .reduce<{ orderCode: string | null; count: number }[]>(
                    (acc, l) => {
                      const code = (l as any).orderCode as string | null;
                      const existing = acc.find((a) => a.orderCode === code);
                      if (existing) {
                        existing.count++;
                      } else {
                        acc.push({ orderCode: code, count: 1 });
                      }
                      return acc;
                    },
                    [],
                  )
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
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val);
                  // Clear specific reasons when switching away from that status
                  if (val !== "failed") {
                    setFailureReason("");
                    setFailureType("");
                  }
                  if (val !== "cancelled") {
                    setCancelReason("");
                  }
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(deliveryNoteStatusLabels).map(
                    ([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {status === "cancelled" && (
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Lý do hủy *</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy phiếu giao hàng..."
                  rows={3}
                />
              </div>
            )}

            {status === "failed" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="failureType">Loại thất bại</Label>
                  <Select value={failureType} onValueChange={setFailureType}>
                    <SelectTrigger id="failureType">
                      <SelectValue placeholder="Chọn loại thất bại" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(deliveryFailureTypeLabels).map(
                        ([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ),
                      )}
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
                (status === "failed" && !failureReason) ||
                (status === "cancelled" && !cancelReason)
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
              này và tạo một phiếu giao hàng mới, giữ nguyên địa chỉ và số lượng
              ban đầu.
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
