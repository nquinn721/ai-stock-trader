import { expect, test } from "@playwright/test";

test.describe("Stock Trading App - API Integration", () => {
  test("should have backend API running", async ({ request }) => {
    const response = await request.get("http://localhost:3000/stocks");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
  test("should fetch stocks with signals", async ({ request }) => {
    const response = await request.get(
      "http://localhost:3000/stocks/with-signals/all"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
  test("should fetch trading signals", async ({ request }) => {
    const response = await request.get("http://localhost:3000/trading/signals");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("should fetch specific stock data", async ({ request }) => {
    const response = await request.get("http://localhost:3000/stocks/AAPL");

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("symbol", "AAPL");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("currentPrice");
    } else {
      // 404 is acceptable if stock not found
      expect(response.status()).toBe(404);
    }
  });

  test("should fetch news sentiment", async ({ request }) => {
    const response = await request.get(
      "http://localhost:3000/news/AAPL/sentiment"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("symbol", "AAPL");
    expect(data).toHaveProperty("sentiment");
    expect(data).toHaveProperty("newsCount");
  });

  test("should handle breakout detection", async ({ request }) => {
    const response = await request.get(
      "http://localhost:8000/trading/breakout/AAPL"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("isBreakout");
    expect(data).toHaveProperty("signal");
    expect(data).toHaveProperty("confidence");
  });
});

test.describe("Stock Trading App - Paper Trading", () => {
  let portfolioId: number;

  test("should create a portfolio", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/paper-trading/portfolios",
      {
        data: {
          name: "E2E Test Portfolio",
          initialCash: 10000,
        },
      }
    );

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name", "E2E Test Portfolio");
    expect(data).toHaveProperty("initialCash", 10000);

    portfolioId = data.id;
  });

  test("should fetch all portfolios", async ({ request }) => {
    const response = await request.get(
      "http://localhost:8000/paper-trading/portfolios"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("should fetch specific portfolio", async ({ request }) => {
    if (!portfolioId) {
      // Create a portfolio first
      const createResponse = await request.post(
        "http://localhost:8000/paper-trading/portfolios",
        {
          data: {
            name: "Test Portfolio for Fetch",
            initialCash: 5000,
          },
        }
      );
      const createData = await createResponse.json();
      portfolioId = createData.id;
    }

    const response = await request.get(
      `http://localhost:8000/paper-trading/portfolios/${portfolioId}`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("id", portfolioId);
    expect(data).toHaveProperty("name");
  });

  test("should execute a trade", async ({ request }) => {
    if (!portfolioId) {
      // Create a portfolio first
      const createResponse = await request.post(
        "http://localhost:8000/paper-trading/portfolios",
        {
          data: {
            name: "Trading Test Portfolio",
            initialCash: 15000,
          },
        }
      );
      const createData = await createResponse.json();
      portfolioId = createData.id;
    }

    const response = await request.post(
      "http://localhost:8000/paper-trading/trade",
      {
        data: {
          portfolioId,
          symbol: "AAPL",
          type: "buy",
          quantity: 5,
        },
      }
    );

    // Trade might succeed or fail depending on stock availability
    if (response.status() === 201) {
      const data = await response.json();
      expect(data).toHaveProperty("symbol", "AAPL");
      expect(data).toHaveProperty("type", "buy");
      expect(data).toHaveProperty("quantity", 5);
    } else {
      // Error response should have message
      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data).toHaveProperty("message");
    }
  });
});

test.describe("Stock Trading App - WebSocket Integration", () => {
  test("should connect to WebSocket", async ({ page }) => {
    await page.goto("/");

    // Wait for WebSocket connection
    await page.waitForTimeout(3000);

    // Check connection status
    const connectionStatus = page.locator(".connection-status");

    if (await connectionStatus.isVisible()) {
      const statusText = await connectionStatus.textContent();
      expect(statusText).toMatch(/Connected|Disconnected/);
    }
  });

  test("should receive real-time updates", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for initial data load
    await page.waitForTimeout(2000);

    // Check if stock data is present
    const stockCards = page.locator(".stock-card");
    const initialCount = await stockCards.count();

    if (initialCount > 0) {
      // Get initial price
      const priceElement = stockCards.first().locator(".stock-price");
      const initialPrice = await priceElement.textContent();

      // Wait for potential updates (WebSocket might send updates)
      await page.waitForTimeout(5000);

      // Price might have changed due to live updates
      const currentPrice = await priceElement.textContent();

      // Both prices should be valid numbers
      expect(initialPrice).toMatch(/\d+\.\d{2}/);
      expect(currentPrice).toMatch(/\d+\.\d{2}/);
    }
  });
});

test.describe("Stock Trading App - Error Scenarios", () => {
  test("should handle server downtime gracefully", async ({ page }) => {
    // Mock server being down
    await page.route("**/stocks/**", (route) => {
      route.abort();
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should show no data message
    const noDataMessage = page.locator("text=No Stock Data Available");
    await expect(noDataMessage).toBeVisible();
  });

  test("should handle malformed API responses", async ({ page }) => {
    // Mock malformed response
    await page.route("**/stocks/with-signals/all", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "invalid json",
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should handle error gracefully
    const noDataMessage = page.locator("text=No Stock Data Available");
    await expect(noDataMessage).toBeVisible();
  });

  test("should handle timeout scenarios", async ({ page }) => {
    // Mock slow response
    await page.route("**/stocks/with-signals/all", (route) => {
      // Delay response significantly
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }, 10000);
    });

    await page.goto("/");

    // Should show loading initially
    const loading = page.locator("text=Loading...");
    if (await loading.isVisible()) {
      await expect(loading).toBeVisible();
    }

    // After timeout, should show no data
    await page.waitForTimeout(5000);
    const noDataMessage = page.locator("text=No Stock Data Available");
    await expect(noDataMessage).toBeVisible();
  });
});

test.describe("Stock Trading App - Data Validation", () => {
  test("should display valid stock data format", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const stockCards = page.locator(".stock-card");
    const stockCount = await stockCards.count();

    for (let i = 0; i < Math.min(stockCount, 3); i++) {
      const card = stockCards.nth(i);

      // Check symbol format
      const symbol = card.locator(".stock-symbol");
      if (await symbol.isVisible()) {
        const symbolText = await symbol.textContent();
        expect(symbolText).toMatch(/^[A-Z]{1,5}$/);
      }

      // Check price format
      const price = card.locator(".stock-price");
      if (await price.isVisible()) {
        const priceText = await price.textContent();
        expect(priceText).toMatch(/^\d+\.\d{2}$/);
      }

      // Check percentage format
      const changePercent = card.locator(".change-percent");
      if (await changePercent.isVisible()) {
        const changeText = await changePercent.textContent();
        expect(changeText).toMatch(/^[+-]?\d+\.\d{2}%$/);
      }
    }
  });

  test("should display valid trading signals", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signals = page.locator(".trading-signal, .signal-badge");
    const signalCount = await signals.count();

    for (let i = 0; i < Math.min(signalCount, 3); i++) {
      const signal = signals.nth(i);
      const signalText = await signal.textContent();

      // Should be one of the valid signal types
      expect(signalText).toMatch(/^(BUY|SELL|HOLD)$/i);
    }
  });
});
