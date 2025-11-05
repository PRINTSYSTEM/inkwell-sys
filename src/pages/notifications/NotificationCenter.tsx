import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Filter, Search, Settings, Trash2, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { notificationService } from '@/services/notificationService';
import { 
  Notification, 
  NotificationFilter, 
  NotificationStats,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  NotificationCategory
} from '@/types/notification';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  const currentUserId = 'user_1'; // In real app, get from auth context

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const currentFilter = {
          ...filter,
          search: searchTerm || undefined,
          isRead: selectedTab === 'unread' ? false : selectedTab === 'read' ? true : undefined
        };

        const data = await notificationService.getNotifications(currentUserId, currentFilter);
        setNotifications(data);
        
        const statsData = await notificationService.getNotificationStats(currentUserId);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    loadPreferences();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribe((newNotification) => {
      if (newNotification.userId === currentUserId) {
        loadData();
      }
    });

    return unsubscribe;
  }, [filter, searchTerm, selectedTab]);

  const loadPreferences = async () => {
    try {
      const prefsData = await notificationService.getPreferences(currentUserId);
      setPreferences(prefsData);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    // Reload data
    const currentFilter = {
      ...filter,
      search: searchTerm || undefined,
      isRead: selectedTab === 'unread' ? false : selectedTab === 'read' ? true : undefined
    };
    const data = await notificationService.getNotifications(currentUserId, currentFilter);
    setNotifications(data);
    const statsData = await notificationService.getNotificationStats(currentUserId);
    setStats(statsData);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(currentUserId);
    // Reload data
    const currentFilter = {
      ...filter,
      search: searchTerm || undefined,
      isRead: selectedTab === 'unread' ? false : selectedTab === 'read' ? true : undefined
    };
    const data = await notificationService.getNotifications(currentUserId, currentFilter);
    setNotifications(data);
    const statsData = await notificationService.getNotificationStats(currentUserId);
    setStats(statsData);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    // Reload data
    const currentFilter = {
      ...filter,
      search: searchTerm || undefined,
      isRead: selectedTab === 'unread' ? false : selectedTab === 'read' ? true : undefined
    };
    const data = await notificationService.getNotifications(currentUserId, currentFilter);
    setNotifications(data);
    const statsData = await notificationService.getNotificationStats(currentUserId);
    setStats(statsData);
  };

  const handleUpdatePreferences = async (updates: Partial<NotificationPreferences>) => {
    await notificationService.updatePreferences(currentUserId, updates);
    const prefsData = await notificationService.getPreferences(currentUserId);
    setPreferences(prefsData);
  };

  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'assignment': return '📋';
      case 'deadline': return '⏰';
      case 'performance': return '📊';
      case 'system': return '⚙️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Trung tâm thông báo
          </h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi tất cả thông báo của bạn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Cài đặt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cài đặt thông báo</DialogTitle>
              </DialogHeader>
              {preferences && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Thông báo email</Label>
                      <Switch
                        id="email-notifications"
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ emailNotifications: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Thông báo đẩy</Label>
                      <Switch
                        id="push-notifications"
                        checked={preferences.pushNotifications}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({ pushNotifications: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Giờ yên tĩnh</h4>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quiet-hours">Bật giờ yên tĩnh</Label>
                      <Switch
                        id="quiet-hours"
                        checked={preferences.quietHours.enabled}
                        onCheckedChange={(checked) => 
                          handleUpdatePreferences({
                            quietHours: { ...preferences.quietHours, enabled: checked }
                          })
                        }
                      />
                    </div>
                    {preferences.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Bắt đầu</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={preferences.quietHours.startTime}
                            onChange={(e) => 
                              handleUpdatePreferences({
                                quietHours: { 
                                  ...preferences.quietHours, 
                                  startTime: e.target.value 
                                }
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">Kết thúc</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={preferences.quietHours.endTime}
                            onChange={(e) => 
                              handleUpdatePreferences({
                                quietHours: { 
                                  ...preferences.quietHours, 
                                  endTime: e.target.value 
                                }
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng số</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chưa đọc</p>
                  <p className="text-2xl font-bold text-red-500">{stats.unread}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500 font-bold">{stats.unread}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">7 ngày qua</p>
                  <p className="text-2xl font-bold text-green-500">{stats.last7Days}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  📈
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ lệ đọc</p>
                  <p className="text-2xl font-bold">{Math.round(stats.readRate)}%</p>
                </div>
                <div className="w-8">
                  <Progress value={stats.readRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm thông báo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filter.type?.[0] || 'all'} onValueChange={(value) => 
              setFilter({ ...filter, type: value === 'all' ? undefined : [value as NotificationType] })
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Loại thông báo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="assignment">Phân công</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="performance">Hiệu suất</SelectItem>
                <SelectItem value="system">Hệ thống</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.priority?.[0] || 'all'} onValueChange={(value) => 
              setFilter({ ...filter, priority: value === 'all' ? undefined : [value as NotificationPriority] })
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Mức độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="urgent">Khẩn cấp</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="unread">
                  Chưa đọc {stats && stats.unread > 0 && (
                    <Badge variant="destructive" className="ml-2">{stats.unread}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read">Đã đọc</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {notification.category && (
                              <>
                                <span>•</span>
                                <span>{notification.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleDeleteNotification(notification.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa thông báo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          Xem chi tiết
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;