import { useState, useMemo } from "react";
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
  RotateCcw,
  History,
  Printer,
} from "lucide-react";

import PrintPreviewDialog from "./PrintPreviewDialog";

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
import {
  useCreateReturnNote,
  useReturnNotesByDeliveryNote,
  useReturnableLines,
} from "@/hooks/use-return-note";
import { useAuth } from "@/hooks/use-auth";
import {
  formatCurrency,
  deliveryNoteStatusLabels,
  deliveryLineStatusLabels,
  deliveryFailureTypeLabels,
  getStatusColorClass,
} from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import DeliveryLinesCard from "./DeliveryLinesCard";
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
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printWithPrice, setPrintWithPrice] = useState(false);
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

  const lines = (deliveryNote as any)?.lines as
    | DeliveryNoteLineResponse[]
    | null;

  const updateStatusMutation = useUpdateDeliveryNoteStatus();
  const exportPDFMutation = useExportDeliveryNotePDF();
  const recreateMutation = useRecreateDeliveryNote();
  const updateLineResultMutation = useUpdateDeliveryLineResult();

  // Return Notes states and hooks
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedLineForReturn, setSelectedLineForReturn] = useState<any | null>(null);
  const [returnForm, setReturnForm] = useState<
    Record<number, { checked: boolean; returnQty: number; reason: string }>
  >({});

  const { data: returnNotes } = useReturnNotesByDeliveryNote(
    deliveryNoteId,
    !!deliveryNoteId,
  );

  const { data: returnableLinesData } = useReturnableLines(
    deliveryNoteId,
    !!deliveryNoteId,
  );

  const returnableLinesMap = useMemo(() => {
    const map: Record<number, any> = {};
    if (returnableLinesData) {
      for (const rl of returnableLinesData) {
        map[rl.deliveryNoteLineId] = rl;
      }
    }
    return map;
  }, [returnableLinesData]);

  const totalNetQty = useMemo(() => {
    return (lines || []).reduce((sum, l) => sum + (l.netQtyTotal || 0), 0);
  }, [lines]);

  const isFormValid = useMemo(() => {
    if (!selectedLineForReturn) return false;
    const state = returnForm[selectedLineForReturn.id];
    if (!state) return false;
    const maxQty = returnableLinesMap[selectedLineForReturn.id]?.maxReturnableQty ?? 0;
    return (
      state.returnQty >= 1 &&
      state.returnQty <= maxQty &&
      state.reason.trim().length > 0
    );
  }, [returnForm, selectedLineForReturn, returnableLinesMap]);

  const openReturnDialog = (selectedLine: any) => {
    setSelectedLineForReturn(selectedLine);
    const maxQty = returnableLinesMap[selectedLine.id]?.maxReturnableQty ?? 0;
    setReturnForm({
      [selectedLine.id]: {
        checked: true,
        returnQty: maxQty,
        reason: "",
      },
    });
    setIsReturnDialogOpen(true);
  };

  const createReturnNoteMutation = useCreateReturnNote();

  const handleReturnSubmit = async () => {
    if (!isFormValid || !selectedLineForReturn) return;
    const state = returnForm[selectedLineForReturn.id];
    if (!state) return;

    try {
      await createReturnNoteMutation.mutateAsync({
        deliveryNoteId: deliveryNoteId,
        lines: [
          {
            deliveryNoteLineId: selectedLineForReturn.id,
            returnQty: state.returnQty,
            reason: state.reason.trim(),
          },
        ],
      });
      setIsReturnDialogOpen(false);
      setSelectedLineForReturn(null);
    } catch (e) {
      // Handled by hook
    }
  };

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

  const handleExportPDF = async (type: string = "A4") => {
    if (!deliveryNote?.id) return;
    try {
      await exportPDFMutation.mutateAsync({ id: deliveryNote.id, type });
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

  const getDisplayStatus = (note: any) => {
    if (!note) return "draft";
    const lines = note.lines || [];
    const hasDelivered = lines.some((l: any) => l.status === "delivered");
    const hasReschedule = lines.some((l: any) => l.status === "failed_reschedule");
    const hasFailed = lines.some((l: any) => ["failed", "returned", "cancelled"].includes(l.status || ""));

    if (note.status === "cancelled" && (hasDelivered || hasReschedule)) {
      return "partial";
    }

    if (hasReschedule) return "failed_reschedule";
    if (hasDelivered && hasFailed) return "partial";
    if (hasDelivered) return "completed";
    if (hasFailed) return "failed";

    return (note.status || "draft").toLowerCase();
  };

  const currentStatus = getDisplayStatus(deliveryNote);

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
  const isDelivered = ["completed", "delivered", "partially_completed"].includes(currentStatus);

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
          return [key, addr] as [unknown, typeof addr];
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
              onClick={() => {
                setPrintWithPrice(false);
                setIsPrintPreviewOpen(true);
              }}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              In Phiếu Giao Hàng
            </Button>
            <Button
              onClick={() => {
                setPrintWithPrice(true);
                setIsPrintPreviewOpen(true);
              }}
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              In Phiếu (Có Tiền)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportPDF("A4")}
              disabled={exportPDFMutation.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportPDFMutation.isPending
                ? "Đang xử lý..."
                : "Xuất Phiếu PDF (A4)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportPDF("A5")}
              disabled={exportPDFMutation.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportPDFMutation.isPending
                ? "Đang xử lý..."
                : "Xuất Phiếu PDF (A5)"}
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
        <Alert className="border-amber-200 bg-amber-50">
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
              {totalDeliveryQty.toLocaleString("vi-VN")}
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

      <div className="space-y-6">
        {/* Horizontal Delivery Info Panel */}
        <DeliveryInfoSidebar
          deliveryNote={deliveryNote}
          uniqueAddresses={uniqueAddresses}
          formatDateTime={formatDateTime}
        />

        {/* Lines Table */}
        <DeliveryLinesCard
          lines={lines}
          currentStatus={currentStatus}
          isDelivered={isDelivered}
          returnableLinesMap={returnableLinesMap}
          openReturnDialog={openReturnDialog}
        />

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

        {/* Return History - always show, even if empty */}
        <Card className="border-amber-200/60 bg-amber-50/10">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <History className="w-5 h-5 text-amber-600" />
              Lịch sử trả hàng lỗi
              {returnNotes && returnNotes.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-amber-700 bg-amber-100">
                  {returnNotes.length} phiếu
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!returnNotes || returnNotes.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Chưa có trả hàng nào
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-4">Phiếu trả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo / Xử lý</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-right">Số lượng trả</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnNotes.flatMap((note) =>
                      (note.lines ?? []).map((l, idx) => (
                        <TableRow key={`${note.id}-${l.id}`} className="hover:bg-muted/30 transition-colors">
                          {idx === 0 ? (
                            <>
                              <TableCell className="pl-4" rowSpan={(note.lines ?? []).length}>
                                <div className="font-mono font-semibold text-sm text-amber-800">
                                  {note.code || `#${note.id}`}
                                </div>
                              </TableCell>
                              <TableCell rowSpan={(note.lines ?? []).length}>
                                {note.statusLabel && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap">
                                    {note.statusLabel}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell rowSpan={(note.lines ?? []).length}>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  <div>Tạo: {formatDateTime(note.createdAt)}</div>
                                  {note.createdByName && <div className="text-foreground/60">{note.createdByName}</div>}
                                  {note.processedAt && (
                                    <div className="mt-1">
                                      <div>Xử lý: {formatDateTime(note.processedAt)}</div>
                                      {note.processedByName && <div className="text-foreground/60">{note.processedByName}</div>}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </>
                          ) : null}
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-medium text-sm">
                                {l.productName || l.productCode || "Sản phẩm"}
                              </div>
                              {l.productCode && (
                                <div className="font-mono text-xs text-muted-foreground">{l.productCode}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-amber-700">
                              {l.returnQty.toLocaleString("vi-VN")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground italic">
                              {l.reason || "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Orders (Horizontal pills layout) */}
        {hasLines && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                Đơn hàng liên quan
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 flex flex-wrap gap-2">
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
                    className="flex items-center gap-2 text-sm px-3 py-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-md font-mono"
                  >
                    <span className="text-stone-800 dark:text-stone-200 font-semibold">{orderCode || "—"}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {count} mặt hàng
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
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

      {/* Print Preview Dialog */}
      <PrintPreviewDialog
        open={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        deliveryNote={deliveryNote}
        showPrice={printWithPrice}
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

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={(open) => {
        setIsReturnDialogOpen(open);
        if (!open) setSelectedLineForReturn(null);
      }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Tạo phiếu trả hàng lỗi
            </DialogTitle>
            <DialogDescription>
              Nhập số lượng và lý do trả lại hàng hóa bị lỗi cho sản phẩm này.
            </DialogDescription>
          </DialogHeader>

          {selectedLineForReturn && (
            <div className="p-6 space-y-4">
              {/* Product Info Block */}
              <div className="bg-amber-50/30 border border-amber-100 rounded-lg p-3 space-y-1">
                <div className="font-mono text-xs font-bold text-amber-800">
                  {selectedLineForReturn.designCode}
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {selectedLineForReturn.designName}
                </div>
              </div>

              {/* Quantities Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Đã giao (thực tính)</span>
                  <div className="text-sm font-semibold">
                    {selectedLineForReturn.netQtyTotal?.toLocaleString("vi-VN") || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Đã trả trước đó</span>
                  <div className="text-sm font-semibold text-amber-600">
                    {(returnableLinesMap[selectedLineForReturn.id]?.alreadyReturnedQty || 0).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              {/* Input: Return Qty */}
              {(() => {
                const lineState = returnForm[selectedLineForReturn.id] || { returnQty: 0, reason: "" };
                const maxQty = returnableLinesMap[selectedLineForReturn.id]?.maxReturnableQty ?? 0;
                return (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="return-qty" className="text-sm font-medium">
                        Số lượng trả lần này <span className="text-destructive">*</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          (Tối đa {maxQty.toLocaleString("vi-VN")})
                        </span>
                      </Label>
                      <input
                        id="return-qty"
                        type="number"
                        min={1}
                        max={maxQty}
                        value={lineState.returnQty}
                        onChange={(e) => {
                          const val = Math.min(maxQty, Math.max(1, Number.parseInt(e.target.value, 10) || 1));
                          setReturnForm(prev => ({
                            ...prev,
                            [selectedLineForReturn.id]: { ...prev[selectedLineForReturn.id], returnQty: val }
                          }));
                        }}
                        className="w-full h-10 border rounded-md px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    {/* Input: Reason */}
                    <div className="space-y-1.5">
                      <Label htmlFor="return-reason" className="text-sm font-medium">
                        Lý do trả hàng <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="return-reason"
                        placeholder="Nhập lý do chi tiết..."
                        value={lineState.reason}
                        onChange={(e) => {
                          setReturnForm(prev => ({
                            ...prev,
                            [selectedLineForReturn.id]: { ...prev[selectedLineForReturn.id], reason: e.target.value }
                          }));
                        }}
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <DialogFooter className="p-6 pt-4 border-t border-border/60 bg-muted/20">
            <Button
              variant="outline"
              onClick={() => {
                setIsReturnDialogOpen(false);
                setSelectedLineForReturn(null);
              }}
              disabled={createReturnNoteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReturnSubmit}
              disabled={!isFormValid || createReturnNoteMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createReturnNoteMutation.isPending ? "Đang xử lý..." : "Xác nhận trả hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
