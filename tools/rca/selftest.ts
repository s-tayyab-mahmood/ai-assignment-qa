/**
 * Offline self-test of the deterministic classifier and AI guardrails against synthetic, labelled
 * failure records (no network, no browser). Gives a repeatable "classification accuracy on known
 * fault patterns" number for the scorecard, and guards the classifier against regressions.
 *   npm run rca:selftest
 * Synthetic cases are NOT evidence of real runs; real FI-01/FI-02 evidence comes from actual runs.
 */
import assert from 'node:assert/strict';
import { mergeFirstFailure, vetAiOutput } from './ai';
import { classifyFailure } from './classify';
import type { Category, FailureRecord } from './types';

function rec(p: Partial<FailureRecord> & { errorMessage: string }): FailureRecord {
  const base: FailureRecord = {
    testId: 't',
    title: 'synthetic',
    file: 'tests/ui/cart.spec.ts',
    line: 1,
    project: 'ui',
    scenarioId: 'AE-12',
    priority: 'P0',
    tags: [],
    outcome: 'unexpected',
    attempts: [
      { retry: 0, status: 'failed', durationMs: 1000 },
      { retry: 1, status: 'failed', durationMs: 1000 },
    ],
    stackTop: [],
    networkFailures: [],
    slowOrPending: [],
    consoleErrors: [],
    cleanup: [],
    artifacts: { trace: 'trace.zip', screenshot: 'shot.png' },
    recentCommitsTouchingTest: [],
    evidence: [],
    ...p,
  };
  base.evidence = [
    { id: 'E1', type: 'error', summary: base.errorMessage },
    { id: 'E2', type: 'retry-history', summary: base.attempts.map((a) => a.status).join(',') },
    { id: 'E3', type: 'trace', summary: 'trace', path: 'trace.zip' },
    { id: 'E4', type: 'network', summary: base.networkFailures.length ? 'failures' : 'none' },
    ...(base.slowOrPending.length
      ? [
          {
            id: 'E6',
            type: 'network' as const,
            summary: '1 first-party request(s) slow (>5 s) or still pending at failure',
          },
        ]
      : []),
    ...(base.faultInjection ? [{ id: 'E5', type: 'annotation' as const, summary: base.faultInjection }] : []),
  ];
  return base;
}

const cases: Array<{ name: string; expect: Category; f: FailureRecord; changed: string[] }> = [
  {
    name: 'FI-01 pattern: wrong expected total after test-code change',
    expect: 'TEST_SCRIPT_DEFECT',
    changed: ['tests/ui/cart.spec.ts'],
    f: rec({ errorMessage: 'Error: [AE-12|P0] line total for 4 units\n\nExpected: 1500\nReceived: 2000' }),
  },
  {
    name: 'FI-02 pattern: aborted request with fault-injection annotation',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: [],
    f: rec({
      errorMessage: 'Error: Timed out 10000ms waiting for expect(locator).toBeVisible()',
      faultInjection: 'FI-02: route.abort(connectionfailed) on /add_to_cart/*',
      networkFailures: [
        {
          data: { url: 'https://automationexercise.com/add_to_cart/1', error: 'net::ERR_CONNECTION_FAILED' },
        },
      ],
    }),
  },
  {
    // As FI-02 will look in a real run: XHR aborted by route.abort, XHR log empty, modal never shown.
    // The no-effect-click rule must not fire (the request was sent and failed).
    name: 'FI-02 real-run shape: aborted XHR + empty XHR log',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: [],
    f: rec({
      errorMessage:
        "Error: expect(locator).toBeVisible() failed\n\nLocator: locator('#cartModal').getByRole('heading', { name: 'Added!' })\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found",
      faultInjection: 'FI-02: route.abort(connectionfailed) on /add_to_cart/*',
      networkFailures: [
        {
          data: {
            method: 'GET',
            url: 'https://automationexercise.com/add_to_cart/1',
            resourceType: 'xhr',
            error: 'net::ERR_CONNECTION_FAILED',
          },
        },
      ],
      xhrLog: [],
      attempts: [{ retry: 0, status: 'failed', durationMs: 12000 }],
    }),
  },
  {
    name: 'FI-03 pattern: pass/fail alternation with delay annotation',
    expect: 'TIMING_OR_FLAKINESS',
    changed: [],
    f: rec({
      errorMessage: 'Error: Timed out 3000ms waiting for expect(locator).toBeVisible()',
      faultInjection: 'FI-03: 6000ms delay on /add_to_cart every 2 repeats',
    }),
  },
  {
    name: 'DNS failure on the runner',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: [],
    f: rec({
      project: 'api',
      errorMessage: 'Error: apiRequestContext.get: getaddrinfo ENOTFOUND automationexercise.com',
    }),
  },
  {
    name: 'API request timeout on a single attempt',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: [],
    f: rec({
      project: 'api',
      errorMessage: 'TimeoutError: apiRequestContext.fetch: Timeout 15000ms exceeded.',
      attempts: [{ retry: 0, status: 'timedOut', durationMs: 15000 }],
      artifacts: { trace: 'trace.zip' },
    }),
  },
  {
    // Shape taken from the first live run (AE-12, 2026-11-19); the classifier wrongly said
    // TEST_SCRIPT_DEFECT because an unrelated src/ file had changed and the code frame matched.
    name: 'Live regression: goto timeout with unrelated src change',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: ['src/utils/redact.ts', 'tools/rca/classify.ts'],
    f: rec({
      errorMessage:
        'TimeoutError: page.goto: Timeout 30000ms exceeded.\nCall log:\n  - navigating to "https://automationexercise.com/products", waiting until "load"\n\n   34 |   async open(): Promise<void> {\n > 35 |     await this.page.goto(\'/products\');\n   36 |     await expect(this.allProductsHeading).toBeVisible();',
      file: 'tests/ui/cart.spec.ts',
      errorLocation: 'src/pages/CatalogPages.ts:35:21',
      attempts: [{ retry: 0, status: 'timedOut', durationMs: 30600 }],
    }),
  },
  {
    name: 'Element wait expired while a first-party XHR was still pending',
    expect: 'TIMING_OR_FLAKINESS',
    changed: [],
    f: rec({
      errorMessage:
        "Error: expect(locator).toBeVisible() failed\nLocator: locator('#cartModal').getByRole('heading', { name: 'Added!' })\nTimeout: 10000ms\nError: element(s) not found",
      slowOrPending: [
        { data: { url: 'https://automationexercise.com/add_to_cart/1', method: 'GET', openForMs: 11000 } },
      ],
    }),
  },
  {
    // Shape taken from the live run on 2026-11-19 (AE-12b repeat 2): /view_cart answered 503 with
    // "This website is under heavy load (queue full)"; classifier wrongly said TEST_SCRIPT_DEFECT.
    name: 'Live regression: site served 503 error page while page object had changed',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: ['src/pages/OrderPages.ts'],
    f: rec({
      errorMessage:
        "Error: expect(locator).toBeVisible() failed\n\nLocator: getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first()\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found",
      errorLocation: 'src/pages/OrderPages.ts:55:72',
      attempts: [{ retry: 0, status: 'failed', durationMs: 16878 }],
      siteUnavailable: 'HTTP 503 for /view_cart',
      networkFailures: [
        { data: { url: 'https://automationexercise.com/view_cart', status: 503, resourceType: 'document' } },
      ],
    }),
  },
  {
    // Shape taken from the live run 2026-11-19 (AE-15 repeat 0): add_to_cart XHR open 25 s,
    // cleanup timed out afterwards. Classifier said TIMING with TEST_DATA (cleanup) as runner-up.
    name: 'Live regression: XHR unanswered longer than the wait, plus cleanup timeout',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: [],
    f: rec({
      errorMessage:
        "Error: expect(locator).toBeVisible() failed\n\nLocator: locator('#cartModal').getByRole('heading', { name: 'Added!' })\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found",
      attempts: [{ retry: 0, status: 'failed', durationMs: 44882 }],
      slowOrPending: [
        {
          data: {
            url: 'https://automationexercise.com/add_to_cart/1',
            method: 'GET',
            type: 'xhr',
            openForMs: 25161,
          },
        },
      ],
      cleanup: [
        {
          event: 'account.cleanup.error',
          data: { error: 'TimeoutError: apiRequestContext.fetch: Timeout 15000ms exceeded.' },
        },
      ],
    }),
  },
  {
    // Shape of AE-15 in the smoke run 2026-11-19 14:44: details-page "Add to cart" clicked, modal never
    // appeared, no slow/pending request. With the XHR log, an empty log isolates "action never sent".
    name: 'Live regression: click had no effect (no XHR sent)',
    expect: 'TEST_SCRIPT_DEFECT',
    changed: [],
    f: rec({
      errorMessage:
        "Error: expect(locator).toBeVisible() failed\n\nLocator: locator('#cartModal').getByRole('heading', { name: 'Added!' })\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found",
      attempts: [{ retry: 0, status: 'failed', durationMs: 15891 }],
      xhrLog: [],
    }),
  },
  {
    // Shape of AE-15 in the run 2026-11-19 14:53: address lines read as [] while the other fields
    // matched; network log held only fonts aborted by navigation. RCA said ENVIRONMENT (0.50).
    name: 'Live regression: empty value from a read before render',
    expect: 'TEST_SCRIPT_DEFECT',
    changed: [],
    f: rec({
      errorMessage:
        'Error: [AE-15|P0] delivery address = fixture\n\nexpect(received).toEqual(expected) // deep equality\n\n- Expected  - 5\n+ Received  + 1\n\n  Object {\n    "country": "Canada",\n-   "lines": Array [\n-     "QA Practice Ltd",\n-   ],\n+   "lines": Array [],\n  }',
      networkFailures: [
        {
          data: {
            url: 'https://automationexercise.com/static/fonts/fontawesome-webfont.woff',
            resourceType: 'font',
            error: 'net::ERR_ABORTED',
          },
        },
      ],
      xhrLog: [{ data: { url: 'https://automationexercise.com/add_to_cart/2', ms: 395 } }],
    }),
  },
  {
    // AE-19, full run 2026-11-20: header link clicked on a blank page. RCA gave the right category
    // for the wrong reason ("no XHR sent").
    name: 'Live regression: test never opened a page (about:blank)',
    expect: 'TEST_SCRIPT_DEFECT',
    changed: [],
    f: rec({
      errorMessage:
        "TimeoutError: locator.click: Timeout 15000ms exceeded.\nCall log:\n  - waiting for locator('#header').getByRole('link', { name: 'Contact us' })",
      finalUrl: 'about:blank',
      xhrLog: [],
    }),
  },
  {
    // AE-15, full run 2026-11-20: 60 s test budget exhausted with /payment (document) still loading.
    name: 'Live regression: test timeout with a page still loading',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: [],
    f: rec({
      errorMessage: 'Test timeout of 60000ms exceeded.',
      attempts: [{ retry: 0, status: 'timedOut', durationMs: 68040 }],
      slowOrPending: [
        {
          data: {
            url: 'https://automationexercise.com/payment',
            method: 'POST',
            type: 'document',
            openForMs: 9000,
          },
        },
        {
          data: {
            url: 'https://automationexercise.com/static/js/jquery.prettyPhoto.js',
            type: 'script',
            openForMs: 8230,
          },
        },
      ],
    }),
  },
  {
    // Scheduled run 45116848024 (2026-11-23): products API answered with the 503 "heavy load" page.
    // Rules said TIMING 0.60 with PRODUCT_DEFECT 0.55 (contract rule) as the runner-up.
    name: 'Live regression: API answered 503 heavy-load page (flaky)',
    expect: 'ENVIRONMENT_OR_NETWORK',
    changed: ['docs/scorecard.md'],
    f: rec({
      outcome: 'flaky',
      errorMessage:
        'Error: API https://automationexercise.com/api/productsList returned non-JSON (HTTP 503): \nThis website is under heavy load (queue full)',
      attempts: [
        { retry: 0, status: 'failed', durationMs: 3000 },
        { retry: 1, status: 'passed', durationMs: 2000 },
      ],
    }),
  },
  {
    // Run 44941742953 (2026-11-22): injected AE-12 fault on a branch, but the diff missed the test
    // change (merge commit) and the rules said PRODUCT_DEFECT CRITICAL. With the correct diff the
    // classification must be TEST_SCRIPT_DEFECT; without any diff it must not be CRITICAL-confident.
    name: 'Live regression: FI-01 on a merged branch with the correct diff',
    expect: 'TEST_SCRIPT_DEFECT',
    changed: ['tests/ui/cart.spec.ts', 'tools/rca/ai.ts'],
    f: rec({
      errorMessage:
        'Error: [AE-12|P0] line total for 4 units = 4 x unit price\n\nExpected: 1500\nReceived: 2000',
    }),
  },
  {
    name: 'Passed on retry',
    expect: 'TIMING_OR_FLAKINESS',
    changed: [],
    f: rec({
      outcome: 'flaky',
      errorMessage: 'Error: Timed out 10000ms waiting for expect(locator).toHaveCount(1)',
      attempts: [
        { retry: 0, status: 'failed', durationMs: 10000 },
        { retry: 1, status: 'passed', durationMs: 4000 },
      ],
    }),
  },
  {
    name: 'Locator vanished, no code change',
    expect: 'LOCATOR_OR_UI_CHANGE',
    changed: [],
    f: rec({
      errorMessage:
        "Error: Timed out 10000ms waiting for expect(locator).toBeVisible()\nwaiting for getByTestId('pay-button')",
    }),
  },
  {
    name: 'API contract drift',
    expect: 'PRODUCT_DEFECT',
    changed: [],
    f: rec({
      project: 'api',
      errorMessage: 'Error: API https://x/api/productsList contract violation: products.0.price: Invalid',
    }),
  },
  {
    name: 'Fixture could not create account',
    expect: 'TEST_DATA_OR_STATE',
    changed: [],
    f: rec({
      errorMessage: 'Error: fixture: API account creation\nExpected: 201 Received: 400 Email already exists!',
    }),
  },
  {
    name: 'No recognisable signal',
    expect: 'UNKNOWN',
    changed: [],
    f: rec({ errorMessage: 'Error: something odd happened' }),
  },
];

let correct = 0;
for (const c of cases) {
  const r = classifyFailure(structuredClone(c.f), c.changed);
  const ok = r.classification === c.expect;
  if (ok) correct++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${c.name}: expected ${c.expect}, got ${r.classification} (${r.confidence})`,
  );
  if (c.name.startsWith('Live regression: API answered 503')) {
    assert.ok(
      !r.hypotheses.some((x) => x.category === 'PRODUCT_DEFECT'),
      'a 5xx error page is not an API contract change',
    );
  }
  if (c.f.faultInjection)
    assert.notEqual(r.classification, 'PRODUCT_DEFECT', 'injected fault must never be a product defect');
  assert.equal(r.requires_human_approval, true);
}

// Report wording for AI-step outcomes (run 44942993219 attempt 3 printed a timeout as a guardrail rejection).
void import('./report').then(({ renderMarkdown }) => {
  const first = cases[0];
  if (!first) throw new Error('no cases');
  const rec0 = classifyFailure(structuredClone(first.f), first.changed);
  const meta = {
    reportFound: true,
    reportPath: '',
    commitSha: 'x',
    branch: 'b',
    generatedAt: 'g',
    changedFiles: [],
    stats: { total: 1, passed: 0, failed: 1, flaky: 0, skipped: 0, durationMs: 1 },
    globalErrors: [],
  };
  const line = (reason?: string, agreed = false) =>
    renderMarkdown(
      { meta, failures: [] },
      [
        {
          ...rec0,
          ai: {
            model: 'm',
            agreed_with_deterministic: agreed,
            ...(reason ? { rejection_reason: reason } : {}),
          },
        },
      ],
      'x',
    )
      .split('\n')
      .find((l) => l.startsWith('- **Classification')) ?? '';
  assert.match(line('call failed: AbortError: This operation was aborted'), /AI call timed out/);
  assert.match(line('call failed: Error: HTTP 503: high demand'), /AI call failed/);
  assert.match(line('call failed: Error: non-JSON response (HTTP 200, text/plain): OK'), /AI call failed/);
  assert.match(line('cited non-existent evidence: E99'), /rejected by guardrail/);
  assert.match(line(undefined, true), /AI agreed with/);
  console.log('PASS  report wording: timeout / call failure / guardrail rejection / agreement distinguished');
});

// First-failure merge keeps the precise rule-based location (run 44944370864).
assert.match(
  mergeFirstFailure('AE-12', 'First failing assertion/action at tests/ui/cart.spec.ts:41:79'),
  /cart\.spec\.ts:41:79/,
);
assert.equal(
  mergeFirstFailure('cart.spec.ts:41 – wrong multiplier', 'at tests/ui/cart.spec.ts:41:79'),
  'cart.spec.ts:41 – wrong multiplier',
);
assert.equal(mergeFirstFailure('', 'baseline'), 'baseline');
console.log('PASS  first-failure merge keeps file:line when the AI answer is less specific');

// AI guardrails
const fi = rec({ errorMessage: 'x', faultInjection: 'FI-02' });
const base = { confidence: 0.9, first_failure: '', validation: '', recommended_action: '' };
assert.match(
  vetAiOutput(
    {
      ...base,
      classification: 'PRODUCT_DEFECT',
      hypotheses: [
        { category: 'PRODUCT_DEFECT', score: 0.9, evidence_for: ['E1'], evidence_against: [], rationale: '' },
      ],
    },
    fi,
  ) ?? '',
  /injected fault/,
);
assert.match(
  vetAiOutput(
    {
      ...base,
      classification: 'ENVIRONMENT_OR_NETWORK',
      hypotheses: [
        {
          category: 'ENVIRONMENT_OR_NETWORK',
          score: 0.9,
          evidence_for: ['E99'],
          evidence_against: [],
          rationale: '',
        },
      ],
    },
    fi,
  ) ?? '',
  /non-existent evidence/,
);
assert.equal(
  vetAiOutput(
    {
      ...base,
      classification: 'ENVIRONMENT_OR_NETWORK',
      hypotheses: [
        {
          category: 'ENVIRONMENT_OR_NETWORK',
          score: 0.9,
          evidence_for: ['E1', 'E4'],
          evidence_against: [],
          rationale: '',
        },
      ],
    },
    fi,
  ),
  null,
);
console.log(
  'PASS  AI guardrails: injected-fault product claim rejected; fabricated evidence IDs rejected; valid output accepted',
);

console.log(`\nClassifier accuracy on labelled synthetic cases: ${correct}/${cases.length}`);
if (correct !== cases.length) process.exit(1);
