import { useMemo, useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Factory,
  CheckCircle,
  Clock,
  Package,
  Loader2,
  FileText,
  User,
  Layers,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { useProductions, useCreateProduction } from "@/hooks/use-production";
import { useProofingOrdersForProduction } from "@/hooks/use-proofing-order";
import { useAuth } from "@/hooks/use-auth";
import {
  ProductionResponse,
  ProductionResponsePaginateSchema,
  safeParseSchema,
  type ProductionListParams,
  type ProofingOrderResponse,
} from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { productionStatusLabels } from "@/lib/status-utils";

export default function ProductionListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProofingOrderId, setSelectedProofingOrderId] = useState<
    number | null
  >(null);
  const [notes, setNotes] = useState("");
  const [proofingSearchTerm, setProofingSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [debouncedProofingSearch] = useDebounce(proofingSearchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [itemsPerPage] = useState(10);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const queryParams = useMemo<ProductionListParams>(() => {
    const params: ProductionListParams = {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
    };
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }
    return params;
  }, [currentPage, itemsPerPage, selectedStatus]);

  const {
    data: productionsResp,
    isLoading,
    error,
  } = useProductions(queryParams);

  // Try to parse with schema, but fallback to raw data if validation fails
  // Similar to plate export issue - API returns 200 but schema validation might fail
  const parseProdResp = safeParseSchema(
    ProductionResponsePaginateSchema,
    productionsResp
  );

  // Memoize productions to prevent dependency warnings
  // Use raw data if schema validation fails (API returned 200 but schema is too strict)
  const productions = useMemo<ProductionResponse[]>(() => {
    if (parseProdResp?.items) {
      return parseProdResp.items;
    }
    // Fallback to raw data if parse failed but we have data
    if (
      productionsResp &&
      typeof productionsResp === "object" &&
      "items" in productionsResp
    ) {
      const rawItems = (productionsResp as { items?: unknown[] }).items;
      if (Array.isArray(rawItems)) {
        console.warn(
          "Schema validation failed for productions response, using raw data:",
          productionsResp
        );
        return rawItems as ProductionResponse[];
      }
    }
    return [];
  }, [parseProdResp?.items, productionsResp]);

  // Get total count and total pages from API response
  const totalCount = useMemo(() => {
    if (parseProdResp?.total !== undefined) {
      return parseProdResp.total;
    }
    if (
      productionsResp &&
      typeof productionsResp === "object" &&
      "total" in productionsResp
    ) {
      return (productionsResp as { total?: number }).total ?? 0;
    }
    return productions.length;
  }, [parseProdResp?.total, productionsResp, productions.length]);

  const totalPages = useMemo(() => {
    if (parseProdResp?.totalPages !== undefined) {
      return parseProdResp.totalPages;
    }
    if (
      productionsResp &&
      typeof productionsResp === "object" &&
      "totalPages" in productionsResp
    ) {
      return (productionsResp as { totalPages?: number }).totalPages ?? 1;
    }
    return Math.ceil(totalCount / itemsPerPage);
  }, [parseProdResp?.totalPages, productionsResp, totalCount, itemsPerPage]);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [totalPages, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [selectedStatus]);

  const { mutate: createProduction, isPending: creating } =
    useCreateProduction();

  // Fetch proofing orders waiting for production
  const { data: proofingOrdersResp, isLoading: isLoadingProofingOrders } =
    useProofingOrdersForProduction({
      pageNumber: 1,
      pageSize: 100,
    });

  const proofingOrders = useMemo<ProofingOrderResponse[]>(
    () => proofingOrdersResp?.items || [],
    [proofingOrdersResp?.items]
  );

  // Filter proofing orders by search term
  const filteredProofingOrders = useMemo(() => {
    if (!debouncedProofingSearch.trim()) {
      return proofingOrders;
    }

    const search = debouncedProofingSearch.toLowerCase().trim();
    return proofingOrders.filter((order) => {
      const codeMatch = order.code?.toLowerCase().includes(search);
      const materialMatch = order.materialType?.name
        ?.toLowerCase()
        .includes(search);
      const creatorMatch = order.createdBy?.fullName
        ?.toLowerCase()
        .includes(search);
      const designMatch = order.proofingOrderDesigns?.some(
        (pod) =>
          pod.design?.designName?.toLowerCase().includes(search) ||
          pod.design?.code?.toLowerCase().includes(search)
      );
      const idMatch = order.id?.toString().includes(search);

      return (
        codeMatch || materialMatch || creatorMatch || designMatch || idMatch
      );
    });
  }, [proofingOrders, debouncedProofingSearch]);

  // Get selected proofing order details
  const selectedProofingOrder = useMemo(() => {
    if (!selectedProofingOrderId) return null;
    return (
      proofingOrders.find((order) => order.id === selectedProofingOrderId) ||
      null
    );
  }, [proofingOrders, selectedProofingOrderId]);

  // Client-side search filter (since API doesn't support search parameter)
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleProductionClick = (productionId: number) => {
    navigate(`/productions/${productionId}`);
  };

  const handleCreateProduction = async () => {
    if (!selectedProofingOrderId) {
      toast.error("Thiếu thông tin", {
        description: "Vui lòng chọn một bình bài để tạo lệnh sản xuất",
      });
      return;
    }

    if (!user?.id) {
      toast.error("Lỗi xác thực", {
        description: "Không thể lấy thông tin người dùng",
      });
      return;
    }

    try {
      await createProduction({
        proofingOrderId: selectedProofingOrderId,
        productionLeadId: user.id,
        notes: notes || undefined,
      });
      setIsCreateDialogOpen(false);
      setSelectedProofingOrderId(null);
      setNotes("");
      setProofingSearchTerm("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatDateTime = (dateStr?: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const stats = useMemo(
    () => ({
      total: totalCount,
      pending: productions?.filter((p) => p.status === "pending").length || 0,
      inProgress:
        productions?.filter((p) => p.status === "in_progress").length || 0,
      completed:
        productions?.filter((p) => p.status === "completed").length || 0,
    }),
    [totalCount, productions]
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
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-balance">
              Quản lý Sản xuất
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi và quản lý tiến độ sản xuất
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tạo đơn sản xuất
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 shrink-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-medium">
                Tổng đơn
              </CardTitle>
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg font-bold">{stats?.total}</div>
              <p className="text-[10px] text-muted-foreground">
                Tất cả đơn sản xuất
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-medium">
                Chờ sản xuất
              </CardTitle>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg font-bold">{stats?.pending || 0}</div>
              <p className="text-[10px] text-muted-foreground">Chưa bắt đầu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-medium">
                Đang sản xuất
              </CardTitle>
              <Factory className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg font-bold">{stats.inProgress}</div>
              <p className="text-[10px] text-muted-foreground">
                Đang thực hiện
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-medium">
                Hoàn thành
              </CardTitle>
              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg font-bold">{stats.completed}</div>
              <p className="text-[10px] text-muted-foreground">Đã hoàn thành</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-0 shadow-sm mb-4 shrink-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo ID hoặc người phụ trách..."
                  className="pl-10 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40 h-9 bg-muted/50 border-0">
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
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-0 shadow-sm">
          <div ref={tableContainerRef} className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Đang tải đơn sản xuất...
                </p>
              </div>
            ) : filteredProductions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Factory className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy đơn sản xuất nào
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-10 font-bold text-sm">ID</TableHead>
                    <TableHead className="h-10 font-bold text-sm">
                      Người phụ trách
                    </TableHead>
                    <TableHead className="h-10 font-bold text-sm">
                      Tiến độ
                    </TableHead>
                    <TableHead className="h-10 font-bold text-sm">
                      Trạng thái
                    </TableHead>
                    <TableHead className="h-10 font-bold text-sm">
                      Bắt đầu
                    </TableHead>
                    <TableHead className="h-10 font-bold text-sm">
                      Hoàn thành
                    </TableHead>
                    <TableHead className="h-10 font-bold text-sm">
                      Ngày tạo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductions.map((prod: ProductionResponse) => (
                    <TableRow
                      key={prod.id}
                      className="h-14 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleProductionClick(prod.id!)}
                    >
                      <TableCell className="py-3">
                        <span className="font-bold text-sm">
                          {prod.id ?? "N/A"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-semibold text-sm">
                          {prod.productionLead?.fullName || "Chưa phân công"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${prod.progressPercent || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold">
                            {prod.progressPercent || 0}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <StatusBadge
                          status={prod.status || "pending"}
                          label={
                            productionStatusLabels[prod.status || "pending"] ||
                            prod.status ||
                            "N/A"
                          }
                        />
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-semibold text-sm">
                          {formatDate(prod.startedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-semibold text-sm">
                          {formatDate(prod.completedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-semibold text-sm">
                          {formatDate(prod.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredProductions.length > 0 && totalCount > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 shrink-0 bg-background">
              <div className="text-sm font-medium text-muted-foreground">
                {searchTerm.trim() ? (
                  <>
                    Hiển thị {filteredProductions.length} / {totalCount} đơn sản
                    xuất (đã lọc theo từ khóa)
                  </>
                ) : (
                  <>
                    Hiển thị{" "}
                    <span className="font-bold text-foreground">
                      {productions.length > 0
                        ? (currentPage - 1) * itemsPerPage + 1
                        : 0}
                    </span>
                    {" - "}
                    <span className="font-bold text-foreground">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-bold text-foreground">
                      {totalCount}
                    </span>{" "}
                    đơn sản xuất
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Trang trước</span>
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Trang
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onBlur={handlePageInputBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-14 h-8 text-center text-sm font-semibold"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setSelectedProofingOrderId(null);
            setNotes("");
            setProofingSearchTerm("");
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl">Tạo đơn sản xuất mới</DialogTitle>
            <DialogDescription>
              Chọn một bình bài đang chờ sản xuất để tạo lệnh sản xuất
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left Panel: Proofing Orders List */}
            <div className="flex-1 flex flex-col border-r overflow-hidden">
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo mã, vật liệu, người tạo, thiết kế..."
                    className="pl-10"
                    value={proofingSearchTerm}
                    onChange={(e) => setProofingSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {filteredProofingOrders.length} bình bài
                    {debouncedProofingSearch &&
                      ` (${proofingOrders.length} tổng cộng)`}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingProofingOrders ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Đang tải danh sách bình bài...
                    </p>
                  </div>
                ) : filteredProofingOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      {debouncedProofingSearch
                        ? "Không tìm thấy bình bài nào phù hợp"
                        : "Không có bình bài nào đang chờ sản xuất"}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Mã bình bài</TableHead>
                          <TableHead>Vật liệu</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Người tạo</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProofingOrders.map((order) => {
                          const isSelected =
                            selectedProofingOrderId === order.id;
                          return (
                            <TableRow
                              key={order.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/10 hover:bg-primary/15"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() =>
                                setSelectedProofingOrderId(order.id || null)
                              }
                            >
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  {isSelected ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{order.code || `BB${order.id}`}</span>
                                  <StatusBadge
                                    status={
                                      order.status || "waiting_for_production"
                                    }
                                    label={
                                      order.status === "waiting_for_production"
                                        ? "Chờ sản xuất"
                                        : order.status || ""
                                    }
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {order.materialType?.name || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {order.totalQuantity || 0}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {order.createdBy?.fullName || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(order.createdAt)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Selected Order Details */}
            <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l">
              {selectedProofingOrder ? (
                <>
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-semibold text-lg mb-1">
                      Chi tiết bình bài
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProofingOrder.code ||
                        `BB${selectedProofingOrder.id}`}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Layers className="h-3 w-3" />
                          Vật liệu
                        </Label>
                        <p className="text-sm font-medium">
                          {selectedProofingOrder.materialType?.name || "N/A"}
                        </p>
                        {selectedProofingOrder.materialType?.code && (
                          <p className="text-xs text-muted-foreground">
                            {selectedProofingOrder.materialType.code}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Package className="h-3 w-3" />
                          Tổng số lượng
                        </Label>
                        <p className="text-sm font-medium">
                          {selectedProofingOrder.totalQuantity || 0} sản phẩm
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <User className="h-3 w-3" />
                          Người tạo
                        </Label>
                        <p className="text-sm font-medium">
                          {selectedProofingOrder.createdBy?.fullName || "N/A"}
                        </p>
                        {selectedProofingOrder.createdBy?.email && (
                          <p className="text-xs text-muted-foreground">
                            {selectedProofingOrder.createdBy.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          Ngày tạo
                        </Label>
                        <p className="text-sm">
                          {formatDateTime(selectedProofingOrder.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Designs */}
                    {selectedProofingOrder.proofingOrderDesigns &&
                      selectedProofingOrder.proofingOrderDesigns.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Thiết kế (
                            {selectedProofingOrder.proofingOrderDesigns.length})
                          </Label>
                          <div className="space-y-2">
                            {selectedProofingOrder.proofingOrderDesigns.map(
                              (pod) => (
                                <Card key={pod.id} className="p-3">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      {pod.design?.designName ||
                                        pod.design?.code ||
                                        "N/A"}
                                    </p>
                                    {pod.design?.code && (
                                      <p className="text-xs text-muted-foreground">
                                        Mã: {pod.design.code}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline">
                                        Số lượng: {pod.quantity}
                                      </Badge>
                                      {pod.design?.dimensions && (
                                        <Badge variant="outline">
                                          {pod.design.dimensions}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Notes */}
                    {selectedProofingOrder.notes && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Ghi chú bình bài
                        </Label>
                        <Card className="p-3 bg-muted/30">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedProofingOrder.notes}
                          </p>
                        </Card>
                      </div>
                    )}

                    {/* Production Notes Input */}
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="production-notes">
                        Ghi chú cho lệnh sản xuất (tùy chọn)
                      </Label>
                      <Textarea
                        id="production-notes"
                        placeholder="Nhập ghi chú cho đơn sản xuất..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Chưa chọn bình bài</p>
                  <p className="text-xs text-muted-foreground">
                    Vui lòng chọn một bình bài từ danh sách bên trái để xem chi
                    tiết
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-background">
            <div className="flex items-center gap-3 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedProofingOrderId(null);
                  setNotes("");
                  setProofingSearchTerm("");
                }}
                className="flex-shrink-0"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateProduction}
                disabled={creating || !selectedProofingOrderId}
                className="flex-shrink-0 min-w-[140px]"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo đơn sản xuất
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
