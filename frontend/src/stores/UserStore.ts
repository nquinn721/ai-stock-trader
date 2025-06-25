import { makeAutoObservable, runInAction } from "mobx";
import { apiStore } from "./ApiStore";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    trading: boolean;
    portfolio: boolean;
    news: boolean;
    recommendations: boolean;
  };
  trading: {
    defaultPortfolioId?: number;
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    riskTolerance: "conservative" | "moderate" | "aggressive";
    defaultOrderType: "market" | "limit";
    confirmations: {
      trades: boolean;
      deletions: boolean;
      largeOrders: boolean;
    };
  };
  display: {
    currency: "USD" | "EUR" | "GBP" | "JPY";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
    compactMode: boolean;
    showPaperTradingBadge: boolean;
  };
  dashboard: {
    defaultTab: "overview" | "portfolio" | "trading" | "analytics";
    widgetOrder: string[];
    hiddenWidgets: string[];
    autoLayoutSave: boolean;
  };
  alerts: {
    priceAlerts: boolean;
    portfolioAlerts: boolean;
    tradingSignals: boolean;
    newsAlerts: boolean;
    soundEnabled: boolean;
    volume: number; // 0-100
  };
}

export interface UserSettings {
  profile: UserProfile;
  preferences: UserPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "auto",
  language: "en",
  notifications: {
    email: true,
    push: true,
    trading: true,
    portfolio: true,
    news: false,
    recommendations: true,
  },
  trading: {
    autoRefresh: true,
    refreshInterval: 30,
    riskTolerance: "moderate",
    defaultOrderType: "market",
    confirmations: {
      trades: true,
      deletions: true,
      largeOrders: true,
    },
  },
  display: {
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    compactMode: false,
    showPaperTradingBadge: true,
  },
  dashboard: {
    defaultTab: "overview",
    widgetOrder: ["portfolio", "stocks", "trading", "news"],
    hiddenWidgets: [],
    autoLayoutSave: true,
  },
  alerts: {
    priceAlerts: true,
    portfolioAlerts: true,
    tradingSignals: true,
    newsAlerts: false,
    soundEnabled: true,
    volume: 50,
  },
};

export class UserStore {
  profile: UserProfile | null = null;
  preferences: UserPreferences = DEFAULT_PREFERENCES;
  isAuthenticated = false;
  isLoading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

  // Local storage keys
  private readonly PREFERENCES_KEY = "ai-trader-preferences";
  private readonly PROFILE_KEY = "ai-trader-profile";

  constructor() {
    makeAutoObservable(this);
    this.loadFromLocalStorage();
  }

  // Authentication methods
  async login(email: string, password: string): Promise<boolean> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const response = await apiStore.post<{ user: UserProfile; token: string }>("/auth/login", {
        email,
        password,
      });

      runInAction(() => {
        this.profile = response.user;
        this.isAuthenticated = true;
        this.isLoading = false;
        this.lastUpdated = new Date();
      });

      // Store token for API requests
      localStorage.setItem("auth-token", response.token);
      this.saveToLocalStorage();
      
      // Fetch user preferences after successful login
      await this.fetchPreferences();

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Login failed";
        this.isLoading = false;
      });
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiStore.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      runInAction(() => {
        this.profile = null;
        this.isAuthenticated = false;
        this.preferences = DEFAULT_PREFERENCES;
        this.error = null;
      });

      // Clear stored data
      localStorage.removeItem("auth-token");
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.PROFILE_KEY);
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const response = await apiStore.post<{ user: UserProfile; token: string }>("/auth/register", userData);

      runInAction(() => {
        this.profile = response.user;
        this.isAuthenticated = true;
        this.isLoading = false;
        this.lastUpdated = new Date();
      });

      localStorage.setItem("auth-token", response.token);
      this.saveToLocalStorage();

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Registration failed";
        this.isLoading = false;
      });
      return false;
    }
  }

  // Profile methods
  async fetchProfile(): Promise<void> {
    try {
      const profile = await apiStore.get<UserProfile>("/user/profile");

      runInAction(() => {
        this.profile = profile;
        this.lastUpdated = new Date();
      });

      this.saveToLocalStorage();
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Failed to fetch profile";
      });
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const updatedProfile = await apiStore.put<UserProfile>("/user/profile", updates);

      runInAction(() => {
        this.profile = updatedProfile;
        this.lastUpdated = new Date();
      });

      this.saveToLocalStorage();
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Failed to update profile";
      });
      return false;
    }
  }

  // Preferences methods
  async fetchPreferences(): Promise<void> {
    try {
      const preferences = await apiStore.get<UserPreferences>("/user/preferences");

      runInAction(() => {
        this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
        this.lastUpdated = new Date();
      });

      this.saveToLocalStorage();
    } catch (error) {
      // If server preferences fail, use local storage
      console.warn("Failed to fetch server preferences, using local:", error);
    }
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<boolean> {
    try {
      const updatedPreferences = { ...this.preferences, ...updates };

      // Update server preferences
      await apiStore.put<UserPreferences>("/user/preferences", updatedPreferences);

      runInAction(() => {
        this.preferences = updatedPreferences;
        this.lastUpdated = new Date();
      });

      this.saveToLocalStorage();
      return true;
    } catch (error) {
      // Update locally even if server update fails
      runInAction(() => {
        this.preferences = { ...this.preferences, ...updates };
      });
      this.saveToLocalStorage();
      
      console.warn("Failed to update server preferences, saved locally:", error);
      return false;
    }
  }

  // Specific preference update methods
  setTheme(theme: "light" | "dark" | "auto"): void {
    this.updatePreferences({
      ...this.preferences,
      theme,
    });
  }

  setDefaultPortfolio(portfolioId: number): void {
    this.updatePreferences({
      ...this.preferences,
      trading: {
        ...this.preferences.trading,
        defaultPortfolioId: portfolioId,
      },
    });
  }

  toggleNotification(type: keyof UserPreferences["notifications"]): void {
    this.updatePreferences({
      ...this.preferences,
      notifications: {
        ...this.preferences.notifications,
        [type]: !this.preferences.notifications[type],
      },
    });
  }

  setRiskTolerance(riskTolerance: "conservative" | "moderate" | "aggressive"): void {
    this.updatePreferences({
      ...this.preferences,
      trading: {
        ...this.preferences.trading,
        riskTolerance,
      },
    });
  }

  setCompactMode(compactMode: boolean): void {
    this.updatePreferences({
      ...this.preferences,
      display: {
        ...this.preferences.display,
        compactMode,
      },
    });
  }

  setAutoRefresh(autoRefresh: boolean, refreshInterval?: number): void {
    this.updatePreferences({
      ...this.preferences,
      trading: {
        ...this.preferences.trading,
        autoRefresh,
        ...(refreshInterval !== undefined && { refreshInterval }),
      },
    });
  }

  // Local storage methods
  private saveToLocalStorage(): void {
    try {
      if (this.profile) {
        localStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.profile));
      }
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      // Load profile
      const profileData = localStorage.getItem(this.PROFILE_KEY);
      if (profileData) {
        this.profile = JSON.parse(profileData);
        this.isAuthenticated = !!localStorage.getItem("auth-token");
      }

      // Load preferences
      const preferencesData = localStorage.getItem(this.PREFERENCES_KEY);
      if (preferencesData) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(preferencesData) };
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      this.preferences = DEFAULT_PREFERENCES;
    }
  }

  // Utility methods
  getDisplayName(): string {
    if (!this.profile) return "Guest";
    return `${this.profile.firstName} ${this.profile.lastName}`.trim() || this.profile.email;
  }

  getInitials(): string {
    if (!this.profile) return "G";
    const firstName = this.profile.firstName?.charAt(0)?.toUpperCase() || "";
    const lastName = this.profile.lastName?.charAt(0)?.toUpperCase() || "";
    return firstName + lastName || this.profile.email.charAt(0).toUpperCase();
  }

  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  // Check authentication status
  async checkAuthStatus(): Promise<boolean> {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      this.isAuthenticated = false;
      return false;
    }

    try {
      await this.fetchProfile();
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      // Token is invalid
      await this.logout();
      return false;
    }
  }
}

export const userStore = new UserStore();