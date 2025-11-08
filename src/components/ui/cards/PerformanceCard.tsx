import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

export interface PerformanceCardProps {
  title: string;
  subtitle?: string;
  score: number;
  maxScore?: number;
  icon?: LucideIcon;
  status?: 'excellent' | 'good' | 'average' | 'poor';
  details?: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
  }>;
  actions?: React.ReactNode;
  className?: string;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  title,
  subtitle,
  score,
  maxScore = 100,
  icon: Icon,
  status,
  details,
  actions,
  className
}) => {
  const percentage = (score / maxScore) * 100;
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'average':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'Xuất sắc';
      case 'good':
        return 'Tốt';
      case 'average':
        return 'Trung bình';
      case 'poor':
        return 'Cần cải thiện';
      default:
        return 'Chưa đánh giá';
    }
  };

  return (
    <Card className={`${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {status && (
            <Badge 
              className={`${getStatusColor(status)} text-white`}
              variant="default"
            >
              {getStatusText(status)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-sm text-muted-foreground">/ {maxScore}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}% hiệu suất
          </p>
        </div>

        {/* Details */}
        {details && details.length > 0 && (
          <div className="grid grid-cols-1 gap-3 pt-3 border-t">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {detail.icon && <detail.icon className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm">{detail.label}</span>
                </div>
                <span className="text-sm font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="pt-3 border-t">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
};