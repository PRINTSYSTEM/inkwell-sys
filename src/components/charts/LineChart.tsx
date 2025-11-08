import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, CustomTooltip, CustomLegend, type ChartContainerProps } from './ChartBase';
import { chartUtils, defaultChartConfig, type ChartConfig, type ChartDataPoint } from './chart-utils';

export interface LineChartProps<T extends ChartDataPoint> extends Omit<ChartContainerProps, 'children'> {
  data: T[];
  xAxisKey: keyof T;
  yAxisKeys: Array<{
    key: keyof T;
    name?: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    dot?: boolean;
  }>;
  config?: Partial<ChartConfig>;
  xAxisFormatter?: (value: unknown) => string;
  yAxisFormatter?: (value: number) => string;
  valueType?: 'number' | 'currency' | 'percentage';
  showDots?: boolean;
  smooth?: boolean;
  connectNulls?: boolean;
}

export function LineChart<T extends ChartDataPoint>({
  data,
  xAxisKey,
  yAxisKeys,
  config = {},
  xAxisFormatter,
  yAxisFormatter,
  valueType = 'number',
  showDots = true,
  smooth = false,
  connectNulls = false,
  ...containerProps
}: LineChartProps<T>) {
  const chartConfig = { ...defaultChartConfig, ...config };
  const colors = chartUtils.generateColors(yAxisKeys.length);

  // Format X-axis values
  const formatXAxis = xAxisFormatter || ((value: unknown) => {
    if (value instanceof Date) {
      return chartUtils.formatDate(value);
    }
    return String(value);
  });

  // Format Y-axis values
  const formatYAxis = yAxisFormatter || ((value: number) => {
    return chartUtils.formatValue(value, valueType);
  });

  // Format tooltip values
  const formatTooltipValue = (value: number, name: string) => {
    return chartUtils.formatValue(value, valueType);
  };

  // Format tooltip label
  const formatTooltipLabel = (label: string) => {
    return formatXAxis(label);
  };

  const isEmpty = !data || data.length === 0;

  return (
    <ChartContainer 
      {...containerProps}
      empty={isEmpty}
    >
      <ResponsiveContainer 
        width="100%" 
        height={chartConfig.height}
      >
        <RechartsLineChart
          data={data}
          margin={chartConfig.margin}
        >
          {chartConfig.showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
          )}
          
          <XAxis
            dataKey={xAxisKey as string}
            tickFormatter={formatXAxis}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            tickFormatter={formatYAxis}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          {chartConfig.showTooltip && (
            <Tooltip
              content={
                <CustomTooltip
                  valueType={valueType}
                  valueFormatter={formatTooltipValue}
                  labelFormatter={formatTooltipLabel}
                />
              }
            />
          )}

          {chartConfig.showLegend && (
            <Legend
              content={<CustomLegend />}
            />
          )}

          {yAxisKeys.map((yAxis, index) => (
            <Line
              key={String(yAxis.key)}
              type={smooth ? 'monotone' : 'linear'}
              dataKey={yAxis.key as string}
              name={yAxis.name || String(yAxis.key)}
              stroke={yAxis.color || colors[index]}
              strokeWidth={yAxis.strokeWidth || 2}
              strokeDasharray={yAxis.strokeDasharray}
              dot={yAxis.dot !== undefined ? yAxis.dot : showDots}
              connectNulls={connectNulls}
              animationDuration={chartConfig.animation ? 1000 : 0}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Specialized line chart variants
export interface SimpleLineChartProps<T extends ChartDataPoint> extends Omit<LineChartProps<T>, 'yAxisKeys'> {
  yAxisKey: keyof T;
  lineColor?: string;
  lineName?: string;
}

export function SimpleLineChart<T extends ChartDataPoint>({
  yAxisKey,
  lineColor,
  lineName,
  ...props
}: SimpleLineChartProps<T>) {
  const yAxisKeys = [{
    key: yAxisKey,
    name: lineName,
    color: lineColor
  }];

  return <LineChart {...props} yAxisKeys={yAxisKeys} />;
}

// Multi-line chart with predefined styling
export interface MultiLineChartProps<T extends ChartDataPoint> extends Omit<LineChartProps<T>, 'yAxisKeys'> {
  yAxisKeys: (keyof T)[];
  lineNames?: string[];
  lineColors?: string[];
}

export function MultiLineChart<T extends ChartDataPoint>({
  yAxisKeys: keys,
  lineNames = [],
  lineColors = [],
  ...props
}: MultiLineChartProps<T>) {
  const yAxisKeys = keys.map((key, index) => ({
    key,
    name: lineNames[index] || String(key),
    color: lineColors[index]
  }));

  return <LineChart {...props} yAxisKeys={yAxisKeys} />;
}

// Time series line chart with date formatting
export interface TimeSeriesLineChartProps<T extends ChartDataPoint> extends Omit<LineChartProps<T>, 'xAxisFormatter'> {
  dateFormat?: 'short' | 'medium' | 'long';
}

export function TimeSeriesLineChart<T extends ChartDataPoint>({
  dateFormat = 'short',
  ...props
}: TimeSeriesLineChartProps<T>) {
  const xAxisFormatter = (value: unknown) => {
    if (value instanceof Date || typeof value === 'string') {
      return chartUtils.formatDate(value, dateFormat);
    }
    return String(value);
  };

  return <LineChart {...props} xAxisFormatter={xAxisFormatter} />;
}