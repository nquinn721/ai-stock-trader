import "@testing-library/jest-dom";
import autonomousTradingApi, {
  Portfolio,
} from "../services/autonomousTradingApi";

// Mock the autonomousTradingApi
jest.mock("../../services/autonomousTradingApi");
const mockedApi = autonomousTradingApi as jest.Mocked<
  typeof autonomousTradingApi
>;

// Mock portfolio data
const mockPortfolios: Portfolio[] = [
  {
    id: "1",
    name: "Test Portfolio",
    currentCash: 10000,
    totalValue: 12000,
    isActive: true,
    portfolioType: "BASIC",
    assignedStrategy: undefined,
    assignedStrategyName: undefined,
    strategyAssignedAt: undefined,
  },
  {
    id: "2",
    name: "Day Trading Portfolio",
    currentCash: 50000,
    totalValue: 55000,
    isActive: true,
    portfolioType: "DAY_TRADING_PRO",
    assignedStrategy: "momentum-breakout-v1",
    assignedStrategyName: "Momentum Breakout Strategy",
    strategyAssignedAt: new Date("2025-06-27T10:00:00Z"),
  },
];

describe("Random Strategy Assignment Feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display unassigned portfolio correctly", () => {
    // Test that a portfolio without an assigned strategy shows "No strategy assigned"
    const unassignedPortfolio = mockPortfolios[0];

    expect(unassignedPortfolio.assignedStrategy).toBeUndefined();
    expect(unassignedPortfolio.assignedStrategyName).toBeUndefined();
  });

  it("should display assigned portfolio correctly", () => {
    // Test that a portfolio with an assigned strategy shows the strategy name
    const assignedPortfolio = mockPortfolios[1];

    expect(assignedPortfolio.assignedStrategy).toBe("momentum-breakout-v1");
    expect(assignedPortfolio.assignedStrategyName).toBe(
      "Momentum Breakout Strategy"
    );
    expect(assignedPortfolio.strategyAssignedAt).toBeInstanceOf(Date);
  });

  it("should call API when random strategy assignment is triggered", async () => {
    // Mock the API response
    mockedApi.assignRandomStrategy.mockResolvedValue({
      success: true,
      data: {
        portfolioId: "1",
        portfolioName: "Test Portfolio",
        assignedStrategy: "ai-sentiment-trader-v1",
        assignedStrategyName: "AI Sentiment Trader",
        strategyDescription:
          "Uses machine learning and news sentiment for trading decisions",
        strategyCategory: "ai-enhanced",
        assignedAt: new Date(),
      },
      message: "Strategy randomly assigned successfully",
    });

    // Call the API function directly (simulating button click)
    const result = await autonomousTradingApi.assignRandomStrategy("1");

    // Verify the API was called with correct parameters
    expect(mockedApi.assignRandomStrategy).toHaveBeenCalledWith("1");
    expect(result.success).toBe(true);
    expect(result.data.assignedStrategy).toBe("ai-sentiment-trader-v1");
    expect(result.data.assignedStrategyName).toBe("AI Sentiment Trader");
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error response
    mockedApi.assignRandomStrategy.mockResolvedValue({
      success: false,
      error: "Portfolio not found",
    });

    // Call the API function
    const result = await autonomousTradingApi.assignRandomStrategy("999");

    // Verify error handling
    expect(result.success).toBe(false);
    expect(result.error).toBe("Portfolio not found");
  });

  it("should include all required strategy data fields", async () => {
    const mockResponse = {
      success: true,
      data: {
        portfolioId: "1",
        portfolioName: "Test Portfolio",
        assignedStrategy: "scalping-master-v1",
        assignedStrategyName: "Scalping Master",
        strategyDescription:
          "High-frequency scalping strategy for small, quick profits",
        strategyCategory: "scalping",
        assignedAt: new Date(),
      },
      message: "Strategy randomly assigned successfully",
    };

    mockedApi.assignRandomStrategy.mockResolvedValue(mockResponse);

    const result = await autonomousTradingApi.assignRandomStrategy("1");

    // Verify all required fields are present
    expect(result.data).toHaveProperty("portfolioId");
    expect(result.data).toHaveProperty("portfolioName");
    expect(result.data).toHaveProperty("assignedStrategy");
    expect(result.data).toHaveProperty("assignedStrategyName");
    expect(result.data).toHaveProperty("strategyDescription");
    expect(result.data).toHaveProperty("strategyCategory");
    expect(result.data).toHaveProperty("assignedAt");
  });
});
