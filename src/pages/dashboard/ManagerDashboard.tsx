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
  RefreshCw
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

import { Employee, Department, ManagerDashboard, DepartmentAlert, DepartmentPerformance } from '@/types/employee';
import { DepartmentManagementService } from '@/services/departmentService';
import { useAuth } from '@/hooks/use-auth';

// Performance chart component (simplified)
const PerformanceChart: React.FC<{ data: DepartmentPerformance }> = ({ data }) => {
  return (
    <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
      <div className="text-center">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Biểu đồ hiệu suất phòng ban</p>
        <p className="text-xs text-muted-foreground mt-1">
          Productivity: {data?.productivityScore || 0}%
        </p>
      </div>
    </div>
  );
};

// Employee card component
const EmployeeCard: React.FC<{
  employee: Employee;
  onViewDetails: (employee: Employee) => void;
}> = ({ employee, onViewDetails }) => {
  const workloadColor = employee.currentWorkload > 80 ? 'text-red-600' : 
                       employee.currentWorkload > 60 ? 'text-orange-600' : 
                       'text-green-600';

  const performanceColor = (employee.metrics?.completionRate || 0) > 80 ? 'text-green-600' :
                          (employee.metrics?.completionRate || 0) > 60 ? 'text-orange-600' :
                          'text-red-600';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(employee)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar} />
              <AvatarFallback>
                {employee.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{employee.fullName}</h3>
              <p className="text-xs text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
            {employee.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
          </Badge>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span>Workload</span>
            <span className={`font-medium ${workloadColor}`}>{employee.currentWorkload}%</span>
          </div>
          <Progress value={employee.currentWorkload} className="h-2" />
          
          <div className="flex justify-between items-center text-xs">
            <span>Hiệu suất</span>
            <span className={`font-medium ${performanceColor}`}>
              {employee.metrics?.completionRate || 0}%
            </span>
          </div>
          <Progress value={employee.metrics?.completionRate || 0} className="h-2" />
        </div>

        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Thiết kế: {employee.metrics?.totalDesigns || 0}</span>
          <span>Hoàn thành: {employee.metrics?.completedDesigns || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Alert item component
const AlertItem: React.FC<{
  alert: DepartmentAlert;
  onDismiss: (alertId: string) => void;
}> = ({ alert, onDismiss }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'overload': return <AlertTriangle className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      case 'performance': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (): "default" | "destructive" | "outline" => {
    switch (alert.severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-3">
      {getAlertIcon()}
      <AlertTitle className="flex items-center justify-between">
        <span>{alert.type === 'overload' ? 'Quá tải' : 
               alert.type === 'deadline' ? 'Deadline' : 
               'Hiệu suất'}</span>
        {alert.actionRequired && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(alert.id)}
            className="h-6 px-2"
          >
            Đã xử lý
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        {alert.message}
        {alert.employeeName && (
          <span className="block text-xs mt-1 font-medium">
            Nhân viên: {alert.employeeName}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<ManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [activeTab, setActiveTab] = useState('overview');

  // Load dashboard data
  const loadDashboardData = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await DepartmentManagementService.getManagerDashboard(user.id);
      setDashboardData(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, selectedPeriod, loadDashboardData]);

  // Handle alert dismiss
  const handleDismissAlert = async (alertId: string) => {
    try {
      await DepartmentManagementService.dismissAlert(alertId);
      toast({
        title: "Thành công",
        description: "Đã xử lý cảnh báo",
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xử lý cảnh báo",
        variant: "destructive",
      });
    }
  };

  // View employee details
  const handleViewEmployee = (employee: Employee) => {
    navigate(`/manager/employees/${employee.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Không tìm thấy dữ liệu phòng ban</p>
        </div>
      </div>
    );
  }

  const { department, performance, employees, recentAssignments, pendingReviews, alerts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Phòng ban</h1>
          <p className="text-muted-foreground">
            Tổng quan hiệu suất và quản lý nhân viên - {department.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">Tuần này</SelectItem>
              <SelectItem value="thisMonth">Tháng này</SelectItem>
              <SelectItem value="thisQuarter">Quý này</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => navigate('/manager/reports')} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Báo cáo
          </Button>
        </div>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              +{employees.filter(e => e.status === 'active').length} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiệu suất</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.productivityScore}%</div>
            <p className="text-xs text-green-600">
              +5% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.inProgressDesigns}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReviews.length} chờ review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.completedDesigns}</div>
            <p className="text-xs text-green-600">
              {performance.totalDesigns > 0 ? Math.round((performance.completedDesigns / performance.totalDesigns) * 100) : 0}% tỷ lệ hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Cảnh báo ({alerts.filter(a => a.actionRequired).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismissAlert}
                />
              ))}
              {alerts.length > 3 && (
                <Button variant="outline" size="sm" onClick={() => navigate('/manager/alerts')}>
                  Xem tất cả {alerts.length} cảnh báo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="employees">Nhân viên</TabsTrigger>
          <TabsTrigger value="assignments">Công việc</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Biểu đồ hiệu suất</CardTitle>
                <CardDescription>
                  Theo dõi xu hướng hiệu suất phòng ban theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={performance} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân bố workload</CardTitle>
                <CardDescription>
                  Tình trạng công việc của từng nhân viên
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.slice(0, 5).map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback className="text-xs">
                          {employee.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{employee.fullName}</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={employee.currentWorkload} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground min-w-0">
                            {employee.currentWorkload}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Nhân viên phòng ban ({employees.length})</h3>
            <Button onClick={() => navigate('/manager/employees/assign')}>
              <Plus className="h-4 w-4 mr-2" />
              Gán công việc
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onViewDetails={handleViewEmployee}
              />
            ))}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Công việc gần đây</h3>
            <Button variant="outline" onClick={() => navigate('/manager/assignments')}>
              <Eye className="h-4 w-4 mr-2" />
              Xem tất cả
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thiết kế</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Tiến độ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssignments.slice(0, 5).map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.designName}</p>
                          <p className="text-sm text-muted-foreground">
                            #{assignment.designCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {assignment.employeeName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignment.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          assignment.status === 'completed' ? 'default' :
                          assignment.status === 'in_progress' ? 'secondary' :
                          assignment.status === 'review' ? 'outline' : 'destructive'
                        }>
                          {assignment.status === 'completed' ? 'Hoàn thành' :
                           assignment.status === 'in_progress' ? 'Đang làm' :
                           assignment.status === 'review' ? 'Chờ review' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={assignment.progress} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">
                            {assignment.progress}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                {employees.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={employees[0].avatar} />
                      <AvatarFallback>
                        {employees[0].fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employees[0].fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {employees[0].metrics?.completionRate || 0}% completion rate
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cần hỗ trợ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {employees.filter(e => e.currentWorkload > 80).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  nhân viên có workload cao
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Xu hướng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Tăng 5%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  so với tháng trước
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết hiệu suất nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.fullName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.fullName}</p>
                            <p className="text-sm text-muted-foreground">{employee.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={employee.metrics?.completionRate || 0} className="h-2 w-16" />
                          <span className="text-sm">{employee.metrics?.completionRate || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={employee.currentWorkload} className="h-2 w-16" />
                          <span className="text-sm">{employee.currentWorkload}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.currentWorkload > 80 ? (
                          <Badge variant="destructive">Quá tải</Badge>
                        ) : employee.currentWorkload > 60 ? (
                          <Badge variant="secondary">Bình thường</Badge>
                        ) : (
                          <Badge variant="outline">Còn trống</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;