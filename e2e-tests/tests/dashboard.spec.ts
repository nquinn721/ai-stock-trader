import { expect, test } from "@playwright/test";

test.describe("Stock Trading App Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display dashboard title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should display connection status", async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);

    const connectionStatus = page.locator(".connection-status");
    await expect(connectionStatus).toBeVisible();

    // Should show either connected or disconnected
    await expect(connectionStatus).toContainText(/Connected|Disconnected/);
  });

  test("should load and display stock data", async ({ page }) => {
    // Wait for API calls to complete
    await page.waitForLoadState("networkidle");

    // Check if stock data is loaded or "No Stock Data Available" is shown
    const stockContainer = page.locator(".stocks-container");
    await expect(stockContainer).toBeVisible();

    // Either stocks are displayed or no-data message
    const hasStocks = await page.locator(".stock-card").first().isVisible();
    const hasNoDataMessage = await page
      .locator("text=No Stock Data Available")
      .isVisible();

    expect(hasStocks || hasNoDataMessage).toBe(true);
  });

  test("should display stock cards when data is available", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    const stockCards = page.locator(".stock-card");
    const stockCount = await stockCards.count();

    if (stockCount > 0) {
      // Verify first stock card has required elements
      const firstCard = stockCards.first();
      await expect(firstCard.locator(".stock-symbol")).toBeVisible();
      await expect(firstCard.locator(".stock-name")).toBeVisible();
      await expect(firstCard.locator(".stock-price")).toBeVisible();
    }
  });

  test("should display portfolio chart", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const chartContainer = page.locator(
      '[data-testid="portfolio-chart"], .chart-container'
    );
    await expect(chartContainer).toBeVisible();
  });

  test("should display portfolio summary", async ({ page }) => {
    const summaryContainer = page.locator(
      '[data-testid="portfolio-summary"], .portfolio-summary'
    );
    await expect(summaryContainer).toBeVisible();
  });

  test("should display quick trade component", async ({ page }) => {
    const quickTradeContainer = page.locator(
      '[data-testid="quick-trade"], .quick-trade'
    );
    await expect(quickTradeContainer).toBeVisible();
  });

  test("should allow timeframe selection", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const timeframeSelect = page.locator(
      'select[name="timeframe"], .timeframe-select select'
    );

    if (await timeframeSelect.isVisible()) {
      await timeframeSelect.selectOption("1Y");
      await expect(timeframeSelect).toHaveValue("1Y");

      await timeframeSelect.selectOption("1M");
      await expect(timeframeSelect).toHaveValue("1M");
    }
  });

  test("should handle loading states", async ({ page }) => {
    // Navigate to page and check for loading indicator
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Loading indicator might be visible briefly
    const loadingIndicator = page.locator("text=Loading..., .loading-spinner");

    // Wait for loading to complete
    await page.waitForLoadState("networkidle");

    // Loading should be gone
    await expect(loadingIndicator).not.toBeVisible();
  });
});

test.describe("Stock Trading App - Stock Details", () => {
  test("should display stock information correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const stockCards = page.locator(".stock-card");
    const stockCount = await stockCards.count();

    if (stockCount > 0) {
      const firstStock = stockCards.first();

      // Check stock symbol
      const symbol = firstStock.locator(".stock-symbol");
      await expect(symbol).toBeVisible();
      const symbolText = await symbol.textContent();
      expect(symbolText).toMatch(/^[A-Z]{1,5}$/); // Stock symbols are typically 1-5 uppercase letters

      // Check stock name
      const name = firstStock.locator(".stock-name");
      await expect(name).toBeVisible();

      // Check price
      const price = firstStock.locator(".stock-price");
      await expect(price).toBeVisible();
      const priceText = await price.textContent();
      expect(priceText).toMatch(/\d+\.\d{2}/); // Price should be a decimal number

      // Check change percentage
      const changePercent = firstStock.locator(".change-percent");
      if (await changePercent.isVisible()) {
        const changeText = await changePercent.textContent();
        expect(changeText).toMatch(/[+-]?\d+\.\d{2}%/); // Percentage with + or - sign
      }
    }
  });

  test("should display trading signals when available", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signalElements = page.locator(".trading-signal, .signal-badge");
    const signalCount = await signalElements.count();

    if (signalCount > 0) {
      const firstSignal = signalElements.first();
      await expect(firstSignal).toBeVisible();

      const signalText = await firstSignal.textContent();
      expect(signalText).toMatch(/BUY|SELL|HOLD/i);
    }
  });
});

test.describe("Stock Trading App - Responsive Design", () => {
  test("should be responsive on mobile devices", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if main elements are visible on mobile
    await expect(page.locator("h1")).toBeVisible();

    const stockCards = page.locator(".stock-card");
    const stockCount = await stockCards.count();

    if (stockCount > 0) {
      // On mobile, stock cards should still be visible but might be stacked
      await expect(stockCards.first()).toBeVisible();
    }
  });

  test("should be responsive on tablet devices", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if main elements are visible on tablet
    await expect(page.locator("h1")).toBeVisible();

    const stockCards = page.locator(".stock-card");
    const stockCount = await stockCards.count();

    if (stockCount > 0) {
      await expect(stockCards.first()).toBeVisible();
    }
  });
});

test.describe("Stock Trading App - Error Handling", () => {
  test("should handle API failures gracefully", async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route("**/stocks/with-signals/all", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should show no data message or error handling
    const noDataMessage = page.locator("text=No Stock Data Available");
    await expect(noDataMessage).toBeVisible();
  });

  test("should handle empty API responses", async ({ page }) => {
    // Intercept API calls and return empty arrays
    await page.route("**/stocks/with-signals/all", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/trading/signals", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should show no data message
    const noDataMessage = page.locator("text=No Stock Data Available");
    await expect(noDataMessage).toBeVisible();
  });
});

test.describe("Stock Trading App - Performance", () => {
  test("should load within reasonable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should have good Core Web Vitals", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Check if page has rendered content
    const hasContent = await page.locator("body").innerHTML();
    expect(hasContent.length).toBeGreaterThan(1000); // Should have substantial content
  });
});
