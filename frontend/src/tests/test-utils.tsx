import { render, RenderOptions } from "@testing-library/react";
import React, { ReactElement } from "react";
import { NotificationProvider } from "../context/NotificationContext";
import { SocketProvider } from "../context/SocketContext";
import { RootStore } from "../stores/RootStore";
import { StoreProvider } from "../stores/StoreContext";

// Mock FontAwesome icons
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => {
    const iconName =
      typeof icon === "string"
        ? icon
        : typeof icon === "object" && icon.iconName
        ? icon.iconName
        : "mock-icon";
    return <i data-testid={`fa-icon-${iconName}`} {...props} />;
  },
}));

// Mock the NotificationContext
jest.mock("../context/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useNotification: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    preferences: [],
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAsDismissed: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    bulkMarkAsDismissed: jest.fn(),
    updatePreferences: jest.fn(),
    clearNotifications: jest.fn(),
  }),
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    preferences: [],
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAsDismissed: jest.fn(),
    bulkMarkAsRead: jest.fn(),
    bulkMarkAsDismissed: jest.fn(),
    updatePreferences: jest.fn(),
    clearNotifications: jest.fn(),
  }),
}));

// Mock the SocketContext
jest.mock("../context/SocketContext", () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
  useSocket: () => ({
    socket: null,
    isConnected: false,
    stocks: [],
    tradingSignals: [],
    news: [],
    portfolioUpdates: new Map(),
    allPortfolios: [],
    subscribeToPortfolio: jest.fn(),
    unsubscribeFromPortfolio: jest.fn(),
    requestAllPortfolios: jest.fn(),
    getPortfolioPerformance: jest.fn().mockResolvedValue({
      totalValue: 10150,
      totalPnL: 150,
      totalReturn: 1.5,
      dayGain: 150,
      dayGainPercent: 1.5,
      performance: [
        {
          date: "2025-01-01",
          timestamp: 1704067200000,
          totalValue: 10000,
          cash: 5000,
          investedValue: 5000,
          dayChange: 0,
          dayChangePercent: 0,
        },
        {
          date: "2025-01-02",
          timestamp: 1704153600000,
          totalValue: 10150,
          cash: 5000,
          investedValue: 5150,
          dayChange: 150,
          dayChangePercent: 1.5,
        },
      ],
    }),
    getPositionDetails: jest.fn(),
    getPortfolioAnalytics: jest.fn(),
    getSectorAllocation: jest.fn(),
    getRiskMetrics: jest.fn(),
    getBenchmarkComparison: jest.fn(),
    getPerformanceAttribution: jest.fn(),
    placeOrder: jest.fn(),
    executeOrder: jest.fn(),
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
  }),
}));

// Mock the recommendation service
jest.mock("../services/recommendationService", () => ({
  __esModule: true,
  default: {
    getQuickRecommendation: jest.fn().mockResolvedValue({
      recommendation: "HOLD",
      confidence: 0.75,
      reasoning: "Market conditions are neutral",
    }),
  },
}));

// Mock axios specifically for API calls
jest.mock("axios", () => {
  const mockPerformanceData = [
    {
      date: "2025-01-01",
      timestamp: 1704067200000,
      totalValue: 10000,
      cash: 5000,
      investedValue: 5000,
      dayChange: 0,
      dayChangePercent: 0,
    },
    {
      date: "2025-01-02",
      timestamp: 1704153600000,
      totalValue: 10150,
      cash: 5000,
      investedValue: 5150,
      dayChange: 150,
      dayChangePercent: 1.5,
    },
  ];

  const mockPortfolioData = {
    id: 1,
    name: "Test Portfolio",
    initialCash: 10000,
    currentCash: 5000,
    totalValue: 10150,
    totalPnL: 150,
    totalReturn: 1.5,
    positions: [],
    trades: [],
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  };

  const mockAxiosInstance = {
    get: jest.fn().mockImplementation((url: string) => {
      if (url.includes("/performance")) {
        return Promise.resolve({ data: mockPerformanceData });
      } else if (url.includes("/portfolios/")) {
        return Promise.resolve({ data: mockPortfolioData });
      } else if (url.includes("/portfolios")) {
        return Promise.resolve({ data: [mockPortfolioData] });
      }
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: {
        use: jest.fn().mockReturnValue(1),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn().mockReturnValue(1),
        eject: jest.fn(),
      },
    },
  };

  return {
    ...mockAxiosInstance,
    create: jest.fn().mockReturnValue(mockAxiosInstance),
    default: mockAxiosInstance,
  };
});

// Create a mock RootStore for testing
const createMockStore = (): RootStore => {
  const mockStore = new RootStore();

  // Ensure all stores are properly initialized
  mockStore.stockStore.stocks = mockStore.stockStore.stocks || [];
  mockStore.portfolioStore.portfolios =
    mockStore.portfolioStore.portfolios || [];

  return mockStore;
};

interface AllTheProvidersProps {
  children: React.ReactNode;
  store?: RootStore;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  store = createMockStore(),
}) => {
  return (
    <StoreProvider store={store}>
      <NotificationProvider>
        <SocketProvider>{children}</SocketProvider>
      </NotificationProvider>
    </StoreProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { store?: RootStore }
) => {
  const { store, ...renderOptions } = options || {};

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Legacy function for backward compatibility
export const renderWithStoreProvider = (
  ui: React.ReactElement,
  options = {}
) => {
  return customRender(ui, options);
};

// Mock FontAwesome icons
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon, ...props }: any) => (
    <i data-testid={`fa-icon-${icon}`} {...props} />
  ),
}));

// Re-export everything
export * from "@testing-library/react";
export { createMockStore, customRender as render };
