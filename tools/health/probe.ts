/**
 * Pre-run site health check (brief: avoid abusive public-site load).
 * Sends 2 light requests per attempt (home page + /api/productsList). If the site is overloaded,
 * slow or down, waits and tries again, up to HEALTH_ATTEMPTS. Writes reports/health/health-check.{json,md},
 * appends the table to the GitHub job summary and sets the step output healthy=true|false.
 * Always exits 0: the workflow decides what to do with the verdict.
 *   npm run health                                 (1 attempt, local)
 *   HEALTH_ATTEMPTS=4 HEALTH_WAIT_MS=600000 npm run health
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { request } from '@playwright/test';
import { env } from '../../config/environment';
import {
  type AttemptResult,
  type ProbeResult,
  HEAVY_LOAD_MARKER,
  attemptHealthy,
  judgeProbe,
  overallHealthy,
  summaryMarkdown,
} from './evaluate';

function int(name: string, fallback: number, max: number): number {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
}

const cfg = {
  attempts: int('HEALTH_ATTEMPTS', 1, 6),
  waitMs: int('HEALTH_WAIT_MS', 600_000, 900_000),
  slowMs: int('HEALTH_SLOW_MS', 10_000, 60_000),
};
const REQUEST_TIMEOUT_MS = 30_000;
const OUT = 'reports/health';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function probe(
  ctx: Awaited<ReturnType<typeof request.newContext>>,
  name: string,
  url: string,
  checkBody: (text: string) => boolean,
): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    const res = await ctx.get(url, { timeout: REQUEST_TIMEOUT_MS, maxRedirects: 3 });
    const text = await res.text();
    const durationMs = Date.now() - t0;
    const problem = judgeProbe(
      {
        status: res.status(),
        durationMs,
        overloadPage: HEAVY_LOAD_MARKER.test(text.slice(0, 5000)),
        badPayload: !checkBody(text),
      },
      cfg.slowMs,
    );
    return { name, url, status: res.status(), durationMs, problem };
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).split('\n')[0]?.slice(0, 120) ?? 'error';
    return {
      name,
      url,
      status: null,
      durationMs: Date.now() - t0,
      problem: judgeProbe({ status: null, durationMs: 0, error: message }, cfg.slowMs),
    };
  }
}

function apiLooksReal(text: string): boolean {
  try {
    const json = JSON.parse(text) as { responseCode?: number; products?: unknown[] };
    return json.responseCode === 200 && Array.isArray(json.products) && json.products.length > 0;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const ctx = await request.newContext();
  const attempts: AttemptResult[] = [];
  try {
    for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
      const probes = [
        await probe(ctx, 'home page', `${env.baseUrl}/`, (t) => /automation\s*exercise/i.test(t)),
        await probe(ctx, 'products API', `${env.apiUrl}/productsList`, apiLooksReal),
      ];
      const result: AttemptResult = {
        attempt,
        at: new Date().toISOString(),
        probes,
        healthy: attemptHealthy(probes),
      };
      attempts.push(result);
      console.log(
        `Health attempt ${attempt}/${cfg.attempts}: ${result.healthy ? 'healthy' : 'UNHEALTHY'} - ` +
          probes
            .map((p) => `${p.name} ${p.status ?? '-'} ${p.durationMs}ms${p.problem ? ` (${p.problem})` : ''}`)
            .join('; '),
      );
      if (result.healthy) break;
      if (attempt < cfg.attempts) {
        console.log(`Waiting ${Math.round(cfg.waitMs / 60000)} min before the next attempt...`);
        await sleep(cfg.waitMs);
      }
    }
  } finally {
    await ctx.dispose();
  }

  const healthy = overallHealthy(attempts);
  const md = summaryMarkdown(attempts, cfg);
  writeFileSync(`${OUT}/health-check.json`, JSON.stringify({ healthy, config: cfg, attempts }, null, 2));
  writeFileSync(`${OUT}/health-check.md`, md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=${healthy}\n`);
  console.log(healthy ? 'Site healthy: tests will run.' : 'Site unavailable: tests will not run.');
}

main().catch((e) => {
  // A crash in the checker itself must not block testing: report it and let the tests decide.
  console.error('Health check crashed; continuing as healthy so tests still run:', e);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'healthy=true\n');
});
