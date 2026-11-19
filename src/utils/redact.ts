/**
 * Redaction applied to logs, attachments, RCA bundles and anything sent to an AI model.
 * Conservative by design: false positives (over-redaction) are acceptable, leaks are not.
 */
const RULES: ReadonlyArray<[RegExp, string]> = [
  // API keys / bearer tokens
  [/\b(sk-[A-Za-z0-9_-]{10,}|sk-ant-[A-Za-z0-9_-]{10,})\b/g, '[REDACTED_KEY]'],
  [/(authorization|x-api-key)(["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1$2[REDACTED]'],
  // Password-like fields in JSON, form bodies and query strings
  [
    /("?(password|passwd|pwd|cvc|cvv|card_number|card-number)"?\s*[:=]\s*)("[^"]*"|[^&\s,}]+)/gi,
    '$1"[REDACTED]"',
  ],
  // Card-number-shaped digit runs (13-19 digits, optional separators)
  [/\b(?:\d[ -]?){13,19}\b/g, '[REDACTED_PAN]'],
  // Email addresses (test data is synthetic, but still not needed by the model)
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]'],
  // Phone-like numbers (10 digits, optional country code/separators). Deliberately does NOT match
  // ISO timestamps like 2026-11-19T13:54:18Z – an earlier, broader pattern redacted log dates.
  [/(?<![\d-])(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}(?![\d-])/g, '[REDACTED_PHONE]'],
];

export function redactText(input: string): string {
  return RULES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
}

/** Truncate untrusted text before it is included in any prompt. */
export function clip(input: string, max = 2000): string {
  return input.length <= max ? input : `${input.slice(0, max)}\n…[truncated ${input.length - max} chars]`;
}
