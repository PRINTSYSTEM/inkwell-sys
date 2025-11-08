import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  SimpleLineChart,
  TimeSeriesLineChart,
  BarChart,
  SimpleBarChart,
  StackedBarChart,
  HorizontalBarChart,
  PieChart,
  DonutChart,
  SimplePieChart,
  AreaChart,
  SimpleAreaChart,
  StackedAreaChart,
  PercentageAreaChart
} from '@/components/charts';

// Mock data
const timeSeriesData = [
  { date: '2024-01', revenue: 45000, orders: 120, customers: 89 },
  { date: '2024-02', revenue: 52000, orders: 135, customers: 95 },
  { date: '2024-03', revenue: 48000, orders: 128, customers: 87 },
  { date: '2024-04', revenue: 61000, orders: 156, customers: 112 },
  { date: '2024-05', revenue: 58000, orders: 148, customers: 108 },
  { date: '2024-06', revenue: 67000, orders: 172, customers: 125 },
  { date: '2024-07', revenue: 73000, orders: 189, customers: 138 },
  { date: '2024-08', revenue: 69000, orders: 178, customers: 131 },
  { date: '2024-09', revenue: 76000, orders: 195, customers: 142 },
  { date: '2024-10', revenue: 82000, orders: 215, customers: 156 },
];

const departmentData = [
  { department: 'IT', employees: 45, budget: 850000 },
  { department: 'Marketing', employees: 28, budget: 420000 },
  { department: 'Sales', employees: 35, budget: 680000 },
  { department: 'HR', employees: 15, budget: 320000 },
  { department: 'Finance', employees: 18, budget: 450000 },
  { department: 'Operations', employees: 22, budget: 380000 },
];

const productCategoryData = [
  { category: 'Thiết kế in', sales: 145000, quantity: 89 },
  { category: 'In offset', sales: 230000, quantity: 156 },
  { category: 'In kỹ thuật số', sales: 189000, quantity: 234 },
  { category: 'Gia công sau in', sales: 98000, quantity: 67 },
  { category: 'Vật liệu', sales: 167000, quantity: 445 },
];

const quarterlyData = [
  { quarter: 'Q1', revenue: 145000, expenses: 89000, profit: 56000 },
  { quarter: 'Q2', revenue: 189000, expenses: 112000, profit: 77000 },
  { quarter: 'Q3', revenue: 234000, expenses: 145000, profit: 89000 },
  { quarter: 'Q4', revenue: 278000, expenses: 167000, profit: 111000 },
];

function LineChartExamples() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Simple Line Chart */}
      <SimpleLineChart
        title="Doanh thu theo tháng"
        description="Biểu đồ đường đơn giản hiển thị xu hướng doanh thu"
        data={timeSeriesData}
        xAxisKey="date"
        yAxisKey="revenue"
        valueType="currency"
        lineName="Doanh thu"
        lineColor="#3b82f6"
        smooth
      />

      {/* Multi Line Chart */}
      <LineChart
        title="Tổng quan kinh doanh"
        description="So sánh nhiều chỉ số theo thời gian"
        data={timeSeriesData}
        xAxisKey="date"
        yAxisKeys={[
          { key: 'revenue', name: 'Doanh thu', color: '#3b82f6' },
          { key: 'orders', name: 'Đơn hàng', color: '#10b981' },
          { key: 'customers', name: 'Khách hàng', color: '#f59e0b' }
        ]}
        valueType="number"
        config={{ height: 350 }}
      />

      {/* Time Series Chart */}
      <TimeSeriesLineChart
        title="Khách hàng mới theo thời gian"
        description="Xu hướng tăng trưởng khách hàng"
        data={timeSeriesData}
        xAxisKey="date"
        yAxisKeys={[
          { key: 'customers', name: 'Khách hàng mới', color: '#8b5cf6', strokeWidth: 3 }
        ]}
        dateFormat="short"
        showDots={false}
        smooth
      />
    </div>
  );
}

function BarChartExamples() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Simple Bar Chart */}
      <SimpleBarChart
        title="Nhân viên theo phòng ban"
        description="Số lượng nhân viên trong mỗi phòng ban"
        data={departmentData}
        xAxisKey="department"
        yAxisKey="employees"
        barName="Số nhân viên"
        barColor="#3b82f6"
        valueType="number"
      />

      {/* Stacked Bar Chart */}
      <StackedBarChart
        title="Doanh thu và Chi phí theo quý"
        description="So sánh doanh thu và chi phí từng quý"
        data={quarterlyData}
        xAxisKey="quarter"
        yAxisKeys={['revenue', 'expenses']}
        barNames={['Doanh thu', 'Chi phí']}
        barColors={['#10b981', '#ef4444']}
        valueType="currency"
      />

      {/* Horizontal Bar Chart */}
      <HorizontalBarChart
        title="Ngân sách phòng ban"
        description="Phân bổ ngân sách cho các phòng ban"
        data={departmentData}
        xAxisKey="department"
        yAxisKeys={[
          { key: 'budget', name: 'Ngân sách', color: '#f59e0b' }
        ]}
        valueType="currency"
        config={{ height: 300 }}
      />

      {/* Grouped Bar Chart */}
      <BarChart
        title="So sánh doanh số và số lượng"
        description="Doanh số và số lượng bán theo danh mục"
        data={productCategoryData}
        xAxisKey="category"
        yAxisKeys={[
          { key: 'sales', name: 'Doanh số', color: '#3b82f6' },
          { key: 'quantity', name: 'Số lượng', color: '#10b981' }
        ]}
        valueType="number"
        config={{ height: 350 }}
      />
    </div>
  );
}

function PieChartExamples() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Simple Pie Chart */}
      <SimplePieChart
        title="Doanh số theo danh mục"
        description="Phân bố doanh số theo từng danh mục sản phẩm"
        data={productCategoryData}
        groupBy="category"
        sumBy="sales"
        valueType="currency"
        showPercentage
        config={{ height: 350 }}
      />

      {/* Donut Chart */}
      <DonutChart
        title="Ngân sách phòng ban"
        description="Phân bố ngân sách theo phòng ban"
        data={departmentData}
        nameKey="department"
        valueKey="budget"
        valueType="currency"
        innerRadius={60}
        showLabels={false}
        config={{ height: 350, showLegend: true }}
      />

      {/* Pie Chart with Custom Colors */}
      <PieChart
        title="Số lượng nhân viên"
        description="Phân bố nhân viên theo các phòng ban"
        data={departmentData}
        nameKey="department"
        valueKey="employees"
        colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']}
        showPercentage
        maxItems={6}
        config={{ height: 350 }}
      />
    </div>
  );
}

function AreaChartExamples() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Simple Area Chart */}
      <SimpleAreaChart
        title="Lợi nhuận theo quý"
        description="Xu hướng tăng trưởng lợi nhuận"
        data={quarterlyData}
        xAxisKey="quarter"
        yAxisKey="profit"
        areaName="Lợi nhuận"
        areaColor="#10b981"
        valueType="currency"
        fillOpacity={0.3}
      />

      {/* Stacked Area Chart */}
      <StackedAreaChart
        title="Cơ cấu doanh thu"
        description="Phân tích cơ cấu doanh thu và chi phí theo thời gian"
        data={quarterlyData}
        xAxisKey="quarter"
        yAxisKeys={['revenue', 'expenses']}
        areaNames={['Doanh thu', 'Chi phí']}
        areaColors={['#3b82f6', '#ef4444']}
        valueType="currency"
        config={{ height: 350 }}
      />

      {/* Percentage Area Chart */}
      <PercentageAreaChart
        title="Tỷ lệ doanh thu/chi phí"
        description="Phân tích tỷ lệ phần trăm doanh thu và chi phí"
        data={quarterlyData}
        xAxisKey="quarter"
        yAxisKeys={['revenue', 'expenses']}
        areaNames={['Doanh thu', 'Chi phí']}
        areaColors={['#10b981', '#ef4444']}
        config={{ height: 350 }}
      />

      {/* Multi Area Chart */}
      <AreaChart
        title="Xu hướng tổng quan"
        description="Biểu đồ vùng đa chỉ số"
        data={timeSeriesData}
        xAxisKey="date"
        yAxisKeys={[
          { key: 'revenue', name: 'Doanh thu', color: '#3b82f6', fillOpacity: 0.4 },
          { key: 'orders', name: 'Đơn hàng', color: '#10b981', fillOpacity: 0.4 },
        ]}
        valueType="number"
        config={{ height: 350 }}
      />
    </div>
  );
}

export function ChartsExample() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Chart Components Examples</h1>
          <p className="text-gray-600">
            Demonstration của các chart components tái sử dụng với Recharts và TypeScript
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          Làm mới biểu đồ
        </Button>
      </div>

      <Tabs defaultValue="line" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="line">Line Charts</TabsTrigger>
          <TabsTrigger value="bar">Bar Charts</TabsTrigger>
          <TabsTrigger value="pie">Pie Charts</TabsTrigger>
          <TabsTrigger value="area">Area Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="line" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Line Chart Components</CardTitle>
              <CardDescription>
                Biểu đồ đường với nhiều biến thể: simple, multi-line, time series
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChartExamples key={`line-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bar Chart Components</CardTitle>
              <CardDescription>
                Biểu đồ cột với các kiểu: simple, stacked, grouped, horizontal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartExamples key={`bar-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pie" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pie Chart Components</CardTitle>
              <CardDescription>
                Biểu đồ tròn với các biến thể: pie, donut, với tùy chỉnh màu sắc
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartExamples key={`pie-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="area" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Area Chart Components</CardTitle>
              <CardDescription>
                Biểu đồ vùng với các kiểu: simple, stacked, percentage, gradient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChartExamples key={`area-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tính năng Chart Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">TypeScript Support</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Generic types cho data</li>
                <li>• Type-safe props</li>
                <li>• Intellisense support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Customization</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Custom colors</li>
                <li>• Flexible formatters</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Processing</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Auto aggregation</li>
                <li>• Sorting & limiting</li>
                <li>• Percentage calculation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">User Experience</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Loading states</li>
                <li>• Error handling</li>
                <li>• Smooth animations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}