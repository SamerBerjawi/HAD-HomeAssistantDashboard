import { useMemo, useState } from 'react';
import { Button, Chip, Skeleton, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  ArrowDown01Icon,
  DashboardSquare01Icon,
  DoorIcon,
  ListViewIcon,
  Motion01Icon,
  Shield01Icon,
  SquareLock02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useMinuteTick } from '../../hooks/useMinuteTick';
import { timeAgo } from '../../lib/pageSentences';
import type { ActivityEvent, Tone } from '../../lib/securityLogic';
import { activityEventIcon } from './DeviceRow';

const FIRST = 8;
/** Busy sensors can log thousands of changes a day; the expanded list stops at this many. */
const MAX = 50;

type ActivityFilter = 'all' | 'alarm' | 'lock' | 'openings' | 'motion' | 'hazards';

const FILTER_OPTIONS: ReadonlyArray<{ id: ActivityFilter; label: string; icon: IconSvgElement }> = [
  { id: 'all', label: 'All', icon: DashboardSquare01Icon },
  { id: 'alarm', label: 'Alarm', icon: Shield01Icon },
  { id: 'lock', label: 'Locks', icon: SquareLock02Icon },
  { id: 'openings', label: 'Openings', icon: DoorIcon },
  { id: 'motion', label: 'Motion', icon: Motion01Icon },
  { id: 'hazards', label: 'Hazards', icon: AlarmSmokeIcon }
];

const TONE_COLOR: Record<Tone, string> = {
  default: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)'
};

function matchesFilter(e: ActivityEvent, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'openings') return e.kind === 'door' || e.kind === 'window' || e.kind === 'garage';
  if (filter === 'hazards') return e.kind === 'leak' || e.kind === 'smoke' || e.kind === 'siren';
  return e.kind === filter;
}

function formatClock24(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Recent Activity — Concept C · Compact Audit Ledger (DESIGN.md 7.5, SECURITY.md §3):
 * Monospace time-first audit table over the last 24 h of HA logbook events with category filters
 * and Show more up to 50 rows.
 */
export function RecentActivity({ events, loading }: { events: ActivityEvent[]; loading: boolean }) {
  useMinuteTick();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const availableFilters = useMemo(() => {
    const present = FILTER_OPTIONS.filter(
      (opt) => opt.id === 'all' || events.some((e) => matchesFilter(e, opt.id))
    );
    return present.length > 2 ? present : [];
  }, [events]);

  const effectiveFilter =
    filter !== 'all' && !availableFilters.some((f) => f.id === filter) ? 'all' : filter;

  const filteredEvents = useMemo(
    () => (effectiveFilter === 'all' ? events : events.filter((e) => matchesFilter(e, effectiveFilter))),
    [events, effectiveFilter]
  );

  const shown = filteredEvents.slice(0, expanded ? MAX : FIRST);
  const more = Math.min(filteredEvents.length, MAX) - FIRST;

  return (
    <section aria-label="Recent activity" className="pro-surface flex flex-col gap-3 p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={ListViewIcon} size={16} className="text-[var(--accent)]" />
          Audit log
        </h2>
        <Chip size="sm" variant="soft" color="default">
          <Chip.Label className="font-mono text-[10px]">LAST 24H</Chip.Label>
        </Chip>
      </header>

      {availableFilters.length > 0 ? (
        <ToggleButtonGroup
          aria-label="Filter recent activity"
          size="sm"
          isDetached
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([effectiveFilter])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as ActivityFilter | undefined;
            if (next) {
              setFilter(next);
              setExpanded(false);
            }
          }}
          className="flex-wrap justify-start gap-1"
        >
          {availableFilters.map((opt) => (
            <ToggleButton key={opt.id} id={opt.id} className="h-7 gap-1 px-2 text-[11px]">
              <HugeiconsIcon icon={opt.icon} size={13} />
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ) : null}

      {loading && events.length === 0 ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <p className="inline-flex items-center gap-2 py-2 text-xs text-muted">
          <HugeiconsIcon icon={Shield01Icon} size={15} />
          Nothing happened in the last 24 hours.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
          {shown.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-[44px_16px_1fr_auto] items-center gap-2 py-2 text-xs"
            >
              <time
                dateTime={new Date(e.when).toISOString()}
                title={new Date(e.when).toLocaleString()}
                className="font-mono text-[11px] text-muted tabular-nums"
              >
                {formatClock24(e.when)}
              </time>
              <HugeiconsIcon
                icon={activityEventIcon(e)}
                size={14}
                style={{ color: TONE_COLOR[e.tone] }}
              />
              <span className="truncate font-medium text-foreground" title={e.text}>
                {e.text}
              </span>
              <span className="max-w-24 truncate text-right text-[11px] text-muted">
                {e.area ?? timeAgo((Date.now() - e.when) / 60000)}
              </span>
            </li>
          ))}
        </ol>
      )}

      {more > 0 ? (
        <Button variant="ghost" size="sm" className="self-start text-xs" onPress={() => setExpanded((x) => !x)}>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            className={cn('transition-transform', expanded && 'rotate-180')}
          />
          {expanded ? 'Show less' : `Show ${more} more`}
        </Button>
      ) : null}
    </section>
  );
}
