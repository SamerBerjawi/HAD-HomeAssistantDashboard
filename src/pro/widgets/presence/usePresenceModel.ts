import { useMemo } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { buildOverviewPresenceModel, type ProOverviewPresenceModel } from '../../lib/overviewPresence';
import { useDomainEntities } from '../shared/entities';

/** People: `person` entities, or device trackers when there are none (as before). */
export function usePresenceModel(): ProOverviewPresenceModel {
  const persons = useDomainEntities('person');
  const trackers = useDomainEntities('device_tracker');
  const zones = useAutoLayoutStore((s) => s.resolvedZones);
  const isDemo = haWebSocketService.isDemo();
  const people = useMemo(() => (persons.length > 0 ? persons : [...persons, ...trackers]), [persons, trackers]);
  return useMemo(() => buildOverviewPresenceModel({ peopleEntities: people, resolvedZones: zones, isDemo }), [people, zones, isDemo]);
}
