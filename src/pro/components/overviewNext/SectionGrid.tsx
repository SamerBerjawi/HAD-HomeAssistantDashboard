import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';
import GridLayout, { useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout';
import { gridBounds, minMaxSize, type LayoutConstraint } from 'react-grid-layout/core';
import { GridBackground } from 'react-grid-layout/extras';
import 'react-grid-layout/css/styles.css';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cellsFor, readingOrder, resizeInFlow, sizeForCells, snapToAllowedSize, type LayoutPlacement, type WidgetSize } from '../../lib/overviewLayout';
import { makeSettleCompactor } from './flowCompactor';

export const ROW_PX = 148;
export const GAP_PX = 12;

interface SectionGridProps {
  placements: LayoutPlacement[];
  cols: number;
  isEditing: boolean;
  allowedSizes: (id: string) => readonly WidgetSize[];
  onChange: (next: LayoutPlacement[]) => void;
  renderCard: (placement: LayoutPlacement) => ReactNode;
}

const rowsOf = (placements: LayoutPlacement[], cols: number) => placements.reduce((max, p) => Math.max(max, p.y + cellsFor(p.size, cols).h), 0);

/**
 * One section's grid (Overview rebuild, Phase 2). View mode: a plain CSS grid with fixed cells, so
 * nothing measures or moves. Edit mode: react-grid-layout with free placement (a card stays in the
 * cell it is dropped in, a row may be left part empty), a drag handle, and a corner (fine pointers
 * only) that snaps to the sizes a widget allows.
 */
export function SectionGrid(props: SectionGridProps) {
  const { placements, cols, isEditing, renderCard } = props;
  if (isEditing) return <EditGrid {...props} />;
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowsOf(placements, cols)}, ${ROW_PX}px)`,
    gap: GAP_PX
  };
  return (
    <div className="grid" style={style}>
      {readingOrder(placements).map((p) => {
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

/** Its own component: the container is measured when edit mode opens (useContainerWidth measures on mount). */
function EditGrid({ placements, cols, allowedSizes, onChange, renderCard }: SectionGridProps) {
  const { setDragActive } = useUserConfig();
  const finePointer = useMediaQuery('(pointer: fine)');
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  // The card in hand and where every card was before the drag, read by the compactor.
  const active = useRef<string | null>(null);
  const base = useRef(new Map<string, { x: number; y: number }>());
  base.current = new Map(placements.map((p) => [p.i, { x: p.x, y: p.y }]));
  const compactor = useMemo(
    () =>
      makeSettleCompactor(
        () => active.current,
        () => base.current
      ),
    []
  );
  useEffect(() => () => setDragActive?.(false), [setDragActive]);
  const grab = (_l: Layout, _old: LayoutItem | null, item: LayoutItem | null) => {
    active.current = item?.i ?? null;
    setDragActive?.(true);
  };
  const release = () => {
    active.current = null;
    setDragActive?.(false);
  };

  const constraints = useMemo<LayoutConstraint[]>(
    () => [
      gridBounds,
      minMaxSize,
      {
        name: 'snapToAllowedSize',
        constrainSize: (item, w, h, _handle, context) => cellsFor(snapToAllowedSize(w, h, allowedSizes(item.i), context.cols), context.cols)
      }
    ],
    [allowedSizes]
  );
  const layout = useMemo<LayoutItem[]>(
    () => placements.map((p) => ({ i: p.i, x: p.x, y: p.y, ...cellsFor(p.size, cols), isResizable: allowedSizes(p.i).length > 1 })),
    [placements, cols, allowedSizes]
  );

  const handleLayoutChange = (next: Layout) => {
    let changed = next.length !== placements.length;
    let offSize = false;
    const out: LayoutPlacement[] = next.map((item) => {
      const allowed = allowedSizes(item.i);
      const size = sizeForCells(item.w, item.h, allowed, cols) ?? snapToAllowedSize(item.w, item.h, allowed, cols);
      const c = cellsFor(size, cols);
      if (c.w !== item.w || c.h !== item.h) offSize = true;
      const prev = placements.find((p) => p.i === item.i);
      if (!prev || prev.x !== item.x || prev.y !== item.y || prev.size !== size) changed = true;
      return { i: item.i, x: item.x, y: item.y, size };
    });
    // A resize can end between allowed sizes; re-flow with the snapped size so the grid redraws it.
    if (offSize) {
      const fixed = out.reduce((acc, p) => resizeInFlow(acc, p.i, p.size, cols), out);
      onChange(fixed);
    } else if (changed) {
      onChange(out);
    }
  };

  const rows = rowsOf(placements, cols) + 1;
  return (
    // One spare row of cells shows where a card can be dropped below the others.
    <div ref={containerRef} className="pro-rgl relative min-w-0" style={{ minHeight: rows * ROW_PX + (rows - 1) * GAP_PX }}>
      {mounted ? (
        <>
          <GridBackground
            width={width}
            cols={cols}
            rowHeight={ROW_PX}
            margin={[GAP_PX, GAP_PX]}
            containerPadding={[0, 0]}
            rows={rows}
            color="color-mix(in oklab, var(--accent) 7%, transparent)"
            borderRadius={20}
            className="pointer-events-none absolute inset-0"
          />
          <GridLayout
            width={width}
            layout={layout}
            gridConfig={{ cols, rowHeight: ROW_PX, margin: [GAP_PX, GAP_PX], containerPadding: [0, 0] }}
            dragConfig={{ enabled: true, handle: '.pro-drag-handle', threshold: 4 }}
            resizeConfig={{
              enabled: finePointer,
              handles: ['se'],
              handleComponent: (_axis, ref) => <span ref={ref as Ref<HTMLSpanElement>} className="pro-rgl-handle" aria-hidden="true" />
            }}
            constraints={constraints}
            compactor={compactor}
            onDragStart={grab}
            onDragStop={release}
            onResizeStart={grab}
            onResizeStop={release}
            onLayoutChange={handleLayoutChange}
          >
            {placements.map((p) => (
              <div key={p.i}>{renderCard(p)}</div>
            ))}
          </GridLayout>
        </>
      ) : null}
    </div>
  );
}
