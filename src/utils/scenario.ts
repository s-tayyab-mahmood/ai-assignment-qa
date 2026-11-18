import type { TestDetails } from '@playwright/test';

export type Priority = 'P0' | 'P1' | 'P2';

/**
 * Builds Playwright test details for a traceable scenario: tags for grep/CI selection and
 * annotations that land in the JSON report (consumed by tools/rca and the traceability matrix).
 *
 *   test('...', scenario('AE-12', 'P0', { smoke: true }), async ({ page }) => { ... })
 */
export function scenario(
  id: string,
  priority: Priority,
  opts: { smoke?: boolean; layer?: 'ui' | 'api' | 'integration'; ref?: string } = {},
): TestDetails {
  const tags = [`@${id}`, `@${priority}`];
  if (opts.smoke) tags.push('@smoke');
  if (opts.layer) tags.push(`@${opts.layer}`);
  const annotation = [
    { type: 'scenario', description: id },
    { type: 'priority', description: priority },
  ];
  if (opts.ref) annotation.push({ type: 'reference', description: opts.ref });
  return { tag: tags, annotation };
}

/**
 * Assertion message tagger. Every assertion carries scenario ID and risk so a failure message is
 * self-describing in reports and RCA:  expect(x, at('AE-12','P0')('cart quantity')).toHaveText('4')
 */
export function at(id: string, priority: Priority): (what: string) => string {
  return (what: string) => `[${id}|${priority}] ${what}`;
}
