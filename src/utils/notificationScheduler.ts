import { notificationService } from '@/services/notificationService';
import { assignmentService } from '@/services/assignmentService';
import { NotificationCategory, NotificationPriority, NotificationType } from '@/types/notification';

class NotificationScheduler {
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.startScheduler();
  }

  private startScheduler() {
    // Check for upcoming deadlines every hour
    const deadlineCheck = setInterval(() => {
      this.checkUpcomingDeadlines();
    }, 60 * 60 * 1000); // 1 hour

    // Check for overdue assignments every 30 minutes
    const overdueCheck = setInterval(() => {
      this.checkOverdueAssignments();
    }, 30 * 60 * 1000); // 30 minutes

    this.intervals.push(deadlineCheck, overdueCheck);

    // Initial check
    this.checkUpcomingDeadlines();
    this.checkOverdueAssignments();
  }

  private async checkUpcomingDeadlines() {
    try {
      const { assignments } = await assignmentService.getAssignments();
      const now = new Date();
      
      // Check for assignments due within 24 hours
      const upcomingDeadlines = assignments.filter(assignment => {
        if (!assignment.assignedTo || assignment.status === 'completed') return false;
        
        const deadline = new Date(assignment.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const hoursUntilDeadline = timeDiff / (1000 * 60 * 60);
        
        // Due within 24 hours but not past due
        return hoursUntilDeadline > 0 && hoursUntilDeadline <= 24;
      });

      for (const assignment of upcomingDeadlines) {
        await notificationService.sendAssignmentNotification(
          assignment.assignedTo!,
          assignment.title,
          assignment.id,
          'due_soon'
        );
      }

      console.log(`Checked ${assignments.length} assignments, found ${upcomingDeadlines.length} upcoming deadlines`);
    } catch (error) {
      console.error('Error checking upcoming deadlines:', error);
    }
  }

  private async checkOverdueAssignments() {
    try {
      const { assignments } = await assignmentService.getAssignments();
      const now = new Date();
      
      // Check for overdue assignments
      const overdueAssignments = assignments.filter(assignment => {
        if (!assignment.assignedTo || assignment.status === 'completed') return false;
        
        const deadline = new Date(assignment.deadline);
        return deadline < now;
      });

      for (const assignment of overdueAssignments) {
        await notificationService.sendAssignmentNotification(
          assignment.assignedTo!,
          assignment.title,
          assignment.id,
          'overdue'
        );
      }

      console.log(`Checked ${assignments.length} assignments, found ${overdueAssignments.length} overdue assignments`);
    } catch (error) {
      console.error('Error checking overdue assignments:', error);
    }
  }

  public stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  // Manual trigger for testing
  public async triggerDeadlineCheck() {
    await this.checkUpcomingDeadlines();
    await this.checkOverdueAssignments();
  }

  // Send performance notifications
  public async sendPerformanceNotifications(userId: string, performanceData: {
    target: string;
    achievement: number;
    type: 'review_due' | 'target_achieved' | 'improvement_needed';
  }) {
    await notificationService.sendPerformanceNotification(
      userId,
      performanceData,
      performanceData.type
    );
  }

  // Send system-wide notifications
  public async sendSystemNotification(
    userIds: string[],
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) {
    await notificationService.sendSystemNotification(userIds, title, message, priority);
  }

  // Send custom notifications
  public async sendCustomNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    category: NotificationCategory;
    actionUrl?: string;
    data?: Record<string, unknown>;
  }) {
    await notificationService.createNotification({
      ...notification,
      isRead: false
    });
  }
}

// Create singleton instance
export const notificationScheduler = new NotificationScheduler();

// Utility functions for common notification scenarios
export const NotificationUtils = {
  // Assignment-related notifications
  async notifyAssignmentCreated(assignmentId: string, assigneeId: string, title: string) {
    await notificationService.sendAssignmentNotification(assigneeId, title, assignmentId, 'created');
  },

  async notifyAssignmentUpdated(assignmentId: string, assigneeId: string, title: string) {
    await notificationService.sendAssignmentNotification(assigneeId, title, assignmentId, 'updated');
  },

  // Performance notifications
  async notifyPerformanceReview(userId: string) {
    await notificationService.sendPerformanceNotification(
      userId,
      { target: 'quarterly review' },
      'review_due'
    );
  },

  async notifyTargetAchieved(userId: string, target: string) {
    await notificationService.sendPerformanceNotification(
      userId,
      { target },
      'target_achieved'
    );
  },

  // System notifications
  async notifySystemMaintenance(userIds: string[], scheduledTime: string) {
    await notificationService.sendSystemNotification(
      userIds,
      'Bảo trì hệ thống',
      `Hệ thống sẽ được bảo trì vào lúc ${scheduledTime}. Vui lòng lưu công việc và đăng xuất trước thời gian này.`,
      'high'
    );
  },

  async notifyNewFeature(userIds: string[], featureName: string) {
    await notificationService.sendSystemNotification(
      userIds,
      'Tính năng mới',
      `Tính năng "${featureName}" đã được thêm vào hệ thống. Khám phá ngay!`,
      'medium'
    );
  },

  // Deadline reminders
  async scheduleDeadlineReminder(assignmentId: string, assigneeId: string, title: string, deadline: Date) {
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    
    // Schedule reminder 24 hours before deadline
    const reminderTime = timeUntilDeadline - (24 * 60 * 60 * 1000);
    
    if (reminderTime > 0) {
      setTimeout(async () => {
        await notificationService.sendAssignmentNotification(
          assigneeId,
          title,
          assignmentId,
          'due_soon'
        );
      }, reminderTime);
    }
  },

  // Bulk notifications
  async notifyTeam(userIds: string[], title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    await notificationService.sendSystemNotification(userIds, title, message, priority);
  }
};

export default notificationScheduler;