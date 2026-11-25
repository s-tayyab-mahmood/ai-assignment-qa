/**
 * Assertion-change proposals (TEST_SCRIPT_DEFECT with a value mismatch, e.g. FI-01).
 * Only the AI proposes these, and only as a one-line edit near the failing line. Guardrails reject
 * anything that weakens the test. Every accepted proposal is labelled ASSERTION_CHANGE: a reviewer
 * must confirm the new expectation is what the product should do, not just what it did.
 */
import { z } from 'zod';

export const AssertionProposalSchema = z.object({
  line: z.number().int().positive(),
  old: z.string().min(1).max(400),
  new: z.string().min(1).max(400),
  rationale: z.string().max(600),
});
export type AssertionProposal = z.infer<typeof AssertionProposalSchema>;

export const LocatorChoiceSchema = z.object({
  choice: z.string().max(200).nullable(),
  rationale: z.string().max(600),
});

/** Changes the agent must never make, whatever the model says. */
const FORBIDDEN: Array<[RegExp, string]> = [
  [/waitForTimeout|setTimeout|sleep\(/, 'adds a sleep'],
  [/\bforce\s*:\s*true/, 'forces an action'],
  [/\btimeout\s*:/, 'changes a timeout'],
  [/\bretries\b|\.retry\(/, 'adds retries'],
  [/test\.(skip|fixme|only|fail)\b|\.only\(/, 'skips or focuses a test'],
  [/eslint-disable|@ts-(ignore|expect-error|nocheck)/, 'silences a check'],
  [/expect\.soft/, 'turns a hard assertion into a soft one'],
  [/\.not\./, 'inverts an assertion'],
  [/toBeTruthy|toBeDefined|toBeGreaterThan|toBeLessThan|toContain\(|toMatch\(/, 'weakens the matcher'],
];

const numbers = (s: string) => new Set(s.match(/\b\d+(\.\d+)?\b/g) ?? []);
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

/** Extract the "Received: N" value of a toBe/toEqual failure. */
export function receivedValue(errorMessage: string): string | undefined {
  return /Received:\s*(-?\d+(?:\.\d+)?)/.exec(errorMessage)?.[1];
}

export function vetAssertionProposal(
  p: AssertionProposal,
  sourceLines: string[],
  failingLine: number,
  errorMessage: string,
): string | null {
  const actual = sourceLines[p.line - 1];
  if (actual === undefined) return `line ${p.line} does not exist`;
  if (Math.abs(p.line - failingLine) > 15)
    return `line ${p.line} is too far from the failing line ${failingLine}`;
  if (actual.trim() !== p.old.trim()) return `"old" does not match line ${p.line} of the file`;
  if (p.old.trim() === p.new.trim()) return 'no change proposed';
  if (/\n/.test(p.new)) return 'more than one line changed';
  for (const [re, why] of FORBIDDEN) if (re.test(p.new) && !re.test(p.old)) return `rejected: ${why}`;
  if (count(p.new, /expect\(/g) < count(p.old, /expect\(/g)) return 'rejected: removes an assertion';
  if (/tag\(/.test(p.old) && !/tag\(/.test(p.new)) return 'rejected: drops the scenario tag';
  const received = receivedValue(errorMessage);
  if (received && numbers(p.new).has(received) && !numbers(p.old).has(received))
    return `rejected: hard-codes the observed value ${received} instead of fixing the oracle`;
  return null;
}

export function assertionPrompt(
  file: string,
  failingLine: number,
  sourceLines: string[],
  errorMessage: string,
  rcaRationale: string,
): string {
  const from = Math.max(1, failingLine - 12);
  const to = Math.min(sourceLines.length, failingLine + 6);
  const numbered = sourceLines
    .slice(from - 1, to)
    .map((l, i) => `${String(from + i).padStart(4)}| ${l}`)
    .join('\n');
  return [
    `Failing file: ${file}, failing line ${failingLine}.`,
    'Source excerpt (numbered):',
    '```ts',
    numbered,
    '```',
    '<untrusted_evidence>',
    errorMessage,
    `RCA rationale: ${rcaRationale}`,
    '</untrusted_evidence>',
    'Return ONLY JSON: {"line": <number>, "old": "<exact current line>", "new": "<replacement line>", "rationale": "<why>"}.',
  ].join('\n');
}

export function locatorPrompt(
  broken: { method: string; role?: string; value: string; expression: string },
  candidates: Array<{ role: string; name: string }>,
): string {
  return [
    `A Playwright locator no longer matches: ${broken.expression}`,
    `Broken ${broken.method}${broken.role ? ` (role ${broken.role})` : ''}: "${broken.value}"`,
    '<untrusted_evidence>',
    'Elements of the same kind that WERE on the page when the test failed:',
    ...candidates.slice(0, 150).map((c) => `- ${c.role} "${c.name}"`),
    '</untrusted_evidence>',
    'If exactly one element is clearly the same control or heading under a new name, return its name exactly as listed.',
    'If none is clearly the same, return null.',
    'Return ONLY JSON: {"choice": "<name exactly as listed>" | null, "rationale": "<why>"}.',
  ].join('\n');
}
