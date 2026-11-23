/**
 * Section 4 — Usage over time (Power default + Energy toggle):
 * A · Power Wave & Mix (PowerSourcesAreaChart default + SmoothTab Energy switch + mix legend)
 * B · Daylight Skyscape (custom SVG dawn-to-dusk solar sky dome + dashed consumption overlay)
 * C · Intensity Heat-Band + Bars (slot-by-slot solar/export/import heat strip above BidirectionalBarChart)
 */
import { useState } from 'react';
import { Chip, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Activity01Icon,
  ChartBarIncreasingIcon,
  ChartLineData01Icon,
  FlashIcon,
  SolarPanel01Icon,
  Sun01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../../lib/overviewEnergy';
import { BidirectionalBarChart } from '../../../../ui/bklit/BidirectionalBarChart';
import { PowerSourcesAreaChart } from '../../../../ui/bklit/PowerSourcesAreaChart';
import { SmoothTab } from '../../../../ui/kokonutui/SmoothTab';
import { fmtKw, fmtKwh } from '../energyParts';
import type { SectionConceptProps } from './types';

type UsageMode = 'power' | 'energy';

function ModeTabs({
  mode,
  setMode,
  showPower
}: {
  mode: UsageMode;
  setMode: (m: UsageMode) => void;
  showPower: boolean;
}) {
  if (!showPower) return null;
  return (
    <SmoothTab
      items={[
        { id: 'power', title: 'Power (kW)', icon: Activity01Icon },
        { id: 'energy', title: 'Energy (kWh)', icon: ChartBarIncreasingIcon }
      ]}
      value={mode}
      onChange={(id) => setMode(id as UsageMode)}
      label="Chart mode"
    />
  );
}

/** 4A · Power Wave & Mix */
export function UsageA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const hasPower = snap.period === 'day' && m.powerSourcesSeries.length > 0;
  const [mode, setMode] = useState<UsageMode>('power');
  const effective: UsageMode = hasPower ? mode : 'energy';
  const liveNow = m.powerSourcesSeries.filter((p) => !p.future);
  const peakHomeKW = liveNow.length ? Math.max(...liveNow.map((p) => p.home)) : m.homeKW;

  return (
    <section aria-label="Usage wave and mix" className="pro-surface flex flex-col gap-3.5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <HugeiconsIcon icon={ChartLineData01Icon} size={16} className="text-[var(--accent)]" />
            Usage over time
          </h3>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {fmtKwh(m.homeKwh)} total · peak {fmtKw(peakHomeKW)} · {m.periodAutarkyPct}% clean
          </p>
        </div>
        <ModeTabs mode={effective} setMode={setMode} showPower={hasPower} />
      </header>

      {effective === 'power' ? (
        <PowerSourcesAreaChart
          data={m.powerSourcesSeries}
          height={compact ? 195 : 240}
          liveWatts={{ solarKW: m.solarKW, gridKW: m.gridKW, batteryKW: m.batteryKW, homeKW: m.homeKW }}
        />
      ) : (
        <BidirectionalBarChart data={m.electricitySeries} height={compact ? 195 : 240} />
      )}
    </section>
  );
}

function SkyscapeSvg({ m }: { m: ProOverviewEnergyModel }) {
  const pts = m.powerSourcesSeries.filter((p) => !p.future);
  if (pts.length < 2) return null;
  const w = 360;
  const h = 132;
  const padX = 8;
  const padY = 16;
  const maxVal = Math.max(0.4, ...pts.map((p) => Math.max(p.solar, p.home)));
  const xAt = (i: number) => padX + (i / (pts.length - 1)) * (w - padX * 2);
  const yAt = (v: number) => h - padY - (v / maxVal) * (h - padY * 2);

  let peakIdx = 0;
  pts.forEach((p, idx) => {
    if (p.solar > pts[peakIdx].solar) peakIdx = idx;
  });

  const solarCoords = pts.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.solar).toFixed(1)}`).join(' ');
  const homeCoords = pts.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.home).toFixed(1)}`).join(' ');
  const peakLeftPct = (xAt(peakIdx) / w) * 100;
  const peakTopPct = (yAt(pts[peakIdx].solar) / h) * 100;
  const showPeak = pts[peakIdx].solar > 0.1;

  return (
    <div className="relative h-36 w-full" role="img" aria-label="Daylight solar dome versus home demand line">
      <svg viewBox={`0 0 ${w} ${h}`} className="size-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="pro-e-sky-solar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--energy-solar)" stopOpacity="0.52" />
            <stop offset="100%" stopColor="var(--energy-solar)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="var(--default)" strokeWidth="1" />
        <polygon points={`${xAt(0)},${h - padY} ${solarCoords} ${xAt(pts.length - 1)},${h - padY}`} fill="url(#pro-e-sky-solar)" />
        <polyline points={solarCoords} fill="none" stroke="var(--energy-solar)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline
          points={homeCoords}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          strokeOpacity="0.82"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {showPeak ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${peakLeftPct}%`, top: `${peakTopPct}%` }}
        >
          <span className="block size-2.5 rounded-full bg-[var(--energy-solar)] ring-2 ring-[var(--surface)]" />
          <span
            className="mt-1 inline-block whitespace-nowrap rounded-full bg-[var(--surface)]/95 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-2xs ring-1 ring-black/5 dark:ring-white/10"
            style={{
              transform:
                peakLeftPct < 20 ? 'translateX(35%)' : peakLeftPct > 80 ? 'translateX(-35%)' : undefined
            }}
          >
            Peak {pts[peakIdx].solar.toFixed(1)} kW ({pts[peakIdx].label})
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** 4B · Daylight Skyscape */
export function UsageB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const hasPower = snap.period === 'day' && m.powerSourcesSeries.length > 0;
  const [mode, setMode] = useState<UsageMode>('power');
  const effective: UsageMode = hasPower ? mode : 'energy';

  return (
    <section
      aria-label="Daylight skyscape usage"
      className="pro-eb flex flex-col gap-3 p-4"
      style={{ ['--eb-tint' as string]: '245, 168, 56' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-[var(--energy-solar)]">
            <HugeiconsIcon icon={Sun01Icon} size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Daylight & Load Curve</h3>
            <p className="text-xs text-muted tabular-nums">
              {m.periodAutarkyPct}% self-powered · solar fill vs dashed home draw
            </p>
          </div>
        </div>
        {hasPower ? (
          <ToggleButtonGroup
            aria-label="Skyscape mode"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([effective])}
            onSelectionChange={(keys) => {
              const hit = [...keys][0] as UsageMode | undefined;
              if (hit) setMode(hit);
            }}
          >
            <ToggleButton id="power" className="gap-1 text-xs">
              <HugeiconsIcon icon={Sun01Icon} size={13} />
              Skyline
            </ToggleButton>
            <ToggleButton id="energy" className="gap-1 text-xs">
              <HugeiconsIcon icon={ChartBarIncreasingIcon} size={13} />
              Buckets
            </ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </header>

      {effective === 'power' ? (
        <div className="rounded-2xl bg-[var(--background)]/45 p-3">
          <SkyscapeSvg m={m} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-sm bg-[var(--energy-solar)]/75" />
              Solar curve ({m.peakSolarKWText} peak)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-dashed border-foreground/80" />
              Home load ({m.homeKwhText})
            </span>
          </div>
        </div>
      ) : (
        <BidirectionalBarChart data={m.electricitySeries} height={compact ? 185 : 225} />
      )}
    </section>
  );
}

/** 4C · Intensity Heat-Band + Bars */
export function UsageC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const hasPower = snap.period === 'day' && m.powerSourcesSeries.length > 0;
  const [mode, setMode] = useState<UsageMode>('power');
  const effective: UsageMode = hasPower ? mode : 'energy';
  const slots = m.electricitySeries;

  const slotColor = (d: (typeof slots)[number]) => {
    if (d.gridExport > 0.15) return 'var(--success)';
    if (d.solar + d.batteryDischarge > d.gridImport) return 'var(--energy-solar)';
    return 'var(--energy-grid)';
  };

  return (
    <section aria-label="Usage intensity heat-band" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <HugeiconsIcon icon={FlashIcon} size={16} className="text-[var(--accent)]" />
            Energy cadence
          </span>
          {snap.compareEnabled && snap.comparison ? (
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>vs {snap.comparison.year}: {snap.comparison.prevUsedKwh.toFixed(1)} kWh</Chip.Label>
            </Chip>
          ) : null}
        </div>
        <ModeTabs mode={effective} setMode={setMode} showPower={hasPower} />
      </header>

      {/* Heat-band ribbon */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Balance strip ({slots.length} slots)</span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-[var(--success)]" /> Export
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-[var(--energy-solar)]" /> Solar
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-[var(--energy-grid)]" /> Grid
            </span>
          </span>
        </div>
        <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-lg bg-default/60 p-0.5" role="img" aria-label="Slot-by-slot solar, export, and grid balance ribbon">
          {slots.map((d) => (
            <span
              key={d.label}
              title={`${d.label}: Solar ${d.solar.toFixed(1)} / Grid ${d.gridImport.toFixed(1)} kWh`}
              className="h-full flex-1 rounded-[3px]"
              style={{ background: slotColor(d) }}
            />
          ))}
        </div>
      </div>

      {effective === 'power' ? (
        <PowerSourcesAreaChart
          data={m.powerSourcesSeries}
          height={compact ? 175 : 210}
          liveWatts={{ solarKW: m.solarKW, gridKW: m.gridKW, batteryKW: m.batteryKW, homeKW: m.homeKW }}
        />
      ) : (
        <BidirectionalBarChart data={m.electricitySeries} height={compact ? 175 : 210} />
      )}

      {snap.compareEnabled && snap.comparison ? (
        <p className="flex items-center gap-1.5 text-xs text-muted tabular-nums">
          <HugeiconsIcon icon={SolarPanel01Icon} size={13} className="text-[var(--energy-solar)]" />
          Solar last year ({snap.comparison.year}): {fmtKwh(snap.comparison.prevSolarKwh)} · Now {fmtKwh(m.solarKwh)}
        </p>
      ) : null}
    </section>
  );
}
