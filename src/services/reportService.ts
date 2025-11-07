import {
  Report,
  ReportType,
  ReportCategory,
  ReportTemplate,
  ReportGeneration,
  ReportData,
  ExportFormat,
  ExportOptions,
  ReportSchedule,
  ReportAnalytics,
  BulkReportOperation,
  DashboardReport,
  ExportJob
} from '@/types/report';

class ReportService {
  private reports: Report[] = [];
  private templates: ReportTemplate[] = [];
  private generations: ReportGeneration[] = [];
  private analytics: Record<string, ReportAnalytics> = {};
  private dashboards: DashboardReport[] = [];

  constructor() {
    this.initializeMockData();
  }

  // CRUD Operations for Reports
  async getReports(filter?: {
    type?: ReportType[];
    category?: ReportCategory[];
    createdBy?: string;
    search?: string;
  }): Promise<Report[]> {
    let filteredReports = [...this.reports];

    if (filter) {
      if (filter.type?.length) {
        filteredReports = filteredReports.filter(r => filter.type!.includes(r.type));
      }
      if (filter.category?.length) {
        filteredReports = filteredReports.filter(r => filter.category!.includes(r.category));
      }
      if (filter.createdBy) {
        filteredReports = filteredReports.filter(r => r.createdBy === filter.createdBy);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredReports = filteredReports.filter(r => 
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          r.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    return filteredReports.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getReportById(id: string): Promise<Report | null> {
    return this.reports.find(r => r.id === id) || null;
  }

  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report> {
    const newReport: Report = {
      ...reportData,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };

    this.reports.push(newReport);
    return newReport;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | null> {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      Object.assign(report, updates, { updatedAt: new Date() });
      return report;
    }
    return null;
  }

  async deleteReport(id: string): Promise<boolean> {
    const index = this.reports.findIndex(r => r.id === id);
    if (index > -1) {
      this.reports.splice(index, 1);
      return true;
    }
    return false;
  }

  // Report Templates
  async getTemplates(type?: ReportType): Promise<ReportTemplate[]> {
    if (type) {
      return this.templates.filter(t => t.type === type);
    }
    return this.templates;
  }

  async getTemplateById(id: string): Promise<ReportTemplate | null> {
    return this.templates.find(t => t.id === id) || null;
  }

  // Report Generation
  async generateReport(
    reportId: string, 
    parameters: Record<string, unknown>, 
    format: ExportFormat = 'pdf'
  ): Promise<ReportGeneration> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const generation: ReportGeneration = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      parameters,
      format,
      status: 'pending',
      startedAt: new Date(),
      generatedBy: 'current_user'
    };

    this.generations.push(generation);

    // Simulate generation process
    setTimeout(async () => {
      try {
        generation.status = 'generating';
        
        // Simulate data collection and processing
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        const reportData = await this.collectReportData(report, parameters);
        const fileUrl = await this.exportReportData(reportData, format);
        
        generation.status = 'completed';
        generation.completedAt = new Date();
        generation.fileUrl = fileUrl;
        generation.fileName = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
        generation.fileSize = Math.floor(Math.random() * 5000000) + 100000; // Random size

        // Update analytics
        this.updateReportAnalytics(reportId, 'download', format);
      } catch (error) {
        generation.status = 'failed';
        generation.error = error instanceof Error ? error.message : 'Generation failed';
      }
    }, 100);

    return generation;
  }

  async getGenerationStatus(generationId: string): Promise<ReportGeneration | null> {
    return this.generations.find(g => g.id === generationId) || null;
  }

  async getReportGenerations(reportId: string): Promise<ReportGeneration[]> {
    return this.generations
      .filter(g => g.reportId === reportId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  // Data Export
  async exportReport(
    reportId: string,
    parameters: Record<string, unknown>,
    options: ExportOptions
  ): Promise<{ fileUrl: string; fileName: string }> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const reportData = await this.collectReportData(report, parameters);
    const fileUrl = await this.exportReportData(reportData, options.format, options);
    
    const fileName = options.filename || 
      `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${options.format}`;

    this.updateReportAnalytics(reportId, 'download', options.format);

    return { fileUrl, fileName };
  }

  // Bulk Operations
  async bulkExport(
    reportIds: string[],
    parameters: Record<string, unknown>,
    format: ExportFormat
  ): Promise<BulkReportOperation> {
    const operation: BulkReportOperation = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'export',
      reportIds,
      parameters,
      format,
      status: 'pending',
      createdBy: 'current_user',
      createdAt: new Date(),
      results: []
    };

    // Process bulk operation asynchronously
    setTimeout(async () => {
      operation.status = 'processing';
      
      for (const reportId of reportIds) {
        try {
          const { fileUrl } = await this.exportReport(reportId, parameters, { 
            format, 
            includeCharts: true, 
            includeRawData: false 
          });
          
          operation.results.push({
            reportId,
            status: 'success',
            fileUrl
          });
        } catch (error) {
          operation.results.push({
            reportId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Export failed'
          });
        }
      }
      
      operation.status = 'completed';
      operation.completedAt = new Date();
    }, 1000);

    return operation;
  }

  // Report Analytics
  async getReportAnalytics(reportId: string): Promise<ReportAnalytics> {
    if (!this.analytics[reportId]) {
      this.analytics[reportId] = {
        reportId,
        views: 0,
        downloads: 0,
        shares: 0,
        avgGenerationTime: 0,
        lastAccessedAt: new Date(),
        popularFormats: {
          pdf: 0,
          excel: 0,
          csv: 0,
          json: 0,
          png: 0,
          jpg: 0
        },
        userActivity: []
      };
    }
    return this.analytics[reportId];
  }

  // Scheduling
  async scheduleReport(reportId: string, schedule: Omit<ReportSchedule, 'id'>): Promise<ReportSchedule> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nextRunAt: this.calculateNextRun(schedule)
    };

    report.schedule = newSchedule;
    await this.updateReport(reportId, { schedule: newSchedule });

    return newSchedule;
  }

  // Dashboard Reports
  async getDashboards(): Promise<DashboardReport[]> {
    return this.dashboards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createDashboard(dashboardData: Omit<DashboardReport, 'id' | 'createdAt'>): Promise<DashboardReport> {
    const newDashboard: DashboardReport = {
      ...dashboardData,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.dashboards.push(newDashboard);
    return newDashboard;
  }

  // Predefined Reports
  async getPerformanceReport(
    employeeIds?: string[],
    dateRange?: { start: Date; end: Date }
  ): Promise<ReportData> {
    // Mock performance data
    return {
      sections: [
        {
          sectionId: 'performance_summary',
          title: 'Tổng quan hiệu suất',
          type: 'summary',
          data: {
            totalEmployees: employeeIds?.length || 50,
            avgPerformanceScore: 4.2,
            topPerformers: 8,
            needsImprovement: 5
          }
        },
        {
          sectionId: 'performance_chart',
          title: 'Biểu đồ hiệu suất theo thời gian',
          type: 'chart',
          data: this.generateMockChartData('performance'),
          chartConfig: {
            type: 'line',
            xAxis: 'date',
            yAxis: ['score'],
            colors: ['#3b82f6'],
            title: 'Điểm hiệu suất trung bình'
          }
        }
      ],
      metadata: {
        reportName: 'Báo cáo hiệu suất nhân viên',
        generatedBy: 'current_user',
        generatedAt: new Date(),
        totalRecords: employeeIds?.length || 50,
        dateRange,
        filters: [],
        version: '1.0'
      },
      parameters: { employeeIds, dateRange },
      generatedAt: new Date()
    };
  }

  async getAttendanceReport(
    employeeIds?: string[],
    dateRange?: { start: Date; end: Date }
  ): Promise<ReportData> {
    return {
      sections: [
        {
          sectionId: 'attendance_summary',
          title: 'Tổng quan chấm công',
          type: 'summary',
          data: {
            totalDays: 30,
            avgAttendance: 95.5,
            lateArrivals: 12,
            earlyDepartures: 8
          }
        },
        {
          sectionId: 'attendance_table',
          title: 'Chi tiết chấm công',
          type: 'table',
          data: this.generateMockTableData('attendance'),
          tableConfig: {
            columns: [
              { key: 'employee', title: 'Nhân viên', dataType: 'string' },
              { key: 'present', title: 'Có mặt', dataType: 'number' },
              { key: 'absent', title: 'Vắng mặt', dataType: 'number' },
              { key: 'late', title: 'Đi trễ', dataType: 'number' },
              { key: 'overtime', title: 'Làm thêm', dataType: 'number' }
            ],
            pagination: true,
            sorting: true,
            filtering: true
          }
        }
      ],
      metadata: {
        reportName: 'Báo cáo chấm công',
        generatedBy: 'current_user',
        generatedAt: new Date(),
        totalRecords: employeeIds?.length || 50,
        dateRange,
        filters: [],
        version: '1.0'
      },
      parameters: { employeeIds, dateRange },
      generatedAt: new Date()
    };
  }

  async getAssignmentsReport(
    assigneeIds?: string[],
    dateRange?: { start: Date; end: Date }
  ): Promise<ReportData> {
    return {
      sections: [
        {
          sectionId: 'assignments_summary',
          title: 'Tổng quan nhiệm vụ',
          type: 'summary',
          data: {
            totalAssignments: 156,
            completed: 98,
            inProgress: 43,
            overdue: 15
          }
        },
        {
          sectionId: 'assignments_chart',
          title: 'Trạng thái nhiệm vụ',
          type: 'chart',
          data: this.generateMockChartData('assignments'),
          chartConfig: {
            type: 'pie',
            xAxis: 'status',
            yAxis: ['count'],
            colors: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
            title: 'Phân bố trạng thái nhiệm vụ'
          }
        }
      ],
      metadata: {
        reportName: 'Báo cáo nhiệm vụ',
        generatedBy: 'current_user',
        generatedAt: new Date(),
        totalRecords: 156,
        dateRange,
        filters: [],
        version: '1.0'
      },
      parameters: { assigneeIds, dateRange },
      generatedAt: new Date()
    };
  }

  // Private helper methods
  private async collectReportData(report: Report, parameters: Record<string, unknown>): Promise<ReportData> {
    // Mock data collection based on report type
    switch (report.type) {
      case 'performance':
        return this.getPerformanceReport(
          parameters.employeeIds as string[],
          parameters.dateRange as { start: Date; end: Date }
        );
      case 'attendance':
        return this.getAttendanceReport(
          parameters.employeeIds as string[],
          parameters.dateRange as { start: Date; end: Date }
        );
      case 'assignments':
        return this.getAssignmentsReport(
          parameters.assigneeIds as string[],
          parameters.dateRange as { start: Date; end: Date }
        );
      default:
        throw new Error(`Report type ${report.type} not supported`);
    }
  }

  private async exportReportData(
    reportData: ReportData, 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<string> {
    // Mock file generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock file URL
    return `/api/reports/files/${reportData.metadata.reportName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
  }

  private updateReportAnalytics(reportId: string, action: string, format?: ExportFormat): void {
    if (!this.analytics[reportId]) {
      this.analytics[reportId] = {
        reportId,
        views: 0,
        downloads: 0,
        shares: 0,
        avgGenerationTime: 0,
        lastAccessedAt: new Date(),
        popularFormats: {
          pdf: 0,
          excel: 0,
          csv: 0,
          json: 0,
          png: 0,
          jpg: 0
        },
        userActivity: []
      };
    }

    const analytics = this.analytics[reportId];
    
    if (action === 'download') {
      analytics.downloads++;
      if (format) {
        analytics.popularFormats[format] = (analytics.popularFormats[format] || 0) + 1;
      }
    }
    
    analytics.lastAccessedAt = new Date();
    analytics.userActivity.push({
      userId: 'current_user',
      action: action as 'view' | 'download' | 'share' | 'create' | 'edit',
      timestamp: new Date(),
      format
    });

    // Keep only last 100 activities
    if (analytics.userActivity.length > 100) {
      analytics.userActivity = analytics.userActivity.slice(-100);
    }
  }

  private calculateNextRun(schedule: Omit<ReportSchedule, 'id'>): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (schedule.frequency) {
      case 'daily': {
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      }
      case 'weekly': {
        const daysUntilNext = (schedule.dayOfWeek! - nextRun.getDay() + 7) % 7;
        nextRun.setDate(nextRun.getDate() + (daysUntilNext || 7));
        break;
      }
      case 'monthly': {
        nextRun.setDate(schedule.dayOfMonth!);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      }
    }
    
    return nextRun;
  }

  // Get all report generations
  async getGenerations(): Promise<ReportGeneration[]> {
    // In real implementation, this would fetch from API
    return this.generateMockGenerations();
  }

  // Export job management methods
  async getExportJobs(): Promise<ExportJob[]> {
    // In real implementation, this would fetch from API
    return this.generateMockExportJobs();
  }

  async retryExportJob(jobId: string): Promise<void> {
    // In real implementation, this would retry the export job
    console.log(`Retrying export job: ${jobId}`);
  }

  async cancelExportJob(jobId: string): Promise<void> {
    // In real implementation, this would cancel the export job
    console.log(`Cancelling export job: ${jobId}`);
  }

  async deleteExportJob(jobId: string): Promise<void> {
    // In real implementation, this would delete the export job
    console.log(`Deleting export job: ${jobId}`);
  }

  private generateMockChartData(type: string): unknown {
    const data = [];
    const dates = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    switch (type) {
      case 'performance':
        return dates.map(date => ({
          date,
          score: 3 + Math.random() * 2 // 3-5 range
        }));
      case 'assignments':
        return [
          { status: 'Hoàn thành', count: 98 },
          { status: 'Đang thực hiện', count: 43 },
          { status: 'Quá hạn', count: 15 }
        ];
      default:
        return data;
    }
  }

  private generateMockTableData(type: string): unknown[] {
    const employees = [
      'Nguyễn Văn An', 'Trần Thị Bảo', 'Lê Văn Cường', 'Phạm Thị Dung',
      'Hoàng Văn Em', 'Võ Thị Phượng', 'Đặng Văn Giang', 'Bùi Thị Hoa'
    ];

    switch (type) {
      case 'attendance':
        return employees.map(employee => ({
          employee,
          present: Math.floor(Math.random() * 5) + 20,
          absent: Math.floor(Math.random() * 3),
          late: Math.floor(Math.random() * 5),
          overtime: Math.floor(Math.random() * 10)
        }));
      default:
        return [];
    }
  }

  private initializeMockData(): void {
    // Mock templates
    this.templates = [
      {
        id: 'template_performance',
        name: 'Báo cáo hiệu suất nhân viên',
        description: 'Báo cáo chi tiết về hiệu suất làm việc của nhân viên',
        category: 'performance',
        type: 'performance',
        structure: [
          {
            id: 'section_1',
            title: 'Tổng quan hiệu suất',
            type: 'summary',
            config: { dataSource: 'performance_metrics' },
            order: 1,
            isRequired: true
          },
          {
            id: 'section_2',
            title: 'Biểu đồ hiệu suất',
            type: 'chart',
            config: { 
              dataSource: 'performance_data',
              chartType: 'line'
            },
            order: 2,
            isRequired: false
          }
        ],
        sections: [
          {
            id: 'section_1',
            title: 'Tổng quan hiệu suất',
            type: 'summary',
            config: { dataSource: 'performance_metrics' },
            order: 1,
            isRequired: true
          },
          {
            id: 'section_2',
            title: 'Biểu đồ hiệu suất',
            type: 'chart',
            config: { 
              dataSource: 'performance_data',
              chartType: 'line'
            },
            order: 2,
            isRequired: false
          }
        ],
        defaultParameters: {
          dateRange: { 
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        },
        isCustomizable: true
      },
      {
        id: 'template_attendance',
        name: 'Báo cáo chấm công',
        description: 'Báo cáo tổng hợp về chấm công và thời gian làm việc',
        category: 'attendance',
        type: 'attendance',
        structure: [
          {
            id: 'section_1',
            title: 'Tổng quan chấm công',
            type: 'summary',
            config: { dataSource: 'attendance_summary' },
            order: 1,
            isRequired: true
          },
          {
            id: 'section_2',
            title: 'Chi tiết chấm công',
            type: 'table',
            config: { dataSource: 'attendance_details' },
            order: 2,
            isRequired: true
          }
        ],
        sections: [
          {
            id: 'section_1',
            title: 'Tổng quan chấm công',
            type: 'summary',
            config: { dataSource: 'attendance_summary' },
            order: 1,
            isRequired: true
          },
          {
            id: 'section_2',
            title: 'Chi tiết chấm công',
            type: 'table',
            config: { dataSource: 'attendance_details' },
            order: 2,
            isRequired: true
          }
        ],
        defaultParameters: {
          dateRange: { 
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        },
        isCustomizable: true
      }
    ];

    // Mock reports
    this.reports = [
      {
        id: 'report_1',
        name: 'Báo cáo hiệu suất tháng 11',
        description: 'Báo cáo chi tiết về hiệu suất làm việc của nhân viên trong tháng 11',
        type: 'performance',
        category: 'management',
        template: this.templates[0],
        parameters: [
          {
            id: 'dateRange',
            name: 'dateRange',
            label: 'Khoảng thời gian',
            type: 'daterange',
            required: true,
            defaultValue: {
              start: new Date(2025, 10, 1),
              end: new Date(2025, 10, 30)
            }
          }
        ],
        isPublic: false,
        createdBy: 'user_manager_1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'active',
        tags: ['hiệu suất', 'nhân viên', 'tháng 11']
      },
      {
        id: 'report_2',
        name: 'Báo cáo chấm công Q4',
        description: 'Thống kê chấm công quý 4 năm 2025',
        type: 'attendance',
        category: 'hr',
        template: this.templates[1],
        parameters: [
          {
            id: 'quarter',
            name: 'quarter',
            label: 'Quý',
            type: 'select',
            required: true,
            defaultValue: 'Q4',
            options: [
              { value: 'Q1', label: 'Quý 1' },
              { value: 'Q2', label: 'Quý 2' },
              { value: 'Q3', label: 'Quý 3' },
              { value: 'Q4', label: 'Quý 4' }
            ]
          }
        ],
        isPublic: true,
        createdBy: 'user_hr_1',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        tags: ['chấm công', 'quý 4', 'HR']
      }
    ];
  }

  private generateMockGenerations(): ReportGeneration[] {
    return [
      {
        id: 'gen_1',
        reportId: 'report_1',
        reportName: 'Employee Performance Report',
        parameters: { startDate: '2024-01-01', endDate: '2024-12-31' },
        format: 'pdf',
        status: 'completed',
        progress: 100,
        startedAt: new Date(Date.now() - 60000),
        completedAt: new Date(),
        generationTime: 45000,
        downloadUrl: '/api/downloads/gen_1.pdf',
        fileName: 'performance_report.pdf',
        fileSize: 1024 * 1024 * 2.5,
        generatedBy: 'user_1'
      },
      {
        id: 'gen_2',
        reportId: 'report_2',
        reportName: 'Department Analytics',
        parameters: { department: 'engineering' },
        format: 'excel',
        status: 'generating',
        progress: 75,
        startedAt: new Date(Date.now() - 30000),
        generationTime: 30000,
        fileName: 'department_analytics.xlsx',
        generatedBy: 'user_2'
      },
      {
        id: 'gen_3',
        reportId: 'report_3',
        reportName: 'Attendance Summary',
        parameters: { month: '2024-01' },
        format: 'csv',
        status: 'failed',
        startedAt: new Date(Date.now() - 120000),
        error: 'Data source unavailable',
        generatedBy: 'user_3'
      }
    ];
  }

  private generateMockExportJobs(): ExportJob[] {
    return [
      {
        id: 'job_1',
        reportId: 'report_1',
        reportName: 'Performance Report',
        format: 'pdf',
        status: 'completed',
        progress: 100,
        fileName: 'performance_report.pdf',
        fileSize: 1024 * 1024 * 2.5,
        downloadUrl: '/api/downloads/job_1.pdf',
        createdAt: new Date(Date.now() - 3600000),
        startedAt: new Date(Date.now() - 3600000 + 10000),
        completedAt: new Date(Date.now() - 3600000 + 45000),
        createdBy: 'user_1'
      },
      {
        id: 'job_2',
        reportIds: ['report_1', 'report_2', 'report_3'],
        reportNames: ['Performance Report', 'Department Analytics', 'Attendance Summary'],
        format: 'excel',
        status: 'in_progress',
        progress: 60,
        fileName: 'bulk_export.zip',
        createdAt: new Date(Date.now() - 1800000),
        startedAt: new Date(Date.now() - 1800000 + 5000),
        createdBy: 'user_2'
      },
      {
        id: 'job_3',
        reportId: 'report_4',
        reportName: 'Financial Report',
        format: 'csv',
        status: 'failed',
        fileName: 'financial_report.csv',
        createdAt: new Date(Date.now() - 7200000),
        startedAt: new Date(Date.now() - 7200000 + 15000),
        error: 'Insufficient permissions to access financial data',
        createdBy: 'user_3'
      },
      {
        id: 'job_4',
        reportId: 'report_5',
        reportName: 'HR Dashboard',
        format: 'png',
        status: 'queued',
        fileName: 'hr_dashboard.png',
        createdAt: new Date(Date.now() - 300000),
        createdBy: 'user_1'
      }
    ];
  }
}

export { ReportService };
export const reportService = new ReportService();