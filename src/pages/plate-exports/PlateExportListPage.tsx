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
import type { PlateExportResponse, PlateExportListParams } from "@/Schema";
import { formatCurrency } from "@/lib/status-utils";

export default function PlateExportListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOutsource = searchParams.get("type") === "outsource";
  const title = isOutsource ? "Quản lý in gia công" : "Quản lý bản kẽm";

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showInHouse, setShowInHouse] = useState(false);

  useEffect(() => {
    setPage(1);
    setVendorId(null);
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setShowInHouse(false);
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
    } else {
      if (!showInHouse) {
        filtered = filtered.filter((p) => p.productionMethod === "outsource");
      }
    }
    return filtered;
  }, [plateExportsRaw, isOutsource, vendorId, showInHouse]);

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

  const handleResetFilters = () => {
    setSearchTerm("");
    setVendorId(null);
    setFromDate("");
    setToDate("");
    setPage(1);
    setShowInHouse(false);
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
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 -mt-4 space-y-4">
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content={`Màn hình quản lý ${title.toLowerCase()}: tra cứu, lọc và theo dõi tình trạng.`}
        />
        <link rel="canonical" href="/plate-exports" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách {title.toLowerCase()}, nhà cung cấp và tình trạng.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Tổng lệnh
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none">
                {totalCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Đang hoạt động
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-emerald-600">
                {statsList.filter((p) => p.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                {isOutsource ? "Đã nhận hàng" : "Đã nhận kẽm"}
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-blue-600">
                {statsList.filter((p) => p.receivedAt).length}
              </p>
            </div>
          </CardContent>
        </Card>
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
            {!isOutsource && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 h-9">
                <Checkbox
                  id="show-in-house"
                  checked={showInHouse}
                  onCheckedChange={(checked) => {
                    setShowInHouse(!!checked);
                    setPage(1);
                  }}
                  className="data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="show-in-house"
                  className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                >
                  Hiện cả in tại xưởng
                </label>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={isFetching}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
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
                      <TableHead className="w-[140px] font-semibold text-slate-700">Mã bài</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nhà cung cấp</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Số lượng kẽm</TableHead>
                      <TableHead className="font-semibold text-slate-700">Hình thức in</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-slate-700">Ngày gửi</TableHead>
                      <TableHead className="font-semibold text-slate-700">Ngày nhận dự kiến</TableHead>
                      <TableHead className="font-semibold text-slate-700">Ngày nhận thực tế</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPlateExports.map((plateExport) => (
                      <TableRow
                        key={plateExport.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-slate-100"
                        onClick={() => handleViewDetail(plateExport.id)}
                      >
                        <TableCell className="font-medium font-mono text-sm">
                          {plateExport.proofingOrderCode || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm">
                              {plateExport.vendorName ||
                                plateExport.plateVendor?.name ||
                                "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {plateExport.plateCount ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className={plateExport.productionMethod === "outsource" ? "text-orange-600 font-medium text-sm" : "text-blue-600 font-medium text-sm"}>
                              {plateExport.productionMethodName || (plateExport.productionMethod === "outsource" ? "In ngoài" : "In tại xưởng")}
                            </span>
                            {plateExport.productionMethod === "outsource" && plateExport.printingVendorName && (
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {plateExport.printingVendorName}
                              </span>
                            )}
                            {plateExport.productionMethod === "outsource" && (plateExport.outsourceCost ?? 0) > 0 && (
                              <span className="text-xs text-orange-500">
                                {formatCurrency(plateExport.outsourceCost ?? 0)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={plateExport.isActive ? "default" : "secondary"}
                          >
                            {plateExport.isActive ? "Đang hoạt động" : "Không hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{formatDate(plateExport.sentAt)}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(plateExport.estimatedReceiveAt)}
                        </TableCell>
                        <TableCell>
                          {plateExport.receivedAt ? (
                            <span className="text-emerald-600 font-medium text-sm">
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60">
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
