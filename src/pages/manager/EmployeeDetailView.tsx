import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  Edit,
  MessageSquare,
  Plus,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Settings
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

import { Employee, EmployeeAssignment, EmployeeMetrics } from '@/types/employee';
import { EmployeePerformanceService } from '@/services/employeeService';
import { UserManagementService } from '@/services/userService';


// Performance timeline component
const PerformanceTimeline: React.FC<{
  data: Array<{
    date: string;
    completionRate: number;
    productivity: number;
    workload: number;
  }>;
}> = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.slice(0, 7).map((item, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className="w-16 text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString('vi-VN', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Hoàn thành</span>
              <span>{item.completionRate}%</span>
            </div>
            <Progress value={item.completionRate} className="h-2" />
          </div>
          <div className="w-16 text-xs text-center">
            {item.workload > 80 ? (
              <Badge variant="destructive" className="text-xs">Cao</Badge>
            ) : item.workload > 60 ? (
              <Badge variant="secondary" className="text-xs">TB</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Thấp</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Assignment status component
const AssignmentStatusCard: React.FC<{
  assignment: EmployeeAssignment;
  onUpdateStatus: (assignmentId: string, status: string) => void;
}> = ({ assignment, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-orange-600 bg-orange-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const isOverdue = new Date(assignment.deadline) < new Date();
  const daysLeft = Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{assignment.designName}</h4>
            <p className="text-xs text-muted-foreground">#{assignment.designCode}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${getPriorityColor(assignment.priority)}`}
          >
            {assignment.priority === 'high' ? 'Cao' :
              assignment.priority === 'medium' ? 'Trung bình' : 'Thấp'}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span>Tiến độ</span>
            <span>{assignment.progress}%</span>
          </div>
          <Progress value={assignment.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              {isOverdue ? `Quá hạn ${Math.abs(daysLeft)} ngày` :
                daysLeft <= 0 ? 'Hôm nay' :
                  `Còn ${daysLeft} ngày`}
            </span>
          </div>
          <span className={isOverdue ? 'text-red-600' : ''}>
            {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-xs ${getStatusColor(assignment.status)}`}
          >
            {assignment.status === 'completed' ? 'Hoàn thành' :
              assignment.status === 'in_progress' ? 'Đang làm' :
                assignment.status === 'review' ? 'Chờ review' : 'Chờ bắt đầu'}
          </Badge>

          <Select
            value={assignment.status}
            onValueChange={(value) => onUpdateStatus(assignment.id, value)}
          >
            <SelectTrigger className="w-[100px] h-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ</SelectItem>
              <SelectItem value="in_progress">Đang làm</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

// Notes dialog component
const NotesDialog: React.FC<{
  employee: Employee;
  onSaveNote: (note: string) => void;
}> = ({ employee, onSaveNote }) => {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSaveNote(note);
    setNote('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Ghi chú
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi chú cho {employee.fullName}</DialogTitle>
          <DialogDescription>
            Thêm ghi chú về hiệu suất, phản hồi hoặc kế hoạch phát triển
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="note">Nội dung ghi chú</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú..."
              className="mt-2"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            Lưu ghi chú
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EmployeeDetailView: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [metrics, setMetrics] = useState<EmployeeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock performance timeline data
  const [performanceData] = useState([
    { date: '2024-11-01', completionRate: 85, productivity: 78, workload: 75 },
    { date: '2024-11-02', completionRate: 82, productivity: 80, workload: 80 },
    { date: '2024-11-03', completionRate: 88, productivity: 85, workload: 85 },
    { date: '2024-11-04', completionRate: 90, productivity: 88, workload: 70 },
    { date: '2024-11-05', completionRate: 87, productivity: 82, workload: 75 },
    { date: '2024-11-06', completionRate: 85, productivity: 79, workload: 80 },
    { date: '2024-11-07', completionRate: 89, productivity: 86, workload: 65 },
  ]);

  // Load employee data
  const loadEmployeeData = React.useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const [employeeData, assignmentsData, metricsData] = await Promise.all([
        UserManagementService.getUserById(employeeId),
        EmployeePerformanceService.getEmployeeAssignments(employeeId),
        EmployeePerformanceService.getEmployeeMetrics(employeeId)
      ]);

      setEmployee(employeeData);
      setAssignments(assignmentsData);
      setMetrics(metricsData);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin nhân viên",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
    }
  }, [loadEmployeeData, employeeId]);

  // Update assignment status
  const handleUpdateAssignmentStatus = async (assignmentId: string, status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'assigned') => {
    try {
      await EmployeePerformanceService.updateAssignmentStatus(assignmentId, status);
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái công việc thành công",
      });
      loadEmployeeData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  // Save employee note
  const handleSaveNote = async (note: string) => {
    if (!employee) return;

    try {
      await UserManagementService.updateUser(employee.id, {
        notes: (employee.notes || '') + '\n' + `[${new Date().toLocaleDateString('vi-VN')}] ${note}`
      });
      toast({
        title: "Thành công",
        description: "Đã lưu ghi chú",
      });
      loadEmployeeData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu ghi chú",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Không tìm thấy thông tin nhân viên</p>
        </div>
      </div>
    );
  }

  const activeAssignments = assignments.filter(a => a.status !== 'completed');
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/manager/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chi tiết nhân viên</h1>
            <p className="text-muted-foreground">
              Theo dõi hiệu suất và quản lý công việc của {employee.fullName}
            </p>
          </div>
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
          <Button onClick={loadEmployeeData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <NotesDialog employee={employee} onSaveNote={handleSaveNote} />
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={employee.avatar} />
              <AvatarFallback className="text-lg">
                {employee.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{employee.fullName}</h2>
                <p className="text-muted-foreground">{employee.role} - {employee.departmentName}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.phone || 'Chưa có'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Tham gia: {new Date(employee.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                    {employee.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workload hiện tại</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.currentWorkload}%</div>
            <Progress value={employee.currentWorkload} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {employee.currentWorkload > 80 ? 'Quá tải' :
                employee.currentWorkload > 60 ? 'Bình thường' : 'Còn trống'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completionRate || 0}%</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công việc đang làm</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter(a => a.status === 'review').length} chờ review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Tháng này: {metrics?.totalDesigns || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="assignments">Công việc ({activeAssignments.length})</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Công việc đang thực hiện</CardTitle>
                <CardDescription>
                  {activeAssignments.length} công việc đang xử lý
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAssignments.slice(0, 3).map((assignment) => (
                    <AssignmentStatusCard
                      key={assignment.id}
                      assignment={assignment}
                      onUpdateStatus={handleUpdateAssignmentStatus}
                    />
                  ))}
                  {activeAssignments.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('assignments')}
                    >
                      Xem tất cả {activeAssignments.length} công việc
                    </Button>
                  )}
                  {activeAssignments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Không có công việc đang thực hiện
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng hiệu suất</CardTitle>
                <CardDescription>
                  7 ngày gần đây
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceTimeline data={performanceData} />
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          {employee.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú quản lý</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {employee.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Tất cả công việc ({assignments.length})
            </h3>
            <Button onClick={() => navigate(`/manager/assignments/new?employee=${employee.id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Gán công việc mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <AssignmentStatusCard
                key={assignment.id}
                assignment={assignment}
                onUpdateStatus={handleUpdateAssignmentStatus}
              />
            ))}
          </div>

          {assignments.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Chưa có công việc nào được gán</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Điểm hiệu suất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics?.averageScore || 0}/10
                </div>
                <p className="text-sm text-muted-foreground">
                  Trung bình tháng này
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thời gian trung bình</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics?.averageCompletionTime || 0}h
                </div>
                <p className="text-sm text-muted-foreground">
                  Hoàn thành một thiết kế
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chất lượng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics?.qualityScore || 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Tỷ lệ thiết kế đạt chuẩn
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết hiệu suất theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                    <TableHead>Hiệu suất</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Đánh giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.completionRate} className="h-2 w-16" />
                          <span className="text-sm">{item.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.productivity} className="h-2 w-16" />
                          <span className="text-sm">{item.productivity}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.workload} className="h-2 w-16" />
                          <span className="text-sm">{item.workload}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.completionRate > 85 ? (
                          <Badge variant="default">Xuất sắc</Badge>
                        ) : item.completionRate > 70 ? (
                          <Badge variant="secondary">Tốt</Badge>
                        ) : (
                          <Badge variant="outline">Cần cải thiện</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử công việc đã hoàn thành</CardTitle>
              <CardDescription>
                {completedAssignments.length} công việc đã hoàn thành
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thiết kế</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedAssignments.slice(0, 10).map((assignment) => (
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
                        <span className="text-sm">
                          {assignment.actualHours || 0}h
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3 text-yellow-600" />
                          <span className="text-sm">{assignment.rating || 0}/10</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {assignment.completedAt &&
                            new Date(assignment.completedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {completedAssignments.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Chưa có công việc nào hoàn thành</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDetailView;