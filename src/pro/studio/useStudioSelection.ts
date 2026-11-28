import { useCallback, useState } from 'react';
import type { ConceptId } from '../widgets/designRegistry';
import type { StudioEntry } from './types';

export interface StudioPick {
  concept: ConceptId | 'mix' | 'none';
  notes: string;
}

const KEY = 'had.pro.widgetStudio.picks';
const EMPTY: StudioPick = { concept: 'none', notes: '' };

function readAll(): Record<string, StudioPick> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, StudioPick>) : {};
  } catch {
    return {};
  }
}

/** The owner's pick for one widget, kept in this browser, plus "copy for the chat". */
export function useStudioSelection<M>(entry: StudioEntry<M>) {
  const [pick, setPickState] = useState<StudioPick>(() => ({ ...EMPTY, ...readAll()[entry.widgetId] }));
  const [copied, setCopied] = useState(false);

  const setPick = useCallback(
    (next: StudioPick) => {
      setPickState(next);
      setCopied(false);
      try {
        window.localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [entry.widgetId]: next }));
      } catch {
        // Private mode or blocked storage: the pick still works for this visit.
      }
    },
    [entry.widgetId]
  );

  const copy = useCallback(async () => {
    const name = entry.concepts.find((c) => c.id === pick.concept)?.name;
    const choice = pick.concept === 'mix' ? 'a mix' : `Concept ${pick.concept}${name ? ` (${name})` : ''}`;
    const text = `Widget studio · ${entry.title}: ${choice}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [entry, pick]);

  return { pick, setPick, copy, copied };
}
