import React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  History,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Printer,
  Send,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePrintOrderHistory } from "@/hooks/use-print-order";

interface PrintOrderHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  printOrderId: number | null;
  proofingCode?: string;
}

const getEventBadgeStyle = (eventType: string) => {
  switch (eventType) {
    case "dispatched":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "re_dispatched":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "started":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "paused":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "returned_by_print":
    case "returned_to_dispatch":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "returned_to_proofing":
      return "bg-red-100 text-red-800 border-red-200";
    case "reproofed":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "dispatched":
      return <Send className="h-3.5 w-3.5 text-blue-600" />;
    case "re_dispatched":
      return <RotateCcw className="h-3.5 w-3.5 text-sky-600" />;
    case "started":
      return <Printer className="h-3.5 w-3.5 text-amber-600" />;
    case "paused":
      return <Clock className="h-3.5 w-3.5 text-purple-600" />;
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    case "returned_by_print":
    case "returned_to_dispatch":
    case "returned_to_proofing":
      return <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />;
    case "reproofed":
      return <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-slate-500" />;
  }
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "HH:mm - dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

export function PrintOrderHistoryModal({
  isOpen,
  onOpenChange,
  printOrderId,
  proofingCode,
}: PrintOrderHistoryModalProps) {
  const { data: historyItems, isLoading } = usePrintOrderHistory(printOrderId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <History className="h-5 w-5 text-[#93631F]" />
            Lịch sử sản xuất bài in {proofingCode ? `(${proofingCode})` : ""}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Theo dõi dòng sự kiện thao tác sản xuất và điều lệnh bài in này.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 text-[#93631F] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải lịch sử sản xuất...</p>
            </div>
          ) : !historyItems || historyItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Chưa có ghi nhận lịch sử sản xuất nào cho bài in này.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {historyItems.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Circle Node */}
                  <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-xs group-hover:border-[#93631F]">
                    {getEventIcon(item.eventType)}
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] font-bold ${getEventBadgeStyle(item.eventType)}`}>
                        {item.eventTypeDisplayName || item.eventType}
                      </Badge>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5 pt-0.5">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{item.userName || "Hệ thống"}</span>
                    </div>

                    {item.reason && (
                      <div className="mt-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200/60 rounded-lg p-2 font-mono">
                        <span className="font-bold font-sans text-rose-900">Lý do: </span>
                        {item.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
