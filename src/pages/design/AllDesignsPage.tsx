import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Eye,
} from "lucide-react";
import { useDesigns, useFilters, useUsers, useUpdateDesign, useAuth, useReprintDesign } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { DesignResponse } from "@/Schema";
import { DesignCreateDialog } from "@/components/design";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { designStatusConfig, designStatusLabels } from "@/lib/status-utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { SortControls, type SortOrder } from "@/components/ui/sort-controls";

type DesignWithSearch = DesignResponse & {
  designerFullName: string;
  customerName: string;
};

export default function AllDesignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(
    new Date().getFullYear()
  );
  const itemsPerPage = 10;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // hook filter
  const [filterState, filterActions] = useFilters({
    initialFilters: {},
    initialSearch: "",
    persistKey: "designs-list",
  });

  // gọi React Query lấy list với pagination
  const useDesignsParams = useMemo(
    () => ({
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      ...(filterState.filters["status"]?.value
        ? { status: filterState.filters["status"].value as string }
        : {}),
      ...(filterState.filters["designTypeId"]?.value
        ? { designTypeId: filterState.filters["designTypeId"].value as number }
        : {}),
      ...(selectedMonth ? { month: selectedMonth } : {}),
      ...(selectedYear ? { year: selectedYear } : {}),
      ...(filterState.sortBy
        ? {
            sortColumn: filterState.sortBy,
            sortOrder: filterState.sortOrder,
          }
        : {}),
      ...(filterState.searchQuery.trim()
        ? { search: filterState.searchQuery.trim() }
        : {}),
    }),
    [
      currentPage,
      itemsPerPage,
      filterState.filters,
      filterState.sortBy,
      filterState.sortOrder,
      selectedMonth,
      selectedYear,
      filterState.searchQuery,
    ]
  );
  const { data, isLoading } = useDesigns(useDesignsParams);

  // Designers list for assignment
  const { data: designersData } = useUsers({ role: "design", pageSize: 100 });
  const designers = designersData?.items || [];

  const { user } = useAuth();
  const isDesignLeadOrAdmin = user?.role === "design_lead" || user?.role === "admin";
  const canCreateDesign = user?.role === "admin" || user?.role === "manager" || user?.role === "design" || user?.role === "design_lead";

  const { mutate: updateDesign, isPending: updatingDesign } = useUpdateDesign();

  // Memoize designs to prevent dependency warnings
  const designs = useMemo<DesignResponse[]>(
    () => data?.items ?? [],
    [data?.items]
  );

  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Reprint dialog state
  const [reprintDialogOpen, setReprintDialogOpen] = useState(false);
  const [reprintQuantity, setReprintQuantity] = useState<number | undefined>(1000);
  const [reprintTargetId, setReprintTargetId] = useState<number | null>(null);
  const reprintDesignMutation = useReprintDesign();
  const [viewingImage, setViewingImage] = useState<{ url: string; title?: string } | null>(null);

  const handleReprintSubmit = async () => {
    if (!reprintTargetId || !reprintQuantity || reprintQuantity <= 0) return;
    try {
      await reprintDesignMutation.mutate({ id: reprintTargetId, quantity: reprintQuantity });
      setReprintDialogOpen(false);
      setReprintTargetId(null);
    } catch (err) {
      // error handled in hook
    }
  };

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

  // Filter by search query (hybrid strategy: filters client-side on the loaded page, supporting design name)
  const filteredDesigns = useMemo(() => {
    if (!filterState.searchQuery.trim()) return designsWithSearch;
    const query = filterState.searchQuery.toLowerCase();
    return designsWithSearch.filter(
      (d) =>
        d.code?.toLowerCase().includes(query) ||
        d.designName?.toLowerCase().includes(query) ||
        d.designerFullName?.toLowerCase().includes(query) ||
        d.latestOrderCode?.toLowerCase().includes(query) ||
        d.customerName?.toLowerCase().includes(query) ||
        d.latestRequirements?.toLowerCase().includes(query)
    );
  }, [designsWithSearch, filterState.searchQuery]);

  // Auto-adjust currentPage if it exceeds totalPages
  // Only adjust when data is actually loaded (not undefined) to avoid resetting during data fetch
  useEffect(() => {
    if (data && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, data]);

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

  // Reset to page 1 when search query changes
  // Note: handleStatusChange, handleTypeChange, and month/year handlers already call setCurrentPage(1)
  // This effect only handles search query changes (handleSearchChange doesn't reset page)
  useEffect(() => {
    setCurrentPage(1);
  }, [filterState.searchQuery]);

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

  const handleSortColumnChange = (value: string) => {
    const next = value.trim();
    if (!next) {
      filterActions.clearSort();
    } else {
      filterActions.setSort(next, filterState.sortOrder);
    }
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value: SortOrder) => {
    if (!filterState.sortBy) return;
    filterActions.setSort(filterState.sortBy, value);
    setCurrentPage(1);
  };

  // giá trị đang chọn cho Select (đọc từ filterState)
  const statusFilterValue =
    (filterState.filters["status"]?.value as string | undefined) ?? "all";

  const typeFilterValue =
    (
      filterState.filters["designTypeId"]?.value as number | undefined
    )?.toString() ?? "all";

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
        {canCreateDesign && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2 font-semibold shadow-md shrink-0 animate-in fade-in duration-300"
          >
            <Plus className="h-4 w-4" />
            Tạo thiết kế mới
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3 mb-3 shrink-0">
        <CardContent className="p-0">
          <div className="grid gap-3 md:grid-cols-6">
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

            {/* Month filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={selectedMonth?.toString() || "all"}
                onValueChange={(v) => {
                  setSelectedMonth(v === "all" ? null : parseInt(v, 10));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      Tháng {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year filter */}
            <Select
              value={selectedYear?.toString() || "all"}
              onValueChange={(v) => {
                setSelectedYear(v === "all" ? null : parseInt(v, 10));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 3 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Sort (server-side) */}
            <SortControls
              sortColumn={filterState.sortBy ?? ""}
              sortOrder={filterState.sortOrder}
              onSortColumnChange={handleSortColumnChange}
              onSortOrderChange={handleSortOrderChange}
              onClear={() => {
                filterActions.clearSort();
                setCurrentPage(1);
              }}
              options={[
                { value: "createdAt", label: "Ngày tạo" },
                { value: "code", label: "Mã thiết kế" },
                { value: "status", label: "Trạng thái" },
                { value: "designTypeId", label: "Loại thiết kế" },
              ]}
              placeholder="Sắp xếp theo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Designs Table */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div ref={tableContainerRef} className="overflow-auto flex-1 relative">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="h-9 text-sm font-bold w-12">
                    Ảnh
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold ">
                    Mã thiết kế
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Mã đơn hàng
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Tên thiết kế
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Khách hàng
                  </TableHead>
                  {/* Yêu cầu column hidden per request */}
                  <TableHead className="h-9 text-sm font-bold">
                    Trạng thái
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">Người thiết kế</TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Loại
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold">
                    Kích thước
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton cols={8} rows={10} rowHeight="h-14" />
                ) : filteredDesigns.length > 0 ? (
                  filteredDesigns.map((design) => (
                    <TableRow
                      key={design.id}
                      className={`cursor-pointer hover:bg-muted/50 h-14 ${design.status === "returned" && `bg-red-50`}`}
                        onClick={() => navigate(`/design/detail/${design.id}`)}
                    >
                      <TableCell className="py-2">
                        <div 
                          className="w-10 h-10 rounded-md overflow-hidden bg-muted/20 flex items-center justify-center group relative cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (design.designImageUrl || design.designFileUrl) {
                              setViewingImage({
                                url: design.designImageUrl || design.designFileUrl || "",
                                title: design.designName
                              });
                            }
                          }}
                        >
                          <img 
                            src={design.designImageUrl || design.designFileUrl || "/placeholder.svg"} 
                            alt={design.designName || "image"} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-sm">
                        {design.code?.startsWith("NHAP") ? (
                          <Badge variant="outline" className="bg-orange-50/80 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-900/50 font-semibold px-2 py-0.5 rounded">
                            {design.code}
                          </Badge>
                        ) : (
                          design.code || `DES-${design.id}`
                        )}
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
                        <div
                          className="truncate"
                          title={design.designName || "—"}
                        >
                          {design.designName || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold max-w-[150px]">
                        <div
                          className="truncate"
                          title={
                            design.customer?.name ||
                            design.customer?.companyName ||
                            "—"
                          }
                        >
                          {design.customer?.name ||
                            design.customer?.companyName ||
                            "—"}
                        </div>
                      </TableCell>
                      {/* Removed requirements column (moved to detail) */}
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
                      <TableCell className="py-3 text-sm font-semibold max-w-[140px]">
                        {isDesignLeadOrAdmin ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={
                                design.assignedDesignerId != null
                                  ? design.assignedDesignerId.toString()
                                  : design.designer?.id != null
                                  ? design.designer.id.toString()
                                  : "__none__"
                              }
                              onValueChange={(val) => {
                                const assignedId = val === "__none__" ? null : Number(val);
                                updateDesign({ id: design.id, data: { assignedDesignerId: assignedId } } as any);
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Chọn designer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">(Chưa gán)</SelectItem>
                                {designers.map((d) => (
                                  <SelectItem key={d.id} value={d.id.toString()}>
                                    {d.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="truncate">{design.designer?.fullName || '—'}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold">
                        {design.designType?.name || "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold">
                          <span>
                            {design.width
                              ? `${design.length} x ${design.width} x ${design.height}`
                              : `${design.length} x ${design.height}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {design.status === "confirmed_for_printing" ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReprintTargetId(design.id);
                                setReprintQuantity(1000);
                                setReprintDialogOpen(true);
                              }}
                              className="h-8"
                            >
                              Tái bản
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
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
            </table>
          </div>

          {viewingImage && (
            <ImageViewerDialog
              open={!!viewingImage}
              onOpenChange={(open) => { if(!open) setViewingImage(null); }}
              imageUrl={viewingImage.url}
              title={viewingImage.title}
            />
          )}

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
      <DesignCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["designs"] });
        }}
      />
      {/* Reprint Dialog (from list) */}
      <Dialog open={reprintDialogOpen} onOpenChange={setReprintDialogOpen}>
        <DialogContent className="max-w-md bg-background border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Yêu cầu tái bản thiết kế
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Nhập số lượng sản phẩm cần sản xuất thêm cho thiết kế này. Hệ thống sẽ tạo một yêu cầu in mới trong kho sẵn sàng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Số lượng tái bản *</Label>
              <Input
                type="number"
                min="1"
                placeholder="VD: 1000"
                value={reprintQuantity || ""}
                onChange={(e) => setReprintQuantity(Number(e.target.value))}
                className="h-11 bg-background"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setReprintDialogOpen(false)}
              disabled={reprintDesignMutation.loading}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleReprintSubmit}
              disabled={reprintDesignMutation.loading || !reprintQuantity || reprintQuantity <= 0}
              className="font-semibold"
            >
              {reprintDesignMutation.loading ? "Đang xử lý..." : "Xác nhận tái bản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
