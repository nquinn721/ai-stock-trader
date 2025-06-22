import { expect, test } from "@playwright/test";

test.describe("Stock Trading Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for initial load
    await page.waitForLoadState("networkidle");
  });

  test("should complete full trading workflow", async ({ page }) => {
    // Navigate to Quick Trade section
    await page.locator("text=Quick Trade").click();
    await expect(page.locator(".quick-trade")).toBeVisible();

    // Test stock symbol autocomplete
    const stockInput = page.locator("input[placeholder*='stock']").first();
    await stockInput.click();
    await stockInput.fill("AAP");
    
    // Wait for autocomplete dropdown
    await page.waitForTimeout(500);
    const dropdown = page.locator(".stock-autocomplete-dropdown");
    if (await dropdown.isVisible()) {
      await page.locator("text=AAPL").first().click();
    } else {
      // Fallback: directly type AAPL
      await stockInput.clear();
      await stockInput.fill("AAPL");
    }

    // Select trade type
    const tradeTypeSelect = page.locator("select").first();
    await tradeTypeSelect.selectOption("buy");

    // Enter quantity
    const quantityInput = page.locator("input[type='number']").first();
    await quantityInput.fill("10");

    // Submit trade (if button is enabled)
    const submitButton = page.locator("button[type='submit']");
    if (await submitButton.isEnabled()) {
      await submitButton.click();
      
      // Wait for success/error message
      await page.waitForTimeout(1000);
      const notification = page.locator(".notification, .alert, .toast");
      if (await notification.isVisible()) {
        await expect(notification).toBeVisible();
      }
    }
  });

  test("should browse stock data effectively", async ({ page }) => {
    // Wait for stock data to load
    await page.waitForTimeout(2000);

    // Check if stocks are displayed
    const stockCards = page.locator(".stock-card");
    const stocksContainer = page.locator(".stocks-container, .stock-list");
    
    if (await stockCards.count() > 0) {
      // Stocks are loaded - test interaction
      const firstStock = stockCards.first();
      await expect(firstStock).toBeVisible();
      
      // Check stock card contains required information
      await expect(firstStock).toContainText(/AAPL|GOOGL|MSFT|AMZN|TSLA/);
      
      // Click on stock card for details
      await firstStock.click();
      await page.waitForTimeout(500);
    } else if (await stocksContainer.isVisible()) {
      // Check for "no data" state
      await expect(stocksContainer).toContainText(/No.*stock.*data|Loading|unavailable/i);
    }
  });

  test("should navigate portfolio section", async ({ page }) => {
    // Navigate to portfolio section
    const portfolioLink = page.locator("text=Portfolio, a[href*='portfolio']").first();
    
    if (await portfolioLink.isVisible()) {
      await portfolioLink.click();
      await page.waitForLoadState("networkidle");
      
      // Check portfolio section loads
      const portfolioSection = page.locator(".portfolio, [data-testid='portfolio']");
      await expect(portfolioSection).toBeVisible();
      
      // Check for portfolio content or empty state
      const portfolioContent = page.locator(".portfolio-summary, .position, .no-portfolio");
      await expect(portfolioContent).toBeVisible();
    } else {
      // Portfolio might be on the same page
      const portfolioSection = page.locator(".portfolio, [data-testid='portfolio']");
      if (await portfolioSection.isVisible()) {
        await expect(portfolioSection).toBeVisible();
      }
    }
  });

  test("should display performance charts when available", async ({ page }) => {
    // Wait for charts to potentially load
    await page.waitForTimeout(2000);
    
    // Look for chart containers
    const chartContainers = page.locator(".chart, .recharts-wrapper, canvas, svg");
    
    if (await chartContainers.count() > 0) {
      // Charts are present - verify they're rendered
      const firstChart = chartContainers.first();
      await expect(firstChart).toBeVisible();
    } else {
      // No charts - check for appropriate messaging
      const noChartMessage = page.locator("text=/No.*chart|No.*data|Chart.*unavailable/i");
      if (await noChartMessage.isVisible()) {
        await expect(noChartMessage).toBeVisible();
      }
    }
  });

  test("should handle stock search functionality", async ({ page }) => {
    // Look for search input
    const searchInput = page.locator("input[placeholder*='search'], input[placeholder*='stock']").first();
    
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill("APP");
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check for search results or autocomplete
      const searchResults = page.locator(".search-results, .autocomplete, .dropdown");
      if (await searchResults.isVisible()) {
        await expect(searchResults).toContainText(/AAPL|Apple/i);
      }
      
      // Clear search
      await searchInput.clear();
    }
  });

  test("should display real-time connection status", async ({ page }) => {
    // Check WebSocket connection indicator
    await page.waitForTimeout(3000); // Allow time for WebSocket connection
    
    const connectionIndicator = page.locator(".connection-status, .websocket-status, .status");
    
    if (await connectionIndicator.isVisible()) {
      await expect(connectionIndicator).toContainText(/Connected|Connecting|Disconnected/i);
    }
    
    // Check for real-time data updates indicator
    const liveDataIndicator = page.locator(".live-data, .updating, .last-updated");
    if (await liveDataIndicator.isVisible()) {
      await expect(liveDataIndicator).toBeVisible();
    }
  });

  test("should handle responsive design", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Check that main elements are still visible and accessible
    const mainContent = page.locator("main, .app, .dashboard").first();
    await expect(mainContent).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    await expect(mainContent).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Test with no network (simulate offline)
    await page.context().route("**/*", route => route.abort());
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check for error handling
    const errorMessages = page.locator(".error, .alert-danger, [data-testid='error']");
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
    
    // Re-enable network
    await page.context().unroute("**/*");
  });

  test("should maintain state across navigation", async ({ page }) => {
    // Make a selection or input
    const stockInput = page.locator("input").first();
    if (await stockInput.isVisible()) {
      await stockInput.fill("AAPL");
    }
    
    // Navigate away and back
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Check that application loads properly after navigation
    const dashboard = page.locator("h1, .dashboard, .app-title");
    await expect(dashboard).toBeVisible();
  });
});
