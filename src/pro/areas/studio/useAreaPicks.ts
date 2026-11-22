import { useCallback, useState } from 'react';
import type { TileModel } from '../tileTypes';
import type { TileConceptId, TileTypeEntry } from './areaCatalog';

export interface AreaPick {
  concept: TileConceptId | 'mix' | 'none';
  notes: string;
}

const KEY = 'had.pro.areaStudio.picks';
const EMPTY: AreaPick = { concept: 'none', notes: '' };

export function readAreaPicks(): Record<string, AreaPick> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, AreaPick>) : {};
  } catch {
    return {};
  }
}

/** The owner's pick for one tile type, kept in this browser, plus "copy for the chat". */
export function useAreaPicks(entry: TileTypeEntry<TileModel>) {
  const [pick, setState] = useState<AreaPick>(() => ({ ...EMPTY, ...readAreaPicks()[entry.id] }));
  const [copied, setCopied] = useState(false);
  const setPick = useCallback(
    (next: AreaPick) => {
      setState(next);
      setCopied(false);
      try {
        window.localStorage.setItem(KEY, JSON.stringify({ ...readAreaPicks(), [entry.id]: next }));
      } catch {
        /* blocked storage: works for this visit */
      }
    },
    [entry.id]
  );
  const copy = useCallback(async () => {
    const name = entry.concepts.find((c) => c.id === pick.concept)?.name;
    const choice = pick.concept === 'mix' ? 'a mix' : `Concept ${pick.concept}${name ? ` (${name})` : ''}`;
    try {
      await navigator.clipboard.writeText(`Area tiles · ${entry.title}: ${choice}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [entry, pick]);
  return { pick, setPick, copy, copied };
}
