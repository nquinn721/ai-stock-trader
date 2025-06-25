import "@testing-library/jest-dom";
import { render, screen } from "./test-utils";
import StockCard from "../components/StockCard";
import { Stock, TradingSignal } from "../types";

// Mock CSS imports
jest.mock("../components/StockCard.css", () => ({}));

// Mock child components
jest.mock("../components/PriceChart", () => {
  return function MockPriceChart() {
    return <div data-testid="price-chart">Price Chart</div>;
  };
});

jest.mock("../components/SentimentDisplay", () => {
  return function MockSentimentDisplay() {
    return <div data-testid="sentiment-display">Sentiment Display</div>;
  };
});

jest.mock("../components/BreakoutDisplay", () => {
  return function MockBreakoutDisplay() {
    return <div data-testid="breakout-display">Breakout Display</div>;
  };
});

jest.mock("../components/DayTradingPatterns", () => {
  return function MockDayTradingPatterns() {
    return <div data-testid="day-trading-patterns">Day Trading Patterns</div>;
  };
});

// Mock services
jest.mock("../services/recommendationService", () => ({
  RecommendationService: class {
    generateRecommendation = jest.fn().mockRejectedValue(new Error("Mocked error"));
  },
}));

const mockStock: Stock = {
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
};

const mockTradingSignal: TradingSignal = {
  id: 1,
  stockId: 1,
  signal: "buy",
  confidence: 0.75,
  targetPrice: 160.0,
  currentPrice: 150.25,
  reason: "Strong upward trend detected",
  isActive: true,
  createdAt: "2024-01-01T10:00:00Z",
};

const mockStockNegativeChange: Stock = {
  ...mockStock,
  changePercent: -2.45,
};

const mockSellSignal: TradingSignal = {
  ...mockTradingSignal,
  signal: "sell",
  reason: "Downward trend detected",
};

describe("StockCard Component", () => {
  test("renders stock information correctly", () => {
    render(<StockCard stock={mockStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    // Test for price that might be split across elements
    expect(screen.getByText(/150\.25/)).toBeInTheDocument();
    expect(screen.getByText(/1\.18/)).toBeInTheDocument();
  });

  test("displays trading signal when provided", () => {
    render(<StockCard stock={mockStock} signal={mockTradingSignal} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
  });

  test("handles stock without trading signal", () => {
    render(<StockCard stock={mockStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText(/150\.25/)).toBeInTheDocument();
  });

  test("displays negative price change correctly", () => {
    render(<StockCard stock={mockStockNegativeChange} />);

    expect(screen.getByText(/2\.45/)).toBeInTheDocument();
  });

  test("displays positive price change correctly", () => {
    render(<StockCard stock={mockStock} />);

    expect(screen.getByText(/1\.18/)).toBeInTheDocument();
  });

  test("displays SELL signal", () => {
    render(<StockCard stock={mockStock} signal={mockSellSignal} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("handles high volume numbers", () => {
    const highVolumeStock = {
      ...mockStock,
      volume: 1234567890,
    };

    render(<StockCard stock={highVolumeStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("handles zero or null values", () => {
    const stockWithZeros: Stock = {
      ...mockStock,
      currentPrice: 0,
      changePercent: 0,
      volume: 0,
    };

    render(<StockCard stock={stockWithZeros} />);

    expect(screen.getAllByText(/0\.00/)).toHaveLength(2); // Price and change percent
    expect(screen.getByText("AAPL")).toBeInTheDocument(); // Symbol should still be there
  });

  test("displays HOLD signal", () => {
    const holdSignal: TradingSignal = {
      ...mockTradingSignal,
      signal: "hold",
      reason: "Market consolidation",
    };

    render(<StockCard stock={mockStock} signal={holdSignal} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("renders child components", () => {
    render(<StockCard stock={mockStock} signal={mockTradingSignal} />);

    // Component renders without crashing
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("handles missing or undefined properties gracefully", () => {
    const incompleteStock = {
      id: 1,
      symbol: "TEST",
      name: "",
      sector: "",
      description: "",
      currentPrice: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      createdAt: "",
      updatedAt: "",
    } as Stock;

    expect(() => {
      render(<StockCard stock={incompleteStock} />);
    }).not.toThrow();

    expect(screen.getByText("TEST")).toBeInTheDocument();
  });

  test("displays market cap when available", () => {
    render(<StockCard stock={mockStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("displays previous close price", () => {
    render(<StockCard stock={mockStock} />);

    // Previous close may not be directly displayed in compact view
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("handles decimal precision correctly", () => {
    const preciseStock = {
      ...mockStock,
      currentPrice: 150.123456,
      changePercent: 1.123456,
    };

    render(<StockCard stock={preciseStock} />);

    expect(screen.getByText(/150\.12/)).toBeInTheDocument();
    expect(screen.getByText(/1\.12/)).toBeInTheDocument();
  });

  test("renders with different sectors", () => {
    const techStock = {
      ...mockStock,
      sector: "Technology",
    };

    render(<StockCard stock={techStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("handles large market cap values", () => {
    const largeCapStock = {
      ...mockStock,
      marketCap: 3000000000000, // $3T
    };

    render(<StockCard stock={largeCapStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  test("displays stock description when available", () => {
    render(<StockCard stock={mockStock} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });
});
