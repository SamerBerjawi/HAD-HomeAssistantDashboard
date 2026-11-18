import { useEffect, useMemo, useState } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import type { ResolvedEntity } from '@/types';
import { buildActivity, type ActivityEvent, type DeviceKind, type LogbookEntry, type SecurityEntities } from '../lib/securityLogic';
import { entityName } from './useSecurityData';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Security events of the past 24 h from the HA logbook (`logbook/get_events`), newest first
 * (DESIGN.md 7.5). Refetches when a tracked entity changes state. In demo mode, or if the logbook
 * call fails, falls back to each entity's last change.
 */
export function useSecurityActivity(entities: SecurityEntities, alarms: ResolvedEntity[], people: ResolvedEntity[]) {
  const [rows, setRows] = useState<LogbookEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  const { kinds, names, tracked } = useMemo(() => {
    const kinds: Record<string, DeviceKind> = {};
    const names: Record<string, string> = {};
    const add = (list: ResolvedEntity[], kind: DeviceKind) =>
      list.forEach((e) => {
        kinds[e.entity_id] = kind;
        names[e.entity_id] = entityName(e);
      });
    add(entities.locks, 'lock');
    add(entities.doorSensors, 'door');
    add(entities.windowSensors, 'window');
    add(entities.motionSensors, 'motion');
    add(entities.leakSensors, 'leak');
    add(entities.smokeSensors, 'smoke');
    alarms.forEach((a) => (names[a.entity_id] = entityName(a)));
    const tracked = [...Object.keys(kinds), ...alarms.map((a) => a.entity_id)];
    return { kinds, names, tracked };
  }, [entities, alarms]);

  const users = useMemo(() => {
    const map: Record<string, string> = {};
    people.forEach((p) => {
      const id = p.attributes?.user_id as string | undefined;
      if (id) map[id] = entityName(p).split(' ')[0];
    });
    return map;
  }, [people]);

  // Changes whenever a tracked entity changes state, which triggers a refetch.
  const signature = useMemo(() => {
    const all = [...alarms, ...entities.locks, ...entities.doorSensors, ...entities.windowSensors, ...entities.motionSensors, ...entities.leakSensors, ...entities.smokeSensors];
    return all.map((e) => `${e.entity_id}:${e.state}`).join('|');
  }, [entities, alarms]);

  useEffect(() => {
    if (tracked.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const end = new Date();
      const start = new Date(end.getTime() - DAY_MS);
      try {
        const res = haWebSocketService.isDemo()
          ? null
          : await haWebSocketService.sendRequest<LogbookEntry[] | null>('logbook/get_events', {
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              entity_ids: tracked
            });
        if (!cancelled) setRows(Array.isArray(res) ? res : null);
      } catch {
        if (!cancelled) setRows(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `signature` stands in for the tracked states (deliberately the only dependency).
  }, [signature]);

  const events: ActivityEvent[] = useMemo(() => {
    const since = Date.now() - DAY_MS;
    const source: LogbookEntry[] =
      rows ??
      // Fallback: the last change of every tracked entity.
      [...alarms, ...entities.locks, ...entities.doorSensors, ...entities.windowSensors, ...entities.motionSensors, ...entities.leakSensors, ...entities.smokeSensors]
        .filter((e) => e.last_changed)
        .map((e) => ({ entity_id: e.entity_id, state: e.state, when: e.last_changed! }));
    return buildActivity(source, kinds, names, users).filter((e) => e.when >= since);
  }, [rows, kinds, names, users, alarms, entities]);

  return { events, loading };
}
