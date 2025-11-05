import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  DollarSign,
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Settings,
  Plus,
  Bell
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { toast } from '@/hooks/use-toast';

import { 
  DepartmentAnalytics, 
  DepartmentKPI, 
  PerformanceTrend, 
  DepartmentComparison,
  DepartmentAlert,
  DepartmentGoal,
  AnalyticsTimeframe,
  AnalyticsInsight
} from '@/types/department-analytics';
import { DepartmentAnalyticsService } from '@/services/departmentAnalyticsService';

// KPI Card Component
const KPICard: React.FC<{ kpi: DepartmentKPI }> = ({ kpi }) => {
  const getTrendIcon = () => {
    switch (kpi.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (kpi.status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'VNĐ') {
      return new Intl.NumberFormat('vi-VN').format(value);
    }
    return Math.round(value * 100) / 100;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {kpi.name}
          </CardTitle>
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold">
              {formatValue(kpi.value, kpi.unit)}
            </span>
            <span className="text-sm text-muted-foreground">{kpi.unit}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Target: {formatValue(kpi.target, kpi.unit)}
            </span>
            <Badge variant="outline" className={`${getStatusColor()}`}>
              {kpi.changePercent > 0 ? '+' : ''}{Math.round(kpi.changePercent)}%
            </Badge>
          </div>
          
          <Progress 
            value={(kpi.value / kpi.target) * 100} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Alert Card Component
const AlertCard: React.FC<{ 
  alert: DepartmentAlert; 
  onAcknowledge: (alertId: string) => void; 
}> = ({ alert, onAcknowledge }) => {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getSeverityIcon()}
            <CardTitle className="text-sm">{alert.title}</CardTitle>
          </div>
          <Badge variant="outline" className="capitalize">
            {alert.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{alert.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Hiện tại:</span>
            <span className="font-medium">{alert.currentValue}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Ngưỡng:</span>
            <span className="font-medium">{alert.threshold}%</span>
          </div>
        </div>

        <div className="p-2 bg-muted rounded text-xs">
          <strong>Khuyến nghị:</strong> {alert.recommendedAction}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAcknowledge(alert.id)}
          >
            Xác nhận
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Goal Card Component
const GoalCard: React.FC<{ goal: DepartmentGoal }> = ({ goal }) => {
  const getStatusColor = () => {
    switch (goal.status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = () => {
    switch (goal.priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{goal.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getPriorityColor()}>
              {goal.priority}
            </Badge>
            <Badge variant="outline" className={getStatusColor()}>
              {goal.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{goal.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến độ:</span>
            <span className="font-medium">{Math.round(goal.progress)}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Hiện tại: {goal.currentValue}</span>
          <span>Mục tiêu: {goal.targetValue}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Hạn: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
          </span>
          <span className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>{goal.assignedTo.length} người</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Insight Card Component
const InsightCard: React.FC<{ insight: AnalyticsInsight }> = ({ insight }) => {
  const getTypeIcon = () => {
    switch (insight.type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'achievement': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'recommendation': return <Target className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (insight.type) {
      case 'opportunity': return 'border-green-500 bg-green-50';
      case 'risk': return 'border-red-500 bg-red-50';
      case 'achievement': return 'border-blue-500 bg-blue-50';
      case 'recommendation': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className={`border-l-4 ${getTypeColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <CardTitle className="text-sm">{insight.title}</CardTitle>
          </div>
          <Badge variant="outline" className="capitalize">
            {insight.impact}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{insight.description}</p>
        
        <div className="text-xs">
          <span className="text-muted-foreground">Độ tin cậy: </span>
          <span className="font-medium">{Math.round(insight.confidence * 100)}%</span>
        </div>

        {insight.suggestedActions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium">Hành động khuyến nghị:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {insight.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DepartmentAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [comparisons, setComparisons] = useState<DepartmentComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('dept_design');
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>({
    period: 'month',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    label: 'Tháng này'
  });

  // Load data
  const loadAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsData, comparisonData] = await Promise.all([
        DepartmentAnalyticsService.getDepartmentAnalytics(selectedDepartment, timeframe),
        DepartmentAnalyticsService.getMultiDepartmentComparison(
          ['dept_design', 'dept_production', 'dept_marketing'], 
          timeframe
        )
      ]);

      setAnalytics(analyticsData);
      setComparisons(comparisonData);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu phân tích",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, timeframe]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await DepartmentAnalyticsService.acknowledgeAlert(alertId, 'current_user');
      toast({
        title: "Thành công",
        description: "Đã xác nhận cảnh báo",
      });
      loadAnalytics();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xác nhận cảnh báo",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const report = await DepartmentAnalyticsService.generateReport(
        [selectedDepartment],
        timeframe,
        ['productivity', 'efficiency', 'quality', 'revenue'],
        'pdf'
      );

      const blob = await DepartmentAnalyticsService.exportReport(report.id, 'pdf');
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-analytics-${selectedDepartment}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: "Đã xuất báo cáo phân tích",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xuất báo cáo",
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không có dữ liệu phân tích</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phân tích phòng ban</h1>
          <p className="text-muted-foreground">
            Báo cáo chi tiết về hiệu suất và phân tích dữ liệu phòng ban
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Chọn phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dept_design">Phòng Thiết kế</SelectItem>
            <SelectItem value="dept_production">Phòng Sản xuất</SelectItem>
            <SelectItem value="dept_marketing">Phòng Marketing</SelectItem>
            <SelectItem value="dept_sales">Phòng Kinh doanh</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={timeframe.period} 
          onValueChange={(period) => {
            const newTimeframe = { ...timeframe, period: period as 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom' };
            switch (period) {
              case 'week':
                newTimeframe.label = 'Tuần này';
                newTimeframe.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                break;
              case 'month':
                newTimeframe.label = 'Tháng này';
                newTimeframe.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                break;
              case 'quarter':
                newTimeframe.label = 'Quý này';
                newTimeframe.startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
                break;
            }
            setTimeframe(newTimeframe);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Tuần này</SelectItem>
            <SelectItem value="month">Tháng này</SelectItem>
            <SelectItem value="quarter">Quý này</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {analytics.kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
          <TabsTrigger value="comparison">So sánh</TabsTrigger>
          <TabsTrigger value="projects">Dự án</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
          <TabsTrigger value="goals">Mục tiêu</TabsTrigger>
          <TabsTrigger value="insights">Phân tích</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất tổng quan</CardTitle>
                <CardDescription>
                  Các chỉ số chính trong {timeframe.label.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Năng suất', value: analytics.metrics.productivity, target: 85 },
                    { name: 'Hiệu quả', value: analytics.metrics.efficiency, target: 80 },
                    { name: 'Chất lượng', value: analytics.metrics.qualityScore, target: 90 },
                    { name: 'Hoàn thành', value: analytics.metrics.completionRate, target: 95 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" name="Thực tế" />
                    <Bar dataKey="target" fill="#e5e7eb" name="Mục tiêu" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Sử dụng tài nguyên</CardTitle>
                <CardDescription>
                  Tình hình sử dụng nhân lực và thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Nhân lực</span>
                      <span className="text-sm font-medium">
                        {Math.round(analytics.resourceUtilization.humanResources.utilizationRate)}%
                      </span>
                    </div>
                    <Progress value={analytics.resourceUtilization.humanResources.utilizationRate} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Thiết bị</span>
                      <span className="text-sm font-medium">
                        {Math.round(analytics.resourceUtilization.equipment.utilizationRate)}%
                      </span>
                    </div>
                    <Progress value={analytics.resourceUtilization.equipment.utilizationRate} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Ngân sách</span>
                      <span className="text-sm font-medium">
                        {Math.round(analytics.resourceUtilization.budget.utilizationRate)}%
                      </span>
                    </div>
                    <Progress value={analytics.resourceUtilization.budget.utilizationRate} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.metrics.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.metrics.activeEmployees} đang hoạt động
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND',
                    notation: 'compact'
                  }).format(analytics.metrics.revenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lợi nhuận: {Math.round(analytics.metrics.profitMargin)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dự án</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.projectStats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.projectStats.completedProjects} hoàn thành
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thời gian TB</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.metrics.avgTaskTime * 10) / 10} ngày
                </div>
                <p className="text-xs text-muted-foreground">
                  Đúng hạn: {Math.round(analytics.projectStats.onTimeDelivery)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng hiệu suất</CardTitle>
                <CardDescription>
                  Biến động các chỉ số trong {timeframe.label.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="productivity" stroke="#3b82f6" name="Năng suất" />
                    <Line type="monotone" dataKey="efficiency" stroke="#10b981" name="Hiệu quả" />
                    <Line type="monotone" dataKey="quality" stroke="#f59e0b" name="Chất lượng" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng doanh thu</CardTitle>
                <CardDescription>
                  Biến động doanh thu theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND' 
                        }).format(value), 
                        'Doanh thu'
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>So sánh phòng ban</CardTitle>
              <CardDescription>
                Bảng xếp hạng các phòng ban theo hiệu suất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisons}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="metrics.productivity" fill="#3b82f6" name="Năng suất" />
                  <Bar dataKey="metrics.efficiency" fill="#10b981" name="Hiệu quả" />
                  <Bar dataKey="metrics.quality" fill="#f59e0b" name="Chất lượng" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisons.map((dept) => (
              <Card key={dept.departmentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dept.departmentName}</CardTitle>
                    <Badge variant="outline">#{dept.ranking}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Điểm tổng:</span>
                    <span className="font-medium">{Math.round(dept.score)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Nhân viên:</span>
                    <span className="font-medium">{dept.metrics.employeeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Doanh thu:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(dept.metrics.revenue)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tổng dự án</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.projectStats.totalProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.projectStats.completedProjects}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Đang thực hiện</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.projectStats.inProgressProjects}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trễ hạn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.projectStats.overdueProjects}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố trạng thái dự án</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Hoàn thành', value: analytics.projectStats.completedProjects, fill: '#10b981' },
                        { name: 'Đang thực hiện', value: analytics.projectStats.inProgressProjects, fill: '#3b82f6' },
                        { name: 'Trễ hạn', value: analytics.projectStats.overdueProjects, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {[
                        { name: 'Hoàn thành', value: analytics.projectStats.completedProjects, fill: '#10b981' },
                        { name: 'Đang thực hiện', value: analytics.projectStats.inProgressProjects, fill: '#3b82f6' },
                        { name: 'Trễ hạn', value: analytics.projectStats.overdueProjects, fill: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chỉ số dự án</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Đúng hạn</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.projectStats.onTimeDelivery)}%
                    </span>
                  </div>
                  <Progress value={analytics.projectStats.onTimeDelivery} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Sử dụng ngân sách</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.projectStats.budgetUtilization)}%
                    </span>
                  </div>
                  <Progress value={analytics.projectStats.budgetUtilization} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Hài lòng khách hàng</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.projectStats.clientSatisfaction * 10) / 10}/5.0
                    </span>
                  </div>
                  <Progress value={(analytics.projectStats.clientSatisfaction / 5) * 100} />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Thời gian TB hoàn thành</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.projectStats.avgCompletionTime * 10) / 10} ngày
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Cảnh báo hiện tại</h3>
            <Badge variant="destructive">
              {analytics.alerts.filter(a => a.isActive).length} cảnh báo
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.alerts.filter(a => a.isActive).map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onAcknowledge={handleAcknowledgeAlert}
              />
            ))}
          </div>

          {analytics.alerts.filter(a => a.isActive).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">Không có cảnh báo</h3>
                <p className="text-muted-foreground">
                  Tất cả các chỉ số đều trong mức bình thường
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Mục tiêu phòng ban</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm mục tiêu
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Phân tích thông minh</h3>
            <Badge variant="outline">
              {analytics.insights.length} insight
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DepartmentAnalyticsDashboard;