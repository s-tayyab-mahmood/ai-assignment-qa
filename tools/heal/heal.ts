/**
 * CLI – self-healing agent. Runs after RCA on a failed run:
 *   npm run heal
 * Reads reports/rca/failure-bundle.json and reports/rca/rca-report.json, writes
 *   reports/heal/heal-report.json   one result per failure (proposed / rejected / declined / no-fix-found)
 *   reports/heal/heal-summary.md    human-readable summary (+ GitHub job summary)
 *   reports/heal/patches/*.patch    validated patches, for a human to review and apply
 *   reports/heal/audit-log.jsonl    every policy decision, AI call and validation
 * Env: HEAL_MAX_ATTEMPTS (default 3, max 5); AI_* as for RCA (absent on pull requests: rules only).
 * Always exits 0 and always restores source files: healing can never change the run's result.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { clip } from '../../src/utils/redact';
import { callModel, type AiConfig } from '../rca/ai';
import type { FailureBundle, RcaRecord } from '../rca/types';
import { healAll, type AskModel } from './engine';
import { renderHealMarkdown } from './report';
import { validateWithPlaywright } from './validate';

const OUT = 'reports/heal';

async function main(): Promise<void> {
  mkdirSync(path.join(OUT, 'patches'), { recursive: true });
  const bundlePath = 'reports/rca/failure-bundle.json';
  const reportPath = 'reports/rca/rca-report.json';
  if (!existsSync(bundlePath) || !existsSync(reportPath)) {
    const md = '## Self-healing agent\n\nNo RCA report found – run `npm run rca` first. Nothing to heal.\n';
    writeFileSync(path.join(OUT, 'heal-summary.md'), md);
    console.log('[heal] no RCA report; nothing to do');
    return;
  }
  const bundle = JSON.parse(readFileSync(bundlePath, 'utf8')) as FailureBundle;
  const { records } = JSON.parse(readFileSync(reportPath, 'utf8')) as { records: RcaRecord[] };

  const apiKey = process.env.AI_API_KEY ?? '';
  const cfg: AiConfig = {
    provider: process.env.AI_PROVIDER || 'gemini',
    model:
      process.env.AI_MODEL ||
      (process.env.AI_PROVIDER === 'anthropic' ? 'claude-sonnet-5-5' : 'gemini-3.8-flash'),
    apiKey,
    timeoutMs: Math.min(Number(process.env.AI_TIMEOUT_MS) || 30_000, 60_000),
  };
  const ask: AskModel | undefined = apiKey
    ? async (system, user) => ({ text: (await callModel(cfg, system, user)).text, model: cfg.model })
    : undefined;
  const skillPath = 'skills/self-healing.md';
  const skill = existsSync(skillPath) ? clip(readFileSync(skillPath, 'utf8'), 9000) : '';

  const { results, audit } = await healAll(bundle, records, {
    validator: validateWithPlaywright,
    ask,
    skill,
    outDir: OUT,
    maxAttempts: Math.min(Number(process.env.HEAL_MAX_ATTEMPTS) || 3, 5),
    diff: (file) => execFileSync('git', ['diff', '--no-color', '--', file], { encoding: 'utf8' }),
    writePatch: (name, content) => {
      const p = path.join(OUT, 'patches', name).split(path.sep).join('/');
      writeFileSync(p, content);
      return p;
    },
  });

  const mode = ask
    ? `rules + AI fallback (${cfg.provider} / ${cfg.model})`
    : 'rules only (no AI key – e.g. pull request)';
  writeFileSync(
    path.join(OUT, 'heal-report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), mode, results }, null, 2),
  );
  for (const a of audit) appendFileSync(path.join(OUT, 'audit-log.jsonl'), `${JSON.stringify(a)}\n`);
  const md = renderHealMarkdown(results, mode);
  writeFileSync(path.join(OUT, 'heal-summary.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
  const proposed = results.filter((r) => r.status === 'proposed').length;
  console.log(
    `[heal] ${results.length} failure(s): ${proposed} proposed, ${results.length - proposed} not healed -> ${OUT}/heal-summary.md`,
  );
}

main().catch((e) => {
  console.error('[heal] internal error (non-fatal):', e);
  try {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(
      path.join(OUT, 'heal-summary.md'),
      `## Self-healing agent\n\nInternal error: ${String(e)}\nThe test result is unaffected.\n`,
    );
  } catch {
    /* ignore */
  }
});
