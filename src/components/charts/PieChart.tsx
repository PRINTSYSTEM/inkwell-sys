import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, CustomTooltip, CustomLegend, type ChartContainerProps } from './ChartBase';
import { chartUtils, defaultChartConfig, type ChartConfig, type ChartDataPoint } from './chart-utils';

export interface PieChartProps<T extends ChartDataPoint> extends Omit<ChartContainerProps, 'children'> {
  data: T[];
  nameKey: keyof T;
  valueKey: keyof T;
  config?: Partial<ChartConfig>;
  valueType?: 'number' | 'currency' | 'percentage';
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  labelFormatter?: (entry: T) => string;
  showPercentage?: boolean;
  minAngle?: number;
  maxItems?: number;
}

export function PieChart<T extends ChartDataPoint>({
  data,
  nameKey,
  valueKey,
  config = {},
  valueType = 'number',
  colors,
  innerRadius = 0,
  outerRadius = 100,
  showLabels = true,
  labelFormatter,
  showPercentage = true,
  minAngle = 6,
  maxItems,
  ...containerProps
}: PieChartProps<T>) {
  const chartConfig = { ...defaultChartConfig, ...config };

  // Process data
  const processedData = React.useMemo(() => {
    let result = data.map(item => ({
      ...item,
      name: String(item[nameKey]),
      value: Number(item[valueKey]) || 0
    }));

    // Sort by value (descending)
    result = chartUtils.sortData(result, 'desc');

    // Limit items if specified
    if (maxItems && maxItems > 0) {
      result = chartUtils.limitData(result, maxItems);
    }

    return result;
  }, [data, nameKey, valueKey, maxItems]);

  // Generate colors
  const chartColors = colors || chartUtils.generateColors(processedData.length);

  // Calculate total for percentage
  const total = React.useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.value, 0);
  }, [processedData]);

  // Format tooltip values
  const formatTooltipValue = (value: number, name: string) => {
    const formatted = chartUtils.formatValue(value, valueType);
    if (showPercentage) {
      const percentage = chartUtils.calculatePercentage(value, total);
      return `${formatted} (${percentage.toFixed(1)}%)`;
    }
    return formatted;
  };

  // Custom label renderer
  const renderCustomLabel = (entry: { name: string; value: number }) => {
    if (!showLabels) return '';

    if (labelFormatter) {
      // Find original entry for custom formatter
      const originalEntry = processedData.find(item => 
        String(item[nameKey]) === entry.name && Number(item[valueKey]) === entry.value
      );
      if (originalEntry) {
        return labelFormatter(originalEntry);
      }
    }

    const percentage = chartUtils.calculatePercentage(entry.value, total);
    
    if (showPercentage) {
      return `${percentage.toFixed(1)}%`;
    }
    
    return entry.name;
  };

  const isEmpty = !processedData || processedData.length === 0;

  return (
    <ChartContainer 
      {...containerProps}
      empty={isEmpty}
    >
      <ResponsiveContainer 
        width="100%" 
        height={chartConfig.height}
      >
        <RechartsPieChart margin={chartConfig.margin}>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            minAngle={minAngle}
            animationDuration={chartConfig.animation ? 1000 : 0}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]} 
              />
            ))}
          </Pie>

          {chartConfig.showTooltip && (
            <Tooltip
              content={
                <CustomTooltip
                  valueType={valueType}
                  valueFormatter={formatTooltipValue}
                />
              }
            />
          )}

          {chartConfig.showLegend && (
            <Legend
              content={<CustomLegend />}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Donut chart (pie chart with inner radius)
export interface DonutChartProps<T extends ChartDataPoint> extends Omit<PieChartProps<T>, 'innerRadius'> {
  innerRadius?: number;
}

export function DonutChart<T extends ChartDataPoint>({
  innerRadius = 60,
  ...props
}: DonutChartProps<T>) {
  return <PieChart {...props} innerRadius={innerRadius} />;
}

// Semi-circle chart
export interface SemiCircleChartProps<T extends ChartDataPoint> extends PieChartProps<T> {
  startAngle?: number;
  endAngle?: number;
}

export function SemiCircleChart<T extends ChartDataPoint>({
  startAngle = 180,
  endAngle = 0,
  ...props
}: SemiCircleChartProps<T>) {
  return (
    <ChartContainer {...props}>
      <ResponsiveContainer width="100%" height={props.config?.height || defaultChartConfig.height}>
        <RechartsPieChart margin={props.config?.margin || defaultChartConfig.margin}>
          <Pie
            data={props.data}
            cx="50%"
            cy="50%"
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={props.innerRadius || 0}
            outerRadius={props.outerRadius || 100}
            fill="#8884d8"
            dataKey={props.valueKey as string}
            label={props.showLabels}
            minAngle={props.minAngle || 6}
            animationDuration={props.config?.animation ? 1000 : 0}
          >
            {props.data.map((entry, index) => {
              const colors = props.colors || chartUtils.generateColors(props.data.length);
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              );
            })}
          </Pie>

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
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Simple pie chart with automatic aggregation
export interface SimplePieChartProps<T extends ChartDataPoint> extends Omit<PieChartProps<T>, 'data' | 'nameKey' | 'valueKey'> {
  data: T[];
  groupBy: keyof T;
  sumBy: keyof T;
  topN?: number;
}

export function SimplePieChart<T extends ChartDataPoint>({
  data,
  groupBy,
  sumBy,
  topN,
  ...props
}: SimplePieChartProps<T>) {
  const aggregatedData = React.useMemo(() => {
    let result = chartUtils.aggregateData(data, groupBy, sumBy);
    
    // Sort and limit if needed
    result = chartUtils.sortData(result, 'desc');
    if (topN && topN > 0) {
      result = chartUtils.limitData(result, topN);
    }
    
    return result;
  }, [data, groupBy, sumBy, topN]);

  return (
    <PieChart<{ name: string; value: number }>
      {...props}
      data={aggregatedData}
      nameKey="name"
      valueKey="value"
    />
  );
}