import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Dashboard from "./Dashboard";
import { StoreProvider } from "../stores/StoreContext";
import { RootStore } from "../stores/RootStore";

// Mock the MobX stores
const mockStockStore = {
  stocks: [] as any[],
  get stocksWithSignals() { return this.stocks.map((stock: any) => ({ ...stock, tradingSignal: null })); },
  tradingSignals: [] as any[],
  isLoading: false,
  error: null,
  fetchStocksWithSignals: jest.fn(),
  fetchStockDetails: jest.fn(),
  fetchStockHistory: jest.fn(),
  setSelectedStock: jest.fn(),
  clearError: jest.fn(),
  topPerformers: [] as any[],
  worstPerformers: [] as any[],
  totalMarketCap: 0,
};

const mockPortfolioStore = {
  portfolio: null,
  portfolios: [],
  isLoading: false,
  error: null,
  fetchPortfolio: jest.fn(),
  fetchPortfolios: jest.fn(),
  createPortfolio: jest.fn(),
  initializeDefaultPortfolio: jest.fn().mockResolvedValue(undefined),
};

const mockWebSocketStore = {
  isConnected: true,
  socket: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
};

const mockApiStore = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockTradeStore = {
  trades: [],
  pendingTrades: [],
  isLoading: false,
  error: null,
  executeTrade: jest.fn(),
  getTradeHistory: jest.fn(),
};

const mockRootStore = {
  stockStore: mockStockStore,
  portfolioStore: mockPortfolioStore,
  webSocketStore: mockWebSocketStore,
  apiStore: mockApiStore,
  tradeStore: mockTradeStore,
} as unknown as RootStore;

// Mock components to avoid complexity in testing
jest.mock("./StockCard", () => {
  return function MockStockCard({ stock }: any) {
    return (
      <div data-testid={`stock-card-${stock.symbol}`}>
        <span>{stock.symbol}</span>
        <span>${stock.currentPrice}</span>
      </div>
    );
  };
});

jest.mock("./PortfolioChart", () => {
  return function MockPortfolioChart() {
    return <div data-testid="portfolio-chart">Portfolio Chart</div>;
  };
});

jest.mock("./PortfolioSummary", () => {
  return function MockPortfolioSummary() {
    return <div data-testid="portfolio-summary">Portfolio Summary</div>;
  };
});

jest.mock("./QuickTrade", () => {
  return function MockQuickTrade() {
    return <div data-testid="quick-trade">Quick Trade</div>;
  };
});

jest.mock("./NotificationCenter", () => {
  return function MockNotificationCenter() {
    return <div data-testid="notification-center">Notifications</div>;
  };
});

jest.mock("./PortfolioCreator", () => {
  return function MockPortfolioCreator() {
    return <div data-testid="portfolio-creator">Create Portfolio</div>;
  };
});

jest.mock("./PortfolioDetailsModal", () => {
  return function MockPortfolioDetailsModal() {
    return <div data-testid="portfolio-details-modal">Portfolio Details</div>;
  };
});

jest.mock("./PortfolioSelector", () => {
  return function MockPortfolioSelector() {
    return <div data-testid="portfolio-selector">Portfolio Selector</div>;
  };
});

jest.mock("./EmptyState", () => {
  return function MockEmptyState({ title }: any) {
    return <div data-testid="empty-state">{title}</div>;
  };
});

const renderDashboardWithStore = (store = mockRootStore) => {
  return render(
    <StoreProvider store={store}>
      <Dashboard />
    </StoreProvider>
  );
};

describe("Dashboard MobX Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store states
    mockStockStore.stocks = [];
    mockStockStore.stocksWithSignals = [];
    mockStockStore.tradingSignals = [];
    mockStockStore.isLoading = false;
    mockStockStore.error = null;
    mockPortfolioStore.portfolio = null;
    mockPortfolioStore.isLoading = false;
    mockPortfolioStore.error = null;
  });

  const mockStocksWithSignals = [
    {
      id: 1,
      symbol: "AAPL",
      name: "Apple Inc.",
      sector: "Technology",
      description: "Technology company",
      currentPrice: 150.25,
      previousClose: 148.5,
      changePercent: 1.18,
      volume: 1000000,
      marketCap: 2500000000000,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      tradingSignal: {
        id: 1,
        stockId: 1,
        signal: "buy" as const,
        confidence: 0.75,
        targetPrice: 155.0,
        currentPrice: 150.25,
        reason: "Strong upward trend",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      },
    },
  ];

  it("should initialize MobX stores on mount", async () => {
    renderDashboardWithStore();

    await waitFor(() => {
      expect(mockStockStore.fetchStocksWithSignals).toHaveBeenCalled();
      expect(mockPortfolioStore.fetchPortfolio).toHaveBeenCalledWith(1);
    });
  });

  it("should display stocks when available in store", async () => {
    mockStockStore.stocksWithSignals = mockStocksWithSignals;
    mockStockStore.isLoading = false;

    renderDashboardWithStore();

    await waitFor(() => {
      expect(screen.getByTestId("stock-card-AAPL")).toBeInTheDocument();
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("$150.25")).toBeInTheDocument();
    });
  });

  it("should show loading state when stocks are being fetched", () => {
    mockStockStore.isLoading = true;
    mockStockStore.stocksWithSignals = [];

    renderDashboardWithStore();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should display empty state when no stocks available", () => {
    mockStockStore.stocksWithSignals = [];
    mockStockStore.isLoading = false;
    mockWebSocketStore.isConnected = true;

    renderDashboardWithStore();

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("should display connection status from WebSocket store", () => {
    mockWebSocketStore.isConnected = true;
    mockStockStore.stocksWithSignals = mockStocksWithSignals;

    renderDashboardWithStore();

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("should display offline status when WebSocket is disconnected", () => {
    mockWebSocketStore.isConnected = false;
    mockStockStore.stocksWithSignals = mockStocksWithSignals;

    renderDashboardWithStore();

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("disconnected")).toBeInTheDocument();
  });

  it("should calculate market analytics from MobX store data", () => {
    mockStockStore.stocksWithSignals = mockStocksWithSignals;

    renderDashboardWithStore();

    // Market analytics should be calculated from store data
    expect(screen.getByText("1 stocks")).toBeInTheDocument();
  });
});
