/**
 * Locator healing from the page's accessibility snapshot (Playwright error-context.md).
 * The broken locator comes from the error message; candidates come only from what was actually on
 * the page when the test failed; the fix is a single string-literal change in a page object or spec.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export interface BrokenLocator {
  method: 'role' | 'text' | 'placeholder' | 'label' | 'testid';
  role?: string;
  value: string;
  expression: string;
}

export interface SnapshotNode {
  role: string;
  name: string;
}

export interface Candidate extends SnapshotNode {
  score: number;
}

const unq = (s: string) => s.replace(/\\(['"\\])/g, '$1');

/** Find the leaf getBy* call of the locator the test was waiting for. */
export function parseBrokenLocator(errorMessage: string): BrokenLocator | null {
  const lines = errorMessage.split('\n');
  const exprLine =
    lines.find((l) => /^\s*Locator:\s/.test(l)) ??
    [...lines].reverse().find((l) => /waiting for (locator\(|getBy)/.test(l));
  if (!exprLine) return null;
  const expression = exprLine.replace(/^\s*(Locator:|-\s*waiting for)\s*/, '').trim();
  const calls = [
    ...expression.matchAll(/getBy(Role|Text|Placeholder|Label|TestId)\(((?:[^()]|\([^()]*\))*)\)/g),
  ];
  const last = calls.at(-1);
  if (!last) return null;
  const kind = last[1] as string;
  const args = last[2] ?? '';
  const firstStr = /^\s*(['"])((?:\\.|(?!\1).)*)\1/.exec(args);
  if (!firstStr) return null; // regex arguments are not healed
  if (kind === 'Role') {
    const name = /name:\s*(['"])((?:\\.|(?!\1).)*)\1/.exec(args);
    if (!name) return null;
    return { method: 'role', role: unq(firstStr[2] ?? ''), value: unq(name[2] ?? ''), expression };
  }
  const method = kind === 'TestId' ? 'testid' : (kind.toLowerCase() as BrokenLocator['method']);
  return { method, value: unq(firstStr[2] ?? ''), expression };
}

/** Visible text without icon-font glyphs (private-use characters) and extra whitespace. */
export function cleanName(s: string): string {
  return s
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse "- role "name"" and "- role: text" lines of the YAML accessibility snapshot. */
export function parseSnapshot(markdown: string): SnapshotNode[] {
  const block = /```yaml\n([\s\S]*?)```/.exec(markdown)?.[1] ?? '';
  const nodes: SnapshotNode[] = [];
  for (const line of block.split('\n')) {
    const named = /^\s*-\s+([a-z]+)\s+"((?:[^"\\]|\\.)*)"/.exec(line);
    if (named) {
      nodes.push({ role: named[1] ?? '', name: cleanName(unq(named[2] ?? '')) });
      continue;
    }
    const text = /^\s*-\s+([a-z]+):\s+(.+)$/.exec(line);
    if (text && !(text[2] ?? '').startsWith('/'))
      nodes.push({ role: text[1] ?? '', name: cleanName(text[2] ?? '') });
  }
  return nodes.filter((n) => n.name.length > 0 && n.name.length <= 120);
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0] ?? 0;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j] ?? 0;
      dp[j] = Math.min((dp[j] ?? 0) + 1, (dp[j - 1] ?? 0) + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length] ?? 0;
}

/** 0..1: half token overlap (Jaccard), half character edit similarity. */
export function similarity(a: string, b: string): number {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  if (!x || !y) return 0;
  const tx = new Set(x.split(/\W+/).filter(Boolean));
  const ty = new Set(y.split(/\W+/).filter(Boolean));
  const inter = [...tx].filter((t) => ty.has(t)).length;
  const union = new Set([...tx, ...ty]).size || 1;
  const lev = 1 - levenshtein(x, y) / Math.max(x.length, y.length);
  return Math.round((0.5 * (inter / union) + 0.5 * lev) * 100) / 100;
}

const ROLES_FOR: Record<Exclude<BrokenLocator['method'], 'role' | 'testid'>, string[] | null> = {
  text: null, // any visible text
  placeholder: ['textbox', 'searchbox', 'combobox'],
  label: ['textbox', 'searchbox', 'combobox', 'checkbox', 'radio'],
};

export function candidatesFor(broken: BrokenLocator, nodes: SnapshotNode[]): SnapshotNode[] {
  if (broken.method === 'testid') return [];
  const roles = broken.method === 'role' ? [broken.role ?? ''] : ROLES_FOR[broken.method];
  const seen = new Set<string>();
  return nodes.filter((n) => {
    if (roles && !roles.includes(n.role)) return false;
    const key = `${n.role}|${n.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const MIN_SCORE = 0.55;
export const MIN_MARGIN = 0.1;

export type RuleChoice =
  { ok: true; choice: Candidate; runnerUp?: Candidate } | { ok: false; reason: string; ranked: Candidate[] };

/**
 * Choose a replacement only when it is clearly the best match. If the old value is still on the page,
 * the element exists and the failure is not a locator change (timing / visibility) – do not heal.
 */
export function chooseByRules(broken: BrokenLocator, nodes: SnapshotNode[]): RuleChoice {
  const cands = candidatesFor(broken, nodes);
  const old = broken.value.toLowerCase();
  if (cands.some((c) => c.name.toLowerCase().includes(old)))
    return {
      ok: false,
      reason: `"${broken.value}" is still on the page, so the locator is not stale (visibility or timing instead)`,
      ranked: [],
    };
  const ranked = cands
    .map((c) => ({ ...c, score: similarity(broken.value, c.name) }))
    .sort((a, b) => b.score - a.score);
  const [best, second] = ranked;
  if (!best || best.score < MIN_SCORE)
    return {
      ok: false,
      reason: `no similar ${broken.role ?? broken.method} on the page (best ${best?.score ?? 0})`,
      ranked,
    };
  if (second && best.score - second.score < MIN_MARGIN)
    return {
      ok: false,
      reason: `ambiguous: "${best.name}" (${best.score}) vs "${second.name}" (${second.score})`,
      ranked,
    };
  return { ok: true, choice: best, runnerUp: second };
}

const ALLOWED_DIRS = ['src/pages', 'tests'];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p.split(path.sep).join('/'));
  }
  return out;
}

export interface LiteralHit {
  file: string;
  line: number;
  text: string;
  quote: string;
}

/** Every place the broken value appears as a whole string literal in page objects or specs. */
export function findLiteral(value: string, root = '.'): LiteralHit[] {
  const hits: LiteralHit[] = [];
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(['"])${escaped}\\1`);
  for (const dir of ALLOWED_DIRS) {
    let files: string[] = [];
    try {
      files = walk(path.join(root, dir));
    } catch {
      continue;
    }
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((text, i) => {
          const m = re.exec(text);
          if (m)
            hits.push({
              file: path.relative(root, file).split(path.sep).join('/'),
              line: i + 1,
              text,
              quote: m[1] ?? "'",
            });
        });
    }
  }
  return hits;
}

export function replaceLiteral(lineText: string, oldValue: string, newValue: string, quote: string): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), `\\${quote}`);
  return lineText.replace(`${quote}${esc(oldValue)}${quote}`, `${quote}${esc(newValue)}${quote}`);
}
