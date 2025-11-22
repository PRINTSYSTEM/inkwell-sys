import { notificationService } from '@/services/notificationService';
import type {
	Notification,
	NotificationFilter,
	NotificationPreferences,
	NotificationStats,
	CreateNotificationSchema
} from '@/Schema';
import type { NotificationPriority } from '@/types/notification';

export const getNotifications = (userId: string, filter?: NotificationFilter) =>
	notificationService.getNotifications(userId, filter);

export const createNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) =>
	notificationService.createNotification(notification);

export const markAsRead = (notificationId: string) =>
	notificationService.markAsRead(notificationId);

export const markAllAsRead = (userId: string) =>
	notificationService.markAllAsRead(userId);

export const deleteNotification = (notificationId: string) =>
	notificationService.deleteNotification(notificationId);

export const getNotificationStats = (userId: string): Promise<NotificationStats> =>
	notificationService.getNotificationStats(userId);

export const getPreferences = (userId: string): Promise<NotificationPreferences> =>
	notificationService.getPreferences(userId);

export const updatePreferences = (userId: string, updates: Partial<NotificationPreferences>) =>
	notificationService.updatePreferences(userId, updates);

export const subscribe = (listener: (n: Notification) => void) =>
	notificationService.subscribe(listener);

export const sendAssignmentNotification = (
	userId: string,
	assignmentTitle: string,
	assignmentId: string,
	type: 'created' | 'updated' | 'due_soon' | 'overdue'
) => notificationService.sendAssignmentNotification(userId, assignmentTitle, assignmentId, type);

export const sendPerformanceNotification = (
	userId: string,
	performanceData: { target?: string; achievement?: number },
	type: 'review_due' | 'target_achieved' | 'improvement_needed'
) => notificationService.sendPerformanceNotification(userId, performanceData, type);

export const sendSystemNotification = (
	userIds: string[],
	title: string,
	message: string,
	priority: NotificationPriority = 'medium'
) => notificationService.sendSystemNotification(userIds, title, message, priority);

export default {
	getNotifications,
	createNotification,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	getNotificationStats,
	getPreferences,
	updatePreferences,
	subscribe,
	sendAssignmentNotification,
	sendPerformanceNotification,
	sendSystemNotification,
};
