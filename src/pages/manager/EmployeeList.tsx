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
  Lock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUsers,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserResponse } from "@/Schema";
import { ROLE_LABELS as RoleLabels } from "@/constants/role.constant";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CreateEmployeeDialog } from "@/components/users/CreateEmployeeDialog";
import { EmployeeDetailDialog } from "@/components/users/EmployeeDetailDialog";

const getRoleBadgeStyle = (role?: string) => {
  const r = role?.toLowerCase() || "";
  if (r.includes("admin")) return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
  if (r.includes("manager")) return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
  if (r.includes("design")) return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
  if (r.includes("kcs")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (r.includes("printer") || r.includes("production")) return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300";
  if (r.includes("accounting")) return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
  if (r.includes("warehouse")) return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
};

export default function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // Dialog popups state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isInitialEditing, setIsInitialEditing] = useState(false);

  // Data fetching hook
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
  const { mutate: adminResetPassword, loading: resettingPassword } =
    useResetPassword();

  // Stats calculation
  const stats = {
    total: totalCount,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
  };

  const navigate = useNavigate();

  const handleConfirmResetPassword = async () => {
    if (!selectedUser) return;

    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      toast.error("Lỗi", {
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
      return;
    }

    try {
      await adminResetPassword({
        id: selectedUser.id!,
        data: { newPassword: resetPasswordValue },
      } as any);
      setResetDialogOpen(false);
      setSelectedUser(null);
      setResetPasswordValue("");
    } catch {
      // Toast error handled by hook
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 400);
  };

  const handleCreateEmployee = () => {
    setCreateDialogOpen(true);
  };

  const handleViewEmployee = (userId: number) => {
    setSelectedUserId(userId);
    setIsInitialEditing(false);
    setDetailDialogOpen(true);
  };

  const handleEditEmployee = (userId: number) => {
    setSelectedUserId(userId);
    setIsInitialEditing(true);
    setDetailDialogOpen(true);
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success("Xóa nhân viên thành công");
    } catch {
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
    } catch {
      toast.error("Lỗi", {
        description: "Không thể cập nhật trạng thái",
      });
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-5 gap-3.5 text-xs">
      {/* Top Header & Stats Summary Row */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#93631F]" />
            Quản Lý Nhân Viên
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Danh sách tài khoản nhân viên và phân quyền hệ thống
          </p>
        </div>

        {/* Compact Stat Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Tổng:</span>
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{stats.total}</span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Đang hoạt động:</span>
            <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">{stats.active}</span>
          </div>

          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 rounded-lg border border-rose-200/80 dark:border-rose-900/60">
            <XCircle className="h-4 w-4 text-rose-600" />
            <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">Vô hiệu hóa:</span>
            <span className="font-extrabold text-sm text-rose-800 dark:text-rose-300">{stats.inactive}</span>
          </div>

          <Button
            onClick={handleCreateEmployee}
            size="sm"
            className="h-9 text-xs font-bold px-4 bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs cursor-pointer ml-2"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            ref={searchInputRef}
            placeholder="Tìm kiếm theo tên, username, email, sđt..."
            className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{users.length}</span> / {totalCount} tài khoản
        </div>
      </div>

      {/* Main Table Area (Fit 10 rows seamlessly with comfortable vertical space) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300">
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 w-[140px]">Username</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 min-w-[160px]">Họ và tên</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 w-[210px] min-w-[210px]">Vai trò</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 min-w-[190px]">Email</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 w-[140px]">Số điện thoại</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 text-center w-[130px]">Trạng thái</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 text-right w-[80px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="h-11">
                    <TableCell colSpan={7} className="py-2">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-rose-500 font-medium">
                    Đã xảy ra lỗi khi tải danh sách nhân viên.
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Không tìm thấy nhân viên nào phù hợp.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors text-xs py-2.5 border-b border-slate-100 dark:border-slate-800/60"
                    onClick={() => handleViewEmployee(user.id!)}
                  >
                    <TableCell className="py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100 text-[13px]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#93631F] shrink-0" />
                        <span>{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 font-semibold text-slate-900 dark:text-slate-100 text-[13px]">
                      {user.fullName || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 w-[210px] min-w-[210px]">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-md border shadow-2xs whitespace-nowrap inline-flex items-center max-w-full truncate", getRoleBadgeStyle(user.role))}
                      >
                        <Shield className="h-3 w-3 mr-1 shrink-0" />
                        <span>{RoleLabels[user.role || ""] || user.role || "—"}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-slate-600 dark:text-slate-300 text-[13px]">
                      {user.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{user.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-slate-600 dark:text-slate-300 text-[13px]">
                      {user.phone ? (
                        <div className="flex items-center gap-2 font-mono">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge
                        className={cn(
                          "text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs whitespace-nowrap",
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
                            Vô hiệu hóa
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem
                            onClick={() => handleViewEmployee(user.id!)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditEmployee(user.id!)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            className="cursor-pointer"
                          >
                            {user.isActive ? (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordValue("");
                              setResetDialogOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Lock className="h-3.5 w-3.5 mr-2 text-amber-600" />
                            Reset mật khẩu (Admin)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteEmployee(user.id!)}
                            className="text-rose-600 focus:text-rose-600 cursor-pointer font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Xóa nhân viên
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Compact Footer Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 shrink-0">
            <div className="text-[11px] text-slate-500 font-medium">
              Trang <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span> / {totalPages} • Hiển thị{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{" "}
              trong tổng số <span className="font-bold text-slate-900 dark:text-slate-100">{totalCount}</span> nhân viên
            </div>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Trước
              </Button>
              <div className="flex items-center space-x-1 px-1">
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value, 10);
                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-12 h-7 text-center text-xs font-bold p-0"
                />
                <span className="text-[11px] text-slate-500 font-bold">
                  / {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Sau
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Lock className="h-4 w-4 text-amber-600" />
              Reset mật khẩu nhân viên
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Thiết lập mật khẩu mới cho tài khoản nhân viên. Mật khẩu phải có ít nhất 6 ký tự.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3 py-2">
              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                Đang reset cho: <strong className="text-slate-900">{selectedUser.fullName || selectedUser.username}</strong> (
                <span className="font-mono">{selectedUser.username}</span>)
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-bold">Mật khẩu mới *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="h-8 text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Vui lòng bàn giao trực tiếp mật khẩu mới cho nhân viên sau khi hoàn thành.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(false)}
              disabled={resettingPassword}
              className="h-8 text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResetPassword}
              disabled={resettingPassword}
              className="h-8 text-xs bg-[#93631F] hover:bg-[#7a521a] text-white font-bold"
            >
              {resettingPassword ? "Đang xử lý..." : "Xác nhận reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup Dialogs */}
      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EmployeeDetailDialog
        userId={selectedUserId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        initialEditing={isInitialEditing}
      />
    </div>
  );
}
