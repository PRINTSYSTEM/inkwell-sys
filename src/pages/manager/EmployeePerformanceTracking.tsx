import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  BarChart3,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Activity,
  Star,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  ArrowUpRight,
  ArrowDownRight
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { toast } from '@/hooks/use-toast';

import { Employee, EmployeeMetrics, EmployeeAssignment } from '@/types/employee';
import { UserManagementService } from '@/services/userService';
import { EmployeePerformanceService } from '@/services/employeeService';

// TODO: Chart data types - Consider moving to shared types or keeping as UI-specific interfaces
interface ChartDataPoint {
  date: string;
  completionRate: number;
  productivity: number;
}

interface ComparisonDataPoint {
  name: string;
  completionRate: number;
  workload: number;
  score: number;
}

interface DistributionDataPoint {
  name: string;
  value: number;
}

// Performance trend chart component
const PerformanceTrendChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="completionRate"
          stackId="1"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
          name="Tỷ lệ hoàn thành (%)"
        />
        <Area
          type="monotone"
          dataKey="productivity"
          stackId="2"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.6}
          name="Hiệu suất (%)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Employee comparison chart
const EmployeeComparisonChart: React.FC<{ data: ComparisonDataPoint[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="completionRate" fill="#8884d8" name="Hoàn thành (%)" />
        <Bar dataKey="workload" fill="#82ca9d" name="Workload (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Performance distribution pie chart
const PerformanceDistributionChart: React.FC<{ data: DistributionDataPoint[] }> = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Performance metrics card
const PerformanceMetricCard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  format?: 'number' | 'percentage' | 'time';
}> = ({ title, value, change, icon, format = 'number' }) => {
  const isPositive = change > 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  const formatValue = (val: string | number) => {
    if (format === 'percentage') return `${val}%`;
    if (format === 'time') return `${val}h`;
    return val;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        <div className={`text-xs flex items-center ${changeColor}`}>
          <ChangeIcon className="h-3 w-3 mr-1" />
          {Math.abs(change)}% so với tháng trước
        </div>
      </CardContent>
    </Card>
  );
};

// Employee performance row
const EmployeePerformanceRow: React.FC<{
  employee: Employee;
  metrics: EmployeeMetrics;
  onViewDetails: (employeeId: string) => void;
}> = ({ employee, metrics, onViewDetails }) => {
  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { label: 'Xuất sắc', color: 'text-green-600 bg-green-50' };
    if (rate >= 80) return { label: 'Tốt', color: 'text-blue-600 bg-blue-50' };
    if (rate >= 70) return { label: 'Khá', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Cần cải thiện', color: 'text-red-600 bg-red-50' };
  };

  const performance = getPerformanceLevel(metrics.completionRate || 0);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.avatar} />
            <AvatarFallback>
              {employee.fullName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{employee.fullName}</p>
            <p className="text-xs text-muted-foreground">{employee.departmentName}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Progress value={metrics.completionRate || 0} className="h-2 w-16" />
          <span className="text-sm font-medium">{metrics.completionRate || 0}%</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Progress value={employee.currentWorkload} className="h-2 w-16" />
          <span className="text-sm font-medium">{employee.currentWorkload}%</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{metrics.totalDesigns || 0}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{metrics.completedDesigns || 0}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{metrics.averageCompletionTime || 0}h</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={performance.color}>
          {performance.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
          <span className="text-sm">{metrics.averageScore || 0}/10</span>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(employee.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const EmployeePerformanceTracking: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeMetrics, setEmployeeMetrics] = useState<Record<string, EmployeeMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('completionRate');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock performance data for charts
  const [performanceTrendData] = useState<ChartDataPoint[]>([
    { date: '01/11', completionRate: 85, productivity: 78 },
    { date: '02/11', completionRate: 88, productivity: 82 },
    { date: '03/11', completionRate: 82, productivity: 79 },
    { date: '04/11', completionRate: 90, productivity: 85 },
    { date: '05/11', completionRate: 87, productivity: 83 },
    { date: '06/11', completionRate: 89, productivity: 87 },
    { date: '07/11', completionRate: 92, productivity: 89 }
  ]);

  const [performanceDistribution] = useState<DistributionDataPoint[]>([
    { name: 'Xuất sắc (≥90%)', value: 25 },
    { name: 'Tốt (80-89%)', value: 40 },
    { name: 'Khá (70-79%)', value: 25 },
    { name: 'Cần cải thiện (<70%)', value: 10 }
  ]);

  // Load data
  const loadPerformanceData = React.useCallback(async () => {
    try {
      setLoading(true);
      const userListResponse = await UserManagementService.getUsers({});
      const allEmployees = userListResponse.users;

      // Filter by department if selected
      const filteredEmployees = selectedDepartment && selectedDepartment !== 'all'
        ? allEmployees.filter(emp => emp.department === selectedDepartment)
        : allEmployees;

      setEmployees(filteredEmployees);

      // Load metrics for each employee
      const metricsPromises = filteredEmployees.map(async (emp) => {
        const metrics = await EmployeePerformanceService.getEmployeeMetrics(emp.id);
        return { employeeId: emp.id, metrics };
      });

      const metricsResults = await Promise.all(metricsPromises);
      const metricsMap = metricsResults.reduce((acc, { employeeId, metrics }) => {
        acc[employeeId] = metrics;
        return acc;
      }, {} as Record<string, EmployeeMetrics>);

      setEmployeeMetrics(metricsMap);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu hiệu suất",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Sort employees by selected criteria
  const sortedEmployees = React.useMemo(() => {
    return [...employees].sort((a, b) => {
      const aMetrics = employeeMetrics[a.id];
      const bMetrics = employeeMetrics[b.id];

      switch (sortBy) {
        case 'completionRate':
          return (bMetrics?.completionRate || 0) - (aMetrics?.completionRate || 0);
        case 'workload':
          return b.currentWorkload - a.currentWorkload;
        case 'totalDesigns':
          return (bMetrics?.totalDesigns || 0) - (aMetrics?.totalDesigns || 0);
        case 'averageScore':
          return (bMetrics?.averageScore || 0) - (aMetrics?.averageScore || 0);
        default:
          return 0;
      }
    });
  }, [employees, employeeMetrics, sortBy]);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (employees.length === 0) return null;

    const totalEmployees = employees.length;
    const avgCompletionRate = employees.reduce((sum, emp) =>
      sum + (employeeMetrics[emp.id]?.completionRate || 0), 0) / totalEmployees;
    const avgWorkload = employees.reduce((sum, emp) =>
      sum + emp.currentWorkload, 0) / totalEmployees;
    const totalDesigns = employees.reduce((sum, emp) =>
      sum + (employeeMetrics[emp.id]?.totalDesigns || 0), 0);
    const totalCompleted = employees.reduce((sum, emp) =>
      sum + (employeeMetrics[emp.id]?.completedDesigns || 0), 0);
    const avgScore = employees.reduce((sum, emp) =>
      sum + (employeeMetrics[emp.id]?.averageScore || 0), 0) / totalEmployees;

    return {
      totalEmployees,
      avgCompletionRate: Math.round(avgCompletionRate),
      avgWorkload: Math.round(avgWorkload),
      totalDesigns,
      totalCompleted,
      avgScore: Math.round(avgScore * 10) / 10
    };
  }, [employees, employeeMetrics]);

  // Employee comparison data for charts
  const comparisonData = React.useMemo<ComparisonDataPoint[]>(() => {
    return sortedEmployees.slice(0, 10).map(emp => ({
      name: emp.fullName.split(' ').pop() || emp.fullName, // Last name only for chart
      completionRate: employeeMetrics[emp.id]?.completionRate || 0,
      workload: emp.currentWorkload,
      score: employeeMetrics[emp.id]?.averageScore || 0
    }));
  }, [sortedEmployees, employeeMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theo dõi hiệu suất</h1>
          <p className="text-muted-foreground">
            Phân tích và theo dõi hiệu suất làm việc của tất cả nhân viên
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              <SelectItem value="dept-design">Phòng thiết kế</SelectItem>
              <SelectItem value="dept-production">Phòng sản xuất</SelectItem>
              <SelectItem value="dept-sales">Phòng kinh doanh</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">Tuần này</SelectItem>
              <SelectItem value="thisMonth">Tháng này</SelectItem>
              <SelectItem value="thisQuarter">Quý này</SelectItem>
              <SelectItem value="thisYear">Năm này</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadPerformanceData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>

          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <PerformanceMetricCard
            title="Tổng nhân viên"
            value={summaryStats.totalEmployees}
            change={5}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
          <PerformanceMetricCard
            title="Hoàn thành TB"
            value={summaryStats.avgCompletionRate}
            change={3}
            icon={<Target className="h-4 w-4 text-green-600" />}
            format="percentage"
          />
          <PerformanceMetricCard
            title="Workload TB"
            value={summaryStats.avgWorkload}
            change={-2}
            icon={<Activity className="h-4 w-4 text-orange-600" />}
            format="percentage"
          />
          <PerformanceMetricCard
            title="Tổng thiết kế"
            value={summaryStats.totalDesigns}
            change={8}
            icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
          />
          <PerformanceMetricCard
            title="Đã hoàn thành"
            value={summaryStats.totalCompleted}
            change={12}
            icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          />
          <PerformanceMetricCard
            title="Điểm TB"
            value={summaryStats.avgScore}
            change={1.5}
            icon={<Star className="h-4 w-4 text-yellow-600" />}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="employees">Nhân viên ({employees.length})</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng hiệu suất 7 ngày</CardTitle>
                <CardDescription>
                  Theo dõi xu hướng hoàn thành và hiệu suất theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceTrendChart data={performanceTrendData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân bố hiệu suất</CardTitle>
                <CardDescription>
                  Tỷ lệ nhân viên theo mức độ hiệu suất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceDistributionChart data={performanceDistribution} />
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 nhân viên xuất sắc</CardTitle>
              <CardDescription>
                Nhân viên có hiệu suất cao nhất trong kỳ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedEmployees.slice(0, 5).map((employee, index) => {
                  const metrics = employeeMetrics[employee.id];
                  return (
                    <div key={employee.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>
                          {employee.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-sm text-muted-foreground">{employee.departmentName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{metrics?.completionRate || 0}%</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics?.completedDesigns || 0} thiết kế
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/manager/employees/${employee.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Danh sách nhân viên</h3>
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completionRate">Tỷ lệ hoàn thành</SelectItem>
                  <SelectItem value="workload">Workload</SelectItem>
                  <SelectItem value="totalDesigns">Tổng thiết kế</SelectItem>
                  <SelectItem value="averageScore">Điểm trung bình</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Tổng TK</TableHead>
                    <TableHead>Đã hoàn thành</TableHead>
                    <TableHead>Thời gian TB</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEmployees.map((employee) => (
                    <EmployeePerformanceRow
                      key={employee.id}
                      employee={employee}
                      metrics={employeeMetrics[employee.id] || {} as EmployeeMetrics}
                      onViewDetails={(id) => navigate(`/manager/employees/${id}`)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>So sánh hiệu suất nhân viên</CardTitle>
              <CardDescription>
                Biểu đồ so sánh tỷ lệ hoàn thành và workload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeComparisonChart data={comparisonData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân tích workload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quá tải (&gt;80%)</span>
                    <Badge variant="destructive">
                      {employees.filter(emp => emp.currentWorkload > 80).length} nhân viên
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bình thường (60-80%)</span>
                    <Badge variant="secondary">
                      {employees.filter(emp => emp.currentWorkload >= 60 && emp.currentWorkload <= 80).length} nhân viên
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Còn trống (&lt;60%)</span>
                    <Badge variant="outline">
                      {employees.filter(emp => emp.currentWorkload < 60).length} nhân viên
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Khuyến nghị</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Cần can thiệp ngay
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      {employees.filter(emp => emp.currentWorkload > 80).length} nhân viên đang quá tải
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Có thể gán thêm việc
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {employees.filter(emp => emp.currentWorkload < 60).length} nhân viên còn dư thời gian
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng hoàn thành theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Tỷ lệ hoàn thành (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng hiệu suất</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="productivity"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Hiệu suất (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dự báo xu hướng</CardTitle>
              <CardDescription>
                Phân tích và dự báo hiệu suất trong tương lai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">Tháng tới</h4>
                  <p className="text-2xl font-bold text-green-600">+5%</p>
                  <p className="text-xs text-muted-foreground">Dự kiến tăng hiệu suất</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">Quý này</h4>
                  <p className="text-2xl font-bold text-blue-600">92%</p>
                  <p className="text-xs text-muted-foreground">Mục tiêu hoàn thành</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <h4 className="font-medium">Top performer</h4>
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                  <p className="text-xs text-muted-foreground">Nhân viên xuất sắc dự kiến</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeePerformanceTracking;