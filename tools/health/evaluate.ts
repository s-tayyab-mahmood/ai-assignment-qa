/**
 * Pure decision logic for the pre-run site health check (no network). Kept separate from
 * probe.ts so it can be unit-tested offline by tools/health/selftest.ts.
 */
export interface ProbeResult {
  name: string;
  url: string;
  /** HTTP status, or null when the request failed or timed out. */
  status: number | null;
  durationMs: number;
  /** Short reason when the probe is unhealthy (never response bodies). */
  problem?: string;
}

export interface AttemptResult {
  attempt: number;
  at: string;
  probes: ProbeResult[];
  healthy: boolean;
}

export const HEAVY_LOAD_MARKER = /heavy load|queue full/i;

/**
 * One probe is healthy when it answered 2xx, within the slow threshold, and the body is the real
 * page/API (not the site's "under heavy load" holding page, which can arrive with status 200 or 503).
 */
export function judgeProbe(
  input: {
    status: number | null;
    durationMs: number;
    error?: string;
    overloadPage?: boolean;
    badPayload?: boolean;
  },
  slowMs: number,
): string | undefined {
  if (input.error) return `request failed: ${input.error}`;
  if (input.status === null) return 'no response';
  if (input.overloadPage) return `site overload page (HTTP ${input.status})`;
  if (input.status < 200 || input.status >= 300) return `HTTP ${input.status}`;
  if (input.badPayload) return 'unexpected response body';
  if (input.durationMs > slowMs) return `slow: ${input.durationMs} ms > ${slowMs} ms`;
  return undefined;
}

export function attemptHealthy(probes: ProbeResult[]): boolean {
  return probes.length > 0 && probes.every((p) => !p.problem);
}

/** Final verdict: healthy as soon as any attempt is fully healthy. */
export function overallHealthy(attempts: AttemptResult[]): boolean {
  return attempts.some((a) => a.healthy);
}

export function summaryMarkdown(
  attempts: AttemptResult[],
  cfg: { attempts: number; waitMs: number; slowMs: number },
): string {
  const healthy = overallHealthy(attempts);
  const lines = [
    '## Site health check',
    '',
    healthy
      ? `**Healthy** after ${attempts.length} attempt(s). Tests will run.`
      : `**Site unavailable** after ${attempts.length} attempt(s), ${Math.round((cfg.waitMs * (attempts.length - 1)) / 60000)} min of waiting. Tests were **not run**; this is an environment problem, not a product verdict.`,
    '',
    `Policy: up to ${cfg.attempts} attempt(s), ${Math.round(cfg.waitMs / 60000)} min apart, slow threshold ${cfg.slowMs} ms, 2 requests per attempt.`,
    '',
    '| Attempt | Time (UTC) | Probe | Status | Duration | Problem |',
    '|---|---|---|---|---|---|',
  ];
  for (const a of attempts) {
    for (const p of a.probes) {
      lines.push(
        `| ${a.attempt} | ${a.at} | ${p.name} | ${p.status ?? '-'} | ${p.durationMs} ms | ${p.problem ?? 'ok'} |`,
      );
    }
  }
  return lines.join('\n') + '\n';
}
