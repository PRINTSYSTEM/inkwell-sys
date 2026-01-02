// src/pages/DesignersPage.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Mail,
  Phone,
  User,
  Eye,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DesignerFormDialog } from "@/components/design/designer-form-dialog";
import { DeleteDesignerDialog } from "@/components/design/delete-designer-dialog";
import { toast } from "sonner";

import type { UserResponse } from "@/Schema";
import {
  useCreateUser,
  useUpdateUser,
  useUsers,
  useTeamKpi,
  useUserKpi,
  useResetPassword,
} from "@/hooks";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Designer = UserResponse;

// Component to display KPI for a single designer
function DesignerKpiCell({
  designerId,
  fromDate,
  toDate,
}: {
  designerId: number | null;
  fromDate: string;
  toDate: string;
}) {
  const { data: kpiData, isLoading } = useUserKpi(
    designerId,
    fromDate,
    toDate,
    !!designerId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <span className="text-sm font-medium">
      {kpiData?.designsCompleted ?? 0}
    </span>
  );
}

export default function DesignersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(
    null
  );
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // ====== Lấy danh sách designer (user.role = "design") với pagination và search ======
  const { data, isLoading } = useUsers({
    role: "design",
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: debouncedSearch || "",
  });

  // Calculate date range for selected month
  const monthDateRange = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    return {
      from: format(firstDay, "yyyy-MM-dd'T'00:00:00.000'Z'"),
      to: format(lastDay, "yyyy-MM-dd'T'23:59:59.999'Z'"),
    };
  }, [selectedMonth, selectedYear]);

  // Fetch team KPI
  const { data: teamKpi, isLoading: loadingTeamKpi } = useTeamKpi(
    monthDateRange.from,
    monthDateRange.to,
    "design"
  );

  const designers: Designer[] = data?.items ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Calculate stats from current page data (could be enhanced with separate stats API)
  const activeCount = designers.filter((d) => d.isActive).length;
  const inactiveCount = designers.filter((d) => !d.isActive).length;

  // Auto-adjust currentPage if it exceeds totalPages
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

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Reset to page 1 when search changes
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
      e.target.value = currentPage.toString();
    }
  };

  // ====== Lấy danh sách thiết kế của designer ======
  const selectedDesignerId = selectedDesigner?.id ?? null;

  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutate: resetPassword, loading: resettingPassword } =
    useResetPassword();

  const handleDesignerClick = (designer: Designer) => {
    if (designer.id) {
      navigate(`/design/designer/${designer.id}`);
    }
  };

  const handleAddDesigner = () => {
    setSelectedDesigner(null);
    setIsFormDialogOpen(true);
  };

  const handleEditDesigner = (designer: Designer) => {
    setSelectedDesigner(designer);
    setIsFormDialogOpen(true);
  };

  const handleDeleteDesigner = (designer: Designer) => {
    setSelectedDesigner(designer);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    // Dialog con nên tự invalidate query useUsers, ở đây chỉ cần đóng
    setIsFormDialogOpen(false);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleResetPassword = async (designer: Designer) => {
    if (!designer.id) return;

    try {
      await resetPassword({
        id: designer.id,
        data: {
          newPassword: "123456", // Default password
        },
      });
      toast.success("Đã reset mật khẩu thành công", {
        description: `Mật khẩu mới của ${designer.fullName || designer.username} là: 123456`,
      });
    } catch (error) {
      toast.error("Không thể reset mật khẩu", {
        description: "Vui lòng thử lại sau",
      });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Nhân viên thiết kế
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý danh sách nhân viên thiết kế và công việc của họ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    Tháng {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[90px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - 2 + i
                ).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" className="gap-2" onClick={handleAddDesigner}>
            <User className="h-4 w-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Team KPI Section */}
      <Card className="p-3 mb-4 shrink-0">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
            KPI Tổng hợp - Tháng {selectedMonth}/{selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingTeamKpi ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-xs text-muted-foreground">
                Đang tải dữ liệu KPI...
              </div>
            </div>
          ) : teamKpi ? (
            <div className="grid gap-2 md:grid-cols-4">
              <div className="text-center p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Tổng đã chốt in
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {teamKpi.totalDesignsCompleted ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Thiết kế đã hoàn thành
                </p>
              </div>
              <div className="text-center p-2.5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Tổng bình bài
                </p>
                <p className="text-xl font-bold text-green-700">
                  {teamKpi.totalProofingOrdersCompleted ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Lệnh bình bài hoàn thành
                </p>
              </div>
              <div className="text-center p-2.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Tổng sản xuất
                </p>
                <p className="text-xl font-bold text-orange-700">
                  {teamKpi.totalProductionsCompleted ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Lệnh sản xuất hoàn thành
                </p>
              </div>
              <div className="text-center p-2.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Tổng doanh thu
                </p>
                <p className="text-xl font-bold text-purple-700">
                  {teamKpi.totalRevenue
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        notation: "compact",
                      }).format(teamKpi.totalRevenue)
                    : "0"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Doanh thu trong tháng
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Chưa có dữ liệu KPI cho tháng này
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 mb-4 shrink-0 md:grid-cols-3">
        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng số nhân viên
            </CardTitle>
            <User className="h-3.5 w-3.5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Nhân viên thiết kế
            </p>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Đang hoạt động
            </CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalCount > 0
                ? `${((activeCount / totalCount) * 100).toFixed(0)}% tổng số`
                : "0% tổng số"}
            </p>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ngừng hoạt động
            </CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalCount > 0
                ? `${((inactiveCount / totalCount) * 100).toFixed(0)}% tổng số`
                : "0% tổng số"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="p-4 pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Tìm kiếm theo tên, username, email..."
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
                      Nhân viên
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Tài khoản
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Liên hệ
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Đã chốt in
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Trạng thái
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Đang tải...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : designers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <User className="mb-2 h-8 w-8 opacity-50" />
                          <p className="text-sm">
                            {searchTerm
                              ? "Không tìm thấy nhân viên phù hợp"
                              : "Chưa có nhân viên nào"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    designers.map((designer) => (
                      <TableRow
                        key={designer.id}
                        className="hover:bg-muted/50 h-11 cursor-pointer"
                        onClick={() => handleDesignerClick(designer)}
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-sm font-semibold text-purple-700 shrink-0">
                              {(designer.username ?? "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm">
                                {designer.fullName ?? "(Chưa có tên)"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                @{designer.username ?? "unknown"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-sm font-medium">
                            {designer.username ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {designer.email || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {designer.phone || "—"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <DesignerKpiCell
                            designerId={designer.id ?? null}
                            fromDate={monthDateRange.from}
                            toDate={monthDateRange.to}
                          />
                        </TableCell>
                        <TableCell
                          className="py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                designer.isActive ? "default" : "secondary"
                              }
                              className={cn(
                                "text-xs",
                                designer.isActive
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              <div
                                className={cn(
                                  "mr-1.5 h-1.5 w-1.5 rounded-full",
                                  designer.isActive
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-slate-400"
                                )}
                              />
                              {designer.isActive
                                ? "Hoạt động"
                                : "Ngừng hoạt động"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell
                          className="py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => handleResetPassword(designer)}
                              disabled={resettingPassword}
                              title="Reset mật khẩu"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEditDesigner(designer)}
                              title="Chỉnh sửa nhân viên"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteDesigner(designer)}
                              title="Xóa nhân viên"
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
                  nhân viên
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

      {/* Form thêm/sửa designer */}
      <DesignerFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        designer={selectedDesigner}
        onSuccess={handleFormSuccess}
        onSubmit={selectedDesigner ? updateUser : createUser}
      />

      {/* Xoá designer */}
      <DeleteDesignerDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        designer={selectedDesigner}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
