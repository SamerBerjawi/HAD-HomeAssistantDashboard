/** Alarm mode and lock actions (same behaviour as the old `useProOverviewActions` handlers). */
import { useCallback, useRef } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import type { ProOverviewAlarmModel } from '../../lib/overviewSecurity';
import type { AlarmModeId } from '../../lib/securityLogic';
import { useServiceCall } from '../shared/useServiceCall';

export interface AlarmActions {
  executeMode: (entityId: string, mode: AlarmModeId, code?: string) => Promise<void>;
  setLockState: (entityId: string, service: 'lock' | 'unlock') => Promise<void>;
  lockAll: () => Promise<void>;
}

export function useAlarmActions(model: ProOverviewAlarmModel): AlarmActions {
  const { call, setOptimistic } = useServiceCall();
  const modelRef = useRef(model);
  modelRef.current = model;

  const executeMode = useCallback<AlarmActions['executeMode']>(
    async (entityId, mode, code) => {
      const def = modelRef.current.modes.find((m) => m.id === mode);
      if (!def) return;
      await call('alarm_control_panel', def.service, code ? { code } : {}, entityId);
      if (haWebSocketService.isDemo()) setOptimistic(entityId, mode, { changed_by: 'You', last_changed: new Date().toISOString() });
    },
    [call, setOptimistic]
  );

  const setLockState = useCallback<AlarmActions['setLockState']>(
    async (entityId, service) => {
      await call('lock', service, {}, entityId);
      if (haWebSocketService.isDemo()) setOptimistic(entityId, service === 'lock' ? 'locked' : 'unlocked');
    },
    [call, setOptimistic]
  );

  const lockAll = useCallback(async () => {
    const ids = modelRef.current.locks.filter((l) => l.isUnlocked).map((l) => l.entityId);
    if (ids.length === 0) return;
    await call('lock', 'lock', {}, ids);
    if (haWebSocketService.isDemo()) for (const id of ids) setOptimistic(id, 'locked');
  }, [call, setOptimistic]);

  return { executeMode, setLockState, lockAll };
}
