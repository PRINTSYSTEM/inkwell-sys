import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { PaymentMethodModal } from "@/components/accounting/payment-method/PaymentMethodModal";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePaymentMethods, useDeletePaymentMethod } from "@/hooks/use-expense";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function PaymentMethodListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<number | null>(null);

  const {
    data: methodsData,
    isLoading,
    isError,
    error,
    refetch,
  } = usePaymentMethods({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
  });

  const deleteMethodMutation = useDeletePaymentMethod();

  const handleDelete = async (id: number | undefined, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!id) return;
    if (
      window.confirm("Bạn có chắc chắn muốn xóa phương thức thanh toán này?")
    ) {
      try {
        await deleteMethodMutation.mutateAsync(id);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const handleEdit = (id: number | undefined, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (id) {
      setEditingMethodId(id);
      setModalOpen(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>Phương thức thanh toán | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý phương thức thanh toán trong hệ thống"
        />
      </Helmet>

      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="flex-shrink-0 px-6 py-3 border-b bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Phương thức thanh toán
              </h1>
              <p className="text-xs text-muted-foreground">
                Quản lý và theo dõi các phương thức thanh toán
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingMethodId(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo phương thức mới
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <div className="flex-shrink-0 px-6 py-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi kết nối</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Không thể tải dữ liệu. Vui lòng thử lại."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Filters - Compact */}
        <div className="flex-shrink-0 px-6 py-2 border-b bg-background">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã, tên phương thức..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Table - Expanded to fill space */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto border-t">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="w-[140px] font-semibold">Mã phương thức</TableHead>
                  <TableHead className="font-semibold">Tên phương thức</TableHead>
                  <TableHead className="font-semibold">Mô tả</TableHead>
                  <TableHead className="text-center font-semibold">Trạng thái</TableHead>
                  <TableHead className="text-center font-semibold">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !methodsData?.items || methodsData.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy phương thức thanh toán nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  methodsData.items.map((method) => (
                    <TableRow
                      key={method.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEdit(method.id)}
                    >
                      <TableCell className="font-semibold font-mono text-sm">
                        {method.code || `#${method.id}`}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {method.name || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-muted-foreground max-w-md truncate">
                          {method.description || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {method.isActive ? (
                          <Badge variant="default" className="font-medium">Đang hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary" className="font-medium">Ngừng hoạt động</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-muted-foreground">
                        {method.createdAt ? formatDate(method.createdAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - Compact */}
          {methodsData && methodsData.totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
              <p className="text-xs text-muted-foreground">
                Trang {currentPage} / {methodsData.totalPages} (
                {methodsData.total} phương thức)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-2">
                  {currentPage} / {methodsData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(methodsData.totalPages, p + 1))
                  }
                  disabled={currentPage === methodsData.totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setEditingMethodId(null);
            }
          }}
          methodId={editingMethodId}
          onSuccess={() => {
            refetch();
          }}
        />
      </div>
    </>
  );
}
