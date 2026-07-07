import { defineConfig, devices } from "@playwright/test";

// E2E mobile-first (iPhone) sur Chromium.
// Requiert DATABASE_URL + SESSION_SECRET dans l'environnement (cf. CI).
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3000",
    // Émulation iPhone mais moteur Chromium : le device iPhone 13 pointe sur
    // WebKit par défaut, or seul Chromium est installé en CI.
    ...devices["iPhone 13"],
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
