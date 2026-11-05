import { defineConfig, devices } from "@playwright/test";

// End-to-end tutorial tests. They run against a live Playground on testnet,
// so transactions are proven and submitted for real: expect minutes per test.
//
// PLAYWRIGHT_BASE_URL selects the deployment (default: local dev server, which
// must already be running, along with apps/api for tutorials that compile
// scripts).
export default defineConfig({
  testDir: "./e2e",
  // Checks the Bread Wallet version (see e2e/global-setup.ts).
  globalSetup: "./e2e/global-setup.ts",
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
      // The desktop layout: the mobile specs run in the projects below.
      testIgnore: /mobile\//,
      use: {
        ...devices["Desktop Chrome"],
        // Set after the device preset, which would otherwise override it.
        // Narrower viewports switch the sidebar and tutorial panel to their
        // mobile layout.
        viewport: { width: 1440, height: 900 },
      },
    },
    // The phone layout (e2e/mobile), on both phone engines: Safari's WebKit
    // (much slower to start the client headless) and Chrome for Android.
    {
      name: "mobile-safari",
      testMatch: /mobile\/.*\.spec\.ts/,
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-chrome",
      testMatch: /mobile\/.*\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    // The narrowest phones (320 px): every page of a sandbox must fit there
    // too.
    {
      name: "mobile-small",
      testMatch: /mobile\/mobile-sandbox\.spec\.ts/,
      use: { ...devices["Galaxy S9+"] },
    },
  ],
});
