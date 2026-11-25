import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  createDraftHistory,
  MAX_DRAFT_HISTORY,
  pushDraftHistory,
  redoDraftHistory,
  undoDraftHistory
} from '@/pro/lib/draftHistory';

describe('draftHistory', () => {
  it('pushes snapshots, skips identical no-ops, and supports undo/redo', () => {
    let h = createDraftHistory({ count: 0, list: ['a'] });
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);

    // Identical state does not pollute undo history
    const same = pushDraftHistory(h, { count: 0, list: ['a'] });
    expect(same).toBe(h);
    expect(canUndo(same)).toBe(false);

    h = pushDraftHistory(h, { count: 1, list: ['a', 'b'] });
    h = pushDraftHistory(h, { count: 2, list: ['a', 'b', 'c'] });
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);

    h = undoDraftHistory(h);
    expect(h.present).toEqual({ count: 1, list: ['a', 'b'] });
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(true);

    h = undoDraftHistory(h);
    expect(h.present).toEqual({ count: 0, list: ['a'] });
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(true);

    h = redoDraftHistory(h);
    expect(h.present).toEqual({ count: 1, list: ['a', 'b'] });

    // A new push clears the redo stack
    h = pushDraftHistory(h, { count: 99, list: ['z'] });
    expect(canRedo(h)).toBe(false);
    expect(h.present).toEqual({ count: 99, list: ['z'] });
  });

  it(`caps undo history at ${MAX_DRAFT_HISTORY} entries`, () => {
    let h = createDraftHistory({ step: 0 });
    for (let i = 1; i <= 25; i++) {
      h = pushDraftHistory(h, { step: i });
    }
    expect(h.past.length).toBe(MAX_DRAFT_HISTORY);
    for (let i = 0; i < MAX_DRAFT_HISTORY; i++) {
      h = undoDraftHistory(h);
    }
    expect(h.present.step).toBe(5);
    expect(canUndo(h)).toBe(false);
  });
});
