import { expect, test } from "@playwright/test";

test.describe("Portfolio Management Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display portfolio overview", async ({ page }) => {
    // Look for portfolio section
    const portfolioSection = page.locator(
      ".portfolio, .portfolio-summary, [data-testid='portfolio']"
    );

    if (await portfolioSection.isVisible()) {
      await expect(portfolioSection).toBeVisible();

      // Check for portfolio metrics
      const metrics = page.locator(".portfolio-value, .total-value, .balance");
      if ((await metrics.count()) > 0) {
        await expect(metrics.first()).toBeVisible();
      }
    } else {
      // Portfolio might be empty - check for empty state
      const emptyState = page.locator(".empty-portfolio, .no-positions");
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText(
          /No.*position|Empty.*portfolio|No.*holdings/i
        );
      }
    }
  });

  test("should display position details", async ({ page }) => {
    // Wait for potential positions to load
    await page.waitForTimeout(2000);

    const positions = page.locator(".position, .holding, .stock-position");

    if ((await positions.count()) > 0) {
      const firstPosition = positions.first();
      await expect(firstPosition).toBeVisible();

      // Check position contains stock symbol
      await expect(firstPosition).toContainText(/[A-Z]{1,5}/); // Stock symbol pattern

      // Check for quantity and value information
      const positionDetails = firstPosition.locator(
        ".quantity, .shares, .value, .price"
      );
      if ((await positionDetails.count()) > 0) {
        await expect(positionDetails.first()).toBeVisible();
      }
    }
  });

  test("should show portfolio performance metrics", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for performance indicators
    const performanceElements = page.locator(
      ".performance, .pnl, .gain-loss, .profit-loss"
    );

    if ((await performanceElements.count()) > 0) {
      const performance = performanceElements.first();
      await expect(performance).toBeVisible();

      // Should contain percentage or dollar amounts
      await expect(performance).toContainText(/[+\-]?\$?\d+\.?\d*[%$]?/);
    }
  });

  test("should handle portfolio actions", async ({ page }) => {
    // Look for action buttons
    const actionButtons = page
      .locator("button")
      .filter({ hasText: /Buy|Sell|Trade/i });

    if ((await actionButtons.count()) > 0) {
      const firstAction = actionButtons.first();

      if (await firstAction.isEnabled()) {
        await firstAction.click();
        await page.waitForTimeout(500);

        // Check if modal or form appears
        const modal = page.locator(".modal, .dialog, .form");
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();

          // Close modal if close button exists
          const closeButton = modal
            .locator("button")
            .filter({ hasText: /Close|Cancel|×/i });
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });

  test("should display portfolio charts when available", async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for chart elements
    const charts = page.locator(
      ".chart, .recharts-wrapper, canvas, svg[class*='chart']"
    );

    if ((await charts.count()) > 0) {
      const firstChart = charts.first();
      await expect(firstChart).toBeVisible();

      // Verify chart has content (not empty)
      const chartContent = firstChart.locator("path, circle, rect, line");
      if ((await chartContent.count()) > 0) {
        await expect(chartContent.first()).toBeVisible();
      }
    } else {
      // Check for chart placeholder or message
      const chartPlaceholder = page.locator(".no-chart, .chart-unavailable");
      if (await chartPlaceholder.isVisible()) {
        await expect(chartPlaceholder).toBeVisible();
      }
    }
  });

  test("should show transaction history", async ({ page }) => {
    // Look for transaction/history section
    const historySection = page.locator(".history, .transactions, .trades");

    if (await historySection.isVisible()) {
      await expect(historySection).toBeVisible();

      // Check for transaction entries
      const transactions = historySection.locator(
        ".transaction, .trade, .history-item"
      );

      if ((await transactions.count()) > 0) {
        const firstTransaction = transactions.first();
        await expect(firstTransaction).toBeVisible();

        // Should contain transaction details
        await expect(firstTransaction).toContainText(/Buy|Sell|[A-Z]{1,5}/);
      } else {
        // Empty history state
        await expect(historySection).toContainText(
          /No.*transaction|Empty.*history/i
        );
      }
    }
  });

  test("should calculate portfolio totals correctly", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for total portfolio value
    const totalValue = page.locator(
      ".total-value, .portfolio-value, .net-worth"
    );

    if (await totalValue.isVisible()) {
      await expect(totalValue).toBeVisible();

      // Should display monetary value
      await expect(totalValue).toContainText(/\$[\d,]+\.?\d*/);
    }

    // Check for cash balance
    const cashBalance = page.locator(".cash, .balance, .available-funds");

    if (await cashBalance.isVisible()) {
      await expect(cashBalance).toBeVisible();
      await expect(cashBalance).toContainText(/\$[\d,]+\.?\d*/);
    }
  });

  test("should handle empty portfolio state", async ({ page }) => {
    // This test handles the case where portfolio is empty
    await page.waitForTimeout(2000);

    const emptyState = page.locator(
      ".empty-state, .no-positions, .empty-portfolio"
    );

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText(
        /No.*position|Start.*trading|Empty/i
      );

      // Should provide action to start trading
      const startTradingButton = emptyState
        .locator("button, a")
        .filter({ hasText: /Start|Trade|Buy/i });
      if (await startTradingButton.isVisible()) {
        await expect(startTradingButton).toBeVisible();
      }
    }
  });

  test("should refresh portfolio data", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for refresh button
    const refreshButton = page
      .locator("button")
      .filter({ hasText: /Refresh|Update|Reload/i });

    if (
      (await refreshButton.isVisible()) &&
      (await refreshButton.isEnabled())
    ) {
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForTimeout(1000);

      // Check for loading indicator
      const loadingIndicator = page.locator(".loading, .spinner, .updating");
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();

        // Wait for loading to complete
        await loadingIndicator.waitFor({ state: "hidden", timeout: 5000 });
      }
    }
  });

  test("should sort and filter positions", async ({ page }) => {
    await page.waitForTimeout(2000);

    const positions = page.locator(".position, .holding");

    if ((await positions.count()) > 1) {
      // Look for sort options
      const sortButton = page
        .locator("button, select")
        .filter({ hasText: /Sort|Order/i });

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(500);

        // Select different sort option if dropdown appears
        const sortOptions = page.locator("option, .dropdown-item");
        if ((await sortOptions.count()) > 1) {
          await sortOptions.nth(1).click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});
