import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { DesignerWorkload, DesignerPerformance } from '@/types/design-monitoring';
import { MetricsCard } from '@/components/ui/cards';

interface QuickStatsProps {
  workload: DesignerWorkload;
  performance: DesignerPerformance;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ workload, performance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricsCard
        title="Assignments đang làm"
        value={workload.activeAssignments}
        icon={Target}
        badge={{
          text: workload.overdueAssignments > 0 ? `${workload.overdueAssignments} quá hạn` : 'Đúng hạn',
          variant: workload.overdueAssignments > 0 ? 'destructive' : 'default'
        }}
      />

      <MetricsCard
        title="Đã hoàn thành tháng này"
        value={performance.completedAssignments}
        icon={CheckCircle}
        change={{
          value: 15,
          type: 'increase',
          period: 'so với tháng trước'
        }}
      />

      <MetricsCard
        title="Ngày hoàn thành TB"
        value={`${performance.averageCompletionTime.toFixed(1)} ngày`}
        icon={Clock}
        change={{
          value: 8,
          type: 'decrease',
          period: 'so với tháng trước'
        }}
      />

      <MetricsCard
        title="Tỷ lệ đúng hạn"
        value={`${performance.onTimeRate}%`}
        icon={Award}
        change={{
          value: 5,
          type: performance.onTimeRate > 80 ? 'increase' : 'decrease',
          period: 'so với tháng trước'
        }}
      />
    </div>
  );
};