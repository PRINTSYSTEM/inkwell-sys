// src/pages/DesignersPage.tsx
import { useState, useMemo } from "react";
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

import type { UserResponse } from "@/Schema";
import { useCreateUser, useUpdateUser, useUsers, useTeamKpi } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type Designer = UserResponse;

export default function DesignersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
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
  const [showKpi, setShowKpi] = useState(false);

  // ====== Lấy danh sách designer (user.role = "design") ======
  const { data, isLoading } = useUsers({
    role: "design", // UserListParams.role là string
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
    "design",
    showKpi
  );

  const designers: Designer[] = data?.items ?? [];
  const totalCount = data?.total ?? designers.length;
  const pageNumber = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const normalizedSearch = searchQuery.toLowerCase().trim();

  const filteredDesigners = designers.filter((designer) => {
    const fullName = (designer.fullName ?? "").toLowerCase();
    const username = (designer.username ?? "").toLowerCase();
    const email = (designer.email ?? "").toLowerCase();

    return (
      fullName.includes(normalizedSearch) ||
      username.includes(normalizedSearch) ||
      email.includes(normalizedSearch)
    );
  });

  const activeCount = designers.filter((d) => d.isActive).length;
  const inactiveCount = designers.filter((d) => !d.isActive).length;

  // ====== Lấy danh sách thiết kế của designer ======
  const selectedDesignerId = selectedDesigner?.id ?? null;

  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: updateUser } = useUpdateUser();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Nhân viên thiết kế
            </h1>
            <p className="mt-2 text-slate-600">
              Quản lý danh sách nhân viên thiết kế và công việc của họ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-600" />
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
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
                <SelectTrigger className="w-[110px]">
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
            <Button
              variant={showKpi ? "default" : "outline"}
              onClick={() => setShowKpi(!showKpi)}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {showKpi ? "Ẩn KPI" : "Xem KPI"}
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleAddDesigner}
            >
              <User className="mr-2 h-4 w-4" />
              Thêm nhân viên
            </Button>
          </div>
        </div>

        {/* Team KPI Section */}
        {showKpi && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                KPI Tổng hợp - Tháng {selectedMonth}/{selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTeamKpi ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-500 text-sm">
                    Đang tải dữ liệu KPI...
                  </div>
                </div>
              ) : teamKpi ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">
                      Tổng đã chốt in
                    </p>
                    <p className="text-3xl font-bold text-blue-700">
                      {teamKpi.totalDesignsCompleted ?? 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thiết kế đã hoàn thành
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">
                      Tổng bình bài
                    </p>
                    <p className="text-3xl font-bold text-green-700">
                      {teamKpi.totalProofingOrdersCompleted ?? 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Lệnh bình bài hoàn thành
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">
                      Tổng sản xuất
                    </p>
                    <p className="text-3xl font-bold text-orange-700">
                      {teamKpi.totalProductionsCompleted ?? 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Lệnh sản xuất hoàn thành
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Tổng doanh thu</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {teamKpi.totalRevenue
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            notation: "compact",
                          }).format(teamKpi.totalRevenue)
                        : "0"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Doanh thu trong tháng
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Chưa có dữ liệu KPI cho tháng này
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Tổng số nhân viên
              </CardTitle>
              <User className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {totalCount}
              </div>
              <p className="mt-1 text-xs text-slate-500">Nhân viên thiết kế</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Đang hoạt động
              </CardTitle>
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {activeCount}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {totalCount > 0
                  ? `${((activeCount / totalCount) * 100).toFixed(0)}% tổng số`
                  : "0% tổng số"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-400 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Ngừng hoạt động
              </CardTitle>
              <div className="h-3 w-3 rounded-full bg-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {inactiveCount}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {totalCount > 0
                  ? `${((inactiveCount / totalCount) * 100).toFixed(
                      0
                    )}% tổng số`
                  : "0% tổng số"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, username, email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">
                      Nhân viên
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Liên hệ
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Trạng thái
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="text-slate-500 text-sm">
                          Đang tải danh sách nhân viên...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDesigners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <User className="mb-2 h-8 w-8 text-slate-300" />
                          <p>Không tìm thấy nhân viên nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDesigners.map((designer) => (
                      <TableRow
                        key={designer.id}
                        className="group hover:bg-blue-50/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-base font-semibold text-purple-700">
                              {(designer.username ?? "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {designer.fullName ?? "(Chưa có tên)"}
                              </div>
                              <div className="text-sm text-slate-500">
                                @{designer.username ?? "unknown"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-4 w-4" />
                              {designer.email || "—"}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-4 w-4" />
                              {designer.phone || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              designer.isActive ? "default" : "secondary"
                            }
                            className={
                              designer.isActive
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }
                          >
                            <div
                              className={`mr-1.5 h-2 w-2 rounded-full ${
                                designer.isActive
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-slate-400"
                              }`}
                            />
                            {designer.isActive
                              ? "Hoạt động"
                              : "Ngừng hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDesignerClick(designer)}
                              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Xem thiết kế
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditDesigner(designer)}
                              className="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDesigner(designer)}
                              className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Hiển thị {filteredDesigners.length} / {totalCount} nhân viên
              </span>
              <div className="text-xs text-slate-500">
                Trang {pageNumber} / {totalPages}
              </div>
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
    </div>
  );
}
