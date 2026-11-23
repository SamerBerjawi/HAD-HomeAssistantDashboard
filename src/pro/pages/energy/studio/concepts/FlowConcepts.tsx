/**
 * Section 7 — Where it went:
 * A · Calm Sankey (SankeyChart sources -> home -> tracked devices + untracked)
 * B · Squarified Energy Treemap (custom proportional block map with hatched untracked zone)
 * C · Three-Lane Flow Ladder (3-stage horizontal source -> hub -> consumer pipeline)
 */
import { Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CpuIcon, Home01Icon, WorkflowSquare01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SankeyChart } from '../../../../ui/bklit/SankeyChart';
import { deviceIconFor, fmtKwh } from '../energyParts';
import { DEVICE_PALETTE } from './conceptHelpers';
import type { SectionConceptProps } from './types';

interface TreemapBlock {
  id: string;
  name: string;
  kwh: number;
  color: string | null;
}
interface PlacedBlock extends TreemapBlock {
  x: number;
  y: number;
  w: number;
  h: number;
}

function layoutTreemap(items: TreemapBlock[], x: number, y: number, w: number, h: number): PlacedBlock[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];
  const total = items.reduce((sum, item) => sum + item.kwh, 0) || 1;
  let acc = 0;
  let cut = 0;
  while (cut < items.length - 1 && acc + items[cut].kwh <= total / 2) {
    acc += items[cut++].kwh;
  }
  if (cut === 0) acc = items[cut++].kwh;
  const share = acc / total;
  const [a, b] = [items.slice(0, cut), items.slice(cut)];
  return w >= h
    ? [...layoutTreemap(a, x, y, w * share, h), ...layoutTreemap(b, x + w * share, y, w * (1 - share), h)]
    : [...layoutTreemap(a, x, y, w, h * share), ...layoutTreemap(b, x, y + h * share, w, h * (1 - share))];
}

/** 7A · Calm Sankey */
export function FlowA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const trackedPct = Math.max(0, 100 - m.untrackedPct);

  return (
    <section aria-label="Energy flow Sankey" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="pro-soft grid size-8 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={WorkflowSquare01Icon} size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Where {m.homeKwhText} went</h3>
            <p className="text-xs text-muted">Sources → home → consumers</p>
          </div>
        </div>
        <Chip size="sm" variant="soft" color="accent">
          <HugeiconsIcon icon={CpuIcon} size={12} />
          <Chip.Label>{trackedPct}% tracked</Chip.Label>
        </Chip>
      </header>
      <SankeyChart
        nodes={m.energyFlowFull.nodes}
        links={m.energyFlowFull.links}
        height={compact ? 215 : 260}
        compact={Boolean(compact)}
      />
    </section>
  );
}

/** 7B · Squarified Energy Treemap */
export function FlowB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const blocks: TreemapBlock[] = [
    ...m.topConsumers.map((d, idx) => ({
      id: d.id,
      name: d.name,
      kwh: d.kwh,
      color: DEVICE_PALETTE[idx % DEVICE_PALETTE.length]
    })),
    ...(snap.untrackedKwh > 0.05
      ? [{ id: 'untracked', name: 'Untracked', kwh: snap.untrackedKwh, color: null }]
      : [])
  ]
    .filter((b) => b.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh);

  const total = blocks.reduce((sum, b) => sum + b.kwh, 0) || 1;
  const placed = layoutTreemap(blocks, 0, 0, 100, 100);

  return (
    <section aria-label="Squarified energy map" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={WorkflowSquare01Icon} size={16} className="text-[var(--accent)]" />
          Proportional Energy Map
        </span>
        <span className="text-xs text-muted tabular-nums">
          {m.homeKwhText} · hatched = untracked
        </span>
      </header>

      <ul
        aria-label="Energy blocks by consumer size"
        className={cn('relative w-full', compact ? 'h-56' : 'h-64')}
      >
        {placed.map((b) => {
          const pct = Math.round((b.kwh / total) * 100);
          const tiny = b.w * b.h < 220;
          return (
            <li
              key={b.id}
              className="absolute p-[2px]"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              aria-label={`${b.name}: ${fmtKwh(b.kwh)} (${pct}%)`}
            >
              <span
                className={cn(
                  'flex size-full flex-col justify-between overflow-hidden rounded-xl p-2',
                  b.color === null ? 'pro-e-hatch text-muted' : 'text-white'
                )}
                style={b.color ? { background: b.color } : undefined}
              >
                <span className="truncate text-xs font-semibold leading-tight">{b.name}</span>
                {tiny ? null : (
                  <span className="text-[11px] font-medium tabular-nums opacity-90">
                    {fmtKwh(b.kwh)} · {pct}%
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 7C · Three-Lane Flow Ladder */
export function FlowC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const sourceTotal = Math.max(0.01, m.solarToHomeKwh + m.batteryToHomeKwh + m.gridToHomeKwh);
  const sources = [
    { id: 'solar', label: 'Solar', kwh: m.solarToHomeKwh, color: 'var(--energy-solar)' },
    { id: 'battery', label: 'Battery', kwh: m.batteryToHomeKwh, color: 'var(--energy-battery)' },
    { id: 'grid', label: 'Grid', kwh: m.gridToHomeKwh, color: 'var(--energy-grid)' }
  ].filter((s) => s.kwh > 0.05);

  const consumers = [
    ...m.topConsumers.slice(0, 4).map((d, idx) => ({
      id: d.id,
      label: d.name,
      kwh: d.kwh,
      color: DEVICE_PALETTE[idx % DEVICE_PALETTE.length],
      icon: deviceIconFor(d.id)
    })),
    ...(snap.untrackedKwh > 0.05
      ? [{ id: 'untracked', label: 'Untracked', kwh: snap.untrackedKwh, color: 'var(--energy-untracked)', icon: Home01Icon }]
      : [])
  ];
  const homeMax = Math.max(0.01, m.homeKwh);

  return (
    <section aria-label="Three-stage energy pipeline" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={WorkflowSquare01Icon} size={16} className="text-[var(--accent)]" />
          Supply → Home → Demand
        </span>
        <span className="text-xs text-muted tabular-nums">{100 - m.untrackedPct}% metered</span>
      </header>

      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-[1fr_130px_1.2fr] items-stretch')}>
        <div className="flex flex-col justify-center gap-2 rounded-2xl bg-default/45 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">1 · Sources</span>
          {sources.map((s) => (
            <div key={s.id} className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between tabular-nums">
                <span className="font-medium">{s.label}</span>
                <span>{fmtKwh(s.kwh)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-default">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(5, (s.kwh / sourceTotal) * 100)}%`, background: s.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--pro-accent-soft)] p-3 text-center">
          <HugeiconsIcon icon={Home01Icon} size={20} className="text-[var(--accent)]" />
          <span className="text-base font-bold tabular-nums">{m.homeKwhText}</span>
          <span className="text-[11px] text-muted">Home bus</span>
        </div>

        <div className="flex flex-col justify-center gap-2 rounded-2xl bg-default/45 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">2 · Consumers</span>
          {consumers.map((c) => (
            <div key={c.id} className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between gap-2 tabular-nums">
                <span className="flex min-w-0 items-center gap-1.5">
                  <HugeiconsIcon icon={c.icon} size={13} style={{ color: c.color }} className="shrink-0" />
                  <span className="truncate font-medium">{c.label}</span>
                </span>
                <span className="shrink-0">{fmtKwh(c.kwh)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-default">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(4, (c.kwh / homeMax) * 100)}%`, background: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
