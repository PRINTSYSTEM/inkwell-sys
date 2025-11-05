import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { 
  Notification, 
  NotificationFilter, 
  NotificationStats,
  NotificationPreferences 
} from '@/types/notification';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadNotifications: (filter?: NotificationFilter) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
  
  // Real-time
  subscribe: () => (() => void) | undefined;
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (filter?: NotificationFilter) => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await notificationService.getNotifications(userId, filter);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const statsData = await notificationService.getNotificationStats(userId);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [userId]);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      const prefsData = await notificationService.getPreferences(userId);
      setPreferences(prefsData);
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Refresh stats
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      console.error('Error marking as read:', err);
    }
  }, [loadStats]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(userId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
      
      // Refresh stats
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
      console.error('Error marking all as read:', err);
    }
  }, [userId, loadStats]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state optimistically
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Refresh stats
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      console.error('Error deleting notification:', err);
    }
  }, [notifications, loadStats]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      const updatedPrefs = await notificationService.updatePreferences(userId, updates);
      setPreferences(updatedPrefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      console.error('Error updating preferences:', err);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadStats(),
      loadPreferences()
    ]);
  }, [loadNotifications, loadStats, loadPreferences]);

  const subscribe = useCallback(() => {
    if (!userId) return;
    
    return notificationService.subscribe((newNotification) => {
      if (newNotification.userId === userId) {
        // Add new notification to the list
        setNotifications(prev => [newNotification, ...prev]);
        
        // Update unread count if it's unread
        if (!newNotification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Refresh stats
        loadStats();
      }
    });
  }, [userId, loadStats]);

  // Initial load
  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  return {
    notifications,
    unreadCount,
    stats,
    preferences,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refresh,
    subscribe
  };
}

// Hook for getting unread notifications count only (lightweight)
export function useUnreadNotificationsCount(userId: string): {
  unreadCount: number;
  isLoading: boolean;
} {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const loadUnreadCount = async () => {
      try {
        const notifications = await notificationService.getNotifications(userId, { isRead: false });
        if (mounted) {
          setUnreadCount(notifications.length);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadUnreadCount();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribe((newNotification) => {
      if (mounted && newNotification.userId === userId && !newNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [userId]);

  return { unreadCount, isLoading };
}

export default useNotifications;