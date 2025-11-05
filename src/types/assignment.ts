export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'design' | 'review' | 'production' | 'quality_check' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unassigned' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  assignedTo?: string; // Employee ID
  assignedBy: string; // Manager ID
  estimatedHours: number;
  actualHours?: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Design specific fields
  designId?: string;
  designType?: string;
  clientId?: string;
  clientName?: string;
  
  // Requirements and resources
  requirements: string[];
  skills: string[];
  materials: string[];
  
  // Progress tracking
  progress: number; // 0-100
  milestones: AssignmentMilestone[];
  
  // Metadata
  tags: string[];
  department: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  
  // Collaboration
  collaborators?: string[]; // Other employee IDs
  dependencies?: string[]; // Other assignment IDs
}

export interface AssignmentMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: string;
  completedBy?: string;
}

export interface AssignmentTemplate {
  id: string;
  name: string;
  description: string;
  type: Assignment['type'];
  estimatedHours: number;
  requirements: string[];
  skills: string[];
  complexity: Assignment['complexity'];
  defaultMilestones: Omit<AssignmentMilestone, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface WorkloadBalance {
  employeeId: string;
  employeeName: string;
  currentLoad: number; // Total hours assigned
  capacity: number; // Available hours per week
  utilizationRate: number; // currentLoad / capacity
  assignments: Assignment[];
  availability: EmployeeAvailability;
  skills: string[];
  department: string;
  performance: {
    averageRating: number;
    completionRate: number;
    onTimeRate: number;
  };
}

export interface EmployeeAvailability {
  employeeId: string;
  weeklyCapacity: number;
  currentWeekLoad: number;
  nextWeekLoad: number;
  vacationDays: string[];
  busyDates: string[];
  preferredWorkload: number;
  overtimeAllowed: boolean;
}

export interface AssignmentSuggestion {
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  confidence: number; // 0-1
  reasons: string[];
  concerns: string[];
  estimatedCompletion: string;
  workloadImpact: number;
  skillMatch: number;
  availabilityScore: number;
}

export interface AssignmentFilter {
  status?: Assignment['status'][];
  type?: Assignment['type'][];
  priority?: Assignment['priority'][];
  assignedTo?: string[];
  department?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  complexity?: Assignment['complexity'][];
  overdue?: boolean;
  unassigned?: boolean;
}

export interface AssignmentBulkAction {
  type: 'assign' | 'reassign' | 'update_priority' | 'update_deadline' | 'cancel';
  assignmentIds: string[];
  data: {
    assignedTo?: string;
    priority?: Assignment['priority'];
    deadline?: string;
    reason?: string;
  };
}

export interface AssignmentHistory {
  id: string;
  assignmentId: string;
  action: 'created' | 'assigned' | 'reassigned' | 'started' | 'completed' | 'cancelled' | 'updated';
  performedBy: string;
  performedAt: string;
  details: string;
  previousValues?: Partial<Assignment>;
  newValues?: Partial<Assignment>;
}

export interface AssignmentMetrics {
  total: number;
  byStatus: Record<Assignment['status'], number>;
  byPriority: Record<Assignment['priority'], number>;
  byType: Record<Assignment['type'], number>;
  avgCompletionTime: number;
  onTimeRate: number;
  overdue: number;
  unassigned: number;
}

export interface TeamWorkload {
  departmentId: string;
  departmentName: string;
  totalCapacity: number;
  totalLoad: number;
  utilizationRate: number;
  employees: WorkloadBalance[];
  recommendations: WorkloadRecommendation[];
}

export interface WorkloadRecommendation {
  type: 'redistribute' | 'hire' | 'training' | 'deadline_adjustment';
  priority: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  actionItems: string[];
  affectedEmployees: string[];
}

export interface AssignmentBoard {
  id: string;
  name: string;
  description: string;
  columns: AssignmentColumn[];
  filters: AssignmentFilter;
  groupBy: 'status' | 'priority' | 'assignee' | 'type';
  sortBy: 'deadline' | 'priority' | 'created' | 'updated';
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AssignmentColumn {
  id: string;
  title: string;
  status: Assignment['status'];
  assignments: Assignment[];
  limit?: number;
  color: string;
}

export interface DragDropResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  draggableId: string;
}

export interface AssignmentFormData {
  title: string;
  description: string;
  type: Assignment['type'];
  priority: Assignment['priority'];
  assignedTo?: string;
  estimatedHours: number;
  deadline: string;
  requirements: string[];
  skills: string[];
  materials: string[];
  tags: string[];
  complexity: Assignment['complexity'];
  collaborators?: string[];
  dependencies?: string[];
  
  // Design specific
  designId?: string;
  clientId?: string;
  
  // Template
  templateId?: string;
}

export interface AssignmentComment {
  id: string;
  assignmentId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  attachments?: string[];
}

export interface AssignmentNotification {
  id: string;
  type: 'assignment' | 'deadline' | 'completion' | 'overdue' | 'reassignment';
  assignmentId: string;
  recipientId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}