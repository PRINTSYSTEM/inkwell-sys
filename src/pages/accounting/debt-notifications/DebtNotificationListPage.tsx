import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
import { useDebtNotifications } from "@/hooks/use-debt-notification";
import { formatCurrency } from "@/lib/status-utils";
import { DebtNotificationModal } from "@/components/accounting/debt-notifications/DebtNotificationModal";
import { DebtNotificationPreviewDialog } from "@/components/accounting/debt-notifications/DebtNotificationPreviewDialog";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function DebtNotificationListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useDebtNotifications({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    searchTerm: searchQuery || "",
  });

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">—</Badge>;
    const statusLower = status.toLowerCase();
    if (statusLower === "draft") {
      return <Badge variant="outline">Nháp</Badge>;
    }
    if (statusLower === "sent") {
      return <Badge variant="default" className="bg-green-600">Đã gửi</Badge>;
    }
    if (statusLower === "failed") {
      return <Badge variant="destructive">Thất bại</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="h-auto flex flex-col overflow-hidden">
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

      {/* Header with Create Button */}
      <div className="flex-shrink-0 px-6 py-3 border-b bg-background flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Thông báo công nợ
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản lý thông báo và nhắc nợ khách hàng
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo thông báo
        </Button>
      </div>

      {/* Filters - Compact */}
      <div className="flex-shrink-0 px-6 py-2 space-y-2 border-b bg-background">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã, tên thông báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
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
      </div>

      {/* Table - Expanded to fill space */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto border-t">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-[140px] font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Loại</TableHead>
                <TableHead className="text-center font-semibold">Ngày tạo</TableHead>
                <TableHead className="font-semibold">Tiêu đề</TableHead>
                <TableHead className="text-center font-semibold">Trạng thái</TableHead>
                <TableHead className="text-center font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !notificationsData?.items || notificationsData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy thông báo công nợ nào.
                  </TableCell>
                </TableRow>
              ) : (
                notificationsData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold font-mono text-sm">
                      {item.id || "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {item.type === "AR" ? "Công nợ phải thu" : "Công nợ phải trả"}
                    </TableCell>
                    <TableCell className="text-center font-semibold tabular-nums text-sm">
                      {item.createdAt ? formatDate(item.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.subject || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.sentAt ? (
                        <span className="text-green-600">Đã gửi</span>
                      ) : (
                        <span className="text-gray-500">Chưa gửi</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => item.id && setPreviewId(item.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Compact */}
        {notificationsData && notificationsData.totalPages > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
            <p className="text-xs text-muted-foreground">
              Trang {currentPage} / {notificationsData.totalPages} ({notificationsData.total} thông báo)
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
                {currentPage} / {notificationsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(notificationsData.totalPages, p + 1))
                }
                disabled={currentPage === notificationsData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <DebtNotificationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      {/* Preview Dialog */}
      {previewId && (
        <DebtNotificationPreviewDialog
          open={!!previewId}
          onOpenChange={(open) => !open && setPreviewId(null)}
          notificationId={previewId}
        />
      )}
    </div>
  );
}
