# Testing Best Practices - Stock Trading App

## Overview

This document outlines testing best practices for the Stock Trading App, ensuring code quality and reliability across all components.

## Testing Philosophy

> **"Test after every meaningful code change"** - Our core testing principle

### When to Test

1. **After changing service logic** - Run backend unit tests
2. **After modifying components** - Run frontend unit tests
3. **After API changes** - Run integration tests
4. **After WebSocket updates** - Run full test suite
5. **Before committing** - Run complete test suite
6. **After bug fixes** - Add regression tests

## Test Structure

### Backend Testing (`backend/src/**/*.spec.ts`)

```typescript
// Service Testing Pattern
describe("StockService", () => {
  let service: StockService;
  let mockWebSocketGateway: jest.Mocked<StockWebSocketGateway>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: StockWebSocketGateway, useValue: mockWebSocketGateway },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it("should fetch live stock data", async () => {
    const result = await service.getAllStocks();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Frontend Testing (`frontend/src/**/*.test.tsx`)

```typescript
// Component Testing Pattern
import { render, screen, waitFor } from "@testing-library/react";
import { SocketProvider } from "../context/SocketContext";

const MockedSocketProvider = ({ children }: { children: React.ReactNode }) => (
  <SocketProvider>{children}</SocketProvider>
);

describe("Dashboard", () => {
  it("should display stock data when loaded", async () => {
    render(
      <MockedSocketProvider>
        <Dashboard />
      </MockedSocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Stock Trading Dashboard")).toBeInTheDocument();
    });
  });
});
```

### E2E Testing (`e2e-tests/tests/*.spec.ts`)

```typescript
// Playwright E2E Pattern
import { test, expect } from "@playwright/test";

test.describe("Stock Trading Dashboard", () => {
  test("should load and display stock data", async ({ page }) => {
    await page.goto("/");

    // Wait for API call to complete
    await page.waitForResponse("**/stocks/with-signals/all");

    // Verify stock data is displayed
    await expect(page.locator(".stock-card")).toBeVisible();
  });
});
```

## Test Runner Scripts

### Quick Tests (`.\quick-test.ps1`)

- **Use Case**: During active development
- **Coverage**: Backend and frontend unit tests only
- **Duration**: ~30-60 seconds
- **When**: After small code changes

### Full Test Suite (`.\run-all-tests.ps1`)

- **Use Case**: Before committing or deploying
- **Coverage**: Unit, integration, and E2E tests
- **Duration**: ~5-10 minutes
- **When**: Before major commits, releases

### Manual API Testing

```powershell
# Test core endpoints
curl http://localhost:8000/stocks/with-signals/all
curl http://localhost:8000/paper-trading/portfolios
curl http://localhost:8000/trading/signals

# Test WebSocket connection
# Open browser dev tools and check WebSocket connection to localhost:8000
```

## Mocking Best Practices

### Backend Mocking

```typescript
// Mock external APIs (Yahoo Finance)
jest.mock("yahoo-finance2", () => ({
  quote: jest.fn().mockResolvedValue({
    regularMarketPrice: 150.25,
    regularMarketPreviousClose: 148.5,
    regularMarketChangePercent: 1.18,
  }),
}));
```

### Frontend Mocking

```typescript
// Mock API calls
jest.mock("axios", () => ({
  get: jest.fn().mockResolvedValue({
    data: [{ symbol: "AAPL", currentPrice: 150.25, name: "Apple Inc." }],
  }),
}));

// Mock Socket context
const mockSocketContext = {
  isConnected: true,
  stocks: mockStocks,
  tradingSignals: [],
  news: [],
};
```

## Test Coverage Goals

| Component           | Target Coverage | Current Coverage |
| ------------------- | --------------- | ---------------- |
| Backend Services    | 90%             | 85%              |
| Backend Controllers | 90%             | 85%              |
| Frontend Components | 85%             | 80%              |
| API Endpoints       | 100%            | 90%              |
| E2E User Flows      | 95%             | 90%              |

## Testing Checklist

### Before Committing

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] API endpoints respond correctly
- [ ] WebSocket connections stable
- [ ] Performance within acceptable limits

### After Major Changes

- [ ] Full test suite passes
- [ ] E2E tests validate user workflows
- [ ] Error scenarios properly handled
- [ ] Documentation updated
- [ ] Performance benchmarks met

### Bug Fix Protocol

1. **Reproduce the bug** with a failing test
2. **Fix the bug** and make the test pass
3. **Add regression test** to prevent recurrence
4. **Run full test suite** to ensure no side effects
5. **Update documentation** if necessary

## Common Testing Patterns

### Testing Async Operations

```typescript
it("should handle async stock updates", async () => {
  const promise = service.updateStockPrice("AAPL");
  await expect(promise).resolves.toMatchObject({
    symbol: "AAPL",
    currentPrice: expect.any(Number),
  });
});
```

### Testing Error Scenarios

```typescript
it("should handle API failures gracefully", async () => {
  // Mock API failure
  jest.spyOn(yahooFinance, "quote").mockRejectedValue(new Error("API Error"));

  const result = await service.updateStockPrice("INVALID");
  expect(result).toBeNull();
});
```

### Testing WebSocket Events

```typescript
it("should broadcast stock updates via WebSocket", async () => {
  const mockEmit = jest.fn();
  gateway.server = { emit: mockEmit } as any;

  await gateway.broadcastStockUpdate("AAPL", stockData);
  expect(mockEmit).toHaveBeenCalledWith("stock_update", {
    symbol: "AAPL",
    data: stockData,
  });
});
```

## Portfolio Performance Testing

### Backend API Testing

```typescript
describe("PaperTradingController", () => {
  it("should return portfolio performance data", async () => {
    const result = await controller.getPortfolioPerformance(1);
    expect(result).toHaveProperty("performance");
    expect(result.performance).toBeInstanceOf(Array);
  });
});
```

### Frontend Integration Testing

```typescript
describe("PortfolioChart", () => {
  it("should fetch and display performance data", async () => {
    // Mock the API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        performance: [
          { date: "2025-01-01", value: 10000 },
          { date: "2025-01-02", value: 10150 },
        ],
      }),
    });

    render(<PortfolioChart portfolioId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-chart")).toBeInTheDocument();
    });
  });
});
```

## Continuous Testing Strategy

### Development Workflow

1. **Write failing test** (TDD approach when possible)
2. **Implement feature** to make test pass
3. **Run quick tests** (`.\quick-test.ps1`)
4. **Refactor if needed** while tests still pass
5. **Run full suite** before committing

### Integration Points Testing

- **Stock data flow**: API → Service → Controller → Frontend
- **WebSocket updates**: Service → Gateway → Frontend
- **Portfolio data**: Backend persistence → API → Frontend charts
- **Error handling**: API failures → Service recovery → Frontend display

## Performance Testing

### Response Time Benchmarks

- Stock data API: < 200ms
- Portfolio data: < 150ms
- WebSocket events: < 50ms latency
- Database queries: < 100ms

### Load Testing Considerations

- Yahoo Finance API rate limits
- WebSocket connection limits
- Database connection pooling
- Frontend rendering performance

---

_Keep this document updated as testing practices evolve. Review and update quarterly or after major architectural changes._
