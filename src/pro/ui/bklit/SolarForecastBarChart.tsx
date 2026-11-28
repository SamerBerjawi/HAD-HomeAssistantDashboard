/**
 * Pro-UI SolarForecastBarChart: bklit UI BarChart adapted for Home Assistant solar production
 * inside a calm HeroUI soft surface well — smooth rounded gradient bars (var(--warning)) + subtle
 * dashed forecast overlay curve and interactive crosshair tooltip.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { SolarPanel01Icon } from '@hugeicons/core-free-icons';
import { curveMonotoneX, line as d3Line } from 'd3-shape';
import { motion } from 'motion/react';
import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { evenlySpacedIndices, useBklitChartBox } from './useBklitChartBox';

export interface SolarForecastDatum {
  label: string;
  solar: number;
  forecast: number | null;
}

interface SolarForecastBarChartProps {
  data: SolarForecastDatum[];
  height?: number;
  showAxes?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SolarForecastBarChart({
  data,
  height = 144,
  showAxes = true,
  className,
  ariaLabel = 'Solar production and forecast chart'
}: SolarForecastBarChartProps) {
  const uid = useId();
  const marginLeft = showAxes ? 28 : 8;
  const marginRight = 14;
  const marginTop = 14;
  const marginBottom = showAxes ? 22 : 6;

  const {
    containerRef,
    width,
    innerWidth,
    activeIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    consumeClickIfScrubbed
  } = useBklitChartBox({
    itemCount: data.length,
    marginLeft,
    marginRight,
    defaultWidth: 260
  });

  const innerHeight = Math.max(40, height - marginTop - marginBottom);

  const computed = useMemo(() => {
    if (data.length === 0) return null;

    const peak = Math.max(0.3, ...data.map((d) => Math.max(d.solar, d.forecast ?? 0)));
    const domainMax = peak * 1.14;
    const slotW = innerWidth / data.length;
    const barW = Math.max(3, slotW * 0.64);
    const gapX = (slotW - barW) / 2;

    const bars = data.map((d, index) => {
      const barH = d.solar > 0.002 ? Math.max(2, (d.solar / domainMax) * innerHeight) : 0;
      return {
        index,
        x: index * slotW + gapX,
        centerX: index * slotW + slotW / 2,
        barW,
        y: innerHeight - barH,
        h: barH,
        datum: d
      };
    });

    const forecastPts = bars
      .filter((b) => b.datum.forecast !== null && b.datum.forecast > 0.005)
      .map((b) => ({
        x: b.centerX,
        y: innerHeight - ((b.datum.forecast ?? 0) / domainMax) * innerHeight
      }));

    const forecastPath =
      forecastPts.length >= 2
        ? d3Line<{ x: number; y: number }>()
            .x((p) => p.x)
            .y((p) => p.y)
            .curve(curveMonotoneX)(forecastPts) || ''
        : '';

    const yTicks = [domainMax, domainMax / 2, 0].map((val) => ({
      val,
      y: innerHeight - (val / domainMax) * innerHeight
    }));

    const xCount = Math.min(data.length, Math.max(2, Math.min(5, Math.floor(innerWidth / 64))));
    const xSet = new Set(evenlySpacedIndices(data.length, xCount));
    const rawTicks = bars
      .filter((b) => xSet.has(b.index))
      .map((b) => ({ index: b.index, x: b.centerX, label: b.datum.label }));
    const xTicks = rawTicks.filter((t, i) => {
      if (i === 0 || i === rawTicks.length - 1) return true;
      const prevX = rawTicks[i - 1].x;
      const lastX = rawTicks[rawTicks.length - 1].x;
      return t.x - prevX >= 48 && lastX - t.x >= 48;
    });

    return { bars, forecastPath, yTicks, xTicks };
  }, [data, innerHeight, innerWidth]);

  if (!computed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-3 text-xs text-muted',
          className
        )}
        style={{ height }}
      >
        <HugeiconsIcon icon={SolarPanel01Icon} size={15} className="shrink-0 text-warning" />
        <span>Waiting for Home Assistant solar statistics…</span>
      </div>
    );
  }

  const activeBar = activeIndex !== null ? computed.bars[activeIndex] : null;
  const activeLeftPct = activeBar ? ((marginLeft + activeBar.centerX) / width) * 100 : 50;

  return (
    <div className={cn('min-w-0 w-full overflow-hidden', className)}>
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerLeave}
        onPointerLeave={handlePointerLeave}
        onClick={(e) => consumeClickIfScrubbed(() => e.stopPropagation())}
        className="relative w-full select-none touch-pan-y"
        style={{ height }}
      >
        {activeBar ? (
          <div
            className="pro-surface pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
            style={{ left: `${Math.max(20, Math.min(80, activeLeftPct))}%` }}
          >
            <span className="text-muted">{activeBar.datum.label}</span>
            <span className="font-mono font-bold text-warning">
              {activeBar.datum.solar.toFixed(2)} kWh
            </span>
            {activeBar.datum.forecast !== null ? (
              <span className="font-mono text-muted">
                Est {activeBar.datum.forecast.toFixed(2)}
              </span>
            ) : null}
          </div>
        ) : null}

        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full overflow-visible">
          <defs>
            <linearGradient id={`sf-bar-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.92} />
              <stop offset="100%" stopColor="var(--warning)" stopOpacity={0.32} />
            </linearGradient>
          </defs>

          <g transform={`translate(${marginLeft},${marginTop})`}>
            {showAxes ? (
              <text x={0} y={-4} fill="var(--muted)" className="font-mono text-[9px]">
                kWh
              </text>
            ) : null}

            {computed.yTicks.map((tick, idx) => (
              <g key={idx}>
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="var(--separator)"
                  strokeOpacity={tick.val === 0 ? 0.65 : 0.35}
                  strokeDasharray={tick.val === 0 ? undefined : '3 4'}
                  strokeWidth={1}
                />
                {showAxes ? (
                  <text
                    x={-6}
                    y={tick.y}
                    textAnchor="end"
                    dominantBaseline="central"
                    fill="var(--muted)"
                    className="font-mono text-[9px]"
                  >
                    {tick.val === 0 ? '0' : tick.val.toFixed(1)}
                  </text>
                ) : null}
              </g>
            ))}

            {computed.bars.map((bar) => {
              const rx = Math.min(4, bar.barW / 2);
              const isDimmed = activeBar !== null && activeBar.index !== bar.index;
              return bar.h > 0 ? (
                <motion.rect
                  key={bar.index}
                  x={bar.x}
                  width={bar.barW}
                  rx={rx}
                  fill={`url(#sf-bar-${uid})`}
                  opacity={isDimmed ? 0.35 : 1}
                  initial={{ y: innerHeight, height: 0 }}
                  animate={{ y: bar.y, height: bar.h }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(0.22, bar.index * 0.01),
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              ) : null;
            })}

            {computed.forecastPath ? (
              <path
                d={computed.forecastPath}
                fill="none"
                stroke="var(--foreground)"
                strokeOpacity={0.58}
                strokeWidth={1.6}
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            ) : null}

            {activeBar ? (
              <line
                x1={activeBar.centerX}
                x2={activeBar.centerX}
                y1={0}
                y2={innerHeight}
                stroke="var(--warning)"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
                strokeWidth={1.2}
              />
            ) : null}

            {showAxes
              ? computed.xTicks.map((t) => (
                  <text
                    key={t.index}
                    x={t.x}
                    y={innerHeight + 15}
                    textAnchor={
                      t.index === 0 ? 'start' : t.index === data.length - 1 ? 'end' : 'middle'
                    }
                    fill="var(--muted)"
                    className="font-mono text-[9px]"
                  >
                    {t.label}
                  </text>
                ))
              : null}
          </g>
        </svg>
      </div>
    </div>
  );
}
