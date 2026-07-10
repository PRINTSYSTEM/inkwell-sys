import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Package,
  Search,
  Building2,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { usePlateExports } from "@/hooks/use-plate-export";
import { useActivePlateVendors, useActivePrintingVendors } from "@/hooks/use-vendor";
import { useAuth } from "@/hooks/use-auth";
import type { PlateExportResponse, PlateExportListParams } from "@/Schema";
import { formatCurrency } from "@/lib/status-utils";
import { cn } from "@/lib/utils";

export default function PlateExportListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isOutsource = searchParams.get("type") === "outsource";
  const title = isOutsource ? "Quản lý in gia công" : "Quản lý bản kẽm";

  const canViewPrice = useMemo(() => {
    return !!user?.role && ["admin", "sale", "manager", "accounting", "accounting_lead"].includes(user.role);
  }, [user]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setPage(1);
    setVendorId(null);
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  }, [isOutsource]);

  const fromDateISO = fromDate
    ? new Date(`${fromDate}T00:00:00`).toISOString()
    : "";
  const toDateISO = toDate ? new Date(`${toDate}T23:59:59`).toISOString() : "";

  const params: PlateExportListParams = {
    pageNumber: 1,
    pageSize: 1000,
    search: searchTerm || "",
    vendorId: isOutsource ? undefined : (vendorId || undefined),
    fromDate: fromDateISO || "",
    toDate: toDateISO || "",
  };

  const { data, isLoading, isFetching, refetch } = usePlateExports(params);
  const { data: plateVendors } = useActivePlateVendors();
  const { data: printingVendors } = useActivePrintingVendors();

  const vendors = isOutsource ? printingVendors : plateVendors;

  const plateExportsRaw: PlateExportResponse[] = data?.items ?? [];

  const statsList = useMemo(() => {
    let filtered = plateExportsRaw;
    if (isOutsource) {
      filtered = filtered.filter((p) => p.productionMethod === "outsource");
      if (vendorId) {
        filtered = filtered.filter(
          (p) => p.printingVendorId === vendorId || p.printingVendor?.id === vendorId
        );
      }
    }
    return filtered;
  }, [plateExportsRaw, isOutsource, vendorId]);

  const displayedPlateExports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return statsList.slice(start, start + pageSize);
  }, [statsList, page, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(statsList.length / pageSize) || 1;
  }, [statsList.length, pageSize]);

  const totalCount = useMemo(() => {
    return statsList.length;
  }, [statsList.length]);

  const receivedCount = useMemo(() => {
    return statsList.filter((p) => {
      return isOutsource ? !!p.completedAt : !!p.receivedAt;
    }).length;
  }, [statsList, isOutsource]);

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
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-4">
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content={`Màn hình quản lý ${title.toLowerCase()}: tra cứu, lọc và theo dõi tình trạng.`}
        />
        <link rel="canonical" href="/plate-exports" />
      </Helmet>

      {/* Header & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 shrink-0 text-slate-900">
            <Package className="h-5 w-5 text-primary" />
            {title}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-slate-900 text-white px-3 py-1">
              Tổng lệnh
              <span className="ml-2 text-sm font-bold">{totalCount}</span>
            </Badge>

            <Badge className="bg-amber-600 text-white px-3 py-1">
              {isOutsource ? "Chờ in" : "Chờ kẽm"}
              <span className="ml-2 text-sm font-bold">{totalCount - receivedCount}</span>
            </Badge>

            <Badge className="bg-emerald-600 text-white px-3 py-1">
              {isOutsource ? "Đã in xong" : "Đã nhận kẽm"}
              <span className="ml-2 text-sm font-bold">{receivedCount}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isOutsource ? "Tìm theo mã bài, nhà in..." : "Tìm theo mã bài, nhà cung cấp..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <Select
              value={vendorId?.toString() || "all"}
              onValueChange={(value) => {
                setVendorId(value === "all" ? null : Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px] h-9 text-sm bg-muted/50 border-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder={isOutsource ? "Nhà in" : "Nhà cung cấp"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isOutsource ? "Tất cả nhà in" : "Tất cả nhà cung cấp"}
                </SelectItem>
                {vendors?.map((vendor) => (
                  <SelectItem
                    key={vendor.id}
                    value={vendor.id?.toString() || ""}
                  >
                    {vendor.name || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 h-9">
              <span className="text-xs text-muted-foreground font-medium">Từ</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-7 border-0 bg-transparent shadow-none p-0 text-sm focus-visible:ring-0 w-[120px]"
              />
              <span className="text-xs text-muted-foreground font-medium">Đến</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-7 border-0 bg-transparent shadow-none p-0 text-sm focus-visible:ring-0 w-[120px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={isFetching}
              className="h-9 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-all font-medium flex items-center gap-1.5 px-3"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="ml-3 text-slate-500">Đang tải...</span>
            </div>
          ) : displayedPlateExports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">Không có dữ liệu {title.toLowerCase()}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[140px] h-9 px-3 text-xs font-semibold text-slate-700">Mã bài</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">{isOutsource ? "Nhà in" : "Nhà cung cấp"}</TableHead>
                      <TableHead className="h-9 px-3 text-center text-xs font-semibold text-slate-700">Số lượng kẽm</TableHead>
                      {canViewPrice && (
                        <TableHead className="h-9 px-3 text-right text-xs font-semibold text-slate-700">Tổng tiền</TableHead>
                      )}
                      <TableHead className="h-9 px-3 text-center text-xs font-semibold text-slate-700">Trạng thái</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">Ngày gửi</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">Ngày nhận dự kiến</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPlateExports.map((plateExport) => {
                      const isDone = isOutsource
                        ? !!plateExport.completedAt
                        : !!plateExport.receivedAt;

                      return (
                        <TableRow
                          key={plateExport.id}
                          className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-slate-100"
                          onClick={() => handleViewDetail(plateExport.id)}
                        >
                          <TableCell className="py-1 px-3 font-medium font-mono text-xs">
                            {plateExport.proofingOrderCode || "—"}
                          </TableCell>
                          <TableCell className="py-1 px-3">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs">
                                {isOutsource
                                  ? (plateExport.printingVendorName || plateExport.printingVendor?.name || "—")
                                  : (plateExport.vendorName || plateExport.plateVendor?.name || "—")
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-3 text-center font-medium text-xs">
                            {plateExport.plateCount ?? "—"}
                          </TableCell>
                          {canViewPrice && (
                            <TableCell className="py-1 px-3 text-right font-medium text-primary text-xs">
                              {isOutsource
                                ? (plateExport.outsourceCost ? formatCurrency(plateExport.outsourceCost) : "—")
                                : (plateExport.totalPrice ? formatCurrency(plateExport.totalPrice) : "—")
                              }
                            </TableCell>
                          )}
                          <TableCell className="py-1 px-3 text-center">
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0 border font-semibold",
                                isDone
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50/80"
                                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50/80"
                              )}
                            >
                              {isOutsource
                                ? (isDone ? "Đã in xong" : "Chờ in")
                                : (isDone ? "Đã nhận kẽm" : "Chờ kẽm")
                              }
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 px-3 text-xs text-slate-600">{formatDate(plateExport.sentAt)}</TableCell>
                          <TableCell className="py-1 px-3 text-xs text-slate-600">
                            {formatDate(plateExport.estimatedReceiveAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/60">
                <span className="text-sm text-slate-500">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                  <span className="ml-2 text-muted-foreground">({totalCount} kết quả)</span>
                </span>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
