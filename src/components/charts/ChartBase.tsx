import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { defaultChartConfig, chartUtils, type ChartDataPoint, type ChartConfig } from './chart-utils';

// Chart container props
export interface ChartContainerProps {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

// Chart container component
export function ChartContainer({
  title,
  description,
  className,
  children,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Không có dữ liệu để hiển thị',
  actions
}: ChartContainerProps) {
  return (
    <Card className={cn('w-full', className)}>
      {(title || description || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            {title && <CardTitle className="text-base font-medium">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: defaultChartConfig.height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-destructive" style={{ height: defaultChartConfig.height }}>
            <div className="text-center">
              <div className="text-sm font-medium">Có lỗi xảy ra</div>
              <div className="text-xs text-muted-foreground mt-1">{error}</div>
            </div>
          </div>
        ) : empty ? (
          <div className="flex items-center justify-center text-muted-foreground" style={{ height: defaultChartConfig.height }}>
            <div className="text-center">
              <div className="text-sm">{emptyMessage}</div>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}



// Custom tooltip component
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  valueType?: 'number' | 'currency' | 'percentage';
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  valueType = 'number',
  labelFormatter,
  valueFormatter
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatLabel = labelFormatter || ((l: string) => l);
  const formatValue = valueFormatter || ((v: number) => chartUtils.formatValue(v, valueType));

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[120px]">
      {label && (
        <div className="text-sm font-medium text-foreground mb-2">
          {formatLabel(label)}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
            </div>
            <span className="font-medium text-foreground">
              {formatValue(entry.value, entry.name)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Legend component
export interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    type: string;
  }>;
  onClick?: (data: { value: string; color: string; type: string }, index: number) => void;
}

export function CustomLegend({ payload, onClick }: CustomLegendProps) {
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <button
          key={index}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onClick?.(entry, index)}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </button>
      ))}
    </div>
  );
}