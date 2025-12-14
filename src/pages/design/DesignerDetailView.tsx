import { useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Search,
  Filter,
  Clock,
  Palette,
  Edit3,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User,
  ImageIcon,
  Loader2,
  SlidersHorizontal,
  Eye,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useDesignsByUser, useUser } from "@/hooks";
import type { DesignResponse } from "@/Schema";
import {
  designStatusConfig,
  formatDate,
  type DesignStatusKey,
} from "@/lib/status-utils";

// Icon mapping for design statuses
const DESIGN_STATUS_ICONS: Record<DesignStatusKey, LucideIcon> = {
  received_info: Clock,
  designing: Palette,
  editing: Edit3,
  waiting_for_customer_approval: AlertCircle,
  confirmed_for_printing: CheckCircle2,
};

export default function DesignerDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const designerId = params.id ? Number(params.id) : null;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 20;

  // Fetch designer info
  const {
    data: designer,
    isLoading: designerLoading,
    isError: designerError,
  } = useUser(designerId, !!designerId);

  // Fetch designs by user
  const { data, isLoading, isError } = useDesignsByUser(
    designerId,
    statusFilter === "all" ? undefined : { status: statusFilter },
    !!designerId
  );

  // hỗ trợ cả 2 dạng: Array<Design> hoặc { items, totalPages, ... }
  type PagedData = {
    items?: DesignResponse[];
    totalPages?: number;
    totalCount?: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
  };
  const pagedData = data as PagedData | undefined;

  const designs: DesignResponse[] = Array.isArray(data)
    ? data
    : pagedData?.items ?? [];

  const totalCount = Array.isArray(data)
    ? data.length
    : pagedData?.totalCount || designs.length;
  const totalPages =
    !Array.isArray(data) && typeof pagedData?.totalPages === "number"
      ? pagedData.totalPages
      : 1;
  const hasPreviousPage = pagedData?.hasPreviousPage || false;
  const hasNextPage = pagedData?.hasNextPage || false;

  // Filter by search query (client-side)
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter(
      (d) =>
        d.code?.toLowerCase().includes(query) ||
        d.designName?.toLowerCase().includes(query) ||
        d.designType?.name?.toLowerCase().includes(query) ||
        d.materialType?.name?.toLowerCase().includes(query)
    );
  }, [designs, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: totalCount,
      received_info: designs.filter((d) => d.status === "received_info").length,
      designing: designs.filter((d) => d.status === "designing").length,
      editing: designs.filter((d) => d.status === "editing").length,
      waiting_for_customer_approval: designs.filter(
        (d) => d.status === "waiting_for_customer_approval"
      ).length,
      confirmed_for_printing: designs.filter(
        (d) => d.status === "confirmed_for_printing"
      ).length,
    };
  }, [designs, totalCount]);

  // Get status info
  const getStatusInfo = (design: DesignResponse) => {
    const status = (design.status || "received_info") as DesignStatusKey;
    const config =
      designStatusConfig[status] || designStatusConfig.received_info;
    const Icon = DESIGN_STATUS_ICONS[status] || Clock;
    return { status, config, Icon };
  };

  // Loading state
  if (designerLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Đang tải thông tin nhân viên...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (designerError || !designer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Không tìm thấy nhân viên
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Nhân viên không tồn tại hoặc đã bị xóa
            </p>
            <Button
              onClick={() => navigate("/design/management")}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/design/management")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 font-semibold">
                {designer.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {designer.fullName || "Chưa có tên"}
              </h1>
              <p className="text-muted-foreground">
                @{designer.username || "unknown"} • Quản lý {totalCount} thiết
                kế
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Tổng cộng</div>
          </CardContent>
        </Card>

        {(Object.keys(designStatusConfig) as DesignStatusKey[]).map((key) => {
          const config = designStatusConfig[key];
          const count = stats[key as keyof typeof stats] || 0;
          const Icon = DESIGN_STATUS_ICONS[key];
          const isActive = statusFilter === key;

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                isActive ? "ring-2 ring-primary" : "hover:shadow-md"
              } ${config.bgColor}`}
              onClick={() => {
                setStatusFilter(key);
                setCurrentPage(1);
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xl font-bold">{count}</span>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {config.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border rounded-lg p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tên, loại thiết kế..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {(Object.keys(designStatusConfig) as DesignStatusKey[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {designStatusConfig[key].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead className="min-w-[120px]">Mã thiết kế</TableHead>
                <TableHead className="min-w-[200px]">Tên thiết kế</TableHead>
                <TableHead className="min-w-[120px]">Loại</TableHead>
                <TableHead className="min-w-[120px]">Chất liệu</TableHead>
                <TableHead className="min-w-[100px]">Kích thước</TableHead>
                <TableHead className="min-w-[140px]">Trạng thái</TableHead>
                <TableHead className="min-w-[100px]">Cập nhật</TableHead>
                <TableHead className="w-[120px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Đang tải danh sách thiết kế...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
                      <h3 className="text-base font-semibold mb-1">
                        Không thể tải dữ liệu
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Vui lòng thử lại sau hoặc liên hệ quản trị viên
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDesigns.length > 0 ? (
                filteredDesigns.map((design) => {
                  const { config, Icon } = getStatusInfo(design);

                  return (
                    <TableRow
                      key={design.id}
                      className="hover:bg-muted/50 cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <TableCell>
                        <Avatar className="w-12 h-12 rounded-lg">
                          {design.designImageUrl ? (
                            <AvatarImage
                              src={design.designImageUrl}
                              alt={design.designName || "Design"}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-muted">
                            <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Code */}
                      <TableCell>
                        <Link
                          to={`/design/detail/${design.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {design.code || `DES-${design.id}`}
                        </Link>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <p className="font-medium line-clamp-1">
                          {design.designName || "Chưa đặt tên"}
                        </p>
                      </TableCell>

                      {/* Design Type */}
                      <TableCell>
                        <span className="text-sm">
                          {design.designType?.name || "—"}
                        </span>
                      </TableCell>

                      {/* Material Type */}
                      <TableCell>
                        <span className="text-sm">
                          {design.materialType?.name || "—"}
                        </span>
                      </TableCell>

                      {/* Dimensions */}
                      <TableCell>
                        <span className="text-sm font-mono">
                          {design.width && design.height
                            ? `${design.width}×${design.height}`
                            : design.dimensions || "—"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          className={`${config.color} border text-xs font-medium`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>

                      {/* Updated At */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(design.updatedAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link to={`/design/detail/${design.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Xem chi tiết</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-48">
                    <div className="text-center">
                      <Palette className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <h3 className="text-base font-semibold mb-1">
                        {searchQuery || statusFilter !== "all"
                          ? "Không tìm thấy thiết kế"
                          : "Chưa có thiết kế nào"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                          : "Nhân viên này chưa có công việc nào được giao"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, totalCount)} / {totalCount}{" "}
              thiết kế
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={!hasNextPage}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
