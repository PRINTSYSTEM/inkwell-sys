import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockNotifications } from '@/lib/mockData';

const typeIcons = {
  warning: AlertTriangle,
  info: Info,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors = {
  warning: 'text-warning bg-warning/10',
  info: 'text-primary bg-primary/10',
  error: 'text-destructive bg-destructive/10',
  success: 'text-success bg-success/10',
};

export default function Notifications() {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Thông báo
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground">
                  {unreadCount} mới
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Cảnh báo và thông báo hệ thống</p>
          </div>
          <Button variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>

        <div className="space-y-3">
          {mockNotifications.map((notification) => {
            const Icon = typeIcons[notification.type];
            return (
              <Card
                key={notification.id}
                className={`${!notification.read ? 'border-l-4 border-l-primary' : ''} hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="outline" className="bg-primary text-primary-foreground">Mới</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {notification.relatedType && notification.relatedId && (
                      <Button variant="outline" size="sm">
                        Xem chi tiết
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
  );
}
