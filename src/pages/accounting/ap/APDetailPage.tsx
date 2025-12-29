import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

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
import { Badge } from "@/components/ui/badge";
import { useAPDetail } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { useNavigate } from "react-router-dom";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function APDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get("vendorId")
    ? Number(searchParams.get("vendorId"))
    : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: apData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAPDetail({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    vendorId: vendorId,
    search: searchQuery || undefined,
  });

  return (
    <>
      <Helmet>
        <title>Công nợ phải trả - Chi tiết | Print Production ERP</title>
        <meta
          name="description"
          content="Chi tiết công nợ phải trả"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/accounting/ap/summary")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Công nợ phải trả - Chi tiết
              </h1>
              <p className="text-muted-foreground">
                Chi tiết công nợ phải trả theo từng giao dịch
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đơn, mã hóa đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã NCC</TableHead>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead className="w-[140px]">Mã đơn</TableHead>
                <TableHead className="w-[140px]">Mã HĐ</TableHead>
                <TableHead className="text-center">Ngày HĐ</TableHead>
                <TableHead className="text-center">Hạn thanh toán</TableHead>
                <TableHead className="text-right">Số tiền HĐ</TableHead>
                <TableHead className="text-right">Đã thanh toán</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !apData?.items || apData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu công nợ nào.
                  </TableCell>
                </TableRow>
              ) : (
                apData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.vendorCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.vendorName || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.orderCode || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.invoiceNumber || "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {item.invoiceDate ? formatDate(item.invoiceDate) : "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {item.dueDate ? formatDate(item.dueDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.invoiceAmount !== undefined
                        ? formatCurrency(item.invoiceAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-green-600">
                      {item.paidAmount !== undefined
                        ? formatCurrency(item.paidAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.remainingAmount !== undefined
                        ? formatCurrency(item.remainingAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isOverdue ? (
                        <Badge variant="destructive">
                          Quá hạn {item.daysOverdue} ngày
                        </Badge>
                      ) : (
                        <Badge variant="default">Bình thường</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {apData && apData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {apData.totalPages} (
              {apData.total} giao dịch)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <RefreshCw className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {apData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(apData.totalPages, p + 1))
                }
                disabled={currentPage === apData.totalPages || isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

