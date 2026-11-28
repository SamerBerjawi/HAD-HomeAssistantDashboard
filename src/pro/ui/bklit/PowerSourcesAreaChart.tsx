/**
 * Pro-UI PowerSourcesAreaChart: bklit UI AreaChart adapted for bidirectional power flow, drawn
 * like Home Assistant's "Power sources" graph: what comes in (solar, battery discharge, grid
 * import) stacks above zero, what goes out (battery charge, grid export) below, and consumption
 * is the dashed line. Home Assistant's own energy colours (HA_ENERGY_COLORS), round axis steps,
 * and a midnight-to-midnight axis when the
 * series covers a day (its `future` slots stay empty).
 */
import { area as d3Area, curveMonotoneX, line as d3Line } from 'd3-shape';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BatteryCharging01Icon,
  ChartLineData01Icon,
  Home01Icon,
  PlugSocketIcon,
  SolarPanel01Icon
} from '@hugeicons/core-free-icons';
import { motion } from 'motion/react';
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { formatPower } from '../../lib/pageSentences';
import { niceTicks, tickLabel } from './chartTicks';
import { evenlySpacedIndices, useBklitChartBox } from './useBklitChartBox';

/**
 * Home Assistant's energy colours (frontend: --energy-solar-color, --energy-grid-consumption-color,
 * --energy-grid-return-color, --energy-battery-out-color), so this chart reads like HA's
 * "Power sources" graph. The battery is one colour both ways, as HA draws it.
 */
const HA_ENERGY_COLORS = {
  '--ps-solar': '#ff9800',
  '--ps-grid': '#488fc2',
  '--ps-return': '#8353d1',
  '--ps-battery': '#4db6ac'
} as CSSProperties;

export interface PowerSourcesDatum {
  label: string;
  solar: number;
  batteryDischarge: number;
  gridImport: number;
  batteryCharge: number;
  gridExport: number;
  home: number;
  /** Slot start (ms) when the series is a whole day; the axis then marks every few hours. */
  t?: number;
  /** A slot after the latest data (later today): part of the axis, not drawn. */
  future?: boolean;
}


interface PowerSourcesAreaChartProps {
  data: PowerSourcesDatum[];
  height?: number;
  showAxes?: boolean;
  showLegend?: boolean;
  /** Cards: leave out the rest of today instead of drawing the whole day's axis. */
  trimFuture?: boolean;
  liveWatts?: {
    solarKW: number;
    gridKW: number;
    batteryKW: number;
    homeKW: number;
  };
  className?: string;
  ariaLabel?: string;
}

interface Pt {
  x: number;
  y: number;
}

function stackedBandPath(upper: Pt[], lower: Pt[]): string {
  if (upper.length === 0 || lower.length === 0) return '';
  const lineGen = d3Line<Pt>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curveMonotoneX);
  const top = lineGen(upper) || '';
  const bottom = d3Line<Pt>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curveMonotoneX)([...lower].reverse());
  if (!top || !bottom) return '';
  return `${top} L ${lower[lower.length - 1].x.toFixed(1)} ${lower[lower.length - 1].y.toFixed(1)} ${bottom.replace(/^M/, 'L')} Z`;
}

export function PowerSourcesAreaChart({
  data,
  height = 148,
  showAxes = true,
  showLegend = true,
  liveWatts,
  trimFuture = false,
  className,
  ariaLabel = 'Power sources bidirectional chart'
}: PowerSourcesAreaChartProps) {
  // The axis may run past the data (rest of today); paths stop at the last real point.
  const axisData = useMemo(() => (trimFuture ? data.filter((d) => !d.future) : data), [data, trimFuture]);
  const drawn = useMemo(() => data.filter((d) => !d.future), [data]);
  const [showSolar, setShowSolar] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showBattery, setShowBattery] = useState(true);
  const [showHome, setShowHome] = useState(true);

  const uid = useId();
  const marginLeft = showAxes ? 28 : 10;
  const marginRight = 14;
  const marginTop = 14;
  const marginBottom = showAxes ? 22 : 8;

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
    itemCount: axisData.length,
    marginLeft,
    marginRight,
    defaultWidth: 260
  });

  const innerHeight = Math.max(44, height - marginTop - marginBottom);

  const computed = useMemo(() => {
    if (drawn.length === 0) return null;

    const maxPos = Math.max(
      0.1,
      ...drawn.map((d) => {
        const s = showSolar ? d.solar : 0;
        const bd = showBattery ? d.batteryDischarge : 0;
        const gi = showGrid ? d.gridImport : 0;
        const h = showHome ? d.home : 0;
        return Math.max(s + bd + gi, h);
      })
    );

    const maxNeg = Math.max(
      0,
      ...drawn.map((d) => (showBattery ? d.batteryCharge : 0) + (showGrid ? d.gridExport : 0))
    );

    const hasNeg = maxNeg > 0.04;
    const tickVals = niceTicks(hasNeg ? -maxNeg : 0, maxPos);
    const domainMax = tickVals[tickVals.length - 1];
    const domainMin = tickVals[0];
    const tickStep = tickVals.length > 1 ? tickVals[1] - tickVals[0] : 1;
    const span = Math.max(1e-6, domainMax - domainMin);
    const valToY = (v: number) => innerHeight - ((v - domainMin) / span) * innerHeight;
    const zeroY = valToY(0);
    const stepX = axisData.length <= 1 ? 0 : innerWidth / (axisData.length - 1);

    const solarPts: Pt[] = drawn.map((d, i) => ({
      x: i * stepX,
      y: valToY(showSolar ? d.solar : 0)
    }));
    const batDisPts: Pt[] = drawn.map((d, i) => ({
      x: i * stepX,
      y: valToY((showSolar ? d.solar : 0) + (showBattery ? d.batteryDischarge : 0))
    }));
    const gridImpPts: Pt[] = drawn.map((d, i) => ({
      x: i * stepX,
      y: valToY(
        (showSolar ? d.solar : 0) +
          (showBattery ? d.batteryDischarge : 0) +
          (showGrid ? d.gridImport : 0)
      )
    }));
    const batChgPts: Pt[] = drawn.map((d, i) => ({
      x: i * stepX,
      y: valToY(-(showBattery ? d.batteryCharge : 0))
    }));
    const gridExpPts: Pt[] = drawn.map((d, i) => ({
      x: i * stepX,
      y: valToY(-((showBattery ? d.batteryCharge : 0) + (showGrid ? d.gridExport : 0)))
    }));
    const homePts: Pt[] = drawn.map((d, i) => ({
      x: i * stepX,
      y: valToY(d.home)
    }));

    const lineGen = d3Line<Pt>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX);

    const solarArea =
      d3Area<Pt>()
        .x((p) => p.x)
        .y0(zeroY)
        .y1((p) => p.y)
        .curve(curveMonotoneX)(solarPts) || '';

    // A whole day: midnight, then every 4 hours (6 on narrow charts), like HA. Otherwise evenly spaced.
    const isDay = axisData.length >= 100 && axisData.every((d) => typeof d.t === 'number');
    const everyHours = innerWidth < 300 ? 6 : 4;
    const xIdxSet = isDay
      ? new Set(
          axisData
            .map((d, i) => ({ i, at: new Date(d.t as number) }))
            .filter(({ at }) => at.getMinutes() === 0 && at.getHours() % everyHours === 0)
            .map(({ i }) => i)
        )
      : new Set(evenlySpacedIndices(axisData.length, Math.min(axisData.length, innerWidth < 260 ? 3 : 5)));
    const xTicks = axisData
      .map((d, i) => ({ index: i, x: i * stepX, label: d.label }))
      .filter((t) => xIdxSet.has(t.index));

    return {
      zeroY,
      solarArea,
      batDisArea: stackedBandPath(batDisPts, solarPts),
      gridImpArea: stackedBandPath(gridImpPts, batDisPts),
      batChgArea:
        d3Area<Pt>()
          .x((p) => p.x)
          .y0(zeroY)
          .y1((p) => p.y)
          .curve(curveMonotoneX)(batChgPts) || '',
      gridExpArea: stackedBandPath(gridExpPts, batChgPts),
      solarStroke: lineGen(solarPts) || '',
      batDisStroke: lineGen(batDisPts) || '',
      gridImpStroke: lineGen(gridImpPts) || '',
      batChgStroke: lineGen(batChgPts) || '',
      gridExpStroke: lineGen(gridExpPts) || '',
      homeStroke: lineGen(homePts) || '',
      homePts,
      yTicks: [...tickVals].reverse().map((val) => ({ val, y: valToY(val), label: tickLabel(val, tickStep) })),
      xTicks,
      isDay,
      anySolar: showSolar && drawn.some((d) => d.solar > 0.02),
      anyBatDis: showBattery && drawn.some((d) => d.batteryDischarge > 0.02),
      anyGridImp: showGrid && drawn.some((d) => d.gridImport > 0.02),
      anyBatChg: showBattery && drawn.some((d) => d.batteryCharge > 0.02),
      anyGridExp: showGrid && drawn.some((d) => d.gridExport > 0.02),
      stepX
    };
  }, [drawn, axisData, innerHeight, innerWidth, showSolar, showGrid, showBattery, showHome]);

  if (!computed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-3 text-xs text-muted',
          className
        )}
        style={{ height }}
      >
        <HugeiconsIcon icon={ChartLineData01Icon} size={15} className="shrink-0" />
        <span>Waiting for Home Assistant power statistics…</span>
      </div>
    );
  }

  const hovered = activeIndex !== null ? axisData[activeIndex] : null;
  const activeDatum = hovered && !hovered.future ? hovered : null;
  const activeX = activeIndex !== null ? activeIndex * computed.stepX : 0;
  const activeLeftPct = ((marginLeft + activeX) / width) * 100;

  return (
    <div className={cn('flex min-w-0 w-full flex-col gap-2', className)} style={HA_ENERGY_COLORS}>
      <div className="min-w-0 w-full overflow-hidden">
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
          {activeDatum ? (
            <div
              className="pro-surface pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
              style={{ left: `${Math.max(20, Math.min(80, activeLeftPct))}%` }}
            >
              <span className="text-muted">{activeDatum.label}</span>
              <span className="font-mono font-bold text-foreground">
                {formatPower(activeDatum.home)}
              </span>
              {activeDatum.solar > 0.02 ? (
                <span className="font-mono text-[var(--ps-solar)]">PV {formatPower(activeDatum.solar)}</span>
              ) : null}
              {activeDatum.gridExport > 0.02 ? (
                <span className="font-mono text-[var(--ps-return)]">-{formatPower(activeDatum.gridExport)}</span>
              ) : activeDatum.gridImport > 0.02 ? (
                <span className="font-mono text-[var(--ps-grid)]">+{formatPower(activeDatum.gridImport)}</span>
              ) : null}
            </div>
          ) : null}

          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full overflow-visible">
            <defs>
              <linearGradient id={`ps-solar-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ps-solar)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--ps-solar)" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id={`ps-batd-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ps-battery)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--ps-battery)" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id={`ps-gridi-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ps-grid)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--ps-grid)" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id={`ps-batc-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ps-battery)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--ps-battery)" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id={`ps-gride-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ps-return)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--ps-return)" stopOpacity={0.55} />
              </linearGradient>
              <clipPath id={`ps-clip-${uid}`}>
                <motion.rect
                  x={0}
                  y={-8}
                  height={innerHeight + 16}
                  initial={{ width: 0 }}
                  animate={{ width: innerWidth + 8 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                />
              </clipPath>
            </defs>

            <g transform={`translate(${marginLeft},${marginTop})`}>
              {showAxes ? (
                <text x={0} y={-4} fill="var(--muted)" className="font-mono text-[9px]">
                  kW
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
                      {tick.label}
                    </text>
                  ) : null}
                </g>
              ))}

              <g clipPath={`url(#ps-clip-${uid})`}>
                {computed.anyBatChg ? <path d={computed.batChgArea} fill={`url(#ps-batc-${uid})`} /> : null}
                {computed.anyGridExp ? <path d={computed.gridExpArea} fill={`url(#ps-gride-${uid})`} /> : null}
                {computed.anySolar ? <path d={computed.solarArea} fill={`url(#ps-solar-${uid})`} /> : null}
                {computed.anyBatDis ? <path d={computed.batDisArea} fill={`url(#ps-batd-${uid})`} /> : null}
                {computed.anyGridImp ? <path d={computed.gridImpArea} fill={`url(#ps-gridi-${uid})`} /> : null}

                {computed.anySolar ? (
                  <path d={computed.solarStroke} fill="none" stroke="var(--ps-solar)" strokeWidth={1.6} />
                ) : null}
                {computed.anyBatDis ? (
                  <path d={computed.batDisStroke} fill="none" stroke="var(--ps-battery)" strokeWidth={1.6} />
                ) : null}
                {computed.anyGridImp ? (
                  <path d={computed.gridImpStroke} fill="none" stroke="var(--ps-grid)" strokeWidth={1.6} />
                ) : null}
                {computed.anyBatChg ? (
                  <path d={computed.batChgStroke} fill="none" stroke="var(--ps-battery)" strokeWidth={1.4} />
                ) : null}
                {computed.anyGridExp ? (
                  <path d={computed.gridExpStroke} fill="none" stroke="var(--ps-return)" strokeWidth={1.4} />
                ) : null}

                {showHome && computed.homeStroke ? (
                  <path
                    d={computed.homeStroke}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeOpacity={0.72}
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                  />
                ) : null}
              </g>

              {activeDatum && activeIndex !== null ? (
                <g>
                  <line
                    x1={activeX}
                    x2={activeX}
                    y1={0}
                    y2={innerHeight}
                    stroke="var(--accent)"
                    strokeOpacity={0.45}
                    strokeDasharray="3 3"
                    strokeWidth={1.25}
                  />
                  {showHome && computed.homePts[activeIndex] ? (
                    <circle
                      cx={activeX}
                      cy={computed.homePts[activeIndex].y}
                      r={4}
                      fill="var(--surface)"
                      stroke="var(--foreground)"
                      strokeWidth={2}
                    />
                  ) : null}
                </g>
              ) : null}

              {showAxes
                ? computed.xTicks.map((t) => (
                    <text
                      key={t.index}
                      x={t.x}
                      y={innerHeight + 15}
                      textAnchor={
                        t.index === 0 ? 'start' : t.index === axisData.length - 1 ? 'end' : 'middle'
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

      {showLegend ? (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            size="sm"
            variant={showSolar ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showSolar && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowSolar((v) => !v)}
          >
            <HugeiconsIcon icon={SolarPanel01Icon} size={11} className="text-[var(--ps-solar)]" />
            <span>Solar{liveWatts ? ` ${formatPower(liveWatts.solarKW)}` : ''}</span>
          </Button>
          <Button
            size="sm"
            variant={showGrid ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showGrid && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowGrid((v) => !v)}
          >
            <HugeiconsIcon icon={PlugSocketIcon} size={11} className="text-[var(--ps-grid)]" />
            <span>Grid{liveWatts ? ` ${formatPower(Math.abs(liveWatts.gridKW))}` : ''}</span>
          </Button>
          <Button
            size="sm"
            variant={showBattery ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showBattery && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowBattery((v) => !v)}
          >
            <HugeiconsIcon icon={BatteryCharging01Icon} size={11} className="text-[var(--ps-battery)]" />
            <span>Battery{liveWatts ? ` ${formatPower(Math.abs(liveWatts.batteryKW))}` : ''}</span>
          </Button>
          <Button
            size="sm"
            variant={showHome ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showHome && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowHome((v) => !v)}
          >
            <HugeiconsIcon icon={Home01Icon} size={11} className="text-foreground" />
            <span>Consumption{liveWatts ? ` ${formatPower(liveWatts.homeKW)}` : ''}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
