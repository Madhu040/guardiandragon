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
  projects: [
    // Existing desktop suite (projector, camera, accessibility, demo-mode…) — untouched.
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    // Touch-emulated device (spec: mobile support, scoped 2026-07-20). Pixel 5 rather
    // than an iPhone preset deliberately — Playwright's iOS device presets default to
    // WebKit, a second browser engine this project doesn't otherwise install/run in CI;
    // Android presets default to Chromium, so this reuses the browser already installed
    // and needs no new CI step, while still exercising real touch/coarse-pointer/portrait
    // emulation. Real iOS Safari verification stays a manual device-testing task — same
    // caveat the projector suite already carries for the real venue projector.
    // Restricted to its own spec file — the rest of the suite assumes desktop viewport
    // sizes and mouse clicks, so it shouldn't also run under mobile emulation.
    { name: "mobile", use: { ...devices["Pixel 5"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
