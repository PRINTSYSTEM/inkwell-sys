import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Package,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlateExports } from "@/hooks/use-plate-export";
import { useVendors } from "@/hooks/use-vendor";
import type { PlateExportResponse, PlateExportListParams } from "@/Schema";

export default function PlateExportListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Refs for height measurement
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const firstRowRef = useRef<HTMLTableRowElement>(null);

  // Convert date inputs to ISO datetime strings
  // Use empty string instead of undefined for string params
  const fromDateISO = fromDate
    ? new Date(`${fromDate}T00:00:00`).toISOString()
    : "";
  const toDateISO = toDate ? new Date(`${toDate}T23:59:59`).toISOString() : "";

  const params: PlateExportListParams = {
    pageNumber: page,
    pageSize,
    search: searchTerm || "",
    vendorId: vendorId || undefined, // number params can use undefined
    fromDate: fromDateISO || "", // Use empty string instead of undefined
    toDate: toDateISO || "", // Use empty string instead of undefined
  };

  const { data, isLoading, isFetching, refetch } = usePlateExports(params);
  const { data: vendorsData } = useVendors();

  const plateExports: PlateExportResponse[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  // #region agent log
  useEffect(() => {
    if (
      tableContainerRef.current &&
      tableRef.current &&
      firstRowRef.current &&
      plateExports.length > 0
    ) {
      const containerHeight = tableContainerRef.current.offsetHeight;
      const tableHeight = tableRef.current.offsetHeight;
      const rowHeight = firstRowRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const headerHeight =
        tableContainerRef.current
          .querySelector("thead")
          ?.getBoundingClientRect().height || 0;
      const totalRowsHeight = rowHeight * plateExports.length;
      const cardElement = tableContainerRef.current.querySelector(".h-auto");
      const cardHeight = cardElement?.getBoundingClientRect().height || 0;

      fetch(
        "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "PlateExportListPage.tsx:measure-heights",
            message: "Table height measurements after fix",
            data: {
              containerHeight,
              tableHeight,
              rowHeight,
              viewportHeight,
              headerHeight,
              totalRowsHeight,
              rowCount: plateExports.length,
              pageSize,
              cardHeight,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "post-fix",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
    }
  }, [plateExports.length, pageSize]);
  // #endregion

  const handleResetFilters = () => {
    setSearchTerm("");
    setVendorId(null);
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleViewDetail = (id: number | undefined) => {
    if (id) {
      navigate(`/plate-exports/${id}`);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return "—";
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 space-y-6">
      <Helmet>
        <title>Danh sách xuất kẽm</title>
        <meta
          name="description"
          content="Màn hình quản lý danh sách xuất kẽm: tra cứu, lọc và theo dõi tình trạng xuất kẽm."
        />
        <link rel="canonical" href="/plate-exports" />
      </Helmet>

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <Package className="h-7 w-7 text-primary" />
            Danh sách xuất kẽm
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi danh sách xuất kẽm, nhà cung cấp và tình trạng nhận kẽm.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            disabled={isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng số lệnh xuất kẽm</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Đang hoạt động
              </p>
              <p className="text-2xl font-bold">
                {plateExports.filter((p) => p.isActive).length}
              </p>
            </div>
            <Package className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã nhận kẽm</p>
              <p className="text-2xl font-bold">
                {plateExports.filter((p) => p.receivedAt).length}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bộ lọc xuất kẽm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã bài, nhà cung cấp..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <div className="w-full md:w-[240px]">
                <Select
                  value={vendorId?.toString() || "all"}
                  onValueChange={(value) => {
                    setVendorId(value === "all" ? null : Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                    {vendorsData?.items?.map((vendor) => (
                      <SelectItem
                        key={vendor.id}
                        value={vendor.id?.toString() || ""}
                      >
                        {vendor.name || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[180px]">
                <Input
                  type="date"
                  placeholder="Từ ngày"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="w-full md:w-[180px]">
                <Input
                  type="date"
                  placeholder="Đến ngày"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách xuất kẽm</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : plateExports.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">Không có dữ liệu xuất kẽm</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table ref={tableRef}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Mã bài</TableHead>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead className="text-center">Số lượng kẽm</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                        <TableHead>Ngày gửi</TableHead>
                        <TableHead>Ngày nhận dự kiến</TableHead>
                        <TableHead>Ngày nhận thực tế</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plateExports.map((plateExport, index) => (
                        <TableRow
                          key={plateExport.id}
                          ref={index === 0 ? firstRowRef : null}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleViewDetail(plateExport.id)}
                        >
                          <TableCell className="font-medium">
                            {plateExport.proofingOrderCode || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span>
                                {plateExport.vendorName ||
                                  plateExport.plateVendor?.name ||
                                  "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {plateExport.plateCount ?? "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={plateExport.isActive ? "default" : "secondary"}
                            >
                              {plateExport.isActive ? "Đang hoạt động" : "Không hoạt động"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(plateExport.sentAt)}</TableCell>
                          <TableCell>
                            {formatDate(plateExport.estimatedReceiveAt)}
                          </TableCell>
                          <TableCell>
                            {plateExport.receivedAt ? (
                              <span className="text-emerald-600 font-medium">
                                {formatDate(plateExport.receivedAt)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Trang {page} / {totalPages} ({totalCount} kết quả)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isFetching}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
