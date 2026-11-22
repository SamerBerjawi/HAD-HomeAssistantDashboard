/**
 * Pure list helpers for the widget details sheets (WIDGET_DESIGN.md §8), kept out of the React
 * kit so they can be unit tested. Re-exported by `widgets/shared/sheet/SheetKit.tsx`.
 */

/** Lists with at least this many rows get a search field. */
export const SEARCH_FROM = 9;

/** Groups items by a key, keeping first-seen order; `last` keys (e.g. "Other") go to the end. */
export function groupBy<T>(items: readonly T[], key: (t: T) => string, last: readonly string[] = []): { key: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it) || 'Other';
    const list = map.get(k);
    if (list) list.push(it);
    else map.set(k, [it]);
  }
  const groups = [...map.entries()].map(([k, list]) => ({ key: k, items: list }));
  return [...groups.filter((g) => !last.includes(g.key)), ...groups.filter((g) => last.includes(g.key))];
}

/** Case-insensitive match on any of the given texts; an empty query matches everything. */
export const matches = (query: string, ...texts: (string | null | undefined)[]) => {
  const q = query.trim().toLowerCase();
  return !q || texts.some((t) => t?.toLowerCase().includes(q));
};
