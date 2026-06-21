import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Search,
  Filter,
  Clock,
  Palette,
  Edit3,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User,
  ImageIcon,
  Loader2,
  SlidersHorizontal,
  Eye,
  Calendar,
  TrendingUp,
  Target,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TableSkeleton } from "@/components/ui/skeleton-components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useDesignsByUser, useUser, useUserKpi } from "@/hooks";
import type { DesignResponse } from "@/Schema";
import {
  designStatusConfig,
  formatDate,
  formatCurrency,
  type DesignStatusKey,
} from "@/lib/status-utils";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Icon mapping for design statuses
const DESIGN_STATUS_ICONS: Record<DesignStatusKey, LucideIcon> = {
  received_info: Clock,
  designing: Palette,
  editing: Edit3,
  waiting_for_customer_approval: AlertCircle,
  confirmed_for_printing: CheckCircle2,
  returned: RotateCcw,
  cancelled: XCircle,
};

export default function DesignerDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const designerId = params.id ? Number(params.id) : null;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().getMonth() + 1 + ""
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear() + ""
  );
  const [kpiDateRange, setKpiDateRange] = useState<DateRange | undefined>(
    undefined
  );
  const [pageInput, setPageInput] = useState<string>("");
  const pageSize = 20;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Calculate date range for current month
  const currentMonthDateRange = useMemo(() => {
    const now = new Date();
    const year = Number(selectedYear);
    const month = Number(selectedMonth);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    return {
      from: firstDay,
      to: lastDay,
    };
  }, [selectedMonth, selectedYear]);

  // Initialize KPI date range to current month if not set
  useEffect(() => {
    if (!kpiDateRange) {
      setKpiDateRange(currentMonthDateRange);
    }
  }, [currentMonthDateRange]);

  // Fetch designer info
  const {
    data: designer,
    isLoading: designerLoading,
    isError: designerError,
  } = useUser(designerId, !!designerId);

  // Fetch KPI data
  const { data: kpiData, isLoading: loadingKpi } = useUserKpi(
    designerId,
    {
      fromDate: kpiDateRange?.from
        ? format(kpiDateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'")
        : undefined,
      toDate: kpiDateRange?.to
        ? format(kpiDateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'")
        : undefined,
    },
    !!designerId && !!kpiDateRange?.from && !!kpiDateRange?.to
  );

  // Fetch all designs for stats (filtered by month/year)
  const { data: allDesignsData } = useDesignsByUser(
    designerId,
    {
      month: selectedMonth ? Number(selectedMonth) : undefined,
      year: selectedYear ? Number(selectedYear) : undefined,
    },
    !!designerId
  );

  // Fetch designs by user with filters and pagination
  const { data, isLoading, isError } = useDesignsByUser(
    designerId,
    {
      ...(statusFilter === "all" ? {} : { status: statusFilter }),
      pageNumber: currentPage,
      pageSize,
      month: selectedMonth ? Number(selectedMonth) : undefined,
      year: selectedYear ? Number(selectedYear) : undefined,
    },
    !!designerId
  );

  // hỗ trợ cả 2 dạng: Array<Design> hoặc { items, totalPages, ... }
  type PagedData = {
    items?: DesignResponse[] | null;
    size?: number;
    page?: number;
    total?: number;
    totalPages?: number;
  };
  const pagedData = data as PagedData | undefined;

  const designs: DesignResponse[] = useMemo(
    () => (Array.isArray(data) ? data : (pagedData?.items ?? [])),
    [data, pagedData?.items]
  );

  const totalCount = Array.isArray(data)
    ? data.length
    : pagedData?.total || designs.length;
  const totalPages =
    !Array.isArray(data) && typeof pagedData?.totalPages === "number"
      ? pagedData.totalPages
      : 1;
  const currentPageNum = pagedData?.page || currentPage;
  const hasPreviousPage = currentPageNum > 1;
  const hasNextPage = currentPageNum < totalPages;

  // Auto-adjust currentPage if it exceeds totalPages
  // Only adjust when data is actually loaded (not undefined) to avoid resetting during data fetch
  useEffect(() => {
    if (data && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, data]);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPageNum.toString());
  }, [currentPageNum]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPageNum.toString());
    }
  };

  // Filter by search query (client-side)
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter(
      (d) =>
        d.code?.toLowerCase().includes(query) ||
        d.designName?.toLowerCase().includes(query) ||
        d.designType?.name?.toLowerCase().includes(query) ||
        d.materialType?.name?.toLowerCase().includes(query)
    );
  }, [designs, searchQuery]);

  // Stats - calculate from all designs (not filtered)
  const allDesigns: DesignResponse[] = useMemo(() => {
    if (!allDesignsData) return [];
    if (Array.isArray(allDesignsData)) return allDesignsData;
    return allDesignsData.items ?? [];
  }, [allDesignsData]);

  const stats = useMemo(() => {
    const allDesignsTotalCount = Array.isArray(allDesignsData)
      ? allDesignsData.length
      : (allDesignsData as PagedData)?.total || allDesigns.length;

    return {
      total: allDesignsTotalCount,
      received_info: allDesigns.filter((d) => d.status === "received_info")
        .length,
      designing: allDesigns.filter((d) => d.status === "designing").length,
      editing: allDesigns.filter((d) => d.status === "editing").length,
      waiting_for_customer_approval: allDesigns.filter(
        (d) => d.status === "waiting_for_customer_approval"
      ).length,
      confirmed_for_printing: allDesigns.filter(
        (d) => d.status === "confirmed_for_printing"
      ).length,
      returned: allDesigns.filter((d) => d.status === "returned").length,
      cancelled: allDesigns.filter((d) => d.status === "cancelled").length,
    };
  }, [allDesigns, allDesignsData]);

  // Get status info
  const getStatusInfo = (design: DesignResponse) => {
    const status = (design.status || "received_info") as DesignStatusKey;
    const config =
      designStatusConfig[status] || designStatusConfig.received_info;
    const Icon = DESIGN_STATUS_ICONS[status] || Clock;
    return { status, config, Icon };
  };

  // Loading state
  if (designerLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Đang tải thông tin nhân viên...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (designerError || !designer) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Không tìm thấy nhân viên
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Nhân viên không tồn tại hoặc đã bị xóa
            </p>
            <Button
              onClick={() => navigate("/design/management")}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/design/management")}
            title="Quay lại danh sách"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 font-semibold text-xs">
                {designer.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">
                {designer.fullName || "Chưa có tên"}
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                @{designer.username || "unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI and Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-lg p-3 mb-3 shrink-0 shadow-sm">
        {/* Left: DateRangePicker and KPI calculations */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Tính KPI:</span>
            <DateRangePicker
              value={kpiDateRange}
              onValueChange={setKpiDateRange}
              placeholder="Chọn khoảng thời gian"
              className="w-[200px] h-8 text-xs font-normal"
            />
          </div>

          {loadingKpi ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Đang tính KPI...</span>
            </div>
          ) : kpiData && kpiDateRange?.from && kpiDateRange?.to ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-l pl-4 border-slate-200 dark:border-slate-800">
              {/* Đã chốt in */}
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/30">
                <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Đã chốt in:</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  {kpiData.designsCompleted ?? 0}
                  <span className="text-[10px] font-normal opacity-70">
                    /{kpiData.totalDesignsAssigned ?? 0}
                  </span>
                </span>
              </div>

              {/* Tỷ lệ hoàn thành */}
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded border border-green-100 dark:border-green-900/30">
                <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-300 font-medium">Tỷ lệ hoàn thành:</span>
                <span className="text-xs font-bold text-green-700 dark:text-green-300">
                  {kpiData.designCompletionRate
                    ? `${(kpiData.designCompletionRate * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>

              {/* Thời gian TB */}
              <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded border border-orange-100 dark:border-orange-900/30">
                <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs text-orange-700 dark:text-orange-300 font-medium">Thời gian TB:</span>
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                  {kpiData.averageDesignTimeHours
                    ? `${kpiData.averageDesignTimeHours.toFixed(1)}h`
                    : "—"}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Chọn ngày để tính KPI</span>
          )}
        </div>

        {/* Right: Date Selectors for Design List */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Lọc ds theo tháng:</span>
          <Select
            value={selectedMonth}
            onValueChange={(v) => {
              setSelectedMonth(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Tháng {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear}
            onValueChange={(v) => {
              setSelectedYear(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-card border rounded-lg p-2.5 mb-3 shrink-0 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tên, loại thiết kế..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <Filter className="w-3 h-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái ({stats.total})</SelectItem>
              {(Object.keys(designStatusConfig) as DesignStatusKey[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {designStatusConfig[key].label} ({stats[key as keyof typeof stats] || 0})
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div ref={tableContainerRef} className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="h-9 text-xs font-semibold min-w-[120px]">
                  Mã thiết kế
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold min-w-[200px]">
                  Tên thiết kế
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold min-w-[120px]">
                  Loại
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold min-w-[120px]">
                  Chất liệu
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold min-w-[100px]">
                  Kích thước
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold min-w-[140px]">
                  Trạng thái
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold min-w-[100px]">
                  Cập nhật
                </TableHead>
                <TableHead className="h-9 text-xs font-semibold w-[120px] text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={9} rows={10} rowHeight="h-11" />
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
                      <h3 className="text-base font-semibold mb-1">
                        Không thể tải dữ liệu
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Vui lòng thử lại sau hoặc liên hệ quản trị viên
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDesigns.length > 0 ? (
                filteredDesigns.map((design) => {
                  const { config, Icon } = getStatusInfo(design);

                  return (
                    <TableRow
                      key={design.id}
                      className="hover:bg-muted/50 cursor-pointer h-11"
                    >
                      {/* Code */}
                      <TableCell className="py-2">
                        <Link
                          to={`/design/detail/${design.id}`}
                          className="font-semibold text-sm text-primary hover:underline"
                        >
                          {design.code || `DES-${design.id}`}
                        </Link>
                      </TableCell>

                      {/* Name */}
                      <TableCell className="py-2">
                        <p className="font-medium text-sm line-clamp-1">
                          {design.designName || "Chưa đặt tên"}
                        </p>
                      </TableCell>

                      {/* Design Type */}
                      <TableCell className="py-2">
                        <span className="text-xs">
                          {design.designType?.name || "—"}
                        </span>
                      </TableCell>

                      {/* Material Type */}
                      <TableCell className="py-2">
                        <span className="text-xs">
                          {design.materialType?.name || "—"}
                        </span>
                      </TableCell>

                      {/* Dimensions - STT 2: Show L x W x H */}
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono">
                            {design.dimensions || "—"}
                          </span>
                          {(design.sidesClassificationOption ||
                            design.processClassificationOption) && (
                            <div className="flex gap-1 mt-0.5">
                              {design.sidesClassificationOption && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 bg-blue-50/50"
                                >
                                  {design.designType?.name?.toLowerCase().includes("decal")
                                    ? (design.sidesClassificationOption === "1 mặt" ||
                                       design.sidesClassificationOption === "one_side" ||
                                       (design as any).sidesClassification === "one_side")
                                      ? "Decal lẻ"
                                      : (design.sidesClassificationOption === "2 mặt" ||
                                         design.sidesClassificationOption === "two_side" ||
                                         (design as any).sidesClassification === "two_side")
                                        ? "Decal bộ"
                                        : (design.sidesClassificationOption as string)
                                    : (design.sidesClassificationOption as string)}
                                </Badge>
                              )}
                              {design.processClassificationOption && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 bg-amber-50/50"
                                >
                                  {design.processClassificationOption as string}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2">
                        <Badge
                          className={`${config.color} border text-xs font-medium`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>

                      {/* Updated At */}
                      <TableCell className="py-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(design.updatedAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link to={`/design/detail/${design.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Xem chi tiết</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-48">
                    <div className="text-center">
                      <Palette className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <h3 className="text-base font-semibold mb-1">
                        {searchQuery || statusFilter !== "all"
                          ? "Không tìm thấy thiết kế"
                          : "Chưa có thiết kế nào"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                          : "Nhân viên này chưa có công việc nào được giao"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t px-3 py-2 shrink-0 bg-background">
            <div className="text-xs text-muted-foreground">
              Hiển thị{" "}
              <span className="font-medium text-foreground">
                {(currentPageNum - 1) * pageSize + 1}
              </span>
              {" - "}
              <span className="font-medium text-foreground">
                {Math.min(currentPageNum * pageSize, totalCount)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              thiết kế
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => handlePageChange(currentPageNum - 1)}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Trang trước</span>
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">Trang</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-14 h-8 text-center text-xs"
                  disabled={isLoading}
                />
                <span className="text-xs text-muted-foreground">
                  / {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => handlePageChange(currentPageNum + 1)}
                disabled={!hasNextPage || isLoading}
              >
                <span className="hidden sm:inline">Trang sau</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
