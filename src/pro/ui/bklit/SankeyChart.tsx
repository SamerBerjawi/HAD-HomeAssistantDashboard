/**
 * SankeyChart: bklit UI "Sankey Chart" (https://ui.bklit.com/docs/components/sankey-chart, MIT)
 * adapted for HAD pro Energy Flow (`Sources -> Home -> Floors -> Areas -> Devices + Untracked`)
 * onto HeroUI design tokens, motion transitions, and interactive hover/tap tooltips.
 */
import { useId, useMemo, useState } from 'react';
import { useMeasuredWidth } from './useBklitChartBox';
import { cn } from '@/lib/utils';

export interface ProSankeyNodeInput {
  id: string;
  label: string;
  value: number;
  column: number;
  color: string;
  sublabel?: string;
}

export interface ProSankeyLinkInput {
  id: string;
  source: string;
  target: string;
  value: number;
  sourceColor: string;
  targetColor: string;
}

interface SankeyChartProps {
  nodes: ProSankeyNodeInput[];
  links: ProSankeyLinkInput[];
  height?: number;
  compact?: boolean;
  unit?: string;
  className?: string;
  ariaLabel?: string;
}

interface PositionedNode extends ProSankeyNodeInput {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PositionedLink extends ProSankeyLinkInput {
  pathD: string;
  sourceLabel: string;
  targetLabel: string;
}

export function SankeyChart({
  nodes,
  links,
  height = 220,
  compact = false,
  unit = 'kWh',
  className,
  ariaLabel = 'Energy flow Sankey diagram'
}: SankeyChartProps) {
  const { ref: containerRef, width: containerWidth } = useMeasuredWidth<HTMLDivElement>();
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const uid = useId();


  const width = containerWidth > 0 ? containerWidth : 440;
  const isNarrow = compact || width < 420;

  const { positionedNodes, positionedLinks, maxCol, colGapPx, rightPadPx } = useMemo(() => {
    if (nodes.length === 0) {
      return {
        positionedNodes: [] as PositionedNode[],
        positionedLinks: [] as PositionedLink[],
        maxCol: 0,
        colGapPx: 100,
        rightPadPx: 120
      };
    }

    const columnsMap = new Map<number, ProSankeyNodeInput[]>();
    for (const node of nodes) {
      const list = columnsMap.get(node.column) || [];
      list.push(node);
      columnsMap.set(node.column, list);
    }

    const sortedCols = [...columnsMap.keys()].sort((a, b) => a - b);
    const highestCol = sortedCols[sortedCols.length - 1] ?? 0;

    const nodeW = isNarrow ? 8 : 10;
    const padL = isNarrow ? 6 : 8;
    const padR = isNarrow ? 104 : 138;
    const padY = 14;
    const plotW = Math.max(80, width - padL - padR - nodeW);
    const plotH = Math.max(60, height - padY * 2);

    const colSpan = Math.max(1, sortedCols.length - 1);
    const computedColGap = plotW / colSpan;
    const colIndexByCol = new Map(sortedCols.map((c, idx) => [c, idx]));

    // Determine vertical scale from fullest column
    let maxColTotal = 0.5;
    for (const col of sortedCols) {
      const list = columnsMap.get(col) || [];
      const sum = list.reduce((acc, n) => acc + Math.max(0.05, n.value), 0);
      if (sum > maxColTotal) maxColTotal = sum;
    }

    const posMap = new Map<string, PositionedNode>();
    const posList: PositionedNode[] = [];
    const colGapY = isNarrow ? 6 : 8;

    for (const col of sortedCols) {
      const colIdx = colIndexByCol.get(col) ?? 0;
      const list = columnsMap.get(col) || [];
      const x = sortedCols.length === 1 ? padL : padL + (colIdx / colSpan) * plotW;
      const usableH = Math.max(24, plotH - colGapY * Math.max(0, list.length - 1));
      const scale = usableH / maxColTotal;

      const totalColH = list.reduce((acc, n) => acc + Math.max(4, Math.max(0.05, n.value) * scale), 0) +
        colGapY * Math.max(0, list.length - 1);
      let cursorY = padY + Math.max(0, (plotH - totalColH) / 2);

      for (const item of list) {
        const h = Math.max(4, Math.max(0.05, item.value) * scale);
        const placed: PositionedNode = {
          ...item,
          x,
          y: cursorY,
          w: nodeW,
          h
        };
        posMap.set(item.id, placed);
        posList.push(placed);
        cursorY += h + colGapY;
      }
    }

    // Track per-node vertical offset cursors for outbound & inbound ribbons
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();
    const sourceTotals = new Map<string, number>();
    const targetTotals = new Map<string, number>();

    for (const lk of links) {
      sourceTotals.set(lk.source, (sourceTotals.get(lk.source) || 0) + lk.value);
      targetTotals.set(lk.target, (targetTotals.get(lk.target) || 0) + lk.value);
    }

    const placedLinks: PositionedLink[] = [];
    for (const lk of links) {
      const src = posMap.get(lk.source);
      const tgt = posMap.get(lk.target);
      if (!src || !tgt || lk.value <= 0) continue;

      const srcTotal = Math.max(0.01, sourceTotals.get(lk.source) || src.value);
      const tgtTotal = Math.max(0.01, targetTotals.get(lk.target) || tgt.value);
      const thicknessSrc = Math.max(2, (lk.value / srcTotal) * src.h);
      const thicknessTgt = Math.max(2, (lk.value / tgtTotal) * tgt.h);

      const y0Start = src.y + (sourceOffsets.get(lk.source) || 0);
      const y1Start = tgt.y + (targetOffsets.get(lk.target) || 0);
      sourceOffsets.set(lk.source, (sourceOffsets.get(lk.source) || 0) + thicknessSrc);
      targetOffsets.set(lk.target, (targetOffsets.get(lk.target) || 0) + thicknessTgt);

      const x0 = src.x + src.w;
      const x1 = tgt.x;
      const cx = (x0 + x1) / 2;

      const y0End = y0Start + thicknessSrc;
      const y1End = y1Start + thicknessTgt;

      const pathD =
        `M ${x0.toFixed(1)},${y0Start.toFixed(1)} ` +
        `C ${cx.toFixed(1)},${y0Start.toFixed(1)} ${cx.toFixed(1)},${y1Start.toFixed(1)} ${x1.toFixed(1)},${y1Start.toFixed(1)} ` +
        `L ${x1.toFixed(1)},${y1End.toFixed(1)} ` +
        `C ${cx.toFixed(1)},${y1End.toFixed(1)} ${cx.toFixed(1)},${y0End.toFixed(1)} ${x0.toFixed(1)},${y0End.toFixed(1)} Z`;

      placedLinks.push({
        ...lk,
        pathD,
        sourceLabel: src.label,
        targetLabel: tgt.label
      });
    }

    return {
      positionedNodes: posList,
      positionedLinks: placedLinks,
      maxCol: highestCol,
      colGapPx: computedColGap,
      rightPadPx: padR
    };
  }, [nodes, links, width, height, isNarrow]);

  if (nodes.length === 0) return null;

  const outboundNodeIds = new Set(positionedLinks.map((l) => l.source));
  const maxInnerChars = Math.max(4, Math.floor((colGapPx - 14) / (isNarrow ? 5.6 : 6.2)));
  const maxRightChars = Math.max(10, Math.floor((rightPadPx - 10) / (isNarrow ? 5.6 : 6.2)));

  const activeLink = hoveredLinkId ? positionedLinks.find((l) => l.id === hoveredLinkId) : null;
  const activeNode = hoveredNodeId ? positionedNodes.find((n) => n.id === hoveredNodeId) : null;

  return (
    <div className={cn('min-w-0 w-full overflow-hidden', className)}>
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        onPointerLeave={() => {
          setHoveredLinkId(null);
          setHoveredNodeId(null);
        }}
        className="relative w-full select-none"
        style={{ height }}
      >
        {activeLink || activeNode ? (
          <div className="pro-surface pointer-events-none absolute top-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap">
            {activeLink ? (
              <>
                <span className="text-muted">
                  {activeLink.sourceLabel} → {activeLink.targetLabel}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {activeLink.value.toFixed(2)} {unit}
                </span>
              </>
            ) : activeNode ? (
              <>
                <span className="text-muted">{activeNode.label}</span>
                <span className="font-mono font-bold text-foreground">
                  {activeNode.value.toFixed(2)} {unit}
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full overflow-visible">
          <defs>
            {positionedLinks.map((lk) => (
              <linearGradient key={lk.id} id={`${uid}-${lk.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={lk.sourceColor} stopOpacity={0.6} />
                <stop offset="100%" stopColor={lk.targetColor} stopOpacity={0.5} />
              </linearGradient>
            ))}
          </defs>

          {/* Flow ribbons */}
          {positionedLinks.map((lk) => {
            const isHighlighted =
              hoveredLinkId === lk.id ||
              (hoveredNodeId !== null && (lk.source === hoveredNodeId || lk.target === hoveredNodeId));
            const isDimmed = (hoveredLinkId !== null || hoveredNodeId !== null) && !isHighlighted;
            return (
              <path
                key={lk.id}
                d={lk.pathD}
                fill={`url(#${uid}-${lk.id})`}
                fillOpacity={isHighlighted ? 0.88 : isDimmed ? 0.16 : 0.44}
                className="cursor-pointer transition-opacity duration-150"
                onPointerEnter={() => setHoveredLinkId(lk.id)}
                onPointerLeave={() => setHoveredLinkId(null)}
                onClick={(e) => e.stopPropagation()}
              />
            );
          })}

          {/* Node bars & labels */}
          {positionedNodes.map((node) => {
            const isHighlighted =
              hoveredNodeId === node.id ||
              (hoveredLinkId !== null &&
                positionedLinks.some(
                  (l) => l.id === hoveredLinkId && (l.source === node.id || l.target === node.id)
                ));
            const isDimmed = (hoveredLinkId !== null || hoveredNodeId !== null) && !isHighlighted;
            const isRightEdge = node.column === maxCol;
            const isMiddleTerminalSink =
              node.column > 0 && node.column < maxCol && !outboundNodeIds.has(node.id);
            const placeLeft = isMiddleTerminalSink;
            const labelX = placeLeft ? node.x - 5 : node.x + node.w + 5;
            const labelY = node.y + node.h / 2;
            const maxChars = isRightEdge ? maxRightChars : maxInnerChars;
            const displayLabel =
              node.label.length > maxChars ? `${node.label.slice(0, maxChars - 1)}…` : node.label;

            return (
              <g
                key={node.id}
                opacity={isDimmed ? 0.38 : 1}
                className="cursor-pointer transition-opacity duration-150"
                onPointerEnter={() => setHoveredNodeId(node.id)}
                onPointerLeave={() => setHoveredNodeId(null)}
                onClick={(e) => e.stopPropagation()}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={4}
                  fill={node.color}
                />
                {node.h >= 7 || isRightEdge || node.column === 0 || node.column === 1 ? (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={placeLeft ? 'end' : 'start'}
                    dominantBaseline="central"
                    fill="var(--foreground)"
                    className={cn('font-medium', isNarrow ? 'text-[10px]' : 'text-[11px]')}
                  >
                    {displayLabel}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
