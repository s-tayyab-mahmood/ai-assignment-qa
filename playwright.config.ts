import { defineConfig, devices } from '@playwright/test';
import { env } from './config/environment';

/**
 * Reporters: list (console), HTML, JSON and JUnit. The JSON report is the primary input to the
 * RCA collector (tools/rca/collect.ts); JUnit is for CI test summaries.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: env.isCI,
  // Restrained retries: one retry in CI so flakiness is *measured* (retry count feeds the
  // scorecard and RCA), never zero-tolerance hidden by many retries.
  retries: env.isCI ? 1 : 0,
  workers: env.workers,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    testIdAttribute: 'data-qa',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      // ApiClient builds absolute URLs from env.apiUrl; no browser is launched for this project.
      use: { baseURL: env.baseUrl },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'integration',
      testDir: './tests/integration',
      use: { ...devices['Desktop Chrome'] },
    },
    // Controlled fault-injection exercises (FI-02/FI-03). Only active when FAULT_INJECTION=1 so
    // they never pollute normal or scheduled runs.
    ...(env.faultInjection
      ? [
          {
            name: 'fault-injection',
            testDir: './tests/fault-injection',
            retries: 0,
            use: { ...devices['Desktop Chrome'] },
          },
        ]
      : []),
  ],
});
