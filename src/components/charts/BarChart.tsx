import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, CustomTooltip, CustomLegend, type ChartContainerProps } from './ChartBase';
import { chartUtils, defaultChartConfig, type ChartConfig, type ChartDataPoint } from './chart-utils';

export interface BarChartProps<T extends ChartDataPoint> extends Omit<ChartContainerProps, 'children'> {
  data: T[];
  xAxisKey: keyof T;
  yAxisKeys: Array<{
    key: keyof T;
    name?: string;
    color?: string;
    stackId?: string;
  }>;
  config?: Partial<ChartConfig>;
  xAxisFormatter?: (value: unknown) => string;
  yAxisFormatter?: (value: number) => string;
  valueType?: 'number' | 'currency' | 'percentage';
  layout?: 'vertical' | 'horizontal';
  barSize?: number;
  maxBarSize?: number;
}

export function BarChart<T extends ChartDataPoint>({
  data,
  xAxisKey,
  yAxisKeys,
  config = {},
  xAxisFormatter,
  yAxisFormatter,
  valueType = 'number',
  layout = 'horizontal',
  barSize,
  maxBarSize,
  ...containerProps
}: BarChartProps<T>) {
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

  const ChartComponent = layout === 'vertical' ? RechartsBarChart : RechartsBarChart;

  return (
    <ChartContainer 
      {...containerProps}
      empty={isEmpty}
    >
      <ResponsiveContainer 
        width="100%" 
        height={chartConfig.height}
      >
        <ChartComponent
          layout={layout === 'vertical' ? 'horizontal' : 'vertical'}
          data={data}
          margin={chartConfig.margin}
          barSize={barSize}
          maxBarSize={maxBarSize}
        >
          {chartConfig.showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
          )}
          
          {layout === 'horizontal' ? (
            <>
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
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tickFormatter={formatYAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey as string}
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
            </>
          )}

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
            <Bar
              key={String(yAxis.key)}
              dataKey={yAxis.key as string}
              name={yAxis.name || String(yAxis.key)}
              fill={yAxis.color || colors[index]}
              stackId={yAxis.stackId}
              animationDuration={chartConfig.animation ? 1000 : 0}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Specialized bar chart variants
export interface SimpleBarChartProps<T extends ChartDataPoint> extends Omit<BarChartProps<T>, 'yAxisKeys'> {
  yAxisKey: keyof T;
  barColor?: string;
  barName?: string;
}

export function SimpleBarChart<T extends ChartDataPoint>({
  yAxisKey,
  barColor,
  barName,
  ...props
}: SimpleBarChartProps<T>) {
  const yAxisKeys = [{
    key: yAxisKey,
    name: barName,
    color: barColor
  }];

  return <BarChart {...props} yAxisKeys={yAxisKeys} />;
}

// Stacked bar chart
export interface StackedBarChartProps<T extends ChartDataPoint> extends Omit<BarChartProps<T>, 'yAxisKeys'> {
  yAxisKeys: (keyof T)[];
  barNames?: string[];
  barColors?: string[];
  stackId?: string;
}

export function StackedBarChart<T extends ChartDataPoint>({
  yAxisKeys: keys,
  barNames = [],
  barColors = [],
  stackId = 'default',
  ...props
}: StackedBarChartProps<T>) {
  const yAxisKeys = keys.map((key, index) => ({
    key,
    name: barNames[index] || String(key),
    color: barColors[index],
    stackId
  }));

  return <BarChart {...props} yAxisKeys={yAxisKeys} />;
}

// Grouped bar chart
export interface GroupedBarChartProps<T extends ChartDataPoint> extends Omit<BarChartProps<T>, 'yAxisKeys'> {
  yAxisKeys: (keyof T)[];
  barNames?: string[];
  barColors?: string[];
}

export function GroupedBarChart<T extends ChartDataPoint>({
  yAxisKeys: keys,
  barNames = [],
  barColors = [],
  ...props
}: GroupedBarChartProps<T>) {
  const yAxisKeys = keys.map((key, index) => ({
    key,
    name: barNames[index] || String(key),
    color: barColors[index]
    // No stackId for grouped bars
  }));

  return <BarChart {...props} yAxisKeys={yAxisKeys} />;
}

// Horizontal bar chart
export function HorizontalBarChart<T extends ChartDataPoint>(props: Omit<BarChartProps<T>, 'layout'>) {
  return <BarChart {...props} layout="vertical" />;
}