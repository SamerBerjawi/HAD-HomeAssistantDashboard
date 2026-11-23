/**
 * Section 10 — Gas & water utilities:
 * A · Paired Meter Cards (distinct Gas Flame violet card + Water Droplet aqua card with mini BarCharts)
 * B · Unified Dual-Track Canvas (single cohesive surface pairing Gas + Water smooth AreaCharts + YoY pills)
 * C · Compact Utility Switcher (space-saving SmoothTab toggle between Gas & Water with YoY comparison bars)
 */
import { useState } from 'react';
import { Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DropletIcon, Fire02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AreaChart } from '../../../../ui/bklit/AreaChart';
import { BarChart } from '../../../../ui/bklit/BarChart';
import { SmoothTab } from '../../../../ui/kokonutui/SmoothTab';
import { deltaBadge, fmtMoney } from '../energyParts';
import { NoSectionData } from './conceptHelpers';
import type { SectionConceptProps } from './types';

function deltaPct(curr: number, prev: number): number | null {
  if (prev <= 0.01) return null;
  return ((curr - prev) / prev) * 100;
}

/** 10A · Paired Meter Cards */
export function UtilitiesA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  if (!snap.hasGas && !snap.hasWater) {
    return <NoSectionData icon={DropletIcon} title="Gas & water" note="No auxiliary gas or water meters in this state." />;
  }

  const both = snap.hasGas && snap.hasWater;
  const gasPrev = snap.gasSeries.reduce((s, p) => s + p.prevValue, 0);
  const waterPrev = snap.waterSeries.reduce((s, p) => s + p.prevValue, 0);
  const gasDelta = snap.compareEnabled ? deltaPct(snap.gasTotal, gasPrev) : null;
  const waterDelta = snap.compareEnabled ? deltaPct(snap.waterTotal, waterPrev) : null;

  return (
    <section
      aria-label="Paired gas and water meters"
      className={cn('grid gap-3', !compact && both ? 'grid-cols-2' : 'grid-cols-1')}
    >
      {snap.hasGas ? (
        <article className="pro-surface flex flex-col gap-2.5 p-4">
          <header className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2.5">
              <span
                className="grid size-8 place-items-center rounded-xl"
                style={{
                  background: 'color-mix(in oklab, var(--energy-gas) 16%, transparent)',
                  color: 'var(--energy-gas)'
                }}
              >
                <HugeiconsIcon icon={Fire02Icon} size={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold">Gas meter</span>
                <span className="block text-xs text-muted tabular-nums">
                  {snap.gasTotal.toFixed(1)} {snap.gasUnit} · {fmtMoney(snap.gasCost, m.currency)}
                </span>
              </span>
            </span>
            {gasDelta !== null ? (
              <Chip size="sm" variant="soft" color={deltaBadge(gasDelta, true).tone}>
                <Chip.Label>{deltaBadge(gasDelta, true).text}</Chip.Label>
              </Chip>
            ) : null}
          </header>

          <BarChart
            data={snap.gasSeries.map((p) => ({
              label: p.label,
              value: p.value,
              secondaryValue: snap.compareEnabled ? p.prevValue : undefined
            }))}
            height={130}
            accentColor="var(--energy-gas)"
            secondaryColor="var(--default)"
            formatValue={(v) => `${v.toFixed(2)} ${snap.gasUnit}`}
          />
        </article>
      ) : null}

      {snap.hasWater ? (
        <article className="pro-surface flex flex-col gap-2.5 p-4">
          <header className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2.5">
              <span
                className="grid size-8 place-items-center rounded-xl"
                style={{
                  background: 'color-mix(in oklab, var(--energy-water) 16%, transparent)',
                  color: 'var(--energy-water)'
                }}
              >
                <HugeiconsIcon icon={DropletIcon} size={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold">Water meter</span>
                <span className="block text-xs text-muted tabular-nums">
                  {Math.round(snap.waterTotal)} {snap.waterUnit} · {fmtMoney(snap.waterCost, m.currency)}
                </span>
              </span>
            </span>
            {waterDelta !== null ? (
              <Chip size="sm" variant="soft" color={deltaBadge(waterDelta, true).tone}>
                <Chip.Label>{deltaBadge(waterDelta, true).text}</Chip.Label>
              </Chip>
            ) : null}
          </header>

          <BarChart
            data={snap.waterSeries.map((p) => ({
              label: p.label,
              value: p.value,
              secondaryValue: snap.compareEnabled ? p.prevValue : undefined
            }))}
            height={130}
            accentColor="var(--energy-water)"
            secondaryColor="var(--default)"
            formatValue={(v) => `${Math.round(v)} ${snap.waterUnit}`}
          />
        </article>
      ) : null}
    </section>
  );
}

/** 10B · Unified Dual-Track Canvas */
export function UtilitiesB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  if (!snap.hasGas && !snap.hasWater) {
    return <NoSectionData icon={DropletIcon} title="Gas & water" note="No auxiliary gas or water meters in this state." />;
  }
  const both = snap.hasGas && snap.hasWater;

  return (
    <section
      aria-label="Unified gas and water trends"
      className="pro-eb flex flex-col gap-3 p-4"
      style={{ ['--eb-tint' as string]: '14, 165, 233' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={DropletIcon} size={16} style={{ color: 'var(--energy-water)' }} />
          Gas & water flow
        </span>
        <span className="text-xs text-muted tabular-nums">
          Combined bill {fmtMoney((snap.hasGas ? snap.gasCost : 0) + (snap.hasWater ? snap.waterCost : 0), m.currency)}
        </span>
      </header>

      <div className={cn('grid gap-4', !compact && both ? 'grid-cols-2' : 'grid-cols-1')}>
        {snap.hasGas ? (
          <div className="rounded-2xl bg-[var(--background)]/45 p-3">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--energy-gas)' }}>
                <HugeiconsIcon icon={Fire02Icon} size={14} />
                Gas
              </span>
              <span className="font-bold tabular-nums">
                {snap.gasTotal.toFixed(1)} {snap.gasUnit}
              </span>
            </div>
            <AreaChart
              data={snap.gasSeries.map((p) => ({ label: p.label, value: p.value }))}
              height={120}
              accentColor="var(--energy-gas)"
              formatValue={(v) => `${v.toFixed(2)} ${snap.gasUnit}`}
              showValueLabels={false}
            />
          </div>
        ) : null}

        {snap.hasWater ? (
          <div className="rounded-2xl bg-[var(--background)]/45 p-3">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--energy-water)' }}>
                <HugeiconsIcon icon={DropletIcon} size={14} />
                Water
              </span>
              <span className="font-bold tabular-nums">
                {Math.round(snap.waterTotal)} {snap.waterUnit}
              </span>
            </div>
            <AreaChart
              data={snap.waterSeries.map((p) => ({ label: p.label, value: p.value }))}
              height={120}
              accentColor="var(--energy-water)"
              formatValue={(v) => `${Math.round(v)} ${snap.waterUnit}`}
              showValueLabels={false}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** 10C · Compact Utility Switcher */
export function UtilitiesC({ snap }: SectionConceptProps) {
  const m = snap.model;
  const [kind, setKind] = useState<'gas' | 'water'>('gas');
  if (!snap.hasGas && !snap.hasWater) {
    return <NoSectionData icon={DropletIcon} title="Gas & water" note="No auxiliary gas or water meters in this state." />;
  }

  const active = kind === 'gas' && snap.hasGas ? 'gas' : snap.hasWater ? 'water' : 'gas';
  const isGas = active === 'gas';
  const total = isGas ? snap.gasTotal : snap.waterTotal;
  const series = isGas ? snap.gasSeries : snap.waterSeries;
  const prevTotal = series.reduce((s, p) => s + p.prevValue, 0);
  const ratioPct = prevTotal > 0 ? Math.min(140, Math.round((total / prevTotal) * 100)) : 100;

  return (
    <section aria-label="Compact utility switcher" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={isGas ? Fire02Icon : DropletIcon}
            size={18}
            style={{ color: isGas ? 'var(--energy-gas)' : 'var(--energy-water)' }}
          />
          <div>
            <span className="text-lg font-bold tabular-nums leading-none">
              {isGas ? `${snap.gasTotal.toFixed(1)} ${snap.gasUnit}` : `${Math.round(snap.waterTotal)} ${snap.waterUnit}`}
            </span>
            <span className="ml-2 text-xs text-muted tabular-nums">
              {fmtMoney(isGas ? snap.gasCost : snap.waterCost, m.currency)}
            </span>
          </div>
        </div>

        {snap.hasGas && snap.hasWater ? (
          <SmoothTab
            items={[
              { id: 'gas', title: 'Gas', icon: Fire02Icon },
              { id: 'water', title: 'Water', icon: DropletIcon }
            ]}
            value={active}
            onChange={(id) => setKind(id as 'gas' | 'water')}
            label="Utility selector"
          />
        ) : null}
      </header>

      <div className="flex flex-col gap-1 text-[11px] text-muted">
        <div className="flex justify-between tabular-nums">
          <span>vs last year pace</span>
          <span>{ratioPct}% of prior</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-default">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, ratioPct)}%`,
              background: isGas ? 'var(--energy-gas)' : 'var(--energy-water)'
            }}
          />
        </div>
      </div>

      <BarChart
        data={series.map((p) => ({
          label: p.label,
          value: p.value,
          secondaryValue: p.prevValue
        }))}
        height={135}
        accentColor={isGas ? 'var(--energy-gas)' : 'var(--energy-water)'}
        secondaryColor="var(--default)"
        formatValue={(v) => `${isGas ? v.toFixed(2) : Math.round(v)} ${isGas ? snap.gasUnit : snap.waterUnit}`}
      />
    </section>
  );
}
