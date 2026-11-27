/**
 * Stage 1 of the self-healing agent: decide whether a failure may be healed at all.
 * This is the most important part of the agent. Healing the wrong failure hides a real problem,
 * so the default answer is "no" and only two narrow kinds of change are ever attempted.
 */
import type { FailureRecord, RcaRecord } from '../rca/types';

export type HealAction = { action: 'locator' | 'assertion' } | { action: 'decline'; reason: string };

export const MIN_CONFIDENCE = 0.5;

const LOCATOR_MISSING_RE =
  /element\(s\) not found|resolved to 0 elements|waiting for (locator\(|getBy)|Timeout \d+ms exceeded[\s\S]*waiting for/i;
const VALUE_MISMATCH_RE = /expect\(received\)\.(toBe|toEqual|toStrictEqual)|Expected: [\s\S]*Received: /i;

export function decide(record: RcaRecord, f: FailureRecord): HealAction {
  if (f.faultInjection)
    return {
      action: 'decline',
      reason: `runtime fault injection (${f.faultInjection.split(':')[0]}): the fault is in the test harness on purpose, not in test code`,
    };
  if (f.outcome === 'flaky')
    return {
      action: 'decline',
      reason: 'passed on retry (flaky): the same code passed, so there is no code defect to heal',
    };
  const server5xx = f.networkFailures.some((n) => Number(n.status) >= 500);
  if (f.siteUnavailable || server5xx)
    return {
      action: 'decline',
      reason: 'the site returned 5xx errors during the test: environment, not test code',
    };

  const productPlausible = record.hypotheses.some((h) => h.category === 'PRODUCT_DEFECT' && h.score >= 0.5);
  switch (record.classification) {
    case 'PRODUCT_DEFECT':
      return {
        action: 'decline',
        reason:
          'never heal a possible product defect: the test may be right and the product wrong (reproduce manually)',
      };
    case 'ENVIRONMENT_OR_NETWORK':
    case 'THIRD_PARTY_DEPENDENCY':
      return {
        action: 'decline',
        reason: 'environment or third-party failure: nothing to change in test code',
      };
    case 'TIMING_OR_FLAKINESS':
      return {
        action: 'decline',
        reason:
          'timing problem: fix synchronisation by hand; the agent never adds sleeps, retries or longer timeouts',
      };
    case 'TEST_DATA_OR_STATE':
      return { action: 'decline', reason: 'test data / state problem: fix the fixture by hand' };
    case 'UNKNOWN':
      return { action: 'decline', reason: 'cause unknown: manual triage first' };
    case 'LOCATOR_OR_UI_CHANGE':
    case 'TEST_SCRIPT_DEFECT':
      break;
  }
  if (record.confidence < MIN_CONFIDENCE)
    return {
      action: 'decline',
      reason: `confidence ${record.confidence} below ${MIN_CONFIDENCE}: manual triage`,
    };
  if (productPlausible)
    return {
      action: 'decline',
      reason: 'a product defect is still a plausible alternative (score ≥ 0.5): manual triage',
    };
  if (LOCATOR_MISSING_RE.test(f.errorMessage)) return { action: 'locator' };
  if (VALUE_MISMATCH_RE.test(f.errorMessage)) return { action: 'assertion' };
  return {
    action: 'decline',
    reason: 'no healable pattern (not a missing element and not a value mismatch)',
  };
}
