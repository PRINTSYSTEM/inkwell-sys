"use client";

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
  const proofingOrders = useMemo<ProofingOrder[]>(
    () => {
      const items = ordersResp?.items;
      if (!items || !Array.isArray(items)) return [];
      // Type cast to ProofingOrder for type safety, but accept raw data structure
      return items as unknown as ProofingOrder[];
    },
    [ordersResp?.items]
  );

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

          {/* Table */}
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
          ) : filteredProofingOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Không tìm thấy lệnh bình bài nào
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lệnh</TableHead>
                    <TableHead>Chất liệu</TableHead>
                    <TableHead>Số design</TableHead>
                    <TableHead>Tổng số lượng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người tạo</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProofingOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/proofing/${order.id}`)}
                    >
                      <TableCell className="font-medium">
                        {order.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {order.materialType?.name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order.materialType?.code || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.proofingOrderDesigns?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        {order.totalQuantity?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={order.status || ""}
                          label={
                            proofingStatusLabels[order.status || ""] ||
                            order.status ||
                            "Không xác định"
                          }
                        />
                      </TableCell>
                      <TableCell>{order.createdBy?.fullName || "—"}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
