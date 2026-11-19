import { z } from 'zod';

export const CATEGORIES = [
  'PRODUCT_DEFECT',
  'TEST_SCRIPT_DEFECT',
  'LOCATOR_OR_UI_CHANGE',
  'TEST_DATA_OR_STATE',
  'ENVIRONMENT_OR_NETWORK',
  'TIMING_OR_FLAKINESS',
  'THIRD_PARTY_DEPENDENCY',
  'UNKNOWN',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Evidence {
  id: string; // E1, E2 … – referenced by hypotheses and by the AI output (must exist)
  type:
    | 'error'
    | 'stack'
    | 'trace'
    | 'screenshot'
    | 'video'
    | 'network'
    | 'console'
    | 'diff'
    | 'retry-history'
    | 'annotation'
    | 'cleanup';
  summary: string; // redacted, clipped
  path?: string;
}

export interface Attempt {
  retry: number;
  status: string;
  durationMs: number;
  errorMessage?: string;
}

export interface FailureRecord {
  testId: string;
  title: string;
  file: string;
  line: number;
  project: string;
  scenarioId: string;
  priority: string;
  tags: string[];
  outcome: 'unexpected' | 'flaky';
  faultInjection?: string;
  /** Set when the site served a 5xx error page for a whole page (document) during the test. */
  siteUnavailable?: string;
  attempts: Attempt[];
  errorMessage: string;
  errorLocation?: string;
  stackTop: string[];
  networkFailures: Array<Record<string, unknown>>;
  /** First-party requests still open when the test ended, or slower than 5 s. */
  slowOrPending: Array<Record<string, unknown>>;
  /** Completed first-party XHR/fetch calls; undefined when the run did not record them (older runs). */
  xhrLog?: Array<Record<string, unknown>>;
  consoleErrors: Array<Record<string, unknown>>;
  cleanup: Array<Record<string, unknown>>;
  artifacts: { trace?: string; screenshot?: string; video?: string };
  recentCommitsTouchingTest: string[];
  evidence: Evidence[];
}

export interface RunMeta {
  generatedAt: string;
  reportFound: boolean;
  reportPath: string;
  note?: string;
  commitSha: string;
  branch: string;
  runUrl?: string;
  event?: string;
  changedFiles: string[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    flaky: number;
    skipped: number;
    durationMs: number;
  };
  globalErrors: string[];
}

export interface FailureBundle {
  meta: RunMeta;
  failures: FailureRecord[];
}

export const HypothesisSchema = z.object({
  category: z.enum(CATEGORIES),
  score: z.number().min(0).max(1),
  evidence_for: z.array(z.string()),
  evidence_against: z.array(z.string()),
  rationale: z.string(),
});
export type Hypothesis = z.infer<typeof HypothesisSchema>;

/** Machine-readable RCA record (mirrors tools/rca/schema/rca-record.schema.json). */
export const RcaRecordSchema = z.object({
  scenario_id: z.string(),
  test_id: z.string(),
  title: z.string(),
  classification: z.enum(CATEGORIES),
  confidence: z.number().min(0).max(1),
  status: z.literal('HYPOTHESIS_PENDING_REVIEW'),
  business_severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
  symptom: z.string(),
  first_failure: z.string(),
  evidence: z.array(
    z.object({ id: z.string(), type: z.string(), summary: z.string(), path: z.string().optional() }),
  ),
  hypotheses: z.array(HypothesisSchema),
  alternatives: z.array(z.string()),
  validation: z.string(),
  reproduction: z.string(),
  recommended_action: z.string(),
  owner: z.string(),
  fault_injection: z.string().optional(),
  cleanup_warning: z.string().optional(),
  analysis_mode: z.enum(['deterministic', 'ai-assisted', 'ai-rejected-fallback']),
  ai: z
    .object({
      model: z.string(),
      agreed_with_deterministic: z.boolean(),
      rejection_reason: z.string().optional(),
    })
    .optional(),
  requires_human_approval: z.literal(true),
});
export type RcaRecord = z.infer<typeof RcaRecordSchema>;

/** What the model is asked to return. Validated strictly; anything else is rejected. */
export const AiOutputSchema = z.object({
  classification: z.enum(CATEGORIES),
  confidence: z.number().min(0).max(1),
  hypotheses: z.array(HypothesisSchema).min(1).max(5),
  first_failure: z.string().max(500),
  validation: z.string().max(600),
  recommended_action: z.string().max(600),
});
export type AiOutput = z.infer<typeof AiOutputSchema>;
