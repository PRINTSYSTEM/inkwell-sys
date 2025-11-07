// Report Types
export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  template: ReportTemplate;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastGeneratedAt?: Date;
  status: ReportStatus;
  tags: string[];
}

export type ReportType = 
  | 'performance'
  | 'attendance'
  | 'assignments'
  | 'analytics'
  | 'department'
  | 'employee'
  | 'custom';

export type ReportCategory = 
  | 'operational'
  | 'strategic'
  | 'compliance'
  | 'management'
  | 'hr';

export type ReportStatus = 
  | 'draft'
  | 'active'
  | 'scheduled'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'archived';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ReportType;
  structure: ReportSection[];
  sections: ReportSection[];
  defaultParameters: Record<string, unknown>;
  isCustomizable: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'summary' | 'text' | 'image';
  config: ReportSectionConfig;
  order: number;
  isRequired: boolean;
}

export interface ReportSectionConfig {
  dataSource: string;
  columns?: string[];
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  filters?: ReportFilter[];
  groupBy?: string[];
  aggregations?: ReportAggregation[];
  styling?: ReportStyling;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between' | 'in';
  value: string | number | boolean | string[] | number[];
  label: string;
}

export interface ReportAggregation {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
  label: string;
}

export interface ReportStyling {
  theme: 'light' | 'dark' | 'corporate';
  colors: string[];
  fontSize: number;
  fontFamily: string;
}

export interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'daterange';
  required: boolean;
  defaultValue?: unknown;
  options?: ReportParameterOption[];
  validation?: ReportParameterValidation;
}

export interface ReportParameterOption {
  value: string | number;
  label: string;
}

export interface ReportParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface ReportSchedule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  interval: number;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  timezone: string;
  isActive: boolean;
  recipients: string[]; // User IDs or email addresses
  format: ExportFormat[];
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'png' | 'jpg';

export interface ReportGeneration {
  id: string;
  reportId: string;
  reportName?: string;
  parameters: Record<string, unknown>;
  format: ExportFormat;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number;
  startedAt: Date;
  completedAt?: Date;
  generationTime?: number;
  fileUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  generatedBy: string;
}

export interface ReportData {
  sections: ReportSectionData[];
  metadata: ReportMetadata;
  parameters: Record<string, unknown>;
  generatedAt: Date;
}

export interface ReportSectionData {
  sectionId: string;
  title: string;
  type: 'chart' | 'table' | 'summary' | 'text' | 'image';
  data: unknown;
  chartConfig?: ChartConfig;
  tableConfig?: TableConfig;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  xAxis: string;
  yAxis: string[];
  colors: string[];
  title: string;
  subtitle?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  pagination: boolean;
  sorting: boolean;
  filtering: boolean;
}

export interface TableColumn {
  key: string;
  title: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  format?: string;
}

export interface ReportMetadata {
  reportName: string;
  generatedBy: string;
  generatedAt: Date;
  totalRecords: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters: ReportFilter[];
  version: string;
}

// Dashboard Reports
export interface DashboardReport {
  id: string;
  title: string;
  widgets: ReportWidget[];
  layout: DashboardLayout;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ReportWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  reportId: string;
  sectionId: string;
  position: WidgetPosition;
  size: WidgetSize;
  refreshInterval?: number; // seconds
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
}

// Export Options
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts: boolean;
  includeRawData: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  compression?: boolean;
  password?: string;
}

// Report Analytics
export interface ReportAnalytics {
  reportId: string;
  views: number;
  downloads: number;
  shares: number;
  avgGenerationTime: number; // milliseconds
  lastAccessedAt: Date;
  popularFormats: Record<ExportFormat, number>;
  userActivity: ReportUserActivity[];
}

export interface ReportUserActivity {
  userId: string;
  action: 'view' | 'download' | 'share' | 'create' | 'edit';
  timestamp: Date;
  format?: ExportFormat;
  parameters?: Record<string, unknown>;
}

// Bulk Operations
export interface BulkReportOperation {
  id: string;
  type: 'generate' | 'export' | 'schedule' | 'delete';
  reportIds: string[];
  parameters?: Record<string, unknown>;
  format?: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  results: BulkOperationResult[];
}

export interface BulkOperationResult {
  reportId: string;
  status: 'success' | 'failed';
  fileUrl?: string;
  error?: string;
}

// Export Job interface for tracking export operations
export interface ExportJob {
  id: string;
  reportId?: string;
  reportIds?: string[];
  reportName?: string;
  reportNames?: string[];
  format: ExportFormat;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdBy: string;
}

// Bulk Export Options interface
export interface BulkExportOptions {
  format: ExportFormat;
  compression: 'none' | 'low' | 'medium' | 'high';
  includeCharts: boolean;
  includeRawData: boolean;
  splitLargeFiles: boolean;
  maxFileSize: number; // in MB
  outputName: string;
}