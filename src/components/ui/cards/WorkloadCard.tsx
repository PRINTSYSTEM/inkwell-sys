import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

export interface WorkloadItem {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  priority?: 'high' | 'medium' | 'low';
  progress?: number;
  dueDate?: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
}

export interface WorkloadCardProps {
  title: string;
  totalCapacity: number;
  currentLoad: number;
  items?: WorkloadItem[];
  icon?: LucideIcon;
  showDetails?: boolean;
  onItemClick?: (item: WorkloadItem) => void;
  className?: string;
}

export const WorkloadCard: React.FC<WorkloadCardProps> = ({
  title,
  totalCapacity,
  currentLoad,
  items = [],
  icon: Icon,
  showDetails = true,
  onItemClick,
  className
}) => {
  const loadPercentage = (currentLoad / totalCapacity) * 100;
  
  const getLoadStatus = () => {
    if (loadPercentage > 90) return { color: 'text-red-600', text: 'Quá tải' };
    if (loadPercentage > 70) return { color: 'text-yellow-600', text: 'Cao' };
    if (loadPercentage > 40) return { color: 'text-blue-600', text: 'Vừa phải' };
    return { color: 'text-green-600', text: 'Thấp' };
  };

  const getStatusBadge = (status: WorkloadItem['status']) => {
    const variants = {
      completed: { variant: 'default' as const, text: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      'in-progress': { variant: 'default' as const, text: 'Đang làm', color: 'bg-blue-100 text-blue-800' },
      pending: { variant: 'secondary' as const, text: 'Chờ xử lý', color: 'bg-gray-100 text-gray-800' },
      overdue: { variant: 'destructive' as const, text: 'Quá hạn', color: 'bg-red-100 text-red-800' }
    };
    return variants[status];
  };

  const getPriorityColor = (priority?: WorkloadItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const status = getLoadStatus();

  return (
    <Card className={`${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Badge className={status.color} variant="outline">
            {status.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workload Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tải công việc</span>
            <span className="text-sm font-medium">
              {currentLoad} / {totalCapacity}
            </span>
          </div>
          <Progress value={loadPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {loadPercentage.toFixed(1)}% công suất
          </p>
        </div>

        {/* Workload Items */}
        {showDetails && items.length > 0 && (
          <div className="space-y-2 pt-3 border-t">
            <h4 className="text-sm font-medium">Công việc hiện tại</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.slice(0, 5).map((item) => {
                const statusBadge = getStatusBadge(item.status);
                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded border-l-2 ${getPriorityColor(item.priority)} bg-gray-50 ${
                      onItemClick ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {item.title}
                      </span>
                      <Badge 
                        variant={statusBadge.variant}
                        className={`text-xs ${statusBadge.color}`}
                      >
                        {statusBadge.text}
                      </Badge>
                    </div>
                    
                    {item.progress !== undefined && (
                      <div className="mb-2">
                        <Progress value={item.progress} className="h-1" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {item.assignee && (
                        <span>{item.assignee.name}</span>
                      )}
                      {item.dueDate && (
                        <span>Hạn: {item.dueDate}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{items.length - 5} công việc khác
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};