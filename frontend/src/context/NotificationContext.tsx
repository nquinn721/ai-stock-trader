import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { notificationService } from '../services/notificationService';
import {
  type Notification,
  NotificationFilter,
  NotificationWebSocketEvent,
  NotificationPreference,
  NotificationType,
  NotificationStatus,
} from '../types/notification.types';

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreference[];
  
  // Actions
  getNotifications: (filter?: NotificationFilter) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAsDismissed: (notificationId: number) => Promise<void>;
  bulkMarkAsRead: (notificationIds: number[]) => Promise<void>;
  bulkDismiss: (notificationIds: number[]) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreference: (type: NotificationType, preference: Partial<NotificationPreference>) => Promise<void>;
  
  // WebSocket
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  
  // Utility
  clearAll: () => void;
  filterNotifications: (filter: Partial<NotificationFilter>) => Notification[];
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  preferences: [],
  getNotifications: async () => {},
  markAsRead: async () => {},
  markAsDismissed: async () => {},
  bulkMarkAsRead: async () => {},
  bulkDismiss: async () => {},
  refreshUnreadCount: async () => {},
  loadPreferences: async () => {},
  updatePreference: async () => {},
  subscribeToNotifications: () => {},
  unsubscribeFromNotifications: () => {},
  clearAll: () => {},
  filterNotifications: () => [],
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  userId = 'default_user' 
}) => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // === WebSocket Event Handlers ===

  const handleNotificationEvent = useCallback((event: NotificationWebSocketEvent) => {
    console.log('📢 Notification event received:', event.type, event.data);

    switch (event.type) {
      case 'new_notification':
        setNotifications(prev => {
          const newNotification = event.data;
          // Check if notification already exists
          if (prev.find(n => n.id === newNotification.id)) {
            return prev;
          }
          return [newNotification, ...prev];
        });
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if supported
        showBrowserNotification(event.data);
        break;

      case 'bulk_notifications':
        setNotifications(prev => {
          const newNotifications = event.data;
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifications.filter((n: Notification) => !existingIds.has(n.id));
          return [...uniqueNew, ...prev];
        });
        setUnreadCount(prev => prev + event.data.length);
        break;

      case 'status_update':
        const { notificationId, status } = event.data;
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, status, readAt: status === 'read' ? new Date() : n.readAt }
              : n
          )
        );
        
        if (status === 'read') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        break;

      case 'unread_count_update':
        setUnreadCount(event.data.count);
        break;

      case 'system_alert':
        // Handle system-wide alerts (high priority)
        const systemAlert = event.data;
        setNotifications(prev => [systemAlert, ...prev]);
        showBrowserNotification(systemAlert, true);
        break;

      default:
        console.warn('Unknown notification event type:', event.type);
    }
  }, []);

  // === WebSocket Subscription ===

  const subscribeToNotifications = useCallback(() => {
    if (socket && isConnected && !isSubscribed) {
      console.log(`📢 Subscribing to notifications for user: ${userId}`);
      socket.emit('subscribe_notifications', { userId });
      setIsSubscribed(true);
    }
  }, [socket, isConnected, userId, isSubscribed]);

  const unsubscribeFromNotifications = useCallback(() => {
    if (socket && isSubscribed) {
      console.log(`📢 Unsubscribing from notifications for user: ${userId}`);
      socket.emit('unsubscribe_notifications');
      setIsSubscribed(false);
    }
  }, [socket, userId, isSubscribed]);

  // === API Actions ===

  const getNotifications = useCallback(async (filter: NotificationFilter = {}) => {
    try {
      setIsLoading(true);
      const result = await notificationService.getNotifications({
        ...filter,
        userId,
        limit: filter.limit || 50,
        offset: filter.offset || 0,
      });
      
      if (filter.offset === 0) {
        // Replace notifications for new search
        setNotifications(result.notifications);
      } else {
        // Append for pagination
        setNotifications(prev => [...prev, ...result.notifications]);
      }
    } catch (error) {
      console.error('Failed to get notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const success = await notificationService.markAsRead(notificationId, userId);
      if (success) {        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, status: NotificationStatus.READ, readAt: new Date() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [userId]);

  const markAsDismissed = useCallback(async (notificationId: number) => {
    try {
      const success = await notificationService.markAsDismissed(notificationId, userId);
      if (success) {        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, status: NotificationStatus.DISMISSED, dismissedAt: new Date() }
              : n
          )
        );
        // Also reduce unread count if it was unread
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && notification.status === 'sent') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, [userId, notifications]);

  const bulkMarkAsRead = useCallback(async (notificationIds: number[]) => {
    try {
      const result = await notificationService.bulkMarkAsRead(notificationIds, userId);
      if (result.successful > 0) {        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id)
              ? { ...n, status: NotificationStatus.READ, readAt: new Date() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - result.successful));
      }
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
    }
  }, [userId]);

  const bulkDismiss = useCallback(async (notificationIds: number[]) => {
    try {
      const result = await notificationService.bulkDismiss(notificationIds, userId);
      if (result.successful > 0) {        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id)
              ? { ...n, status: NotificationStatus.DISMISSED, dismissedAt: new Date() }
              : n
          )
        );
        
        // Count how many were unread
        const unreadCount = notifications.filter(n => 
          notificationIds.includes(n.id) && n.status === 'sent'
        ).length;
        setUnreadCount(prev => Math.max(0, prev - unreadCount));
      }
    } catch (error) {
      console.error('Failed to bulk dismiss:', error);
    }
  }, [userId, notifications]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, [userId]);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await notificationService.getUserPreferences(userId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, [userId]);

  const updatePreference = useCallback(async (
    type: NotificationType,
    preference: Partial<NotificationPreference>
  ) => {
    try {
      const success = await notificationService.updatePreference(userId, type, preference);
      if (success) {
        setPreferences(prev => {
          const existing = prev.find(p => p.type === type);
          if (existing) {
            return prev.map(p => p.type === type ? { ...p, ...preference } : p);
          } else {
            return [...prev, { userId, type, ...preference } as NotificationPreference];
          }
        });
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  }, [userId]);

  // === Utility Functions ===

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const filterNotifications = useCallback((filter: Partial<NotificationFilter>) => {
    return notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) return false;
      if (filter.priority && notification.priority !== filter.priority) return false;
      if (filter.symbol && notification.symbol !== filter.symbol) return false;
      if (filter.portfolioId && notification.portfolioId !== filter.portfolioId) return false;
      if (filter.status && notification.status !== filter.status) return false;
      
      if (filter.fromDate && new Date(notification.createdAt) < filter.fromDate) return false;
      if (filter.toDate && new Date(notification.createdAt) > filter.toDate) return false;

      return true;
    });
  }, [notifications]);

  // === Browser Notifications ===

  const showBrowserNotification = useCallback((notification: Notification, isSystemAlert = false) => {
    // Check if browser notifications are supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: notification.message,
        icon: `/icons/notification-${notification.type}.png`,
        badge: '/icons/notification-badge.png',
        tag: notification.id.toString(),
        requireInteraction: isSystemAlert || notification.priority === 'critical',
        silent: notification.priority === 'low',
        data: {
          notificationId: notification.id,
          symbol: notification.symbol,
          portfolioId: notification.portfolioId,
        },
      };

      const browserNotification = new Notification(notification.title, options);

      browserNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto-close after 10 seconds for non-critical notifications
      if (!isSystemAlert && notification.priority !== 'critical') {
        setTimeout(() => browserNotification.close(), 10000);
      }
    }
  }, [markAsRead]);

  // === Effects ===

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set up WebSocket listeners
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('notification', handleNotificationEvent);
      socket.on('notifications_bulk', handleNotificationEvent);
      socket.on('notification_status', handleNotificationEvent);
      socket.on('unread_count', handleNotificationEvent);
      socket.on('system_alert', handleNotificationEvent);

      return () => {
        socket.off('notification', handleNotificationEvent);
        socket.off('notifications_bulk', handleNotificationEvent);
        socket.off('notification_status', handleNotificationEvent);
        socket.off('unread_count', handleNotificationEvent);
        socket.off('system_alert', handleNotificationEvent);
      };
    }
  }, [socket, isConnected, handleNotificationEvent]);

  // Auto-subscribe when connected
  useEffect(() => {
    if (isConnected && !isSubscribed) {
      subscribeToNotifications();
    }
  }, [isConnected, isSubscribed, subscribeToNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSubscribed) {
        unsubscribeFromNotifications();
      }
    };
  }, [isSubscribed, unsubscribeFromNotifications]);

  // Load initial data
  useEffect(() => {
    getNotifications();
    refreshUnreadCount();
    loadPreferences();
  }, [getNotifications, refreshUnreadCount, loadPreferences]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    getNotifications,
    markAsRead,
    markAsDismissed,
    bulkMarkAsRead,
    bulkDismiss,
    refreshUnreadCount,
    loadPreferences,
    updatePreference,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    clearAll,
    filterNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
