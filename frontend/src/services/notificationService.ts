import axios from 'axios';
import {
  Notification,
  NotificationFilter,
  NotificationPreference,
  CreateNotificationRequest,
  NotificationType,
  TradingOpportunityAlert,
  PatternAlert,
  TechnicalAlert,
  RiskManagementAlert,
  MarketEventAlert,
  MultiTimeframeAlert,
} from '../types/notification.types';

const API_BASE_URL = 'http://localhost:8000';

class NotificationService {
  private baseURL = `${API_BASE_URL}/notifications`;

  // === Core Notification Management ===

  async createNotification(notification: CreateNotificationRequest): Promise<Notification> {
    try {
      const response = await axios.post(this.baseURL, notification);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async getNotifications(filter: NotificationFilter = {}): Promise<{ notifications: Notification[]; total: number; pagination: any }> {
    try {
      const params = new URLSearchParams();
      
      if (filter.userId) params.append('userId', filter.userId);
      if (filter.type) params.append('type', filter.type);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.symbol) params.append('symbol', filter.symbol);
      if (filter.portfolioId) params.append('portfolioId', filter.portfolioId.toString());
      if (filter.status) params.append('status', filter.status);
      if (filter.fromDate) params.append('fromDate', filter.fromDate.toISOString());
      if (filter.toDate) params.append('toDate', filter.toDate.toISOString());
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.offset) params.append('offset', filter.offset.toString());

      const response = await axios.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseURL}/unread-count/${userId}`);
      return response.data.data.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: number, userId: string): Promise<boolean> {
    try {
      const response = await axios.patch(`${this.baseURL}/${notificationId}/read`, { userId });
      return response.data.success;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return false;
    }
  }

  async markAsDismissed(notificationId: number, userId: string): Promise<boolean> {
    try {
      const response = await axios.patch(`${this.baseURL}/${notificationId}/dismiss`, { userId });
      return response.data.success;
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      return false;
    }
  }

  async bulkMarkAsRead(notificationIds: number[], userId: string): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await axios.post(`${this.baseURL}/bulk/mark-read`, {
        userId,
        notificationIds,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
      return { successful: 0, failed: notificationIds.length, total: notificationIds.length };
    }
  }

  async bulkDismiss(notificationIds: number[], userId: string): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await axios.post(`${this.baseURL}/bulk/dismiss`, {
        userId,
        notificationIds,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to bulk dismiss:', error);
      return { successful: 0, failed: notificationIds.length, total: notificationIds.length };
    }
  }

  // === Preference Management ===

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const response = await axios.get(`${this.baseURL}/preferences/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return [];
    }
  }

  async updatePreference(
    userId: string,
    type: NotificationType,
    preference: Partial<NotificationPreference>
  ): Promise<boolean> {
    try {
      const response = await axios.patch(`${this.baseURL}/preferences/${userId}/${type}`, preference);
      return response.data.success;
    } catch (error) {
      console.error('Failed to update preference:', error);
      return false;
    }
  }

  // === Alert Creation ===

  async createTradingOpportunityAlert(userId: string, alert: TradingOpportunityAlert): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/trading-opportunity`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create trading opportunity alert:', error);
      return null;
    }
  }

  async createPatternAlert(userId: string, alert: PatternAlert): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/pattern`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create pattern alert:', error);
      return null;
    }
  }

  async createTechnicalAlert(userId: string, alert: TechnicalAlert): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/technical`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create technical alert:', error);
      return null;
    }
  }

  async createRiskManagementAlert(userId: string, alert: RiskManagementAlert): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/risk-management`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create risk management alert:', error);
      return null;
    }
  }

  async createMarketEventAlert(userId: string, alert: MarketEventAlert): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/market-event`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create market event alert:', error);
      return null;
    }
  }

  async createMultiTimeframeAlert(userId: string, alert: MultiTimeframeAlert): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/multi-timeframe`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create multi-timeframe alert:', error);
      return null;
    }
  }

  // === Utility Methods ===

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data.success;
    } catch (error) {
      console.error('Notification service health check failed:', error);
      return false;
    }
  }

  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const response = await axios.post(`${this.baseURL}/cleanup`, { daysOld });
      return response.data.data.cleaned;
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
      return 0;
    }
  }

  // === Helper Methods ===

  formatNotificationTime(date: Date | string): string {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return '#ff4444';
      case 'high':
        return '#ff8800';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚡';
      case 'medium':
        return '📊';
      case 'low':
        return '💡';
      default:
        return '📢';
    }
  }

  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.TRADING_OPPORTUNITY:
        return '💰';
      case NotificationType.PATTERN_ALERT:
        return '📈';
      case NotificationType.TECHNICAL_ALERT:
        return '🔍';
      case NotificationType.RISK_MANAGEMENT:
        return '⚠️';
      case NotificationType.MARKET_EVENT:
        return '📰';
      case NotificationType.MULTI_TIMEFRAME:
        return '⏰';
      case NotificationType.ORDER_EVENT:
        return '📋';
      case NotificationType.PORTFOLIO_UPDATE:
        return '💼';
      default:
        return '📢';
    }
  }

  shouldShowNotification(notification: Notification): boolean {
    // Check if notification is expired
    if (notification.expiresAt && new Date() > new Date(notification.expiresAt)) {
      return false;
    }

    // Check if notification is dismissed
    if (notification.status === 'dismissed') {
      return false;
    }

    return true;
  }

  sortNotificationsByPriority(notifications: Notification[]): Notification[] {
    const priorityOrder = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1,
    };

    return notifications.sort((a, b) => {
      // First sort by priority
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by created date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
