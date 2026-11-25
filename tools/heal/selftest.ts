/**
 * Offline self-test of the self-healing agent (no network, no browser, no model).
 *   npm run heal:selftest
 * Covers the policy (what must never be healed), locator parsing and matching, assertion
 * guardrails, and the full engine loop on a temporary copy with fake validator / model.
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Category, FailureRecord, RcaRecord } from '../rca/types';
import { vetAssertionProposal } from './assertion';
import { type HealDeps, healAll } from './engine';
import { chooseByRules, findLiteral, parseBrokenLocator, parseSnapshot, similarity } from './locator';
import { decide } from './policy';
import type { ValidationResult } from './types';

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed++;
  console.log(`ok - ${name}`);
}

const LOCATOR_ERR = `Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Write a Review' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found`;
const VALUE_ERR = `Error: [AE-12|P0] line total for 4 units = 4 x unit price

expect(received).toBe(expected) // Object.is equality

Expected: 1500
Received: 2000`;

function failure(p: Partial<FailureRecord> = {}): FailureRecord {
  return {
    testId: 'abc123def456',
    title: 'AE-18 customer can submit a product review',
    file: 'tests/ui/a.spec.ts',
    line: 3,
    project: 'ui',
    scenarioId: 'AE-18',
    priority: 'P1',
    tags: [],
    outcome: 'unexpected',
    attempts: [],
    errorMessage: LOCATOR_ERR,
    stackTop: [],
    networkFailures: [],
    slowOrPending: [],
    consoleErrors: [],
    cleanup: [],
    artifacts: { errorContext: 'error-context.md' },
    recentCommitsTouchingTest: [],
    evidence: [],
    ...p,
  };
}

function record(category: Category, confidence: number, extra: Array<[Category, number]> = []): RcaRecord {
  return {
    scenario_id: 'AE-18',
    test_id: 'abc123def456',
    title: 't',
    classification: category,
    confidence,
    status: 'HYPOTHESIS_PENDING_REVIEW',
    business_severity: 'LOW',
    symptom: '',
    first_failure: '',
    evidence: [],
    hypotheses: [[category, confidence] as [Category, number], ...extra].map(([c, s]) => ({
      category: c,
      score: s,
      evidence_for: ['E1'],
      evidence_against: [],
      rationale: 'synthetic',
    })),
    alternatives: [],
    validation: '',
    reproduction: '',
    recommended_action: '',
    owner: '',
    analysis_mode: 'deterministic',
    requires_human_approval: true,
  };
}

const SNAPSHOT = [
  '# Page snapshot',
  '```yaml',
  '- banner:',
  '  - link " Home":',
  '    - /url: /',
  '  - link " Contact us":',
  '- heading "Category" [level=2]',
  '- link "View Product":',
  '- link "Write Your Review":',
  '  - /url: "#reviews"',
  '- textbox "Your Name"',
  '- text: Availability',
  '```',
].join('\n');

async function main(): Promise<void> {
  // ---- Policy: what must never be healed -------------------------------------------------------
  const declines: Array<[string, RcaRecord, FailureRecord, RegExp]> = [
    [
      'FI-03 timing injection',
      record('TIMING_OR_FLAKINESS', 0.7),
      failure({ faultInjection: 'FI-03: 6000ms delay' }),
      /fault injection \(FI-03\)/,
    ],
    [
      'FI-02 network injection',
      record('ENVIRONMENT_OR_NETWORK', 0.75),
      failure({ faultInjection: 'FI-02: abort add_to_cart' }),
      /fault injection/,
    ],
    ['flaky (passed on retry)', record('LOCATOR_OR_UI_CHANGE', 0.6), failure({ outcome: 'flaky' }), /flaky/],
    [
      'site 5xx during test',
      record('LOCATOR_OR_UI_CHANGE', 0.6),
      failure({ networkFailures: [{ status: 503 }] }),
      /5xx/,
    ],
    [
      'product defect',
      record('PRODUCT_DEFECT', 0.45),
      failure({ errorMessage: VALUE_ERR }),
      /product defect/,
    ],
    ['environment', record('ENVIRONMENT_OR_NETWORK', 0.85), failure(), /environment/],
    ['timing', record('TIMING_OR_FLAKINESS', 0.7), failure(), /sleeps, retries or longer timeouts/],
    ['low confidence', record('TEST_SCRIPT_DEFECT', 0.45), failure(), /below 0.5/],
    [
      'product still plausible',
      record('TEST_SCRIPT_DEFECT', 0.55, [['PRODUCT_DEFECT', 0.5]]),
      failure({ errorMessage: VALUE_ERR }),
      /product defect is still a plausible/,
    ],
  ];
  for (const [name, r, f, re] of declines)
    await check(`policy declines: ${name}`, () => {
      const d = decide(r, f);
      assert.equal(d.action, 'decline');
      assert.match(d.action === 'decline' ? d.reason : '', re);
    });
  await check('policy: locator not found with LOCATOR_OR_UI_CHANGE 0.5 → locator healing', () =>
    assert.equal(decide(record('LOCATOR_OR_UI_CHANGE', 0.5), failure()).action, 'locator'),
  );
  await check('policy: FI-01 value mismatch with TEST_SCRIPT_DEFECT 0.75 → assertion proposal', () =>
    assert.equal(
      decide(record('TEST_SCRIPT_DEFECT', 0.75), failure({ errorMessage: VALUE_ERR })).action,
      'assertion',
    ),
  );

  // ---- Locator parsing and matching ------------------------------------------------------------
  await check('parse expect locator', () =>
    assert.deepEqual(parseBrokenLocator(LOCATOR_ERR), {
      method: 'role',
      role: 'link',
      value: 'Write a Review',
      expression: "getByRole('link', { name: 'Write a Review' })",
    }),
  );
  await check('parse chained locator, leaf call wins', () =>
    assert.equal(
      parseBrokenLocator("Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })")?.value,
      'Added!',
    ),
  );
  await check('parse action timeout call log', () => {
    const b = parseBrokenLocator(
      "locator.click: Timeout 15000ms exceeded.\nCall log:\n  - waiting for getByText('Proceed To Checkout')",
    );
    assert.equal(b?.method, 'text');
    assert.equal(b?.value, 'Proceed To Checkout');
  });
  await check('parse test id and skip regex names', () => {
    assert.equal(parseBrokenLocator("Locator: getByTestId('login-button')")?.method, 'testid');
    assert.equal(parseBrokenLocator("Locator: getByRole('link', { name: /^Women$/ })"), null);
  });
  const nodes = parseSnapshot(SNAPSHOT);
  await check('snapshot: roles, names, icon glyphs removed', () => {
    assert.ok(nodes.some((n) => n.role === 'link' && n.name === 'Home'));
    assert.ok(nodes.some((n) => n.role === 'link' && n.name === 'Write Your Review'));
    assert.ok(nodes.some((n) => n.role === 'text' && n.name === 'Availability'));
  });
  await check('similarity orders a rename above unrelated links', () =>
    assert.ok(
      similarity('Write a Review', 'Write Your Review') > similarity('Write a Review', 'View Product') + 0.2,
    ),
  );
  await check('rules choose "Write Your Review" for stale "Write a Review"', () => {
    const c = chooseByRules({ method: 'role', role: 'link', value: 'Write a Review', expression: '' }, nodes);
    assert.ok(c.ok);
    assert.equal(c.ok && c.choice.name, 'Write Your Review');
  });
  await check('rules refuse when the old value is still on the page (timing, not a stale locator)', () => {
    const c = chooseByRules({ method: 'role', role: 'link', value: 'View Product', expression: '' }, nodes);
    assert.ok(!c.ok && /still on the page/.test(c.reason));
  });
  await check('rules refuse unrelated names (no candidate)', () => {
    const c = chooseByRules({ method: 'role', role: 'link', value: 'Checkout now', expression: '' }, nodes);
    assert.ok(!c.ok);
  });

  // ---- Assertion guardrails (FI-01 shape) ------------------------------------------------------
  const src = [
    '    const lines = await app.cart.lines();',
    "    expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 3);",
  ];
  const old = src[1]!.trim();
  const vet = (n: string, line = 2, o = old) =>
    vetAssertionProposal({ line, old: o, new: n, rationale: '' }, src, 2, VALUE_ERR);
  await check('assertion: fixing the oracle (× 3 → × 4) is accepted', () =>
    assert.equal(vet(old.replace('* 3', '* 4')), null),
  );
  await check('assertion: copying the observed value is rejected', () =>
    assert.match(vet(old.replace('added.unitPrice * 3', '2000')) ?? '', /hard-codes the observed value/),
  );
  for (const [name, n, re] of [
    ['inverted', old.replace(').toBe', ').not.toBe'), /inverts/],
    ['weakened matcher', old.replace('.toBe(added.unitPrice * 3)', '.toBeTruthy()'), /weakens/],
    ['removed assertion', 'const total = lines[0]?.total;', /removes an assertion/],
    ['timeout', old.replace(')).toBe', '), { timeout: 60000 }).toBe'), /timeout/],
    ['dropped tag', 'expect(lines[0]?.total).toBe(added.unitPrice * 4);', /tag/],
  ] as Array<[string, string, RegExp]>)
    await check(`assertion guardrail: ${name}`, () => assert.match(vet(n) ?? '', re));
  await check('assertion: "old" must match the file and stay near the failing line', () => {
    assert.match(vet(old.replace('* 3', '* 4'), 2, 'something else') ?? '', /does not match/);
    assert.match(
      vetAssertionProposal({ line: 40, old, new: old, rationale: '' }, src, 2, VALUE_ERR) ?? '',
      /does not exist|too far/,
    );
  });

  // ---- Engine end-to-end on a temporary repo copy ----------------------------------------------
  const cwd = process.cwd();
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'heal-selftest-'));
  try {
    process.chdir(tmp);
    mkdirSync('src/pages', { recursive: true });
    mkdirSync('tests/ui', { recursive: true });
    const pageSrc =
      "export const reviewHeading = (page) => page.getByRole('link', { name: 'Write a Review' });\n";
    writeFileSync('src/pages/Catalog.ts', pageSrc);
    writeFileSync('tests/ui/cart.spec.ts', ['// spec', ...src, ''].join('\n'));
    writeFileSync('error-context.md', SNAPSHOT);
    const green: ValidationResult = {
      typecheck: true,
      lint: true,
      runs: { passed: 3, total: 3 },
      command: 'fake',
    };
    let validatedWith = '';
    const deps = (over: Partial<HealDeps> = {}): HealDeps => ({
      validator: (file) => {
        validatedWith = readFileSync(file, 'utf8');
        return green;
      },
      diff: () => 'DIFF',
      writePatch: (name) => `patches/${name}`,
      outDir: 'out',
      maxAttempts: 3,
      ...over,
    });
    const bundle = (fs: FailureRecord[]) => ({ meta: {} as never, failures: fs });

    await check('engine: stale locator → proposed LOCATOR patch, validated, file restored', async () => {
      const { results } = await healAll(bundle([failure()]), [record('LOCATOR_OR_UI_CHANGE', 0.5)], deps());
      assert.equal(results[0]?.status, 'proposed');
      assert.equal(results[0]?.kind, 'LOCATOR');
      assert.match(validatedWith, /'Write Your Review'/);
      assert.equal(readFileSync('src/pages/Catalog.ts', 'utf8'), pageSrc);
    });
    await check('engine: one root cause, one patch (second failure → "same fix")', async () => {
      const second = failure({ testId: 'zzz999', scenarioId: 'AE-20' });
      const recs = [
        record('LOCATOR_OR_UI_CHANGE', 0.5),
        { ...record('LOCATOR_OR_UI_CHANGE', 0.5), test_id: 'zzz999' },
      ];
      const { results } = await healAll(bundle([failure(), second]), recs, deps());
      assert.equal(results[1]?.status, 'proposed');
      assert.match(results[1]?.reason ?? '', /same fix as AE-18/);
      assert.equal(results[0]?.alsoFixes?.length, 1);
    });
    await check('engine: failed validation → rejected, nothing proposed, file restored', async () => {
      const red = { ...green, runs: { passed: 1, total: 3 } };
      const { results } = await healAll(
        bundle([failure()]),
        [record('LOCATOR_OR_UI_CHANGE', 0.5)],
        deps({ validator: () => red }),
      );
      assert.equal(results[0]?.status, 'rejected');
      assert.equal(results[0]?.patchPath, undefined);
      assert.equal(readFileSync('src/pages/Catalog.ts', 'utf8'), pageSrc);
    });
    const fi01 = failure({
      scenarioId: 'AE-12',
      errorMessage: VALUE_ERR,
      errorLocation: 'tests/ui/cart.spec.ts:3:79',
    });
    await check('engine: FI-01 without AI → no assertion change (needs AI + human)', async () => {
      const { results } = await healAll(bundle([fi01]), [record('TEST_SCRIPT_DEFECT', 0.75)], deps());
      assert.equal(results[0]?.status, 'no-fix-found');
    });
    await check('engine: FI-01 with AI → ASSERTION_CHANGE × 4, validated', async () => {
      const ask = async () => ({
        model: 'fake',
        text: JSON.stringify({
          line: 3,
          old,
          new: old.replace('* 3', '* 4'),
          rationale: 'test multiplies by 3 for 4 units',
        }),
      });
      const { results } = await healAll(bundle([fi01]), [record('TEST_SCRIPT_DEFECT', 0.75)], deps({ ask }));
      assert.equal(results[0]?.status, 'proposed', results[0]?.reason);
      assert.equal(results[0]?.kind, 'ASSERTION_CHANGE');
      assert.match(results[0]?.edit?.after ?? '', /unitPrice \* 4\);$/);
      assert.match(validatedWith, /\* 4\)/);
    });
    await check('engine: AI that copies the observed value is blocked', async () => {
      const ask = async () => ({
        model: 'fake',
        text: JSON.stringify({
          line: 3,
          old,
          new: old.replace('added.unitPrice * 3', '2000'),
          rationale: 'match',
        }),
      });
      const { results } = await healAll(bundle([fi01]), [record('TEST_SCRIPT_DEFECT', 0.75)], deps({ ask }));
      assert.equal(results[0]?.status, 'no-fix-found');
      assert.match(results[0]?.reason ?? '', /hard-codes/);
    });
    await check('engine: AI locator choice must be an element that was on the page', async () => {
      const f = failure({ errorMessage: LOCATOR_ERR.replace('Write a Review', 'Leave feedback') });
      writeFileSync('src/pages/Catalog.ts', pageSrc.replace('Write a Review', 'Leave feedback'));
      const ask = async () => ({
        model: 'fake',
        text: JSON.stringify({ choice: 'Leave a Review', rationale: 'guess' }),
      });
      const { results } = await healAll(bundle([f]), [record('LOCATOR_OR_UI_CHANGE', 0.5)], deps({ ask }));
      assert.equal(results[0]?.status, 'no-fix-found');
      writeFileSync('src/pages/Catalog.ts', pageSrc);
    });
    await check('engine: literal must be unique in page objects/specs', async () => {
      writeFileSync('tests/ui/other.spec.ts', "const x = 'Write a Review';\n");
      assert.equal(findLiteral('Write a Review').length, 2);
      const { results } = await healAll(bundle([failure()]), [record('LOCATOR_OR_UI_CHANGE', 0.5)], deps());
      assert.equal(results[0]?.status, 'no-fix-found');
      rmSync('tests/ui/other.spec.ts');
    });
    await check('engine: declined failures never reach validation; budget respected', async () => {
      let calls = 0;
      const counting = deps({ validator: () => ((calls += 1), green), maxAttempts: 0 });
      const { results } = await healAll(
        bundle([failure(), failure({ testId: 'x2', faultInjection: 'FI-03: delay' })]),
        [record('LOCATOR_OR_UI_CHANGE', 0.5), { ...record('TIMING_OR_FLAKINESS', 0.7), test_id: 'x2' }],
        counting,
      );
      assert.equal(calls, 0);
      assert.match(results[0]?.reason ?? '', /budget/);
      assert.equal(results[1]?.status, 'declined');
    });
  } finally {
    process.chdir(cwd);
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`Self-healing self-test: ${passed}/${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
