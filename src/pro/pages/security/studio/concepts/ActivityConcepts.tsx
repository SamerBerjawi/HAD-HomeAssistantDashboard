/**
 * Section 4 — Recent Activity (24 h HA security logbook):
 * A · Vertical Spine Timeline (connected semantic timeline + category filter pills + Expand toggle)
 * B · 24-Hour Activity Pulse + Grouped Feed (hourly severity density strip above grouped logbook)
 * C · Compact Audit Ledger (dense monospace time-first table)
 */
import { useState } from 'react';
import { Button, Chip, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Activity01Icon,
  Alert02Icon,
  Clock01Icon,
  ListViewIcon,
  Motion01Icon,
  Shield01Icon,
  SquareLock02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { StudioEventCategory } from '../studioSecurity';
import { TONE_COLOR } from './securityHelpers';
import type { SecurityConceptProps } from './types';

function categoryIcon(cat: StudioEventCategory): IconSvgElement {
  if (cat === 'alarm') return Shield01Icon;
  if (cat === 'access') return SquareLock02Icon;
  if (cat === 'motion') return Motion01Icon;
  return Alert02Icon;
}

/** 4A · Vertical Spine Timeline */
export function ActivityA({ snap }: SecurityConceptProps) {
  const [cat, setCat] = useState<'all' | StudioEventCategory>('all');
  const [expanded, setExpanded] = useState(false);

  const filtered = cat === 'all' ? snap.events : snap.events.filter((e) => e.category === cat);
  const shown = expanded ? filtered : filtered.slice(0, 5);

  return (
    <section aria-label="Security timeline" className="pro-surface flex h-full flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Clock01Icon} size={16} className="text-[var(--accent)]" />
          Recent activity
        </span>
        <ToggleButtonGroup
          aria-label="Filter events"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          className="flex-wrap"
          selectedKeys={new Set([cat])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as 'all' | StudioEventCategory | undefined;
            if (next) setCat(next);
          }}
        >
          <ToggleButton id="all" className="text-[11px]">All</ToggleButton>
          <ToggleButton id="alarm" className="text-[11px]">Alarm</ToggleButton>
          <ToggleButton id="access" className="text-[11px]">Access</ToggleButton>
          <ToggleButton id="motion" className="text-[11px]">Motion</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <ol className="relative flex flex-col gap-3 pl-5 before:absolute before:top-2 before:bottom-2 before:left-[9px] before:w-px before:bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]">
        {shown.map((ev) => (
          <li key={ev.id} className="relative flex items-start justify-between gap-2">
            <span
              className="absolute top-0.5 -left-5 grid size-5 place-items-center rounded-full bg-[var(--surface)] ring-2"
              style={{
                color: TONE_COLOR[ev.tone],
                boxShadow: `0 0 0 2px color-mix(in oklab, ${TONE_COLOR[ev.tone]} 32%, transparent)`
              }}
            >
              <HugeiconsIcon icon={categoryIcon(ev.category)} size={11} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium leading-snug text-foreground">{ev.sentence}</p>
              <p className="mt-0.5 text-[11px] text-muted">{ev.area}</p>
            </div>
            <span className="shrink-0 text-[11px] text-muted tabular-nums">{ev.ago}</span>
          </li>
        ))}
      </ol>

      {filtered.length > 5 ? (
        <Button size="sm" variant="ghost" onPress={() => setExpanded((v) => !v)} className="self-start text-xs">
          {expanded ? 'Show fewer' : `Show all (${filtered.length})`}
        </Button>
      ) : null}
    </section>
  );
}

/** 4B · 24-Hour Activity Pulse + Grouped Feed */
export function ActivityB({ snap }: SecurityConceptProps) {
  const maxCount = Math.max(1, ...snap.hourlyPulse.map((p) => p.count));
  const recent = snap.events.slice(0, 3);
  const earlier = snap.events.slice(3, 6);

  return (
    <section aria-label="Activity pulse and feed" className="pro-surface flex h-full flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Activity01Icon} size={16} className="text-[var(--accent)]" />
          24 h security pulse
        </span>
        <span className="text-xs text-muted tabular-nums">{snap.events.length} events</span>
      </header>

      {/* 24-hour density bars */}
      <div className="rounded-2xl bg-default/45 p-3">
        <div
          className="flex h-12 items-end gap-1"
          role="img"
          aria-label="Hourly security event density over the past 24 hours"
        >
          {snap.hourlyPulse.map((slot) => {
            const pct = slot.count > 0 ? Math.max(20, Math.round((slot.count / maxCount) * 100)) : 8;
            return (
              <span
                key={slot.hour}
                title={`${slot.hour}: ${slot.count} event${slot.count === 1 ? '' : 's'}`}
                className="flex-1 rounded-full transition-all"
                style={{
                  height: `${pct}%`,
                  background: slot.count === 0 ? 'var(--default)' : TONE_COLOR[slot.maxTone]
                }}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
          <span>00:00</span>
          <span>12:00</span>
          <span>Now</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Latest</p>
        {recent.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between gap-2 rounded-xl bg-default/40 px-2.5 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <HugeiconsIcon icon={categoryIcon(ev.category)} size={14} style={{ color: TONE_COLOR[ev.tone] }} className="shrink-0" />
              <span className="truncate font-medium">{ev.sentence}</span>
            </span>
            <span className="shrink-0 text-[11px] text-muted tabular-nums">{ev.ago}</span>
          </div>
        ))}
        {earlier.length > 0 ? (
          <>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Earlier</p>
            {earlier.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-2 px-1.5 py-1 text-xs text-muted">
                <span className="truncate">{ev.sentence}</span>
                <span className="shrink-0 text-[11px] tabular-nums">{ev.time}</span>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </section>
  );
}

/** 4C · Compact Audit Ledger */
export function ActivityC({ snap }: SecurityConceptProps) {
  return (
    <section aria-label="Security audit ledger" className="pro-surface flex h-full flex-col gap-2.5 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={ListViewIcon} size={16} className="text-[var(--accent)]" />
          Audit log
        </span>
        <Chip size="sm" variant="soft" color="default">
          <Chip.Label className="font-mono text-[10px]">LAST 24H</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        {snap.events.slice(0, 7).map((ev) => (
          <div key={ev.id} className="grid grid-cols-[44px_16px_1fr_auto] items-center gap-2 py-2 text-xs">
            <span className="font-mono text-[11px] text-muted tabular-nums">{ev.time}</span>
            <HugeiconsIcon icon={categoryIcon(ev.category)} size={14} style={{ color: TONE_COLOR[ev.tone] }} />
            <span className="truncate font-medium text-foreground">{ev.sentence}</span>
            <span className="truncate text-[11px] text-muted">{ev.actor ?? ev.area}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
