/**
 * "Recent activity" for a details sheet (owner review 2026-11-20, WIDGET_DESIGN.md §8 #17, #19,
 * #21): the last 24 hours of the given entities from the HA logbook, newest first, with who did
 * it when HA knows. Same source and wording as the Security page's Recent activity
 * (`useSecurityActivity`); in demo mode (no logbook) each entity's last change.
 */
import { useMemo } from 'react';
import { Clock01Icon } from '@hugeicons/core-free-icons';
import type { ResolvedEntity } from '@/types';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { activityEventIcon } from '../../../components/security/DeviceRow';
import { useSecurityActivity } from '../../../hooks/useSecurityActivity';
import { timeAgo } from '../../../lib/pageSentences';
import type { ActivityEvent, SecurityEntities } from '../../../lib/securityLogic';
import { SheetRow, SheetSection } from './SheetKit';

type Groups = Partial<Record<keyof SecurityEntities, readonly string[]>>;
const KEYS: (keyof SecurityEntities)[] = ['locks', 'garages', 'doorSensors', 'windowSensors', 'motionSensors', 'leakSensors', 'smokeSensors', 'sirens'];
const TONE = { default: 'default', success: 'success', warning: 'warning', danger: 'danger' } as const;
const clock = (ms: number) => new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

interface RecentEventsProps {
  title?: string;
  /** Entity ids by kind (locks, motion sensors…), as the Security page groups them. */
  groups?: Groups;
  /** Alarm panels to include. */
  alarms?: readonly string[];
  /** Keep only some events (e.g. alarm changes only). */
  only?: (e: ActivityEvent) => boolean;
  limit?: number;
  empty?: string;
}

export function RecentEvents({ title = 'Recent activity', groups = {}, alarms = [], only, limit = 6, empty = 'Nothing in the last 24 hours' }: RecentEventsProps) {
  const resolved = useAutoLayoutStore((s) => s.resolvedEntities);
  const key = JSON.stringify([groups, alarms]);
  const { entities, alarmList, people } = useMemo(() => {
    const pick = (ids: readonly string[] = []) => ids.map((id) => resolved[id]).filter((e): e is ResolvedEntity => Boolean(e));
    const entities = Object.fromEntries(KEYS.map((k) => [k, pick(groups[k])])) as unknown as SecurityEntities;
    const people = Object.values(resolved).filter((e) => e.entity_id.startsWith('person.'));
    return { entities, alarmList: pick(alarms), people };
    // `key` stands for the id lists; entity objects change with their state.
  }, [resolved, key]);
  const { events, loading } = useSecurityActivity(entities, alarmList, people);
  const shown = (only ? events.filter(only) : events).slice(0, limit);

  return (
    <SheetSection title={title} aside={events.length > 0 ? 'Last 24 hours' : undefined}>
      {shown.length === 0 ? (
        <SheetRow icon={Clock01Icon} title={loading ? 'Loading…' : empty} />
      ) : (
        shown.map((e) => (
          <SheetRow
            key={e.id}
            icon={activityEventIcon(e)}
            tone={TONE[e.tone]}
            title={e.text}
            subtitle={[e.source ? `by ${e.source}` : null, e.area ?? null].filter(Boolean).join(' · ') || undefined}
            trailing={
              <time dateTime={new Date(e.when).toISOString()} title={new Date(e.when).toLocaleString()} className="flex flex-col items-end text-xs tabular-nums text-muted">
                <span className="font-medium text-foreground">{clock(e.when)}</span>
                <span>{timeAgo((Date.now() - e.when) / 60000)}</span>
              </time>
            }
          />
        ))
      )}
    </SheetSection>
  );
}
