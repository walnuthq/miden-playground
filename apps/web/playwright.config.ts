import { defineConfig, devices } from "@playwright/test";

// End-to-end tutorial tests. They run against a live Playground on testnet,
// so transactions are proven and submitted for real: expect minutes per test.
//
// PLAYWRIGHT_BASE_URL selects the deployment (default: local dev server, which
// must already be running, along with apps/api for tutorials that compile
// scripts).
export default defineConfig({
  testDir: "./e2e",
  // Tutorials share testnet accounts (faucets, wallets of the tutorial
  // stores): run them one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 10 * 60_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    // Transactions get their own longer timeouts; anything else that takes
    // this long is a locator that will never match.
    actionTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Set after the device preset, which would otherwise override it.
        // Narrower viewports switch the sidebar and tutorial panel to their
        // mobile layout.
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
