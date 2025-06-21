import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import Dashboard from "./Dashboard";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock socket context
jest.mock("../context/SocketContext", () => ({
  useSocket: () => ({
    isConnected: true,
    tradingSignals: [],
    socket: null,
    stocks: [],
    news: [],
  }),
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock components
jest.mock("./StockCard", () => {
  return function MockStockCard({ stock }: any) {
    return (
      <div data-testid={`stock-card-${stock.symbol}`}>
        <span>{stock.symbol}</span>
        <span>{stock.currentPrice}</span>
      </div>
    );
  };
});

jest.mock("./PortfolioChart", () => {
  return function MockPortfolioChart({ stock }: any) {
    return (
      <div data-testid="portfolio-chart">{stock?.symbol || "No Stock"}</div>
    );
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

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    {
      id: 2,
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      sector: "Technology",
      description: "Technology company",
      currentPrice: 2800.5,
      previousClose: 2750.25,
      changePercent: 1.83,
      volume: 800000,
      marketCap: 1800000000000,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      tradingSignal: null,
    },
  ];

  const mockTradingSignals = [
    {
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
  ];

  it("renders without crashing", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("displays stocks with signals when data is available", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockStocksWithSignals });
    mockedAxios.get.mockResolvedValueOnce({ data: mockTradingSignals });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("stock-card-AAPL")).toBeInTheDocument();
      expect(screen.getByTestId("stock-card-GOOGL")).toBeInTheDocument();
    });

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("GOOGL")).toBeInTheDocument();
  });

  it('displays "No Stock Data Available" when no data is returned', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("No Stock Data Available")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching stocks with signals:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it("displays portfolio chart for top performing stock", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockStocksWithSignals });
    mockedAxios.get.mockResolvedValueOnce({ data: mockTradingSignals });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-chart")).toBeInTheDocument();
      expect(screen.getByText("AAPL")).toBeInTheDocument(); // In the chart
    });
  });

  it("allows timeframe selection", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockStocksWithSignals });
    mockedAxios.get.mockResolvedValueOnce({ data: mockTradingSignals });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const timeframeSelect = screen.getByRole("combobox");
    fireEvent.change(timeframeSelect, { target: { value: "1Y" } });

    expect(timeframeSelect).toHaveValue("1Y");
  });

  it("displays connection status", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("🟢 Connected")).toBeInTheDocument();
    });
  });

  it("renders all dashboard components", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockStocksWithSignals });
    mockedAxios.get.mockResolvedValueOnce({ data: mockTradingSignals });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-chart")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-summary")).toBeInTheDocument();
      expect(screen.getByTestId("quick-trade")).toBeInTheDocument();
    });
  });

  it("makes correct API calls on mount", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:3000/stocks/with-signals/all"
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:3000/trading/signals"
    );
  });

  it("displays loading state initially", () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dashboard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
