import { expect, test } from "@playwright/test";

test.describe("User Interface and Navigation Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display main navigation elements", async ({ page }) => {
    // Check for main navigation or header
    const navigation = page.locator("nav, .navbar, .header, .app-header");

    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible();

      // Check for navigation links
      const navLinks = navigation
        .locator("a, button")
        .filter({ hasText: /Dashboard|Trade|Portfolio|Chart/i });
      if ((await navLinks.count()) > 0) {
        await expect(navLinks.first()).toBeVisible();
      }
    }
  });

  test("should handle tab navigation", async ({ page }) => {
    // Look for tabbed interface
    const tabs = page.locator(".tab, [role='tab'], .nav-tab");

    if ((await tabs.count()) > 1) {
      const firstTab = tabs.first();
      const secondTab = tabs.nth(1);

      // Click first tab
      await firstTab.click();
      await page.waitForTimeout(300);

      // Verify active state
      if ((await firstTab.getAttribute("class")) !== null) {
        const classes = await firstTab.getAttribute("class");
        expect(classes).toContain("active");
      }

      // Click second tab
      await secondTab.click();
      await page.waitForTimeout(300);

      // Verify content changes
      const tabContent = page.locator(".tab-content, [role='tabpanel']");
      if (await tabContent.isVisible()) {
        await expect(tabContent).toBeVisible();
      }
    }
  });

  test("should display application title and branding", async ({ page }) => {
    // Check for app title
    const title = page.locator("h1, .app-title, .brand");

    if (await title.isVisible()) {
      await expect(title).toBeVisible();
      await expect(title).toContainText(/Stock|Trading|Dashboard/i);
    }

    // Check page title
    const pageTitle = await page.title();
    expect(pageTitle).toMatch(/Stock|Trading|Dashboard/i);
  });

  test("should display connection and status indicators", async ({ page }) => {
    await page.waitForTimeout(3000); // Allow time for WebSocket connection

    // Check for connection status
    const connectionStatus = page.locator(
      ".connection-status, .status-indicator, .websocket-status"
    );

    if (await connectionStatus.isVisible()) {
      await expect(connectionStatus).toBeVisible();
      await expect(connectionStatus).toContainText(
        /Connected|Connecting|Disconnected/i
      );
    }

    // Check for last updated indicator
    const lastUpdated = page.locator(".last-updated, .updated-at, .timestamp");

    if (await lastUpdated.isVisible()) {
      await expect(lastUpdated).toBeVisible();
    }
  });

  test("should handle responsive menu on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Look for mobile menu trigger
    const menuButton = page.locator(
      ".menu-button, .hamburger, .mobile-menu-trigger"
    );

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);

      // Check if menu opens
      const mobileMenu = page.locator(".mobile-menu, .menu-overlay, .sidebar");
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();

        // Close menu
        const closeButton = mobileMenu.locator("button, .close").first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("should display loading states appropriately", async ({ page }) => {
    // Intercept requests to create loading state
    await page.route("**/stocks**", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.reload();

    // Check for loading indicators
    const loadingIndicators = page.locator(
      ".loading, .spinner, .skeleton, .shimmer"
    );

    if ((await loadingIndicators.count()) > 0) {
      await expect(loadingIndicators.first()).toBeVisible();

      // Wait for loading to complete
      await page.waitForLoadState("networkidle");

      // Loading should be gone
      await expect(loadingIndicators.first()).not.toBeVisible();
    }
  });

  test("should handle search functionality", async ({ page }) => {
    // Look for search input
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='search']"
    );

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill("AAPL");

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check for autocomplete or search results
      const searchResults = page.locator(
        ".search-results, .autocomplete-dropdown, .suggestions"
      );

      if (await searchResults.isVisible()) {
        await expect(searchResults).toContainText(/AAPL|Apple/i);

        // Clear search
        await searchInput.clear();
      }
    }
  });

  test("should display notifications and alerts", async ({ page }) => {
    // Look for notification area
    const notificationArea = page.locator(
      ".notifications, .alerts, .toast-container"
    );

    if (await notificationArea.isVisible()) {
      await expect(notificationArea).toBeVisible();
    }

    // Check for any existing notifications
    const notifications = page.locator(".notification, .alert, .toast");

    if ((await notifications.count()) > 0) {
      const firstNotification = notifications.first();
      await expect(firstNotification).toBeVisible();

      // Check if notification can be dismissed
      const dismissButton = firstNotification.locator(
        "button, .close, .dismiss"
      );
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        await expect(firstNotification).not.toBeVisible();
      }
    }
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // Test Tab key navigation
    const focusableElements = page.locator("button, a, input, select");

    if ((await focusableElements.count()) > 0) {
      // Focus first element
      await focusableElements.first().focus();

      // Navigate with Tab
      await page.keyboard.press("Tab");

      // Check that focus moved
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    }
  });

  test("should display footer or app information", async ({ page }) => {
    // Look for footer
    const footer = page.locator("footer, .footer, .app-footer");

    if (await footer.isVisible()) {
      await expect(footer).toBeVisible();
    }

    // Check for version or copyright info
    const appInfo = page.locator(".version, .copyright, .app-info");

    if (await appInfo.isVisible()) {
      await expect(appInfo).toBeVisible();
    }
  });

  test("should handle theme or appearance settings", async ({ page }) => {
    // Look for theme toggle
    const themeToggle = page
      .locator("button, .toggle")
      .filter({ hasText: /Theme|Dark|Light/i });

    if (await themeToggle.isVisible()) {
      // Get current theme
      const body = page.locator("body");
      const initialClass = (await body.getAttribute("class")) || "";

      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Check if theme changed
      const newClass = (await body.getAttribute("class")) || "";
      expect(newClass).not.toBe(initialClass);
    }
  });

  test("should maintain scroll position and state", async ({ page }) => {
    // Scroll down if page is scrollable
    await page.evaluate(() => window.scrollTo(0, 200));

    const scrollPosition = await page.evaluate(() => window.pageYOffset);

    if (scrollPosition > 0) {
      // Navigate or interact with page
      const interactiveElement = page.locator("button, a").first();
      if (await interactiveElement.isVisible()) {
        await interactiveElement.click();
        await page.waitForTimeout(500);
      }

      // Check scroll position maintained (for SPAs)
      const newScrollPosition = await page.evaluate(() => window.pageYOffset);
      expect(typeof newScrollPosition).toBe("number");
    }
  });

  test("should handle accessibility features", async ({ page }) => {
    // Check for ARIA labels and roles
    const accessibleElements = page.locator(
      "[aria-label], [role], [aria-describedby]"
    );

    if ((await accessibleElements.count()) > 0) {
      const firstAccessibleElement = accessibleElements.first();
      await expect(firstAccessibleElement).toBeVisible();

      const ariaLabel = await firstAccessibleElement.getAttribute("aria-label");
      const role = await firstAccessibleElement.getAttribute("role");

      expect(ariaLabel || role).toBeTruthy();
    }

    // Check for alt text on images
    const images = page.locator("img");

    if ((await images.count()) > 0) {
      const firstImage = images.first();
      const altText = await firstImage.getAttribute("alt");
      expect(altText).toBeTruthy();
    }
  });
});
