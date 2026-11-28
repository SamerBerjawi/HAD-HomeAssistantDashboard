/**
 * The live Security page's model and actions: `useSecurityData` + the day's logbook
 * (`useSecurityActivity`) mapped by `buildSecurityHome`, and `act`, which sends a page action to
 * Home Assistant (`securityActionCalls`) with the expected state shown at once.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { ResolvedEntity } from '@/types';
import { buildSecurityHome } from '../lib/securityHome';
import { securityActionCalls } from '../lib/securityActions';
import type { SecurityAction, SecurityHome } from '../lib/securityPage';
import type { SecurityEntities } from '../lib/securityLogic';
import { useServiceCall } from '../widgets/shared/useServiceCall';
import { useMinuteTick } from './useMinuteTick';
import { useSecurityActivity } from './useSecurityActivity';
import { useSecurityData } from './useSecurityData';

const NONE: ResolvedEntity[] = [];

export function useSecurityHome() {
  const data = useSecurityData();
  const binarySensors = useAutoLayoutStore((s) => s.domainGroups['binary_sensor'] ?? NONE);
  const connection = useAutoLayoutStore((s) => s.connectionStatus);
  const tick = useMinuteTick();

  const entities: SecurityEntities = useMemo(
    () => ({ locks: data.locks, garages: data.garages, sirens: data.sirens, doorSensors: data.doorSensors, windowSensors: data.windowSensors, motionSensors: data.motionSensors, leakSensors: data.leakSensors, smokeSensors: data.smokeSensors }),
    [data.locks, data.garages, data.sirens, data.doorSensors, data.windowSensors, data.motionSensors, data.leakSensors, data.smokeSensors]
  );
  const activity = useSecurityActivity(entities, data.alarms, data.people);

  const home = useMemo<SecurityHome>(
    () =>
      buildSecurityHome({
        now: Date.now(),
        alarm: data.activeAlarm,
        locks: data.locks,
        garages: data.garages,
        sirens: data.sirens,
        doorSensors: data.doorSensors,
        windowSensors: data.windowSensors,
        motionSensors: data.motionSensors,
        leakSensors: data.leakSensors,
        smokeSensors: data.smokeSensors,
        cameras: data.cameras,
        people: data.people,
        binarySensors,
        batteries: data.deviceBatteryByEntityId,
        events: activity.events
      }),
    // `tick` refreshes the "2m ago" lines on an idle page.
    [data, entities, binarySensors, activity.events, tick]
  );

  const camerasById = useMemo(() => Object.fromEntries(data.cameras.map((c) => [c.entity_id, c])) as Record<string, ResolvedEntity>, [data.cameras]);

  const { call, setOptimistic } = useServiceCall();
  const latest = useRef(home);
  latest.current = home;
  const act = useCallback(
    (a: SecurityAction) => {
      for (const c of securityActionCalls(latest.current, a)) {
        if (c.optimistic) setOptimistic(c.entityId, c.optimistic.state, c.optimistic.attributes);
        void call(c.domain, c.service, c.data, c.entityId);
      }
    },
    [call, setOptimistic]
  );

  return { home, act, camerasById, isLoading: data.isLoading, isEmpty: data.total === 0, offline: connection === 'disconnected' };
}
