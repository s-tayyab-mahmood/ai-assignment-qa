import 'dotenv/config';

/**
 * Non-secret runtime settings. Secrets (AI_API_KEY) are read only by tools/rca/analyze.ts
 * and only ever come from the environment / CI secrets.
 */
function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const baseUrl = (process.env.BASE_URL ?? 'https://automationexercise.com').replace(/\/$/, '');

export const env = {
  baseUrl,
  apiUrl: `${baseUrl}/api`,
  isCI: bool(process.env.CI, false),
  /** Public practice site: keep concurrency low (brief §4, "avoid abusive public-site load"). */
  workers: Math.min(int(process.env.WORKERS, 2), 3),
  blockAds: bool(process.env.BLOCK_ADS, true),
  faultInjection: bool(process.env.FAULT_INJECTION, false),
} as const;

/**
 * Third-party hosts blocked inside each browser context. The site serves Google ads and
 * "vignette" interstitials that overlay the page and redirect to #google_vignette; they are not
 * part of the product under test and are the #1 source of non-product flakiness on this site.
 * Blocking is a documented test-environment decision (docs/test-strategy.md §6), not a bypass of
 * any anti-bot control.
 */
export const blockedThirdPartyHosts: readonly RegExp[] = [
  /googlesyndication\.com/,
  /doubleclick\.net/,
  /googleadservices\.com/,
  /adservice\.google\./,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /fundingchoicesmessages\.google\.com/,
  /pagead2\./,
  /adtrafficquality\.google/,
];
