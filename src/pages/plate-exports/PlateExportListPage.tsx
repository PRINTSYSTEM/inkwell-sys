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
    <div className="h-auto flex flex-col bg-background overflow-hidden">
      <Helmet>
        <title>Danh sách xuất kẽm</title>
        <meta
          name="description"
          content="Màn hình quản lý danh sách xuất kẽm: tra cứu, lọc và theo dõi tình trạng xuất kẽm."
        />
      </Helmet>

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-2 pb-1.5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Package className="h-4 w-4 text-primary" />
              Danh sách xuất kẽm
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Theo dõi danh sách xuất kẽm, nhà cung cấp và tình trạng nhận kẽm.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={isFetching}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Stats - Compact */}
      <div className="flex-shrink-0 px-6 pb-1.5">
        <div className="grid gap-1.5 grid-cols-3">
          <Card className="py-1">
            <CardContent className="p-1.5 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground">Tổng số</p>
                <p className="text-sm font-bold">{totalCount}</p>
              </div>
              <Package className="h-3.5 w-3.5 text-primary" />
            </CardContent>
          </Card>
          <Card className="py-1">
            <CardContent className="p-1.5 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground">
                  Đang hoạt động
                </p>
                <p className="text-sm font-bold">
                  {plateExports.filter((p) => p.isActive).length}
                </p>
              </div>
              <Package className="h-3.5 w-3.5 text-emerald-500" />
            </CardContent>
          </Card>
          <Card className="py-1">
            <CardContent className="p-1.5 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground">Đã nhận kẽm</p>
                <p className="text-sm font-bold">
                  {plateExports.filter((p) => p.receivedAt).length}
                </p>
              </div>
              <Package className="h-3.5 w-3.5 text-blue-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters - Compact */}
      <div className="flex-shrink-0 px-6 pb-1.5">
        <Card className="py-1">
          <CardContent className="p-1.5">
            <div className="flex flex-col md:flex-row gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã bài, nhà cung cấp..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-6 h-7 text-xs"
                />
              </div>
              <div className="w-full md:w-[200px]">
                <Select
                  value={vendorId?.toString() || "all"}
                  onValueChange={(value) => {
                    setVendorId(value === "all" ? null : Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
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
              <div className="w-full md:w-[160px]">
                <Input
                  type="date"
                  placeholder="Từ ngày"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div className="w-full md:w-[160px]">
                <Input
                  type="date"
                  placeholder="Đến ngày"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table - Flexible height */}
      <div
        ref={tableContainerRef}
        className="flex-1 min-h-0 px-6 pb-2 overflow-hidden flex flex-col"
      >
        <Card className="h-auto flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 pb-0.5 px-2 pt-1">
            <CardTitle className="text-[9px] font-semibold">
              Danh sách xuất kẽm
            </CardTitle>
          </CardHeader>
          <CardContent className="h-auto overflow-hidden flex flex-col p-0">
            {isLoading ? (
              <div className="p-2 space-y-0.5">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : plateExports.length === 0 ? (
              <div className="flex items-center justify-center text-center py-6 text-muted-foreground">
                <div>
                  <Package className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                  <p className="text-[10px] font-medium">
                    Không có dữ liệu xuất kẽm
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-auto flex flex-col overflow-hidden">
                <div className="h-auto overflow-visible">
                  <div className="rounded-md border">
                    <Table ref={tableRef}>
                      <TableHeader className="sticky top-0 bg-muted/50 z-10">
                        <TableRow className="bg-muted/30 h-10">
                          <TableHead className="w-[140px] font-bold text-sm py-2 px-2.5">
                            Mã bài
                          </TableHead>
                          <TableHead className="w-[180px] font-bold text-sm py-2 px-2.5">
                            Nhà cung cấp
                          </TableHead>
                          <TableHead className="text-center w-[100px] font-bold text-sm py-2 px-2.5">
                            Số lượng kẽm
                          </TableHead>
                          <TableHead className="text-center w-[140px] font-bold text-sm py-2 px-2.5">
                            Trạng thái
                          </TableHead>
                          <TableHead className="w-[140px] font-bold text-sm py-2 px-2.5">
                            Ngày gửi
                          </TableHead>
                          <TableHead className="w-[140px] font-bold text-sm py-2 px-2.5">
                            Ngày nhận dự kiến
                          </TableHead>
                          <TableHead className="w-[140px] font-bold text-sm py-2 px-2.5">
                            Ngày nhận
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plateExports.map((plateExport, index) => (
                          <TableRow
                            key={plateExport.id}
                            ref={index === 0 ? firstRowRef : null}
                            className="cursor-pointer hover:bg-muted/50 transition-colors h-10"
                            onClick={() => handleViewDetail(plateExport.id)}
                          >
                            <TableCell className="font-bold text-sm py-2 px-2.5">
                              {plateExport.proofingOrderCode || "—"}
                            </TableCell>
                            <TableCell className="py-2 px-2.5">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="font-bold text-sm">
                                  {plateExport.vendorName ||
                                    plateExport.plateVendor?.name ||
                                    "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-sm py-2 px-2.5">
                              {plateExport.plateCount ?? "—"}
                            </TableCell>
                            <TableCell className="text-center py-2 px-2.5">
                              <Badge
                                variant={
                                  plateExport.isActive ? "default" : "secondary"
                                }
                                className="font-bold text-xs px-2 py-0.5"
                              >
                                {plateExport.isActive
                                  ? "Đang hoạt động"
                                  : "Không hoạt động"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-sm py-2 px-2.5">
                              {formatDate(plateExport.sentAt)}
                            </TableCell>
                            <TableCell className="font-bold text-sm py-2 px-2.5">
                              {formatDate(plateExport.estimatedReceiveAt)}
                            </TableCell>
                            <TableCell className="py-2 px-2.5">
                              {plateExport.receivedAt ? (
                                <span className="text-emerald-600 font-bold text-sm">
                                  {formatDate(plateExport.receivedAt)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-bold text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex-shrink-0 flex items-center justify-between px-2 py-1 border-t">
                    <p className="text-[9px] text-muted-foreground font-bold">
                      Trang {page} / {totalPages} ({totalCount} kết quả)
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isFetching}
                        className="h-5 text-[9px] px-1.5"
                      >
                        <ChevronLeft className="h-2.5 w-2.5 mr-0.5" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages || isFetching}
                        className="h-5 text-[9px] px-1.5"
                      >
                        Sau
                        <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
