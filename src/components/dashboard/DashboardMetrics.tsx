import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
  DollarSign,
  ShoppingCart,
  Package,
  Bell
} from 'lucide-react';

export interface MetricData {
  label: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

interface DashboardMetricsProps {
  metrics: MetricData[];
  className?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  metrics,
  className
}) => {
  const getIconColor = (variant?: MetricData['variant']) => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'destructive':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <Icon className={`h-4 w-4 ${getIconColor(metric.variant)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              )}
              {metric.trend && (
                <div className={`flex items-center space-x-1 text-xs mt-1 ${getTrendColor(metric.trend.isPositive)}`}>
                  {metric.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{metric.trend.value}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

