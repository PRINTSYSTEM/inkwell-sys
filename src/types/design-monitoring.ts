import { DesignAssignment, DesignAssignmentStatus, DesignAssignmentPriority } from '@/Schema';
import { Employee } from '@/types/employee';

// Designer Workload - thông tin tải công việc của designer
export interface DesignerWorkload {
  designerId: string;
  designer: Employee;
  
  // Workload metrics
  activeAssignments: number;
  totalWorkload: number; // percentage (0-100)
  overdueAssignments: number;
  
  // Performance metrics
  completedThisMonth: number;
  completedThisWeek: number;
  averageCompletionTime: number; // in days
  onTimeCompletionRate: number; // percentage
  
  // Current assignments breakdown
  assignmentsByStatus: {
    pending: number;
    in_progress: number;
    review: number;
    revision: number;
    approved: number;
  };
  
  // Priority distribution
  assignmentsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  
  // Time tracking
  estimatedHoursRemaining: number;
  actualHoursThisWeek: number;
  
  // Availability
  isAvailable: boolean;
  availabilityStatus: 'available' | 'busy' | 'overloaded' | 'offline';
  nextAvailableDate?: Date;
}

// Department Design Statistics
export interface DepartmentDesignStats {
  departmentId: string;
  departmentName: string;
  
  // Team overview
  totalDesigners: number;
  activeDesigners: number;
  
  // Assignment statistics
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  
  // Performance metrics
  departmentEfficiency: number; // percentage
  averageCompletionTime: number; // in days
  onTimeDeliveryRate: number; // percentage
  
  // Workload distribution
  workloadDistribution: {
    underloaded: number; // designers with <50% workload
    optimal: number; // designers with 50-80% workload
    overloaded: number; // designers with >80% workload
  };
  
  // Monthly trends
  monthlyStats: {
    month: string;
    completed: number;
    assigned: number;
    averageTime: number;
  }[];
  
  // Top performers
  topPerformers: {
    designerId: string;
    designerName: string;
    completedCount: number;
    efficiency: number;
  }[];
}

// Designer Performance - chi tiết hiệu suất của từng designer
export interface DesignerPerformance {
  designerId: string;
  designer: Employee;
  
  // Time period for metrics
  periodStart: Date;
  periodEnd: Date;
  
  // Completion metrics
  totalAssignments: number;
  completedAssignments: number;
  completionRate: number; // percentage
  
  // Time metrics
  averageCompletionTime: number; // in days
  fastestCompletion: number; // in days
  slowestCompletion: number; // in days
  
  // Quality metrics
  revisionRate: number; // average revisions per assignment
  approvalRate: number; // percentage of assignments approved on first submission
  customerSatisfactionScore?: number; // if available
  
  // Workload handling
  peakWorkload: number; // highest concurrent assignments
  averageWorkload: number;
  workloadEfficiency: number; // how well they handle their workload
  
  // Deadline performance
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeRate: number; // percentage
  
  // Skill areas (based on assignment types)
  skillAreas: {
    skillName: string;
    assignmentCount: number;
    averageRating?: number;
  }[];
  
  // Recent activity
  recentAssignments: DesignAssignment[];
  
  // Growth trends
  performanceTrend: 'improving' | 'stable' | 'declining';
  monthlyProgress: {
    month: string;
    completedCount: number;
    averageTime: number;
    onTimeRate: number;
  }[];
}

// Assignment Timeline Item - cho hiển thị timeline
export interface AssignmentTimelineItem {
  id: string;
  assignmentId: string;
  timestamp: Date;
  action: 'assigned' | 'started' | 'submitted' | 'revision_requested' | 'approved' | 'completed';
  performedBy: string; // user ID
  performedByName: string;
  description: string;
  notes?: string;
}

// Design Monitoring Dashboard Data
export interface DesignMonitoringDashboard {
  // Overview stats
  departmentStats: DepartmentDesignStats;
  
  // Designer workloads
  designerWorkloads: DesignerWorkload[];
  
  // Recent activities
  recentActivities: AssignmentTimelineItem[];
  
  // Urgent items requiring attention
  urgentItems: {
    overdueAssignments: DesignAssignment[];
    highPriorityPending: DesignAssignment[];
    designersOverloaded: DesignerWorkload[];
  };
  
  // Performance alerts
  alerts: {
    type: 'overdue' | 'overloaded' | 'low_performance' | 'deadline_risk';
    severity: 'low' | 'medium' | 'high';
    message: string;
    relatedId: string; // assignment or designer ID
    timestamp: Date;
  }[];
}

// Filter options for various views
export interface DesignerFilter {
  departmentId?: string;
  status?: 'all' | 'available' | 'busy' | 'overloaded';
  skillArea?: string;
  performanceLevel?: 'high' | 'medium' | 'low';
  workloadRange?: {
    min: number;
    max: number;
  };
}

export interface AssignmentAnalytics {
  // Time-based analysis
  completionTimeAnalysis: {
    byPriority: { [key in DesignAssignmentPriority]: number };
    byDesigner: { designerId: string; averageTime: number }[];
    byMonth: { month: string; averageTime: number }[];
  };
  
  // Bottleneck analysis
  bottlenecks: {
    stage: DesignAssignmentStatus;
    averageStayTime: number; // days
    assignmentCount: number;
  }[];
  
  // Resource utilization
  resourceUtilization: {
    designerId: string;
    utilizationRate: number; // percentage
    capacityRemaining: number; // hours
  }[];
}

// Chart data types for dashboard visualizations
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
}

export interface WorkloadChartData {
  designerName: string;
  workload: number;
  capacity: number;
  efficiency: number;
}

// Export all types for easy import
export type {
  // Re-export from schema for convenience
  DesignAssignment,
  DesignAssignmentStatus,
  DesignAssignmentPriority
} from '@/Schema';