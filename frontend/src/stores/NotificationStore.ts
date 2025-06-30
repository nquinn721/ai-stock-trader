import { makeAutoObservable, runInAction } from "mobx";
import {
  CreateNotificationRequest,
  MarketEventAlert,
  MultiTimeframeAlert,
  Notification,
  NotificationFilter,
  NotificationPreference,
  PatternAlert,
  RiskManagementAlert,
  TechnicalAlert,
  TradingOpportunityAlert,
} from "../types/notification.types";
import { apiStore } from "./ApiStore";

export class NotificationStore {
  notifications: Notification[] = [];
  unreadCount = 0;
  userPreferences: NotificationPreference | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // === Core Notification Management ===

  async createNotification(
    notification: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<Notification>(
        "/api/notifications",
        notification
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create notification", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async getNotifications(filter: NotificationFilter = {}): Promise<{
    notifications: Notification[];
    total: number;
    pagination: any;
  }> {
    try {
      this.setLoading(true);
      const params = new URLSearchParams();

      if (filter.userId) params.append("userId", filter.userId);
      if (filter.limit) params.append("limit", filter.limit.toString());
      if (filter.offset) params.append("offset", filter.offset.toString());
      if (filter.type) params.append("type", filter.type);
      if (filter.priority) params.append("priority", filter.priority);

      const response = await apiStore.get<{
        notifications: Notification[];
        total: number;
        pagination: any;
      }>(`/api/notifications?${params}`);

      runInAction(() => {
        this.notifications = response.notifications;
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get notifications", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await apiStore.get<{ count: number }>(
        `/api/notifications/unread-count/${userId}`
      );
      runInAction(() => {
        this.unreadCount = response.count;
      });
      return response.count;
    } catch (error) {
      this.handleError("Failed to get unread count", error);
      throw error;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await apiStore.patch(`/api/notifications/${notificationId}/read`);
      runInAction(() => {
        const notification = this.notifications.find(
          (n) => n.id === notificationId
        );
        if (notification && "isRead" in notification) {
          (notification as any).isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    } catch (error) {
      this.handleError("Failed to mark notification as read", error);
      throw error;
    }
  }

  async markAsUnread(notificationId: number): Promise<void> {
    try {
      await apiStore.patch(`/api/notifications/${notificationId}/unread`);
      runInAction(() => {
        const notification = this.notifications.find(
          (n) => n.id === notificationId
        );
        if (notification && "isRead" in notification) {
          (notification as any).isRead = false;
          this.unreadCount += 1;
        }
      });
    } catch (error) {
      this.handleError("Failed to mark notification as unread", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await apiStore.post("/api/notifications/bulk/mark-read", {
        userId,
      });
      runInAction(() => {
        this.notifications.forEach((n) => {
          if ("isRead" in n) {
            (n as any).isRead = true;
          }
        });
        this.unreadCount = 0;
      });
    } catch (error) {
      this.handleError("Failed to mark all as read", error);
      throw error;
    }
  }

  async dismissAllNotifications(userId: string): Promise<void> {
    try {
      await apiStore.post("/api/notifications/bulk/dismiss", {
        userId,
      });
      runInAction(() => {
        this.notifications = [];
        this.unreadCount = 0;
      });
    } catch (error) {
      this.handleError("Failed to dismiss all notifications", error);
      throw error;
    }
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    try {
      const response = await apiStore.get<NotificationPreference>(
        `/api/notifications/preferences/${userId}`
      );
      runInAction(() => {
        this.userPreferences = response;
      });
      return response;
    } catch (error) {
      this.handleError("Failed to get user preferences", error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    try {
      const response = await apiStore.patch<NotificationPreference>(
        `/api/notifications/preferences/${userId}`,
        preferences
      );
      runInAction(() => {
        this.userPreferences = response;
      });
      return response;
    } catch (error) {
      this.handleError("Failed to update user preferences", error);
      throw error;
    }
  }

  // === Trading Alert Management ===

  async createTradingOpportunityAlert(
    alert: TradingOpportunityAlert
  ): Promise<Notification> {
    try {
      const response = await apiStore.post<Notification>(
        "/api/notifications/alerts/trading-opportunity",
        alert
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create trading opportunity alert", error);
      throw error;
    }
  }

  async createPatternAlert(alert: PatternAlert): Promise<Notification> {
    try {
      const response = await apiStore.post<Notification>(
        "/api/notifications/alerts/pattern",
        alert
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create pattern alert", error);
      throw error;
    }
  }

  async createTechnicalAlert(alert: TechnicalAlert): Promise<Notification> {
    try {
      const response = await apiStore.post<Notification>(
        "/api/notifications/alerts/technical",
        alert
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create technical alert", error);
      throw error;
    }
  }

  async createRiskManagementAlert(
    alert: RiskManagementAlert
  ): Promise<Notification> {
    try {
      const response = await apiStore.post<Notification>(
        "/api/notifications/alerts/risk-management",
        alert
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create risk management alert", error);
      throw error;
    }
  }

  async createMarketEventAlert(alert: MarketEventAlert): Promise<Notification> {
    try {
      const response = await apiStore.post<Notification>(
        "/api/notifications/alerts/market-event",
        alert
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create market event alert", error);
      throw error;
    }
  }

  async createMultiTimeframeAlert(
    alert: MultiTimeframeAlert
  ): Promise<Notification> {
    try {
      const response = await apiStore.post<Notification>(
        "/api/notifications/alerts/multi-timeframe",
        alert
      );
      runInAction(() => {
        this.notifications.unshift(response);
      });
      return response;
    } catch (error) {
      this.handleError("Failed to create multi-timeframe alert", error);
      throw error;
    }
  }

  // === Utility Methods ===

  private setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  private handleError(message: string, error: any) {
    console.error(message, error);
    this.error = error.response?.data?.message || error.message || message;
  }

  clearError() {
    this.error = null;
  }
}

export const notificationStore = new NotificationStore();
