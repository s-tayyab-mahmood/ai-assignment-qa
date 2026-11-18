/**
 * CLI – Stage 1 (Detect + Collect). Always exits 0 and always writes
 * reports/rca/failure-bundle.json, even when the test report is missing (e.g. install failed),
 * so diagnostics can never hide or replace the original test result.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collect } from './bundle';

const OUT_DIR = 'reports/rca';

try {
  mkdirSync(OUT_DIR, { recursive: true });
  const bundle = collect();
  writeFileSync(path.join(OUT_DIR, 'failure-bundle.json'), JSON.stringify(bundle, null, 2));
  console.log(
    `[rca:collect] report=${bundle.meta.reportFound} failures=${bundle.failures.length} stats=${JSON.stringify(bundle.meta.stats)}`,
  );
} catch (e) {
  console.error('[rca:collect] internal error (non-fatal):', e);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, 'failure-bundle.json'), JSON.stringify({ error: String(e) }, null, 2));
}
