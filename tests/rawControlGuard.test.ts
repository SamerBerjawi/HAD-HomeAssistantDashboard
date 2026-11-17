import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// Ratchet for hand-rolled controls (docs/ui-improvement-plan.md, Phase 0).
// Counts raw <button>, <input>, <select> elements and role="button" attributes across src/**/*.tsx.
// The shared primitives under src/components/base/ are excluded because they are the destination.
// Each count may only go down. When you replace raw controls with the shared primitives,
// lower the matching BASELINE value. Never raise one: use the primitive instead.
const BASELINE = {
  button: 595,
  input: 47,
  select: 2,
  roleButton: 38,
};

const PATTERNS: Record<keyof typeof BASELINE, RegExp> = {
  button: /<button\b/g,
  input: /<input\b/g,
  select: /<select\b/g,
  roleButton: /role="button"/g,
};

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const EXCLUDE = path.join(SRC, 'components', 'base') + path.sep;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(name) && !full.startsWith(EXCLUDE)) out.push(full);
  }
  return out;
}

function count(): { totals: Record<string, number>; perFile: Record<string, Record<string, number>> } {
  const totals: Record<string, number> = { button: 0, input: 0, select: 0, roleButton: 0 };
  const perFile: Record<string, Record<string, number>> = {};
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const [key, re] of Object.entries(PATTERNS)) {
      const n = (text.match(re) ?? []).length;
      if (n === 0) continue;
      totals[key] += n;
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      (perFile[rel] ??= {})[key] = n;
    }
  }
  return { totals, perFile };
}

describe('raw control guard', () => {
  const { totals, perFile } = count();

  for (const key of Object.keys(BASELINE) as Array<keyof typeof BASELINE>) {
    it(`does not add raw ${key} elements`, () => {
      const top = Object.entries(perFile)
        .filter(([, v]) => v[key])
        .sort((a, b) => b[1][key] - a[1][key])
        .slice(0, 8)
        .map(([file, v]) => `${file}: ${v[key]}`)
        .join('\n');
      expect(totals[key], `raw ${key} count ${totals[key]} exceeds BASELINE ${BASELINE[key]}. Use the shared primitive. Top files:\n${top}`).toBeLessThanOrEqual(BASELINE[key]);
    });

    it(`baseline for ${key} is not stale`, () => {
      expect(totals[key], `raw ${key} count is ${totals[key]}, below BASELINE ${BASELINE[key]}: lower it in tests/rawControlGuard.test.ts`).toBe(BASELINE[key]);
    });
  }
});
