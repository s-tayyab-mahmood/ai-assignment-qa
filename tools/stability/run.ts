/**
 * Repeatability gate: runs the @smoke subset N times *consecutively* (separate Playwright
 * invocations, not --repeat-each, so each run is a fresh process like a real CI run) and writes
 * reports/stability/stability-summary.{json,md}. Every failure in any run is listed for triage.
 *   npm run stability            (3 runs)
 *   STABILITY_RUNS=5 npm run stability
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collect } from '../rca/bundle';
import { classifyBundle } from '../rca/classify';

const RUNS = Number(process.env.STABILITY_RUNS ?? 3);
const OUT = 'reports/stability';
mkdirSync(OUT, { recursive: true });

interface RunResult {
  run: number;
  startedAt: string;
  exitCode: number | null;
  durationMs: number;
  stats: ReturnType<typeof collect>['meta']['stats'];
  failures: Array<{ scenario: string; title: string; classification: string; confidence: number }>;
}

const results: RunResult[] = [];
for (let run = 1; run <= RUNS; run++) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  console.log(`\n=== Stability run ${run}/${RUNS} ===`);
  const proc = spawnSync('npx', ['playwright', 'test', '--grep', '@smoke', '--retries=0'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  const reportCopy = path.join(OUT, `results-run${run}.json`);
  if (existsSync('reports/results.json')) copyFileSync('reports/results.json', reportCopy);
  const bundle = collect(reportCopy);
  const rca = classifyBundle(bundle);
  results.push({
    run,
    startedAt,
    exitCode: proc.status,
    durationMs: Date.now() - t0,
    stats: bundle.meta.stats,
    failures: rca.map((r) => ({
      scenario: r.scenario_id,
      title: r.title,
      classification: r.classification,
      confidence: r.confidence,
    })),
  });
}

const allGreen = results.every((r) => r.exitCode === 0 && r.stats.failed === 0 && r.stats.flaky === 0);
const summary = { runs: RUNS, allGreen, results };
writeFileSync(path.join(OUT, 'stability-summary.json'), JSON.stringify(summary, null, 2));

const md = [
  `# Smoke stability – ${RUNS} consecutive runs`,
  '',
  `**Result:** ${allGreen ? 'all runs green ✅' : 'failures present – each must be triaged below ❌'}`,
  '',
  '| Run | Started | Exit | Passed | Failed | Flaky | Duration |',
  '|---|---|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${r.run} | ${r.startedAt} | ${r.exitCode} | ${r.stats.passed} | ${r.stats.failed} | ${r.stats.flaky} | ${(r.durationMs / 1000).toFixed(0)} s |`,
  ),
  '',
  '## Failures (triage required)',
  '',
  ...(results.some((r) => r.failures.length)
    ? results.flatMap((r) =>
        r.failures.map(
          (f) =>
            `- Run ${r.run}: ${f.scenario} – ${f.title} → ${f.classification} (${f.confidence}) – **Human triage:** _TODO_`,
        ),
      )
    : ['None.']),
].join('\n');
writeFileSync(path.join(OUT, 'stability-summary.md'), md);
console.log(`\n${md}`);
process.exit(allGreen ? 0 : 1);
