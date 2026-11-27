/**
 * Detect + Collect stage: builds a deterministic failure bundle from the Playwright JSON report.
 * Model-free and network-free (apart from an optional `git fetch` of the PR base for diffs).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { clip, redactText } from '../../src/utils/redact';
import type { Attempt, Evidence, FailureBundle, FailureRecord, RunMeta } from './types';

const REPORT = process.env.PW_JSON_REPORT ?? 'reports/results.json';

// ---- Minimal typing of the Playwright JSON reporter output we rely on ----------------------
interface PwAttachment {
  name: string;
  contentType: string;
  path?: string;
  body?: string;
}
interface PwError {
  message?: string;
  stack?: string;
  location?: { file: string; line: number; column: number };
}
interface PwResult {
  status: string;
  duration: number;
  retry: number;
  errors?: PwError[];
  error?: PwError;
  attachments: PwAttachment[];
}
interface PwTest {
  projectName: string;
  status: string;
  annotations: Array<{ type: string; description?: string }>;
  results: PwResult[];
}
interface PwSpec {
  title: string;
  file: string;
  line: number;
  id: string;
  tags?: string[];
  tests: PwTest[];
}
interface PwSuite {
  title: string;
  file?: string;
  specs?: PwSpec[];
  suites?: PwSuite[];
}
interface PwReport {
  suites: PwSuite[];
  errors?: PwError[];
  stats?: { duration: number; expected: number; unexpected: number; flaky: number; skipped: number };
}

/** Repo-relative paths in all outputs (no runner home directories in reports). */
function rel(p: string | undefined): string | undefined {
  return p ? path.relative(process.cwd(), p) || p : undefined;
}

function sh(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

// eslint-disable-next-line no-control-regex -- stripping ANSI colour codes
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, '');
const clean = (s: string | undefined, max = 1500) => clip(redactText(stripAnsi(s ?? '')), max);

function decodeJsonAttachment(a: PwAttachment | undefined): Array<Record<string, unknown>> {
  if (!a) return [];
  try {
    const raw = a.body
      ? Buffer.from(a.body, 'base64').toString('utf8')
      : a.path && existsSync(a.path)
        ? readFileSync(a.path, 'utf8')
        : '';
    const parsed: unknown = raw ? JSON.parse(redactText(raw)) : [];
    return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>).slice(0, 20) : [];
  } catch {
    return [];
  }
}

/**
 * Files changed by this run's code relative to where it branched from the default branch.
 * - pull_request: diff against the PR base (GITHUB_BASE_REF).
 * - other branches (e.g. workflow_dispatch on a feature branch): diff against the merge-base with
 *   the default branch, so merge commits do not hide the branch's own changes. On 2026-11-22 a
 *   "HEAD~1" diff after `git merge main` missed the injected test change and the RCA wrongly
 *   reported PRODUCT_DEFECT (CRITICAL).
 * - the default branch itself: the last commit.
 */
function changedFiles(): string[] {
  const defaultBranch = process.env.RCA_DEFAULT_BRANCH || 'main';
  const base = process.env.GITHUB_BASE_REF || defaultBranch;
  sh(`git fetch --no-tags origin ${base}`);
  const mergeBase = sh(`git merge-base HEAD origin/${base}`);
  const head = sh('git rev-parse HEAD');
  if (mergeBase && mergeBase !== head) {
    const out = sh(`git diff --name-only ${mergeBase}..HEAD`);
    if (out) return out.split('\n');
  }
  const out = sh('git diff --name-only HEAD~1..HEAD');
  return out ? out.split('\n') : [];
}

function walk(suite: PwSuite, out: Array<{ spec: PwSpec; test: PwTest }>): void {
  for (const spec of suite.specs ?? []) for (const test of spec.tests) out.push({ spec, test });
  for (const child of suite.suites ?? []) walk(child, out);
}

function buildFailure(spec: PwSpec, test: PwTest): FailureRecord {
  const ann = (type: string) => test.annotations.find((a) => a.type === type)?.description;
  const firstFailed =
    test.results.find((r) => r.status !== 'passed' && r.status !== 'skipped') ?? test.results[0];
  const lastFailed =
    [...test.results].reverse().find((r) => r.status !== 'passed' && r.status !== 'skipped') ?? firstFailed;
  const err = firstFailed?.errors?.[0] ?? firstFailed?.error;
  const atts = lastFailed?.attachments ?? [];
  const find = (name: string) => atts.find((a) => a.name === name);

  const attempts: Attempt[] = test.results.map((r) => ({
    retry: r.retry,
    status: r.status,
    durationMs: r.duration,
    errorMessage: r.errors?.[0]?.message ? clean(r.errors[0].message, 300) : undefined,
  }));

  const network = decodeJsonAttachment(find('network-failures'));
  const slowOrPending = decodeJsonAttachment(find('slow-or-pending-requests'));
  const xhrAttachment = find('xhr-log');
  const xhrLog = xhrAttachment ? decodeJsonAttachment(xhrAttachment) : undefined;
  const thirdParty = decodeJsonAttachment(find('third-party-failures'));
  const consoleErrs = decodeJsonAttachment(find('console-errors'));
  const cleanup = decodeJsonAttachment(find('cleanup-log'));
  const artifacts = {
    trace: rel(find('trace')?.path),
    screenshot: rel(find('screenshot')?.path),
    video: rel(find('video')?.path),
    // Accessibility snapshot of the page at failure (Playwright 'error-context'); used by the self-healing agent.
    errorContext: rel(find('error-context')?.path),
  };
  const repoFile = existsSync(path.join('tests', spec.file)) ? path.join('tests', spec.file) : spec.file;
  const stackTop = clean(err?.stack, 4000)
    .split('\n')
    .filter((l) => l.trim().startsWith('at '))
    .slice(0, 6)
    .map((l) => l.trim());

  const evidence: Evidence[] = [];
  const add = (e: Omit<Evidence, 'id'>) => evidence.push({ id: `E${evidence.length + 1}`, ...e });
  add({ type: 'error', summary: clean(err?.message, 800) || '(no error message captured)' });
  if (err?.location)
    add({
      type: 'stack',
      summary: `failing line ${rel(err.location.file)}:${err.location.line}; ${stackTop.slice(0, 3).join(' | ')}`,
    });
  add({
    type: 'retry-history',
    summary: attempts.map((a) => `retry ${a.retry}: ${a.status} (${a.durationMs}ms)`).join('; '),
  });
  if (artifacts.trace)
    add({
      type: 'trace',
      summary: 'Playwright trace (open with npx playwright show-trace)',
      path: artifacts.trace,
    });
  if (artifacts.screenshot)
    add({ type: 'screenshot', summary: 'screenshot at failure', path: artifacts.screenshot });
  if (artifacts.video) add({ type: 'video', summary: 'video of failing attempt', path: artifacts.video });
  add({
    type: 'network',
    summary: network.length
      ? `${network.length} failed/5xx request(s): ${network
          .map((n) => JSON.stringify((n as { data?: unknown }).data ?? n))
          .join('; ')
          .slice(0, 600)}`
      : 'no failed first-party requests recorded (ad hosts blocked by design are excluded)',
  });
  if (xhrLog)
    add({
      type: 'network',
      summary: xhrLog.length
        ? `${xhrLog.length} completed first-party XHR call(s), last: ${xhrLog
            .slice(-4)
            .map((n) => JSON.stringify((n as { data?: unknown }).data ?? n))
            .join('; ')
            .slice(0, 500)}`
        : 'xhr-log: no first-party XHR call completed during the test',
    });
  if (slowOrPending.length)
    add({
      type: 'network',
      summary: `${slowOrPending.length} first-party request(s) slow (>5 s) or still pending at failure: ${slowOrPending
        .map((n) => JSON.stringify((n as { data?: unknown }).data ?? n))
        .join('; ')
        .slice(0, 600)}`,
    });
  if (thirdParty.length)
    add({
      type: 'console',
      summary: `context only (third-party hosts, not product evidence): ${thirdParty.length} failed request(s), e.g. ${JSON.stringify((thirdParty[0] as { data?: unknown }).data ?? {}).slice(0, 200)}`,
    });
  add({
    type: 'console',
    summary: consoleErrs.length
      ? `${consoleErrs.length} console error(s): ${JSON.stringify(consoleErrs.slice(0, 3)).slice(0, 500)}`
      : 'no console errors recorded',
  });
  if (cleanup.length) add({ type: 'cleanup', summary: JSON.stringify(cleanup).slice(0, 400) });
  const finalUrl = ann('final-url');
  if (finalUrl) add({ type: 'annotation', summary: `page URL at failure: ${finalUrl}` });
  const unavailable = ann('site-unavailable');
  if (unavailable)
    add({
      type: 'network',
      summary: `site served an error page instead of the requested page: ${unavailable}`,
    });
  const fi = ann('fault-injection');
  if (fi) add({ type: 'annotation', summary: `fault-injection annotation present: ${fi}` });

  const recent = sh(`git log -3 --format="%h %s" -- "${repoFile}"`);
  return {
    testId: spec.id,
    title: spec.title,
    file: repoFile,
    line: spec.line,
    project: test.projectName,
    scenarioId: ann('scenario') ?? spec.title.match(/AE-\d+/)?.[0] ?? 'UNMAPPED',
    priority: ann('priority') ?? 'P?',
    tags: (spec.tags ?? []).map((t) => (t.startsWith('@') ? t : `@${t}`)),
    outcome: test.status === 'flaky' ? 'flaky' : 'unexpected',
    faultInjection: fi,
    siteUnavailable: unavailable,
    finalUrl,
    attempts,
    errorMessage: clean(err?.message, 1200),
    errorLocation: err?.location
      ? `${rel(err.location.file)}:${err.location.line}:${err.location.column}`
      : undefined,
    stackTop,
    networkFailures: network,
    slowOrPending,
    xhrLog,
    consoleErrors: consoleErrs,
    cleanup,
    artifacts,
    recentCommitsTouchingTest: recent ? recent.split('\n') : [],
    evidence,
  };
}

export function collect(reportPath = REPORT): FailureBundle {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const meta: RunMeta = {
    generatedAt: new Date().toISOString(),
    reportFound: existsSync(reportPath),
    reportPath,
    commitSha: process.env.GITHUB_SHA ?? (sh('git rev-parse HEAD') || 'unknown'),
    branch:
      process.env.GITHUB_HEAD_REF ||
      process.env.GITHUB_REF_NAME ||
      sh('git rev-parse --abbrev-ref HEAD') ||
      'unknown',
    runUrl: server && repo && runId ? `${server}/${repo}/actions/runs/${runId}` : undefined,
    event: process.env.GITHUB_EVENT_NAME,
    changedFiles: changedFiles(),
    stats: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, durationMs: 0 },
    globalErrors: [],
  };

  if (!meta.reportFound) {
    meta.note = `No Playwright JSON report at ${reportPath}. Tests may not have run (install/setup failure). Check the job log for the step that failed.`;
    return { meta, failures: [] };
  }

  let report: PwReport;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8')) as PwReport;
  } catch (e) {
    meta.note = `Report unreadable: ${String(e)}`;
    return { meta, failures: [] };
  }

  const all: Array<{ spec: PwSpec; test: PwTest }> = [];
  for (const s of report.suites ?? []) walk(s, all);
  const s = report.stats;
  meta.stats = {
    total: all.length,
    passed: s?.expected ?? 0,
    failed: s?.unexpected ?? 0,
    flaky: s?.flaky ?? 0,
    skipped: s?.skipped ?? 0,
    durationMs: Math.round(s?.duration ?? 0),
  };
  meta.globalErrors = (report.errors ?? []).map((e) => clean(e.message, 500));

  const failures = all
    .filter(({ test }) => test.status === 'unexpected' || test.status === 'flaky')
    .map(({ spec, test }) => buildFailure(spec, test));
  return { meta, failures };
}
