import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Factory,
  CheckCircle,
  Clock,
  Eye,
  Package,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "use-debounce";
import { useProductions, useCreateProduction } from "@/hooks/use-production";
import {
  ProductionResponse,
  ProductionResponsePagedResponseSchema,
  safeParseSchema,
  type ProductionListParams,
} from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { productionStatusLabels } from "@/lib/status-utils";

export default function ProductionListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [proofingOrderId, setProofingOrderId] = useState("");
  const [productionLeadId, setProductionLeadId] = useState("");
  const [notes, setNotes] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const queryParams = useMemo<ProductionListParams>(() => {
    const params: ProductionListParams = {
      pageNumber: 1,
      pageSize: 100,
    };
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }
    return params;
  }, [selectedStatus]);

  const {
    data: productionsResp,
    isLoading,
    error,
  } = useProductions(queryParams);

  const parseProdResp = safeParseSchema(
    ProductionResponsePagedResponseSchema,
    productionsResp
  );

  // Memoize productions to prevent dependency warnings
  const productions = useMemo<ProductionResponse[]>(
    () => parseProdResp?.items || [],
    [parseProdResp?.items]
  );

  const { mutate: createProduction, isPending: creating } =
    useCreateProduction();

  const filteredProductions = useMemo(
    () =>
      productions?.filter((prod: ProductionResponse) => {
        const search = debouncedSearch.toLowerCase().trim();

        const matchSearch =
          search.length === 0 ||
          String(prod.id ?? "")
            .toLowerCase()
            .includes(search) ||
          (prod.productionLead?.fullName ?? "").toLowerCase().includes(search);

        const matchStatus =
          selectedStatus === "all" || prod.status === selectedStatus;

        return matchSearch && matchStatus;
      }),
    [productions, debouncedSearch, selectedStatus]
  );

  const handleCreateProduction = async () => {
    if (!proofingOrderId || !productionLeadId) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    try {
      await createProduction({
        proofingOrderId: Number(proofingOrderId),
        productionLeadId: Number(productionLeadId),
        notes: notes || undefined,
      });
      setIsCreateDialogOpen(false);
      setProofingOrderId("");
      setProductionLeadId("");
      setNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const stats = useMemo(
    () => ({
      total: productions?.length || 0,
      pending: productions?.filter((p) => p.status === "pending").length || 0,
      inProgress:
        productions?.filter((p) => p.status === "in_progress").length || 0,
      completed:
        productions?.filter((p) => p.status === "completed").length || 0,
    }),
    [productions]
  );

  const formatDate = (dateStr?: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Quản lý Sản xuất</h1>
          <p className="text-muted-foreground text-pretty">
            Theo dõi và quản lý tiến độ sản xuất
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo đơn sản xuất
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total}</div>
            <p className="text-xs text-muted-foreground">Tất cả đơn sản xuất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ sản xuất</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Chưa bắt đầu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang sản xuất</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Đang thực hiện</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo ID hoặc người phụ trách..."
                  className="pl-10 w-72"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ sản xuất</SelectItem>
                  <SelectItem value="in_progress">Đang sản xuất</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="on_hold">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Đang tải đơn sản xuất...
              </p>
            </div>
          ) : filteredProductions.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Không tìm thấy đơn sản xuất nào
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Người phụ trách</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Bắt đầu</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductions.map((prod: ProductionResponse) => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-medium">
                        {prod.id ?? "N/A"}
                      </TableCell>

                      <TableCell>
                        {prod.productionLead?.fullName || "Chưa phân công"}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${prod.progressPercent || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {prod.progressPercent || 0}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={prod.status || "pending"}
                          label={
                            productionStatusLabels[prod.status || "pending"] ||
                            prod.status ||
                            "N/A"
                          }
                        />
                      </TableCell>

                      <TableCell>{formatDate(prod.startedAt)}</TableCell>
                      <TableCell>{formatDate(prod.completedAt)}</TableCell>
                      <TableCell>{formatDate(prod.createdAt)}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/productions/${prod.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo đơn sản xuất mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo đơn sản xuất từ lệnh bình bài
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ID Lệnh bình bài</Label>
              <Input
                type="number"
                placeholder="Nhập ID lệnh bình bài"
                value={proofingOrderId}
                onChange={(e) => setProofingOrderId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>ID Người phụ trách sản xuất</Label>
              <Input
                type="number"
                placeholder="Nhập ID người phụ trách"
                value={productionLeadId}
                onChange={(e) => setProductionLeadId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                placeholder="Nhập ghi chú cho đơn sản xuất..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateProduction} disabled={creating}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Đang tạo..." : "Tạo đơn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
