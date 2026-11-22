import type { Compactor, Layout } from 'react-grid-layout/core';
import { settleCells } from '../../lib/overviewLayout';

/**
 * Free-placement compaction for react-grid-layout (owner, 2026-11-20; replaces strict Flow). The
 * card being dragged or resized goes where the pointer puts it, even on a new row with room left
 * on the row above; the other cards start from where they were before the drag (so a card that
 * stepped aside comes back when the dragged one moves on) and only move down to make room.
 * `getActive` names the card in hand and `getBase` gives the positions before the drag.
 */
export function makeSettleCompactor(getActive: () => string | null, getBase: () => ReadonlyMap<string, { x: number; y: number }>): Compactor {
  return {
    type: null,
    allowOverlap: false,
    compact(layout: Layout, cols: number): Layout {
      const active = getActive();
      const base = getBase();
      const start = layout.map((item) => {
        const was = active && item.i !== active ? base.get(item.i) : undefined;
        return was ? { ...item, x: was.x, y: was.y } : { ...item };
      });
      return settleCells(start, cols, active ?? undefined);
    }
  };
}
