/**
 * CLI – Stages Hypothesize → Recommend → Publish.
 * Reads reports/rca/failure-bundle.json (runs the collector itself if it is missing), applies the
 * deterministic classifier, optionally refines with AI, and writes:
 *   reports/rca/rca-report.json   machine-readable records (validated against RcaRecordSchema)
 *   reports/rca/rca-summary.md    human-readable summary (+ GitHub job summary)
 *   reports/rca/audit-log.jsonl   one line per AI call / decision
 * Always exits 0: diagnostics must never change or hide the test job's result.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { analyzeWithAi, type AiConfig } from './ai';
import { collect } from './bundle';
import { classifyBundle } from './classify';
import { renderMarkdown } from './report';
import { RcaRecordSchema, type FailureBundle, type RcaRecord } from './types';

const OUT = 'reports/rca';

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const bundlePath = path.join(OUT, 'failure-bundle.json');
  let bundle: FailureBundle;
  try {
    bundle = existsSync(bundlePath)
      ? (JSON.parse(readFileSync(bundlePath, 'utf8')) as FailureBundle)
      : collect();
    if (!bundle.meta) bundle = collect();
  } catch {
    bundle = collect();
  }

  const baseline = classifyBundle(bundle);
  const apiKey = process.env.AI_API_KEY ?? '';
  const maxAi = Number(process.env.AI_MAX_FAILURES ?? 5);
  const cfg: AiConfig = {
    provider: process.env.AI_PROVIDER ?? 'anthropic',
    model: process.env.AI_MODEL ?? 'claude-sonnet-5-5',
    apiKey,
    timeoutMs: 30_000,
  };

  let mode = apiKey
    ? 'ai-assisted (with deterministic baseline)'
    : 'deterministic (no AI_API_KEY – model-free fallback)';
  const records: RcaRecord[] = [];
  const auditPath = path.join(OUT, 'audit-log.jsonl');
  for (const [i, base] of baseline.entries()) {
    const failure = bundle.failures[i];
    if (!apiKey || !failure || i >= maxAi) {
      records.push(base);
      appendFileSync(
        auditPath,
        `${JSON.stringify({ ts: new Date().toISOString(), test_id: base.test_id, decision: 'deterministic', reason: !apiKey ? 'no AI key' : 'AI budget exhausted' })}\n`,
      );
      continue;
    }
    const { record, audit } = await analyzeWithAi(failure, base, cfg);
    records.push(record);
    appendFileSync(auditPath, `${JSON.stringify(audit)}\n`);
  }
  if (apiKey && baseline.length > maxAi) mode += `; AI limited to first ${maxAi} failures`;

  // Self-check: every published record must satisfy the schema.
  const invalid = records.map((r) => RcaRecordSchema.safeParse(r)).filter((r) => !r.success);
  if (invalid.length) console.error(`[rca:analyze] ${invalid.length} record(s) failed schema validation`);

  writeFileSync(
    path.join(OUT, 'rca-report.json'),
    JSON.stringify({ meta: bundle.meta, mode, records }, null, 2),
  );
  const md = renderMarkdown(bundle, records, mode);
  writeFileSync(path.join(OUT, 'rca-summary.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
  console.log(`[rca:analyze] mode=${mode} records=${records.length} -> ${OUT}/rca-summary.md`);
}

main().catch((e) => {
  console.error('[rca:analyze] internal error (non-fatal):', e);
  try {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(
      path.join(OUT, 'rca-summary.md'),
      `# RCA summary\n\nRCA tooling failed internally: ${String(e)}\nThe test result above is unaffected.\n`,
    );
  } catch {
    /* ignore */
  }
});
