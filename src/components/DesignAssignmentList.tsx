import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  User,
  Flag,
  Plus,
  Download,
  RefreshCw,
  Timer,
  Target,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

import { DesignAssignment, DesignAssignmentStatus, DesignAssignmentPriority } from '@/types/design-monitoring';
import { Employee } from '@/types/employee';
import { DesignAssignmentService } from '@/services/designAssignmentService';

// Type alias to handle unknown structure
type AssignmentData = Record<string, unknown>;

interface DesignAssignmentListProps {
  assignments: DesignAssignment[];
  designers?: Employee[];
  loading?: boolean;
  onRefresh?: () => void;
  onAssignmentClick?: (assignmentId: string) => void;
  onStatusUpdate?: (assignmentId: string, status: DesignAssignmentStatus) => void;
  showActions?: boolean;
  viewMode?: 'card' | 'table';
  allowFiltering?: boolean;
}

const DesignAssignmentList: React.FC<DesignAssignmentListProps> = ({
  assignments = [],
  designers = [],
  loading = false,
  onRefresh,
  onAssignmentClick,
  onStatusUpdate,
  showActions = true,
  viewMode = 'table',
  allowFiltering = true
}) => {
  const navigate = useNavigate();
  const [filteredAssignments, setFilteredAssignments] = useState<DesignAssignment[]>(assignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [designerFilter, setDesignerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Update filtered data when assignments change
  useEffect(() => {
    let filtered = [...assignments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.priority === priorityFilter);
    }

    // Apply designer filter
    if (designerFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.designerId === designerFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date = '';
      let bValue: string | number | Date = '';
      
      switch (sortBy) {
        case 'title': {
          aValue = (a as any).title || '';
          bValue = (b as any).title || '';
          break;
        }
        case 'deadline': {
          aValue = new Date((a as any).deadline || 0);
          bValue = new Date((b as any).deadline || 0);
          break;
        }
        case 'assignedAt': {
          aValue = new Date((a as any).assignedAt || 0);
          bValue = new Date((b as any).assignedAt || 0);
          break;
        }
        case 'priority': {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[(a as any).priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[(b as any).priority as keyof typeof priorityOrder] || 0;
          break;
        }
        case 'progress': {
          aValue = (a as any).progressPercentage || 0;
          bValue = (b as any).progressPercentage || 0;
          break;
        }
        default:
          aValue = a.assignedAt;
          bValue = b.assignedAt;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, statusFilter, priorityFilter, designerFilter, sortBy, sortOrder]);

  const handleAssignmentClick = (assignmentId: string) => {
    if (onAssignmentClick) {
      onAssignmentClick(assignmentId);
    } else {
      navigate(`/design/assignments/${assignmentId}`);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, status: DesignAssignmentStatus) => {
    try {
      if (onStatusUpdate) {
        onStatusUpdate(assignmentId, status);
      } else {
        await DesignAssignmentService.updateAssignmentStatus(assignmentId, { status });
        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái assignment",
        });
        onRefresh?.();
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: DesignAssignmentStatus) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-800' },
      in_progress: { variant: 'default' as const, label: 'Đang làm', color: 'bg-blue-100 text-blue-800' },
      review: { variant: 'secondary' as const, label: 'Review', color: 'bg-orange-100 text-orange-800' },
      revision: { variant: 'outline' as const, label: 'Sửa đổi', color: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'secondary' as const, label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      completed: { variant: 'default' as const, label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      cancelled: { variant: 'destructive' as const, label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      on_hold: { variant: 'outline' as const, label: 'Tạm dừng', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: DesignAssignmentPriority) => {
    const priorityConfig = {
      low: { variant: 'outline' as const, label: 'Thấp', color: 'text-gray-600' },
      medium: { variant: 'secondary' as const, label: 'Trung bình', color: 'text-blue-600' },
      high: { variant: 'default' as const, label: 'Cao', color: 'text-orange-600' },
      urgent: { variant: 'destructive' as const, label: 'Khẩn cấp', color: 'text-red-600' }
    };

    const config = priorityConfig[priority];
    return (
      <Badge variant={config.variant} className={config.color}>
        <Flag className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getDeadlineStatus = (deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { text: `Quá hạn ${Math.abs(daysLeft)} ngày`, color: 'text-red-600', urgent: true };
    } else if (daysLeft === 0) {
      return { text: 'Hết hạn hôm nay', color: 'text-red-600', urgent: true };
    } else if (daysLeft === 1) {
      return { text: 'Hết hạn ngày mai', color: 'text-orange-600', urgent: true };
    } else if (daysLeft <= 3) {
      return { text: `Còn ${daysLeft} ngày`, color: 'text-orange-600', urgent: false };
    } else {
      return { text: `Còn ${daysLeft} ngày`, color: 'text-green-600', urgent: false };
    }
  };

  const getDesignerName = (designerId: string) => {
    const designer = designers.find(d => d.id === designerId);
    return designer?.fullName || 'Chưa xác định';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ClipboardList className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Đang tải danh sách assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      {allowFiltering && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Design Assignments ({filteredAssignments.length}/{assignments.length})
                </CardTitle>
                <CardDescription>
                  Quản lý và theo dõi tất cả assignments được phân công
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Làm mới
                </Button>
                <Button onClick={() => navigate('/design/assignments/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Phân công mới
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="in_progress">Đang làm</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="revision">Sửa đổi</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                  <SelectItem value="on_hold">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>

              {designers.length > 0 && (
                <Select value={designerFilter} onValueChange={setDesignerFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Designer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {designers.map(designer => (
                      <SelectItem key={designer.id} value={designer.id}>
                        {designer.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline-asc">Deadline gần nhất</SelectItem>
                  <SelectItem value="deadline-desc">Deadline xa nhất</SelectItem>
                  <SelectItem value="priority-desc">Ưu tiên cao</SelectItem>
                  <SelectItem value="assignedAt-desc">Mới nhất</SelectItem>
                  <SelectItem value="title-asc">Tên A-Z</SelectItem>
                  <SelectItem value="progress-desc">Tiến độ cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {viewMode === 'card' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const deadlineStatus = getDeadlineStatus(assignment.deadline);
            return (
              <Card 
                key={assignment.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleAssignmentClick(assignment.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-2">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getDesignerName(assignment.designerId)}
                        </p>
                      </div>
                      {showActions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAssignmentClick(assignment.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/design/assignments/${assignment.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(assignment.id, 'in_progress')}
                              disabled={assignment.status === 'in_progress'}
                            >
                              Bắt đầu làm việc
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(assignment.id, 'completed')}
                              disabled={assignment.status === 'completed'}
                            >
                              Đánh dấu hoàn thành
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Status and Priority */}
                    <div className="flex gap-2">
                      {getStatusBadge(assignment.status)}
                      {getPriorityBadge(assignment.priority)}
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tiến độ</span>
                        <span className="font-medium">{assignment.progressPercentage}%</span>
                      </div>
                      <Progress value={assignment.progressPercentage} className="h-2" />
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Deadline:</span>
                      </div>
                      <span className={deadlineStatus.color}>
                        {deadlineStatus.text}
                      </span>
                    </div>

                    {/* Description */}
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    {/* Time tracking */}
                    {assignment.estimatedHours && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Dự kiến: {assignment.estimatedHours}h</span>
                        {assignment.actualHours && (
                          <span>Thực tế: {assignment.actualHours}h</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Table View
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Designer</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Thời gian</TableHead>
                  {showActions && <TableHead>Thao tác</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const deadlineStatus = getDeadlineStatus(assignment.deadline);
                  return (
                    <TableRow 
                      key={assignment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAssignmentClick(assignment.id)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {assignment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getDesignerName(assignment.designerId).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getDesignerName(assignment.designerId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assignment.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(assignment.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={assignment.progressPercentage} className="w-16 h-2" />
                          <span className="text-sm font-medium">{assignment.progressPercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(assignment.deadline).toLocaleDateString('vi-VN')}</div>
                          <div className={deadlineStatus.color}>
                            {deadlineStatus.text}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {assignment.estimatedHours && (
                            <div>Dự kiến: {assignment.estimatedHours}h</div>
                          )}
                          {assignment.actualHours && (
                            <div>Thực tế: {assignment.actualHours}h</div>
                          )}
                        </div>
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAssignmentClick(assignment.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/design/assignments/${assignment.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(assignment.id, 'in_progress')}
                                disabled={assignment.status === 'in_progress'}
                              >
                                Bắt đầu làm việc
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(assignment.id, 'completed')}
                                disabled={assignment.status === 'completed'}
                              >
                                Đánh dấu hoàn thành
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Không tìm thấy assignment nào</h3>
            <p className="text-muted-foreground mb-4">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setDesignerFilter('all');
                }}
              >
                Xóa bộ lọc
              </Button>
              <Button onClick={() => navigate('/design/assignments/new')}>
                Tạo assignment mới
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesignAssignmentList;