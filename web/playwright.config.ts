import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local first, then .env.test.local can override
config({ path: path.resolve(__dirname, '.env.local') });
config({ path: path.resolve(__dirname, '.env.test.local'), override: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
