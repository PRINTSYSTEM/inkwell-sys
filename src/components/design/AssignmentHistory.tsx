import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DesignAssignment } from '@/types/design-monitoring';

interface AssignmentHistoryProps {
  assignments: DesignAssignment[];
  onAssignmentClick?: (assignment: DesignAssignment) => void;
}

export const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({ 
  assignments, 
  onAssignmentClick 
}) => {
  const getStatusBadge = (status: DesignAssignment['status']) => {
    const statusMap = {
      pending: { label: 'Chờ xử lý', variant: 'secondary' as const, color: 'text-gray-600' },
      in_progress: { label: 'Đang làm', variant: 'default' as const, color: 'text-blue-600' },
      review: { label: 'Đang review', variant: 'outline' as const, color: 'text-orange-600' },
      revision: { label: 'Cần sửa', variant: 'destructive' as const, color: 'text-red-600' },
      approved: { label: 'Đã duyệt', variant: 'default' as const, color: 'text-green-600' },
      completed: { label: 'Hoàn thành', variant: 'default' as const, color: 'text-green-600' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPriorityBadge = (priority: DesignAssignment['priority']) => {
    const priorityMap = {
      low: { label: 'Thấp', color: 'bg-green-100 text-green-800' },
      medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: DesignAssignment['status']) => {
    return new Date(dueDate) < new Date() && 
           !['completed', 'approved'].includes(status);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lịch sử Assignment</span>
          <Badge variant="outline">
            {assignments.length} assignments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>Chưa có assignment nào</p>
            </div>
          ) : (
            assignments.map((assignment) => {
              const status = getStatusBadge(assignment.status);
              const priority = getPriorityBadge(assignment.priority);
              const overdue = isOverdue(assignment.dueDate, assignment.status);

              return (
                <div
                  key={assignment.id}
                  className={`p-4 border rounded-lg hover:shadow-sm transition-shadow ${
                    overdue ? 'border-red-200 bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{assignment.title}</h4>
                        {overdue && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {assignment.description || 'Không có mô tả'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={overdue ? 'text-red-600 font-medium' : ''}>
                            Hạn: {formatDate(assignment.dueDate)}
                          </span>
                        </div>

                        {assignment.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.estimatedHours}h</span>
                          </div>
                        )}

                        {assignment.assignedBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.assignedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAssignmentClick?.(assignment)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex gap-2">
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                      <Badge className={priority.color} variant="outline">
                        {priority.label}
                      </Badge>
                    </div>

                    {assignment.progress !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${assignment.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {assignment.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};