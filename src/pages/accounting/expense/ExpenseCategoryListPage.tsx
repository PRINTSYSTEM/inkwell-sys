import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ExpenseCategoryModal } from "@/components/accounting/expense/ExpenseCategoryModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  useExpenseCategories,
  useDeleteExpenseCategory,
} from "@/hooks/use-expense";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function ExpenseCategoryListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const {
    data: categoriesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useExpenseCategories({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
  });

  const deleteCategoryMutation = useDeleteExpenseCategory();

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục chi phí này?")) {
      try {
        await deleteCategoryMutation.mutateAsync(id);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Danh mục chi phí | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý danh mục chi phí trong hệ thống"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Danh mục chi phí
            </h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các danh mục chi phí
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCategoryId(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo danh mục mới
          </Button>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã, tên danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã danh mục</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">Ngày tạo</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !categoriesData?.items || categoriesData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy danh mục chi phí nào.
                  </TableCell>
                </TableRow>
              ) : (
                categoriesData.items.map((category) => (
                  <TableRow key={category.id} className="group">
                    <TableCell className="font-medium font-mono text-sm">
                      {category.code || `#${category.id}`}
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-md truncate">
                        {category.description || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isActive ? (
                        <Badge variant="default">Đang hoạt động</Badge>
                      ) : (
                        <Badge variant="secondary">Ngừng hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {category.createdAt ? formatDate(category.createdAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingCategoryId(category.id || null);
                              setModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
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

        {/* Pagination */}
        {categoriesData && categoriesData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {categoriesData.totalPages} (
              {categoriesData.total} danh mục)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <RefreshCw className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {categoriesData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(categoriesData.totalPages, p + 1))
                }
                disabled={currentPage === categoriesData.totalPages || isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expense Category Modal */}
        <ExpenseCategoryModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setEditingCategoryId(null);
            }
          }}
          categoryId={editingCategoryId}
          onSuccess={() => {
            refetch();
          }}
        />
      </div>
    </>
  );
}

