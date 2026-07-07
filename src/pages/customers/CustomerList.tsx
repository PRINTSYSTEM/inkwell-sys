import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, API_SUFFIX } from "@/apis";
import { Input } from "@/components/ui/input";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Plus,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useCustomers, useExportDebtComparison, useDeleteCustomer } from "@/hooks/use-customer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { useState, useRef, useEffect } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { customerTypeLabels } from "@/lib/status-utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks";
import { ROLE } from "@/constants";
import { CustomerResponse } from "@/Schema";
import { SortControls, type SortOrder } from "@/components/ui/sort-controls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useListState } from "@/hooks/use-list-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function Customers() {
  const { user } = useAuth();
  const userRole = user?.role;

  // Chỉ role accounting và admin mới thấy thông tin công nợ
  const canViewFinancialInfo =
    userRole === ROLE.ACCOUNTING ||
    userRole === ROLE.ACCOUNTING_LEAD ||
    userRole === ROLE.SALE ||
    userRole === ROLE.ADMIN;

  const {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm: debouncedSearch,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
    resetPage,
  } = useListState({ defaultSortOrder: "asc" });

  const itemsPerPage = 10;
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
    ...(sortColumn.trim()
      ? { sortColumn: sortColumn.trim(), sortOrder: sortOrder }
      : {}),
  });
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerResponse | null>(null);
  const customers: CustomerResponse[] = customersResponse?.items || [];
  const totalCount = customersResponse?.total || 0;

  const { mutate: exportDebtComparison, loading: exporting } =
    useExportDebtComparison();

  const { mutate: deleteCustomer, isPending: deleting } = useDeleteCustomer();

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

  // Merge customers dialog
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeFromId, setMergeFromId] = useState<number | null>(null);
  const [mergeToId, setMergeToId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  const handleOpenMergeDialog = () => {
    setMergeFromId(null);
    setMergeToId(null);
    setMergeDialogOpen(true);
  };

  const handleMerge = async () => {
    if (!mergeFromId || !mergeToId) {
      toast.error("Vui lòng nhập cả ID nguồn và ID đích");
      return;
    }
    if (mergeFromId === mergeToId) {
      toast.error("ID nguồn và ID đích phải khác nhau");
      return;
    }

    const ok = window.confirm(
      "Bạn sắp gộp hai khách hàng. Đây là hành động rủi ro — chỉ dành cho đội hỗ trợ. Tiếp tục?"
    );
    if (!ok) return;

    try {
      setMerging(true);
      await apiRequest.post(`${API_SUFFIX.CUSTOMERS}/merge`, {
        fromCustomerId: mergeFromId,
        toCustomerId: mergeToId,
      });
      toast.success("Gộp khách hàng thành công");
      setMergeDialogOpen(false);
      // refetch list by resetting page or calling refetch — using resetPage
      resetPage();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi gộp khách hàng");
    } finally {
      setMerging(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Lỗi khi tải danh sách khách hàng</div>
      </div>
    );
  }

  // Search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Pagination handlers
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

  const handleDeleteCustomer = (customer: CustomerResponse) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete.id);
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch {
      // Error is handled by the hook (toast)
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý khách hàng
          </h1>
          <div className="text-xs text-muted-foreground bg-muted/60 border rounded-md px-2.5 py-1 flex items-center gap-1.5 font-medium ml-2">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Tổng khách hàng:</span>
            <span className="font-bold text-foreground">{stats.total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" onClick={handleOpenMergeDialog} className="h-9 flex items-center gap-2" title="Dành cho đội hỗ trợ">
            <AlertTriangle className="h-4 w-4" />
            <span>Gom khách hàng</span>
          </Button>
          <Button onClick={handleCreateCustomer} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm khách hàng
          </Button>
        </div>
      </div>
      {/* Merge dialog (for support) */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gom khách hàng (Hỗ trợ)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Hãy nhập ID của khách hàng nguồn (sẽ bị gộp vào) và ID của khách hàng đích.
              Chỉ dùng cho đội hỗ trợ. Hành động này không thể hoàn tác.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>ID nguồn (bị xóa)</Label>
                <Input type="number" value={mergeFromId ?? ""} onChange={(e) => setMergeFromId(Number(e.target.value) || null)} />
              </div>
              <div>
                <Label>ID đích</Label>
                <Input type="number" value={mergeToId ?? ""} onChange={(e) => setMergeToId(Number(e.target.value) || null)} />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleMerge} disabled={merging}>{merging ? "Đang gộp..." : "Gom khách"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-4">

        {/* Search and Filter */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="p-4 pb-3 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1 min-w-0 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Tìm kiếm theo tên, mã KH, người đại diện, SĐT, mã số thuế..."
                  className="pl-10 h-10 sm:h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
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
                    { value: "code", label: "Mã KH" },
                    { value: "name", label: "Tên khách hàng" },
                    { value: "companyName", label: "Tên công ty" },
                    { value: "currentDebt", label: "Công nợ hiện tại" },
                    { value: "maxDebt", label: "Hạn mức nợ" },
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
                      <TableHead className="h-10 text-sm font-bold min-w-[100px]">
                        Mã KH
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold min-w-[300px] w-[35%]">
                        Tên khách hàng
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold min-w-[160px]">
                        Người đại diện
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold min-w-[140px]">
                        Loại khách hàng
                      </TableHead>
                      {canViewFinancialInfo && (
                        <TableHead className="h-10 text-sm font-bold min-w-[140px]">
                          Công nợ hiện tại
                        </TableHead>
                      )}
                      <TableHead className="h-10 text-sm font-bold text-right min-w-[140px]">
                        Hạn mức nợ
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold text-right w-[80px]">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableSkeleton
                        cols={canViewFinancialInfo ? 7 : 6}
                        rows={10}
                        rowHeight="h-12"
                      />
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canViewFinancialInfo ? 7 : 6}
                          className="text-center py-8 text-sm md:text-base"
                        >
                          Không tìm thấy khách hàng nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => {
                        return (
                          <TableRow
                            key={customer.id}
                            className="hover:bg-muted/50 cursor-pointer h-12"
                            onClick={() => handleViewCustomer(customer.id)}
                          >
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-primary shrink-0" />
                                <span className="font-mono text-sm md:text-base font-semibold">
                                  {customer.code ?? ""}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 text-sm md:text-base font-semibold text-foreground">
                              {customer.name ?? ""}
                            </TableCell>
                            <TableCell className="py-2 text-sm md:text-base font-medium">
                              {customer.representativeName || "—"}
                            </TableCell>
                            <TableCell className="py-2">
                              <StatusBadge
                                status={customer.type || "retail"}
                                label={customerTypeLabels[customer.type || "retail"]}
                              />
                            </TableCell>
                            {canViewFinancialInfo && (
                              <TableCell className="py-2">
                                <span
                                  className={`font-semibold text-sm md:text-base ${(customer.currentDebt ?? 0) < 0
                                      ? Math.abs(customer.currentDebt ?? 0) > (customer.maxDebt ?? 0)
                                        ? "text-red-700 font-bold"
                                        : "text-red-600"
                                      : (customer.currentDebt ?? 0) > 0
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                    }`}
                                >
                                  {(customer.currentDebt ?? 0).toLocaleString(
                                    "vi-VN"
                                  )}{" "}
                                  ₫
                                </span>
                              </TableCell>
                            )}
                            <TableCell className="py-2 text-right">
                              <span className="font-semibold text-sm md:text-base">
                                {(customer.maxDebt ?? 0).toLocaleString("vi-VN")}{" "}
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
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteCustomer(customer)}
                                disabled={deleting}
                              >
                                <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng{" "}
              <span className="font-semibold text-foreground">
                {customerToDelete?.name}
              </span>{" "}
              ({customerToDelete?.code})? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
