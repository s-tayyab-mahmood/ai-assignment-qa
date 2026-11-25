/**
 * Offline self-test of the health-check decision logic (no network).
 *   npm run health:selftest
 */
import assert from 'node:assert/strict';
import { type ProbeResult, attemptHealthy, judgeProbe, overallHealthy, summaryMarkdown } from './evaluate';

const SLOW = 10_000;
let passed = 0;
function check(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

check('2xx, fast, real body is healthy', () =>
  assert.equal(judgeProbe({ status: 200, durationMs: 800 }, SLOW), undefined),
);
check('HTTP 503 is unhealthy', () =>
  assert.equal(judgeProbe({ status: 503, durationMs: 300 }, SLOW), 'HTTP 503'),
);
check('overload page with 200 is unhealthy', () =>
  assert.match(judgeProbe({ status: 200, durationMs: 300, overloadPage: true }, SLOW) ?? '', /overload/),
);
check('slow response is unhealthy', () =>
  assert.match(judgeProbe({ status: 200, durationMs: 12_000 }, SLOW) ?? '', /slow/),
);
check('timeout / network error is unhealthy', () =>
  assert.match(
    judgeProbe({ status: null, durationMs: 0, error: 'Timeout 30000ms exceeded' }, SLOW) ?? '',
    /request failed/,
  ),
);
check('wrong API payload is unhealthy', () =>
  assert.equal(
    judgeProbe({ status: 200, durationMs: 300, badPayload: true }, SLOW),
    'unexpected response body',
  ),
);

const ok: ProbeResult = { name: 'home page', url: 'u', status: 200, durationMs: 500 };
const bad: ProbeResult = {
  name: 'products API',
  url: 'u',
  status: 503,
  durationMs: 500,
  problem: 'HTTP 503',
};
check('attempt needs every probe healthy', () => {
  assert.equal(attemptHealthy([ok, ok]), true);
  assert.equal(attemptHealthy([ok, bad]), false);
  assert.equal(attemptHealthy([]), false);
});
check('overall healthy once any attempt recovers', () => {
  assert.equal(
    overallHealthy([
      { attempt: 1, at: 't', probes: [bad], healthy: false },
      { attempt: 2, at: 't', probes: [ok], healthy: true },
    ]),
    true,
  );
  assert.equal(overallHealthy([{ attempt: 1, at: 't', probes: [bad], healthy: false }]), false);
});
check('summary says tests not run when unavailable', () => {
  const md = summaryMarkdown([{ attempt: 1, at: 't', probes: [bad], healthy: false }], {
    attempts: 1,
    waitMs: 600_000,
    slowMs: SLOW,
  });
  assert.match(md, /Site unavailable/);
  assert.match(md, /not run/);
});

console.log(`Health-check self-test: ${passed}/${passed} passed`);
