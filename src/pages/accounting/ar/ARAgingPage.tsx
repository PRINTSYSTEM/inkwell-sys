import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useARAging, useExportARAging } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";

export default function ARAgingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: arData,
    isLoading,
    isError,
    error,
    refetch,
  } = useARAging({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    asOfDate: asOfDate ? format(new Date(asOfDate), "yyyy-MM-dd") : undefined,
    searchTerm: searchQuery || undefined,
  });

  const { mutate: exportAging, loading: isExporting } = useExportARAging();

  const totalCurrent = arData?.items?.reduce((sum, item) => sum + (item.notDue || 0), 0) || 0;
  const totalDays30 = arData?.items?.reduce((sum, item) => sum + (item.days0_30 || 0), 0) || 0;
  const totalDays60 = arData?.items?.reduce((sum, item) => sum + (item.days31_60 || 0), 0) || 0;
  const totalDays90 = arData?.items?.reduce((sum, item) => sum + (item.days61_90 || 0), 0) || 0;
  const totalOver90 = arData?.items?.reduce((sum, item) => sum + (item.daysOver90 || 0), 0) || 0;
  const grandTotal = arData?.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

  const handleExportExcel = async () => {
    await exportAging({
      asOfDate: asOfDate ? format(new Date(asOfDate), "yyyy-MM-dd") : undefined,
      searchTerm: searchQuery || undefined,
    });
  };

  const handleCustomerClick = (customerId: number | null | undefined) => {
    if (customerId) {
      navigate(`/accounting/ar?tab=summary&customerId=${customerId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9">
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Làm mới
        </Button>
        <Button variant="default" size="sm" onClick={handleExportExcel} className="h-9" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Xuất Excel
        </Button>
      </div>

      {/* Error Alert */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Không thể tải dữ liệu."}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mã, tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="asOfDate" className="whitespace-nowrap text-sm font-medium">
            Tính đến ngày:
          </Label>
          <Input
            id="asOfDate"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Hiện tại", value: totalCurrent, color: "text-slate-900" },
          { label: "1-30 ngày", value: totalDays30, color: "text-blue-600" },
          { label: "31-60 ngày", value: totalDays60, color: "text-orange-500" },
          { label: "61-90 ngày", value: totalDays90, color: "text-red-500" },
          { label: "> 90 ngày", value: totalOver90, color: "text-red-700" },
          { label: "Tổng cộng", value: grandTotal, color: "text-slate-900 font-black" },
        ].map((card, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className={cn("text-base font-bold tabular-nums", card.color)}>
                {formatCurrency(card.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border shadow-sm bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px] font-bold text-xs">Mã KH</TableHead>
                <TableHead className="font-bold text-xs">Tên khách hàng</TableHead>
                <TableHead className="text-right font-bold text-xs">Hiện tại</TableHead>
                <TableHead className="text-right font-bold text-xs">1-30 ngày</TableHead>
                <TableHead className="text-right font-bold text-xs">31-60 ngày</TableHead>
                <TableHead className="text-right font-bold text-xs">61-90 ngày</TableHead>
                <TableHead className="text-right font-bold text-xs">{"> 90 ngày"}</TableHead>
                <TableHead className="text-right font-bold text-xs">Tổng cộng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : arData?.items?.map((item) => (
                <TableRow
                  key={item.customerId}
                  className="cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleCustomerClick(item.customerId)}
                >
                  <TableCell className="font-mono text-xs">{item.customerCode || "—"}</TableCell>
                  <TableCell className="font-semibold text-sm">{item.customerName || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatCurrency(item.notDue || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatCurrency(item.days0_30 || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-orange-600">{formatCurrency(item.days31_60 || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-red-500">{formatCurrency(item.days61_90 || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-red-700 font-bold">{formatCurrency(item.daysOver90 || 0)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-sm">{formatCurrency(item.total || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {arData && arData.totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Trang {currentPage} / {arData.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.min(arData.totalPages, p + 1))}
                disabled={currentPage === arData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


