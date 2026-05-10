import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Building2, Users } from "lucide-react";
import { useVendors, useDeleteVendor } from "@/hooks/use-vendor";
import { vendorTypeLabels, getVendorTypeLabel } from "@/lib/status-utils";
import { SortControls, type SortOrder } from "@/components/ui/sort-controls";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/skeleton-components";

export default function VendorListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const itemsPerPage = 10;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useVendors({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: debouncedSearch || "",
    vendorType: vendorTypeFilter || undefined,
    isActive: isActiveFilter === "active" ? true : isActiveFilter === "inactive" ? false : undefined,
    ...(sortColumn.trim()
      ? { sortColumn: sortColumn.trim(), sortOrder: sortOrder }
      : {}),
  });

  const { mutate: deleteVendor } = useDeleteVendor();

  const vendors = data?.items || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const totalDebt = vendors.reduce((sum, v) => sum + (v.currentDebt || 0), 0);
  const averageDebt = vendors.length > 0 ? totalDebt / vendors.length : 0;

  useEffect(() => {
    if (data && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, data]);

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 1000);
  };

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
    if (value === "") return;

    const page = parseInt(value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || isNaN(parseInt(value, 10))) {
      e.target.value = currentPage.toString();
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      deleteVendor(id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý nhà cung cấp
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Danh sách và thông tin liên hệ nhà cung cấp
          </p>
        </div>
        <Button onClick={() => navigate("/vendors/create")} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nhà cung cấp
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-3 mb-4 shrink-0 md:grid-cols-3">
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng nhà cung cấp
            </CardTitle>
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tổng số nhà cung cấp trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng công nợ
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">
              {totalDebt.toLocaleString("vi-VN")} ₫
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tổng công nợ hiện tại
            </p>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Công nợ trung bình
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">
              {Math.round(averageDebt).toLocaleString("vi-VN")} ₫
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Trung bình mỗi nhà cung cấp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="p-4 pb-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Tìm kiếm nhà cung cấp..."
                className="pl-10 h-10 sm:h-9 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Select
                value={vendorTypeFilter || "all"}
                onValueChange={(v) => {
                  setVendorTypeFilter(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {Object.entries(vendorTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={isActiveFilter}
                onValueChange={(v) => {
                  setIsActiveFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>

              {(vendorTypeFilter || isActiveFilter !== "all" || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVendorTypeFilter("");
                    setIsActiveFilter("all");
                    setSearchTerm("");
                    setDebouncedSearch("");
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Xóa lọc
                </Button>
              )}
            </div>
            <div className="w-full lg:w-[420px] min-w-0">
              <SortControls
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onSortColumnChange={(v) => {
                  setSortColumn(v);
                  setCurrentPage(1);
                }}
                onSortOrderChange={(v) => {
                  setSortOrder(v);
                  setCurrentPage(1);
                }}
                onClear={() => {
                  setSortColumn("");
                  setSortOrder("asc");
                  setCurrentPage(1);
                }}
                options={[
                  { value: "name", label: "Tên nhà cung cấp" },
                  { value: "vendorType", label: "Loại" },
                  { value: "isActive", label: "Trạng thái" },
                ]}
                placeholder="Sắp xếp theo"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="rounded-md border flex-1 flex flex-col min-h-0 overflow-hidden">
            <div ref={tableContainerRef} className="overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="h-9 text-xs font-semibold">Tên nhà cung cấp</TableHead>
                    <TableHead className="h-9 text-xs font-semibold">Loại</TableHead>
                    <TableHead className="h-9 text-xs font-semibold">Điện thoại</TableHead>
                    <TableHead className="h-9 text-xs font-semibold">Địa chỉ</TableHead>
                    <TableHead className="h-9 text-xs font-semibold">Công nợ</TableHead>
                    <TableHead className="h-9 text-xs font-semibold w-[140px]">Trạng thái</TableHead>
                    <TableHead className="h-9 text-xs font-semibold text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton cols={7} rows={10} rowHeight="h-11" />
                  ) : vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Không tìm thấy nhà cung cấp nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((vendor) => (
                      <TableRow 
                        key={vendor.id}
                        className="hover:bg-muted/50 cursor-pointer h-11"
                        onClick={() => navigate(`/vendors/${vendor.id}`)}
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium text-sm">
                              {vendor.name || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-sm text-slate-600">
                          {getVendorTypeLabel(vendor.vendorType)}
                        </TableCell>
                        <TableCell className="py-2 text-sm text-slate-600">{vendor.phone || "—"}</TableCell>
                        <TableCell className="py-2 max-w-xs truncate text-sm text-slate-600">
                          {vendor.address || "—"}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`font-medium text-sm ${
                              (vendor.currentDebt ?? 0) > 0 ? "text-red-600" : "text-green-600"
                            }`}>
                            {(vendor.currentDebt ?? 0).toLocaleString("vi-VN")} ₫
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge
                            variant={vendor.isActive ? "default" : "secondary"}
                            className={cn(
                              "whitespace-nowrap",
                              vendor.isActive ? "bg-green-100 text-green-700 border-green-200" : ""
                            )}
                          >
                            {vendor.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell 
                          className="text-right py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => navigate(`/vendors/${vendor.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(vendor.id!)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-2 py-3 border-t shrink-0 bg-background">
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
                  nhà cung cấp
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
                      value={currentPage}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
