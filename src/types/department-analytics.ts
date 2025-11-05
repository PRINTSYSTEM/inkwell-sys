export interface DepartmentKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  period: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  activeEmployees: number;
  productivity: number;
  efficiency: number;
  qualityScore: number;
  completionRate: number;
  avgTaskTime: number;
  workload: number;
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
  period: string;
  lastUpdated: string;
}

export interface PerformanceTrend {
  date: string;
  productivity: number;
  efficiency: number;
  quality: number;
  revenue: number;
  departmentId: string;
}

export interface DepartmentComparison {
  departmentId: string;
  departmentName: string;
  metrics: {
    productivity: number;
    efficiency: number;
    quality: number;
    revenue: number;
    employeeCount: number;
    workload: number;
  };
  ranking: number;
  score: number;
}

export interface ProjectStats {
  departmentId: string;
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  overdueProjects: number;
  avgCompletionTime: number;
  onTimeDelivery: number;
  budgetUtilization: number;
  clientSatisfaction: number;
}

export interface ResourceUtilization {
  departmentId: string;
  humanResources: {
    totalCapacity: number;
    utilizedCapacity: number;
    utilizationRate: number;
    overtime: number;
    idle: number;
  };
  equipment: {
    totalEquipment: number;
    activeEquipment: number;
    utilizationRate: number;
    maintenance: number;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    utilizationRate: number;
  };
}

export interface DepartmentAlert {
  id: string;
  departmentId: string;
  type: 'performance' | 'budget' | 'deadline' | 'quality' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  recommendedAction: string;
  createdAt: string;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface DepartmentGoal {
  id: string;
  departmentId: string;
  title: string;
  description: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsTimeframe {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  label: string;
}

export interface DepartmentAnalytics {
  departmentId: string;
  timeframe: AnalyticsTimeframe;
  kpis: DepartmentKPI[];
  metrics: DepartmentMetrics;
  trends: PerformanceTrend[];
  comparison: DepartmentComparison;
  projectStats: ProjectStats;
  resourceUtilization: ResourceUtilization;
  alerts: DepartmentAlert[];
  goals: DepartmentGoal[];
  insights: AnalyticsInsight[];
}

export interface AnalyticsInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionRequired: boolean;
  suggestedActions: string[];
  relatedMetrics: string[];
  generatedAt: string;
}

export interface AnalyticsFilter {
  departments: string[];
  timeframe: AnalyticsTimeframe;
  metrics: string[];
  compareMode: boolean;
  showTrends: boolean;
  groupBy: 'department' | 'time' | 'metric';
}

export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'financial' | 'operational' | 'comparative';
  departments: string[];
  timeframe: AnalyticsTimeframe;
  metrics: string[];
  data: DepartmentAnalytics[];
  insights: AnalyticsInsight[];
  charts: ChartConfig[];
  createdBy: string;
  createdAt: string;
  format: 'pdf' | 'excel' | 'csv';
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  title: string;
  dataKey: string;
  xAxis: string;
  yAxis: string;
  series: string[];
  colors: string[];
  options: Record<string, string | number | boolean>;
}