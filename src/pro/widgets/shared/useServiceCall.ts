/**
 * Stable HA service helpers for widget action hooks (Overview rebuild, Phase 1).
 * `call` swallows errors: the service slice already reports them with a toast.
 */
import { useCallback } from 'react';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';

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
    },
    [callHAService]
  );
  const setOptimistic = useCallback<ServiceCall['setOptimistic']>(
    (entityId, state, attributes) => updateEntityState(entityId, state, attributes),
    [updateEntityState]
  );
  return { call, setOptimistic };
}
