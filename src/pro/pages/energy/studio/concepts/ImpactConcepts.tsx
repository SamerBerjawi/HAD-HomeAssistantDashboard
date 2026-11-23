/**
 * Section 11 — Huawei lifetime environmental impact + Edge States Preview:
 * A · Visual Forest & Carbon Infographic (bespoke SVG pine grove scaled to trees + MWh milestone bar)
 * B · Calm Eco Stat Trio (3 clean tactile metric cards with emerald icons + lifetime chip)
 * C · Slim Milestone Ribbon (compact single-band lifetime impact summary)
 */
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  EarthIcon,
  EcoEnergyIcon,
  Leaf01Icon,
  PineTreeIcon,
  RefreshIcon,
  SolarPanel01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { SectionConceptProps } from './types';

function ForestSvg({ trees }: { trees: number }) {
  const lit = Math.min(7, Math.max(1, Math.round(trees / 6)));
  const positions = [18, 42, 68, 96, 124, 152, 178];
  const scales = [0.8, 0.95, 1.1, 1.25, 1.0, 0.9, 0.78];

  return (
    <svg viewBox="0 0 200 48" className="h-12 w-full" role="img" aria-label={`Equivalent to ${trees} trees planted`}>
      <line x1="6" y1="42" x2="194" y2="42" stroke="var(--default)" strokeWidth="1.5" strokeLinecap="round" />
      {positions.map((cx, i) => {
        const s = scales[i];
        const active = i < lit;
        const fill = active ? 'var(--success)' : 'var(--default)';
        return (
          <g key={cx} opacity={active ? 0.9 : 0.45}>
            <rect x={cx - 1.5} y={42 - 8 * s} width="3" height={8 * s} rx="1" fill={fill} />
            <polygon
              points={`${cx},${42 - 28 * s} ${cx - 9 * s},${42 - 12 * s} ${cx + 9 * s},${42 - 12 * s}`}
              fill={fill}
            />
            <polygon
              points={`${cx},${42 - 20 * s} ${cx - 11 * s},${42 - 7 * s} ${cx + 11 * s},${42 - 7 * s}`}
              fill={fill}
            />
          </g>
        );
      })}
    </svg>
  );
}

function ImpactUnavailable() {
  return (
    <div className="pro-surface flex items-center gap-3 p-4 text-xs text-muted">
      <HugeiconsIcon icon={Leaf01Icon} size={16} className="shrink-0 text-success" />
      <span>Huawei Fusion Solar lifetime counters not configured in this home state.</span>
    </div>
  );
}

/** 11A · Visual Forest & Carbon Infographic */
export function ImpactA({ snap }: SectionConceptProps) {
  const imp = snap.impact;
  if (!imp) return <ImpactUnavailable />;

  const nextMilestone = Math.ceil(imp.lifetimeMwh / 10) * 10 || 10;
  const pctToMilestone = Math.min(100, Math.round(((imp.lifetimeMwh % 10 || 10) / 10) * 100));

  return (
    <section
      aria-label="Lifetime solar forest infographic"
      className="pro-eb flex flex-col gap-3 p-4"
      style={{ ['--eb-tint' as string]: '34, 197, 94' }}
    >
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={EarthIcon} size={17} className="text-success" />
          Lifetime impact
        </span>
        <Chip size="sm" variant="soft" color="success">
          <HugeiconsIcon icon={SolarPanel01Icon} size={12} />
          <Chip.Label>{imp.lifetimeMwh.toFixed(1)} MWh lifetime</Chip.Label>
        </Chip>
      </header>

      <div className="rounded-2xl bg-[var(--background)]/45 p-3">
        <ForestSvg trees={imp.trees} />
        <div className="mt-2 flex flex-col gap-1 text-[11px] text-muted">
          <div className="flex justify-between tabular-nums">
            <span>Next milestone ({nextMilestone} MWh)</span>
            <span className="font-semibold text-success">{pctToMilestone}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-default">
            <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${pctToMilestone}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-default/45 p-2">
          <p className="text-base font-bold tabular-nums">{imp.trees}</p>
          <p className="text-[11px] text-muted">Trees planted</p>
        </div>
        <div className="rounded-xl bg-default/45 p-2">
          <p className="text-base font-bold tabular-nums">{imp.co2Tonnes.toFixed(1)} t</p>
          <p className="text-[11px] text-muted">CO₂ avoided</p>
        </div>
        <div className="rounded-xl bg-default/45 p-2">
          <p className="text-base font-bold tabular-nums">{imp.coalTonnes.toFixed(1)} t</p>
          <p className="text-[11px] text-muted">Coal saved</p>
        </div>
      </div>
    </section>
  );
}

/** 11B · Calm Eco Stat Trio */
export function ImpactB({ snap }: SectionConceptProps) {
  const imp = snap.impact;
  if (!imp) return <ImpactUnavailable />;

  const items = [
    { icon: PineTreeIcon, label: 'Equivalent trees', value: `${imp.trees}` },
    { icon: Leaf01Icon, label: 'CO₂ avoided', value: `${imp.co2Tonnes.toFixed(2)} t` },
    { icon: EcoEnergyIcon, label: 'Coal saved', value: `${imp.coalTonnes.toFixed(2)} t` }
  ];

  return (
    <section aria-label="Lifetime eco trio" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-success/15 text-success">
            <HugeiconsIcon icon={Leaf01Icon} size={15} />
          </span>
          Lifetime solar impact
        </span>
        <span className="text-xs font-medium text-muted tabular-nums">{imp.lifetimeMwh.toFixed(1)} MWh</span>
      </header>

      <div className="grid grid-cols-1 gap-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-3 rounded-xl bg-default/45 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2.5 text-xs text-muted">
              <HugeiconsIcon icon={it.icon} size={16} className="shrink-0 text-success" />
              <span className="truncate">{it.label}</span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 11C · Slim Milestone Ribbon */
export function ImpactC({ snap }: SectionConceptProps) {
  const imp = snap.impact;
  if (!imp) return <ImpactUnavailable />;

  return (
    <section aria-label="Compact lifetime impact ribbon" className="pro-surface flex flex-col gap-2.5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
          <HugeiconsIcon icon={PineTreeIcon} size={15} />
          {imp.lifetimeMwh.toFixed(1)} MWh clean harvest
        </span>
        <span className="text-[11px] text-muted">Huawei lifetime counters</span>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-2.5">
        <div>
          <span className="block text-[11px] text-muted">Trees</span>
          <span className="font-mono text-sm font-bold tabular-nums">{imp.trees}</span>
        </div>
        <div>
          <span className="block text-[11px] text-muted">CO₂</span>
          <span className="font-mono text-sm font-bold tabular-nums">{imp.co2Tonnes.toFixed(2)} t</span>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Coal</span>
          <span className="font-mono text-sm font-bold tabular-nums">{imp.coalTonnes.toFixed(2)} t</span>
        </div>
      </div>
    </section>
  );
}

/** Edge states preview: Unconfigured in HA, Initial Loading Skeleton, and Error with Retry. */
export function EnergyStatesPreview({ compact, onRefresh }: { compact?: boolean; onRefresh: () => void }) {
  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-3')}>
      <article className="pro-surface flex flex-col justify-between gap-4 p-5">
        <div className="flex flex-col gap-2">
          <span className="pro-soft grid size-10 place-items-center rounded-xl">
            <HugeiconsIcon icon={SolarPanel01Icon} size={20} />
          </span>
          <h3 className="text-base font-semibold">Energy not set up in Home Assistant</h3>
          <p className="text-xs text-muted">
            Configure your grid meter, solar panels, or home battery under Home Assistant → Settings → Dashboards → Energy.
          </p>
        </div>
        <Button size="sm" variant="secondary" onPress={onRefresh} className="self-start gap-1.5">
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          Check again
        </Button>
      </article>

      <article className="pro-surface flex flex-col gap-3 p-5" aria-label="Loading skeleton">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <HugeiconsIcon icon={RefreshIcon} size={14} className="animate-spin text-[var(--accent)]" />
          Loading energy statistics…
        </div>
        <div className="h-14 animate-pulse rounded-xl bg-default" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 animate-pulse rounded-xl bg-default" />
          <div className="h-12 animate-pulse rounded-xl bg-default" />
        </div>
        <div className="h-24 animate-pulse rounded-xl bg-default" />
      </article>

      <article className="pro-surface flex flex-col justify-between gap-4 p-5">
        <div className="flex flex-col gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-danger/15 text-danger">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} />
          </span>
          <h3 className="text-base font-semibold">Couldn’t load Energy statistics</h3>
          <p className="text-xs text-muted">
            Home Assistant recorder did not reply in time. Live power cards stay available while history reconnects.
          </p>
        </div>
        <Button size="sm" variant="primary" onPress={onRefresh} className="self-start gap-1.5">
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          Try again
        </Button>
      </article>
    </div>
  );
}
