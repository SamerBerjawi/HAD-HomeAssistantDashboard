/**
 * Section 9 — Costs & tariffs:
 * A · Tug-of-War Balance Scale (opposing Spend vs Export Credit bar + self-use savings badge)
 * B · Editorial Energy Statement (paperless utility-bill breakdown with Qt × Rate = Subtotal)
 * C · Cost-Over-Time Strip + Rate Cards (bklit BarChart of estimated slot spend + tariff rates)
 */
import { Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
  ChartBarIncreasingIcon,
  Coins01Icon,
  DropletIcon,
  FireIcon,
  Invoice01Icon,
  PlugSocketIcon,
  SolarPanel01Icon,
  SparklesIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { FinancialSourceBreakdown } from '@/services/energy/types';
import { BarChart } from '../../../../ui/bklit/BarChart';
import { deltaBadge, fmtKwh, fmtMoney } from '../energyParts';
import type { SectionConceptProps } from './types';

function sourceIcon(type: FinancialSourceBreakdown['type']): { icon: IconSvgElement; color: string } {
  if (type === 'grid_export') return { icon: SolarPanel01Icon, color: 'var(--energy-export)' };
  if (type === 'gas') return { icon: FireIcon, color: 'var(--energy-gas)' };
  if (type === 'water') return { icon: DropletIcon, color: 'var(--energy-water)' };
  return { icon: PlugSocketIcon, color: 'var(--energy-grid)' };
}

/** 9A · Tug-of-War Balance Scale */
export function CostsA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const grossSpend = Math.max(
    0.01,
    m.gridImportCost + (snap.hasGas ? snap.gasCost : 0) + (snap.hasWater ? snap.waterCost : 0) + snap.standingCharge
  );
  const credit = m.gridExportCompensation;
  const maxSide = Math.max(0.1, grossSpend, credit);
  const cmp = snap.comparison && snap.comparison.netCostDeltaPct !== 0 ? deltaBadge(snap.comparison.netCostDeltaPct, true) : null;
  const isCredit = m.netCost < -0.005;
  const avoided = Math.max(0, (m.solarToHomeKwh + m.batteryToHomeKwh) * 0.28);

  return (
    <section
      aria-label="Spent vs earned balance scale"
      className="pro-eb flex flex-col gap-3.5 p-4"
      style={{ ['--eb-tint' as string]: credit > grossSpend * 0.4 ? '34, 197, 94' : '245, 168, 56' }}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <HugeiconsIcon icon={Coins01Icon} size={14} className="text-[var(--accent)]" />
            Net period balance
          </p>
          <p className={cn('mt-0.5 text-3xl font-bold tracking-tight tabular-nums leading-none', isCredit && 'text-success')}>
            {fmtMoney(m.netCost, m.currency)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {avoided > 0.2 ? (
            <Chip size="sm" variant="soft" color="success">
              <HugeiconsIcon icon={SparklesIcon} size={12} />
              <Chip.Label>Saved ~{fmtMoney(avoided, m.currency)}</Chip.Label>
            </Chip>
          ) : null}
          {cmp ? (
            <Chip size="sm" variant="soft" color={cmp.tone}>
              <HugeiconsIcon icon={cmp.up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={12} />
              <Chip.Label>
                {cmp.text} vs {snap.compareYear}
              </Chip.Label>
            </Chip>
          ) : null}
        </div>
      </header>

      {/* Center-zero tug-of-war scale */}
      <div className="flex flex-col gap-1.5 rounded-2xl bg-[var(--background)]/45 p-3">
        <div className="flex justify-between text-[11px] font-medium tabular-nums">
          <span className="text-success">Earned {fmtMoney(credit, m.currency)}</span>
          <span className="text-foreground">Billed {fmtMoney(grossSpend, m.currency)}</span>
        </div>
        <div className="relative flex h-3.5 w-full items-center overflow-hidden rounded-full bg-default">
          <div className="flex h-full w-1/2 justify-end border-r-2 border-foreground/40">
            {credit > 0.01 ? (
              <span className="h-full rounded-l-full bg-[var(--success)]" style={{ width: `${(credit / maxSide) * 100}%` }} />
            ) : null}
          </div>
          <div className="flex h-full w-1/2 justify-start">
            <span className="h-full rounded-r-full bg-[var(--accent)]" style={{ width: `${(grossSpend / maxSide) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className={cn('grid gap-2 text-xs', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        {snap.financialSources.map((src) => {
          const meta = sourceIcon(src.type);
          const val = src.costOrCompensation ?? 0;
          return (
            <div key={src.name} className="flex items-center justify-between gap-2 rounded-xl bg-default/45 px-2.5 py-2">
              <span className="flex min-w-0 items-center gap-1.5 text-muted">
                <HugeiconsIcon icon={meta.icon} size={13} style={{ color: meta.color }} className="shrink-0" />
                <span className="truncate">{src.name}</span>
              </span>
              <span className={cn('shrink-0 font-semibold tabular-nums', val < 0 && 'text-success')}>
                {fmtMoney(val, m.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 9B · Editorial Energy Statement */
export function CostsB({ snap }: SectionConceptProps) {
  const m = snap.model;
  const isCredit = m.netCost < -0.005;

  return (
    <section aria-label="Energy billing statement" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2 border-b border-dashed border-[color-mix(in_oklab,var(--foreground)_14%,transparent)] pb-3">
        <div className="flex items-center gap-2">
          <span className="pro-soft grid size-8 place-items-center rounded-xl">
            <HugeiconsIcon icon={Invoice01Icon} size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Utility statement</h3>
            <p className="text-xs text-muted">{snap.dateLabel}</p>
          </div>
        </div>
        <Chip size="sm" variant="soft" color={isCredit ? 'success' : 'default'}>
          <Chip.Label>{isCredit ? 'Account in credit' : 'Estimated total'}</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-xs">
        {snap.financialSources.map((src) => {
          const meta = sourceIcon(src.type);
          const val = src.costOrCompensation ?? 0;
          return (
            <div key={src.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <HugeiconsIcon icon={meta.icon} size={15} style={{ color: meta.color }} className="shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{src.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    {src.energyVal.toFixed(src.unit === 'L' ? 0 : 1)} {src.unit}
                    {src.rateDescription ? ` × ${src.rateDescription}` : ''}
                  </p>
                </div>
              </div>
              <span className={cn('shrink-0 font-mono text-sm font-semibold tabular-nums', val < 0 && 'text-success')}>
                {fmtMoney(val, m.currency)}
              </span>
            </div>
          );
        })}

        {snap.standingCharge > 0 ? (
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="font-medium text-muted">Fixed standing charge</span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {fmtMoney(snap.standingCharge, m.currency)}
            </span>
          </div>
        ) : null}
      </div>

      <footer className="flex items-baseline justify-between border-t-2 border-[color-mix(in_oklab,var(--foreground)_14%,transparent)] pt-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Net balance</span>
        <span className={cn('font-mono text-xl font-bold tabular-nums', isCredit && 'text-success')}>
          {fmtMoney(m.netCost, m.currency)}
        </span>
      </footer>
    </section>
  );
}

/** 9C · Cost-Over-Time Strip + Rate Cards */
export function CostsC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const importRate = m.gridImportKwh > 0.05 ? m.gridImportCost / m.gridImportKwh : 0.28;
  const exportRate = m.gridExportKwh > 0.05 ? m.gridExportCompensation / m.gridExportKwh : 0.09;

  const slotData = m.electricitySeries.map((slot) => ({
    label: slot.label,
    value: Math.max(0, slot.gridImport * importRate - slot.gridExport * exportRate),
    secondaryValue: slot.gridExport > 0.05 ? slot.gridExport * exportRate : undefined
  }));

  return (
    <section aria-label="Hourly spend timeline" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={ChartBarIncreasingIcon} size={16} className="text-[var(--accent)]" />
          <div>
            <h3 className="text-sm font-semibold">Cost timeline</h3>
            <p className="text-xs text-muted">Estimated slot spend (amber) vs feed-in credit (green)</p>
          </div>
        </div>
        <span className="font-mono text-base font-bold tabular-nums">
          {fmtMoney(m.netCost, m.currency)}
        </span>
      </header>

      <BarChart
        data={slotData}
        height={compact ? 125 : 145}
        accentColor="var(--accent)"
        secondaryColor="var(--success)"
        formatValue={(v) => fmtMoney(v, m.currency)}
        ariaLabel="Estimated electricity spend per period slot"
      />

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-default/45 p-2.5">
          <span className="block text-[11px] text-muted">Import avg</span>
          <span className="font-mono font-semibold tabular-nums">{fmtMoney(importRate, m.currency)}/kWh</span>
        </div>
        <div className="rounded-xl bg-default/45 p-2.5">
          <span className="block text-[11px] text-muted">Feed-in</span>
          <span className="font-mono font-semibold text-success tabular-nums">{fmtMoney(exportRate, m.currency)}/kWh</span>
        </div>
        <div className="rounded-xl bg-default/45 p-2.5">
          <span className="block text-[11px] text-muted">Solar covered</span>
          <span className="font-mono font-semibold tabular-nums">{fmtKwh(m.solarToHomeKwh)}</span>
        </div>
      </div>
    </section>
  );
}
