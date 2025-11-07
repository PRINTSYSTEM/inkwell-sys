import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Activity,
  Award,
  Calendar,
  Target
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
import { toast } from '@/hooks/use-toast';

import { DesignerWorkload } from '@/types/design-monitoring';
import { Employee } from '@/types/employee';

interface DesignerListProps {
  workloads: DesignerWorkload[];
  loading?: boolean;
  onRefresh?: () => void;
  onDesignerClick?: (designerId: string) => void;
  showActions?: boolean;
  viewMode?: 'card' | 'table';
}

const DesignerList: React.FC<DesignerListProps> = ({
  workloads = [],
  loading = false,
  onRefresh,
  onDesignerClick,
  showActions = true,
  viewMode = 'card'
}) => {
  const navigate = useNavigate();
  const [filteredWorkloads, setFilteredWorkloads] = useState<DesignerWorkload[]>(workloads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workloadFilter, setWorkloadFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Update filtered data when workloads change
  useEffect(() => {
    let filtered = [...workloads];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(workload =>
        workload.designer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workload.designer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workload => workload.availabilityStatus === statusFilter);
    }

    // Apply workload filter
    if (workloadFilter !== 'all') {
      switch (workloadFilter) {
        case 'underloaded':
          filtered = filtered.filter(w => w.totalWorkload < 50);
          break;
        case 'optimal':
          filtered = filtered.filter(w => w.totalWorkload >= 50 && w.totalWorkload <= 80);
          break;
        case 'overloaded':
          filtered = filtered.filter(w => w.totalWorkload > 80);
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.designer.fullName.localeCompare(b.designer.fullName);
        case 'workload':
          return b.totalWorkload - a.totalWorkload;
        case 'efficiency':
          return b.onTimeCompletionRate - a.onTimeCompletionRate;
        case 'completed':
          return b.completedThisMonth - a.completedThisMonth;
        default:
          return 0;
      }
    });

    setFilteredWorkloads(filtered);
  }, [workloads, searchTerm, statusFilter, workloadFilter, sortBy]);

  const handleDesignerClick = (designerId: string) => {
    if (onDesignerClick) {
      onDesignerClick(designerId);
    } else {
      navigate(`/design/designers/${designerId}`);
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload > 80) return 'text-red-600';
    if (workload > 60) return 'text-orange-600';
    return 'text-green-600';
  };

  const getAvailabilityBadge = (status: string) => {
    const variants = {
      'available': { variant: 'default' as const, label: 'Rảnh', color: 'bg-green-100 text-green-800' },
      'busy': { variant: 'secondary' as const, label: 'Bận', color: 'bg-blue-100 text-blue-800' },
      'overloaded': { variant: 'destructive' as const, label: 'Quá tải', color: 'bg-red-100 text-red-800' },
      'offline': { variant: 'outline' as const, label: 'Offline', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.offline;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Đang tải danh sách designers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách Designers ({filteredWorkloads.length}/{workloads.length})
          </CardTitle>
          <CardDescription>
            Quản lý và theo dõi workload của tất cả designers trong phòng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="available">Rảnh</SelectItem>
                  <SelectItem value="busy">Bận</SelectItem>
                  <SelectItem value="overloaded">Quá tải</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={workloadFilter} onValueChange={setWorkloadFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Workload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="underloaded">Thiếu tải (&lt;50%)</SelectItem>
                  <SelectItem value="optimal">Tối ưu (50-80%)</SelectItem>
                  <SelectItem value="overloaded">Quá tải (&gt;80%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                  <SelectItem value="workload">Workload cao</SelectItem>
                  <SelectItem value="efficiency">Hiệu suất cao</SelectItem>
                  <SelectItem value="completed">Hoàn thành nhiều</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'card' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkloads.map((workload) => (
            <Card 
              key={workload.designerId} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleDesignerClick(workload.designerId)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={workload.designer.avatar} />
                      <AvatarFallback>
                        {workload.designer.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg truncate">{workload.designer.fullName}</h3>
                      <p className="text-sm text-muted-foreground truncate">{workload.designer.email}</p>
                    </div>
                  </div>
                  {showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDesignerClick(workload.designerId);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/design/assignments/new?designer=${workload.designerId}`);
                        }}>
                          <Target className="h-4 w-4 mr-2" />
                          Phân công mới
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex justify-center">
                    {getAvailabilityBadge(workload.availabilityStatus)}
                  </div>

                  {/* Workload Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Workload</span>
                      <span className={`font-bold ${getWorkloadColor(workload.totalWorkload)}`}>
                        {workload.totalWorkload}%
                      </span>
                    </div>
                    <Progress value={workload.totalWorkload} className="h-3" />
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-bold text-blue-600">{workload.activeAssignments}</div>
                      <div className="text-blue-600 text-xs">Đang làm</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">{workload.completedThisMonth}</div>
                      <div className="text-green-600 text-xs">Hoàn thành</div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hiệu suất:</span>
                      <span className={`font-medium ${workload.onTimeCompletionRate > 80 ? 'text-green-600' : 
                                      workload.onTimeCompletionRate > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        {workload.onTimeCompletionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian TB:</span>
                      <span className="font-medium">{workload.averageCompletionTime.toFixed(1)} ngày</span>
                    </div>
                    {workload.overdueAssignments > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quá hạn:</span>
                        <span className="font-medium text-red-600">{workload.overdueAssignments}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Table View
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designer</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Đang làm</TableHead>
                  <TableHead>Hoàn thành</TableHead>
                  <TableHead>Hiệu suất</TableHead>
                  <TableHead>Quá hạn</TableHead>
                  {showActions && <TableHead>Thao tác</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkloads.map((workload) => (
                  <TableRow 
                    key={workload.designerId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleDesignerClick(workload.designerId)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={workload.designer.avatar} />
                          <AvatarFallback>
                            {workload.designer.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{workload.designer.fullName}</div>
                          <div className="text-sm text-muted-foreground">{workload.designer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAvailabilityBadge(workload.availabilityStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={workload.totalWorkload} className="w-16 h-2" />
                        <span className={`text-sm font-medium ${getWorkloadColor(workload.totalWorkload)}`}>
                          {workload.totalWorkload}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{workload.activeAssignments}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{workload.completedThisMonth}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${workload.onTimeCompletionRate > 80 ? 'text-green-600' : 
                                      workload.onTimeCompletionRate > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        {workload.onTimeCompletionRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {workload.overdueAssignments > 0 ? (
                        <span className="font-medium text-red-600">{workload.overdueAssignments}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
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
                            <DropdownMenuItem onClick={() => handleDesignerClick(workload.designerId)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/design/assignments/new?designer=${workload.designerId}`)}>
                              <Target className="h-4 w-4 mr-2" />
                              Phân công mới
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredWorkloads.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Không tìm thấy designer nào</h3>
            <p className="text-muted-foreground mb-4">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setWorkloadFilter('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesignerList;