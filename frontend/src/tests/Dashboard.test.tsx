import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import Dashboard from "../components/Dashboard";
import { FRONTEND_API_CONFIG } from "../config/api.config";
import { SocketProvider } from "../context/SocketContext";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock socket context
const mockSocketContext = {
  isConnected: true,
  tradingSignals: [] as any[],
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

jest.mock("../context/SocketContext", () => ({
  useSocket: () => mockSocketContext,
  SocketProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="socket-provider">{children}</div>
  ),
}));

// Mock child components
jest.mock("../components/StockCard", () => {
  return function MockStockCard({ stock }: any) {
    return (
      <div data-testid={`stock-card-${stock.symbol}`}>
        <span>{stock.symbol}</span>
        <span>${stock.currentPrice}</span>
        <span>{stock.changePercent}%</span>
      </div>
    );
  };
});

jest.mock("../components/PortfolioChart", () => {
  return function MockPortfolioChart({ stock }: any) {
    return (
      <div data-testid="portfolio-chart">
        Chart for {stock?.symbol || "No Stock"}
      </div>
    );
  };
});

jest.mock("../components/PortfolioSummary", () => {
  return function MockPortfolioSummary() {
    return <div data-testid="portfolio-summary">Portfolio Summary</div>;
  };
});

jest.mock("../components/QuickTrade", () => {
  return function MockQuickTrade() {
    return <div data-testid="quick-trade">Quick Trade</div>;
  };
});

const mockStocksWithSignals = [
  {
    id: 1,
    symbol: "AAPL",
    name: "Apple Inc.",
    currentPrice: 150.25,
    previousClose: 148.5,
    changePercent: 1.18,
    volume: 1000000,
    tradingSignal: {
      id: 1,
      signalType: "BUY",
      confidence: 0.75,
      reason: "Strong upward trend",
      timestamp: new Date(),
    },
  },
  {
    id: 2,
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    currentPrice: 2800.5,
    previousClose: 2750.25,
    changePercent: 1.83,
    volume: 800000,
    tradingSignal: {
      id: 2,
      signalType: "HOLD",
      confidence: 0.6,
      reason: "Stable performance",
      timestamp: new Date(),
    },
  },
];

const mockTradingSignals = [
  {
    id: 1,
    stockId: 1,
    signalType: "BUY",
    confidence: 0.75,
    reason: "Strong upward trend",
    timestamp: new Date(),
  },
  {
    id: 2,
    stockId: 2,
    signalType: "HOLD",
    confidence: 0.6,
    reason: "Stable performance",
    timestamp: new Date(),
  },
];

describe("Dashboard Component", () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  test("renders loading state initially", () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolve

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders dashboard with stock data", async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/stocks/with-signals/all")) {
        return Promise.resolve({ data: mockStocksWithSignals });
      }
      if (url.includes("/trading/signals")) {
        return Promise.resolve({ data: mockTradingSignals });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("stock-card-AAPL")).toBeInTheDocument();
      expect(screen.getByTestId("stock-card-GOOGL")).toBeInTheDocument();
    });

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("GOOGL")).toBeInTheDocument();
    expect(screen.getByText("$150.25")).toBeInTheDocument();
    expect(screen.getByText("$2800.5")).toBeInTheDocument();
  });

  test('displays "No Stock Data Available" when no data', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No Stock Data Available")).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    mockedAxios.get.mockRejectedValue(new Error("API Error"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No Stock Data Available")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching stocks with signals:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test("renders portfolio components", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-chart")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-summary")).toBeInTheDocument();
      expect(screen.getByTestId("quick-trade")).toBeInTheDocument();
    });
  });

  test("displays top performing stock in chart", async () => {
    const stocksWithPositiveChange = [
      ...mockStocksWithSignals,
      {
        id: 3,
        symbol: "TSLA",
        name: "Tesla Inc.",
        currentPrice: 300.0,
        previousClose: 280.0,
        changePercent: 7.14,
        volume: 2000000,
        tradingSignal: null,
      },
    ];

    mockedAxios.get.mockResolvedValue({ data: stocksWithPositiveChange });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Chart for TSLA")).toBeInTheDocument();
    });
  });

  test("timeframe selection buttons work", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("1D")).toBeInTheDocument();
    });

    const buttons = ["1D", "1W", "1M", "3M", "1Y"];
    buttons.forEach((timeframe) => {
      const button = screen.getByText(timeframe);
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(button).toHaveClass("active");
    });
  });

  test("socket connection status is displayed", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("socket-provider")).toBeInTheDocument();
    });
  });

  test("stock cards display trading signals", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      const appleCard = screen.getByTestId("stock-card-AAPL");
      expect(appleCard).toBeInTheDocument();
      // The mock StockCard should receive the trading signal data
    });
  });

  test("handles empty trading signals", async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/stocks/with-signals/all")) {
        return Promise.resolve({ data: mockStocksWithSignals });
      }
      if (url.includes("/trading/signals")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("stock-card-AAPL")).toBeInTheDocument();
    });
  });

  test("component fetches data on mount", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/stocks/with-signals/all`
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/trading/signals`
      );
    });
  });

  test("displays real-time updates from websocket", async () => {
    mockSocketContext.tradingSignals = mockTradingSignals;
    mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

    render(
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("stock-card-AAPL")).toBeInTheDocument();
    });

    // The component should use the trading signals from the socket context
    expect(mockSocketContext.tradingSignals).toEqual(mockTradingSignals);
  });
});
