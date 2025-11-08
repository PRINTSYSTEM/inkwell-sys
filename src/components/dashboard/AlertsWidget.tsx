import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  X, 
  Clock, 
  Users, 
  TrendingDown,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

export interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source?: string;
  relatedId?: string;
}

interface AlertsWidgetProps {
  alerts: AlertData[];
  maxVisible?: number;
  onDismiss?: (alertId: string) => void;
  onViewAll?: () => void;
  showDismissButton?: boolean;
  className?: string;
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({
  alerts,
  maxVisible = 3,
  onDismiss,
  onViewAll,
  showDismissButton = true,
  className
}) => {
  const getAlertIcon = (type: AlertData['type']) => {
    switch (type) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'success':
        return CheckCircle;
      default:
        return AlertTriangle;
    }
  };

  const getAlertVariant = (type: AlertData['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: AlertData['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: AlertData['priority']) => {
    const labels = {
      urgent: 'Khẩn cấp',
      high: 'Cao',
      medium: 'Trung bình',
      low: 'Thấp'
    };
    return labels[priority];
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

  const actionRequiredAlerts = alerts.filter(alert => alert.actionRequired);
  const visibleAlerts = alerts.slice(0, maxVisible);

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Cảnh báo (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="font-medium text-green-800 mb-1">Tất cả ổn định</h3>
            <p className="text-sm text-muted-foreground">
              Không có cảnh báo nào cần xử lý
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Cảnh báo ({actionRequiredAlerts.length})
          </div>
          {alerts.length > maxVisible && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Xem tất cả
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            
            return (
              <Alert key={alert.id} variant={getAlertVariant(alert.type)} className="relative">
                {showDismissButton && onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => onDismiss(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                <Icon className="h-4 w-4" />
                <div className="flex-1 pr-8">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTitle className="text-sm font-medium">
                      {alert.title}
                    </AlertTitle>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(alert.priority)}`}
                      >
                        {getPriorityLabel(alert.priority)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <AlertDescription className="text-sm">
                    {alert.description}
                  </AlertDescription>
                  
                  {alert.source && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Nguồn: {alert.source}
                    </div>
                  )}
                  
                  {alert.actionRequired && (
                    <Badge variant="outline" className="mt-2 text-xs bg-orange-100 text-orange-800">
                      Cần xử lý
                    </Badge>
                  )}
                </div>
              </Alert>
            );
          })}
          
          {alerts.length > maxVisible && (
            <div className="text-center pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewAll}
              >
                Xem thêm {alerts.length - maxVisible} cảnh báo
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

