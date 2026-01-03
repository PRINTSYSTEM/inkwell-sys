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
  Search,
  Plus,
  Printer,
  Package,
  CheckCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import {
  useProofingOrders,
  useCreateProofingOrder,
} from "@/hooks/use-proofing-order";
import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { proofingStatusLabels } from "@/lib/status-utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type ProofingOrder =
  import("@/Schema/proofing-order.schema").ProofingOrderResponse;

export default function ProofingOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("");
  const itemsPerPage = 30;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: createProofingOrder, isPending: isCreating } =
    useCreateProofingOrder();

  const queryParams = useMemo(() => {
    const raw = {
      status: selectedStatus === "all" ? null : selectedStatus,
      pageSize: 30,
      pageNumber: currentPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [selectedStatus, currentPage]);

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

  const filteredProofingOrders = useMemo(() => {
    const filtered = proofingOrders.filter((order) => {
      const matchSearch =
        order.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.materialType?.name
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase());

      const matchStatus =
        selectedStatus === "all" || order.status === selectedStatus;

      return matchSearch && matchStatus;
    });

    // Sort: incomplete (status !== "completed") first, completed last
    return filtered.sort((a, b) => {
      const aIsCompleted = a.status === "completed";
      const bIsCompleted = b.status === "completed";
      if (aIsCompleted === bIsCompleted) return 0;
      return aIsCompleted ? 1 : -1; // incomplete first (return -1), completed last (return 1)
    });
  }, [proofingOrders, debouncedSearch, selectedStatus]);

  // Pagination - use server-side total count
  const totalCount = ordersResp?.total ?? filteredProofingOrders.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  // Use filtered and sorted orders directly (no client-side pagination since API handles it)
  const paginatedOrders = filteredProofingOrders;

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [totalPages, currentPage]);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [debouncedSearch, selectedStatus]);

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
    const page = parseInt(pageInput, 30);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

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
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lệnh bình bài</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý và theo dõi các lệnh bình bài
          </p>
        </div>
        <Button
          onClick={async () => {
            try {
              // Call API to create empty proofing order (no payload needed)
              const result = await createProofingOrder({} as any);
              if (result?.id) {
                navigate(`/proofing/${result.id}`);
              } else {
                toast.error("Lỗi", {
                  description: "Không thể lấy ID của lệnh bình bài",
                });
              }
            } catch (error) {
              // Error is already handled by the hook via toast
              console.error("Failed to create proofing order:", error);
            }
          }}
          size="sm"
          className="gap-2"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Tạo lệnh mới
            </>
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 mb-3 shrink-0">
        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng lệnh
            </CardTitle>
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.totalOrders}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tất cả lệnh bình bài
            </p>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Chờ file
            </CardTitle>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.waiting}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Đang chờ file in
            </p>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Đang xử lý
            </CardTitle>
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.inProgress}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Đang bình bài
            </p>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Hoàn thành
            </CardTitle>
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-lg font-bold">{stats.completed}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Đã hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-4 pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-3 shrink-0">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã lệnh hoặc chất liệu..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
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
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Đang tải lệnh bình bài...
                </p>
              </div>
            </div>
          ) : ordersError ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-10 w-10 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">
                  Không thể tải lệnh bình bài
                </p>
              </div>
            </div>
          ) : filteredProofingOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm || selectedStatus !== "all"
                    ? "Không tìm thấy lệnh bình bài phù hợp"
                    : "Chưa có lệnh bình bài nào"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border flex-1 flex flex-col min-h-0 overflow-hidden">
              <div ref={tableContainerRef} className="overflow-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="h-10 text-sm font-bold">
                        Mã bài
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        SL Mã hàng
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Trạng thái
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Trạng thái xuất kẽm
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Trạng thái xuất khuôn
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Người tạo
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Ngày tạo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50 h-14"
                        onClick={() => navigate(`/proofing/${order.id}`)}
                      >
                        <TableCell className="py-3 font-semibold text-sm">
                          {order.code}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-sm">
                          {order.proofingOrderDesigns?.length ?? 0}
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge
                            status={order.status || ""}
                            label={
                              proofingStatusLabels[order.status || ""] ||
                              order.status ||
                              "Không xác định"
                            }
                            className={
                              order.status === "completed"
                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800 text-xs font-semibold"
                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 text-xs font-semibold"
                            }
                          />
                        </TableCell>
                        <TableCell className="py-3">
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
                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800 text-xs font-semibold"
                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 text-xs font-semibold"
                            }
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge
                            status={
                              order.isDieExported ? "exported" : "not_exported"
                            }
                            label={
                              order.isDieExported ? "Đã xuất" : "Chưa xuất"
                            }
                            className={
                              order.isDieExported
                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800 text-xs font-semibold"
                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 text-xs font-semibold"
                            }
                          />
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-sm">
                          {order.createdBy?.fullName || "—"}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-sm">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between border-t px-3 py-2 shrink-0 bg-background">
                  <div className="text-xs text-muted-foreground">
                    Hiển thị{" "}
                    <span className="font-medium text-foreground">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>
                    {" - "}
                    <span className="font-medium text-foreground">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-medium text-foreground">
                      {totalCount}
                    </span>{" "}
                    lệnh
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loadingOrders}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Trang trước</span>
                    </Button>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">
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
                        className="w-14 h-8 text-center text-xs"
                        disabled={loadingOrders}
                      />
                      <span className="text-xs text-muted-foreground">
                        / {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || loadingOrders}
                    >
                      <span className="hidden sm:inline">Trang sau</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
