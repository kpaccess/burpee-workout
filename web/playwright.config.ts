import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local first, then .env.test.local can override
config({ path: path.resolve(__dirname, '.env.local') });
config({ path: path.resolve(__dirname, '.env.test.local'), override: true });

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'html',
  globalSetup: useEmulator ? './tests/global-setup.ts' : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/smoke.spec.ts',
    },
    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.burpeepacers.com',
      },
      testMatch: '**/smoke.spec.ts',
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    ...(useEmulator
      ? [
          {
            // Run from repo root where firebase.json lives
            command: 'cd .. && firebase emulators:start --only auth,firestore --project burpee-workout',
            url: 'http://127.0.0.1:8080',
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ]
      : []),
  ],
});
