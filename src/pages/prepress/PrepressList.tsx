import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Factory,
  ChevronLeft,
  ChevronRight,
  Layers,
  Box,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import type {
  ProofingOrderResponse,
  ProofingOrderResponsePagedResponse,
  DesignResponse,
} from "@/Schema";

// ================= MOCK DATA =================

// Mock designs thuộc các đơn hàng, trạng thái: chờ bình bài / chờ sản xuất / hoàn thành
const mockDesigns: DesignResponse[] = [
  {
    id: 1,
    code: "DES-001",
    designName: "Bao bì NPK 16-16-8",
    designStatus: "waiting_for_prepress",
    quantity: 10000,
    dimensions: "500x700mm",
    designType: {
      id: 1,
      name: "Bao bì phân bón",
      code: "PKG",
      description: "Bao bì cho sản phẩm phân bón",
    } as any,
    materialType: {
      id: 1,
      name: "Giấy couche 150gsm",
      code: "C150",
      description: "Giấy couche định lượng 150gsm",
    } as any,
    orderId: 101,
    // field này có thể không có trong schema, dùng any cho mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  {
    id: 2,
    code: "DES-002",
    designName: "Túi đựng thức ăn chăn nuôi 25kg",
    designStatus: "waiting_for_production",
    quantity: 8000,
    dimensions: "600x900mm",
    designType: {
      id: 1,
      name: "Bao bì phân bón",
      code: "PKG",
      description: "Bao bì dạng bao PP, PE",
    } as any,
    materialType: {
      id: 2,
      name: "Bao dệt PP tráng PE",
      code: "PPPE",
      description: "Bao dệt PP, tráng PE trong",
    } as any,
    orderId: 102,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  {
    id: 3,
    code: "DES-003",
    designName: "Tem nhãn chai thuốc BVTV",
    designStatus: "completed",
    quantity: 50000,
    dimensions: "80x120mm",
    designType: {
      id: 2,
      name: "Tem nhãn chai",
      code: "LBL",
      description: "Tem nhãn dán chai/lọ",
    } as any,
    materialType: {
      id: 3,
      name: "Decal nhựa",
      code: "DECAL",
      description: "Decal nhựa in UV",
    } as any,
    orderId: 103,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
];

// Mock proofing orders (lệnh bình bài)
const mockProofingOrdersPaged: ProofingOrderResponsePagedResponse = {
  items: [
    {
      id: 1,
      code: "PP-2025-001",
      status: "pending",
      totalQuantity: 18000,
      materialType: {
        id: 1,
        name: "Giấy couche 150gsm",
        code: "C150",
      } as any,
      createdAt: "2025-12-01T08:30:00.000Z",
      createdBy: {
        id: 10,
        fullName: "Nguyễn Văn Bình",
        username: "binh.prepress",
      } as any,
      proofingOrderDesigns: [
        {
          id: 11,
          designId: 1,
          design: mockDesigns[0],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {
          id: 12,
          designId: 2,
          design: mockDesigns[1],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    {
      id: 2,
      code: "PP-2025-002",
      status: "in_progress",
      totalQuantity: 50000,
      materialType: {
        id: 3,
        name: "Decal nhựa",
        code: "DECAL",
      } as any,
      createdAt: "2025-12-02T09:00:00.000Z",
      createdBy: {
        id: 11,
        fullName: "Trần Thị Trang",
        username: "trang.prepress",
      } as any,
      proofingOrderDesigns: [
        {
          id: 21,
          designId: 3,
          design: mockDesigns[2],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  ],
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

const proofStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const designStatusColors: Record<string, string> = {
  waiting_for_prepress: "bg-amber-50 text-amber-700 border-amber-100",
  waiting_for_production: "bg-blue-50 text-blue-700 border-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function PrepressIndex() {
  const navigate = useNavigate();

  // ====== UI state ======
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeTab, setActiveTab] = useState<"designs" | "orders">("designs");

  // filter cho tab Thiết kế
  const [designStatusFilter, setDesignStatusFilter] = useState<string>("all");
  const [designTypeFilter, setDesignTypeFilter] = useState<string>("all");
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>("all");

  // ====== Dữ liệu dùng MOCK thay cho API ======
  const paged: ProofingOrderResponsePagedResponse = mockProofingOrdersPaged;
  const proofingOrders: ProofingOrderResponse[] = paged.items ?? [];
  const designs: DesignResponse[] = mockDesigns;

  const isLoading = false;
  const isError = false;

  // ====== Search / filter LỆNH BÌNH BÀI (trên trang hiện tại) ======
  const filteredOrders = proofingOrders.filter((order) => {
    const code = order.code?.toLowerCase() ?? "";
    const materialName = order.materialType?.name?.toLowerCase() ?? "";
    const createdBy = order.createdBy?.fullName?.toLowerCase() ?? "";
    const keyword = searchTerm.toLowerCase();

    return (
      code.includes(keyword) ||
      materialName.includes(keyword) ||
      createdBy.includes(keyword)
    );
  });

  // ====== Search / filter THIẾT KẾ ======
  const designKeyword = searchTerm.toLowerCase();

  const filteredDesigns = designs.filter((d) => {
    const code = d.code?.toLowerCase() ?? "";
    const name = d.designName?.toLowerCase() ?? "";
    const orderCode = `ord-${d.orderId}`.toLowerCase();
    const status = d.designStatus ?? "";

    const matchText =
      code.includes(designKeyword) ||
      name.includes(designKeyword) ||
      orderCode.includes(designKeyword);

    const matchStatus =
      designStatusFilter === "all" || status === designStatusFilter;

    const matchDesignType =
      designTypeFilter === "all" ||
      d.designType?.id?.toString() === designTypeFilter;

    const matchMaterialType =
      materialTypeFilter === "all" ||
      d.materialType?.id?.toString() === materialTypeFilter;

    return matchText && matchStatus && matchDesignType && matchMaterialType;
  });

  // ====== Stats (trên lệnh bình bài) ======
  const stats = {
    totalOrders: paged.totalCount ?? 0,
    pending: proofingOrders.filter((o) => o.status === "pending").length ?? 0,
    inProgress:
      proofingOrders.filter((o) => o.status === "in_progress").length ?? 0,
    completed:
      proofingOrders.filter((o) => o.status === "completed").length ?? 0,
    totalQuantity: proofingOrders.reduce(
      (sum, o) => sum + (o.totalQuantity ?? 0),
      0
    ),
  };

  // ====== Pagination cho lệnh bình bài (trong mock chỉ có 1 trang) ======
  const totalPages = paged.totalPages || 1;
  const hasPrev = paged.hasPreviousPage;
  const hasNext = paged.hasNextPage;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCreatePrepressOrder = () => {
    navigate("/prepress/create-print-order");
  };

  const handleCreatePrepressFromDesign = (designId?: number) => {
    if (!designId) return;
    navigate(`/prepress/create-print-order?designId=${designId}`);
  };

  const handleViewDesign = (designId?: number) => {
    if (!designId) return;
    navigate(`/design/${designId}`);
  };

  const handleViewOrderDetail = (orderId?: number) => {
    if (!orderId) return;
    navigate(`/orders/${orderId}`);
  };

  const handleViewProofingOrder = (id?: number, code?: string | null) => {
    if (!id) return;
    navigate(`/proofing/${id}`);
  };

  const handleEditOrder = (id?: number, code?: string | null) => {
    if (!id) return;
    toast.info(`Chỉnh sửa lệnh bình bài ${code ?? ""}`);
  };

  const handleDeleteOrder = (id?: number, code?: string | null) => {
    toast.success(`Đã xóa lệnh bình bài ${code ?? ""}`);
  };

  const handleSendToProduction = (id?: number, code?: string | null) => {
    toast.success(`Đã gửi lệnh ${code ?? ""} đến sản xuất`);
  };

  const getProofStatusBadge = (status?: string | null) => {
    const s = status ?? "pending";
    const colorClass =
      proofStatusColors[s] ?? "bg-gray-100 text-gray-800 border-gray-200";

    return (
      <Badge variant="outline" className={colorClass}>
        {s === "pending"
          ? "Chờ xử lý"
          : s === "in_progress"
          ? "Đang thực hiện"
          : s === "completed"
          ? "Hoàn thành"
          : s}
      </Badge>
    );
  };

  const getDesignStatusBadge = (status?: string | null) => {
    const s = status ?? "";
    const colorClass =
      designStatusColors[s] ?? "bg-gray-100 text-gray-800 border-gray-200";
    let label = s || "Không rõ";

    if (s === "waiting_for_prepress") label = "Chờ bình bài";
    if (s === "waiting_for_production") label = "Chờ sản xuất";
    if (s === "completed") label = "Hoàn thành";

    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const startIndex =
    stats.totalOrders > 0 ? (paged.pageNumber - 1) * paged.pageSize : 0;
  const endIndex =
    stats.totalOrders > 0 ? startIndex + filteredOrders.length : 0;

  // ====== Tập option filter loại thiết kế / chất liệu từ data thiết kế ======
  const designTypeOptions = Array.from(
    new Map(
      designs
        .filter((d) => d.designType?.id)
        .map((d) => [d.designType!.id, d.designType])
    ).values()
  );

  const materialTypeOptions = Array.from(
    new Map(
      designs
        .filter((d) => d.materialType?.id)
        .map((d) => [d.materialType!.id, d.materialType])
    ).values()
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Quản lý Bình bài</h1>
        <p className="text-muted-foreground">
          Đang tải dữ liệu lệnh bình bài...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Quản lý Bình bài</h1>
        <p className="text-red-600">
          Không thể tải dữ liệu lệnh bình bài. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Bình bài</h1>
          <p className="text-muted-foreground">
            Xem thiết kế theo đơn hàng, tạo và quản lý lệnh bình bài
          </p>
        </div>
        <Button onClick={handleCreatePrepressOrder} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo lệnh bình bài
        </Button>
      </div>

      {/* Statistics Cards (theo lệnh bình bài) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lệnh chờ xử lý
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              trạng thái &quot;pending&quot; (trong dữ liệu hiện tại)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lệnh đang thực hiện
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              trạng thái &quot;in_progress&quot; (trong dữ liệu hiện tại)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              trạng thái &quot;completed&quot; (trong dữ liệu hiện tại)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lượng</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalQuantity.toLocaleString("vi-VN")}
            </div>
            <p className="text-xs text-muted-foreground">
              sản phẩm trong các lệnh (dữ liệu hiện tại)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Thiết kế / Lệnh bình bài */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted/40 p-1">
          <Button
            variant={activeTab === "designs" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setActiveTab("designs")}
          >
            <FileText className="h-4 w-4" />
            Thiết kế theo đơn
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setActiveTab("orders")}
          >
            <Printer className="h-4 w-4" />
            Lệnh bình bài
          </Button>
        </div>

        {/* Ô search dùng chung cho cả 2 tab */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "designs"
                ? "Tìm theo mã thiết kế, tên, mã đơn hàng..."
                : "Tìm theo mã lệnh, loại giấy, người tạo..."
            }
            className="pl-10 w-80"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* TAB: THIẾT KẾ */}
      {activeTab === "designs" && (
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Thiết kế của đơn hàng</CardTitle>
            <div className="flex flex-wrap gap-3">
              {/* Filter loại thiết kế */}
              <Select
                value={designTypeFilter}
                onValueChange={setDesignTypeFilter}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Lọc theo loại thiết kế" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại thiết kế</SelectItem>
                  {designTypeOptions.map((dt) => (
                    <SelectItem key={dt!.id} value={dt!.id.toString()}>
                      <div className="flex flex-col">
                        <span>{dt!.name}</span>
                        {dt!.description && (
                          <span className="text-xs text-muted-foreground">
                            {dt!.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter chất liệu */}
              <Select
                value={materialTypeFilter}
                onValueChange={setMaterialTypeFilter}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Lọc theo chất liệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chất liệu</SelectItem>
                  {materialTypeOptions.map((mt) => (
                    <SelectItem key={mt!.id} value={mt!.id.toString()}>
                      <div className="flex flex-col">
                        <span>{mt!.name}</span>
                        {mt!.description && (
                          <span className="text-xs text-muted-foreground">
                            {mt!.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter trạng thái thiết kế */}
              <Select
                value={designStatusFilter}
                onValueChange={setDesignStatusFilter}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Lọc trạng thái thiết kế" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="waiting_for_prepress">
                    Chờ bình bài
                  </SelectItem>
                  <SelectItem value="waiting_for_production">
                    Chờ sản xuất
                  </SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDesigns.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {designs.length === 0
                    ? "Chưa có thiết kế nào phù hợp cho bình bài."
                    : "Không tìm thấy thiết kế phù hợp với bộ lọc hiện tại."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã thiết kế</TableHead>
                    <TableHead>Tên thiết kế</TableHead>
                    <TableHead>Loại thiết kế</TableHead>
                    <TableHead>Chất liệu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDesigns.map((d) => (
                    <TableRow key={d.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {d.code ?? `DES-${d.id}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {d.designName || "Không tên"}
                          </span>
                          {d.dimensions && (
                            <span className="text-xs text-muted-foreground">
                              Kích thước: {d.dimensions}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span>{d.designType?.name ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Box className="h-4 w-4 text-muted-foreground" />
                          <span>{d.materialType?.name ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDesignStatusBadge(d.designStatus)}
                      </TableCell>
                      <TableCell>
                        {d.orderId ? (
                          <button
                            type="button"
                            className="text-sm text-primary hover:underline"
                            onClick={() => handleViewOrderDetail(d.orderId!)}
                          >
                            {`ĐH #${d.orderId}`}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(d.quantity ?? 0).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleViewDesign(d.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Xem
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleCreatePrepressFromDesign(d.id)}
                          >
                            <Printer className="h-4 w-4" />
                            Bình bài
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB: LỆNH BÌNH BÀI */}
      {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách lệnh bình bài</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Printer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Chưa có lệnh bình bài
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Không tìm thấy lệnh bình bài nào phù hợp với từ khóa tìm kiếm."
                    : "Chưa có lệnh bình bài nào được tạo."}
                </p>
                <Button onClick={handleCreatePrepressOrder}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo lệnh bình bài đầu tiên
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã lệnh</TableHead>
                      <TableHead>Thiết kế / Đơn liên quan</TableHead>
                      <TableHead>Loại giấy</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Người tạo</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-primary hover:underline"
                            onClick={() =>
                              handleViewProofingOrder(order.id, order.code)
                            }
                          >
                            <Printer className="h-4 w-4" />
                            {order.code ?? `LỆNH-${order.id}`}
                          </button>
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(order.proofingOrderDesigns ?? []).map((pod) => (
                              <Badge
                                key={pod.id ?? pod.designId}
                                variant="outline"
                                className="text-xs"
                              >
                                {pod.design?.code ?? `Design #${pod.designId}`}
                              </Badge>
                            ))}
                            {(!order.proofingOrderDesigns ||
                              order.proofingOrderDesigns.length === 0) && (
                              <span className="text-xs text-muted-foreground">
                                Chưa gắn thiết kế
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {order.materialType?.name ??
                            order.materialType?.code ??
                            "-"}
                        </TableCell>

                        <TableCell>
                          {(order.totalQuantity ?? 0).toLocaleString("vi-VN")}
                        </TableCell>

                        <TableCell>
                          {getProofStatusBadge(order.status)}
                        </TableCell>

                        <TableCell>
                          {order.createdBy ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {order.createdBy.fullName?.charAt(0) ?? "U"}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {order.createdBy.fullName}
                                </span>
                                {order.createdBy.username && (
                                  <span className="text-xs text-muted-foreground">
                                    @{order.createdBy.username}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {order.createdAt ? (
                            <p className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewProofingOrder(order.id, order.code)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEditOrder(order.id, order.code)
                                }
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              {order.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSendToProduction(order.id, order.code)
                                  }
                                >
                                  <Factory className="h-4 w-4 mr-2" />
                                  Gửi đến sản xuất
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.info("Đang in lệnh bình bài...")
                                }
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                In lệnh bình bài
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toast.info("Đang xuất PDF...")}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Xuất PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteOrder(order.id, order.code)
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa lệnh
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    {stats.totalOrders > 0 ? (
                      <>
                        Hiển thị{" "}
                        <span className="font-semibold">
                          {startIndex + 1}-{endIndex}
                        </span>{" "}
                        trong tổng số{" "}
                        <span className="font-semibold">
                          {stats.totalOrders}
                        </span>{" "}
                        lệnh bình bài
                      </>
                    ) : (
                      "Không có dữ liệu."
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = Number(e.target.value || "1");
                          if (!Number.isNaN(page)) {
                            handlePageChange(page);
                          }
                        }}
                        className="w-16 text-center text-sm"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasNext}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
