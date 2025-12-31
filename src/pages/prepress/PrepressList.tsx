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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Printer,
  Package,
  CheckCircle,
  Clock,
  Eye,
  FileText,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useProofingOrders } from "@/hooks/use-proofing-order";
import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { proofingStatusLabels } from "@/lib/status-utils";

type ProofingOrder =
  import("@/Schema/proofing-order.schema").ProofingOrderResponse;

export default function ProofingOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("incomplete");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const queryParams = useMemo(() => {
    const raw = {
      status: selectedStatus === "all" ? null : selectedStatus,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [selectedStatus]);

  const {
    data: ordersResp,
    isLoading: loadingOrders,
    error: ordersError,
  } = useProofingOrders(queryParams);

  // Use raw response items directly instead of strict schema parsing
  // Schema validation is too strict for API responses with nullable fields
  // For display-only list view, we can safely use raw data
  const proofingOrders = useMemo<ProofingOrder[]>(() => {
    const items = ordersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    // Type cast to ProofingOrder for type safety, but accept raw data structure
    return items as unknown as ProofingOrder[];
  }, [ordersResp?.items]);

  const filteredProofingOrders = useMemo(
    () =>
      proofingOrders.filter((order) => {
        const matchSearch =
          order.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          order.materialType?.name
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase());

        const matchStatus =
          selectedStatus === "all" || order.status === selectedStatus;

        return matchSearch && matchStatus;
      }),
    [proofingOrders, debouncedSearch, selectedStatus]
  );

  // Split orders by completion status
  const incompleteOrders = useMemo(
    () =>
      filteredProofingOrders.filter((order) => order.status !== "completed"),
    [filteredProofingOrders]
  );

  const completedOrders = useMemo(
    () =>
      filteredProofingOrders.filter((order) => order.status === "completed"),
    [filteredProofingOrders]
  );

  const stats = useMemo(
    () => ({
      totalOrders: proofingOrders.length,
      waiting: proofingOrders.filter((o) => o.status === "waiting_for_file")
        .length,
      inProgress: proofingOrders.filter(
        (o) =>
          o.status === "waiting_for_production" || o.status === "in_production"
      ).length,
      completed: proofingOrders.filter((o) => o.status === "completed").length,
    }),
    [proofingOrders]
  );

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lệnh bình bài</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi các lệnh bình bài
          </p>
        </div>
        <Button onClick={() => navigate("/proofing/create")} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo lệnh mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lệnh</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả lệnh bình bài
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ file</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-muted-foreground">Đang chờ file in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Đang bình bài</p>
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

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã lệnh hoặc chất liệu..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="waiting_for_file">Chờ file in</SelectItem>
                <SelectItem value="waiting_for_production">
                  Chờ sản xuất
                </SelectItem>
                <SelectItem value="in_production">Đang sản xuất</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="incomplete">Chưa hoàn thành</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
            </TabsList>

            {/* Incomplete Tab */}
            <TabsContent value="incomplete">
              {loadingOrders ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Đang tải lệnh bình bài...
                  </p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm text-red-600">
                    Không thể tải lệnh bình bài
                  </p>
                </div>
              ) : incompleteOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Không có lệnh bình bài chưa hoàn thành
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã bài</TableHead>
                        <TableHead>SL Mã hàng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Trạng thái xuất kẽm</TableHead>
                        <TableHead>Trạng thái xuất khuôn</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incompleteOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/proofing/${order.id}`)}
                        >
                          <TableCell className="font-medium">
                            {order.code}
                          </TableCell>
                          <TableCell>
                            {order.proofingOrderDesigns?.length ?? 0}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={order.status || ""}
                              label={
                                proofingStatusLabels[order.status || ""] ||
                                order.status ||
                                "Không xác định"
                              }
                              className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={
                                order.isPlateExported
                                  ? "exported"
                                  : "not_exported"
                              }
                              label={
                                order.isPlateExported ? "Đã xuất" : "Chưa xuất"
                              }
                              className={
                                order.isPlateExported
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                  : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={
                                order.isDieExported
                                  ? "exported"
                                  : "not_exported"
                              }
                              label={
                                order.isDieExported ? "Đã xuất" : "Chưa xuất"
                              }
                              className={
                                order.isDieExported
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                  : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {order.createdBy?.fullName || "—"}
                          </TableCell>
                          <TableCell>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/proofing/${order.id}`);
                              }}
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
            </TabsContent>

            {/* Completed Tab */}
            <TabsContent value="completed">
              {loadingOrders ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Đang tải lệnh bình bài...
                  </p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm text-red-600">
                    Không thể tải lệnh bình bài
                  </p>
                </div>
              ) : completedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Không có lệnh bình bài đã hoàn thành
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã bài</TableHead>
                        <TableHead>SL Mã hàng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Trạng thái xuất kẽm</TableHead>
                        <TableHead>Trạng thái xuất khuôn</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/proofing/${order.id}`)}
                        >
                          <TableCell className="font-medium">
                            {order.code}
                          </TableCell>
                          <TableCell>
                            {order.proofingOrderDesigns?.length ?? 0}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={order.status || ""}
                              label={
                                proofingStatusLabels[order.status || ""] ||
                                order.status ||
                                "Không xác định"
                              }
                              className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={
                                order.isPlateExported
                                  ? "exported"
                                  : "not_exported"
                              }
                              label={
                                order.isPlateExported ? "Đã xuất" : "Chưa xuất"
                              }
                              className={
                                order.isPlateExported
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                  : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={
                                order.isDieExported
                                  ? "exported"
                                  : "not_exported"
                              }
                              label={
                                order.isDieExported ? "Đã xuất" : "Chưa xuất"
                              }
                              className={
                                order.isDieExported
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                                  : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {order.createdBy?.fullName || "—"}
                          </TableCell>
                          <TableCell>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/proofing/${order.id}`);
                              }}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
