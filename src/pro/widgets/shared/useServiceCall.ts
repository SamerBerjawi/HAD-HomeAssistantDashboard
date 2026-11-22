/**
 * Stable HA service helpers for widget action hooks (Overview rebuild, Phase 1).
 * `call` swallows errors: the service slice already reports them with a toast.
 * Demo mode (Phase 4): no HA answers, so the state a real HA would report is applied here.
 */
import { useCallback } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { demoServiceEffects } from '../../lib/demoServices';

export interface ServiceCall {
  call: (domain: string, service: string, data: Record<string, unknown>, entityId: string | string[]) => Promise<void>;
  /** Optimistic local update before the HA round trip. */
  setOptimistic: (entityId: string, state: string | null, attributes?: Record<string, unknown>) => void;
}

export function useServiceCall(): ServiceCall {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const updateEntityState = useAutoLayoutStore((s) => s.updateEntityState);
  const call = useCallback<ServiceCall['call']>(
    async (domain, service, data, entityId) => {
      try {
        await callHAService(domain, service, data, { entity_id: entityId });
      } catch {
        // Reported by the service slice.
      }
      if (haWebSocketService.isDemo()) {
        const { states, updateEntityState: apply } = useAutoLayoutStore.getState();
        const ids = Array.isArray(entityId) ? entityId : [entityId];
        for (const e of demoServiceEffects(domain, service, data, ids, (id) => states[id])) apply(e.entityId, e.state, e.attributes);
      }
    },
    [callHAService]
  );
  const setOptimistic = useCallback<ServiceCall['setOptimistic']>((entityId, state, attributes) => updateEntityState(entityId, state, attributes), [updateEntityState]);
  return { call, setOptimistic };
}
