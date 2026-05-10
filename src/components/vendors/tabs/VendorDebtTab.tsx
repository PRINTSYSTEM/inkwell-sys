import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { VendorResponse } from "@/Schema";
import { useAPSummary, useAPDetail } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

export function VendorDebtTab({ vendor }: VendorDebtTabProps) {
  const { data: apSummaryData, isLoading: isLoadingSummary } = useAPSummary({
    searchTerm: vendor.code || vendor.name,
  });

  const { data: apDetailData, isLoading: isLoadingDetail } = useAPDetail({
    vendorId: vendor.id,
    pageSize: 50,
  });

  const summary = apSummaryData?.items?.find(item => item.vendorId === vendor.id);
  const outstandingInvoices = apDetailData?.items || [];

  return (
    <div className="h-full flex flex-col gap-6 overflow-auto pr-2">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Tổng quan công nợ</h2>
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
      <div className="space-y-4 mb-4">
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
    </div>
  );
}
