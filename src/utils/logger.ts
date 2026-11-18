import type { TestInfo } from '@playwright/test';
import { redactText } from './redact';

/**
 * Minimal structured logger. Lines go to stdout (visible in CI logs) and, when a TestInfo is
 * supplied, are attached to the test so they appear in the HTML report and the RCA bundle.
 * All messages pass through redaction first.
 */
export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  data?: Record<string, unknown>;
}

export function log(level: LogEntry['level'], event: string, data?: Record<string, unknown>): LogEntry {
  const entry: LogEntry = { ts: new Date().toISOString(), level, event, ...(data ? { data } : {}) };
  const line = redactText(JSON.stringify(entry));
  if (level === 'error') console.error(line);
  else console.log(line);
  return entry;
}

export async function attachLog(testInfo: TestInfo, name: string, entries: LogEntry[]): Promise<void> {
  await testInfo.attach(name, {
    body: redactText(JSON.stringify(entries, null, 2)),
    contentType: 'application/json',
  });
}
