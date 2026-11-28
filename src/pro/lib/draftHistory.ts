/**
 * Pure bounded Undo/Redo snapshot history (last 20 steps) for in-memory Edit Mode drafts.
 * Keeps `RoomPage`, `Overview`, and `Rooms` edits 1-tap reversible on mobile without
 * polluting undo history on no-op updates.
 */
export const MAX_DRAFT_HISTORY = 20;

export interface DraftHistory<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createDraftHistory<T>(initial: T): DraftHistory<T> {
  return { past: [], present: structuredClone(initial), future: [] };
}

export function pushDraftHistory<T>(history: DraftHistory<T>, next: T, max = MAX_DRAFT_HISTORY): DraftHistory<T> {
  if (JSON.stringify(next) === JSON.stringify(history.present)) {
    return history;
  }
  const past = [...history.past, structuredClone(history.present)];
  if (past.length > max) {
    past.splice(0, past.length - max);
  }
  return {
    past,
    present: structuredClone(next),
    future: []
  };
}

export function undoDraftHistory<T>(history: DraftHistory<T>): DraftHistory<T> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: structuredClone(previous),
    future: [structuredClone(history.present), ...history.future]
  };
}

export function redoDraftHistory<T>(history: DraftHistory<T>): DraftHistory<T> {
  if (history.future.length === 0) return history;
  const [next, ...rest] = history.future;
  return {
    past: [...history.past, structuredClone(history.present)],
    present: structuredClone(next),
    future: rest
  };
}

export function canUndo<T>(history: DraftHistory<T> | null | undefined): boolean {
  return Boolean(history && history.past.length > 0);
}

export function canRedo<T>(history: DraftHistory<T> | null | undefined): boolean {
  return Boolean(history && history.future.length > 0);
}
