import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: LucideIcon;
}

export interface StatisticsCardProps {
  title: string;
  subtitle?: string;
  stats: StatItem[];
  layout?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  showBorders?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: LucideIcon;
  }>;
  className?: string;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  subtitle,
  stats,
  layout = 'grid',
  columns = 2,
  showBorders = true,
  actions,
  className
}) => {
  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeSymbol = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      default:
        return '→';
    }
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {actions && actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={
            layout === 'grid'
              ? `grid ${gridCols[columns]} gap-4`
              : 'space-y-4'
          }
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${
                showBorders && layout === 'grid'
                  ? 'p-4 border rounded-lg bg-gray-50/50'
                  : layout === 'list'
                  ? 'p-3 border-b last:border-b-0'
                  : 'p-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stat.icon && (
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 ${getChangeColor(stat.change.type)}`}>
                    <span className="text-xs">
                      {getChangeSymbol(stat.change.type)}
                    </span>
                    <span className="text-xs font-medium">
                      {Math.abs(stat.change.value)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};