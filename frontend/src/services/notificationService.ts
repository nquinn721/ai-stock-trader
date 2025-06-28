import axios from "axios";
import { FRONTEND_API_CONFIG } from "../config/api.config";
import {
  CreateNotificationRequest,
  MarketEventAlert,
  MultiTimeframeAlert,
  Notification,
  NotificationFilter,
  NotificationPreference,
  NotificationType,
  PatternAlert,
  RiskManagementAlert,
  TechnicalAlert,
  TradingOpportunityAlert,
} from "../types/notification.types";

const API_BASE_URL = FRONTEND_API_CONFIG.backend.baseUrl;

class NotificationService {
  private baseURL = `${API_BASE_URL}/notifications`;

  // === Core Notification Management ===

  async createNotification(
    notification: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      const response = await axios.post(this.baseURL, notification);
      return response.data.data;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  async getNotifications(filter: NotificationFilter = {}): Promise<{
    notifications: Notification[];
    total: number;
    pagination: any;
  }> {
    try {
      const params = new URLSearchParams();

      if (filter.userId) params.append("userId", filter.userId);
      if (filter.type) params.append("type", filter.type);
      if (filter.priority) params.append("priority", filter.priority);
      if (filter.symbol) params.append("symbol", filter.symbol);
      if (filter.portfolioId)
        params.append("portfolioId", filter.portfolioId.toString());
      if (filter.status) params.append("status", filter.status);
      if (filter.fromDate)
        params.append("fromDate", filter.fromDate.toISOString());
      if (filter.toDate) params.append("toDate", filter.toDate.toISOString());
      if (filter.limit) params.append("limit", filter.limit.toString());
      if (filter.offset) params.append("offset", filter.offset.toString());
      const response = await axios.get(`${this.baseURL}?${params.toString()}`);

      // Handle the structured response from backend
      const backendResponse = response.data;
      return {
        notifications: Array.isArray(backendResponse.data)
          ? backendResponse.data
          : [],
        total: backendResponse.total || 0,
        pagination: backendResponse.pagination || {},
      };
    } catch (error) {
      console.error("Failed to get notifications:", error);
      // Return safe defaults to prevent iteration errors
      return {
        notifications: [],
        total: 0,
        pagination: {},
      };
    }
  }
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseURL}/unread-count/${userId}`
      );
      // Handle backend response structure
      return response.data?.data?.count || 0;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  async markAsRead(notificationId: number, userId: string): Promise<boolean> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/${notificationId}/read`,
        { userId }
      );
      return response.data.success;
    } catch (error) {
      console.error("Failed to mark as read:", error);
      return false;
    }
  }

  async markAsDismissed(
    notificationId: number,
    userId: string
  ): Promise<boolean> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/${notificationId}/dismiss`,
        { userId }
      );
      return response.data.success;
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
      return false;
    }
  }

  async bulkMarkAsRead(
    notificationIds: number[],
    userId: string
  ): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await axios.post(`${this.baseURL}/bulk/mark-read`, {
        userId,
        notificationIds,
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to bulk mark as read:", error);
      return {
        successful: 0,
        failed: notificationIds.length,
        total: notificationIds.length,
      };
    }
  }

  async bulkDismiss(
    notificationIds: number[],
    userId: string
  ): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await axios.post(`${this.baseURL}/bulk/dismiss`, {
        userId,
        notificationIds,
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to bulk dismiss:", error);
      return {
        successful: 0,
        failed: notificationIds.length,
        total: notificationIds.length,
      };
    }
  }

  // === Preference Management ===

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const response = await axios.get(`${this.baseURL}/preferences/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      return [];
    }
  }

  async updatePreference(
    userId: string,
    type: NotificationType,
    preference: Partial<NotificationPreference>
  ): Promise<boolean> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/preferences/${userId}/${type}`,
        preference
      );
      return response.data.success;
    } catch (error) {
      console.error("Failed to update preference:", error);
      return false;
    }
  }

  // === Alert Creation ===

  async createTradingOpportunityAlert(
    userId: string,
    alert: TradingOpportunityAlert
  ): Promise<Notification | null> {
    try {
      const response = await axios.post(
        `${this.baseURL}/alerts/trading-opportunity`,
        {
          userId,
          alert,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to create trading opportunity alert:", error);
      return null;
    }
  }

  async createPatternAlert(
    userId: string,
    alert: PatternAlert
  ): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/pattern`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to create pattern alert:", error);
      return null;
    }
  }

  async createTechnicalAlert(
    userId: string,
    alert: TechnicalAlert
  ): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/technical`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to create technical alert:", error);
      return null;
    }
  }

  async createRiskManagementAlert(
    userId: string,
    alert: RiskManagementAlert
  ): Promise<Notification | null> {
    try {
      const response = await axios.post(
        `${this.baseURL}/alerts/risk-management`,
        {
          userId,
          alert,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to create risk management alert:", error);
      return null;
    }
  }

  async createMarketEventAlert(
    userId: string,
    alert: MarketEventAlert
  ): Promise<Notification | null> {
    try {
      const response = await axios.post(`${this.baseURL}/alerts/market-event`, {
        userId,
        alert,
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to create market event alert:", error);
      return null;
    }
  }

  async createMultiTimeframeAlert(
    userId: string,
    alert: MultiTimeframeAlert
  ): Promise<Notification | null> {
    try {
      const response = await axios.post(
        `${this.baseURL}/alerts/multi-timeframe`,
        {
          userId,
          alert,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to create multi-timeframe alert:", error);
      return null;
    }
  }

  // === S30: Notification History and Management ===

  /**
   * Get notification analytics for a user
   */
  async getNotificationAnalytics(userId: string): Promise<{
    summary: {
      total: number;
      unread: number;
      recent: number;
      readRate: string;
    };
    byType: Array<{ type: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/analytics`, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get notification analytics:", error);
      throw error;
    }
  }

  /**
   * Get notification history with filtering and pagination
   */
  async getNotificationHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: NotificationType;
      priority?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      tags?: string[];
    }
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append("userId", userId);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (filters?.type) params.append("type", filters.type);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.dateFrom)
        params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters?.dateTo)
        params.append("dateTo", filters.dateTo.toISOString());
      if (filters?.tags)
        filters.tags.forEach((tag) => params.append("tags", tag));

      const response = await axios.get(`${this.baseURL}/history`, { params });
      return response.data;
    } catch (error) {
      console.error("Failed to get notification history:", error);
      throw error;
    }
  }

  /**
   * Search notifications by content or metadata
   */
  async searchNotifications(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append("userId", userId);
      params.append("query", query);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await axios.get(`${this.baseURL}/search`, { params });
      return response.data;
    } catch (error) {
      console.error("Failed to search notifications:", error);
      throw error;
    }
  }

  /**
   * Bulk delete notifications
   */
  async bulkDeleteNotifications(
    userId: string,
    notificationIds: string[]
  ): Promise<{ deleted: number }> {
    try {
      const response = await axios.delete(`${this.baseURL}/bulk/delete`, {
        data: { userId, notificationIds },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to bulk delete notifications:", error);
      throw error;
    }
  }

  /**
   * Bulk archive notifications (mark as dismissed)
   */
  async bulkArchiveNotifications(
    userId: string,
    notificationIds: string[]
  ): Promise<{ archived: number }> {
    try {
      const response = await axios.post(`${this.baseURL}/bulk/archive`, {
        userId,
        notificationIds,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to bulk archive notifications:", error);
      throw error;
    }
  }

  /**
   * Export notifications to various formats
   */
  async exportNotifications(
    userId: string,
    format: "json" | "csv" = "json",
    filters?: {
      type?: NotificationType;
      priority?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ data: any; filename: string; contentType: string }> {
    try {
      const params = new URLSearchParams();
      params.append("userId", userId);
      params.append("format", format);

      if (filters?.type) params.append("type", filters.type);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.dateFrom)
        params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters?.dateTo)
        params.append("dateTo", filters.dateTo.toISOString());

      const response = await axios.get(`${this.baseURL}/export`, {
        params,
        responseType: "blob", // Handle file downloads
      });

      return {
        data: response.data,
        filename:
          response.headers["content-disposition"]?.split("filename=")[1] ||
          `notifications.${format}`,
        contentType:
          response.headers["content-type"] ||
          (format === "csv" ? "text/csv" : "application/json"),
      };
    } catch (error) {
      console.error("Failed to export notifications:", error);
      throw error;
    }
  }

  /**
   * Add tags to a notification
   */
  async addTagsToNotification(
    userId: string,
    notificationId: string,
    tags: string[]
  ): Promise<Notification> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${notificationId}/tags`,
        {
          userId,
          tags,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add tags to notification:", error);
      throw error;
    }
  }

  /**
   * Download exported file helper
   */
  downloadFile(data: Blob, filename: string, contentType: string): void {
    const blob = new Blob([data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // === Utility Methods ===

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data.success;
    } catch (error) {
      console.error("Notification service health check failed:", error);
      return false;
    }
  }

  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const response = await axios.post(`${this.baseURL}/cleanup`, { daysOld });
      return response.data.data.cleaned;
    } catch (error) {
      console.error("Failed to cleanup old notifications:", error);
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
      return "Just now";
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
      case "critical":
        return "#ff4444";
      case "high":
        return "#ff8800";
      case "medium":
        return "#3b82f6";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case "critical":
        return "🚨";
      case "high":
        return "⚡";
      case "medium":
        return "📊";
      case "low":
        return "💡";
      default:
        return "📢";
    }
  }

  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.TRADING_OPPORTUNITY:
        return "💰";
      case NotificationType.PATTERN_ALERT:
        return "📈";
      case NotificationType.TECHNICAL_ALERT:
        return "🔍";
      case NotificationType.RISK_MANAGEMENT:
        return "⚠️";
      case NotificationType.MARKET_EVENT:
        return "📰";
      case NotificationType.MULTI_TIMEFRAME:
        return "⏰";
      case NotificationType.ORDER_EVENT:
        return "📋";
      case NotificationType.PORTFOLIO_UPDATE:
        return "💼";
      default:
        return "📢";
    }
  }

  shouldShowNotification(notification: Notification): boolean {
    // Check if notification is expired
    if (
      notification.expiresAt &&
      new Date() > new Date(notification.expiresAt)
    ) {
      return false;
    }

    // Check if notification is dismissed
    if (notification.status === "dismissed") {
      return false;
    }

    return true;
  }

  sortNotificationsByPriority(notifications: Notification[]): Notification[] {
    const priorityOrder = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return notifications.sort((a, b) => {
      // First sort by priority
      const priorityDiff =
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by created date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
