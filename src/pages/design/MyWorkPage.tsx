import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyDesigns } from "@/hooks";
import { DesignResponse } from "@/Schema";

export default function MyWorkPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useMyDesigns({
    pageNumber: currentPage,
    pageSize,
  });

  const designs = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const hasPreviousPage = data?.hasPreviousPage || false;
  const hasNextPage = data?.hasNextPage || false;

  const statusConfig = {
    received_info: {
      label: "Đã nhận thông tin",
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: Clock,
    },
    designing: {
      label: "Đang thiết kế",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Play,
    },
    editing: {
      label: "Đang chỉnh sửa",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: Eye,
    },
    waiting_for_customer_approval: {
      label: "Chờ khách duyệt",
      color: "bg-amber-100 text-amber-800 border-amber-300",
      icon: AlertCircle,
    },
    confirmed_for_printing: {
      label: "Xác nhận in",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle,
    },
    pdf_exported: {
      label: "Đã xuất PDF",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: CheckCircle,
    },
  } as const;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusStats = () => {
    const stats = {
      received_info: designs.filter((d) => d.designStatus === "received_info")
        .length,
      designing: designs.filter((d) => d.designStatus === "designing").length,
      editing: designs.filter((d) => d.designStatus === "editing").length,
      waiting_for_customer_approval: designs.filter(
        (d) => d.designStatus === "waiting_for_customer_approval"
      ).length,
      confirmed_for_printing: designs.filter(
        (d) => d.designStatus === "confirmed_for_printing"
      ).length,
      pdf_exported: designs.filter((d) => d.designStatus === "pdf_exported")
        .length,
    };
    return stats;
  };

  const getRecentDesigns = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return designs.filter((d) => new Date(d.updatedAt) > weekAgo);
  };

  const getActiveDesigns = () => {
    return designs.filter((d) =>
      ["received_info", "designing", "editing"].includes(d.designStatus)
    );
  };

  const groupDesignsByStatus = () => {
    const grouped: { [key: string]: DesignResponse[] } = {};
    Object.keys(statusConfig).forEach((status) => {
      grouped[status] = designs.filter((d) => d.designStatus === status);
    });
    return grouped;
  };

  const DesignCard = ({ design }: { design: DesignResponse }) => {
    const status =
      statusConfig[design.designStatus as keyof typeof statusConfig] ||
      statusConfig.received_info;
    const StatusIcon = status.icon;

    return (
      <Card
        className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary/50"
        onClick={() => navigate(`/design/detail/${design.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                {design.designType?.name || "Design"}
              </CardTitle>
              <div className="space-y-1">
                <p className="text-sm font-mono font-semibold text-primary">
                  {design.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Đơn hàng #{design.orderId}
                </p>
              </div>
            </div>
            <Badge
              className={`${status.color} flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {design.materialType?.name || "Material"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {design.dimensions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Cập nhật:{" "}
                <span className="font-medium text-foreground">
                  {formatDate(design.updatedAt.toString())}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Số lượng</p>
              <p className="text-lg font-bold text-primary">
                {design.quantity.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tổng giá</p>
              <p className="text-lg font-bold text-emerald-600">
                {design.totalPrice?.toLocaleString() || 0}₫
              </p>
            </div>
          </div>

          {design.timelineEntries && design.timelineEntries.length > 0 && (
            <div className="space-y-2 pt-3 border-t">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Timeline</span>
                <span className="text-muted-foreground">
                  {design.timelineEntries.length} mục
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (design.timelineEntries.length / 5) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    description?: string;
  }) => (
    <Card className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${color} shadow-lg`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium">Đang tải công việc của bạn...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium text-destructive mb-2">
              Không thể tải dữ liệu
            </p>
            <p className="text-sm text-muted-foreground">
              Vui lòng thử lại sau hoặc liên hệ quản trị viên
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusStats = getStatusStats();
  const recentDesigns = getRecentDesigns();
  const activeDesigns = getActiveDesigns();
  const groupedDesigns = groupDesignsByStatus();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          Công việc của tôi
        </h1>
        <p className="text-base text-muted-foreground">
          Dashboard cá nhân - {totalCount} thiết kế được giao cho bạn
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng công việc"
          value={totalCount}
          icon={Target}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Đang thiết kế"
          value={statusStats.designing}
          icon={Play}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Đang chỉnh sửa"
          value={statusStats.editing}
          icon={Eye}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          title="Hoàn thành"
          value={statusStats.confirmed_for_printing + statusStats.pdf_exported}
          icon={CheckCircle}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          description={`${recentDesigns.length} cập nhật tuần này`}
        />
      </div>

      {/* Active Designs Alert */}
      {activeDesigns.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2 text-xl">
              <Play className="h-6 w-6" />
              Đang thực hiện ({activeDesigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeDesigns.slice(0, 5).map((design) => {
                const status =
                  statusConfig[
                    design.designStatus as keyof typeof statusConfig
                  ];
                return (
                  <div
                    key={design.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white border-2 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/design/detail/${design.id}`)}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {design.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {design.designType?.name} • Đơn hàng #{design.orderId}
                      </p>
                    </div>
                    <Badge className={`${status.color} border`}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
              {activeDesigns.length > 5 && (
                <p className="text-sm text-blue-600 font-medium text-center pt-2">
                  ... và {activeDesigns.length - 5} thiết kế khác
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="text-sm">
            Tổng quan
          </TabsTrigger>
          {Object.entries(statusConfig).map(([status, config]) => (
            <TabsTrigger key={status} value={status} className="text-sm">
              {config.label} ({statusStats[status as keyof typeof statusStats]})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">
                Tất cả thiết kế ({totalCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designs.map((design) => (
                      <DesignCard key={design.id} design={design} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={!hasPreviousPage}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Trước
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Trang {currentPage} / {totalPages}
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
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    Chưa có thiết kế nào được giao cho bạn
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status-specific tabs */}
        {Object.entries(groupedDesigns).map(([status, statusDesigns]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const StatusIcon = config.icon;
          return (
            <TabsContent key={status} value={status} className="mt-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <StatusIcon className="h-6 w-6" />
                    {config.label} ({statusDesigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusDesigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {statusDesigns.map((design) => (
                        <DesignCard key={design.id} design={design} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <StatusIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        Không có thiết kế nào ở trạng thái này
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
