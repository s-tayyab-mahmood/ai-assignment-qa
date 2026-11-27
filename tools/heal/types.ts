/** Shared types for the self-healing agent (tools/heal). */

export type HealKind = 'LOCATOR' | 'ASSERTION_CHANGE';

export type HealStatus =
  /** Patch written and proven: type check, lint and 3 isolated green runs. Needs human review. */
  | 'proposed'
  /** A change was tried but failed validation; nothing is proposed. */
  | 'rejected'
  /** Policy said no: healing would be unsafe or meaningless for this failure. */
  | 'declined'
  /** Healable in principle, but no safe, unique change was found. */
  | 'no-fix-found';

export interface SourceEdit {
  file: string;
  line: number;
  before: string;
  after: string;
}

export interface ValidationResult {
  typecheck: boolean;
  lint: boolean;
  runs: { passed: number; total: number };
  command: string;
  log?: string;
}

export interface HealResult {
  scenarioId: string;
  testId: string;
  title: string;
  classification: string;
  confidence: number;
  status: HealStatus;
  kind?: HealKind;
  reason: string;
  /** How the change was found: rules (aria snapshot) or AI (validated against the snapshot/source). */
  source?: 'rules' | 'ai';
  edit?: SourceEdit;
  patchPath?: string;
  validation?: ValidationResult;
  /** Other failing tests fixed by the same edit (one root cause, one patch). */
  alsoFixes?: string[];
}

export interface HealAudit {
  ts: string;
  test_id: string;
  scenario_id: string;
  step: 'policy' | 'locator-rules' | 'locator-ai' | 'assertion-ai' | 'validation';
  decision: string;
  reason?: string;
  model?: string;
  prompt_sha256?: string;
  latency_ms?: number;
}
