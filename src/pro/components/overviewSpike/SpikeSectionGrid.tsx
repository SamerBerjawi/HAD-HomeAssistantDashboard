import { useMemo, type CSSProperties, type ReactNode, type Ref } from 'react';
import GridLayout, { useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout';
import { gridBounds, minMaxSize, moveElement, verticalCompactor, type Compactor, type LayoutConstraint } from 'react-grid-layout/core';
import { GridBackground, wrapCompactor } from 'react-grid-layout/extras';
import 'react-grid-layout/css/styles.css';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cellsFor, packPlacements, sizeForCells, snapToAllowedSize, type LayoutPlacement, type WidgetSize } from '../../lib/overviewLayout';
import { SPIKE_WIDGET_BY_ID } from './spikeWidgets';

export const SPIKE_ROW_PX = 148;
export const SPIKE_GAP_PX = 12;

/** Free: cards stay where dropped, others fall up (vertical). Flow: reading order, like iOS (wrap). */
export type SpikeCompaction = 'free' | 'flow';
const COMPACTORS: Record<SpikeCompaction, Compactor> = { free: verticalCompactor, flow: wrapCompactor };

interface SpikeSectionGridProps {
  placements: LayoutPlacement[];
  cols: number;
  isEditing: boolean;
  compaction: SpikeCompaction;
  onChange: (next: LayoutPlacement[]) => void;
  renderCard: (placement: LayoutPlacement) => ReactNode;
}

const allowedFor = (id: string): readonly WidgetSize[] => SPIKE_WIDGET_BY_ID.get(id)?.sizes ?? ['s'];

/** While a corner is dragged, the card only takes sizes it allows (snaps live). */
const snapToAllowed: LayoutConstraint = {
  name: 'snapToAllowedSize',
  constrainSize(item, w, h, _handle, context) {
    return cellsFor(snapToAllowedSize(w, h, allowedFor(item.i), context.cols), context.cols);
  }
};
const CONSTRAINTS = [gridBounds, minMaxSize, snapToAllowed];

function toGrid(placements: LayoutPlacement[], cols: number): LayoutItem[] {
  return placements.map((p) => ({ i: p.i, x: p.x, y: p.y, ...cellsFor(p.size, cols), isResizable: allowedFor(p.i).length > 1 }));
}

function fromGrid(layout: Layout, cols: number): LayoutPlacement[] {
  return layout.map((item) => {
    const allowed = allowedFor(item.i);
    return { i: item.i, x: item.x, y: item.y, size: sizeForCells(item.w, item.h, allowed, cols) ?? snapToAllowedSize(item.w, item.h, allowed, cols) };
  });
}

const same = (a: LayoutPlacement[], b: LayoutPlacement[]) =>
  a.length === b.length && a.every((p) => b.some((q) => q.i === p.i && q.x === p.x && q.y === p.y && q.size === p.size));

/** Moves one card by a cell (keyboard), letting the others make room, then closes gaps. */
export function moveByCell(placements: LayoutPlacement[], id: string, dx: number, dy: number, cols: number, compaction: SpikeCompaction): LayoutPlacement[] {
  if (compaction === 'flow') {
    // Flow is an order, not positions: Left/Up one step earlier, Right/Down one step later.
    const order = [...placements].sort((a, b) => a.y - b.y || a.x - b.x);
    const from = order.findIndex((p) => p.i === id);
    const to = Math.max(0, Math.min(order.length - 1, from + (dx + dy > 0 ? 1 : -1)));
    if (from < 0 || from === to) return placements;
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    return fromGrid(wrapCompactor.compact(toGrid(packPlacements(order, cols), cols), cols), cols);
  }
  const layout = toGrid(placements, cols);
  const item = layout.find((l) => l.i === id);
  if (!item) return placements;
  const x = Math.max(0, Math.min(cols - item.w, item.x + dx));
  const y = Math.max(0, item.y + dy);
  const compactor = COMPACTORS[compaction];
  const moved = moveElement(layout, item, x, y, true, false, compactor.type, cols);
  return fromGrid(compactor.compact(moved, cols), cols);
}

/**
 * One section's grid. Edit mode: react-grid-layout (drag by handle, snapping corner on fine
 * pointers). View mode: a plain CSS grid with the same cells, so nothing measures or moves.
 */
export function SpikeSectionGrid(props: SpikeSectionGridProps) {
  const { placements, cols, isEditing, renderCard } = props;
  if (!isEditing) {
    const rows = placements.reduce((max, p) => Math.max(max, p.y + cellsFor(p.size, cols).h), 0);
    const style: CSSProperties = {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, ${SPIKE_ROW_PX}px)`,
      gap: SPIKE_GAP_PX
    };
    return (
      <div className="grid" style={style}>
        {placements.map((p) => {
          const c = cellsFor(p.size, cols);
          return (
            <div key={p.i} className="min-w-0" style={{ gridColumn: `${p.x + 1} / span ${c.w}`, gridRow: `${p.y + 1} / span ${c.h}` }}>
              {renderCard(p)}
            </div>
          );
        })}
      </div>
    );
  }

  return <SpikeEditGrid {...props} />;
}

/** Its own component so the container is measured when edit mode opens. */
function SpikeEditGrid({ placements, cols, compaction, onChange, renderCard }: SpikeSectionGridProps) {
  const finePointer = useMediaQuery('(pointer: fine)');
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const layout = useMemo(() => toGrid(placements, cols), [placements, cols]);
  const rows = placements.reduce((max, p) => Math.max(max, p.y + cellsFor(p.size, cols).h), 0) + 1;
  return (
    // One spare row of cells shows where a card can be dropped below the others.
    <div ref={containerRef} className="pro-rgl relative min-w-0" style={{ minHeight: rows * SPIKE_ROW_PX + (rows - 1) * SPIKE_GAP_PX }}>
      {mounted ? (
        <GridBackground
          width={width}
          cols={cols}
          rowHeight={SPIKE_ROW_PX}
          margin={[SPIKE_GAP_PX, SPIKE_GAP_PX]}
          containerPadding={[0, 0]}
          rows={rows}
          color="color-mix(in oklab, var(--accent) 7%, transparent)"
          borderRadius={20}
          className="pointer-events-none absolute inset-0"
        />
      ) : null}
      {mounted ? (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols, rowHeight: SPIKE_ROW_PX, margin: [SPIKE_GAP_PX, SPIKE_GAP_PX], containerPadding: [0, 0] }}
          dragConfig={{ enabled: true, handle: '.pro-drag-handle', threshold: 4 }}
          resizeConfig={{
            enabled: finePointer,
            handles: ['se'],
            handleComponent: (_axis, ref) => <span ref={ref as Ref<HTMLSpanElement>} className="pro-rgl-handle" aria-hidden="true" />
          }}
          constraints={CONSTRAINTS}
          compactor={COMPACTORS[compaction]}
          onLayoutChange={(next) => {
            const placementsNext = fromGrid(next, cols);
            // A resize can end between allowed sizes; hand the snapped layout back so the grid redraws it.
            const offSize = next.some((item) => {
              const p = placementsNext.find((q) => q.i === item.i);
              const c = p ? cellsFor(p.size, cols) : null;
              return c !== null && (c.w !== item.w || c.h !== item.h);
            });
            if (offSize || !same(placementsNext, placements)) onChange(placementsNext);
          }}
        >
          {placements.map((p) => (
            <div key={p.i}>{renderCard(p)}</div>
          ))}
        </GridLayout>
      ) : null}
    </div>
  );
}
