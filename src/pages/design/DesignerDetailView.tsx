import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

import { DesignerPerformance, DesignerWorkload, DesignAssignment } from '@/types/design-monitoring';
import { Employee } from '@/types/employee';
import { DesignAssignmentService } from '@/services/designAssignmentService';

// Import micro-components
import { 
  DesignerInfo, 
  PerformanceMetrics, 
  QuickStats, 
  DesignerActions, 
  AssignmentHistory 
} from '@/components/design';

// Mock performance data
const getMockDesignerPerformance = (designerId: string): DesignerPerformance => ({
  designerId,
  designer: {
    id: designerId,
    username: 'designer1',
    fullName: 'Nguyễn Văn A',
    email: 'designer1@company.com',
    role: 'design',
    department: 'dept-design',
    departmentName: 'Design Department',
    status: 'active',
    avatar: '',
    phone: '+84 123 456 789',
    address: 'Hà Nội, Việt Nam',
    hireDate: '2023-01-15',
    currentWorkload: 85,
    permissions: [],
    createdBy: 'system',
    updatedBy: 'system',
    certifications: ['Adobe Certified Expert', 'Figma Professional'],
    availability: 'available' as const,
    metrics: {
      totalDesigns: 24,
      completedDesigns: 22,
      inProgressDesigns: 2,
      pendingDesigns: 0,
      averageCompletionTime: 4.2,
      completionRate: 92,
      workloadScore: 85,
      averageScore: 8.5,
      qualityScore: 92,
      lastActivityDate: new Date().toISOString(),
      monthlyMetrics: []
    },
    skills: ['UI/UX Design', 'Graphic Design', 'Packaging Design'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
        username: 'designer1',
        fullName: 'Nguyễn Văn A',
        email: 'designer1@company.com',
        role: 'design',
        department: 'dept-design',
        departmentName: 'Design Department',
        status: 'active',
        avatar: '',
        phone: '+84 123 456 789',
        address: 'Hà Nội, Việt Nam',
        hireDate: '2023-01-15',
        currentWorkload: 85,
        permissions: [],
        createdBy: 'system',
        updatedBy: 'system',
        certifications: ['Adobe Certified Expert', 'Figma Professional'],
        availability: 'available' as const,
        metrics: {
          totalDesigns: 24,
          completedDesigns: 22,
          inProgressDesigns: 2,
          pendingDesigns: 0,
          averageCompletionTime: 4.2,
          completionRate: 92,
          workloadScore: 85,
          averageScore: 8.5,
          qualityScore: 92,
          lastActivityDate: new Date().toISOString(),
          monthlyMetrics: []
        },
        skills: ['UI/UX Design', 'Graphic Design', 'Packaging Design'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

  const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-orange-600';
    return 'text-red-600';
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



  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Actions */}
      <DesignerActions 
        designerId={designerId!} 
        onRefresh={handleRefresh} 
      />

      {/* Designer Info */}
      <DesignerInfo designer={designer} workload={workload} />

      {/* Quick Stats */}
      <QuickStats workload={workload} performance={performance} />

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
          <PerformanceMetrics workload={workload} performance={performance} />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <AssignmentHistory 
            assignments={assignments}
            onAssignmentClick={(assignment) => {
              // Handle assignment click
              console.log('Assignment clicked:', assignment);
            }}
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