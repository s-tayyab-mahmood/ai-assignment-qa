/**
 * Correlate + Hypothesize (deterministic). Rule-based scoring of competing causes with explicit
 * evidence for/against each. This is the model-free baseline: it always runs, it is what the
 * AI output is checked against, and it is the result used when no AI key is configured.
 *
 * Policy (skills/rca.md): a classification must cite evidence and rule out alternatives;
 * weak or missing evidence => UNKNOWN or low confidence, never a stated fact.
 */
import type { Category, FailureBundle, FailureRecord, Hypothesis, RcaRecord } from './types';

const HARD_NETWORK_RE =
  /getaddrinfo|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|EHOSTUNREACH|net::ERR_NAME_NOT_RESOLVED|net::ERR_INTERNET_DISCONNECTED/i;
const NETWORK_RE =
  /net::ERR_|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|getaddrinfo|ETIMEDOUT|socket hang up|connect EHOSTUNREACH/i;
const LOCATOR_RE =
  /waiting for (locator|getBy)|resolved to 0 elements|element\(s\) not found|strict mode violation|toBeVisible|toHaveCount/i;
const VALUE_RE = /Expected:|Received:|toEqual|toBe\(|toHaveText|toContain/;
const TIMEOUT_RE = /Timeout \d+ms exceeded|Test timeout of \d+ms exceeded|Timed out \d+ms/i;
const CONTRACT_RE = /contract violation|returned non-JSON/i;
const DATA_RE =
  /fixture: API account creation|Email already exists|User not found|account\.cleanup\.(failed|error)/i;
const THIRD_PARTY_RE =
  /google_vignette|googlesyndication|doubleclick|intercepts pointer events.*iframe|<iframe[^>]*aswift/i;
const BROWSER_RE = /Executable doesn't exist|browserType\.launch|Host system is missing dependencies/i;

const TEST_CODE_RE = /^(tests|src)\//;

interface Ctx {
  f: FailureRecord;
  changed: string[];
  ev: (type: string) => string[];
  /** Evidence IDs for recorded network failures only (an empty network log is not evidence *for*). */
  netEv: string[];
}

type Rule = (c: Ctx) => Hypothesis | null;

const h = (
  category: Category,
  score: number,
  evFor: string[],
  evAgainst: string[],
  rationale: string,
): Hypothesis => ({
  category,
  score: Math.max(0, Math.min(1, score)),
  evidence_for: evFor,
  evidence_against: evAgainst,
  rationale,
});

const rules: Rule[] = [
  // Test-controlled fault injection is identified first so it can never be reported as a product defect.
  ({ f, ev, netEv }) => {
    if (!f.faultInjection) return null;
    const isTiming = /FI-03|delay/i.test(f.faultInjection);
    return h(
      isTiming ? 'TIMING_OR_FLAKINESS' : 'ENVIRONMENT_OR_NETWORK',
      0.75,
      [...ev('annotation'), ...netEv, ...ev('retry-history')],
      [],
      `Test carries a fault-injection annotation (${f.faultInjection}). The failure is test-controlled; it is not evidence about the product.`,
    );
  },
  ({ f, ev, netEv }) => {
    const msg = NETWORK_RE.test(f.errorMessage);
    if (!msg && f.networkFailures.length === 0) return null;
    // DNS/connection-refused errors are unambiguous: the request never reached the application.
    const score = HARD_NETWORK_RE.test(f.errorMessage) ? 0.8 : msg && netEv.length ? 0.7 : 0.5;
    return h(
      'ENVIRONMENT_OR_NETWORK',
      score,
      [...(msg ? ev('error') : []), ...netEv],
      [],
      HARD_NETWORK_RE.test(f.errorMessage)
        ? 'The request failed at DNS/connection level, so the application never answered; a product defect cannot be inferred.'
        : 'Network-level errors were recorded during the test (failed requests and/or net:: error codes).',
    );
  },
  ({ f, ev }) =>
    BROWSER_RE.test(f.errorMessage)
      ? h(
          'ENVIRONMENT_OR_NETWORK',
          0.85,
          ev('error'),
          [],
          'Browser could not be launched – CI/runner setup problem.',
        )
      : null,
  ({ f, ev }) =>
    THIRD_PARTY_RE.test(f.errorMessage)
      ? h(
          'THIRD_PARTY_DEPENDENCY',
          0.65,
          ev('error'),
          [],
          'Failure text references ad/vignette iframes from third-party ad hosts.',
        )
      : null,
  ({ f, ev, netEv }) =>
    CONTRACT_RE.test(f.errorMessage)
      ? h(
          'PRODUCT_DEFECT',
          0.55,
          ev('error'),
          netEv,
          'API response violated its validated contract (schema mismatch). Could be a real API change; confirm against the live endpoint before raising a defect.',
        )
      : null,
  ({ f, ev }) =>
    DATA_RE.test(f.errorMessage) || f.cleanup.some((c) => /failed|error/.test(JSON.stringify(c)))
      ? h(
          'TEST_DATA_OR_STATE',
          0.6,
          [...ev('error'), ...ev('cleanup')],
          [],
          'Account fixture/state problem (creation, duplicate, or cleanup).',
        )
      : null,
  // Flakiness: passed on retry, or mixed results across attempts.
  ({ f, ev }) => {
    const statuses = new Set(f.attempts.map((a) => a.status));
    if (f.outcome !== 'flaky' && !(statuses.has('passed') && statuses.size > 1)) return null;
    return h(
      'TIMING_OR_FLAKINESS',
      0.7,
      ev('retry-history'),
      [],
      'Same code passed and failed across attempts: non-deterministic behaviour.',
    );
  },
  // Changed test code + assertion/locator failure → script defect.
  ({ f, changed, ev, netEv }) => {
    const touched = changed.filter((p) => TEST_CODE_RE.test(p));
    const failingFileTouched = changed.some((p) => p.endsWith(f.file) || f.file.endsWith(p));
    if (!touched.length) return null;
    const assertion = VALUE_RE.test(f.errorMessage) || LOCATOR_RE.test(f.errorMessage);
    if (!assertion) return null;
    return h(
      'TEST_SCRIPT_DEFECT',
      failingFileTouched ? 0.75 : 0.55,
      [...ev('error'), ...ev('diff')],
      netEv,
      `Test code changed in this commit range (${touched.slice(0, 5).join(', ')})${failingFileTouched ? ', including the failing spec' : ''}, and the failure is an assertion/locator failure.`,
    );
  },
  // Locator not found, no test-code change → UI change on the site.
  ({ f, changed, ev }) => {
    if (!LOCATOR_RE.test(f.errorMessage) || !TIMEOUT_RE.test(f.errorMessage)) return null;
    const touched = changed.some((p) => TEST_CODE_RE.test(p));
    return h(
      'LOCATOR_OR_UI_CHANGE',
      touched ? 0.3 : 0.5,
      [...ev('error'), ...ev('screenshot'), ...ev('trace')],
      touched ? ev('diff') : [],
      'Element could not be found/resolved in time with no first-party network errors; the page structure may have changed.',
    );
  },
  // Value mismatch with no code change and clean network → candidate product defect.
  ({ f, changed, ev }) => {
    if (!VALUE_RE.test(f.errorMessage) || TIMEOUT_RE.test(f.errorMessage)) return null;
    const touched = changed.some((p) => TEST_CODE_RE.test(p));
    return h(
      'PRODUCT_DEFECT',
      touched || f.networkFailures.length ? 0.25 : 0.45,
      [...ev('error'), ...ev('screenshot')],
      touched ? ev('diff') : [],
      'Deterministic value mismatch against a computed/API oracle with no test-code change. Must be reproduced manually before being reported as a product defect.',
    );
  },
  ({ f, ev }) =>
    TIMEOUT_RE.test(f.errorMessage)
      ? h(
          'TIMING_OR_FLAKINESS',
          0.3,
          [...ev('error'), ...ev('retry-history')],
          [],
          'Generic timeout; slow site or synchronization gap.',
        )
      : null,
];

/** Confidence is a calibrated judgement – reduced automatically when key artifacts are missing. */
function calibrate(
  top: Hypothesis,
  f: FailureRecord,
  all: Hypothesis[],
): { confidence: number; notes: string[] } {
  let c = top.score;
  const notes: string[] = [];
  if (f.project !== 'api' && !f.artifacts.trace) {
    c -= 0.1;
    notes.push('no trace');
  }
  if (f.project !== 'api' && !f.artifacts.screenshot) {
    c -= 0.05;
    notes.push('no screenshot');
  }
  if (f.attempts.length < 2 && !f.faultInjection) {
    c -= 0.05;
    notes.push('single attempt – reproducibility unknown');
  }
  const runnerUp = all[1];
  if (runnerUp && top.score - runnerUp.score < 0.15) {
    c -= 0.1;
    notes.push(`close alternative: ${runnerUp.category}`);
  }
  return { confidence: Math.round(Math.max(0, Math.min(0.95, c)) * 100) / 100, notes };
}

const OWNER: Record<Category, string> = {
  PRODUCT_DEFECT: 'Product engineering (after QA reproduction)',
  TEST_SCRIPT_DEFECT: 'QA automation',
  LOCATOR_OR_UI_CHANGE: 'QA automation',
  TEST_DATA_OR_STATE: 'QA automation',
  ENVIRONMENT_OR_NETWORK: 'CI / infrastructure',
  TIMING_OR_FLAKINESS: 'QA automation',
  THIRD_PARTY_DEPENDENCY: 'QA automation + infrastructure',
  UNKNOWN: 'QA on-call triage',
};

const ACTION: Record<Category, string> = {
  PRODUCT_DEFECT:
    'Reproduce manually on the live site, confirm oracle, then raise a defect with trace + steps. Do not change the test.',
  TEST_SCRIPT_DEFECT:
    'Inspect the diff of the failing spec/page object; prepare a minimal patch on a branch; re-run the isolated test; human review before merge.',
  LOCATOR_OR_UI_CHANGE:
    'Open the trace/DOM snapshot at the failing step; update the locator following skills/playwright.md (role/label first); do not weaken the assertion.',
  TEST_DATA_OR_STATE: 'Check fixture creation/cleanup logs; verify uniqueness of test data; re-run isolated.',
  ENVIRONMENT_OR_NETWORK:
    'Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.',
  TIMING_OR_FLAKINESS:
    'Re-run isolated with --repeat-each to measure; find the missing wait condition; never add fixed sleeps or blanket timeout increases.',
  THIRD_PARTY_DEPENDENCY:
    'Confirm ad/consent blocking list covers the host seen in the trace; extend config/environment.ts if needed.',
  UNKNOWN:
    'Insufficient evidence. Re-run the isolated test with tracing and inspect manually; record findings.',
};

function severity(category: Category, priority: string): RcaRecord['business_severity'] {
  if (category !== 'PRODUCT_DEFECT' && category !== 'UNKNOWN') return 'NONE';
  const base =
    priority === 'P0' ? 'CRITICAL' : priority === 'P1' ? 'HIGH' : priority === 'P2' ? 'MEDIUM' : 'MEDIUM';
  // UNKNOWN keeps a provisional severity so P0 unknowns are not ignored.
  return category === 'UNKNOWN' && base === 'CRITICAL' ? 'HIGH' : base;
}

export function classifyFailure(f: FailureRecord, changed: string[]): RcaRecord {
  // Synthesize a diff evidence item so rules can cite it.
  if (changed.length && !f.evidence.some((e) => e.type === 'diff')) {
    f.evidence.push({
      id: `E${f.evidence.length + 1}`,
      type: 'diff',
      summary: `changed files: ${changed.slice(0, 15).join(', ')}`,
    });
  }
  const ev = (type: string) => f.evidence.filter((e) => e.type === type).map((e) => e.id);
  const netEv = f.networkFailures.length ? ev('network') : [];
  const ctx: Ctx = { f, changed, ev, netEv };

  // Keep the best hypothesis per category.
  const byCat = new Map<Category, Hypothesis>();
  for (const rule of rules) {
    const hyp = rule(ctx);
    if (hyp && (!byCat.has(hyp.category) || (byCat.get(hyp.category)?.score ?? 0) < hyp.score))
      byCat.set(hyp.category, hyp);
  }
  // If the fault-injection rule fired, the product-defect hypothesis is explicitly ruled out.
  if (f.faultInjection) {
    const pd = byCat.get('PRODUCT_DEFECT');
    if (pd)
      byCat.set('PRODUCT_DEFECT', {
        ...pd,
        score: Math.min(pd.score, 0.05),
        evidence_against: [...pd.evidence_against, ...ev('annotation')],
        rationale: `${pd.rationale} Ruled out: failure was injected by the test.`,
      });
  }
  const hyps = [...byCat.values()].sort((a, b) => b.score - a.score);
  const top = hyps[0];
  let classification: Category = 'UNKNOWN';
  let confidence = 0.2;
  let notes: string[] = ['no rule matched'];
  if (top && top.score >= 0.4) {
    ({ confidence, notes } = calibrate(top, f, hyps));
    classification = confidence >= 0.35 ? top.category : 'UNKNOWN';
  }
  const chosen = classification === 'UNKNOWN' ? undefined : top;

  return {
    scenario_id: f.scenarioId,
    test_id: f.testId,
    title: f.title,
    classification,
    confidence,
    status: 'HYPOTHESIS_PENDING_REVIEW',
    business_severity: severity(classification, f.priority),
    symptom: f.errorMessage.split('\n').slice(0, 3).join(' ').slice(0, 300) || '(no message)',
    first_failure: f.errorLocation
      ? `First failing assertion/action at ${f.errorLocation}`
      : 'Location not captured',
    evidence: f.evidence,
    hypotheses: hyps.length
      ? hyps
      : [h('UNKNOWN', 0.2, ev('error'), [], 'No rule matched the available evidence.')],
    alternatives: hyps.filter((x) => x !== chosen).map((x) => `${x.category} (${x.score.toFixed(2)})`),
    validation: `Re-run isolated: npx playwright test ${f.file}:${f.line} --project=${f.project} --trace on; open trace; check: ${notes.join('; ') || 'n/a'}`,
    reproduction: `npx playwright test ${f.file}:${f.line} --project=${f.project}`,
    recommended_action: ACTION[classification],
    owner: OWNER[classification],
    ...(f.faultInjection ? { fault_injection: f.faultInjection } : {}),
    analysis_mode: 'deterministic',
    requires_human_approval: true,
  };
}

/**
 * Cross-failure correlation: many failures with the same error signature usually share one cause
 * (first failure vs downstream symptoms). Shared signatures are flagged so triage starts once.
 */
function signature(r: RcaRecord): string {
  // First line only (drops the per-request call log), and ignore which request API method was used.
  return (r.symptom.split('Call log')[0] ?? r.symptom)
    .replace(/apiRequestContext\.\w+/g, 'apiRequestContext')
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/\d+/g, '#')
    .slice(0, 80);
}

export function classifyBundle(bundle: FailureBundle): RcaRecord[] {
  const records = bundle.failures.map((f) => classifyFailure(f, bundle.meta.changedFiles));
  const groups = new Map<string, RcaRecord[]>();
  for (const r of records) groups.set(signature(r), [...(groups.get(signature(r)) ?? []), r]);
  for (const [sig, group] of groups) {
    if (group.length < 2) continue;
    for (const r of group) {
      r.first_failure = `${r.first_failure}. Shares error signature with ${group.length - 1} other failure(s) in this run ("${sig}…") – likely one common cause; triage once.`;
      if (r.classification === 'ENVIRONMENT_OR_NETWORK')
        r.confidence = Math.min(0.95, Math.round((r.confidence + 0.05) * 100) / 100);
    }
  }
  return records;
}
