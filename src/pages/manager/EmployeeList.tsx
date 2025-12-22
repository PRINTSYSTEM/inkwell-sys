import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Eye,
  Edit,
  User,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserResponse } from "@/Schema";
import { ROLE_LABELS as RoleLabels } from "@/constants/role.constant";
import { Switch } from "@/components/ui/switch";

export default function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use React Query hook for data fetching
  const {
    data: usersResponse,
    isLoading: loading,
    error,
  } = useUsers({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: debouncedSearch || "",
  });

  const users: UserResponse[] = usersResponse?.items || [];
  const totalCount = usersResponse?.total || 0;

  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutateAsync: deleteUser } = useDeleteUser();

  // Calculate stats from current data
  const stats = {
    total: totalCount,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
  };

  const navigate = useNavigate();

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

  const handleCreateEmployee = () => {
    navigate("/manager/employees/create");
  };

  const handleViewEmployee = (userId: number) => {
    navigate(`/manager/employees/${userId}`);
  };

  const handleEditEmployee = (userId: number) => {
    navigate(`/manager/employees/${userId}`);
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success("Xóa nhân viên thành công");
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể xóa nhân viên",
      });
    }
  };

  const handleToggleActive = async (user: UserResponse) => {
    try {
      await updateUser({
        id: user.id!,
        data: {
          isActive: !user.isActive,
        },
      });
      toast.success(
        user.isActive ? "Đã vô hiệu hóa nhân viên" : "Đã kích hoạt nhân viên"
      );
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  // Add loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải danh sách nhân viên...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Lỗi khi tải danh sách nhân viên</div>
      </div>
    );
  }

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý nhân viên
          </h1>
          <p className="text-muted-foreground mt-1">
            Danh sách nhân viên và thông tin tài khoản
          </p>
        </div>
        <Button onClick={handleCreateEmployee} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng nhân viên
            </CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số nhân viên trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang hoạt động
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              Nhân viên đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã vô hiệu hóa
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">
              Nhân viên đã vô hiệu hóa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Tìm kiếm theo tên, username, email, số điện thoại..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Không tìm thấy nhân viên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    return (
                      <TableRow
                        key={user.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewEmployee(user.id!)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-mono">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{user.fullName || "-"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {RoleLabels[user.role || ""] || user.role || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{user.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.isActive ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Vô hiệu hóa
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewEmployee(user.id!)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditEmployee(user.id!)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(user)}
                              >
                                {user.isActive ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Vô hiệu hóa
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Kích hoạt
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteEmployee(user.id!)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa nhân viên
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalCount)} trong tổng
                  số {totalCount} nhân viên
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 text-center text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      / {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!loading && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm
                  ? "Không tìm thấy nhân viên phù hợp"
                  : "Chưa có nhân viên nào"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

