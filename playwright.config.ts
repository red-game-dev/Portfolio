import { defineConfig } from "@playwright/test";

// Layout checks in a real browser, which jsdom cannot do: the HUD lab measured at every screen size. The deployment to
// check comes from HUD_LAB_URL (each Vercel preview in CI, `.github/workflows/hud.yml`); a local server otherwise.
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  // PLAYWRIGHT_CHANNEL=chrome runs the Chrome already installed instead of downloading Playwright's own.
  use: { baseURL: process.env.HUD_LAB_URL ?? "http://localhost:3000", browserName: "chromium", channel: process.env.PLAYWRIGHT_CHANNEL },
});
