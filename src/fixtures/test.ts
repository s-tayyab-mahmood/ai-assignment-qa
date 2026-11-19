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

  // Deterministic diagnostics for RCA, attached only when a test does not pass (redacted by attachLog):
  //  - network-failures : FIRST-PARTY failed requests and 5xx responses (the evidence that matters)
  //  - third-party-failures : other hosts (fonts, CDNs) – context only, never product evidence
  //  - slow-or-pending-requests : first-party requests still open at the end, or slower than 5 s.
  //    This separates "server answered slowly" from "element/locator missing".
  //  - console-errors
  // Entries are collected silently (not printed) to keep the console readable.
  page: async ({ page }, use, testInfo) => {
    const now = () => new Date().toISOString();
    const isFirstParty = (u: URL) => u.hostname.endsWith(new URL(env.baseUrl).hostname);
    const consoleErrors: LogEntry[] = [];
    const firstParty: LogEntry[] = [];
    const thirdParty: LogEntry[] = [];
    const started = new Map<object, { url: string; method: string; type: string; t0: number }>();
    const slow: LogEntry[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error')
        consoleErrors.push({
          ts: now(),
          level: 'warn',
          event: 'console.error',
          data: { text: msg.text().slice(0, 300) },
        });
    });
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (isFirstParty(u))
        started.set(req, {
          url: `${u.origin}${u.pathname}`,
          method: req.method(),
          type: req.resourceType(),
          t0: Date.now(),
        });
    });
    const finish = (req: object) => {
      const r = started.get(req);
      if (!r) return;
      started.delete(req);
      const ms = Date.now() - r.t0;
      if (ms > 5000)
        slow.push({ ts: now(), level: 'warn', event: 'request.slow', data: { ...r, t0: undefined, ms } });
    };
    page.on('requestfinished', finish);
    page.on('requestfailed', (req) => {
      finish(req);
      const u = new URL(req.url());
      const error = req.failure()?.errorText ?? 'unknown';
      if (error.includes('BLOCKED_BY_CLIENT')) return; // our own ad blocking – expected, not evidence
      // Images aborted when the page navigates away are browser housekeeping, not evidence.
      if (error.includes('ERR_ABORTED') && req.resourceType() === 'image') return;
      const entry: LogEntry = {
        ts: now(),
        level: 'warn',
        event: 'request.failed',
        // Path only: no query strings (may carry form values).
        data: {
          method: req.method(),
          url: `${u.origin}${u.pathname}`,
          resourceType: req.resourceType(),
          error,
        },
      };
      (isFirstParty(u) ? firstParty : thirdParty).push(entry);
    });
    page.on('response', (res) => {
      const u = new URL(res.url());
      if (res.status() < 500 || !isFirstParty(u)) return;
      const resourceType = res.request().resourceType();
      firstParty.push({
        ts: now(),
        level: 'warn',
        event: 'response.5xx',
        data: { url: `${u.origin}${u.pathname}`, status: res.status(), resourceType },
      });
      // A 5xx for a whole page (document) means the site served an error page instead of the
      // page under test, e.g. 503 "This website is under heavy load (queue full)" seen on
      // 2026-11-19. Recorded as an annotation so reports and RCA show it explicitly.
      if (resourceType === 'document' && !testInfo.annotations.some((a) => a.type === 'site-unavailable')) {
        testInfo.annotations.push({
          type: 'site-unavailable',
          description: `HTTP ${res.status()} for ${u.pathname}`,
        });
      }
    });

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      const pending = [...started.values()].map((r) => ({
        ts: now(),
        level: 'warn' as const,
        event: 'request.pending',
        data: { url: r.url, method: r.method, type: r.type, openForMs: Date.now() - r.t0 },
      }));
      await attachLog(testInfo, 'network-failures', firstParty);
      await attachLog(testInfo, 'third-party-failures', thirdParty.slice(0, 20));
      await attachLog(testInfo, 'slow-or-pending-requests', [...pending, ...slow].slice(0, 20));
      await attachLog(testInfo, 'console-errors', consoleErrors.slice(0, 20));
    }
  },

  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  app: async ({ page }, use) => {
    await use(new App(page));
  },

  // Own timeout: cleanup retries must not be cut short by (or eat into) the test's timeout.
  cleanup: [
    async ({ api }, use, testInfo) => {
      const tracked: UserAccount[] = [];
      await use({ track: (u) => tracked.push(u) });
      const entries: LogEntry[] = [];
      for (const user of tracked) {
        entries.push(await deleteIfExists(api, user));
      }
      if (entries.length) await attachLog(testInfo, 'cleanup-log', entries);
    },
    { timeout: 120_000 },
  ],

  account: [
    async ({ api }, use, testInfo) => {
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
    { timeout: 120_000 },
  ],
});

/**
 * Cleanup with bounded retries. The public site is sometimes overloaded (timeouts, 503), and a
 * single failed call would leave a disposable account behind. Up to 3 attempts with a short
 * backoff; this runs in fixture teardown, never in a test body, so it is not a "sleep in a test".
 * Never throws: a cleanup problem must not mask or replace the test's own result.
 */
async function deleteIfExists(api: ApiClient, user: UserAccount): Promise<LogEntry> {
  const backoffMs = [0, 2000, 5000];
  let lastError = '';
  for (const [attempt, wait] of backoffMs.entries()) {
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      const exists = await api.verifyLogin(user.email, user.password);
      if (exists.body.responseCode !== 200) {
        return log('info', 'account.cleanup.already_deleted', { user: user.name, attempt: attempt + 1 });
      }
      const res = await api.deleteAccount(user.email, user.password);
      if (res.body.responseCode === 200) {
        return log('info', 'account.cleanup.deleted', { user: user.name, attempt: attempt + 1 });
      }
      lastError = `responseCode ${res.body.responseCode}`;
    } catch (err) {
      lastError = String(err).split('\n')[0] ?? String(err);
    }
  }
  // Account may remain on the site. Logged as an error so RCA and reviewers see it.
  return log('error', 'account.cleanup.failed_after_retries', {
    user: user.name,
    attempts: backoffMs.length,
    error: lastError.slice(0, 200),
  });
}

export { expect };
