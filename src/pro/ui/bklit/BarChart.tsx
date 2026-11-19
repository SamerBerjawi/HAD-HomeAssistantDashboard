/**
 * BarChart: bklit UI "Bar Chart" (https://ui.bklit.com/docs/components/bar-chart, MIT),
 * adapted for pro onto HeroUI tokens (--accent, --success, --foreground, --muted, --surface,
 * --separator) with pointer-scrubbing crosshair pill tooltips and motion/react entrance.
 */
import { motion } from 'motion/react';
import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useMeasuredWidth } from './useBklitChartBox';
import { cn } from '@/lib/utils';

export interface BklitBarDatum {
  label: string;
  value: number;
  secondaryValue?: number;
  secondaryLabel?: string;
}

interface BarChartProps {
  data: BklitBarDatum[];
  height?: number;
  className?: string;
  formatValue?: (value: number) => string;
  accentColor?: string;
  secondaryColor?: string;
  ariaLabel?: string;
}

const MARGIN = { top: 20, right: 10, bottom: 22, left: 10 };

function evenlySpacedIndices(length: number, count: number): number[] {
  const visible = Math.min(Math.max(0, Math.floor(count)), length);
  if (visible === 0) return [];
  if (visible === 1) return [0];
  const last = length - 1;
  return Array.from({ length: visible }, (_, i) => Math.round((i * last) / (visible - 1)));
}

export function BarChart({
  data,
  height = 136,
  className,
  formatValue = (v) => `${v.toFixed(1)} kWh`,
  accentColor = 'var(--accent)',
  secondaryColor = 'var(--success)',
  ariaLabel = 'Energy usage bar chart'
}: BarChartProps) {
  const { ref: containerRef, nodeRef: containerNodeRef, width: containerWidth } = useMeasuredWidth<HTMLDivElement>();
  const scrubbedRef = useRef(false);
  const pointerDownXRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);


  const width = containerWidth > 0 ? containerWidth : 320;
  const innerWidth = Math.max(40, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(36, height - MARGIN.top - MARGIN.bottom);

  const { bars, gridYs, xTicks, maxValue } = useMemo(() => {
    if (data.length === 0) {
      return {
        bars: [] as {
          index: number;
          centerX: number;
          primaryX: number;
          primaryW: number;
          primaryY: number;
          primaryH: number;
          secondaryX: number;
          secondaryW: number;
          secondaryY: number;
          secondaryH: number;
          hasSecondary: boolean;
          datum: BklitBarDatum;
        }[],
        gridYs: [] as number[],
        xTicks: [] as { index: number; x: number; label: string }[],
        maxValue: 1
      };
    }

    const peak = Math.max(
      0.5,
      ...data.map((d) => Math.max(d.value, d.secondaryValue ?? 0))
    );
    const domainMax = peak * 1.15;
    const step = innerWidth / data.length;
    const anySecondary = data.some((d) => (d.secondaryValue ?? 0) > 0);
    const slotW = Math.max(3, step * 0.72);

    const computedBars = data.map((datum, index) => {
      const centerX = index * step + step / 2;
      const val = Math.max(0, datum.value);
      const secVal = Math.max(0, datum.secondaryValue ?? 0);
      const hasSec = anySecondary && secVal > 0.001;

      const primaryH = val > 0 ? Math.max(2, (val / domainMax) * innerHeight) : 0;
      const primaryY = innerHeight - primaryH;
      const secondaryH = hasSec ? Math.max(2, (secVal / domainMax) * innerHeight) : 0;
      const secondaryY = innerHeight - secondaryH;

      const primaryW = hasSec ? Math.max(2, (slotW - 1.5) * 0.56) : slotW;
      const secondaryW = hasSec ? Math.max(2, (slotW - 1.5) * 0.44) : 0;
      const groupLeft = centerX - (hasSec ? (primaryW + secondaryW + 1.5) / 2 : primaryW / 2);

      return {
        index,
        centerX,
        primaryX: groupLeft,
        primaryW,
        primaryY,
        primaryH,
        secondaryX: groupLeft + primaryW + 1.5,
        secondaryW,
        secondaryY,
        secondaryH,
        hasSecondary: hasSec,
        datum
      };
    });

    const ticksCount = Math.min(data.length, innerWidth < 240 ? 4 : 6);
    const tickSet = new Set(evenlySpacedIndices(data.length, ticksCount));
    const computedTicks = computedBars
      .filter((b) => tickSet.has(b.index))
      .map((b) => ({ index: b.index, x: b.centerX, label: b.datum.label }));

    return {
      bars: computedBars,
      gridYs: [innerHeight * 0.25, innerHeight * 0.62, innerHeight],
      xTicks: computedTicks,
      maxValue: peak
    };
  }, [data, innerWidth, innerHeight]);

  const updateIndexFromClientX = useCallback(
    (clientX: number) => {
      const el = containerNodeRef.current;
      if (!el || bars.length === 0) return;
      const rect = el.getBoundingClientRect();
      const relX = Math.max(0, Math.min(innerWidth, clientX - rect.left - MARGIN.left));
      const idx = Math.min(bars.length - 1, Math.max(0, Math.floor((relX / innerWidth) * bars.length)));
      setActiveIndex(idx);
    },
    [bars.length, innerWidth]
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

  if (data.length === 0 || maxValue <= 0) return null;

  const activeBar = activeIndex !== null ? bars[activeIndex] : null;
  const activeLeftPct = activeBar ? ((MARGIN.left + activeBar.centerX) / width) * 100 : 50;

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
      {activeBar ? (
        <div
          className="pro-surface pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
          style={{ left: `${Math.max(16, Math.min(84, activeLeftPct))}%` }}
        >
          <span className="text-muted">{activeBar.datum.label}</span>
          <span className="font-mono font-bold text-foreground">{formatValue(activeBar.datum.value)}</span>
          {activeBar.datum.secondaryLabel ? (
            <span className="font-mono text-[10px]" style={{ color: secondaryColor }}>
              {activeBar.datum.secondaryLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block overflow-visible">
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

          {activeBar ? (
            <line
              x1={activeBar.centerX}
              x2={activeBar.centerX}
              y1={0}
              y2={innerHeight}
              stroke={accentColor}
              strokeDasharray="3 3"
              strokeOpacity={0.45}
              strokeWidth={1.15}
            />
          ) : null}

          {bars.map((bar) => {
            const isDimmed = activeBar !== null && activeBar.index !== bar.index;
            return (
              <g key={bar.index} opacity={isDimmed ? 0.35 : 1} className="transition-opacity duration-150">
                {bar.primaryH > 0 ? (
                  <motion.rect
                    x={bar.primaryX}
                    width={bar.primaryW}
                    rx={Math.min(3, bar.primaryW / 2)}
                    fill={accentColor}
                    initial={{ y: innerHeight, height: 0 }}
                    animate={{ y: bar.primaryY, height: bar.primaryH }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(0.24, bar.index * 0.012),
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  />
                ) : null}
                {bar.hasSecondary && bar.secondaryH > 0 ? (
                  <motion.rect
                    x={bar.secondaryX}
                    width={bar.secondaryW}
                    rx={Math.min(3, bar.secondaryW / 2)}
                    fill={secondaryColor}
                    fillOpacity={0.85}
                    initial={{ y: innerHeight, height: 0 }}
                    animate={{ y: bar.secondaryY, height: bar.secondaryH }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(0.26, bar.index * 0.012 + 0.03),
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  />
                ) : null}
              </g>
            );
          })}

          {xTicks.map((tick) => (
            <text
              key={tick.index}
              x={tick.x}
              y={innerHeight + 16}
              textAnchor={tick.index === 0 ? 'start' : tick.index === data.length - 1 ? 'end' : 'middle'}
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
