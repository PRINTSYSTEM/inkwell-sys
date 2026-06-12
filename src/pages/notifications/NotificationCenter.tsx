import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Search,
  X,
  Clock,
  Trash2,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteNotification,
} from "@/hooks/use-notifications";
import {
  useDebtNotifications,
  useDebtNotificationPreview,
  useMarkDebtNotificationRead,
  useMarkAllDebtNotificationsRead,
} from "@/hooks/use-debt-notification";
import { useNotification } from "@/hooks/use-notification";
import { toast } from "sonner";
import type { NotificationType } from "@/Schema/notification.schema";
import { formatDistanceToNow } from "date-fns";

// Mock data for now - will be replaced with API data
import { mockNotifications } from "@/lib/mockData/data/notifications";
import type { Notification as MockNotification } from "@/types";

// Map mock notification type to schema type
const mapMockTypeToSchemaType = (
  type: "warning" | "info" | "error" | "success"
): NotificationType => {
  const mapping: Record<string, NotificationType> = {
    warning: "alert",
    info: "update",
    error: "alert",
    success: "update",
  };
  return mapping[type] || "update";
};

// Icon mapping
const typeIcons = {
  system: Bell,
  assignment: CheckCircle,
  performance: TrendingUp,
  attendance: Clock,
  deadline: AlertTriangle,
  approval: CheckCircle,
  announcement: Info,
  reminder: Clock,
  alert: AlertCircle,
  update: Info,
};

// Color mapping for notification types
const typeColors: Record<string, string> = {
  system: "text-blue-600 bg-blue-50 border-blue-200",
  assignment: "text-green-600 bg-green-50 border-green-200",
  performance: "text-purple-600 bg-purple-50 border-purple-200",
  attendance: "text-orange-600 bg-orange-50 border-orange-200",
  deadline: "text-red-600 bg-red-50 border-red-200",
  approval: "text-blue-600 bg-blue-50 border-blue-200",
  announcement: "text-indigo-600 bg-indigo-50 border-indigo-200",
  reminder: "text-yellow-600 bg-yellow-50 border-yellow-200",
  alert: "text-red-600 bg-red-50 border-red-200",
  update: "text-gray-600 bg-gray-50 border-gray-200",
};

function NotificationCenter() {
  const navigate = useNavigate();
  const { isConnected } = useNotification();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Convert mock notifications to match schema structure
  const mockNotificationsData = useMemo(() => {
    return mockNotifications.map((notif: MockNotification) => ({
      id: parseInt(notif.id.replace("n", "")) || 0,
      type: mapMockTypeToSchemaType(notif.type),
      title: notif.title,
      message: notif.message,
      summary: undefined,
      recipientId: 0,
      recipientType: "user" as const,
      relatedEntityType: notif.relatedType,
      relatedEntityId: notif.relatedId ? parseInt(notif.relatedId.replace("o", "")) : undefined,
      status: notif.read ? ("read" as const) : ("delivered" as const),
      isRead: notif.read,
      readAt: notif.read ? new Date(notif.createdAt).toISOString() : undefined,
      createdAt: new Date(notif.createdAt).toISOString(),
      updatedAt: new Date(notif.createdAt).toISOString(),
      channels: ["in_app" as const],
      actions: [],
      data: {},
      tags: [],
    }));
  }, []);

  // Use real debt notifications
  const { data: debtData, isLoading: isLoadingDebt, refetch } = useDebtNotifications({
    pageNumber: currentPage,
    pageSize,
    isRead: activeTab === "unread" ? false : activeTab === "read" ? true : undefined,
  });

  const { data: unreadCountData, refetch: refetchUnreadCount } = useDebtNotifications({
    pageSize: 1,
    isRead: false,
  });

  const markAsRead = useMarkDebtNotificationRead();
  const markAllAsRead = useMarkAllDebtNotificationsRead();
  const deleteNotification = useDeleteNotification();

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Listen for real-time notifications from SignalR
  const { connection } = useNotification();
  
  useEffect(() => {
    if (!connection) return;

    const handleNewNotification = () => {
      // Refetch notifications when a new one arrives
      refetch();
      refetchUnreadCount();
    };

    // Listen for new notifications
    connection.on("ReceiveNotification", handleNewNotification);

    return () => {
      connection.off("ReceiveNotification", handleNewNotification);
    };
  }, [connection, refetch, refetchUnreadCount]);

  // Filter and format notifications
  const filteredNotifications = useMemo(() => {
    if (!debtData?.items) return [];

    let filtered = debtData.items.map(item => ({
      id: item.id,
      type: (item.type || "alert") as NotificationType,
      title: item.subject || "Thông báo công nợ",
      message: item.body || "",
      summary: undefined,
      recipientId: 0,
      recipientType: "user" as const,
      relatedEntityType: "customer",
      relatedEntityId: undefined,
      status: "delivered" as const,
      isRead: !!item.isRead,
      readAt: undefined,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.createdAt || new Date().toISOString(),
      channels: ["in_app" as const],
      actions: [],
      data: {},
      tags: [],
    }));

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((n) => n.type === selectedType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [debtData, selectedType, searchQuery]);

  const unreadCount = unreadCountData?.total ?? 0;

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync(id);
      toast.success("Đã đánh dấu đã đọc");
      refetch();
      refetchUnreadCount();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success("Đã đánh dấu tất cả đã đọc");
      refetch();
      refetchUnreadCount();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success("Đã xóa thông báo");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Open preview if it's a debt notification
    navigate(`/notifications/${notification.id}/preview`);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const getTypeIcon = (type: string) => {
    const Icon = typeIcons[type as keyof typeof typeIcons] || Bell;
    return Icon;
  };

  const getTypeColor = (type: string) => {
    return typeColors[type] || typeColors.update;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Trung tâm thông báo
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground ml-2">
                {unreadCount} mới
              </Badge>
            )}
            {isConnected && (
              <Badge variant="outline" className="ml-2 border-green-500 text-green-600">
                Đang kết nối
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và xem tất cả thông báo hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="unread">
                  Chưa đọc
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read">Đã đọc</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại thông báo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="system">Hệ thống</SelectItem>
                <SelectItem value="assignment">Phân công</SelectItem>
                <SelectItem value="deadline">Hạn chót</SelectItem>
                <SelectItem value="approval">Phê duyệt</SelectItem>
                <SelectItem value="alert">Cảnh báo</SelectItem>
                <SelectItem value="update">Cập nhật</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoadingDebt ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Đang tải...
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Không có thông báo nào
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || selectedType !== "all" || activeTab !== "all"
                  ? "Thử thay đổi bộ lọc để xem thêm thông báo"
                  : "Bạn sẽ nhận được thông báo ở đây khi có sự kiện mới"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getTypeIcon(notification.type);
            const colorClass = getTypeColor(notification.type);

            return (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead
                    ? "bg-primary/5"
                    : "opacity-75"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base line-clamp-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <Badge
                              variant="outline"
                              className="bg-primary text-primary-foreground border-primary"
                            >
                              Mới
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notification.id) handleMarkAsRead(notification.id);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Đánh dấu đã đọc
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.id) handleDelete(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {debtData && debtData.total > pageSize && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {debtData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(
                  debtData.totalPages,
                  p + 1
                )
              )
            }
            disabled={
              currentPage >= debtData.totalPages
            }
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
