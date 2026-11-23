/**
 * Section 3 — Summary KPIs:
 * A · Asymmetric Bento Hero (large SVG Self-Sufficiency Halo Ring + 2×2 metric bento grid)
 * B · Dual Dial Dashboard (two bklit ArcGauges + GridBalanceBar + 4-stat footer strip)
 * C · Story Sentence & Source Ribbon (plain-English insight headline + proportional source bar + metrics)
 */
import { Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDownRight01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  BatteryFullIcon,
  Coins01Icon,
  DashboardSpeed01Icon,
  Home01Icon,
  PlugSocketIcon,
  SolarPanel01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ArcGauge, GridBalanceBar } from '../../../../ui/bklit/GaugeChart';
import { deltaBadge, fmtKwh, fmtMoney, fmtPct, type PillTone } from '../energyParts';
import type { SectionConceptProps } from './types';

interface KpiItem {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: IconSvgElement;
  color: string;
  delta?: { text: string; tone: PillTone; up: boolean };
}

function coreMetrics(snap: SectionConceptProps['snap']): KpiItem[] {
  const m = snap.model;
  const cmp = snap.compareEnabled ? snap.comparison : null;
  const gridNet = m.gridImportKwh - m.gridExportKwh;
  return [
    {
      id: 'used',
      label: 'Home used',
      value: fmtKwh(m.homeKwh),
      sub: `${m.solarToHomeKwh.toFixed(1)} solar · ${m.gridImportKwh.toFixed(1)} grid`,
      icon: Home01Icon,
      color: 'var(--accent)',
      delta: cmp ? deltaBadge(cmp.usedDeltaPct, true) : undefined
    },
    ...(m.hasSolar
      ? [
          {
            id: 'solar',
            label: 'Solar generated',
            value: fmtKwh(m.solarKwh),
            sub: `${m.selfConsumptionPct}% used at home`,
            icon: SolarPanel01Icon,
            color: 'var(--energy-solar)',
            delta: cmp ? deltaBadge(cmp.solarDeltaPct, false) : undefined
          }
        ]
      : []),
    {
      id: 'grid',
      label: gridNet < 0 ? 'Net grid export' : 'Net grid import',
      value: fmtKwh(Math.abs(gridNet)),
      sub: `In ${m.gridImportKwh.toFixed(1)} · Out ${m.gridExportKwh.toFixed(1)}`,
      icon: gridNet < 0 ? ArrowUp01Icon : PlugSocketIcon,
      color: gridNet < 0 ? 'var(--energy-export)' : 'var(--energy-grid)',
      delta: cmp ? deltaBadge(cmp.gridImportDeltaPct, true) : undefined
    },
    {
      id: 'cost',
      label: m.netCost < 0 ? 'Net credit' : 'Net cost',
      value: fmtMoney(m.netCost, m.currency),
      sub: m.netCost < 0 ? 'Earned more than spent' : 'Import minus export credit',
      icon: Coins01Icon,
      color: m.netCost < 0 ? 'var(--success)' : 'var(--accent)',
      delta: cmp ? deltaBadge(cmp.netCostDeltaPct, true) : undefined
    }
  ];
}

function HaloRing({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const len = (clamped / 100) * c;
  const color = clamped >= 65 ? 'var(--success)' : clamped >= 35 ? 'var(--energy-solar)' : 'var(--energy-grid)';

  return (
    <svg viewBox="0 0 120 120" className="size-32 shrink-0" role="img" aria-label={`${label}: ${clamped}%`}>
      <g transform="rotate(-90 60 60)">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--default)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${len} ${c}`}
        />
      </g>
      <text
        x="60"
        y="57"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="var(--foreground)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {clamped}%
      </text>
      <text x="60" y="73" textAnchor="middle" fontSize="9.5" fontWeight="500" fill="var(--muted)">
        {sub}
      </text>
    </svg>
  );
}

/** 3A · Asymmetric Bento Hero */
export function SummaryA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const metrics = coreMetrics(snap);
  const cmp = snap.compareEnabled ? snap.comparison : null;
  const cleanKwh = m.solarToHomeKwh + m.batteryToHomeKwh;

  return (
    <section
      aria-label="Summary asymmetric hero"
      className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-[270px_1fr]')}
    >
      <article className="pro-surface flex flex-col items-center justify-between gap-3 p-4 text-center">
        <div className="flex w-full items-center justify-between text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={DashboardSpeed01Icon} size={15} className="text-[var(--accent)]" />
            Self-sufficiency
          </span>
          {cmp ? (
            <Chip size="sm" variant="soft" color={cmp.selfSuffDeltaPts >= 0 ? 'success' : 'warning'}>
              <Chip.Label>
                {cmp.selfSuffDeltaPts >= 0 ? `+${cmp.selfSuffDeltaPts}` : cmp.selfSuffDeltaPts} pts
              </Chip.Label>
            </Chip>
          ) : null}
        </div>

        <HaloRing
          pct={m.hasSolar || m.hasBattery ? m.periodAutarkyPct : 0}
          label="Self-sufficiency"
          sub={m.hasSolar || m.hasBattery ? 'self-powered' : 'grid only'}
        />

        <p className="text-xs leading-relaxed text-muted">
          {m.hasSolar || m.hasBattery
            ? `${fmtKwh(cleanKwh)} of ${fmtKwh(m.homeKwh)} came from sun and battery.`
            : `All ${fmtKwh(m.homeKwh)} supplied from grid (${fmtMoney(m.netCost, m.currency)}).`}
        </p>
      </article>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((k) => (
          <article key={k.id} className="pro-surface flex min-w-0 flex-col justify-between gap-2 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-lg"
                style={{ background: `color-mix(in oklab, ${k.color} 16%, transparent)`, color: k.color }}
              >
                <HugeiconsIcon icon={k.icon} size={14} />
              </span>
              <span className="truncate">{k.label}</span>
            </span>
            <div>
              <p className="truncate text-xl font-bold tracking-tight tabular-nums">{k.value}</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                <span className="truncate text-[11px] text-muted">{k.sub}</span>
                {k.delta ? (
                  <Chip size="sm" variant="soft" color={k.delta.tone}>
                    <HugeiconsIcon icon={k.delta.up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={11} />
                    <Chip.Label>{k.delta.text}</Chip.Label>
                  </Chip>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 3B · Dual Dial Dashboard */
export function SummaryB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const metrics = coreMetrics(snap);
  const gridNet = m.gridImportKwh - m.gridExportKwh;

  return (
    <section aria-label="Dual dial summary dashboard" className="pro-surface @container flex flex-col gap-4 p-4">
      <div className={cn('grid grid-cols-1 items-center gap-4', !compact && '@[620px]:grid-cols-[175px_1fr_175px]')}>
        <ArcGauge
          mode={m.hasSolar || m.hasBattery ? 'percent' : 'bipolar'}
          value={m.hasSolar || m.hasBattery ? m.periodAutarkyPct : m.netGridRatio}
          centerText={m.hasSolar || m.hasBattery ? `${m.periodAutarkyPct}%` : fmtKwh(m.homeKwh)}
          label={m.hasSolar || m.hasBattery ? 'Self-powered' : 'Grid demand'}
          icon={DashboardSpeed01Icon}
          accentColor={m.periodAutarkyPct >= 60 ? 'var(--success)' : 'var(--energy-solar)'}
          className="w-full"
        />

        <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-default/45 p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-muted">Grid balance</span>
            <span className="text-sm font-bold tabular-nums">
              {gridNet < 0 ? `Net exporter (${fmtKwh(Math.abs(gridNet))})` : `Net importer (${fmtKwh(gridNet)})`}
            </span>
          </div>
          <GridBalanceBar importKwh={m.gridImportKwh} exportKwh={m.gridExportKwh} netKwh={gridNet} />
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <span className="block text-[11px] text-muted">Used at home</span>
              <span className="font-semibold tabular-nums">{fmtKwh(m.homeKwh)}</span>
            </div>
            <div className="text-right">
              <span className="block text-[11px] text-muted">{m.netCost < 0 ? 'Net credit' : 'Net cost'}</span>
              <span className={cn('font-semibold tabular-nums', m.netCost < 0 && 'text-success')}>
                {fmtMoney(m.netCost, m.currency)}
              </span>
            </div>
          </div>
        </div>

        <ArcGauge
          mode="percent"
          value={m.hasSolar ? m.selfConsumptionPct : 100}
          centerText={m.hasSolar ? `${m.selfConsumptionPct}%` : fmtMoney(m.netCost, m.currency)}
          label={m.hasSolar ? 'Solar self-use' : 'Grid billing'}
          icon={m.hasSolar ? SolarPanel01Icon : Coins01Icon}
          accentColor="var(--energy-solar)"
          className="w-full"
        />
      </div>

      <div
        className={cn(
          'grid grid-cols-2 gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-3 text-xs',
          !compact && '@[760px]:grid-cols-4'
        )}
      >
        {metrics.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-2 rounded-xl bg-default/40 px-2.5 py-2">
            <span className="flex min-w-0 items-center gap-1.5 text-muted">
              <HugeiconsIcon icon={k.icon} size={13} style={{ color: k.color }} className="shrink-0" />
              <span className="truncate">{k.label}</span>
            </span>
            <span className="font-bold tabular-nums">{k.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 3C · Story Sentence & Source Ribbon */
export function SummaryC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const home = Math.max(0.01, m.homeKwh);
  const solarDirectShare = Math.round((m.solarToHomeKwh / home) * 100);
  const batteryShare = Math.round((m.batteryToHomeKwh / home) * 100);
  const gridShare = Math.max(0, 100 - solarDirectShare - batteryShare);

  const ribbon = [
    { id: 'solar', label: 'Direct solar', pct: solarDirectShare, kwh: m.solarToHomeKwh, color: 'var(--energy-solar)', icon: SolarPanel01Icon },
    { id: 'battery', label: 'From battery', pct: batteryShare, kwh: m.batteryToHomeKwh, color: 'var(--energy-battery)', icon: BatteryFullIcon },
    { id: 'grid', label: 'Grid import', pct: gridShare, kwh: m.gridImportKwh, color: 'var(--energy-grid)', icon: PlugSocketIcon }
  ].filter((r) => r.pct > 0);

  return (
    <section aria-label="Energy story summary" className="pro-surface flex flex-col gap-3.5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="max-w-2xl">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <HugeiconsIcon icon={Home01Icon} size={14} className="text-[var(--accent)]" />
            {snap.dateLabel} · Energy Mix Story
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
            {m.hasSolar
              ? `Your home used ${fmtKwh(m.homeKwh)} — solar covered ${fmtPct(solarDirectShare)}${batteryShare > 0 ? `, battery added ${fmtPct(batteryShare)}` : ''}${m.netCost < 0 ? `, earning a ${fmtMoney(m.netCost, m.currency).replace('-', '')} net credit` : ` at ${fmtMoney(m.netCost, m.currency)} net cost`}.`
              : `Your home used ${fmtKwh(m.homeKwh)} supplied from the grid for ${fmtMoney(m.netCost, m.currency)}.`}
          </h3>
        </div>
        <Chip size="sm" variant="soft" color={m.periodAutarkyPct >= 60 ? 'success' : 'warning'}>
          <HugeiconsIcon icon={DashboardSpeed01Icon} size={12} />
          <Chip.Label>{fmtPct(m.periodAutarkyPct)} self-sufficient</Chip.Label>
        </Chip>
      </div>

      {/* Bold source proportional ribbon */}
      <div
        className="flex h-7 w-full gap-0.5 overflow-hidden rounded-xl bg-default p-0.5"
        role="img"
        aria-label="Home electricity supply mix"
      >
        {ribbon.map((seg) => (
          <div
            key={seg.id}
            className="flex h-full items-center justify-center overflow-hidden rounded-lg px-2 text-[11px] font-semibold text-white"
            style={{ width: `${seg.pct}%`, background: seg.color }}
          >
            {seg.pct >= 30 ? `${seg.label} ${seg.pct}%` : seg.pct >= 16 ? `${seg.pct}%` : ''}
          </div>
        ))}
      </div>

      <div className={cn('grid gap-2 text-xs', compact ? 'grid-cols-2' : 'grid-cols-4')}>
        {ribbon.map((seg) => (
          <div key={seg.id} className="flex items-center justify-between rounded-xl bg-default/50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-muted">
              <HugeiconsIcon icon={seg.icon} size={13} style={{ color: seg.color }} />
              {seg.label}
            </span>
            <span className="font-bold tabular-nums">{fmtKwh(seg.kwh)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-default/50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-muted">
            <HugeiconsIcon icon={Coins01Icon} size={13} className="text-[var(--accent)]" />
            Net bill
          </span>
          <span className={cn('font-bold tabular-nums', m.netCost < 0 && 'text-success')}>
            {fmtMoney(m.netCost, m.currency)}
          </span>
        </div>
      </div>
    </section>
  );
}
