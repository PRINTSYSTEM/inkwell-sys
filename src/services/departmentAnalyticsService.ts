import { 
  DepartmentAnalytics, 
  DepartmentKPI, 
  DepartmentMetrics, 
  PerformanceTrend, 
  DepartmentComparison,
  ProjectStats,
  ResourceUtilization,
  DepartmentAlert,
  DepartmentGoal,
  AnalyticsTimeframe,
  AnalyticsInsight,
  AnalyticsFilter,
  AnalyticsReport,
  ChartConfig
} from '@/types/department-analytics';

class DepartmentAnalyticsService {
  // Get comprehensive analytics for a department
  static async getDepartmentAnalytics(
    departmentId: string, 
    timeframe: AnalyticsTimeframe
  ): Promise<DepartmentAnalytics> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData: DepartmentAnalytics = {
      departmentId,
      timeframe,
      kpis: this.generateMockKPIs(departmentId),
      metrics: this.generateMockMetrics(departmentId),
      trends: this.generateMockTrends(departmentId, timeframe),
      comparison: this.generateMockComparison(departmentId),
      projectStats: this.generateMockProjectStats(departmentId),
      resourceUtilization: this.generateMockResourceUtilization(departmentId),
      alerts: this.generateMockAlerts(departmentId),
      goals: this.generateMockGoals(departmentId),
      insights: this.generateMockInsights(departmentId)
    };

    return mockData;
  }

  // Get KPIs for multiple departments for comparison
  static async getMultiDepartmentComparison(
    departmentIds: string[],
    timeframe: AnalyticsTimeframe
  ): Promise<DepartmentComparison[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return departmentIds.map((deptId, index) => ({
      departmentId: deptId,
      departmentName: this.getDepartmentName(deptId),
      metrics: {
        productivity: 75 + Math.random() * 25,
        efficiency: 70 + Math.random() * 30,
        quality: 80 + Math.random() * 20,
        revenue: 50000 + Math.random() * 100000,
        employeeCount: 8 + Math.floor(Math.random() * 15),
        workload: 60 + Math.random() * 40
      },
      ranking: index + 1,
      score: 75 + Math.random() * 25
    }));
  }

  // Get performance trends
  static async getPerformanceTrends(
    departmentId: string,
    timeframe: AnalyticsTimeframe
  ): Promise<PerformanceTrend[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.generateMockTrends(departmentId, timeframe);
  }

  // Get department alerts
  static async getDepartmentAlerts(
    departmentId?: string,
    severity?: string
  ): Promise<DepartmentAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const allAlerts = [
      ...this.generateMockAlerts('dept_design'),
      ...this.generateMockAlerts('dept_production'),
      ...this.generateMockAlerts('dept_marketing')
    ];

    let filteredAlerts = allAlerts;
    
    if (departmentId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.departmentId === departmentId);
    }
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    return filteredAlerts.filter(alert => alert.isActive);
  }

  // Create or update department goal
  static async saveDepartmentGoal(goal: Partial<DepartmentGoal>): Promise<DepartmentGoal> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedGoal: DepartmentGoal = {
      id: goal.id || `goal_${Date.now()}`,
      departmentId: goal.departmentId!,
      title: goal.title!,
      description: goal.description || '',
      metric: goal.metric!,
      targetValue: goal.targetValue!,
      currentValue: goal.currentValue || 0,
      progress: goal.currentValue ? (goal.currentValue / goal.targetValue!) * 100 : 0,
      deadline: goal.deadline!,
      priority: goal.priority || 'medium',
      status: goal.status || 'not-started',
      assignedTo: goal.assignedTo || [],
      createdBy: goal.createdBy || 'current_user',
      createdAt: goal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return savedGoal;
  }

  // Generate analytics report
  static async generateReport(
    departments: string[],
    timeframe: AnalyticsTimeframe,
    metrics: string[],
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<AnalyticsReport> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const reportData: AnalyticsReport = {
      id: `report_${Date.now()}`,
      title: `Báo cáo phân tích phòng ban - ${timeframe.label}`,
      description: `Báo cáo chi tiết về hiệu suất và phân tích của ${departments.length} phòng ban`,
      type: 'performance',
      departments,
      timeframe,
      metrics,
      data: await Promise.all(
        departments.map(deptId => this.getDepartmentAnalytics(deptId, timeframe))
      ),
      insights: this.generateReportInsights(departments),
      charts: this.generateReportCharts(metrics),
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      format
    };

    return reportData;
  }

  // Export report as blob for download
  static async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock file content based on format
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'pdf':
        content = 'Mock PDF content';
        mimeType = 'application/pdf';
        break;
      case 'excel':
        content = 'Mock Excel content';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        content = 'Department,Productivity,Efficiency,Quality\nDesign,85,78,92\nProduction,78,85,88';
        mimeType = 'text/csv';
        break;
      default:
        throw new Error('Unsupported format');
    }

    return new Blob([content], { type: mimeType });
  }

  // Acknowledge alert
  static async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    // Mock acknowledgment
  }

  // Get analytics insights
  static async getAnalyticsInsights(
    departmentId: string,
    timeframe: AnalyticsTimeframe
  ): Promise<AnalyticsInsight[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.generateMockInsights(departmentId);
  }

  // Private helper methods for mock data generation
  private static generateMockKPIs(departmentId: string): DepartmentKPI[] {
    const baseKPIs = [
      { name: 'Năng suất', unit: '%', target: 85 },
      { name: 'Hiệu quả', unit: '%', target: 80 },
      { name: 'Chất lượng', unit: '%', target: 90 },
      { name: 'Doanh thu', unit: 'VNĐ', target: 100000000 },
      { name: 'Chi phí', unit: 'VNĐ', target: 80000000 },
      { name: 'Lợi nhuận', unit: '%', target: 20 }
    ];

    return baseKPIs.map((kpi, index) => {
      const value = kpi.target * (0.7 + Math.random() * 0.4);
      const change = -10 + Math.random() * 20;
      
      return {
        id: `kpi_${departmentId}_${index}`,
        name: kpi.name,
        value,
        target: kpi.target,
        unit: kpi.unit,
        trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
        changePercent: change,
        period: 'Tháng này',
        status: value >= kpi.target * 0.9 ? 'excellent' :
               value >= kpi.target * 0.8 ? 'good' :
               value >= kpi.target * 0.6 ? 'warning' : 'critical'
      };
    });
  }

  private static generateMockMetrics(departmentId: string): DepartmentMetrics {
    return {
      departmentId,
      departmentName: this.getDepartmentName(departmentId),
      totalEmployees: 12 + Math.floor(Math.random() * 8),
      activeEmployees: 10 + Math.floor(Math.random() * 6),
      productivity: 75 + Math.random() * 25,
      efficiency: 70 + Math.random() * 30,
      qualityScore: 80 + Math.random() * 20,
      completionRate: 85 + Math.random() * 15,
      avgTaskTime: 3 + Math.random() * 4,
      workload: 60 + Math.random() * 40,
      revenue: 80000000 + Math.random() * 40000000,
      costs: 60000000 + Math.random() * 30000000,
      profit: 20000000 + Math.random() * 20000000,
      profitMargin: 15 + Math.random() * 10,
      period: 'Tháng 11/2025',
      lastUpdated: new Date().toISOString()
    };
  }

  private static generateMockTrends(
    departmentId: string, 
    timeframe: AnalyticsTimeframe
  ): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const days = this.getTimeframeDays(timeframe);
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      trends.push({
        date: date.toISOString().split('T')[0],
        productivity: 70 + Math.random() * 30 + Math.sin(i / 7) * 10,
        efficiency: 65 + Math.random() * 35 + Math.sin(i / 5) * 8,
        quality: 75 + Math.random() * 25 + Math.sin(i / 10) * 5,
        revenue: 2000000 + Math.random() * 3000000,
        departmentId
      });
    }
    
    return trends;
  }

  private static generateMockComparison(departmentId: string): DepartmentComparison {
    return {
      departmentId,
      departmentName: this.getDepartmentName(departmentId),
      metrics: {
        productivity: 75 + Math.random() * 25,
        efficiency: 70 + Math.random() * 30,
        quality: 80 + Math.random() * 20,
        revenue: 50000000 + Math.random() * 50000000,
        employeeCount: 8 + Math.floor(Math.random() * 12),
        workload: 60 + Math.random() * 40
      },
      ranking: 1 + Math.floor(Math.random() * 5),
      score: 75 + Math.random() * 25
    };
  }

  private static generateMockProjectStats(departmentId: string): ProjectStats {
    const total = 20 + Math.floor(Math.random() * 30);
    const completed = Math.floor(total * (0.6 + Math.random() * 0.3));
    const inProgress = Math.floor((total - completed) * 0.7);
    const overdue = total - completed - inProgress;

    return {
      departmentId,
      totalProjects: total,
      completedProjects: completed,
      inProgressProjects: inProgress,
      overdueProjects: Math.max(0, overdue),
      avgCompletionTime: 5 + Math.random() * 10,
      onTimeDelivery: 80 + Math.random() * 20,
      budgetUtilization: 70 + Math.random() * 30,
      clientSatisfaction: 4 + Math.random()
    };
  }

  private static generateMockResourceUtilization(departmentId: string): ResourceUtilization {
    return {
      departmentId,
      humanResources: {
        totalCapacity: 160,
        utilizedCapacity: 120 + Math.random() * 30,
        utilizationRate: 75 + Math.random() * 25,
        overtime: 10 + Math.random() * 20,
        idle: 5 + Math.random() * 15
      },
      equipment: {
        totalEquipment: 20 + Math.floor(Math.random() * 10),
        activeEquipment: 15 + Math.floor(Math.random() * 8),
        utilizationRate: 70 + Math.random() * 30,
        maintenance: 2 + Math.floor(Math.random() * 3)
      },
      budget: {
        allocated: 100000000,
        spent: 60000000 + Math.random() * 30000000,
        remaining: 30000000 + Math.random() * 20000000,
        utilizationRate: 60 + Math.random() * 30
      }
    };
  }

  private static generateMockAlerts(departmentId: string): DepartmentAlert[] {
    const alertTypes = [
      {
        type: 'performance' as const,
        title: 'Năng suất giảm',
        description: 'Năng suất phòng ban giảm 15% so với tháng trước',
        metric: 'productivity',
        severity: 'medium' as const
      },
      {
        type: 'budget' as const,
        title: 'Vượt ngân sách',
        description: 'Chi phí tháng này vượt 10% so với kế hoạch',
        metric: 'budget',
        severity: 'high' as const
      },
      {
        type: 'deadline' as const,
        title: 'Dự án trễ hạn',
        description: '3 dự án có nguy cơ trễ deadline',
        metric: 'deadline',
        severity: 'high' as const
      }
    ];

    return alertTypes.slice(0, 1 + Math.floor(Math.random() * 2)).map((alert, index) => ({
      id: `alert_${departmentId}_${index}`,
      departmentId,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      metric: alert.metric,
      currentValue: 70 + Math.random() * 20,
      threshold: 80,
      recommendedAction: 'Cần điều chỉnh kế hoạch và tăng cường giám sát',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: Math.random() > 0.2
    }));
  }

  private static generateMockGoals(departmentId: string): DepartmentGoal[] {
    const goals = [
      {
        title: 'Tăng năng suất 20%',
        description: 'Cải thiện quy trình làm việc để tăng năng suất',
        metric: 'productivity',
        targetValue: 90
      },
      {
        title: 'Giảm chi phí 10%',
        description: 'Tối ưu hóa chi phí vận hành',
        metric: 'cost',
        targetValue: 50000000
      }
    ];

    return goals.map((goal, index) => ({
      id: `goal_${departmentId}_${index}`,
      departmentId,
      title: goal.title,
      description: goal.description,
      metric: goal.metric,
      targetValue: goal.targetValue,
      currentValue: goal.targetValue * (0.3 + Math.random() * 0.5),
      progress: 30 + Math.random() * 50,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      status: (['not-started', 'in-progress', 'completed'] as const)[Math.floor(Math.random() * 3)],
      assignedTo: ['user1', 'user2'],
      createdBy: 'manager',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  private static generateMockInsights(departmentId: string): AnalyticsInsight[] {
    const insights = [
      {
        type: 'opportunity' as const,
        title: 'Cơ hội tăng doanh thu',
        description: 'Có thể tăng 15% doanh thu bằng cách tối ưu hóa quy trình',
        impact: 'high' as const,
        actionRequired: true,
        suggestedActions: ['Đào tạo nhân viên', 'Cải thiện quy trình'],
        relatedMetrics: ['revenue', 'productivity']
      },
      {
        type: 'risk' as const,
        title: 'Nguy cơ quá tải',
        description: 'Workload hiện tại cao, có nguy cơ ảnh hưởng chất lượng',
        impact: 'medium' as const,
        actionRequired: true,
        suggestedActions: ['Tăng nhân sự', 'Phân phối lại công việc'],
        relatedMetrics: ['workload', 'quality']
      }
    ];

    return insights.map((insight, index) => ({
      id: `insight_${departmentId}_${index}`,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      confidence: 0.7 + Math.random() * 0.3,
      actionRequired: insight.actionRequired,
      suggestedActions: insight.suggestedActions,
      relatedMetrics: insight.relatedMetrics,
      generatedAt: new Date().toISOString()
    }));
  }

  private static getDepartmentName(departmentId: string): string {
    const names: Record<string, string> = {
      'dept_design': 'Phòng Thiết kế',
      'dept_production': 'Phòng Sản xuất',
      'dept_marketing': 'Phòng Marketing',
      'dept_sales': 'Phòng Kinh doanh',
      'dept_hr': 'Phòng Nhân sự'
    };
    return names[departmentId] || 'Phòng ban';
  }

  private static getTimeframeDays(timeframe: AnalyticsTimeframe): number {
    switch (timeframe.period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  private static generateReportInsights(departments: string[]): AnalyticsInsight[] {
    return [
      {
        id: 'insight_report_1',
        type: 'achievement',
        title: 'Hiệu suất tổng thể tốt',
        description: `${departments.length} phòng ban đều đạt target về năng suất`,
        impact: 'high',
        confidence: 0.85,
        actionRequired: false,
        suggestedActions: ['Duy trì momentum hiện tại'],
        relatedMetrics: ['productivity', 'efficiency'],
        generatedAt: new Date().toISOString()
      }
    ];
  }

  private static generateReportCharts(metrics: string[]): ChartConfig[] {
    return [
      {
        id: 'chart_productivity_trend',
        type: 'line',
        title: 'Xu hướng năng suất',
        dataKey: 'productivity',
        xAxis: 'date',
        yAxis: 'productivity',
        series: ['productivity'],
        colors: ['#3b82f6'],
        options: { smooth: true, strokeWidth: 2 }
      },
      {
        id: 'chart_department_comparison',
        type: 'bar',
        title: 'So sánh phòng ban',
        dataKey: 'department',
        xAxis: 'department',
        yAxis: 'score',
        series: ['productivity', 'efficiency', 'quality'],
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
        options: { stacked: false }
      }
    ];
  }
}

export { DepartmentAnalyticsService };