import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  Eye, 
  User, 
  FileText, 
  Edit, 
  Plus, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Settings,
  Upload,
  Download
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'complete' | 'assign' | 'review' | 'upload' | 'download' | 'login';
  title: string;
  description?: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  target?: {
    type: 'order' | 'employee' | 'design' | 'report' | 'file' | 'setting';
    name: string;
    id?: string;
  };
  metadata?: {
    [key: string]: unknown;
  };
}

interface RecentActivityWidgetProps {
  title?: string;
  description?: string;
  activities: ActivityItem[];
  maxItems?: number;
  showAvatars?: boolean;
  onViewAll?: () => void;
  onItemClick?: (activity: ActivityItem) => void;
  className?: string;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  title = 'Hoạt động gần đây',
  description = 'Các thay đổi và cập nhật mới nhất',
  activities,
  maxItems = 5,
  showAvatars = true,
  onViewAll,
  onItemClick,
  className
}) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return Plus;
      case 'update':
        return Edit;
      case 'delete':
        return Trash2;
      case 'complete':
        return CheckCircle;
      case 'assign':
        return User;
      case 'review':
        return Eye;
      case 'upload':
        return Upload;
      case 'download':
        return Download;
      case 'login':
        return User;
      default:
        return FileText;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'complete':
        return 'text-green-600';
      case 'assign':
        return 'text-purple-600';
      case 'review':
        return 'text-orange-600';
      case 'upload':
        return 'text-blue-600';
      case 'download':
        return 'text-gray-600';
      case 'login':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActivityLabel = (type: ActivityItem['type']) => {
    const labels = {
      create: 'Tạo mới',
      update: 'Cập nhật',
      delete: 'Xóa',
      complete: 'Hoàn thành',
      assign: 'Phân công',
      review: 'Đánh giá',
      upload: 'Tải lên',
      download: 'Tải xuống',
      login: 'Đăng nhập'
    };
    return labels[type];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const visibleActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-muted-foreground mb-1">
              Chưa có hoạt động nào
            </h3>
            <p className="text-sm text-muted-foreground">
              Các hoạt động sẽ được hiển thị tại đây
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {activities.length > maxItems && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Xem tất cả
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            
            return (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  onItemClick ? 'cursor-pointer hover:bg-muted/50' : ''
                }`}
                onClick={() => onItemClick?.(activity)}
              >
                <div className="flex-shrink-0">
                  {showAvatars ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={`p-1.5 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{activity.user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getActivityLabel(activity.type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {activity.title}
                  </p>
                  
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}
                  
                  {activity.target && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {activity.target.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length > maxItems && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm" onClick={onViewAll}>
              Xem thêm {activities.length - maxItems} hoạt động
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};