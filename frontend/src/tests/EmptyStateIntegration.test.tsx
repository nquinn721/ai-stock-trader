import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Dashboard from "../components/Dashboard";
import PortfolioSummary from "../components/PortfolioSummary";
import QuickTrade from "../components/QuickTrade";
import { SocketProvider } from "../context/SocketContext";
import { usePortfolioStore } from "../stores/StoreContext";

// Mock the stores
jest.mock("../stores/StoreContext");
jest.mock("../context/SocketContext", () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useSocket: () => ({
    isConnected: true,
    tradingSignals: [],
  }),
}));

// Mock axios
jest.mock("axios");

const mockUsePortfolioStore = usePortfolioStore as jest.MockedFunction<
  typeof usePortfolioStore
>;

describe("EmptyState Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Dashboard EmptyState Integration", () => {
    test("shows EmptyState when no stock data is available", async () => {
      // Mock axios to return empty data
      const axios = require("axios");
      axios.get.mockResolvedValue({ data: [] });

      render(
        <SocketProvider>
          <Dashboard />
        </SocketProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("No Stock Data Available")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Real stock market API integration is required to display live stock data. Please configure API keys for Yahoo Finance, Alpha Vantage, or similar services."
          )
        ).toBeInTheDocument();
      });
    });

    test("shows loading EmptyState initially", () => {
      // Mock axios to never resolve (simulate loading)
      const axios = require("axios");
      axios.get.mockImplementation(() => new Promise(() => {}));

      render(
        <SocketProvider>
          <Dashboard />
        </SocketProvider>
      );

      expect(screen.getByText("Loading Stock Data")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Fetching real-time market data and trading signals..."
        )
      ).toBeInTheDocument();
    });
  });

  describe("PortfolioSummary EmptyState Integration", () => {
    test("shows loading EmptyState when portfolio is loading", () => {
      mockUsePortfolioStore.mockReturnValue({
        portfolio: null,
        positions: [],
        performanceHistory: [],
        isLoading: true,
        error: null,
        fetchPortfolio: jest.fn(),
        fetchPositions: jest.fn(),
        fetchPerformanceHistory: jest.fn(),
        updatePositionPrice: jest.fn(),
        clearError: jest.fn(),
        reset: jest.fn(),
        totalPortfolioValue: 0,
        totalCash: 0,
        totalEquity: 0,
        dayChange: 0,
        dayChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        topPositions: [],
        isPositive: false,
      } as any);

      render(<PortfolioSummary />);

      expect(screen.getByText("Loading Portfolio")).toBeInTheDocument();
      expect(
        screen.getByText("Fetching your portfolio data...")
      ).toBeInTheDocument();
    });

    test("shows error EmptyState when portfolio has error", () => {
      const mockRetry = jest.fn();
      mockUsePortfolioStore.mockReturnValue({
        portfolio: null,
        positions: [],
        performanceHistory: [],
        isLoading: false,
        error: "Failed to fetch portfolio data",
        fetchPortfolio: mockRetry,
        fetchPositions: jest.fn(),
        fetchPerformanceHistory: jest.fn(),
        updatePositionPrice: jest.fn(),
        clearError: jest.fn(),
        reset: jest.fn(),
        totalPortfolioValue: 0,
        totalCash: 0,
        totalEquity: 0,
        dayChange: 0,
        dayChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        topPositions: [],
        isPositive: false,
      } as any);

      render(<PortfolioSummary />);

      expect(screen.getByText("Portfolio Error")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to fetch portfolio data")
      ).toBeInTheDocument();

      const retryButton = screen.getByText("Retry");
      expect(retryButton).toBeInTheDocument();
    });

    test("shows no data EmptyState when portfolio is null", () => {
      const mockLoad = jest.fn();
      mockUsePortfolioStore.mockReturnValue({
        portfolio: null,
        positions: [],
        performanceHistory: [],
        isLoading: false,
        error: null,
        fetchPortfolio: mockLoad,
        fetchPositions: jest.fn(),
        fetchPerformanceHistory: jest.fn(),
        updatePositionPrice: jest.fn(),
        clearError: jest.fn(),
        reset: jest.fn(),
        totalPortfolioValue: 0,
        totalCash: 0,
        totalEquity: 0,
        dayChange: 0,
        dayChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        topPositions: [],
        isPositive: false,
      } as any);

      render(<PortfolioSummary />);

      expect(screen.getByText("No Portfolio Data")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Portfolio information is not available at the moment."
        )
      ).toBeInTheDocument();

      const loadButton = screen.getByText("Load Portfolio");
      expect(loadButton).toBeInTheDocument();
    });
  });

  describe("QuickTrade EmptyState Integration", () => {
    test("shows loading EmptyState when portfolio is loading", () => {
      // Mock axios to simulate loading state
      const axios = require("axios");
      axios.get.mockImplementation(() => new Promise(() => {}));

      render(<QuickTrade />);

      expect(screen.getByText("Loading Portfolio")).toBeInTheDocument();
      expect(
        screen.getByText("Setting up your trading portfolio...")
      ).toBeInTheDocument();
    });
  });

  describe("EmptyState Accessibility", () => {
    test("EmptyState components are accessible", async () => {
      const axios = require("axios");
      axios.get.mockResolvedValue({ data: [] });

      render(
        <SocketProvider>
          <Dashboard />
        </SocketProvider>
      );

      await waitFor(() => {
        const emptyState = screen
          .getByText("No Stock Data Available")
          .closest(".empty-state");
        expect(emptyState).toBeInTheDocument();

        // Check for proper semantic markup
        const title = screen.getByText("No Stock Data Available");
        const description = screen.getByText(
          /Real stock market API integration/
        );

        expect(title).toHaveClass("empty-state-title");
        expect(description).toHaveClass("empty-state-description");
      });
    });
  });

  describe("EmptyState Responsive Design", () => {
    test("EmptyState adapts to different sizes", () => {
      mockUsePortfolioStore.mockReturnValue({
        portfolio: null,
        positions: [],
        performanceHistory: [],
        isLoading: true,
        error: null,
        fetchPortfolio: jest.fn(),
        fetchPositions: jest.fn(),
        fetchPerformanceHistory: jest.fn(),
        updatePositionPrice: jest.fn(),
        clearError: jest.fn(),
        reset: jest.fn(),
        totalPortfolioValue: 0,
        totalCash: 0,
        totalEquity: 0,
        dayChange: 0,
        dayChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        topPositions: [],
        isPositive: false,
      } as any);

      render(<PortfolioSummary />);

      const emptyState = screen
        .getByText("Loading Portfolio")
        .closest(".empty-state");
      expect(emptyState).toHaveClass("loading");
    });
  });
});
