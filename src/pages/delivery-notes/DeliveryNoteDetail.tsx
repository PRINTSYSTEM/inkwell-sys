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
  useUpdateDeliveryLineResult,
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
import DeliveryLineRow from "./DeliveryLineRow";
import DeliveryInfoSidebar from "./DeliveryInfoSidebar";
import DeliveryNoteUpdateDialog from "./DeliveryNoteUpdateDialog";
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

// === Simplified UI status mapping ===
type UIStatus = "ok" | "shipping" | "success" | "failed";

const mapDeliveryNoteStatus = (status?: string | null): UIStatus => {
  const s = (status || "").toLowerCase();
  if (
    ["draft", "confirmed", "ready_to_ship", "handed_over", "pending"].includes(
      s,
    )
  )
    return "ok";
  if (["in_transit", "delivering"].includes(s)) return "shipping";
  if (["completed", "delivered", "partially_completed"].includes(s))
    return "success";
  if (["cancelled", "failed", "failure"].includes(s)) return "failed";
  return "ok";
};

const uiActionToBEStatus: Record<UIStatus, string> = {
  ok: "confirmed",
  shipping: "in_transit",
  success: "completed",
  failed: "cancelled",
};

const UI_STATUS_CONFIG: Record<UIStatus, { label: string; color?: string }> = {
  ok: { label: "OK", color: "gray" },
  shipping: { label: "Đang giao", color: "blue" },
  success: { label: "Đã giao hàng", color: "green" },
  failed: { label: "Hủy phiếu", color: "red" },
};

// NOTE: Line row and status badge are extracted into separate components
// `DeliveryLineRow` and `StatusBadge` in their own files. Keep this file
// focused on the page logic.

export default function DeliveryNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deliveryNoteId = Number.parseInt(id || "0", 10);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [status, setStatus] = useState<UIStatus>("ok");
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
  const updateLineResultMutation = useUpdateDeliveryLineResult();

  const handleOpenUpdateDialog = (newStatus?: string) => {
    // map backend status to simplified UI status
    const mapped = newStatus
      ? mapDeliveryNoteStatus(newStatus)
      : mapDeliveryNoteStatus(deliveryNote?.status);
    setStatus(mapped);
    setCancelReason((deliveryNote as any)?.cancelReason || "");
    setFailureReason(deliveryNote?.failureReason || "");
    setFailureType(deliveryNote?.failureType || "");
    setAffectsDebt(deliveryNote?.affectsDebt || false);
    setNotes(deliveryNote?.notes || "");
    setIsUpdateDialogOpen(true);
  };

  // Open dialog directly for a simplified UI action
  const openUpdateDialogForUI = (uiStatus: UIStatus) => {
    setStatus(uiStatus);
    setCancelReason((deliveryNote as any)?.cancelReason || "");
    setFailureReason(deliveryNote?.failureReason || "");
    setFailureType(deliveryNote?.failureType || "");
    setAffectsDebt(deliveryNote?.affectsDebt || false);
    setNotes(deliveryNote?.notes || "");
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateStatus = async (statusArg?: UIStatus) => {
    if (!deliveryNote?.id) return;
    const current = (statusArg as UIStatus) || status;

    try {
      // If user chose failed, require a failureReason
      if (current === "failed" && !failureReason) {
        // keep dialog open and don't submit
        return;
      }

      // If starting shipping: only update the DeliveryNote status to in_transit.
      if (current === "shipping") {
        await updateStatusMutation.mutateAsync({
          id: Number(deliveryNote.id),
          data: {
            status: uiActionToBEStatus[current],
            cancelReason: cancelReason || null,
            failureReason: failureReason || null,
            failureType: failureType || null,
            affectsDebt: affectsDebt,
            notes: notes || null,
          },
        });

        setIsUpdateDialogOpen(false);
        return;
      }

      // For success/failed flows: update lines only. BE will aggregate note status.
      if (Array.isArray(lines) && lines.length > 0) {
        const targetLineStatus =
          current === "success"
            ? "delivered"
            : current === "failed"
              ? "failed_reschedule"
              : null;
        if (targetLineStatus) {
          await Promise.all(
            lines.map((l) => {
              if (!l?.id) return Promise.resolve(null);
              return updateLineResultMutation.mutateAsync({
                lineId: Number(l.id),
                data: {
                  status: targetLineStatus,
                  failureNotes:
                    current === "failed"
                      ? failureReason || undefined
                      : undefined,
                },
              });
            }),
          );
        }
      }

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

  // Compute aggregated delivery note status from line statuses
  const computeDeliveryNoteStatusFromLines = (
    ls: DeliveryNoteLineResponse[],
  ) => {
    if (!ls || ls.length === 0) return null;
    const statuses = ls.map((l) => (l.status || "").toLowerCase());

    const allDelivered = statuses.every((s) => s === "delivered");
    if (allDelivered) return "completed";

    const anyDelivered = statuses.some((s) => s === "delivered");
    const allFailedish = statuses.every((s) =>
      ["failed_reschedule", "cancelled", "returned"].includes(s),
    );
    if (allFailedish) return "cancelled";

    if (anyDelivered) return "partially_completed";

    // default: still in transit
    return "in_transit";
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

  // Collect unique per-line customer addresses for sidebar display
  const uniqueAddresses = Array.from(
    new Map(
      (lines ?? [])
        .map((l) => {
          const addr = (l as any).customerAddress;
          const key =
            addr?.id ?? `${addr?.recipientName || ""}|${addr?.address || ""}`;
          return [key, addr];
        })
        .filter(([, a]) => !!a),
    ).values(),
  ).filter(Boolean) as Array<{
    label?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    address?: string | null;
  }>;

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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">
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

            <div className="flex items-center gap-4 flex-wrap">
              {/* Simplified UI actions (ok -> shipping -> success/failed) */}
              <div className="flex gap-2">
                {(() => {
                  const uiStatus = mapDeliveryNoteStatus(currentStatus);
                  const actionsByStatus: Record<UIStatus, UIStatus[]> = {
                    ok: ["shipping"],
                    // once shipping, only allow success (failed handled per line)
                    shipping: [],
                    success: [],
                    failed: [],
                  };

                  const quickUpdate = async (next: UIStatus) => {
                    // for failed we need details -> open dialog; for shipping/success perform immediately
                    if (next === "failed") {
                      openUpdateDialogForUI(next);
                      return;
                    }
                    setStatus(next);
                    await handleUpdateStatus(next);
                  };

                  return actionsByStatus[uiStatus].map((next) => (
                    <Button
                      key={next}
                      onClick={() => quickUpdate(next)}
                      variant={next === "failed" ? "destructive" : "default"}
                      size="sm"
                    >
                      {UI_STATUS_CONFIG[next].label}
                    </Button>
                  ));
                })()}
              </div>

              {/* Legend for the user to see the full flow */}
              <div className="hidden xl:flex items-center gap-1 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
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

          <div className="flex items-center gap-2 flex-wrap lg:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exportPDFMutation.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportPDFMutation.isPending
                ? "Đang xử lý..."
                : "Xuất Phiếu (PDF)"}
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
                Chi tiết phiếu giao hàng
                {hasLines && (
                  <Badge variant="secondary" className="ml-auto">
                    {lines.length} đơn
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
                        <TableHead className="text-right">
                          SL đặt hàng
                        </TableHead>
                        <TableHead className="text-right">
                          SL giao
                        </TableHead>
                        <TableHead className="text-right">Phụ hao</TableHead>
                        <TableHead className="text-right">
                          SL thực tính
                        </TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <DeliveryLineRow
                          key={line.id ?? idx}
                          line={line}
                          noteStatus={currentStatus}
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
          <DeliveryInfoSidebar
            deliveryNote={deliveryNote}
            uniqueAddresses={uniqueAddresses}
            formatDateTime={formatDateTime}
          />

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
                        {count} đơn
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Update Status Dialog (extracted) */}
      <DeliveryNoteUpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        status={status}
        setStatus={(v: any) => setStatus(v)}
        failureType={failureType}
        setFailureType={setFailureType}
        failureReason={failureReason}
        setFailureReason={setFailureReason}
        affectsDebt={affectsDebt}
        setAffectsDebt={setAffectsDebt}
        notes={notes}
        setNotes={setNotes}
        onConfirm={() => handleUpdateStatus()}
        isPending={updateStatusMutation.isPending}
      />

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
