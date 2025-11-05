import { 
  Notification, 
  NotificationPreferences, 
  NotificationTemplate, 
  NotificationRule,
  NotificationStats,
  NotificationFilter,
  NotificationBatch,
  NotificationHistory,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationEvent
} from '../types/notification';

class NotificationService {
  private notifications: Notification[] = [];
  private templates: NotificationTemplate[] = [];
  private rules: NotificationRule[] = [];
  private preferences: NotificationPreferences[] = [];
  private batches: NotificationBatch[] = [];
  private history: NotificationHistory[] = [];
  private listeners: ((notification: Notification) => void)[] = [];

  constructor() {
    this.initializeMockData();
  }

  // CRUD Operations for Notifications
  async getNotifications(userId: string, filter?: NotificationFilter): Promise<Notification[]> {
    let userNotifications = this.notifications.filter(n => n.userId === userId);

    if (filter) {
      if (filter.type) {
        userNotifications = userNotifications.filter(n => filter.type!.includes(n.type));
      }
      if (filter.priority) {
        userNotifications = userNotifications.filter(n => filter.priority!.includes(n.priority));
      }
      if (filter.category) {
        userNotifications = userNotifications.filter(n => filter.category!.includes(n.category));
      }
      if (filter.isRead !== undefined) {
        userNotifications = userNotifications.filter(n => n.isRead === filter.isRead);
      }
      if (filter.dateRange) {
        userNotifications = userNotifications.filter(n => 
          n.createdAt >= filter.dateRange!.start && n.createdAt <= filter.dateRange!.end
        );
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        userNotifications = userNotifications.filter(n => 
          n.title.toLowerCase().includes(searchLower) || 
          n.message.toLowerCase().includes(searchLower)
        );
      }
    }

    return userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.notifications.push(newNotification);
    
    // Trigger real-time listeners
    this.listeners.forEach(listener => listener(newNotification));
    
    // Log to history
    this.addToHistory(newNotification.id, 'sent');

    return newNotification;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      this.addToHistory(notificationId, 'read');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.filter(n => n.userId === userId && !n.isRead);
    userNotifications.forEach(notification => {
      notification.isRead = true;
      notification.readAt = new Date();
      this.addToHistory(notification.id, 'read');
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  // Notification Statistics
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const userNotifications = this.notifications.filter(n => n.userId === userId);
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const stats: NotificationStats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.isRead).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byCategory: {} as Record<NotificationCategory, number>,
      last7Days: userNotifications.filter(n => n.createdAt >= last7Days).length,
      readRate: userNotifications.length > 0 ? 
        (userNotifications.filter(n => n.isRead).length / userNotifications.length) * 100 : 0
    };

    // Count by type
    userNotifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
    });

    return stats;
  }

  // User Preferences
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = this.preferences.find(p => p.userId === userId);
    
    if (!preferences) {
      preferences = this.createDefaultPreferences(userId);
      this.preferences.push(preferences);
    }
    
    return preferences;
  }

  async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    let preferences = this.preferences.find(p => p.userId === userId);
    
    if (!preferences) {
      preferences = this.createDefaultPreferences(userId);
      this.preferences.push(preferences);
    }
    
    Object.assign(preferences, updates);
    return preferences;
  }

  // Real-time functionality
  subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Helper Methods
  async sendAssignmentNotification(
    userId: string, 
    assignmentTitle: string, 
    assignmentId: string,
    type: 'created' | 'updated' | 'due_soon' | 'overdue'
  ): Promise<void> {
    const titles = {
      created: 'Nhiệm vụ mới',
      updated: 'Nhiệm vụ đã cập nhật',
      due_soon: 'Nhiệm vụ sắp đến hạn',
      overdue: 'Nhiệm vụ quá hạn'
    };

    const messages = {
      created: `Bạn đã được giao nhiệm vụ: ${assignmentTitle}`,
      updated: `Nhiệm vụ "${assignmentTitle}" đã được cập nhật`,
      due_soon: `Nhiệm vụ "${assignmentTitle}" sắp đến hạn`,
      overdue: `Nhiệm vụ "${assignmentTitle}" đã quá hạn`
    };

    const priorities: Record<string, NotificationPriority> = {
      created: 'medium',
      updated: 'medium',
      due_soon: 'high',
      overdue: 'urgent'
    };

    await this.createNotification({
      title: titles[type],
      message: messages[type],
      type: 'assignment',
      priority: priorities[type],
      category: 'assignment',
      isRead: false,
      userId,
      data: { assignmentId, assignmentTitle },
      actionUrl: `/assignments/${assignmentId}`
    });
  }

  async sendPerformanceNotification(
    userId: string,
    performanceData: {target?: string; achievement?: number},
    type: 'review_due' | 'target_achieved' | 'improvement_needed'
  ): Promise<void> {
    const titles = {
      review_due: 'Đánh giá hiệu suất',
      target_achieved: 'Hoàn thành mục tiêu',
      improvement_needed: 'Cần cải thiện hiệu suất'
    };

    const messages = {
      review_due: 'Đã đến thời gian đánh giá hiệu suất định kỳ',
      target_achieved: `Chúc mừng! Bạn đã đạt mục tiêu ${performanceData.target || ''}`,
      improvement_needed: 'Hiệu suất làm việc cần được cải thiện'
    };

    await this.createNotification({
      title: titles[type],
      message: messages[type],
      type: 'performance',
      priority: type === 'improvement_needed' ? 'high' : 'medium',
      category: 'performance',
      isRead: false,
      userId,
      data: performanceData,
      actionUrl: '/performance'
    });
  }

  async sendSystemNotification(
    userIds: string[],
    title: string,
    message: string,
    priority: NotificationPriority = 'medium'
  ): Promise<void> {
    for (const userId of userIds) {
      await this.createNotification({
        title,
        message,
        type: 'system',
        priority,
        category: 'system',
        isRead: false,
        userId
      });
    }
  }

  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      categories: {
        assignment: { enabled: true, priority: ['medium', 'high', 'urgent'] },
        deadline: { enabled: true, priority: ['high', 'urgent'] },
        performance: { enabled: true, priority: ['medium', 'high', 'urgent'] },
        attendance: { enabled: true, priority: ['medium', 'high'] },
        system: { enabled: true, priority: ['high', 'urgent'] },
        announcement: { enabled: true, priority: ['low', 'medium', 'high'] },
        workflow: { enabled: true, priority: ['medium', 'high'] },
        approval: { enabled: true, priority: ['high', 'urgent'] }
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      }
    };
  }

  private addToHistory(notificationId: string, action: 'sent' | 'read' | 'clicked' | 'dismissed'): void {
    this.history.push({
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notificationId,
      action,
      timestamp: new Date()
    });
  }

  private initializeMockData(): void {
    // Mock notifications for demo
    const mockNotifications: Notification[] = [
      {
        id: 'notif_1',
        title: 'Nhiệm vụ mới được giao',
        message: 'Bạn đã được giao nhiệm vụ thiết kế poster cho chiến dịch mùa hè',
        type: 'assignment',
        priority: 'high',
        category: 'assignment',
        isRead: false,
        userId: 'user_1',
        data: { assignmentId: 'assign_1', assignmentTitle: 'Thiết kế poster chiến dịch mùa hè' },
        actionUrl: '/assignments/assign_1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 'notif_2',
        title: 'Đánh giá hiệu suất',
        message: 'Đã đến thời gian đánh giá hiệu suất định kỳ tháng này',
        type: 'performance',
        priority: 'medium',
        category: 'performance',
        isRead: false,
        userId: 'user_1',
        actionUrl: '/performance',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        id: 'notif_3',
        title: 'Nhiệm vụ sắp đến hạn',
        message: 'Nhiệm vụ "Hoàn thiện thiết kế brochure" sẽ đến hạn trong 2 giờ nữa',
        type: 'deadline',
        priority: 'urgent',
        category: 'deadline',
        isRead: true,
        userId: 'user_1',
        data: { assignmentId: 'assign_2' },
        actionUrl: '/assignments/assign_2',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        readAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 'notif_4',
        title: 'Cập nhật hệ thống',
        message: 'Hệ thống sẽ được bảo trì vào lúc 2:00 AM ngày mai',
        type: 'system',
        priority: 'medium',
        category: 'system',
        isRead: false,
        userId: 'user_1',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
      }
    ];

    this.notifications = mockNotifications;
  }
}

export const notificationService = new NotificationService();