/**
 * Pro-UI BidirectionalBarChart: bklit UI BarChart adapted for Home Assistant's bidirectional
 * Electricity breakdown inside a calm HeroUI soft surface well, using smooth borderless rounded
 * tonal bars (--warning Solar, --success Bat discharge, --accent Grid import, indigo return).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  BatteryCharging01Icon,
  BatteryFullIcon,
  ChartBarIncreasingIcon,
  SolarPanel01Icon
} from '@hugeicons/core-free-icons';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { evenlySpacedIndices, useBklitChartBox } from './useBklitChartBox';

export interface ElectricityBarDatum {
  label: string;
  solar: number;
  batteryDischarge: number;
  gridImport: number;
  batteryCharge: number;
  gridExport: number;
}

interface BidirectionalBarChartProps {
  data: ElectricityBarDatum[];
  height?: number;
  showAxes?: boolean;
  showLegend?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function BidirectionalBarChart({
  data,
  height = 148,
  showAxes = true,
  showLegend = true,
  className,
  ariaLabel = 'Electricity stacked bidirectional bar chart'
}: BidirectionalBarChartProps) {
  const [showSolar, setShowSolar] = useState(true);
  const [showBatDis, setShowBatDis] = useState(true);
  const [showGridImp, setShowGridImp] = useState(true);
  const [showBatChg, setShowBatChg] = useState(true);
  const [showGridExp, setShowGridExp] = useState(true);

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

  const innerHeight = Math.max(44, height - marginTop - marginBottom);

  const computed = useMemo(() => {
    if (data.length === 0) return null;

    const maxPos = Math.max(
      0.3,
      ...data.map(
        (d) =>
          (showSolar ? d.solar : 0) +
          (showBatDis ? d.batteryDischarge : 0) +
          (showGridImp ? d.gridImport : 0)
      )
    );
    const maxNeg = Math.max(
      0,
      ...data.map((d) => (showBatChg ? d.batteryCharge : 0) + (showGridExp ? d.gridExport : 0))
    );

    const hasNeg = maxNeg > 0.02;
    const domainMax = maxPos * 1.12;
    const domainMin = hasNeg ? -maxNeg * 1.15 : 0;
    const span = Math.max(0.4, domainMax - domainMin);
    const valToY = (v: number) => innerHeight - ((v - domainMin) / span) * innerHeight;
    const zeroY = valToY(0);

    const slotW = innerWidth / data.length;
    const barW = Math.max(3, slotW * 0.64);
    const gapX = (slotW - barW) / 2;

    const bars = data.map((d, index) => {
      const s = showSolar ? d.solar : 0;
      const bd = showBatDis ? d.batteryDischarge : 0;
      const gi = showGridImp ? d.gridImport : 0;
      const posTotal = s + bd + gi;

      const bc = showBatChg ? d.batteryCharge : 0;
      const ge = showGridExp ? d.gridExport : 0;
      const negTotal = bc + ge;

      const x = index * slotW + gapX;
      const centerX = index * slotW + slotW / 2;

      const hS = (s / span) * innerHeight;
      const hBd = (bd / span) * innerHeight;
      const hGi = (gi / span) * innerHeight;
      const hPos = posTotal > 0 ? Math.max(2, hS + hBd + hGi) : 0;

      const hBc = (bc / span) * innerHeight;
      const hGe = (ge / span) * innerHeight;
      const hNeg = negTotal > 0 ? Math.max(2, hBc + hGe) : 0;

      return {
        index,
        x,
        centerX,
        barW,
        posTotal,
        negTotal,
        hS,
        hBd,
        hGi,
        hPos,
        hBc,
        hGe,
        hNeg,
        datum: d
      };
    });

    const yTicks = hasNeg ? [domainMax, domainMax / 2, 0, domainMin] : [domainMax, domainMax / 2, 0];
    const xCount = Math.min(data.length, innerWidth < 260 ? 3 : 5);
    const xIdxSet = new Set(evenlySpacedIndices(data.length, xCount));
    const xTicks = bars.filter((b) => xIdxSet.has(b.index)).map((b) => ({
      index: b.index,
      x: b.centerX,
      label: b.datum.label
    }));

    return { zeroY, bars, yTicks: yTicks.map((val) => ({ val, y: valToY(val) })), xTicks };
  }, [
    data,
    innerHeight,
    innerWidth,
    showSolar,
    showBatDis,
    showGridImp,
    showBatChg,
    showGridExp
  ]);

  if (!computed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-3 text-xs text-muted',
          className
        )}
        style={{ height }}
      >
        <HugeiconsIcon icon={ChartBarIncreasingIcon} size={15} className="shrink-0" />
        <span>Waiting for Home Assistant hourly statistics…</span>
      </div>
    );
  }

  const activeBar = activeIndex !== null ? computed.bars[activeIndex] : null;
  const activeLeftPct = activeBar ? ((marginLeft + activeBar.centerX) / width) * 100 : 50;

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
          {activeBar ? (
            <div
              className="pro-surface pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
              style={{ left: `${Math.max(20, Math.min(80, activeLeftPct))}%` }}
            >
              <span className="text-muted">{activeBar.datum.label}</span>
              <span className="font-mono font-bold text-foreground">
                {activeBar.posTotal.toFixed(2)} kWh
              </span>
              {activeBar.negTotal > 0.01 ? (
                <span className="font-mono text-[var(--energy-export)]">-{activeBar.negTotal.toFixed(2)} kWh</span>
              ) : null}
            </div>
          ) : null}

          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full overflow-visible">
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
                      {Math.abs(tick.val) < 0.04 ? '0' : tick.val.toFixed(1)}
                    </text>
                  ) : null}
                </g>
              ))}

              {computed.bars.map((bar) => {
                const rx = Math.min(4, bar.barW / 2);
                const isDimmed = activeBar !== null && activeBar.index !== bar.index;
                return (
                  <g key={bar.index} opacity={isDimmed ? 0.35 : 0.9} className="transition-opacity duration-150">
                    {bar.hPos > 0 ? (
                      <g>
                        <clipPath id={`el-pos-${uid}-${bar.index}`}>
                          <rect
                            x={bar.x}
                            y={computed.zeroY - bar.hPos}
                            width={bar.barW}
                            height={bar.hPos}
                            rx={rx}
                          />
                        </clipPath>
                        <g clipPath={`url(#el-pos-${uid}-${bar.index})`}>
                          {bar.hS > 0.2 ? (
                            <rect
                              x={bar.x}
                              y={computed.zeroY - bar.hS}
                              width={bar.barW}
                              height={bar.hS}
                              fill="var(--warning)"
                            />
                          ) : null}
                          {bar.hBd > 0.2 ? (
                            <rect
                              x={bar.x}
                              y={computed.zeroY - bar.hS - bar.hBd}
                              width={bar.barW}
                              height={bar.hBd}
                              fill="var(--success)"
                            />
                          ) : null}
                          {bar.hGi > 0.2 ? (
                            <rect
                              x={bar.x}
                              y={computed.zeroY - bar.hS - bar.hBd - bar.hGi}
                              width={bar.barW}
                              height={bar.hGi}
                              fill="var(--accent)"
                            />
                          ) : null}
                        </g>
                      </g>
                    ) : null}

                    {bar.hNeg > 0 ? (
                      <g>
                        <clipPath id={`el-neg-${uid}-${bar.index}`}>
                          <rect
                            x={bar.x}
                            y={computed.zeroY}
                            width={bar.barW}
                            height={bar.hNeg}
                            rx={rx}
                          />
                        </clipPath>
                        <g clipPath={`url(#el-neg-${uid}-${bar.index})`}>
                          {bar.hBc > 0.2 ? (
                            <rect
                              x={bar.x}
                              y={computed.zeroY}
                              width={bar.barW}
                              height={bar.hBc}
                              fill="var(--success)"
                              fillOpacity={0.65}
                            />
                          ) : null}
                          {bar.hGe > 0.2 ? (
                            <rect
                              x={bar.x}
                              y={computed.zeroY + bar.hBc}
                              width={bar.barW}
                              height={bar.hGe}
                              fill="var(--energy-export)"
                            />
                          ) : null}
                        </g>
                      </g>
                    ) : null}
                  </g>
                );
              })}

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
            className={cn('h-6 gap-1 rounded-full px-2 text-[10px] font-medium', !showSolar && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowSolar((v) => !v)}
          >
            <HugeiconsIcon icon={SolarPanel01Icon} size={11} className="text-warning" />
            <span>Solar</span>
          </Button>
          <Button
            size="sm"
            variant={showBatDis ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[10px] font-medium', !showBatDis && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowBatDis((v) => !v)}
          >
            <HugeiconsIcon icon={BatteryFullIcon} size={11} className="text-success" />
            <span>Bat discharge</span>
          </Button>
          <Button
            size="sm"
            variant={showGridImp ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[10px] font-medium', !showGridImp && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowGridImp((v) => !v)}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={11} className="text-[var(--accent)]" />
            <span>Import</span>
          </Button>
          <Button
            size="sm"
            variant={showBatChg ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[10px] font-medium', !showBatChg && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowBatChg((v) => !v)}
          >
            <HugeiconsIcon icon={BatteryCharging01Icon} size={11} className="text-success" />
            <span>Bat charge</span>
          </Button>
          <Button
            size="sm"
            variant={showGridExp ? 'tertiary' : 'ghost'}
            className={cn('h-6 gap-1 rounded-full px-2 text-[10px] font-medium', !showGridExp && 'opacity-50')}
            onClick={(e) => e.stopPropagation()}
            onPress={() => setShowGridExp((v) => !v)}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={11} className="text-[var(--energy-export)]" />
            <span>Export</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
