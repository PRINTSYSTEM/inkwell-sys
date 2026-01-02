import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Plus,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useCustomers, useExportDebtComparison } from "@/hooks/use-customer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks";
import { ROLE } from "@/constants";
import { CustomerResponse } from "@/Schema";

export default function Customers() {
  const { user } = useAuth();
  const userRole = user?.role;

  // Chỉ role accounting và admin mới thấy thông tin công nợ
  const canViewFinancialInfo =
    userRole === ROLE.ACCOUNTING ||
    userRole === ROLE.ACCOUNTING_LEAD ||
    userRole === ROLE.ADMIN;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Use React Query hook for data fetching
  const {
    data: customersResponse,
    isLoading: loading,
    error,
  } = useCustomers({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: debouncedSearch || "",
  });
  const [exportingId, setExportingId] = useState<number | null>(null);
  const customers: CustomerResponse[] = customersResponse?.items || [];
  const totalCount = customersResponse?.total || 0;

  const { mutate: exportDebtComparison, loading: exporting } =
    useExportDebtComparison();

  const handleExportDebtComparison = async (customerId: number) => {
    setExportingId(customerId);
    try {
      await exportDebtComparison(customerId);
    } catch {
      // Error handled in hook
    } finally {
      setExportingId(null);
    }
  };

  // Calculate stats from current data (could be enhanced with separate stats API)
  const stats = {
    total: totalCount,
    totalDebt: customers.reduce(
      (sum, customer) => sum + (customer.currentDebt || 0),
      0
    ),
    averageDebt:
      customers.length > 0
        ? customers.reduce(
            (sum, customer) => sum + (customer.currentDebt || 0),
            0
          ) / customers.length
        : 0,
  };

  const navigate = useNavigate();

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Auto-adjust currentPage if it exceeds totalPages (e.g., after search/filter)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Add loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Đang tải danh sách khách hàng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Lỗi khi tải danh sách khách hàng</div>
      </div>
    );
  }

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
      // Giữ focus lại input search sau khi debounce
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 1000);
  };

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
    if (value === "") return;

    const page = parseInt(value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || isNaN(parseInt(value, 10))) {
      // Reset to current page if invalid
      e.target.value = currentPage.toString();
    }
  };

  const handleCreateCustomer = () => {
    navigate("/customers/create");
  };

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: number) => {
    toast.success(`Đang chuyển đến chỉnh sửa khách hàng ${customerId}`);
    // navigate(`/customers/${customerId}/edit`);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      return;
    }

    // TODO: Implement useDeleteCustomer hook when delete API is available
    toast.info(`Tính năng xóa khách hàng ${customerId} đang được phát triển`);
  };

  const handleDuplicateCustomer = (customerId: number) => {
    toast.success(`Đang sao chép thông tin khách hàng ${customerId}`);
  };

  const handleSendEmail = (customerId: number) => {
    toast.success(`Đang mở email để liên hệ khách hàng ${customerId}`);
  };

  const handleExportCustomer = (customerId: number) => {
    toast.success(`Đang xuất thông tin khách hàng ${customerId}`);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý khách hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Danh sách khách hàng và thông tin liên hệ
          </p>
        </div>
        <Button onClick={handleCreateCustomer} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Statistics */}
      <div
        className={`grid gap-3 mb-4 shrink-0 ${canViewFinancialInfo ? "md:grid-cols-3" : "md:grid-cols-1"}`}
      >
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng khách hàng
            </CardTitle>
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tổng số khách hàng trong hệ thống
            </p>
          </CardContent>
        </Card>

        {canViewFinancialInfo && (
          <>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Tổng công nợ
                </CardTitle>
                <DollarSign className="h-3.5 w-3.5 text-accent" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">
                  {stats.totalDebt.toLocaleString("vi-VN")} ₫
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
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">
                  {Math.round(stats.averageDebt).toLocaleString("vi-VN")} ₫
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Trung bình mỗi khách hàng
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search and Filter */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="p-4 pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Tìm kiếm theo tên, mã KH, người đại diện, SĐT, mã số thuế..."
                className="pl-10 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
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
                    <TableHead className="h-9 text-xs font-semibold">
                      Mã KH
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Tên khách hàng
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Tên công ty
                    </TableHead>
                    {canViewFinancialInfo && (
                      <TableHead className="h-9 text-xs font-semibold">
                        Công nợ hiện tại
                      </TableHead>
                    )}
                    <TableHead className="h-9 text-xs font-semibold">
                      Hạn mức nợ
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={canViewFinancialInfo ? 6 : 5}
                        className="text-center py-8"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Đang tải...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canViewFinancialInfo ? 6 : 5}
                        className="text-center py-8"
                      >
                        Không tìm thấy khách hàng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => {
                      // Tách tên viết tắt từ mã khách hàng (nếu có)
                      const shortName =
                        customer.code?.replace(/^\d{4}/, "") || "";

                      return (
                        <TableRow
                          key={customer.id}
                          className="hover:bg-muted/50 cursor-pointer h-11"
                          onClick={() => handleViewCustomer(customer.id)}
                        >
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-mono text-sm">
                                {customer.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {customer.name}
                          </TableCell>
                          <TableCell className="py-2">
                            {customer.companyName
                              ? customer.companyName
                              : "Cá nhân"}
                          </TableCell>
                          {canViewFinancialInfo && (
                            <TableCell className="py-2">
                              <span
                                className={`font-medium text-sm ${
                                  (customer.currentDebt || 0) >
                                  (customer.maxDebt || 0)
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {(customer.currentDebt || 0).toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                ₫
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="py-2">
                            <span className="font-medium text-sm">
                              {(customer.maxDebt || 0).toLocaleString("vi-VN")}{" "}
                              ₫
                            </span>
                          </TableCell>
                          <TableCell
                            className="text-right py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCustomer(customer.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
                  khách hàng
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
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
                      disabled={loading}
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
                    disabled={currentPage === totalPages || loading}
                  >
                    <span className="hidden sm:inline">Trang sau</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {!loading && customers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">
                  {searchTerm
                    ? "Không tìm thấy khách hàng phù hợp"
                    : "Chưa có khách hàng nào"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
