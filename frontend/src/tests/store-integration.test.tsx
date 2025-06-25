import { ApiStore } from "../stores/ApiStore";
import { PortfolioStore } from "../stores/PortfolioStore";
import { StockStore } from "../stores/StockStore";

// Mock the API calls
jest.mock("axios");

describe("Store Integration Tests", () => {
  let apiStore: ApiStore;
  let portfolioStore: PortfolioStore;
  let stockStore: StockStore;

  beforeEach(() => {
    apiStore = new ApiStore();
    portfolioStore = new PortfolioStore(apiStore);
    stockStore = new StockStore(); // StockStore doesn't take parameters
    jest.clearAllMocks();
  });

  describe("PortfolioStore Integration", () => {
    it("should fetch portfolio data and update state", async () => {
      const mockPortfolio = {
        id: 1,
        name: "Test Portfolio",
        initialCash: 100000,
        currentCash: 95000,
        totalValue: 105000,
        positions: [
          {
            id: 1,
            symbol: "AAPL",
            quantity: 10,
            averagePrice: 150.0,
            currentPrice: 150.25,
            marketValue: 1502.5,
            unrealizedPnl: 25.0,
            unrealizedPnlPercent: 1.67,
          },
        ],
        trades: [],
      };

      // Mock the API response
      jest.spyOn(apiStore, "get").mockResolvedValue(mockPortfolio);

      expect(portfolioStore.isLoading).toBe(false);
      expect(portfolioStore.portfolio).toBeNull();

      await portfolioStore.initializeDefaultPortfolio();

      expect(portfolioStore.isLoading).toBe(false);
      expect(portfolioStore.currentPortfolio).toEqual(mockPortfolio);
      expect(portfolioStore.positions).toEqual(mockPortfolio.positions);
      expect(portfolioStore.error).toBeNull();
    });

    it("should handle portfolio fetch errors", async () => {
      const mockError = new Error("Failed to fetch portfolio");
      jest.spyOn(apiStore, "get").mockRejectedValue(mockError);

      await portfolioStore.initializeDefaultPortfolio();

      expect(portfolioStore.isLoading).toBe(false);
      expect(portfolioStore.currentPortfolio).toBeNull();
      expect(portfolioStore.error).toBe("Failed to fetch portfolio");
    });

    it("should fetch performance history", async () => {
      const mockPerformanceData = {
        performance: [
          {
            date: "2024-01-01",
            totalValue: 100000,
            cash: 50000,
            investedValue: 50000,
            dayChange: 0,
            dayChangePercent: 0,
          },
          {
            date: "2024-01-02",
            totalValue: 101000,
            cash: 50000,
            investedValue: 51000,
            dayChange: 1000,
            dayChangePercent: 1.0,
          },
        ],
      };

      jest.spyOn(apiStore, "get").mockResolvedValue(mockPerformanceData);

      await portfolioStore.fetchPerformanceHistory(1, "1M");

      expect(portfolioStore.performanceHistory).toHaveLength(2);
      expect(portfolioStore.performanceHistory[0].totalValue).toBe(100000);
      expect(portfolioStore.performanceHistory[1].totalValue).toBe(101000);
    });

    it("should calculate portfolio metrics correctly", async () => {
      const mockPortfolio = {
        id: 1,
        name: "Test Portfolio",
        initialCash: 100000,
        currentCash: 50000,
        totalValue: 110000,
        positions: [
          {
            id: 1,
            symbol: "AAPL",
            quantity: 10,
            averagePrice: 150.0,
            currentPrice: 160.0,
            marketValue: 1600.0,
            unrealizedPnl: 100.0,
            unrealizedPnlPercent: 6.67,
          },
          {
            id: 2,
            symbol: "GOOGL",
            quantity: 5,
            averagePrice: 2800.0,
            currentPrice: 2900.0,
            marketValue: 14500.0,
            unrealizedPnl: 500.0,
            unrealizedPnlPercent: 3.57,
          },
        ],
        trades: [],
      };

      jest.spyOn(apiStore, "get").mockResolvedValue(mockPortfolio);
      await portfolioStore.initializeDefaultPortfolio();

      expect(portfolioStore.totalCash).toBe(50000);
      expect(portfolioStore.totalEquity).toBe(16100); // 1600 + 14500
      expect(portfolioStore.totalPortfolioValue).toBe(66100); // 50000 + 16100
    });
  });

  describe("StockStore Integration", () => {
    it("should fetch stocks successfully", async () => {
      const mockStocks = [
        {
          id: 1,
          symbol: "AAPL",
          name: "Apple Inc.",
          currentPrice: 150.25,
          previousClose: 148.5,
          changePercent: 1.18,
        },
        {
          id: 2,
          symbol: "GOOGL",
          name: "Alphabet Inc.",
          currentPrice: 2800.0,
          previousClose: 2750.0,
          changePercent: 1.82,
        },
      ];

      jest.spyOn(apiStore, "get").mockResolvedValue(mockStocks);

      expect(stockStore.isLoading).toBe(false);
      expect(stockStore.stocks).toHaveLength(0);

      await stockStore.fetchStocks();

      expect(stockStore.isLoading).toBe(false);
      expect(stockStore.stocks).toEqual(mockStocks);
      expect(stockStore.error).toBeNull();
    });

    it("should fetch trading signals", async () => {
      const mockSignals = [
        {
          id: 1,
          stockId: 1,
          signal: "buy",
          confidence: 0.75,
          targetPrice: 155.0,
          reason: "Strong upward trend",
        },
        {
          id: 2,
          stockId: 2,
          signal: "sell",
          confidence: 0.65,
          targetPrice: 2700.0,
          reason: "Overbought conditions",
        },
      ];

      jest.spyOn(apiStore, "get").mockResolvedValue(mockSignals);

      await stockStore.fetchTradingSignals();

      expect(stockStore.tradingSignals).toEqual(mockSignals);
    });

    it("should handle stock fetch errors", async () => {
      const mockError = new Error("Failed to fetch stocks");
      jest.spyOn(apiStore, "get").mockRejectedValue(mockError);

      await stockStore.fetchStocks();

      expect(stockStore.isLoading).toBe(false);
      expect(stockStore.stocks).toHaveLength(0);
      expect(stockStore.error).toBe("Failed to fetch stocks");
    });

    it("should update stocks from WebSocket data", async () => {
      // First, populate with initial data
      const initialStocks = [
        {
          id: 1,
          symbol: "AAPL",
          name: "Apple Inc.",
          currentPrice: 150.25,
          previousClose: 148.5,
          changePercent: 1.18,
        },
      ];

      jest.spyOn(apiStore, "get").mockResolvedValue(initialStocks);
      await stockStore.fetchStocks(); // Now simulate WebSocket update
      const updatedStocks = [
        {
          id: 1,
          symbol: "AAPL",
          name: "Apple Inc.",
          sector: "Technology",
          description: "Apple Inc. is an American multinational technology company",
          currentPrice: 152.5,
          previousClose: 148.5,
          changePercent: 2.7,
          volume: 1200000,
          marketCap: 2500000000000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Simulate WebSocket update (this would normally be called by the WebSocket service)
      stockStore["updateStocksFromWebSocket"](updatedStocks);

      expect(stockStore.stocks[0].currentPrice).toBe(152.5);
      expect(stockStore.stocks[0].changePercent).toBe(2.7);
    });
  });

  describe("ApiStore Integration", () => {
    it("should handle successful GET requests", async () => {
      const mockData = { test: "data" };

      // Mock successful axios response
      const mockAxios = require("axios");
      mockAxios.get.mockResolvedValue({ data: mockData });

      const result = await apiStore.get("/test-endpoint");

      expect(result).toEqual(mockData);
    });

    it("should handle successful POST requests", async () => {
      const mockData = { id: 1, created: true };
      const requestData = { name: "test" };

      const mockAxios = require("axios");
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await apiStore.post("/test-endpoint", requestData);

      expect(result).toEqual(mockData);
    });

    it("should handle API errors gracefully", async () => {
      const mockAxios = require("axios");
      mockAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: "Not found" },
        },
      });

      await expect(apiStore.get("/non-existent")).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it("should handle network errors", async () => {
      const mockAxios = require("axios");
      mockAxios.get.mockRejectedValue(new Error("Network Error"));

      await expect(apiStore.get("/test-endpoint")).rejects.toThrow(
        "Network Error"
      );
    });
  });

  describe("Cross-Store Integration", () => {
    it("should update portfolio when position prices change", async () => {
      // Setup portfolio with positions
      const mockPortfolio = {
        id: 1,
        name: "Test Portfolio",
        initialCash: 100000,
        currentCash: 50000,
        totalValue: 110000,
        positions: [
          {
            id: 1,
            symbol: "AAPL",
            quantity: 10,
            averagePrice: 150.0,
            currentPrice: 150.0,
            marketValue: 1500.0,
            unrealizedPnl: 0.0,
            unrealizedPnlPercent: 0.0,
          },
        ],
        trades: [],
      };

      jest.spyOn(apiStore, "get").mockResolvedValue(mockPortfolio);
      await portfolioStore.initializeDefaultPortfolio();

      // Update stock price
      portfolioStore.updatePositionPrice("AAPL", 155.0); // Portfolio should reflect updated position value
      const updatedPosition = portfolioStore.positions.find(
        (p) => p.symbol === "AAPL"
      );
      expect(updatedPosition?.currentValue).toBe(1550.0); // 10 shares * 155.0
    });

    it("should handle concurrent API calls without race conditions", async () => {
      const portfolioPromise = portfolioStore.initializeDefaultPortfolio();
      const stocksPromise = stockStore.fetchStocks();

      // Mock different response times
      jest
        .spyOn(apiStore, "get")
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ id: 1, positions: [] }), 100)
            )
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve([{ symbol: "AAPL" }]), 50)
            )
        );

      await Promise.all([portfolioPromise, stocksPromise]);

      expect(portfolioStore.portfolio).toBeTruthy();
      expect(stockStore.stocks).toHaveLength(1);
    });
  });

  describe("Real-time Data Integration", () => {
    it("should handle WebSocket reconnection scenarios", async () => {
      // Initial stock data
      const initialStocks = [{ id: 1, symbol: "AAPL", currentPrice: 150.0 }];
      jest.spyOn(apiStore, "get").mockResolvedValue(initialStocks);
      await stockStore.fetchStocks();

      // Simulate WebSocket disconnection and reconnection
      expect(stockStore.stocks[0].currentPrice).toBe(150.0); // Simulate reconnection with updated data
      const reconnectedData = [
        {
          id: 1,
          symbol: "AAPL",
          name: "Apple Inc.",
          sector: "Technology",
          description: "Apple Inc. is an American multinational technology company",
          currentPrice: 155.0,
          previousClose: 150.0,
          changePercent: 3.33,
          volume: 1100000,
          marketCap: 2500000000000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      stockStore["updateStocksFromWebSocket"](reconnectedData);

      expect(stockStore.stocks[0].currentPrice).toBe(155.0);
    });
    it("should maintain data consistency during updates", async () => {
      // Setup initial portfolio
      const mockPortfolio = {
        id: 1,
        positions: [
          {
            id: 1,
            symbol: "AAPL",
            quantity: 10,
            averagePrice: 150.0,
            currentPrice: 150.0,
            marketValue: 1500.0,
            unrealizedPnl: 0.0,
            unrealizedPnlPercent: 0.0,
          },
        ],
      };
      jest.spyOn(apiStore, "get").mockResolvedValue(mockPortfolio);
      await portfolioStore.initializeDefaultPortfolio();

      const initialValue = portfolioStore.totalEquity;

      // Multiple rapid price updates
      portfolioStore.updatePositionPrice("AAPL", 151.0);
      portfolioStore.updatePositionPrice("AAPL", 152.0);
      portfolioStore.updatePositionPrice("AAPL", 153.0);

      // Final value should reflect the last update
      expect(portfolioStore.totalEquity).toBe(1530); // 10 * 153.0
      expect(portfolioStore.totalEquity).not.toBe(initialValue);
    });
  });
});
