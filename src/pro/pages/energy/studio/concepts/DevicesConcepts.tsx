/**
 * Section 8 — Devices & appliances:
 * A · Ranked Bar Leaderboard (proportional horizontal bars with cost, share, and Expand toggle)
 * B · Podium Spotlight + Tail (top 3 consumers elevated into big bento podium tiles + compact tail)
 * C · Consumer Donut + Legend (segmented multi-hue SVG donut ring + interactive-style ranked legend)
 */
import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Award01Icon, CpuIcon, FlashIcon, Home01Icon, PieChartIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { deviceIconFor, fmtKwh, fmtMoney } from '../energyParts';
import { DEVICE_PALETTE } from './conceptHelpers';
import type { SectionConceptProps } from './types';

/** 8A · Ranked Bar Leaderboard */
export function DevicesA({ snap }: SectionConceptProps) {
  const [expanded, setExpanded] = useState(false);
  const m = snap.model;
  const rows = expanded ? m.topConsumers : m.topConsumers.slice(0, 4);

  return (
    <section aria-label="Device ranked leaderboard" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="pro-soft grid size-8 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={CpuIcon} size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Monitored devices</h3>
            <p className="text-xs text-muted">Ranked appliances with estimated cost</p>
          </div>
        </div>
        {m.topConsumers.length > 4 ? (
          <Button size="sm" variant="ghost" onPress={() => setExpanded((v) => !v)} className="gap-1 text-xs">
            <HugeiconsIcon icon={FlashIcon} size={13} />
            {expanded ? 'Top 4' : `All (${m.topConsumers.length})`}
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-2.5">
        {rows.map((d, idx) => {
          const est = d.kwh * 0.28;
          return (
            <div key={d.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <HugeiconsIcon
                    icon={deviceIconFor(d.id)}
                    size={15}
                    style={{ color: DEVICE_PALETTE[idx % DEVICE_PALETTE.length] }}
                    className="shrink-0"
                  />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="shrink-0 text-muted tabular-nums">
                  <strong className="text-foreground">{d.kwhText}</strong> · ~{fmtMoney(est, m.currency)} · {d.sharePct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-default">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, d.sharePct)}%`,
                    background: DEVICE_PALETTE[idx % DEVICE_PALETTE.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Home01Icon} size={13} />
          Untracked home baseline
        </span>
        <span className="font-medium tabular-nums">
          {fmtKwh(snap.untrackedKwh)} · {snap.untrackedPct}%
        </span>
      </div>
    </section>
  );
}

/** 8B · Podium Spotlight + Tail */
export function DevicesB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const podium = m.topConsumers.slice(0, 3);
  const rest = m.topConsumers.slice(3);

  return (
    <section aria-label="Device podium spotlight" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Award01Icon} size={17} className="text-[var(--accent)]" />
          Biggest consumers
        </span>
        <span className="text-xs text-muted tabular-nums">{100 - snap.untrackedPct}% tracked</span>
      </header>

      <div className={cn('grid gap-2.5', compact ? 'grid-cols-1' : 'grid-cols-3')}>
        {podium.map((d, idx) => {
          const color = DEVICE_PALETTE[idx % DEVICE_PALETTE.length];
          return (
            <article key={d.id} className="flex flex-col justify-between gap-2 rounded-2xl bg-default/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="grid size-7 place-items-center rounded-lg"
                  style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
                >
                  <HugeiconsIcon icon={deviceIconFor(d.id)} size={15} />
                </span>
                <Chip size="sm" variant="soft" color="default">
                  <Chip.Label className="tabular-nums">#{idx + 1} · {d.sharePct}%</Chip.Label>
                </Chip>
              </div>
              <div>
                <p className="truncate text-xs font-medium text-muted">{d.name}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight">{d.kwhText}</p>
                <p className="text-[11px] text-muted tabular-nums">~{fmtMoney(d.kwh * 0.28, m.currency)}</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-default">
                <div className="h-full rounded-full" style={{ width: `${Math.max(8, d.sharePct)}%`, background: color }} />
              </div>
            </article>
          );
        })}
      </div>

      {rest.length > 0 || snap.untrackedKwh > 0.05 ? (
        <div className={cn('grid gap-2 text-xs', compact ? 'grid-cols-1' : 'grid-cols-2')}>
          {rest.map((d, idx) => (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-default/35 px-2.5 py-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted tabular-nums">#{idx + 4}</span>
                <HugeiconsIcon icon={deviceIconFor(d.id)} size={13} className="shrink-0 text-muted" />
                <span className="truncate font-medium">{d.name}</span>
              </span>
              <span className="shrink-0 text-muted tabular-nums">
                {d.kwhText} ({d.sharePct}%)
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-default/35 px-2.5 py-2 text-muted">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Home01Icon} size={13} />
              Untracked
            </span>
            <span className="tabular-nums">
              {fmtKwh(snap.untrackedKwh)} ({snap.untrackedPct}%)
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** 8C · Consumer Donut + Legend */
export function DevicesC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  const slices = [
    ...m.topConsumers.slice(0, 5).map((d, idx) => ({
      id: d.id,
      name: d.name,
      kwh: d.kwh,
      pct: d.sharePct,
      color: DEVICE_PALETTE[idx % DEVICE_PALETTE.length]
    })),
    ...(snap.untrackedKwh > 0.05
      ? [{ id: 'untracked', name: 'Untracked', kwh: snap.untrackedKwh, pct: snap.untrackedPct, color: 'var(--energy-untracked)' }]
      : [])
  ];
  const sum = slices.reduce((acc, s) => acc + s.kwh, 0) || 1;
  const r = 46;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <section aria-label="Consumer donut distribution" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={PieChartIcon} size={16} className="text-[var(--accent)]" />
          Load distribution
        </span>
        <span className="text-xs text-muted tabular-nums">{m.homeKwhText} home total</span>
      </header>

      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-[150px_1fr] items-center')}>
        <div className="flex justify-center">
          <svg viewBox="0 0 124 124" className="size-32" role="img" aria-label={`Device share ring across ${m.homeKwhText}`}>
            <g transform="rotate(-90 62 62)">
              <circle cx="62" cy="62" r={r} fill="none" stroke="var(--default)" strokeWidth="14" />
              {slices.map((s) => {
                const len = (s.kwh / sum) * c;
                const seg = (
                  <circle
                    key={s.id}
                    cx="62"
                    cy="62"
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="14"
                    strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return seg;
              })}
            </g>
            <text
              x="62"
              y="59"
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="var(--foreground)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {m.homeKwhText}
            </text>
            <text x="62" y="73" textAnchor="middle" fontSize="8.5" fill="var(--muted)">
              {100 - snap.untrackedPct}% metered
            </text>
          </svg>
        </div>

        <ul className="flex flex-col gap-1.5 text-xs">
          {slices.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="truncate font-medium">{s.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                <strong className="text-foreground">{fmtKwh(s.kwh)}</strong> · {s.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
