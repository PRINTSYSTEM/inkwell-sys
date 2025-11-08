import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, CustomTooltip, CustomLegend, type ChartContainerProps } from './ChartBase';
import { chartUtils, defaultChartConfig, type ChartConfig, type ChartDataPoint } from './chart-utils';

export interface AreaChartProps<T extends ChartDataPoint> extends Omit<ChartContainerProps, 'children'> {
  data: T[];
  xAxisKey: keyof T;
  yAxisKeys: Array<{
    key: keyof T;
    name?: string;
    color?: string;
    fillOpacity?: number;
    strokeWidth?: number;
    stackId?: string;
  }>;
  config?: Partial<ChartConfig>;
  xAxisFormatter?: (value: unknown) => string;
  yAxisFormatter?: (value: number) => string;
  valueType?: 'number' | 'currency' | 'percentage';
  smooth?: boolean;
  connectNulls?: boolean;
}

export function AreaChart<T extends ChartDataPoint>({
  data,
  xAxisKey,
  yAxisKeys,
  config = {},
  xAxisFormatter,
  yAxisFormatter,
  valueType = 'number',
  smooth = true,
  connectNulls = false,
  ...containerProps
}: AreaChartProps<T>) {
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
        <RechartsAreaChart
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
            <Area
              key={String(yAxis.key)}
              type={smooth ? 'monotone' : 'linear'}
              dataKey={yAxis.key as string}
              name={yAxis.name || String(yAxis.key)}
              stackId={yAxis.stackId}
              stroke={yAxis.color || colors[index]}
              fill={yAxis.color || colors[index]}
              fillOpacity={yAxis.fillOpacity || 0.6}
              strokeWidth={yAxis.strokeWidth || 2}
              connectNulls={connectNulls}
              animationDuration={chartConfig.animation ? 1000 : 0}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Specialized area chart variants
export interface SimpleAreaChartProps<T extends ChartDataPoint> extends Omit<AreaChartProps<T>, 'yAxisKeys'> {
  yAxisKey: keyof T;
  areaColor?: string;
  areaName?: string;
  fillOpacity?: number;
}

export function SimpleAreaChart<T extends ChartDataPoint>({
  yAxisKey,
  areaColor,
  areaName,
  fillOpacity,
  ...props
}: SimpleAreaChartProps<T>) {
  const yAxisKeys = [{
    key: yAxisKey,
    name: areaName,
    color: areaColor,
    fillOpacity
  }];

  return <AreaChart {...props} yAxisKeys={yAxisKeys} />;
}

// Stacked area chart
export interface StackedAreaChartProps<T extends ChartDataPoint> extends Omit<AreaChartProps<T>, 'yAxisKeys'> {
  yAxisKeys: (keyof T)[];
  areaNames?: string[];
  areaColors?: string[];
  stackId?: string;
  fillOpacity?: number;
}

export function StackedAreaChart<T extends ChartDataPoint>({
  yAxisKeys: keys,
  areaNames = [],
  areaColors = [],
  stackId = 'default',
  fillOpacity = 0.6,
  ...props
}: StackedAreaChartProps<T>) {
  const yAxisKeys = keys.map((key, index) => ({
    key,
    name: areaNames[index] || String(key),
    color: areaColors[index],
    stackId,
    fillOpacity
  }));

  return <AreaChart {...props} yAxisKeys={yAxisKeys} />;
}

// Percentage area chart (100% stacked)
export function PercentageAreaChart<T extends ChartDataPoint>({
  data,
  yAxisKeys: keys,
  ...props
}: Omit<StackedAreaChartProps<T>, 'yAxisFormatter'>) {
  // Convert data to percentages
  const percentageData = React.useMemo(() => {
    return data.map(item => {
      const total = keys.reduce((sum, key) => {
        const value = Number(item[key]) || 0;
        return sum + value;
      }, 0);
      
      if (total === 0) return item;
      
      const percentageItem = { ...item } as T;
      keys.forEach(key => {
        const value = Number(item[key]) || 0;
        (percentageItem as Record<string, unknown>)[key as string] = (value / total) * 100;
      });
      
      return percentageItem;
    });
  }, [data, keys]);

  const yAxisFormatter = (value: number) => `${value.toFixed(1)}%`;

  return (
    <StackedAreaChart
      {...props}
      data={percentageData}
      yAxisKeys={keys}
      yAxisFormatter={yAxisFormatter}
      valueType="percentage"
    />
  );
}

// Time series area chart with date formatting
export interface TimeSeriesAreaChartProps<T extends ChartDataPoint> extends Omit<AreaChartProps<T>, 'xAxisFormatter'> {
  dateFormat?: 'short' | 'medium' | 'long';
}

export function TimeSeriesAreaChart<T extends ChartDataPoint>({
  dateFormat = 'short',
  ...props
}: TimeSeriesAreaChartProps<T>) {
  const xAxisFormatter = (value: unknown) => {
    if (value instanceof Date || typeof value === 'string') {
      return chartUtils.formatDate(value, dateFormat);
    }
    return String(value);
  };

  return <AreaChart {...props} xAxisFormatter={xAxisFormatter} />;
}

// Gradient area chart with custom gradients
export interface GradientAreaChartProps<T extends ChartDataPoint> extends AreaChartProps<T> {
  gradients?: Array<{
    id: string;
    colors: Array<{ offset: string; color: string; opacity?: number }>;
  }>;
}

export function GradientAreaChart<T extends ChartDataPoint>({
  gradients = [],
  yAxisKeys,
  ...props
}: GradientAreaChartProps<T>) {
  return (
    <ChartContainer {...props}>
      <ResponsiveContainer width="100%" height={props.config?.height || defaultChartConfig.height}>
        <RechartsAreaChart
          data={props.data}
          margin={props.config?.margin || defaultChartConfig.margin}
        >
          <defs>
            {gradients.map(gradient => (
              <linearGradient key={gradient.id} id={gradient.id} x1="0" y1="0" x2="0" y2="1">
                {gradient.colors.map((color, index) => (
                  <stop
                    key={index}
                    offset={color.offset}
                    stopColor={color.color}
                    stopOpacity={color.opacity || 1}
                  />
                ))}
              </linearGradient>
            ))}
          </defs>

          {(props.config?.showGrid ?? defaultChartConfig.showGrid) && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          )}
          
          <XAxis
            dataKey={props.xAxisKey as string}
            tickFormatter={props.xAxisFormatter}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            tickFormatter={props.yAxisFormatter}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          {(props.config?.showTooltip ?? defaultChartConfig.showTooltip) && (
            <Tooltip
              content={
                <CustomTooltip
                  valueType={props.valueType || 'number'}
                  valueFormatter={(value: number, name: string) => {
                    return chartUtils.formatValue(value, props.valueType || 'number');
                  }}
                />
              }
            />
          )}

          {(props.config?.showLegend ?? defaultChartConfig.showLegend) && (
            <Legend content={<CustomLegend />} />
          )}

          {yAxisKeys.map((yAxis, index) => {
            const gradient = gradients.find(g => g.id === `gradient-${index}`);
            const fill = gradient ? `url(#${gradient.id})` : yAxis.color;
            
            return (
              <Area
                key={String(yAxis.key)}
                type={props.smooth ? 'monotone' : 'linear'}
                dataKey={yAxis.key as string}
                name={yAxis.name || String(yAxis.key)}
                stackId={yAxis.stackId}
                stroke={yAxis.color}
                fill={fill}
                fillOpacity={yAxis.fillOpacity || 0.6}
                strokeWidth={yAxis.strokeWidth || 2}
                connectNulls={props.connectNulls}
                animationDuration={props.config?.animation ? 1000 : 0}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}