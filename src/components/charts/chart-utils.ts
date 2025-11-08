// Base chart data structure
export interface ChartDataPoint {
  [key: string]: string | number | Date | null | undefined;
}

// Common chart configuration
export interface ChartConfig {
  colors?: string[];
  responsive?: boolean;
  animation?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// Default chart configuration
export const defaultChartConfig: Required<ChartConfig> = {
  colors: [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#6b7280', // gray-500
  ],
  responsive: true,
  animation: true,
  showGrid: true,
  showTooltip: true,
  showLegend: true,
  height: 400,
  margin: {
    top: 20,
    right: 30,
    bottom: 20,
    left: 20,
  },
};

// Utility functions for chart data processing
export const chartUtils = {
  // Format numbers for display
  formatValue: (value: number, type: 'number' | 'currency' | 'percentage' = 'number'): string => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', { 
          style: 'currency', 
          currency: 'VND' 
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('vi-VN').format(value);
    }
  },

  // Format dates
  formatDate: (date: Date | string, format: 'short' | 'medium' | 'long' = 'short'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'long':
        return d.toLocaleDateString('vi-VN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'medium':
        return d.toLocaleDateString('vi-VN', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return d.toLocaleDateString('vi-VN', { 
          month: 'short', 
          day: 'numeric' 
        });
    }
  },

  // Generate color palette
  generateColors: (count: number): string[] => {
    const baseColors = defaultChartConfig.colors;
    const colors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  },

  // Calculate percentage from total
  calculatePercentage: (value: number, total: number): number => {
    return total === 0 ? 0 : (value / total) * 100;
  },

  // Aggregate data by key
  aggregateData: function<T extends ChartDataPoint>(
    data: T[],
    groupByKey: keyof T,
    sumKey: keyof T
  ): Array<{ name: string; value: number }> {
    const groups = data.reduce((acc, item) => {
      const group = String(item[groupByKey] || 'Unknown');
      const value = Number(item[sumKey]) || 0;
      
      if (!acc[group]) {
        acc[group] = 0;
      }
      acc[group] += value;
      
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  },

  // Sort data by value
  sortData: function<T extends { value: number }>(
    data: T[],
    order: 'asc' | 'desc' = 'desc'
  ): T[] {
    return [...data].sort((a, b) => {
      return order === 'desc' ? b.value - a.value : a.value - b.value;
    });
  },

  // Limit data points for better visualization
  limitData: function<T extends Record<string, unknown>>(
    data: T[], 
    limit: number, 
    otherLabel = 'Khác'
  ): T[] {
    if (data.length <= limit) return data;
    
    const limited = data.slice(0, limit - 1);
    const others = data.slice(limit - 1);
    
    // Sum up the "others" if they have a value property
    if (others.length > 0 && 'value' in others[0] && typeof others[0].value === 'number') {
      const othersSum = others.reduce((sum, item) => {
        const itemValue = 'value' in item && typeof item.value === 'number' ? item.value : 0;
        return sum + itemValue;
      }, 0);
      
      const otherItem = {
        ...others[0],
        name: otherLabel,
        value: othersSum
      } as T;
      
      limited.push(otherItem);
    }
    
    return limited;
  }
};