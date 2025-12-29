import { useState } from "react";
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
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useStockIns,
  useDeleteStockIn,
  useCompleteStockIn,
  useCancelStockIn,
} from "@/hooks/use-stock";
import { formatDate } from "@/lib/status-utils";
import { toast } from "sonner";

export default function StockInListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useStockIns({
    pageNumber: page,
    pageSize,
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const { mutate: deleteStockIn } = useDeleteStockIn();
  const { mutate: completeStockIn } = useCompleteStockIn();
  const { mutate: cancelStockIn } = useCancelStockIn();

  const stockIns = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa phiếu nhập kho này?")) {
      deleteStockIn(id);
    }
  };

  const handleComplete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn hoàn thành phiếu nhập kho này?")) {
      completeStockIn(id);
    }
  };

  const handleCancel = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn hủy phiếu nhập kho này?")) {
      cancelStockIn(id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý nhập kho</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các phiếu nhập kho vật liệu
          </p>
        </div>
        <Button onClick={() => navigate("/stock/stock-ins/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo phiếu nhập kho
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={typeFilter || "all"}
              onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại phiếu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="purchase">Mua hàng</SelectItem>
                <SelectItem value="return">Trả hàng</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : stockIns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có phiếu nhập kho nào
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phiếu</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Ngày nhập</TableHead>
                    <TableHead>Nhà cung cấp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockIns.map((stockIn) => (
                    <TableRow key={stockIn.id}>
                      <TableCell className="font-medium">
                        {stockIn.code || `PNK-${stockIn.id}`}
                      </TableCell>
                      <TableCell>{stockIn.type || "—"}</TableCell>
                      <TableCell>
                        {stockIn.stockInDate
                          ? formatDate(stockIn.stockInDate)
                          : "—"}
                      </TableCell>
                      <TableCell>{stockIn.supplier?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stockIn.status === "completed"
                              ? "default"
                              : stockIn.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {stockIn.status === "completed"
                            ? "Hoàn thành"
                            : stockIn.status === "cancelled"
                              ? "Đã hủy"
                              : "Chờ xử lý"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {stockIn.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/stock/stock-ins/${stockIn.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {stockIn.status !== "completed" &&
                            stockIn.status !== "cancelled" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleComplete(stockIn.id)}
                                  title="Hoàn thành"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCancel(stockIn.id)}
                                  title="Hủy"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(stockIn.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
