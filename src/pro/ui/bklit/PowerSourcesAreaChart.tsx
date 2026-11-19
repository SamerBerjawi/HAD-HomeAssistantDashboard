/**
 * Pro-UI PowerSourcesAreaChart: bklit UI AreaChart adapted for bidirectional power flow
 * inside a calm HeroUI soft surface well, using HeroUI semantic tokens (--warning Solar,
 * --success Battery, --accent Grid, dashed --foreground Consumption) and airy gradient depth.
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
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatPower } from '../../lib/pageSentences';
import { evenlySpacedIndices, useBklitChartBox } from './useBklitChartBox';

export interface PowerSourcesDatum {
  label: string;
  solar: number;
  batteryDischarge: number;
  gridImport: number;
  batteryCharge: number;
  gridExport: number;
  home: number;
}

interface PowerSourcesAreaChartProps {
  data: PowerSourcesDatum[];
  height?: number;
  showAxes?: boolean;
  showLegend?: boolean;
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
  className,
  ariaLabel = 'Power sources bidirectional chart'
}: PowerSourcesAreaChartProps) {
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
    itemCount: data.length,
    marginLeft,
    marginRight,
    defaultWidth: 260
  });

  const innerHeight = Math.max(44, height - marginTop - marginBottom);

  const computed = useMemo(() => {
    if (data.length === 0) return null;

    const maxPos = Math.max(
      0.5,
      ...data.map((d) => {
        const s = showSolar ? d.solar : 0;
        const bd = showBattery ? d.batteryDischarge : 0;
        const gi = showGrid ? d.gridImport : 0;
        const h = showHome ? d.home : 0;
        return Math.max(s + bd + gi, h);
      })
    );

    const maxNeg = Math.max(
      0,
      ...data.map((d) => (showBattery ? d.batteryCharge : 0) + (showGrid ? d.gridExport : 0))
    );

    const hasNeg = maxNeg > 0.04;
    const domainMax = maxPos * 1.12;
    const domainMin = hasNeg ? -maxNeg * 1.15 : 0;
    const span = Math.max(0.5, domainMax - domainMin);
    const valToY = (v: number) => innerHeight - ((v - domainMin) / span) * innerHeight;
    const zeroY = valToY(0);
    const stepX = data.length === 1 ? 0 : innerWidth / (data.length - 1);

    const solarPts: Pt[] = data.map((d, i) => ({
      x: i * stepX,
      y: valToY(showSolar ? d.solar : 0)
    }));
    const batDisPts: Pt[] = data.map((d, i) => ({
      x: i * stepX,
      y: valToY((showSolar ? d.solar : 0) + (showBattery ? d.batteryDischarge : 0))
    }));
    const gridImpPts: Pt[] = data.map((d, i) => ({
      x: i * stepX,
      y: valToY(
        (showSolar ? d.solar : 0) +
          (showBattery ? d.batteryDischarge : 0) +
          (showGrid ? d.gridImport : 0)
      )
    }));
    const batChgPts: Pt[] = data.map((d, i) => ({
      x: i * stepX,
      y: valToY(-(showBattery ? d.batteryCharge : 0))
    }));
    const gridExpPts: Pt[] = data.map((d, i) => ({
      x: i * stepX,
      y: valToY(-((showBattery ? d.batteryCharge : 0) + (showGrid ? d.gridExport : 0)))
    }));
    const homePts: Pt[] = data.map((d, i) => ({
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

    const yTicks = hasNeg ? [domainMax, domainMax / 2, 0, domainMin] : [domainMax, domainMax / 2, 0];
    const xCount = Math.min(data.length, innerWidth < 260 ? 3 : 5);
    const xIdxSet = new Set(evenlySpacedIndices(data.length, xCount));
    const xTicks = data
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
      yTicks: yTicks.map((val) => ({ val, y: valToY(val) })),
      xTicks,
      anySolar: showSolar && data.some((d) => d.solar > 0.02),
      anyBatDis: showBattery && data.some((d) => d.batteryDischarge > 0.02),
      anyGridImp: showGrid && data.some((d) => d.gridImport > 0.02),
      anyBatChg: showBattery && data.some((d) => d.batteryCharge > 0.02),
      anyGridExp: showGrid && data.some((d) => d.gridExport > 0.02),
      stepX
    };
  }, [data, innerHeight, innerWidth, showSolar, showGrid, showBattery, showHome]);

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

  const activeDatum = activeIndex !== null ? data[activeIndex] : null;
  const activeX = activeIndex !== null ? activeIndex * computed.stepX : 0;
  const activeLeftPct = ((marginLeft + activeX) / width) * 100;

  return (
    <div className={cn('flex min-w-0 w-full flex-col gap-2', className)}>
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
                <span className="font-mono text-warning">PV {formatPower(activeDatum.solar)}</span>
              ) : null}
              {activeDatum.gridExport > 0.02 ? (
                <span className="font-mono text-indigo-400">-{formatPower(activeDatum.gridExport)}</span>
              ) : activeDatum.gridImport > 0.02 ? (
                <span className="font-mono text-[var(--accent)]">+{formatPower(activeDatum.gridImport)}</span>
              ) : null}
            </div>
          ) : null}

          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full overflow-visible">
            <defs>
              <linearGradient id={`ps-solar-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.42} />
                <stop offset="100%" stopColor="var(--warning)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id={`ps-batd-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity={0.38} />
                <stop offset="100%" stopColor="var(--success)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id={`ps-gridi-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.38} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id={`ps-batc-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity={0.04} />
                <stop offset="100%" stopColor="var(--success)" stopOpacity={0.38} />
              </linearGradient>
              <linearGradient id={`ps-gride-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.4} />
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
                    strokeOpacity={Math.abs(tick.val) < 0.01 ? 0.65 : 0.35}
                    strokeDasharray={Math.abs(tick.val) < 0.01 ? undefined : '3 4'}
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
                      {Math.abs(tick.val) < 0.05 ? '0' : tick.val.toFixed(1)}
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
                  <path d={computed.solarStroke} fill="none" stroke="var(--warning)" strokeWidth={1.6} />
                ) : null}
                {computed.anyBatDis ? (
                  <path d={computed.batDisStroke} fill="none" stroke="var(--success)" strokeWidth={1.6} />
                ) : null}
                {computed.anyGridImp ? (
                  <path d={computed.gridImpStroke} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
                ) : null}
                {computed.anyBatChg ? (
                  <path d={computed.batChgStroke} fill="none" stroke="var(--success)" strokeOpacity={0.75} strokeWidth={1.4} />
                ) : null}
                {computed.anyGridExp ? (
                  <path d={computed.gridExpStroke} fill="none" stroke="#818cf8" strokeWidth={1.4} />
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

      {showLegend ? (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            size="sm"
            variant={showSolar ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showSolar && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowSolar((v) => !v)}
          >
            <HugeiconsIcon icon={SolarPanel01Icon} size={11} className="text-warning" />
            <span>Solar{liveWatts ? ` ${formatPower(liveWatts.solarKW)}` : ''}</span>
          </Button>
          <Button
            size="sm"
            variant={showGrid ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showGrid && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowGrid((v) => !v)}
          >
            <HugeiconsIcon icon={PlugSocketIcon} size={11} className="text-[var(--accent)]" />
            <span>Grid{liveWatts ? ` ${formatPower(Math.abs(liveWatts.gridKW))}` : ''}</span>
          </Button>
          <Button
            size="sm"
            variant={showBattery ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[11px] font-medium', !showBattery && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowBattery((v) => !v)}
          >
            <HugeiconsIcon icon={BatteryCharging01Icon} size={11} className="text-success" />
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
