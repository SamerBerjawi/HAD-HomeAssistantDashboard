import type { Compactor, Layout } from 'react-grid-layout/core';
import { flowCells } from '../../lib/overviewLayout';

/**
 * Flow compaction for react-grid-layout (owner decision: Flow). While a card is dragged, its
 * placeholder takes a place in the reading order and every card re-flows around it. Unlike the
 * built-in wrapCompactor it never overlaps mixed sizes.
 */
export const flowCompactor: Compactor = {
  type: 'wrap',
  allowOverlap: false,
  compact(layout: Layout, cols: number): Layout {
    // Reading order; on a tie the card being dragged (react-grid-layout marks it `moved`) goes
    // first, so dropping a card on another card's spot takes that place.
    const order = [...layout].sort((a, b) => a.y - b.y || a.x - b.x || Number(Boolean(b.moved)) - Number(Boolean(a.moved)));
    const cells = flowCells(order, cols);
    return order.map((item, k) => ({ ...item, x: cells[k].x, y: cells[k].y }));
  }
};
