import type { HealResult } from './types';

const ICON: Record<HealResult['status'], string> = {
  proposed: '🩹 proposed',
  rejected: '✗ rejected by validation',
  declined: '– declined',
  'no-fix-found': '? no safe fix',
};

export function renderHealMarkdown(results: HealResult[], mode: string): string {
  const out = [
    '## Self-healing agent',
    '',
    '_Proposals only. Nothing is committed, pushed or merged. Every patch needs human review; an',
    'ASSERTION_CHANGE needs extra care: confirm the new expectation is what the product should do._',
    '',
    `Mode: ${mode}`,
    '',
  ];
  if (!results.length) return [...out, 'No failures to consider.', ''].join('\n');
  out.push('| Scenario | Test | RCA | Decision | Kind | Reason |', '|---|---|---|---|---|---|');
  for (const r of results)
    out.push(
      `| ${r.scenarioId} | ${r.title.replace(/\|/g, '/')} | ${r.classification} ${Math.round(r.confidence * 100)}% | ${ICON[r.status]} | ${r.kind ?? '–'} | ${r.reason.replace(/\|/g, '/').replace(/\n/g, ' ')} |`,
    );
  for (const r of results.filter(
    (x) => x.status === 'proposed' && x.edit && !x.reason.startsWith('same fix'),
  )) {
    const v = r.validation;
    out.push(
      '',
      `### ${r.scenarioId} – ${r.kind === 'ASSERTION_CHANGE' ? '⚠️ ASSERTION_CHANGE (review the expectation itself)' : 'LOCATOR'}`,
      `- **Change:** \`${r.edit!.file}:${r.edit!.line}\` (found by ${r.source === 'ai' ? 'AI, checked against the page/source' : 'rules, from the page snapshot'})`,
      '```diff',
      `- ${r.edit!.before.trim()}`,
      `+ ${r.edit!.after.trim()}`,
      '```',
      `- **Proof:** type check ${v?.typecheck ? 'passed' : 'failed'}, lint ${v?.lint ? 'passed' : 'failed'}, isolated runs ${v?.runs.passed}/${v?.runs.total} green (\`${v?.command}\`)`,
      ...(r.alsoFixes?.length ? [`- **Also fixes:** ${r.alsoFixes.join('; ')}`] : []),
      `- **Patch:** \`${r.patchPath}\` in the run artifact. Review, then on the branch: \`git apply ${r.patchPath}\`, commit and push.`,
    );
  }
  return `${out.join('\n')}\n`;
}
