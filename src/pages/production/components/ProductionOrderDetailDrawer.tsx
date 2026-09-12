import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  User,
  History,
  Layers,
  Info,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { ProductionOrderResponse } from "@/Schema";

interface ProductionOrderDetailDrawerProps {
  order: ProductionOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintSlip?: (orderId: number) => void;
}

export function ProductionOrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onPrintSlip,
}: ProductionOrderDetailDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"info" | "progress" | "history" | "documents">("progress");

  if (!order) return null;

  const orderCode = String(order.proofingOrderCode || order.code || `LSX${String(order.id).padStart(6, "0")}`);
  const flowCode = String((order as any).flowCode || (order as any).flowId || "F03");
  const productName = String((order as any).productName || (order as any).proofingOrderTitle || "Hộp duplex bồi sóng");
  const specification = String((order as any).specification || "32×24×10 cm");
  const customerName = String((order as any).customerName || "Cty An Phát");
  const statusText = String((order as any).statusDisplay || (order as any).status || "Quá hạn");

  const isLate = statusText.toLowerCase().includes("quá hạn") || statusText.toLowerCase().includes("late");
  const overdueMinutes = 35;

  // Timeline Step Data
  const steps = order.steps && order.steps.length > 0 ? order.steps : [
    { id: 1, stepName: "Bình bài", timeRange: "08:00 - 08:10", duration: "10 phút", status: "completed" },
    { id: 2, stepName: "Điều lệnh", timeRange: "08:15 - 08:45", duration: "30 phút", status: "completed" },
    { id: 3, stepName: "In", timeRange: "09:00 - 10:20", duration: "80 phút", status: "completed" },
    { id: 4, stepName: "Cán màng", timeRange: "10:30 - 11:25", duration: "55 phút", status: "completed" },
    { id: 5, stepName: "Bồi", timeRange: "11:40 - 12:10", duration: "30 phút", status: "completed" },
    { id: 6, stepName: "Bế", timeRange: "12:30 - 13:05", duration: "35 phút", status: "completed" },
    { id: 7, stepName: "Gỡ", timeRange: "Bắt đầu: 13:10", duration: "95 phút (vượt +35 phút)", status: "overdue", isCurrent: true, standardMinutes: 60, actualMinutes: 95 },
    { id: 8, stepName: "Dán", timeRange: "Chưa tới", duration: "—", status: "pending" },
    { id: 9, stepName: "Đóng gói", timeRange: "Chưa tới", duration: "—", status: "pending" },
  ];

  const currentStep = steps.find((s) => (s as any).isCurrent) || steps[6] || steps[0];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background border-l shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black font-mono text-primary">{orderCode}</h2>
            <Badge variant="outline" className="text-xs font-extrabold bg-blue-50 text-blue-800 border-blue-200">
              {flowCode}
            </Badge>
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Badge
              className={cn(
                "text-xs font-bold border-none px-2.5 py-1 flex items-center gap-1",
                isLate
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isLate ? `🔴 Quá hạn  +${overdueMinutes} phút` : `🟢 ${statusText}`}</span>
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-2 border-b bg-card">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-9 p-1">
              <TabsTrigger value="info" className="text-xs font-bold">Thông tin</TabsTrigger>
              <TabsTrigger value="progress" className="text-xs font-bold">Tiến độ</TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-bold">Lịch sử</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs font-bold">Tài liệu</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "progress" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Tiến độ sản xuất thời gian thực
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">9 công đoạn</span>
              </div>

              {/* Vertical Stepper Timeline */}
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-4 pl-4 py-1">
                {steps.map((st: any, idx: number) => {
                  const isDone = st.status === "completed" || st.status === "done";
                  const isCurrentOverdue = st.status === "overdue" || st.isCurrent;
                  const isPending = st.status === "pending";

                  return (
                    <div key={st.id || idx} className="relative group">
                      {/* Node circle icon */}
                      <div
                        className={cn(
                          "absolute -left-[25px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-background transition-colors",
                          isDone
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : isCurrentOverdue
                              ? "border-red-500 bg-red-500 text-white animate-pulse"
                              : "border-slate-300 text-slate-400"
                        )}
                      >
                        {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {isCurrentOverdue && <AlertTriangle className="w-3 h-3 text-white" />}
                      </div>

                      {/* Content details */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4
                            className={cn(
                              "text-xs font-bold",
                              isDone ? "text-foreground" : isCurrentOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                            )}
                          >
                            {String((st as any).stepName || (st as any).stepTypeName || "Công đoạn")}
                            {isCurrentOverdue && (
                              <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                Đang xử lý (quá hạn)
                              </span>
                            )}
                            {isPending && (
                              <span className="ml-2 text-[10px] text-muted-foreground font-normal italic">
                                Chưa tới
                              </span>
                            )}
                          </h4>

                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            {String((st as any).timeRange || "—")}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "text-xs font-mono font-bold shrink-0",
                            isCurrentOverdue ? "text-red-600" : isDone ? "text-slate-700 dark:text-slate-300" : "text-muted-foreground"
                          )}
                        >
                          {String((st as any).duration || "—")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Callout Alert Box for Overdue step */}
              {isLate && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    Khâu {String((currentStep as any).stepName || (currentStep as any).stepTypeName || "Gỡ")} đang quá hạn {overdueMinutes} phút
                  </div>
                  <div className="text-xs text-red-900/80 dark:text-red-200/80 space-y-0.5 pl-6 font-medium">
                    <p>• Thời gian chuẩn: <strong>≤ 60 phút</strong></p>
                    <p>• Thời gian thực hiện: <strong>95 phút</strong></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <h4 className="font-bold text-foreground">Thông tin sản phẩm & quy cách</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Tên sản phẩm: <strong className="text-foreground font-bold">{productName}</strong></div>
                  <div>Quy cách: <strong className="text-foreground font-mono">{specification}</strong></div>
                  <div>Khách hàng: <strong className="text-foreground font-bold">{customerName}</strong></div>
                  <div>Mã Flow: <strong className="text-primary font-bold">{flowCode}</strong></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Lịch sử ghi nhận thao tác của Lệnh {orderCode}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Chưa có tài liệu đính kèm cho Lệnh {orderCode}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-card flex items-center gap-2">
          <Button
            className="flex-1 font-bold text-xs bg-[#93631F] hover:bg-[#7a521a] text-white cursor-pointer shadow-sm"
            onClick={() => navigate(`/production/${order.id}`)}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Xem chi tiết lệnh
          </Button>

          <Button
            variant="outline"
            className="font-bold text-xs border-slate-300 hover:bg-muted cursor-pointer"
            onClick={() => onPrintSlip && onPrintSlip(order.id)}
          >
            <Printer className="w-3.5 h-3.5 mr-1" /> In phiếu lệnh
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
