/** Vacuum actions (same behaviour as the old `useProOverviewActions` vacuum handlers). */
import { useMemo } from 'react';
import { useServiceCall } from '../shared/useServiceCall';

export type VacuumAction = 'start' | 'pause' | 'return_to_base' | 'locate';
const OPTIMISTIC: Partial<Record<VacuumAction, string>> = { start: 'cleaning', pause: 'paused', return_to_base: 'returning' };

export function useVacuumActions() {
  const { call, setOptimistic } = useServiceCall();
  return useMemo(
    () => ({
      run: (entityId: string, action: VacuumAction) => {
        const next = OPTIMISTIC[action];
        if (next) setOptimistic(entityId, next);
        void call('vacuum', action, {}, entityId);
      },
      /** HA 2026.3+ `vacuum.clean_area`: HA areas, mapped to the vacuum's segments in the entity settings. */
      cleanAreas: (entityId: string, areaIds: string[]) => {
        setOptimistic(entityId, 'cleaning');
        void call('vacuum', 'clean_area', { cleaning_area_id: areaIds }, entityId);
      },
      setSuction: (entityId: string, speed: string) => {
        setOptimistic(entityId, null, { fan_speed: speed });
        void call('vacuum', 'set_fan_speed', { fan_speed: speed }, entityId);
      }
    }),
    [call, setOptimistic]
  );
}
