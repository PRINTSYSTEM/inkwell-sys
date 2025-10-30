// Smart Notification Service
// Handles intelligent notifications for various system events

import { orders, payments, mockMaterials } from '@/lib/mockData';

export interface SmartNotification {
  id: string;
  type: 'order_deadline' | 'payment_overdue' | 'low_stock' | 'status_change' | 'material_shortage';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: string;
  relatedType?: 'order' | 'payment' | 'material' | 'production';
  read: boolean;
  actionRequired: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationRule {
  type: SmartNotification['type'];
  condition: () => boolean;
  generate: () => SmartNotification[];
  frequency: 'realtime' | 'hourly' | 'daily';
}

class SmartNotificationService {
  private notifications: SmartNotification[] = [];
  private rules: NotificationRule[] = [];
  private subscribers: ((notifications: SmartNotification[]) => void)[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.startPeriodicCheck();
  }

  private initializeDefaultRules() {
    // Rule 1: Order deadline approaching
    this.addRule({
      type: 'order_deadline',
      frequency: 'daily',
      condition: () => true, // Always check
      generate: () => {
        const notifications: SmartNotification[] = [];
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        orders.forEach(order => {
          if (order.deliveryDate && order.status !== 'completed') {
            const deadline = new Date(order.deliveryDate);
            if (deadline <= threeDaysFromNow && deadline > now) {
              const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
              
              notifications.push({
                id: `deadline-${order.id}-${Date.now()}`,
                type: 'order_deadline',
                title: 'Đơn hàng sắp đến hạn',
                message: `Đơn hàng #${order.orderNumber} sẽ đến hạn trong ${daysLeft} ngày`,
                priority: daysLeft <= 1 ? 'urgent' : daysLeft <= 2 ? 'high' : 'medium',
                relatedId: order.id,
                relatedType: 'order',
                read: false,
                actionRequired: true,
                createdAt: new Date().toISOString(),
                metadata: {
                  orderNumber: order.orderNumber,
                  deadline: order.deliveryDate,
                  daysLeft
                }
              });
            }
          }
        });

        return notifications;
      }
    });

    // Rule 2: Payment overdue
    this.addRule({
      type: 'payment_overdue',
      frequency: 'daily',
      condition: () => true,
      generate: () => {
        const notifications: SmartNotification[] = [];
        const now = new Date();

        payments.forEach(payment => {
          if (payment.status === 'pending') {
            // Mock due date logic - assume 30 days from creation
            const createdDate = new Date(payment.createdAt);
            const dueDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            if (dueDate < now) {
              const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
              
              notifications.push({
                id: `overdue-${payment.id}-${Date.now()}`,
                type: 'payment_overdue',
                title: 'Thanh toán quá hạn',
                message: `Thanh toán #${payment.orderNumber} đã quá hạn ${daysOverdue} ngày`,
                priority: daysOverdue > 7 ? 'urgent' : daysOverdue > 3 ? 'high' : 'medium',
                relatedId: payment.id,
                relatedType: 'payment',
                read: false,
                actionRequired: true,
                createdAt: new Date().toISOString(),
                metadata: {
                  paymentAmount: payment.amount,
                  dueDate: dueDate.toISOString(),
                  daysOverdue
                }
              });
            }
          }
        });

        return notifications;
      }
    });

    // Rule 3: Low stock materials
    this.addRule({
      type: 'low_stock',
      frequency: 'daily',
      condition: () => true,
      generate: () => {
        const notifications: SmartNotification[] = [];

        mockMaterials.forEach(material => {
          if (material.currentStock <= material.minStock) {
            const shortagePercentage = Math.round(
              ((material.minStock - material.currentStock) / material.minStock) * 100
            );

            notifications.push({
              id: `stock-${material.id}-${Date.now()}`,
              type: 'low_stock',
              title: 'Nguyên liệu sắp hết',
              message: `${material.name} chỉ còn ${material.currentStock} ${material.unit} (tối thiểu: ${material.minStock})`,
              priority: material.currentStock === 0 ? 'urgent' : 
                       material.currentStock < material.minStock * 0.5 ? 'high' : 'medium',
              relatedId: material.id,
              relatedType: 'material',
              read: false,
              actionRequired: true,
              createdAt: new Date().toISOString(),
              metadata: {
                materialName: material.name,
                currentStock: material.currentStock,
                minimumStock: material.minStock,
                shortagePercentage
              }
            });
          }
        });

        return notifications;
      }
    });

    // Rule 4: Material shortage for production
    this.addRule({
      type: 'material_shortage',
      frequency: 'realtime',
      condition: () => true,
      generate: () => {
        // This would be triggered when production calculates material requirements
        // For now, return empty array as this is triggered by external events
        return [];
      }
    });
  }

  addRule(rule: NotificationRule) {
    this.rules.push(rule);
  }

  private startPeriodicCheck() {
    // Check daily rules every hour (in production, this would be more sophisticated)
    setInterval(() => {
      this.generateNotifications();
    }, 60 * 60 * 1000); // 1 hour

    // Initial check
    this.generateNotifications();
  }

  private generateNotifications() {
    const newNotifications: SmartNotification[] = [];

    this.rules.forEach(rule => {
      if (rule.condition()) {
        const generated = rule.generate();
        newNotifications.push(...generated);
      }
    });

    // Remove duplicates and old notifications
    this.cleanupNotifications();
    
    // Add new notifications
    newNotifications.forEach(notification => {
      // Check if similar notification already exists
      const exists = this.notifications.some(existing => 
        existing.type === notification.type &&
        existing.relatedId === notification.relatedId &&
        !existing.read
      );

      if (!exists) {
        this.notifications.unshift(notification);
      }
    });

    // Notify subscribers
    this.notifySubscribers();
  }

  private cleanupNotifications() {
    const now = new Date();
    
    // Remove expired notifications
    this.notifications = this.notifications.filter(notification => {
      if (notification.expiresAt) {
        return new Date(notification.expiresAt) > now;
      }
      return true;
    });

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
  }

  // Public API
  getNotifications(): SmartNotification[] {
    return this.notifications;
  }

  getUnreadNotifications(): SmartNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  getNotificationsByType(type: SmartNotification['type']): SmartNotification[] {
    return this.notifications.filter(n => n.type === type);
  }

  getNotificationsByPriority(priority: SmartNotification['priority']): SmartNotification[] {
    return this.notifications.filter(n => n.priority === priority);
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
  }

  // Manually trigger specific notification types
  triggerMaterialShortageNotification(materialId: string, shortage: number, requiredAmount: number): void {
    const material = mockMaterials.find(m => m.id === materialId);
    if (!material) return;

    const notification: SmartNotification = {
      id: `shortage-${materialId}-${Date.now()}`,
      type: 'material_shortage',
      title: 'Thiếu nguyên liệu sản xuất',
      message: `Không đủ ${material.name} để sản xuất. Thiếu ${shortage} ${material.unit}`,
      priority: 'high',
      relatedId: materialId,
      relatedType: 'material',
      read: false,
      actionRequired: true,
      createdAt: new Date().toISOString(),
      metadata: {
        materialName: material.name,
        shortage,
        requiredAmount,
        currentStock: material.currentStock
      }
    };

    this.notifications.unshift(notification);
    this.notifySubscribers();
  }

  triggerStatusChangeNotification(
    entityType: 'order' | 'production' | 'payment',
    entityId: string,
    oldStatus: string,
    newStatus: string
  ): void {
    const notification: SmartNotification = {
      id: `status-${entityType}-${entityId}-${Date.now()}`,
      type: 'status_change',
      title: 'Thay đổi trạng thái',
      message: `${entityType} #${entityId} đã chuyển từ "${oldStatus}" sang "${newStatus}"`,
      priority: 'medium',
      relatedId: entityId,
      relatedType: entityType,
      read: false,
      actionRequired: false,
      createdAt: new Date().toISOString(),
      metadata: {
        entityType,
        oldStatus,
        newStatus
      }
    };

    this.notifications.unshift(notification);
    this.notifySubscribers();
  }

  // Subscription management
  subscribe(callback: (notifications: SmartNotification[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.notifications);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Statistics
  getNotificationStats(): {
    total: number;
    unread: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  } {
    const unread = this.getUnreadNotifications();
    
    const byPriority = this.notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = this.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.notifications.length,
      unread: unread.length,
      byPriority,
      byType
    };
  }
}

// Singleton instance
export const smartNotificationService = new SmartNotificationService();

// React hook for notifications
import { useState, useEffect } from 'react';

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = smartNotificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    // Initial load
    setNotifications(smartNotificationService.getNotifications());
    setUnreadCount(smartNotificationService.getUnreadNotifications().length);

    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => smartNotificationService.markAsRead(id),
    markAllAsRead: () => smartNotificationService.markAllAsRead(),
    deleteNotification: (id: string) => smartNotificationService.deleteNotification(id),
    getStats: () => smartNotificationService.getNotificationStats(),
    triggerMaterialShortage: (materialId: string, shortage: number, required: number) =>
      smartNotificationService.triggerMaterialShortageNotification(materialId, shortage, required),
    triggerStatusChange: (type: 'order' | 'production' | 'payment', id: string, oldStatus: string, newStatus: string) =>
      smartNotificationService.triggerStatusChangeNotification(type, id, oldStatus, newStatus)
  };
}

export default SmartNotificationService;