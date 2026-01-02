import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useDesigns, useFilters } from "@/hooks";
import type { DesignResponse } from "@/Schema";
import { designStatusLabels } from "@/lib/status-utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type DesignWithSearch = DesignResponse & {
  designerFullName: string;
  customerName: string;
};

export default function AllDesignsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("");
  const itemsPerPage = 10;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // hook filter
  const [filterState, filterActions] = useFilters({
    initialFilters: {},
    initialSearch: "",
    persistKey: "designs-list",
  });

  // gọi React Query lấy list với pagination
  const { data, isLoading } = useDesigns({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    ...(filterState.filters["status"]?.value
      ? { status: filterState.filters["status"].value as string }
      : {}),
    ...(filterState.filters["designTypeId"]?.value
      ? { designTypeId: filterState.filters["designTypeId"].value as number }
      : {}),
  });

  // Memoize designs to prevent dependency warnings
  const designs = useMemo<DesignResponse[]>(
    () => data?.items ?? [],
    [data?.items]
  );

  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // map thêm field để search theo tên designer
  const designsWithSearch: DesignWithSearch[] = useMemo(
    () =>
      designs.map((d) => ({
        ...d,
        designerFullName: d.designer?.fullName ?? "",
        customerName: d.customer?.name ?? d.customer?.companyName ?? "",
      })),
    [designs]
  );

  // Filter by search query (client-side, vì API có thể không hỗ trợ search)
  const filteredDesigns = useMemo(() => {
    if (!filterState.searchQuery.trim()) return designsWithSearch;
    const query = filterState.searchQuery.toLowerCase();
    return designsWithSearch.filter(
      (d) =>
        d.code?.toLowerCase().includes(query) ||
        d.designerFullName?.toLowerCase().includes(query) ||
        d.latestOrderCode?.toLowerCase().includes(query) ||
        d.customerName?.toLowerCase().includes(query) ||
        d.latestRequirements?.toLowerCase().includes(query)
    );
  }, [designsWithSearch, filterState.searchQuery]);

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterState.filters, filterState.searchQuery]);

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
      setPageInput(currentPage.toString());
    }
  };

  // ====== mapping UI <-> filter state ======

  const handleSearchChange = (value: string) => {
    filterActions.setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      filterActions.removeFilter("status");
    } else {
      filterActions.setFilter("status", value, "eq");
    }
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    if (value === "all") {
      filterActions.removeFilter("designTypeId");
    } else {
      filterActions.setFilter("designTypeId", Number(value), "eq");
    }
    setCurrentPage(1);
  };

  // giá trị đang chọn cho Select (đọc từ filterState)
  const statusFilterValue =
    (filterState.filters["status"]?.value as string | undefined) ?? "all";

  const typeFilterValue =
    (
      filterState.filters["designTypeId"]?.value as number | undefined
    )?.toString() ?? "all";

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Danh sách thiết kế
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng số: {totalCount} thiết kế
            {filterState.activeFiltersCount > 0 && (
              <> · {filterState.activeFiltersCount} bộ lọc đang áp dụng</>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-3 shrink-0">
        <CardContent className="p-0">
          <div className="grid gap-3 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã hoặc thiết kế viên..."
                value={filterState.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilterValue}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(designStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select value={typeFilterValue} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Array.from(new Set(designs.map((d) => d.designTypeId))).map(
                  (typeId) => {
                    const type = designs.find(
                      (d) => d.designTypeId === typeId
                    )?.designType;
                    return type ? (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ) : null;
                  }
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Designs Table */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div ref={tableContainerRef} className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="h-9 text-sm font-bold ">
                    Mã thiết kế
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Mã đơn hàng
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Khách hàng
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Tên thiết kế
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Yêu cầu
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Trạng thái
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">Loại</TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Kích thước
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDesigns.length > 0 ? (
                  filteredDesigns.map((design) => (
                    <TableRow
                      key={design.id}
                      className="cursor-pointer hover:bg-muted/50 h-14"
                      onClick={() => navigate(`/design/detail/${design.id}`)}
                    >
                      <TableCell className="py-3 font-semibold text-sm">
                        {design.code || `DES-${design.id}`}
                      </TableCell>
                      <TableCell className="py-3">
                        {design.latestOrderCode ? (
                          <Badge
                            variant="outline"
                            className="font-mono font-semibold text-xs"
                          >
                            {design.latestOrderCode}
                          </Badge>
                        ) : (
                          <span className="font-medium">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold max-w-[150px]">
                        {design.customer?.name ||
                          design.customer?.companyName ||
                          "—"}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold max-w-[150px]">
                        {design.designName || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-medium text-muted-foreground max-w-[200px]">
                        {design.latestRequirements || "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge
                          status={design.status || ""}
                          label={
                            designStatusLabels[design.status || ""] ||
                            design.status ||
                            "N/A"
                          }
                        />
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold">
                        {design.designType?.name || "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold">
                          <span>{design.dimensions || "—"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">Không tìm thấy thiết kế nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t shrink-0 bg-background">
              <div className="text-xs text-muted-foreground">
                Hiển thị{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                {" - "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-medium text-foreground">
                  {totalCount}
                </span>{" "}
                thiết kế
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
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
                  disabled={currentPage === totalPages || isLoading}
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
