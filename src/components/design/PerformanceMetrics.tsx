import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { DesignerWorkload, DesignerPerformance } from '@/types/design-monitoring';

interface PerformanceMetricsProps {
  workload: DesignerWorkload;
  performance: DesignerPerformance;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ workload, performance }) => {
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
              <Progress 
                value={workload.totalWorkload} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{workload.activeAssignments}</div>
                <div className="text-xs text-muted-foreground">Đang làm</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{workload.overdueAssignments}</div>
                <div className="text-xs text-muted-foreground">Quá hạn</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Hoàn thành tuần này:</span>
                <span className="font-medium">{workload.completedThisWeek}</span>
              </div>
              <div className="flex justify-between">
                <span>Hoàn thành tháng này:</span>
                <span className="font-medium">{workload.completedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span>Giờ ước tính còn lại:</span>
                <span className="font-medium">{workload.estimatedHoursRemaining}h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPerformanceTrendIcon()}
            Hiệu suất làm việc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tỷ lệ hoàn thành</span>
                <span className={`font-bold ${getPerformanceColor(performance.completionRate, { good: 85, warning: 70 })}`}>
                  {performance.completionRate}%
                </span>
              </div>
              <Progress value={performance.completionRate} className="h-2" />
            </div>

            {/* On-time Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tỷ lệ đúng hạn</span>
                <span className={`font-bold ${getPerformanceColor(performance.onTimeRate, { good: 80, warning: 65 })}`}>
                  {performance.onTimeRate}%
                </span>
              </div>
              <Progress value={performance.onTimeRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{performance.averageCompletionTime.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Ngày TB</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{performance.completedAssignments}</div>
                <div className="text-xs text-muted-foreground">Hoàn thành</div>
              </div>
            </div>

            {/* Performance Trend */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm">Xu hướng hiệu suất:</span>
                <Badge variant={
                  performance.performanceTrend === 'improving' ? 'default' :
                  performance.performanceTrend === 'declining' ? 'destructive' : 'secondary'
                }>
                  {performance.performanceTrend === 'improving' ? 'Cải thiện' :
                   performance.performanceTrend === 'declining' ? 'Giảm' : 'Ổn định'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tiến độ theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {performance.monthlyProgress.map((month) => (
              <div key={month.month} className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Tháng {month.month.split('-')[1]}/{month.month.split('-')[0]}
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-lg font-bold">{month.completedCount}</div>
                    <div className="text-xs text-muted-foreground">Hoàn thành</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{month.averageTime.toFixed(1)} ngày</div>
                    <div className="text-xs text-muted-foreground">Thời gian TB</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{month.onTimeRate}%</div>
                    <div className="text-xs text-muted-foreground">Đúng hạn</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};