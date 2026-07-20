import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config — Definition of Done §27 items 1 and 3.
 *
 * Serves the PRODUCTION BUILD (`vite preview`), not the dev server, because the
 * stage-readiness claims in spec §13A are about the built artifact: demo mode must
 * complete "with network fully disabled" using preloaded/bundled assets.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
