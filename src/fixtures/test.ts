import { test as base, expect } from '@playwright/test';
import { blockedThirdPartyHosts, env } from '../../config/environment';
import { ApiClient } from '../api/client';
import { buildUser } from '../data/factories';
import type { UserAccount } from '../data/types';
import { App } from '../pages/App';
import { attachLog, log, type LogEntry } from '../utils/logger';

/**
 * Account lifecycle:
 *  - `account`   : a fresh user created via API before the test, always deleted after (even when
 *                  the test fails – Playwright runs fixture teardown on failure).
 *  - `cleanup`   : registry for accounts a test creates itself (e.g. UI signup). Teardown verifies
 *                  each via API and deletes any that still exist; status is attached to the report.
 * No account is ever shared between tests or workers.
 */
interface CleanupRegistry {
  track(user: UserAccount): void;
}

interface Fixtures {
  api: ApiClient;
  app: App;
  account: UserAccount;
  cleanup: CleanupRegistry;
}

export const test = base.extend<Fixtures>({
  // Block third-party ad/consent hosts for every browser context (see config/environment.ts).
  context: async ({ context }, use) => {
    if (env.blockAds) {
      await context.route(
        (url) => blockedThirdPartyHosts.some((re) => re.test(url.hostname + url.pathname)),
        (route) => route.abort('blockedbyclient'),
      );
    }
    await use(context);
  },

  // Deterministic diagnostics for RCA: console errors and failed requests are recorded for every
  // UI test and attached when the test does not pass. Values are redacted by attachLog().
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: LogEntry[] = [];
    const requestFailures: LogEntry[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error')
        consoleErrors.push(log('warn', 'console.error', { text: msg.text().slice(0, 500) }));
    });
    page.on('requestfailed', (req) => {
      const url = new URL(req.url());
      const blocked = req.failure()?.errorText.includes('BLOCKED_BY_CLIENT') ?? false;
      if (blocked) return; // our own ad blocking – expected, not evidence
      requestFailures.push(
        log('warn', 'request.failed', {
          method: req.method(),
          // Path only: no query strings (may carry form values).
          url: `${url.origin}${url.pathname}`,
          resourceType: req.resourceType(),
          error: req.failure()?.errorText ?? 'unknown',
        }),
      );
    });
    page.on('response', (res) => {
      if (res.status() >= 500 && res.url().startsWith(env.baseUrl)) {
        const url = new URL(res.url());
        requestFailures.push(
          log('warn', 'response.5xx', { url: `${url.origin}${url.pathname}`, status: res.status() }),
        );
      }
    });
    await use(page);
    if (testInfo.status !== testInfo.expectedStatus) {
      await attachLog(testInfo, 'console-errors', consoleErrors);
      await attachLog(testInfo, 'network-failures', requestFailures);
    }
  },

  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  app: async ({ page }, use) => {
    await use(new App(page));
  },

  cleanup: async ({ api }, use, testInfo) => {
    const tracked: UserAccount[] = [];
    await use({ track: (u) => tracked.push(u) });
    const entries: LogEntry[] = [];
    for (const user of tracked) {
      entries.push(await deleteIfExists(api, user));
    }
    if (entries.length) await attachLog(testInfo, 'cleanup-log', entries);
  },

  account: async ({ api }, use, testInfo) => {
    const user = buildUser();
    const created = await api.createAccount(user);
    expect(created.body, 'fixture: API account creation').toMatchObject({
      responseCode: 201,
      message: 'User created!',
    });
    const entries: LogEntry[] = [log('info', 'account.created', { scenarioUser: user.name })];
    try {
      await use(user);
    } finally {
      entries.push(await deleteIfExists(api, user));
      await attachLog(testInfo, 'cleanup-log', entries);
    }
  },
});

async function deleteIfExists(api: ApiClient, user: UserAccount): Promise<LogEntry> {
  try {
    const exists = await api.verifyLogin(user.email, user.password);
    if (exists.body.responseCode !== 200) {
      return log('info', 'account.cleanup.already_deleted', { user: user.name });
    }
    const res = await api.deleteAccount(user.email, user.password);
    const ok = res.body.responseCode === 200;
    return log(ok ? 'info' : 'error', ok ? 'account.cleanup.deleted' : 'account.cleanup.failed', {
      user: user.name,
      responseCode: res.body.responseCode,
    });
  } catch (err) {
    // Never throw from cleanup (it would mask the real test result); record it for RCA instead.
    return log('error', 'account.cleanup.error', { user: user.name, error: String(err) });
  }
}

export { expect };
