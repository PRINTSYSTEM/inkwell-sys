import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Plus,
  RefreshCw,
  BarChart3,
  Timer,
  Flag,
  Users,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

import { DesignerPerformance, DesignerWorkload, DesignAssignment } from '@/types/design-monitoring';
import { Employee } from '@/types/employee';
import { DesignAssignmentService } from '@/services/designAssignmentService';
import { UserService } from '@/services/userService';
import DesignAssignmentList from '@/components/DesignAssignmentList';

// Mock performance data
const getMockDesignerPerformance = (designerId: string): DesignerPerformance => ({
  designerId,
  designer: {
    id: designerId,
    fullName: 'Nguyễn Văn A',
    email: 'designer1@company.com',
    role: 'designer',
    departmentId: 'dept-design',
    status: 'active',
    avatar: '',
    phoneNumber: '+84 123 456 789',
    address: 'Hà Nội, Việt Nam',
    hireDate: new Date('2023-01-15'),
    currentWorkload: 85,
    metrics: {
      totalDesigns: 24,
      completedDesigns: 22,
      completionRate: 92,
      averageRating: 4.6
    },
    skills: ['UI/UX Design', 'Graphic Design', 'Packaging Design'],
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  periodStart: new Date('2024-10-01'),
  periodEnd: new Date('2024-11-06'),
  totalAssignments: 15,
  completedAssignments: 12,
  completionRate: 80,
  averageCompletionTime: 4.2,
  fastestCompletion: 2.1,
  slowestCompletion: 8.5,
  revisionRate: 1.3,
  approvalRate: 85,
  customerSatisfactionScore: 4.5,
  peakWorkload: 5,
  averageWorkload: 3.2,
  workloadEfficiency: 88,
  onTimeDeliveries: 10,
  lateDeliveries: 2,
  onTimeRate: 83,
  skillAreas: [
    { skillName: 'UI/UX Design', assignmentCount: 8, averageRating: 4.6 },
    { skillName: 'Graphic Design', assignmentCount: 4, averageRating: 4.3 },
    { skillName: 'Packaging Design', assignmentCount: 3, averageRating: 4.7 }
  ],
  recentAssignments: [],
  performanceTrend: 'improving',
  monthlyProgress: [
    { month: '2024-08', completedCount: 5, averageTime: 5.2, onTimeRate: 75 },
    { month: '2024-09', completedCount: 7, averageTime: 4.8, onTimeRate: 78 },
    { month: '2024-10', completedCount: 8, averageTime: 4.2, onTimeRate: 83 }
  ]
});

const DesignerDetailView: React.FC = () => {
  const { designerId } = useParams<{ designerId: string }>();
  const navigate = useNavigate();
  
  const [designer, setDesigner] = useState<Employee | null>(null);
  const [workload, setWorkload] = useState<DesignerWorkload | null>(null);
  const [performance, setPerformance] = useState<DesignerPerformance | null>(null);
  const [assignments, setAssignments] = useState<DesignAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Load designer data
  const loadDesignerData = useCallback(async () => {
    if (!designerId) return;
    
    try {
      setLoading(true);
      
      // Load designer info (mock for now)
      const mockDesigner: Employee = {
        id: designerId,
        fullName: 'Nguyễn Văn A',
        email: 'designer1@company.com',
        role: 'designer',
        departmentId: 'dept-design',
        status: 'active',
        avatar: '',
        phoneNumber: '+84 123 456 789',
        address: 'Hà Nội, Việt Nam',
        hireDate: new Date('2023-01-15'),
        currentWorkload: 85,
        metrics: {
          totalDesigns: 24,
          completedDesigns: 22,
          completionRate: 92,
          averageRating: 4.6
        },
        skills: ['UI/UX Design', 'Graphic Design', 'Packaging Design'],
        assignments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Load workload data
      const workloadData = await DesignAssignmentService.getDesignerWorkload(designerId);
      const mockWorkload: DesignerWorkload = {
        designerId,
        designer: mockDesigner,
        activeAssignments: workloadData.activeAssignments,
        totalWorkload: workloadData.totalWorkload,
        overdueAssignments: workloadData.overdueAssignments,
        completedThisMonth: workloadData.completedThisMonth,
        completedThisWeek: 2,
        averageCompletionTime: workloadData.averageCompletionTime,
        onTimeCompletionRate: 83,
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
        isAvailable: workloadData.totalWorkload < 80,
        availabilityStatus: workloadData.totalWorkload > 80 ? 'overloaded' : 'busy'
      };

      // Load assignments
      const assignmentData = await DesignAssignmentService.getAssignmentsByDesigner(designerId);
      
      // Load performance data
      const performanceData = getMockDesignerPerformance(designerId);
      
      setDesigner(mockDesigner);
      setWorkload(mockWorkload);
      setAssignments(assignmentData.data);
      setPerformance(performanceData);
      
    } catch (error) {
      console.error('Error loading designer data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin designer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [designerId]);

  const handleRefresh = () => {
    loadDesignerData();
    toast({
      title: "Thành công",
      description: "Đã cập nhật dữ liệu mới nhất",
    });
  };

  useEffect(() => {
    loadDesignerData();
  }, [loadDesignerData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Đang tải thông tin designer...</p>
        </div>
      </div>
    );
  }

  if (!designer || !workload || !performance) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p>Không tìm thấy thông tin designer</p>
          <Button onClick={() => navigate('/design/management')} className="mt-2">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const getPerformanceTrendIcon = () => {
    switch (performance.performanceTrend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/design/management')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Chi tiết Designer</h1>
          <p className="text-muted-foreground mt-1">
            Thông tin chi tiết và hiệu suất làm việc
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button 
            onClick={() => navigate(`/design/assignments/new?designer=${designerId}`)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Phân công mới
          </Button>
        </div>
      </div>

      {/* Designer Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={designer.avatar} />
              <AvatarFallback className="text-lg">
                {designer.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{designer.fullName}</h2>
                  <p className="text-lg text-muted-foreground capitalize">{designer.role}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {designer.email}
                    </div>
                    {designer.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {designer.phoneNumber}
                      </div>
                    )}
                    {designer.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {designer.address}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={workload.availabilityStatus === 'available' ? 'default' : 
                            workload.availabilityStatus === 'busy' ? 'secondary' : 'destructive'}
                    className="mb-2"
                  >
                    {workload.availabilityStatus === 'available' && 'Rảnh'}
                    {workload.availabilityStatus === 'busy' && 'Bận'}
                    {workload.availabilityStatus === 'overloaded' && 'Quá tải'}
                    {workload.availabilityStatus === 'offline' && 'Offline'}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Gia nhập: {designer.hireDate.toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Kỹ năng:</p>
                <div className="flex gap-2">
                  {designer.skills?.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{workload.activeAssignments}</div>
            <div className="text-sm text-muted-foreground">Assignments đang làm</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{performance.completedAssignments}</div>
            <div className="text-sm text-muted-foreground">Đã hoàn thành tháng này</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{performance.averageCompletionTime.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Ngày hoàn thành TB</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{performance.onTimeRate}%</div>
            <div className="text-sm text-muted-foreground">Tỷ lệ đúng hạn</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
          <TabsTrigger value="skills">Kỹ năng</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Workload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Workload hiện tại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tải công việc tổng</span>
                      <span className={`font-bold ${
                        workload.totalWorkload > 80 ? 'text-red-600' :
                        workload.totalWorkload > 60 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {workload.totalWorkload}%
                      </span>
                    </div>
                    <Progress value={workload.totalWorkload} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-blue-600">{workload.assignmentsByStatus.in_progress}</div>
                      <div className="text-blue-600">Đang làm</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-orange-600">{workload.assignmentsByStatus.review}</div>
                      <div className="text-orange-600">Đang review</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-gray-600">{workload.assignmentsByStatus.pending}</div>
                      <div className="text-gray-600">Chờ xử lý</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-red-600">{workload.overdueAssignments}</div>
                      <div className="text-red-600">Quá hạn</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPerformanceTrendIcon()}
                  Xu hướng hiệu suất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
                      <div className={`text-lg font-bold ${getPerformanceColor(performance.completionRate, { good: 80, warning: 60 })}`}>
                        {performance.completionRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tỷ lệ đúng hạn</div>
                      <div className={`text-lg font-bold ${getPerformanceColor(performance.onTimeRate, { good: 80, warning: 60 })}`}>
                        {performance.onTimeRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tỷ lệ duyệt lần đầu</div>
                      <div className={`text-lg font-bold ${getPerformanceColor(performance.approvalRate, { good: 80, warning: 60 })}`}>
                        {performance.approvalRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Hiệu suất workload</div>
                      <div className={`text-lg font-bold ${getPerformanceColor(performance.workloadEfficiency, { good: 80, warning: 60 })}`}>
                        {performance.workloadEfficiency}%
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">Tiến trình 3 tháng gần nhất:</div>
                    <div className="space-y-2">
                      {performance.monthlyProgress.map((month, index) => (
                        <div key={month.month} className="flex justify-between text-sm">
                          <span>{month.month}</span>
                          <span>{month.completedCount} assignments</span>
                          <span className={getPerformanceColor(month.onTimeRate, { good: 80, warning: 60 })}>
                            {month.onTimeRate}% đúng hạn
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <DesignAssignmentList
            assignments={assignments}
            loading={false}
            onRefresh={loadDesignerData}
            viewMode="table"
            allowFiltering={true}
          />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tổng assignments:</span>
                    <span className="font-medium">{performance.totalAssignments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đã hoàn thành:</span>
                    <span className="font-medium">{performance.completedAssignments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian hoàn thành nhanh nhất:</span>
                    <span className="font-medium">{performance.fastestCompletion} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian hoàn thành chậm nhất:</span>
                    <span className="font-medium">{performance.slowestCompletion} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số lần revision trung bình:</span>
                    <span className="font-medium">{performance.revisionRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak workload:</span>
                    <span className="font-medium">{performance.peakWorkload} assignments</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workload trung bình:</span>
                    <span className="font-medium">{performance.averageWorkload} assignments</span>
                  </div>
                  {performance.customerSatisfactionScore && (
                    <div className="flex justify-between">
                      <span>Điểm hài lòng khách hàng:</span>
                      <span className="font-medium">{performance.customerSatisfactionScore}/5</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân tích deadline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{performance.onTimeDeliveries}</div>
                    <div className="text-sm text-muted-foreground">Giao đúng hạn</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{performance.lateDeliveries}</div>
                    <div className="text-sm text-muted-foreground">Giao trễ hạn</div>
                  </div>
                  <div className="text-center pt-4 border-t">
                    <div className={`text-2xl font-bold ${getPerformanceColor(performance.onTimeRate, { good: 80, warning: 60 })}`}>
                      {performance.onTimeRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Tỷ lệ đúng hạn tổng</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chuyên môn theo lĩnh vực</CardTitle>
              <CardDescription>
                Phân tích hiệu suất theo từng lĩnh vực kỹ năng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.skillAreas.map((skill, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{skill.skillName}</h3>
                      {skill.averageRating && (
                        <Badge variant="outline">
                          {skill.averageRating}/5 ⭐
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Số assignments: {skill.assignmentCount}</span>
                      <span>
                        {((skill.assignmentCount / performance.totalAssignments) * 100).toFixed(1)}% 
                        tổng workload
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignerDetailView;