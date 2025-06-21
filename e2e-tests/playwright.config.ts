import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: false,
  retries: 2,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001", // Frontend URL
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: [
    {
      command: "cd ../backend && npm run start:dev",
      port: 3000, // Backend port
      reuseExistingServer: true,
    },
    {
      command: "cd ../frontend && npm start",
      port: 3001, // Frontend port
      reuseExistingServer: true,
    },
  ],
});
