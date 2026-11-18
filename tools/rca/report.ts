import type { FailureBundle, RcaRecord } from './types';

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Human-readable Markdown summary (also written to the GitHub job summary). */
export function renderMarkdown(bundle: FailureBundle, records: RcaRecord[], mode: string): string {
  const m = bundle.meta;
  const s = m.stats;
  const lines: string[] = [];
  lines.push('# QA run – RCA summary');
  lines.push('');
  lines.push(
    `> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.`,
  );
  lines.push('');
  lines.push(`| Item | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Commit | \`${m.commitSha.slice(0, 12)}\` on \`${m.branch}\` |`);
  if (m.runUrl) lines.push(`| Run | ${m.runUrl} |`);
  if (m.event) lines.push(`| Trigger | ${m.event} |`);
  lines.push(`| Generated | ${m.generatedAt} |`);
  lines.push(`| Analysis mode | ${mode} |`);
  if (!m.reportFound) {
    lines.push('');
    lines.push(`**No test report found.** ${m.note ?? ''}`);
    return lines.join('\n');
  }
  const executed = s.passed + s.failed + s.flaky;
  lines.push(
    `| Tests | ${s.total} (passed ${s.passed}, failed ${s.failed}, flaky ${s.flaky}, skipped ${s.skipped}) |`,
  );
  lines.push(`| Pass rate | ${executed ? pct(s.passed / executed) : 'n/a'} |`);
  lines.push(`| Duration | ${(s.durationMs / 1000).toFixed(1)} s |`);
  if (m.globalErrors.length) lines.push(`| Global errors | ${m.globalErrors.length} (see JSON) |`);
  lines.push('');

  if (!records.length) {
    lines.push('## Result');
    lines.push('');
    lines.push(`No failing or flaky tests in this run. ${executed} tests executed; nothing to triage.`);
    return lines.join('\n');
  }

  lines.push('## Failures');
  lines.push('');
  lines.push('| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of records) {
    lines.push(
      `| ${r.scenario_id} | ${r.title.replace(/\|/g, '/')} | **${r.classification}** | ${pct(r.confidence)} | ${r.business_severity} | ${r.owner} | ${r.analysis_mode} |`,
    );
  }
  for (const r of records) {
    lines.push('');
    lines.push(`### ${r.scenario_id} – ${r.title}`);
    if (r.fault_injection)
      lines.push(`\n> ⚠️ Fault injection: ${r.fault_injection}. Not evidence about the product.`);
    lines.push('');
    lines.push(`- **Symptom:** ${r.symptom}`);
    lines.push(`- **First failure:** ${r.first_failure}`);
    lines.push(
      `- **Classification:** ${r.classification} (${pct(r.confidence)})${r.ai ? ` – AI ${r.ai.agreed_with_deterministic ? 'agreed with' : 'differed from'} rule baseline${r.ai.rejection_reason ? `; AI output rejected: ${r.ai.rejection_reason}` : ''}` : ''}`,
    );
    lines.push(`- **Alternatives considered:** ${r.alternatives.join(', ') || 'none matched'}`);
    lines.push(`- **Validate:** ${r.validation}`);
    lines.push(`- **Reproduce:** \`${r.reproduction}\``);
    lines.push(`- **Recommended action:** ${r.recommended_action}`);
    lines.push(`- **Owner:** ${r.owner} · **Human approval required:** yes`);
    lines.push('');
    lines.push('| Hypothesis | Score | Evidence for | Evidence against | Rationale |');
    lines.push('|---|---|---|---|---|');
    for (const h of r.hypotheses) {
      lines.push(
        `| ${h.category} | ${h.score.toFixed(2)} | ${h.evidence_for.join(', ')} | ${h.evidence_against.join(', ')} | ${h.rationale.replace(/\|/g, '/')} |`,
      );
    }
    lines.push('');
    lines.push('<details><summary>Evidence</summary>');
    lines.push('');
    for (const e of r.evidence)
      lines.push(
        `- **${e.id}** (${e.type})${e.path ? ` \`${e.path}\`` : ''}: ${e.summary.replace(/\n/g, ' ').slice(0, 400)}`,
      );
    lines.push('');
    lines.push('</details>');
  }
  return lines.join('\n');
}
