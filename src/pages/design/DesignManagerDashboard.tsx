import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Target,
  Award,
  Activity,
  UserCheck,
  UserX,
  Plus,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Briefcase,
  ClipboardList,
  Timer,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAsync } from '@/hooks/use-async';
import { DashboardStatsSkeleton, DesignerCardSkeleton } from '@/components/ui/skeleton-components';
import { ErrorDisplay, EmptyState } from '@/components/ui/error-components';

import { DesignAssignmentService } from '@/services/designAssignmentService';
import UserService from '@/services/userService';
import { useAuth } from '@/hooks/use-auth';
import { 
  DesignerWorkload, 
  DepartmentDesignStats, 
  DesignMonitoringDashboard,
  DesignAssignment 
} from '@/types/design-monitoring';
import { Employee } from '@/types/employee';

// Mock data service - will be replaced with real API calls
const getMockDashboardData = async (): Promise<DesignMonitoringDashboard> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockDepartmentStats: DepartmentDesignStats = {
    departmentId: 'dept-design',
    departmentName: 'Phòng Thiết Kế',
    totalDesigners: 5,
    activeDesigners: 4,
    totalAssignments: 25,
    activeAssignments: 12,
    completedAssignments: 13,
    overdueAssignments: 3,
    departmentEfficiency: 85,
    averageCompletionTime: 5.2,
    onTimeDeliveryRate: 78,
    workloadDistribution: {
      underloaded: 1,
      optimal: 2,
      overloaded: 2
    },
    monthlyStats: [
      { month: '2024-09', completed: 8, assigned: 10, averageTime: 6.1 },
      { month: '2024-10', completed: 12, assigned: 15, averageTime: 5.8 },
      { month: '2024-11', completed: 5, assigned: 8, averageTime: 5.2 }
    ],
    topPerformers: [
      { designerId: 'emp-001', designerName: 'Nguyễn Văn A', completedCount: 8, efficiency: 92 },
      { designerId: 'emp-002', designerName: 'Trần Thị B', completedCount: 7, efficiency: 88 }
    ]
  };

  const mockDesignerWorkloads: DesignerWorkload[] = [
    {
      designerId: 'emp-001',
      designer: {
        id: 'emp-001',
        fullName: 'Nguyễn Văn A',
        email: 'designer1@company.com',
        role: 'design',
        departmentId: 'dept-design',
        status: 'active',
        avatar: '',
        phoneNumber: '',
        address: '',
        hireDate: '2023-01-15',
        currentWorkload: 85,
        metrics: {
          totalDesigns: 24,
          completedDesigns: 22,
          completionRate: 92
        } as EmployeeMetrics,
        skills: ['UI/UX', 'Graphic Design'],
        assignments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      activeAssignments: 4,
      totalWorkload: 85,
      overdueAssignments: 1,
      completedThisMonth: 8,
      completedThisWeek: 2,
      averageCompletionTime: 4.2,
      onTimeCompletionRate: 88,
      assignmentsByStatus: {
        pending: 1,
        in_progress: 2,
        review: 1,
        revision: 0,
        approved: 0
      },
      assignmentsByPriority: {
        low: 1,
        medium: 2,
        high: 1,
        urgent: 0
      },
      estimatedHoursRemaining: 32,
      actualHoursThisWeek: 28,
      isAvailable: false,
      availabilityStatus: 'busy'
    },
    {
      designerId: 'emp-002',
      designer: {
        id: 'emp-002',
        fullName: 'Trần Thị B',
        email: 'designer2@company.com',
        role: 'design',
        departmentId: 'dept-design',
        status: 'active',
        avatar: '',
        phoneNumber: '',
        address: '',
        hireDate: '2023-03-10',
        currentWorkload: 92,
        metrics: {
          totalDesigns: 21,
          completedDesigns: 19,
          completionRate: 90
        } as EmployeeMetrics,
        skills: ['Packaging Design', 'Print Design'],
        assignments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      activeAssignments: 5,
      totalWorkload: 92,
      overdueAssignments: 2,
      completedThisMonth: 7,
      completedThisWeek: 1,
      averageCompletionTime: 5.8,
      onTimeCompletionRate: 82,
      assignmentsByStatus: {
        pending: 0,
        in_progress: 3,
        review: 2,
        revision: 0,
        approved: 0
      },
      assignmentsByPriority: {
        low: 0,
        medium: 3,
        high: 2,
        urgent: 0
      },
      estimatedHoursRemaining: 48,
      actualHoursThisWeek: 35,
      isAvailable: false,
      availabilityStatus: 'overloaded'
    }
  ];

  return {
    departmentStats: mockDepartmentStats,
    designerWorkloads: mockDesignerWorkloads,
    recentActivities: [],
    urgentItems: {
      overdueAssignments: [],
      highPriorityPending: [],
      designersOverloaded: mockDesignerWorkloads.filter(d => d.availabilityStatus === 'overloaded')
    },
    alerts: [
      {
        type: 'overloaded',
        severity: 'high',
        message: 'Trần Thị B đang quá tải với 5 assignment đang thực hiện',
        relatedId: 'emp-002',
        timestamp: new Date()
      },
      {
        type: 'overdue',
        severity: 'medium',
        message: '3 assignments đã quá hạn deadline',
        relatedId: 'dept-design',
        timestamp: new Date()
      }
    ]
  };
};

const DesignManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DesignMonitoringDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('this_month');

  // Load dashboard data with useAsync hook
  const {
    data: asyncDashboardData,
    loading: asyncLoading,
    error,
    refetch
  } = useAsync(() => getMockDashboardData(), true);

  // Show content - backend handles authorization

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getMockDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast({
        title: "Thành công",
        description: "Đã cập nhật dữ liệu mới nhất",
      });
    } catch (error) {
      toast({
        title: "Lỗi", 
        description: "Không thể cập nhật dữ liệu",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (asyncLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý thiết kế</h1>
            <p className="text-muted-foreground">
              Dashboard tổng quan cho trưởng phòng thiết kế
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <DesignerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Không thể tải dữ liệu dashboard"
        error={error}
        onRetry={refetch}
      />
    );
  }

  if (!asyncDashboardData) {
    return (
      <EmptyState
        title="Không có dữ liệu"
        description="Không thể tải thông tin dashboard. Vui lòng thử lại sau."
        icon={<AlertTriangle className="h-12 w-12" />}
        action={
          <Button onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        }
      />
    );
  }

  const { departmentStats, designerWorkloads, alerts } = asyncDashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Quản Lý Thiết Kế</h1>
          <p className="text-gray-600 mt-1">
            Giám sát hiệu suất và workload của phòng thiết kế
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">Tuần này</SelectItem>
              <SelectItem value="this_month">Tháng này</SelectItem>
              <SelectItem value="last_month">Tháng trước</SelectItem>
              <SelectItem value="this_quarter">Quý này</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
          <Button onClick={() => navigate('/design/assignments/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Phân công mới</span>
            <span className="sm:hidden">Phân công</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {alert.type === 'overloaded' && 'Cảnh báo quá tải'}
                {alert.type === 'overdue' && 'Cảnh báo quá hạn'}
                {alert.type === 'low_performance' && 'Cảnh báo hiệu suất'}
                {alert.type === 'deadline_risk' && 'Nguy cơ trễ deadline'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Assignments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{departmentStats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {departmentStats.activeAssignments} đang thực hiện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiệu suất phòng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{departmentStats.departmentEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              {departmentStats.onTimeDeliveryRate}% đúng deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian TB</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{departmentStats.averageCompletionTime} ngày</div>
            <p className="text-xs text-muted-foreground">
              Thời gian hoàn thành trung bình
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-red-600">{departmentStats.overdueAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Assignments cần xử lý ngay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="designers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="designers">Danh sách Designers</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        {/* Designers Tab */}
        <TabsContent value="designers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Designers ({departmentStats.totalDesigners})</CardTitle>
              <CardDescription>
                Tình trạng workload và hiệu suất của từng designer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {designerWorkloads.map((workload) => (
                  <Card key={workload.designerId} className="cursor-pointer hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={workload.designer.avatar} />
                            <AvatarFallback>
                              {workload.designer.fullName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">{workload.designer.fullName}</h3>
                            <p className="text-sm text-muted-foreground truncate">{workload.designer.role}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={workload.availabilityStatus === 'available' ? 'default' : 
                                  workload.availabilityStatus === 'busy' ? 'secondary' : 'destructive'}
                          className="flex-shrink-0"
                        >
                          {workload.availabilityStatus === 'available' && 'Rảnh'}
                          {workload.availabilityStatus === 'busy' && 'Bận'}
                          {workload.availabilityStatus === 'overloaded' && 'Quá tải'}
                          {workload.availabilityStatus === 'offline' && 'Offline'}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Workload</span>
                            <span className={`font-medium ${
                              workload.totalWorkload > 80 ? 'text-red-600' :
                              workload.totalWorkload > 60 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {workload.totalWorkload}%
                            </span>
                          </div>
                          <Progress value={workload.totalWorkload} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Đang làm:</span>
                            <span className="font-medium ml-1">{workload.activeAssignments}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quá hạn:</span>
                            <span className={`font-medium ml-1 ${workload.overdueAssignments > 0 ? 'text-red-600' : ''}`}>
                              {workload.overdueAssignments}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hoàn thành tháng:</span>
                            <span className="font-medium ml-1">{workload.completedThisMonth}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Đúng hạn:</span>
                            <span className="font-medium ml-1">{workload.onTimeCompletionRate}%</span>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate(`/design/designers/${workload.designerId}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments Overview</CardTitle>
              <CardDescription>
                Tổng quan về tất cả assignments trong phòng thiết kế
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">{departmentStats.activeAssignments}</div>
                  <div className="text-sm text-blue-600">Đang thực hiện</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{departmentStats.completedAssignments}</div>
                  <div className="text-sm text-green-600">Đã hoàn thành</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">
                    {designerWorkloads.reduce((sum, w) => sum + w.assignmentsByStatus.review, 0)}
                  </div>
                  <div className="text-sm text-orange-600">Đang review</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">{departmentStats.overdueAssignments}</div>
                  <div className="text-sm text-red-600">Quá hạn</div>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/design/assignments')}
                className="w-full"
              >
                Xem tất cả Assignments
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố Workload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Thiếu tải (&lt;50%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-2 bg-green-200 rounded"></div>
                      <span className="font-medium">{departmentStats.workloadDistribution.underloaded}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tối ưu (50-80%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-2 bg-blue-200 rounded"></div>
                      <span className="font-medium">{departmentStats.workloadDistribution.optimal}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Quá tải (&gt;80%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-2 bg-red-200 rounded"></div>
                      <span className="font-medium">{departmentStats.workloadDistribution.overloaded}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departmentStats.topPerformers.map((performer, index) => (
                    <div key={performer.designerId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span>{performer.designerName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{performer.completedCount} designs</div>
                        <div className="text-sm text-muted-foreground">{performer.efficiency}% hiệu suất</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignManagerDashboard;