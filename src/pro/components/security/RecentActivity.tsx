import { useMemo, useState } from 'react';
import { Button, Skeleton, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Clock01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useMinuteTick } from '../../hooks/useMinuteTick';
import { timeAgo } from '../../lib/pageSentences';
import type { ActivityEvent } from '../../lib/securityLogic';
import { TONE_TILE } from './AlarmHero';
import { KIND_ICON } from './DeviceRow';

const FIRST = 8;
/** Busy sensors can log thousands of changes a day; the expanded list stops at this many. */
const MAX = 50;

type ActivityFilter = 'all' | 'alarm' | 'lock' | 'openings' | 'motion' | 'hazards';

const FILTER_OPTIONS: ReadonlyArray<{ id: ActivityFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'alarm', label: 'Alarm' },
  { id: 'lock', label: 'Locks' },
  { id: 'openings', label: 'Openings' },
  { id: 'motion', label: 'Motion' },
  { id: 'hazards', label: 'Hazards' }
];

function matchesFilter(e: ActivityEvent, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'openings') return e.kind === 'door' || e.kind === 'window';
  if (filter === 'hazards') return e.kind === 'leak' || e.kind === 'smoke';
  return e.kind === filter;
}

/**
 * Recent activity timeline (DESIGN.md 7.5): last 8 events of 24 h with category filters,
 * live 30s relative timestamp updates, and Show more up to 50.
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
              <ToggleButton key={opt.id} id={opt.id} className="h-7 px-2.5 text-xs">
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
                <HugeiconsIcon icon={e.kind === 'alarm' ? Shield01Icon : KIND_ICON[e.kind]} size={16} />
              </span>
              <span className="flex min-w-0 flex-col pt-0.5">
                <span className="text-sm font-medium">{e.text}</span>
                <time
                  dateTime={new Date(e.when).toISOString()}
                  className="text-xs text-muted"
                  title={new Date(e.when).toLocaleString()}
                >
                  {timeAgo((Date.now() - e.when) / 60000)}
                </time>
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
