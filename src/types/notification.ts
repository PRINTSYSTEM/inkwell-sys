export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  isRead: boolean;
  userId: string;
  data?: Record<string, unknown>; // Additional context data
  actionUrl?: string; // URL to navigate when clicked
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'assignment' 
  | 'deadline' 
  | 'performance'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationCategory = 
  | 'assignment' 
  | 'deadline' 
  | 'performance' 
  | 'attendance' 
  | 'system' 
  | 'announcement'
  | 'workflow'
  | 'approval';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      priority: NotificationPriority[];
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  variables: string[]; // Template variables like {{employeeName}}
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: NotificationTrigger;
  template: string; // Template ID
  conditions: NotificationCondition[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTrigger {
  event: NotificationEvent;
  delay?: number; // Minutes before/after event
  recurring?: {
    enabled: boolean;
    interval: number; // Minutes
    maxCount?: number;
  };
}

export type NotificationEvent = 
  | 'assignment_created'
  | 'assignment_updated' 
  | 'assignment_due_soon'
  | 'assignment_overdue'
  | 'performance_review_due'
  | 'attendance_missed'
  | 'deadline_approaching'
  | 'task_completed'
  | 'workflow_status_changed'
  | 'approval_required'
  | 'system_maintenance';

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byCategory: Record<NotificationCategory, number>;
  last7Days: number;
  readRate: number; // Percentage
}

export interface NotificationFilter {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  category?: NotificationCategory[];
  isRead?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface NotificationBatch {
  id: string;
  name: string;
  notifications: Notification[];
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  targetUsers: string[];
  createdBy: string;
  createdAt: Date;
}

export interface RealTimeNotification {
  notification: Notification;
  timestamp: Date;
  action: 'created' | 'updated' | 'deleted' | 'read';
}

export interface NotificationHistory {
  id: string;
  notificationId: string;
  action: 'sent' | 'read' | 'clicked' | 'dismissed';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'in_app' | 'email' | 'push' | 'sms';
  enabled: boolean;
  config: Record<string, unknown>; // Channel-specific configuration
}