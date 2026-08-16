import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trash2, Plus, ArrowUpDown, History, Receipt } from "lucide-react";
import type { VendorResponse } from "@/Schema";
import { useAPSummary, useAPDetail } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import {
  useSettleVendorDebt,
  useVendorDebtSettlements,
  useDeleteVendorDebtSettlement,
  useVendorOtherCosts,
  useCreateVendorOtherCost,
  useDeleteVendorOtherCost,
} from "@/hooks/use-vendor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VendorDebtTabProps {
  vendor: VendorResponse;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch (e) {
    return "—";
  }
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch (e) {
    return "—";
  }
};

export function VendorDebtTab({ vendor }: VendorDebtTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isAccountingOrAdmin =
    user?.role === "admin" ||
    user?.role === "accounting" ||
    user?.role === "accounting_lead";
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: apSummaryData, isLoading: isLoadingSummary } = useAPSummary({
    searchTerm: vendor.code || vendor.name,
  });

  const { data: apDetailData, isLoading: isLoadingDetail } = useAPDetail({
    vendorId: vendor.id,
    pageSize: 50,
  });

  // Chỉ gọi API lịch sử tất toán nếu người dùng là Admin
  const { data: settlementsData, isLoading: isLoadingSettlements } = useVendorDebtSettlements(
    vendor.id,
    isAdmin
  );

  // Gọi API lịch sử chi phí khác cho Admin & Kế toán
  const { data: otherCostsData, isLoading: isLoadingOtherCosts } = useVendorOtherCosts(
    vendor.id,
    undefined,
    isAccountingOrAdmin
  );

  const settleMutation = useSettleVendorDebt();
  const deleteMutation = useDeleteVendorDebtSettlement();
  const createOtherCostMutation = useCreateVendorOtherCost();
  const deleteOtherCostMutation = useDeleteVendorOtherCost();

  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleNote, setSettleNote] = useState<string>("");
  const [allowAdvance, setAllowAdvance] = useState(true);
  const [settleDate, setSettleDate] = useState<string>(todayStr);

  const [isOtherCostOpen, setIsOtherCostOpen] = useState(false);
  const [otherCostAmount, setOtherCostAmount] = useState<string>("");
  const [otherCostNote, setOtherCostNote] = useState<string>("");
  const [otherCostDate, setOtherCostDate] = useState<string>(todayStr);

  const summary = apSummaryData?.items?.find(item => item.vendorId === vendor.id);
  const outstandingInvoices = apDetailData?.items || [];
  const settlements = settlementsData || [];
  const otherCosts = otherCostsData || [];

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleNote.trim()) {
      toast.error("Vui lòng nhập lý do tất toán");
      return;
    }

    const amountVal = settleAmount === "" ? null : parseFloat(settleAmount);
    if (amountVal !== null && (isNaN(amountVal) || amountVal < 0)) {
      toast.error("Số tiền tất toán phải lớn hơn hoặc bằng 0");
      return;
    }

    // Chặn ngày tương lai ở client side
    if (settleDate && new Date(settleDate) > new Date()) {
      toast.error("Ngày tất toán không được ở tương lai");
      return;
    }

    settleMutation.mutate(
      {
        id: vendor.id,
        data: {
          amount: amountVal,
          note: settleNote.trim(),
          allowAdvance,
          settledAt: settleDate ? new Date(`${settleDate}T12:00:00`).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          setIsSettleOpen(false);
          setSettleAmount("");
          setSettleNote("");
          setAllowAdvance(true);
          setSettleDate(todayStr);
        },
      }
    );
  };

  const handleDeleteSettlement = (historyId: number) => {
    if (!confirm("Bạn có chắc chắn muốn hoàn tác lần tất toán công nợ này? Dư nợ của nhà cung cấp sẽ được khôi phục.")) {
      return;
    }

    deleteMutation.mutate({
      historyId,
      vendorId: vendor.id,
    });
  };

  const handleOtherCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(otherCostAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Số tiền chi phí khác phải lớn hơn 0");
      return;
    }
    if (!otherCostNote.trim()) {
      toast.error("Phải nhập diễn giải chi phí khác");
      return;
    }
    if (otherCostDate && new Date(otherCostDate) > new Date()) {
      toast.error("Ngày ghi nhận không được ở tương lai");
      return;
    }

    createOtherCostMutation.mutate(
      {
        vendorId: vendor.id,
        data: {
          amount: amountVal,
          note: otherCostNote.trim(),
          recordedAt: otherCostDate ? new Date(`${otherCostDate}T12:00:00`).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          setIsOtherCostOpen(false);
          setOtherCostAmount("");
          setOtherCostNote("");
          setOtherCostDate(todayStr);
        },
      }
    );
  };

  const handleDeleteOtherCost = (historyId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khoản chi phí khác này? Công nợ nhà cung cấp sẽ được trừ lại.")) {
      return;
    }

    deleteOtherCostMutation.mutate({
      historyId,
      vendorId: vendor.id,
    });
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-auto pr-2">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Tổng quan công nợ</h2>
        <div className="flex items-center gap-2">
          {isAccountingOrAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOtherCostOpen(true)}
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Ghi nhận chi phí khác
            </Button>
          )}
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setIsSettleOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Tất toán ngoài hệ thống
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards from APUnifiedPage style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
              Dư đầu kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            {isLoadingSummary ? <Skeleton className="h-6 w-20" /> : (
              <div className="text-base font-bold text-blue-700">
                {formatCurrency(summary?.openingBalance ?? 0)} ₫
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-100 bg-orange-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] font-medium text-orange-600 uppercase tracking-wider">
              Phát sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
             {isLoadingSummary ? <Skeleton className="h-6 w-20" /> : (
              <div className="text-base font-bold text-orange-700">
                {formatCurrency(summary?.increase ?? 0)} ₫
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-100 bg-green-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] font-medium text-green-600 uppercase tracking-wider">
              Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
             {isLoadingSummary ? <Skeleton className="h-6 w-20" /> : (
              <div className="text-base font-bold text-green-700">
                {formatCurrency(summary?.decrease ?? 0)} ₫
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 bg-slate-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
              Dư cuối kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
             {isLoadingSummary ? <Skeleton className="h-6 w-20" /> : (
              <div className="text-base font-bold text-slate-900">
                {formatCurrency(summary?.closingBalance ?? 0)} ₫
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-100 bg-red-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] font-medium text-red-600 uppercase tracking-wider">
              Quá hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
             {isLoadingSummary ? <Skeleton className="h-6 w-20" /> : (
              <div className="text-base font-bold text-red-700">
                {formatCurrency(summary?.overdue ?? 0)} ₫
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Outstanding Invoices Table from APUnifiedPage */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
          <Calendar className="h-4 w-4" />
          Hóa đơn còn nợ (Outstanding Invoices)
        </h3>
        <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Số chứng từ / Loại</TableHead>
                <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground">Ngày CT</TableHead>
                <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground">Hạn trả</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Số tiền mua</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Đã trả</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Còn nợ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDetail ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : outstandingInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    Không có hóa đơn còn nợ
                  </TableCell>
                </TableRow>
              ) : (
                outstandingInvoices.map((detail, index) => (
                  <TableRow key={detail.documentId || index} className="hover:bg-muted/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-primary/80">{detail.documentNumber || "—"}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{detail.documentType || "Hóa đơn"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium">
                      {detail.documentDate ? formatDate(detail.documentDate) : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium">
                      {detail.dueDate ? formatDate(detail.dueDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-xs">
                      {detail.amountDue !== undefined ? formatCurrency(detail.amountDue) : "—"} ₫
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-xs text-green-600">
                      {detail.amountPaid !== undefined ? formatCurrency(detail.amountPaid) : "—"} ₫
                    </TableCell>
                    <TableCell className="text-right">
                      {detail.outstanding !== undefined && detail.outstanding > 0 ? (
                        <Badge variant="outline" className="text-[10px] h-5 bg-background font-bold border-red-200 text-red-600">
                          {formatCurrency(detail.outstanding)} ₫
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Lịch sử chi phí khác của NCC (Admin & Kế toán) */}
      {isAccountingOrAdmin && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
            <Receipt className="h-4 w-4 text-indigo-600" />
            Lịch sử chi phí khác (Other Costs)
          </h3>
          <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Ngày ghi nhận</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Loại giao dịch</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Số tiền</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Nợ trước đó</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Nợ sau khi tăng</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Người thực hiện</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Diễn giải</TableHead>
                  <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground w-[80px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOtherCosts ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : otherCosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic text-xs">
                      Chưa có khoản chi phí khác nào được ghi nhận cho nhà cung cấp này
                    </TableCell>
                  </TableRow>
                ) : (
                  otherCosts.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/5 text-xs">
                      <TableCell className="font-medium text-slate-600">
                        {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 font-medium">
                          {item.changeTypeDisplay || "Chi phí khác"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 tabular-nums">
                        +{formatCurrency(Math.abs(item.changeAmount ?? 0))} ₫
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600">
                        {item.previousDebt !== undefined ? formatCurrency(item.previousDebt) : "—"} ₫
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-slate-800">
                        {item.newDebt !== undefined ? formatCurrency(item.newDebt) : "—"} ₫
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {item.createdByName || "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-700 font-medium" title={item.note || ""}>
                        {item.note || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOtherCost(item.id)}
                          disabled={deleteOtherCostMutation.isPending}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Xóa khoản chi phí khác"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Lịch sử tất toán ngoài hệ thống (Chỉ hiển thị cho Admin) */}
      {isAdmin && (
        <div className="space-y-4 mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
            <History className="h-4 w-4" />
            Lịch sử tất toán công nợ (Ngoài hệ thống)
          </h3>
          <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Ngày tất toán</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Loại giao dịch</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Số tiền tất toán</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Nợ trước đó</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">Nợ sau khi giảm</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Người thực hiện</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-muted-foreground">Ghi chú</TableHead>
                  <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground w-[80px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSettlements ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic text-xs">
                      Chưa có lịch sử tất toán ngoài hệ thống cho đối tác này
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/5 text-xs">
                      <TableCell className="font-medium text-slate-600">
                        {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {item.changeTypeDisplay || (item.changeType === "Settlement" ? "Tất toán công nợ (ngoài hệ thống)" : item.changeType)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 tabular-nums">
                        {item.changeAmount !== undefined ? `-${formatCurrency(Math.abs(item.changeAmount))}` : "—"} ₫
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600">
                        {item.previousDebt !== undefined ? formatCurrency(item.previousDebt) : "—"} ₫
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-slate-800">
                        {item.newDebt !== undefined ? formatCurrency(item.newDebt) : "—"} ₫
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {item.createdByName || "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-500" title={item.note || ""}>
                        {item.note || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSettlement(item.id)}
                          disabled={deleteMutation.isPending}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hoàn tác tất toán"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialog Settle Debt */}
      <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <form onSubmit={handleSettleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Tất toán công nợ ngoài hệ thống
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Hành động này giúp giảm trừ trực tiếp công nợ NCC **{vendor.name}** mà không phát sinh phiếu chi trên hệ thống.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
                  Số tiền tất toán
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Để trống để tất toán toàn bộ dư nợ"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="h-9 border-slate-200"
                />
                <span className="text-[10px] text-muted-foreground italic">
                  Dư nợ hiện tại: {formatCurrency(vendor.currentDebt ?? 0)} ₫
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date" className="text-xs font-semibold text-slate-700">
                  Ngày ghi nhận
                </Label>
                <Input
                  id="date"
                  type="date"
                  max={todayStr}
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="h-9 border-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-2.5 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label htmlFor="allowAdvance" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Cho phép số dư âm
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Cho phép tất toán vượt quá số nợ hiện tại.
                  </p>
                </div>
                <Switch
                  id="allowAdvance"
                  checked={allowAdvance}
                  onCheckedChange={setAllowAdvance}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note" className="text-xs font-semibold text-slate-700">
                  Lý do tất toán <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="note"
                  placeholder="Nhập lý do tất toán công nợ..."
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="min-h-[80px] text-xs border-slate-200"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettleOpen(false)}
                disabled={settleMutation.isPending}
                className="h-9"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={settleMutation.isPending}
                className="h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {settleMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Other Cost */}
      <Dialog open={isOtherCostOpen} onOpenChange={setIsOtherCostOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <form onSubmit={handleOtherCostSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Ghi nhận chi phí khác vào công nợ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Ghi nhận phụ phí, vận chuyển hoặc chi phí phát sinh khác trực tiếp vào công nợ nhà cung cấp **{vendor.name}**.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="otherCostAmount" className="text-xs font-semibold text-slate-700">
                  Số tiền chi phí <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="otherCostAmount"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Nhập số tiền chi phí phát sinh (> 0)"
                  value={otherCostAmount}
                  onChange={(e) => setOtherCostAmount(e.target.value)}
                  className="h-9 border-slate-200"
                  required
                />
                <span className="text-[10px] text-muted-foreground italic">
                  Dư nợ hiện tại: {formatCurrency(vendor.currentDebt ?? 0)} ₫
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="otherCostDate" className="text-xs font-semibold text-slate-700">
                  Ngày ghi nhận
                </Label>
                <Input
                  id="otherCostDate"
                  type="date"
                  max={todayStr}
                  value={otherCostDate}
                  onChange={(e) => setOtherCostDate(e.target.value)}
                  className="h-9 border-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="otherCostNote" className="text-xs font-semibold text-slate-700">
                  Diễn giải chi phí <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="otherCostNote"
                  placeholder="Ví dụ: Phí vận chuyển đợt 1, công thợ sửa chữa..."
                  value={otherCostNote}
                  onChange={(e) => setOtherCostNote(e.target.value)}
                  className="min-h-[80px] text-xs border-slate-200"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOtherCostOpen(false)}
                disabled={createOtherCostMutation.isPending}
                className="h-9"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createOtherCostMutation.isPending}
                className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {createOtherCostMutation.isPending ? "Đang lưu..." : "Lưu chi phí"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
