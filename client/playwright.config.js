import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 * Auto-starts both the backend and frontend dev servers.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Run tests sequentially to avoid data conflicts (JSON file storage)
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Auto-start backend then frontend before running tests
  webServer: [
    {
      command: "cd ../server && npm start",
      url: "http://localhost:5001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
