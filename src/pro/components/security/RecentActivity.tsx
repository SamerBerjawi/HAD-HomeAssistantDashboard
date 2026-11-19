import { useMemo, useState } from 'react';
import { Button, Skeleton, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  ArrowDown01Icon,
  Clock01Icon,
  DashboardSquare01Icon,
  DoorIcon,
  Motion01Icon,
  Shield01Icon,
  SquareLock02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useMinuteTick } from '../../hooks/useMinuteTick';
import { timeAgo } from '../../lib/pageSentences';
import type { ActivityEvent } from '../../lib/securityLogic';
import { TONE_TILE } from './AlarmHero';
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

function matchesFilter(e: ActivityEvent, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'openings') return e.kind === 'door' || e.kind === 'window' || e.kind === 'garage';
  if (filter === 'hazards') return e.kind === 'leak' || e.kind === 'smoke' || e.kind === 'siren';
  return e.kind === filter;
}

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Recent activity timeline (DESIGN.md 7.5): last 8 events of 24 h with category filters,
 * explicit room/actor/exact-time details, live 30s relative timestamp updates, and Show more up to 50.
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
    <section aria-label="Recent activity" className="pro-surface flex flex-col gap-3.5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon icon={Clock01Icon} size={18} className="text-[var(--accent)]" />
          Recent activity
          <span className="text-sm font-normal text-muted">· 24 h</span>
        </h2>
      </div>

      {availableFilters.length > 0 ? (
        <div className="flex justify-start">
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
            className="flex-wrap justify-start gap-1.5"
          >
            {availableFilters.map((opt) => (
              <ToggleButton key={opt.id} id={opt.id} className="h-7 gap-1.5 px-2.5 text-xs">
                <HugeiconsIcon icon={opt.icon} size={14} />
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      ) : null}

      {loading && events.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <HugeiconsIcon icon={Shield01Icon} size={16} />
          Nothing happened in the last 24 hours.
        </p>
      ) : (
        <ol className="flex flex-col">
          {shown.map((e, i) => (
            <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < shown.length - 1 && (
                <span aria-hidden="true" className="absolute left-[15px] top-8 bottom-0 w-px bg-separator" />
              )}
              <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full', TONE_TILE[e.tone])}>
                <HugeiconsIcon icon={activityEventIcon(e)} size={16} />
              </span>
              <span className="flex min-w-0 flex-col pt-0.5">
                <span className="text-sm font-medium text-foreground">{e.text}</span>
                <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                  <time
                    dateTime={new Date(e.when).toISOString()}
                    className="font-mono"
                    title={new Date(e.when).toLocaleString()}
                  >
                    {formatClock(e.when)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{timeAgo((Date.now() - e.when) / 60000)}</span>
                  {e.area ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{e.area}</span>
                    </>
                  ) : null}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {more > 0 && (
        <Button variant="ghost" size="sm" className="self-start" onPress={() => setExpanded((x) => !x)}>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            className={cn('transition-transform', expanded && 'rotate-180')}
          />
          {expanded ? 'Show less' : `Show ${more} more`}
        </Button>
      )}
    </section>
  );
}
