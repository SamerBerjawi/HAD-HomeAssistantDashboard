import { useState } from 'react';
import { Button, Skeleton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Clock01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { timeAgo } from '../../lib/pageSentences';
import type { ActivityEvent } from '../../lib/securityLogic';
import { KIND_ICON } from './DeviceRow';
import { TONE_TILE } from './AlarmHero';

const FIRST = 8;
/** Busy sensors can log thousands of changes a day; the expanded list stops at this many. */
const MAX = 50;

/** Recent activity timeline (DESIGN.md 7.5): last 8 events of 24 h, Show more for the rest. */
export function RecentActivity({ events, loading }: { events: ActivityEvent[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const shown = events.slice(0, expanded ? MAX : FIRST);
  const more = Math.min(events.length, MAX) - FIRST;

  return (
    <section aria-label="Recent activity" className="pro-surface flex flex-col gap-4 p-5">
      <h2 className="inline-flex items-center gap-2 text-base font-semibold">
        <HugeiconsIcon icon={Clock01Icon} size={18} className="text-[var(--accent)]" />
        Recent activity
        <span className="text-sm font-normal text-muted">· 24 h</span>
      </h2>

      {loading && events.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <HugeiconsIcon icon={Shield01Icon} size={16} />
          Nothing happened in the last 24 hours.
        </p>
      ) : (
        <ol className="flex flex-col">
          {shown.map((e, i) => (
            <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < shown.length - 1 && <span aria-hidden="true" className="absolute left-[15px] top-8 bottom-0 w-px bg-separator" />}
              <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full', TONE_TILE[e.tone])}>
                <HugeiconsIcon icon={e.kind === 'alarm' ? Shield01Icon : KIND_ICON[e.kind]} size={16} />
              </span>
              <span className="flex min-w-0 flex-col pt-0.5">
                <span className="text-sm font-medium">{e.text}</span>
                <time dateTime={new Date(e.when).toISOString()} className="text-xs text-muted" title={new Date(e.when).toLocaleString()}>
                  {timeAgo((Date.now() - e.when) / 60000)}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}

      {more > 0 && (
        <Button variant="ghost" size="sm" className="self-start" onPress={() => setExpanded((x) => !x)}>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
          {expanded ? 'Show less' : `Show ${more} more`}
        </Button>
      )}
    </section>
  );
}
