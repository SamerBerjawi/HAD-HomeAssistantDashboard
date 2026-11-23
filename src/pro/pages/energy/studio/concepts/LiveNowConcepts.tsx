/**
 * Section 1 — Live now:
 * A · Concentric Power Orbit (dual-arc SVG orbital ring around live kW + source breakdown)
 * B · Live Busbar Schematic (AnimatedBeam live energy nodes + subtle radial glow + BatteryStat)
 * C · Living Horizon Strip (continuous proportional power river bar + compact telemetry footer)
 */
import { useRef, type RefObject } from 'react';
import { Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  BatteryCharging01Icon,
  BatteryFullIcon,
  FlashIcon,
  Home01Icon,
  PlugSocketIcon,
  SolarPanel01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../../lib/overviewEnergy';
import { BatteryGlyph, BatteryPill, BatteryStat, batteryState } from '../../../../widgets/energy/EnergyBattery';
import { dominantSource, liveRows, SOURCE } from '../../../../widgets/energy/concepts/shared';
import { AnimatedBeam } from '../../../../ui/magicui/AnimatedBeam';
import { fmtKw, liveStatusPill } from '../energyParts';
import { SOURCE_TINT } from './conceptHelpers';
import type { SectionConceptProps } from './types';

function OrbitRing({ m }: { m: ProOverviewEnergyModel }) {
  const rInner = 42;
  const cInner = 2 * Math.PI * rInner;
  const rOuter = 53;
  const cOuter = 2 * Math.PI * rOuter;

  const inflows = [
    { k: 'solar' as const, pct: m.sourceSplit.solarPct, color: SOURCE.solar.color },
    { k: 'battery' as const, pct: m.sourceSplit.batteryPct, color: SOURCE.battery.color },
    { k: 'grid' as const, pct: m.sourceSplit.gridPct, color: SOURCE.grid.color }
  ].filter((p) => p.pct > 0);

  const solarBase = Math.max(m.solarKW, m.homeKW, 0.01);
  const outflows = [
    {
      k: 'export' as const,
      pct: Math.min(100, ((m.isExporting ? m.gridExportKW : 0) / solarBase) * 100),
      color: 'var(--energy-export)'
    },
    {
      k: 'battery-chg' as const,
      pct: Math.min(100, (m.batteryChargeKW / solarBase) * 100),
      color: SOURCE.battery.color
    }
  ].filter((p) => p.pct > 0.5);

  let inOffset = 0;
  let outOffset = 0;

  return (
    <svg
      viewBox="0 0 128 128"
      className="size-36 shrink-0"
      role="img"
      aria-label={`Live power orbit: ${m.homeKWText} home draw`}
    >
      <g transform="rotate(-90 64 64)">
        <circle cx="64" cy="64" r={rInner} fill="none" stroke="var(--default)" strokeWidth="10" />
        {inflows.map((seg) => {
          const len = (seg.pct / 100) * cInner;
          const el = (
            <circle
              key={seg.k}
              cx="64"
              cy="64"
              r={rInner}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${Math.max(0, len - 2)} ${cInner}`}
              strokeDashoffset={-inOffset}
              strokeLinecap="round"
            />
          );
          inOffset += len;
          return el;
        })}
        <circle
          cx="64"
          cy="64"
          r={rOuter}
          fill="none"
          stroke="var(--default)"
          strokeOpacity="0.45"
          strokeWidth="3.5"
        />
        {outflows.map((seg) => {
          const len = (seg.pct / 100) * cOuter;
          const el = (
            <circle
              key={seg.k}
              cx="64"
              cy="64"
              r={rOuter}
              fill="none"
              stroke={seg.color}
              strokeWidth="3.5"
              strokeDasharray={`${Math.max(0, len - 2)} ${cOuter}`}
              strokeDashoffset={-outOffset}
              strokeLinecap="round"
            />
          );
          outOffset += len;
          return el;
        })}
      </g>
      <text
        x="64"
        y="61"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="var(--foreground)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {m.homeKWText}
      </text>
      <text x="64" y="76" textAnchor="middle" fontSize="9.5" fontWeight="500" fill="var(--muted)">
        home now
      </text>
    </svg>
  );
}

/** 1A · Concentric Power Orbit */
export function LiveNowA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const dom = dominantSource(m);
  const pill = liveStatusPill(m);
  const rows = liveRows(m);
  const bat = batteryState(m);

  return (
    <section
      aria-label="Live power orbit"
      className="pro-eb flex flex-col gap-4 p-4"
      style={{ ['--eb-tint' as string]: SOURCE_TINT[dom ?? 'idle'] }}
    >
      <div className={cn('flex gap-5', compact ? 'flex-col items-center' : 'items-center justify-between')}>
        <div className="flex items-center gap-4">
          <OrbitRing m={m} />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip size="sm" variant="soft" color={pill.tone}>
                <HugeiconsIcon icon={pill.icon} size={13} />
                <Chip.Label>{pill.label}</Chip.Label>
              </Chip>
              {bat ? <BatteryPill m={m} ink="auto" bare /> : null}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {m.selfSufficiencyPct}% of demand covered cleanly
            </p>
            <p className="text-xs text-muted">
              Inner ring shows what feeds your home; outer halo tracks surplus sent to battery or grid.
            </p>
          </div>
        </div>

        <div className={cn('grid gap-2', compact ? 'w-full grid-cols-1' : 'min-w-[290px] grid-cols-1')}>
          {rows.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between gap-3 rounded-xl bg-default/55 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon
                  icon={SOURCE[r.key].icon}
                  size={15}
                  style={{ color: SOURCE[r.key].color }}
                  className="shrink-0"
                />
                <span className="truncate text-xs font-medium">{SOURCE[r.key].label}</span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="text-xs font-bold">{r.value}</span>
                <span className="ml-1.5 text-[11px] text-muted">{r.note}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowPill({
  nodeRef,
  icon,
  color,
  label,
  value,
  sub
}: {
  nodeRef: RefObject<HTMLDivElement | null>;
  icon: IconSvgElement;
  color: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      ref={nodeRef}
      className="z-[1] flex min-w-0 items-center gap-2 rounded-xl bg-[var(--surface)] px-2.5 py-2 shadow-2xs ring-1 ring-black/5 dark:ring-white/10"
    >
      <span
        className="grid size-7 shrink-0 place-items-center rounded-lg"
        style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
      >
        <HugeiconsIcon icon={icon} size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-medium text-muted">{label}</span>
        <span className="block whitespace-nowrap text-xs font-bold tabular-nums">{value}</span>
        {sub ? <span className="block truncate text-[10px] text-muted">{sub}</span> : null}
      </span>
    </div>
  );
}

/** 1B · Live Busbar Schematic */
export function LiveNowB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const dom = dominantSource(m);
  const pill = liveStatusPill(m);
  const b = batteryState(m);

  const boxRef = useRef<HTMLDivElement>(null);
  const solarRef = useRef<HTMLDivElement>(null);
  const batRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-label="Live power schematic"
      className="pro-eb pro-eb-live flex flex-col gap-4 p-4"
      style={{ ['--eb-tint' as string]: SOURCE_TINT[dom ?? 'idle'] }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <HugeiconsIcon icon={FlashIcon} size={14} className="text-[var(--accent)]" />
            Live home flow
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight tabular-nums leading-none">
              {m.homeKWText}
            </span>
            <Chip size="sm" variant="soft" color={pill.tone}>
              <HugeiconsIcon icon={pill.icon} size={13} />
              <Chip.Label>{pill.label}</Chip.Label>
            </Chip>
          </div>
          <p className="mt-1 text-xs text-muted tabular-nums">
            {m.selfSufficiencyPct}% self-powered right now
          </p>
        </div>

        <BatteryStat m={m} ink="auto" className="shrink-0" />
      </div>

      <div
        key={compact ? 'compact' : 'wide'}
        ref={boxRef}
        className="relative flex flex-col gap-3 rounded-2xl bg-[var(--background)]/45 p-3"
      >
        <div className="grid grid-cols-2 gap-3">
          {m.hasSolar ? (
            <FlowPill
              nodeRef={solarRef}
              icon={SolarPanel01Icon}
              color="var(--energy-solar)"
              label="Solar"
              value={fmtKw(m.solarKW)}
              sub={m.solarKW > 0.05 ? 'Generating' : 'Asleep'}
            />
          ) : (
            <div ref={solarRef} aria-hidden />
          )}
          <FlowPill
            nodeRef={homeRef}
            icon={Home01Icon}
            color="var(--accent)"
            label="Home"
            value={fmtKw(m.homeKW)}
            sub={`${m.selfSufficiencyPct}% clean`}
          />
          {b ? (
            <FlowPill
              nodeRef={batRef}
              icon={b.mode === 'charging' ? BatteryCharging01Icon : BatteryFullIcon}
              color="var(--energy-battery)"
              label="Battery"
              value={b.pct !== null ? `${b.pct}%` : fmtKw(m.batteryKW)}
              sub={b.note}
            />
          ) : (
            <div ref={batRef} aria-hidden />
          )}
          <FlowPill
            nodeRef={gridRef}
            icon={PlugSocketIcon}
            color={m.isExporting ? 'var(--energy-export)' : 'var(--energy-grid)'}
            label="Grid"
            value={
              m.isExporting
                ? `↑ ${fmtKw(m.gridExportKW)}`
                : m.gridImportKW > 0.03
                  ? `↓ ${fmtKw(m.gridImportKW)}`
                  : '0 W'
            }
            sub={m.isExporting ? 'Exporting' : m.gridImportKW > 0.03 ? 'Importing' : 'Idle'}
          />
        </div>

        {m.hasSolar && m.solarKW > 0.05 ? (
          <AnimatedBeam
            containerRef={boxRef}
            fromRef={solarRef}
            toRef={homeRef}
            gradientStartColor="#f59e0b"
            gradientStopColor="#f97316"
            pathOpacity={0.28}
            duration={2.6}
          />
        ) : null}
        {m.hasSolar && b && b.mode === 'charging' ? (
          <AnimatedBeam
            containerRef={boxRef}
            fromRef={solarRef}
            toRef={batRef}
            gradientStartColor="#f59e0b"
            gradientStopColor="#14b8a6"
            pathOpacity={0.28}
            duration={2.8}
          />
        ) : null}
        {b && b.mode === 'giving' ? (
          <AnimatedBeam
            containerRef={boxRef}
            fromRef={batRef}
            toRef={homeRef}
            gradientStartColor="#14b8a6"
            gradientStopColor="#22c55e"
            pathOpacity={0.32}
            duration={2.4}
          />
        ) : null}
        {m.gridImportKW > 0.05 ? (
          <AnimatedBeam
            containerRef={boxRef}
            fromRef={gridRef}
            toRef={homeRef}
            gradientStartColor="#3b82f6"
            gradientStopColor="#f97316"
            pathOpacity={0.28}
            duration={3}
          />
        ) : null}
        {m.isExporting && m.hasSolar ? (
          <AnimatedBeam
            containerRef={boxRef}
            fromRef={solarRef}
            toRef={gridRef}
            gradientStartColor="#f59e0b"
            gradientStopColor="#8b5cf6"
            pathOpacity={0.3}
            duration={2.6}
          />
        ) : null}
      </div>
    </section>
  );
}

/** 1C · Living Horizon Strip */
export function LiveNowC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const b = batteryState(m);
  const pill = liveStatusPill(m);
  const split = m.sourceSplit;
  const segments = [
    ...(m.hasSolar
      ? [{ id: 'solar', label: 'Solar', pct: split.solarPct, kw: m.distribution.solarToHomeKW, color: SOURCE.solar.color, icon: SolarPanel01Icon }]
      : []),
    ...(m.hasBattery
      ? [{ id: 'battery', label: 'Battery', pct: split.batteryPct, kw: m.distribution.batteryToHomeKW, color: SOURCE.battery.color, icon: BatteryFullIcon }]
      : []),
    { id: 'grid', label: 'Grid', pct: split.gridPct, kw: m.distribution.gridToHomeKW, color: SOURCE.grid.color, icon: PlugSocketIcon }
  ];
  const activeTotal = Math.max(1, segments.reduce((sum, s) => sum + s.pct, 0));

  return (
    <section aria-label="Live horizon bar" className="pro-surface flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <span className="pro-soft grid size-8 shrink-0 place-items-center rounded-xl self-center">
            <HugeiconsIcon icon={FlashIcon} size={17} />
          </span>
          <span className="text-2xl font-bold tracking-tight tabular-nums leading-none">
            {m.homeKWText}
          </span>
          <span className="text-xs text-muted">drawing now</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="soft" color={pill.tone}>
            <HugeiconsIcon icon={pill.icon} size={12} />
            <Chip.Label>{pill.label}</Chip.Label>
          </Chip>
          {b ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-default/70 px-2.5 py-1 text-xs font-semibold tabular-nums">
              <BatteryGlyph b={b} ink="auto" width={20} />
              {b.pct ?? 0}%
            </span>
          ) : null}
        </div>
      </div>

      {/* Continuous power river */}
      <div
        className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-default p-0.5"
        role="img"
        aria-label={`Live power mix: Solar ${split.solarPct}%, Battery ${split.batteryPct}%, Grid ${split.gridPct}%`}
      >
        {segments
          .filter((s) => s.pct > 0)
          .map((s) => (
            <span
              key={s.id}
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(s.pct / activeTotal) * 100}%`, background: s.color }}
            />
          ))}
      </div>

      <div
        className={cn(
          'grid gap-2 text-xs',
          compact || segments.length === 1 ? 'grid-cols-1' : segments.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        )}
      >
        {segments.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              <HugeiconsIcon icon={s.icon} size={13} style={{ color: s.color }} />
              <span className="font-medium text-foreground">{s.label}</span>
            </span>
            <span className="font-semibold tabular-nums">
              {fmtKw(s.kw)} <span className="text-[11px] font-normal text-muted">({s.pct}%)</span>
            </span>
          </div>
        ))}
        {m.isExporting ? (
          <p className="col-span-full flex items-center gap-1.5 text-[11px] text-success">
            <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
            Exporting {fmtKw(m.gridExportKW)} back to grid
          </p>
        ) : m.gridImportKW > 0.04 ? (
          <p className="col-span-full flex items-center gap-1.5 text-[11px] text-muted">
            <HugeiconsIcon icon={ArrowDown01Icon} size={12} style={{ color: 'var(--energy-grid)' }} />
            Importing {fmtKw(m.gridImportKW)} from grid
          </p>
        ) : null}
      </div>
    </section>
  );
}
