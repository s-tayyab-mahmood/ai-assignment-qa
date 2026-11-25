/**
 * Proof step: a change is proposed only if the type check, lint and three isolated runs of the
 * failing test all pass. Runs on one worker, no retries, separate output folder and reporter, so it
 * never overwrites the original run's reports and adds little load to the public site.
 */
import { spawnSync } from 'node:child_process';
import type { ValidationResult } from './types';

const shell = process.platform === 'win32';
const RUNS = 3;

function run(cmd: string, args: string[], timeoutMs: number): { ok: boolean; out: string } {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell, timeout: timeoutMs, env: process.env });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

export type Validator = (
  file: string,
  test: { file: string; line: number; project: string },
  outDir: string,
) => ValidationResult;

export const validateWithPlaywright: Validator = (file, test, outDir) => {
  const typecheck = run('npx', ['tsc', '--noEmit'], 180_000);
  const lint = run('npx', ['eslint', file], 120_000);
  const args = [
    'playwright',
    'test',
    `${test.file.split('\\').join('/')}:${test.line}`,
    `--project=${test.project}`,
    `--repeat-each=${RUNS}`,
    '--retries=0',
    '--workers=1',
    '--reporter=line',
    `--output=${outDir}`,
  ];
  const command = `npx ${args.join(' ')}`;
  if (!typecheck.ok || !lint.ok)
    return {
      typecheck: typecheck.ok,
      lint: lint.ok,
      runs: { passed: 0, total: 0 },
      command,
      log: (typecheck.ok ? lint.out : typecheck.out).slice(-1500),
    };
  const tests = run('npx', args, 6 * 60_000);
  const passed = Number(/(\d+) passed/.exec(tests.out)?.[1] ?? 0);
  return {
    typecheck: true,
    lint: true,
    runs: { passed: tests.ok ? RUNS : Math.min(passed, RUNS - 1), total: RUNS },
    command,
    log: tests.out.slice(-1500),
  };
};

export const validationPassed = (v: ValidationResult) =>
  v.typecheck && v.lint && v.runs.total > 0 && v.runs.passed === v.runs.total;
