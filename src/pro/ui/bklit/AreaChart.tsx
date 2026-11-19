/**
 * AreaChart: bklit UI "Area Chart" (https://ui.bklit.com/docs/components/area-chart,
 * https://ui.bklit.com/r/area-chart.json, MIT), adapted for pro onto HeroUI tokens (--accent,
 * --foreground, --muted, --surface, --separator) using d3-shape and motion/react.
 */
import { area as d3Area, curveMonotoneX, line as d3Line } from 'd3-shape';
import { motion } from 'motion/react';
import { useCallback, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useMeasuredWidth } from './useBklitChartBox';
import { cn } from '@/lib/utils';

export interface BklitAreaDatum {
  label: string;
  value: number;
  secondary?: string;
}

interface PlacedValueLabel {
  index: number;
  x: number;
  y: number;
  text: string;
}

/**
 * Evenly spaced indices across `[0, length - 1]` with both endpoints included
 * (from @bklit/area-chart area-value-label-layout.ts).
 */
function evenlySpacedLabelIndices(length: number, count: number): number[] {
  const visibleCount = Math.min(Math.max(0, Math.floor(count)), length);
  if (visibleCount === 0) return [];
  if (visibleCount === 1) return [0];
  const lastIndex = length - 1;
  return Array.from({ length: visibleCount }, (_, index) =>
    Math.round((index * lastIndex) / (visibleCount - 1))
  );
}

/**
 * Collision-avoiding label placement adapted from @bklit/area-chart.
 */
function placeValueLabels(
  points: { index: number; x: number; y: number; text: string }[],
  plotWidth: number,
  plotHeight: number
): PlacedValueLabel[] {
  if (points.length === 0 || plotWidth <= 0 || plotHeight <= 0) return [];
  const maxCount = Math.min(points.length, Math.max(2, Math.floor(plotWidth / 54)));
  const wanted = new Set(evenlySpacedLabelIndices(points.length, maxCount));
  const placed: PlacedValueLabel[] = [];
  const boxWidth = 38;
  const boxHeight = 14;
  const padX = 24;

  for (const pt of points) {
    if (!wanted.has(pt.index)) continue;
    const x = Math.max(padX, Math.min(plotWidth - padX, pt.x));
    const yAbove = pt.y - 11;
    const yBelow = pt.y + 15;
    const candidateY = yAbove >= 11 ? yAbove : Math.min(plotHeight - 6, yBelow);

    const collides = placed.some(
      (other) =>
        Math.abs(x - other.x) < boxWidth && Math.abs(candidateY - other.y) < boxHeight
    );
    if (!collides) {
      placed.push({ index: pt.index, x, y: candidateY, text: pt.text });
    }
  }
  return placed;
}

interface AreaChartProps {
  data: BklitAreaDatum[];
  height?: number;
  className?: string;
  formatValue?: (value: number) => string;
  showValueLabels?: boolean;
  accentColor?: string;
  ariaLabel?: string;
}

const MARGIN = { top: 22, right: 20, bottom: 24, left: 20 };

export function AreaChart({
  data,
  height = 148,
  className,
  formatValue = (v) => `${Math.round(v)}°`,
  showValueLabels = true,
  accentColor = 'var(--accent)',
  ariaLabel = 'Hourly trend chart'
}: AreaChartProps) {
  const { ref: containerRef, nodeRef: containerNodeRef, width: containerWidth } = useMeasuredWidth<HTMLDivElement>();
  const scrubbedRef = useRef(false);
  const pointerDownXRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const uniqueId = useId();
  const gradientId = `bklit-area-fill-${uniqueId}`;
  const clipId = `bklit-area-clip-${uniqueId}`;


  const width = containerWidth > 0 ? containerWidth : 320;
  const innerWidth = Math.max(40, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(40, height - MARGIN.top - MARGIN.bottom);

  const { coords, areaPath, strokePath, gridYs, valueLabels, xTicks } = useMemo(() => {
    if (data.length === 0) {
      return {
        coords: [] as { index: number; x: number; y: number; datum: BklitAreaDatum }[],
        areaPath: '',
        strokePath: '',
        gridYs: [] as number[],
        valueLabels: [] as PlacedValueLabel[],
        xTicks: [] as { index: number; x: number; label: string }[]
      };
    }

    const values = data.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = Math.max(2, rawMax - rawMin);
    const domainMin = rawMin - span * 0.22;
    const domainMax = rawMax + span * 0.25;
    const denom = Math.max(1, domainMax - domainMin);

    const ptCoords = data.map((datum, index) => {
      const x = data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth;
      const normalized = (datum.value - domainMin) / denom;
      const y = innerHeight - normalized * innerHeight;
      return { index, x, y, datum };
    });

    const lineGen = d3Line<(typeof ptCoords)[number]>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX);

    const areaGen = d3Area<(typeof ptCoords)[number]>()
      .x((p) => p.x)
      .y0(innerHeight)
      .y1((p) => p.y)
      .curve(curveMonotoneX);

    const ticksCount = Math.min(data.length, innerWidth < 260 ? 4 : 6);
    const tickIndices = new Set(evenlySpacedLabelIndices(data.length, ticksCount));
    const computedTicks = ptCoords
      .filter((p) => tickIndices.has(p.index))
      .map((p) => ({ index: p.index, x: p.x, label: p.datum.label }));

    const labels = showValueLabels
      ? placeValueLabels(
          ptCoords.map((p) => ({ index: p.index, x: p.x, y: p.y, text: formatValue(p.datum.value) })),
          innerWidth,
          innerHeight
        )
      : [];

    return {
      coords: ptCoords,
      areaPath: areaGen(ptCoords) || '',
      strokePath: lineGen(ptCoords) || '',
      gridYs: [innerHeight * 0.25, innerHeight * 0.62, innerHeight],
      valueLabels: labels,
      xTicks: computedTicks
    };
  }, [data, innerWidth, innerHeight, formatValue, showValueLabels]);

  const updateIndexFromClientX = useCallback(
    (clientX: number) => {
      const el = containerNodeRef.current;
      if (!el || coords.length === 0) return;
      const rect = el.getBoundingClientRect();
      const relX = clientX - rect.left - MARGIN.left;
      const clampedX = Math.max(0, Math.min(innerWidth, relX));
      let nearestIdx = 0;
      let bestDist = Infinity;
      for (const pt of coords) {
        const dist = Math.abs(pt.x - clampedX);
        if (dist < bestDist) {
          bestDist = dist;
          nearestIdx = pt.index;
        }
      }
      setActiveIndex(nearestIdx);
    },
    [coords, innerWidth]
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerDownXRef.current = e.clientX;
    scrubbedRef.current = false;
    updateIndexFromClientX(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerDownXRef.current !== null && Math.abs(e.clientX - pointerDownXRef.current) > 6) {
      scrubbedRef.current = true;
    }
    updateIndexFromClientX(e.clientX);
  };

  const handlePointerUpOrLeave = () => {
    pointerDownXRef.current = null;
    setActiveIndex(null);
  };

  if (data.length === 0) return null;

  const activePoint = activeIndex !== null ? coords[activeIndex] : null;
  const activeLeftPct = activePoint ? ((MARGIN.left + activePoint.x) / width) * 100 : 50;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      onClick={(e) => {
        if (scrubbedRef.current) {
          e.stopPropagation();
          scrubbedRef.current = false;
        }
      }}
      className={cn('relative w-full select-none touch-pan-y', className)}
      style={{ height }}
    >
      {activePoint ? (
        <div
          className="pro-surface pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
          style={{ left: `${Math.max(16, Math.min(84, activeLeftPct))}%` }}
        >
          <span className="text-muted">{activePoint.datum.label}</span>
          <span className="font-mono font-bold text-foreground">{formatValue(activePoint.datum.value)}</span>
          {activePoint.datum.secondary ? (
            <span className="font-mono text-[10px]" style={{ color: accentColor }}>
              {activePoint.datum.secondary}
            </span>
          ) : null}
        </div>
      ) : null}

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.28} />
            <stop offset="85%" stopColor={accentColor} stopOpacity={0.04} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
          <clipPath id={clipId}>
            <motion.rect
              x={0}
              y={-MARGIN.top}
              height={height + MARGIN.top}
              initial={{ width: 0 }}
              animate={{ width: innerWidth + MARGIN.right }}
              transition={{ duration: 0.75, ease: [0.85, 0, 0.15, 1] }}
            />
          </clipPath>
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {gridYs.map((y, idx) => (
            <line
              key={idx}
              x1={0}
              x2={innerWidth}
              y1={y}
              y2={y}
              stroke="var(--separator)"
              strokeDasharray={idx === gridYs.length - 1 ? undefined : '3 4'}
              strokeOpacity={idx === gridYs.length - 1 ? 0.65 : 0.45}
              strokeWidth={1}
            />
          ))}

          <g clipPath={`url(#${clipId})`}>
            {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
            {strokePath ? (
              <path
                d={strokePath}
                fill="none"
                stroke={accentColor}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </g>

          {valueLabels.map((lbl) => {
            const isDimmed = activePoint !== null && activePoint.index !== lbl.index;
            return (
              <text
                key={lbl.index}
                x={lbl.x}
                y={lbl.y}
                textAnchor="middle"
                fill="var(--foreground)"
                fillOpacity={isDimmed ? 0.25 : 0.85}
                className="font-mono text-[10px] font-semibold transition-opacity"
              >
                {lbl.text}
              </text>
            );
          })}

          {activePoint ? (
            <g>
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={innerHeight}
                stroke={accentColor}
                strokeDasharray="3 3"
                strokeOpacity={0.55}
                strokeWidth={1.25}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={5.5}
                fill="var(--surface)"
                stroke={accentColor}
                strokeWidth={2.25}
              />
            </g>
          ) : null}

          {xTicks.map((tick) => (
            <text
              key={tick.index}
              x={tick.x}
              y={innerHeight + 17}
              textAnchor={
                tick.index === 0 ? 'start' : tick.index === data.length - 1 ? 'end' : 'middle'
              }
              fill="var(--muted)"
              className="font-mono text-[10px]"
            >
              {tick.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
