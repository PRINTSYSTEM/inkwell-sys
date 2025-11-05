import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types/notification';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get recent unread notifications
        const data = await notificationService.getNotifications(userId, {
          isRead: false
        });
        
        setNotifications(data.slice(0, 5)); // Show only latest 5
        setUnreadCount(data.length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribe((newNotification) => {
      if (newNotification.userId === userId) {
        loadData();
      }
    });

    return unsubscribe;
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    // Reload notifications
    try {
      const data = await notificationService.getNotifications(userId, {
        isRead: false
      });
      setNotifications(data.slice(0, 5));
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error reloading notifications:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
    // Reload notifications
    try {
      const data = await notificationService.getNotifications(userId, {
        isRead: false
      });
      setNotifications(data.slice(0, 5));
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error reloading notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    setIsOpen(false);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes}p`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Thông báo
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} mới
                  </Badge>
                )}
              </CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-auto p-1 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Đánh dấu tất cả
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không có thông báo mới</p>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-lg">{getTypeIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)} flex-shrink-0`} />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <Separator />
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-sm"
              >
                Xem tất cả thông báo
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;