import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname, '.env.playwright') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: 'e2e tests chromium',
      use: {...devices['Desktop Chrome']},
      dependencies: ['setup']
    },

    {
      name: 'e2e tests firefox',
      use: {...devices['Desktop Firefox']},
      dependencies: ['setup']
    },

    {
      name: 'e2e tests webkit',
      use: {...devices['Desktop Safari']},
      dependencies: ['setup']
    },
  ],
    webServer: [
    {
      command: 'npm run start',
      cwd: '../backend',
      url: 'http://localhost:3000/healthz',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev -- --mode playwright',
      cwd: './',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
