import { defineConfig } from "@playwright/test"

/** Browser integration tests for the design reader. Uses the system Chromium; override with STEPWISE_CHROMIUM. */
export default defineConfig({
  testDir: "test/browser",
  fullyParallel: true,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    headless: true,
    viewport: { width: 1600, height: 1000 },
    launchOptions: { executablePath: process.env.STEPWISE_CHROMIUM ?? "/usr/sbin/chromium" },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
})
