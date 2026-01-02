import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  ExternalLink,
  ImageIcon,
  Loader2,
  SlidersHorizontal,
  Eye,
  Calendar,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useMyDesigns, useGenerateDesignExcel } from "@/hooks";
import type { DesignResponse } from "@/Schema";
import {
  designStatusConfig,
  formatDate,
  type DesignStatusKey,
} from "@/lib/status-utils";

// Icon mapping for design statuses
const DESIGN_STATUS_ICONS: Record<DesignStatusKey, LucideIcon> = {
  received_info: Clock,
  designing: Palette,
  editing: Edit3,
  waiting_for_customer_approval: AlertCircle,
  confirmed_for_printing: CheckCircle2,
};

// Main Page Component
export default function MyWorkPage() {
  const navigate = useNavigate();
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(
    new Date().getFullYear()
  );
  const pageSize = 10;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // API
  const { data, isLoading, isError } = useMyDesigns({
    pageNumber: currentPage,
    pageSize,
    status: statusFilter === "all" ? "" : statusFilter,
    month: selectedMonth ?? undefined,
    year: selectedYear ?? undefined,
  });

  const { mutate: generateExcel } = useGenerateDesignExcel();

  // Derived data
  const totalCount = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const currentPageNum = data?.page || currentPage;
  const hasPreviousPage = currentPageNum > 1;
  const hasNextPage = currentPageNum < totalPages;

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
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

  // Memoize designs to avoid useMemo dependency warnings
  const memoizedDesigns = useMemo(() => data?.items || [], [data?.items]);

  // Filter by search query (client-side)
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return memoizedDesigns;
    const query = searchQuery.toLowerCase();
    return memoizedDesigns.filter(
      (d) =>
        d.code?.toLowerCase().includes(query) ||
        d.designName?.toLowerCase().includes(query) ||
        d.designType?.name?.toLowerCase().includes(query) ||
        d.materialType?.name?.toLowerCase().includes(query)
    );
  }, [memoizedDesigns, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: totalCount,
      received_info: memoizedDesigns.filter((d) => d.status === "received_info")
        .length,
      designing: memoizedDesigns.filter((d) => d.status === "designing").length,
      editing: memoizedDesigns.filter((d) => d.status === "editing").length,
      waiting_for_customer_approval: memoizedDesigns.filter(
        (d) => d.status === "waiting_for_customer_approval"
      ).length,
      confirmed_for_printing: memoizedDesigns.filter(
        (d) => d.status === "confirmed_for_printing"
      ).length,
    };
  }, [memoizedDesigns, totalCount]);

  // Get status info
  const getStatusInfo = (design: DesignResponse) => {
    const status = (design.status || "received_info") as DesignStatusKey;
    const config =
      designStatusConfig[status] || designStatusConfig.received_info;
    const Icon = DESIGN_STATUS_ICONS[status] || Clock;
    return { status, config, Icon };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải công việc của bạn...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Không thể tải dữ liệu
            </h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng thử lại sau hoặc liên hệ quản trị viên
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Công việc của tôi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý {totalCount} thiết kế được giao cho bạn
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-0.5" />
          <Select
            value={selectedMonth?.toString() || "all"}
            onValueChange={(v) => {
              setSelectedMonth(v === "all" ? null : parseInt(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs bg-card">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Tháng {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear?.toString() || "all"}
            onValueChange={(v) => {
              setSelectedYear(v === "all" ? null : parseInt(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs bg-card">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    Năm {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3 shrink-0">
        <Card
          className={`cursor-pointer transition-all p-2 ${
            statusFilter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground">Tổng cộng</div>
          </CardContent>
        </Card>

        {(Object.keys(designStatusConfig) as DesignStatusKey[]).map((key) => {
          const config = designStatusConfig[key];
          const count = stats[key as keyof typeof stats] || 0;
          const Icon = DESIGN_STATUS_ICONS[key];
          const isActive = statusFilter === key;

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all p-2 ${
                isActive ? "ring-2 ring-primary" : "hover:shadow-md"
              } ${config.bgColor}`}
              onClick={() => {
                setStatusFilter(key);
                setCurrentPage(1);
              }}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold">{count}</span>
                </div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">
                  {config.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-card border rounded-lg p-3 mb-3 shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tên, loại thiết kế..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
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
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {(Object.keys(designStatusConfig) as DesignStatusKey[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {designStatusConfig[key].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {(searchQuery ||
            statusFilter !== "all" ||
            selectedMonth !== null ||
            selectedYear !== null) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedYear(new Date().getFullYear());
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
                <TableHead className="h-9 text-sm font-bold">
                  Mã thiết kế
                </TableHead>
                <TableHead className="h-9 text-sm font-bold">
                  Tên thiết kế
                </TableHead>
                <TableHead className="h-9 text-sm font-bold">Loại</TableHead>
                <TableHead className="h-9 text-sm font-bold">
                  Chất liệu
                </TableHead>
                <TableHead className="h-9 text-sm font-bold">
                  Kích thước
                </TableHead>
                <TableHead className="h-9 text-sm font-bold">
                  Trạng thái
                </TableHead>
                <TableHead className="h-9 text-sm font-bold">
                  Cập nhật
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesigns.length > 0 ? (
                filteredDesigns.map((design) => {
                  const { config, Icon } = getStatusInfo(design);
                  const isDownloading = downloadingId === design.id;

                  return (
                    <TableRow
                      key={design.id}
                      className="hover:bg-muted/50 cursor-pointer h-14"
                      onClick={() => navigate(`/design/detail/${design.id}`)}
                    >
                      {/* Code */}
                      <TableCell className="py-3">
                        <span className="font-semibold text-sm text-primary">
                          {design.code || `DES-${design.id}`}
                        </span>
                      </TableCell>

                      {/* Name */}
                      <TableCell className="py-3">
                        <p className="font-semibold text-sm line-clamp-1">
                          {design.designName || "Chưa đặt tên"}
                        </p>
                      </TableCell>

                      {/* Design Type */}
                      <TableCell className="py-3">
                        <span className="text-sm font-semibold">
                          {design.designType?.name || "—"}
                        </span>
                      </TableCell>

                      {/* Material Type */}
                      <TableCell className="py-3">
                        <span className="text-sm font-semibold">
                          {design.materialType?.name || "—"}
                        </span>
                      </TableCell>

                      {/* Dimensions */}
                      <TableCell className="py-3">
                        <span className="text-sm font-mono font-semibold">
                          {design.width
                            ? `${design.length} x ${design.width} x ${design.height}`
                            : `${design.length} x ${design.height}`}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge
                          className={`${config.color} border text-xs font-medium`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>

                      {/* Updated At */}
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {formatDate(design.updatedAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Palette className="w-10 h-10 mb-2 opacity-50" />
                      <h3 className="text-sm font-semibold mb-1">
                        {searchQuery ||
                        statusFilter !== "all" ||
                        selectedMonth !== null ||
                        selectedYear !== null
                          ? "Không tìm thấy thiết kế"
                          : "Chưa có thiết kế nào"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery ||
                        statusFilter !== "all" ||
                        selectedMonth !== null ||
                        selectedYear !== null
                          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                          : "Các thiết kế được giao cho bạn sẽ hiển thị ở đây"}
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
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
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
                onClick={handleNextPage}
                disabled={!hasNextPage || isLoading}
              >
                <span className="hidden sm:inline">Trang sau</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
