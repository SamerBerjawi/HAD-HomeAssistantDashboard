/**
 * Toggle / batch / brightness actions for the Lights and Switches widgets (Overview rebuild,
 * Phase 1). Same behaviour as the old `useProOverviewActions` control handlers.
 */
import { useCallback, useMemo, useRef } from 'react';
import type { ProControlDomainModel, ProControlItem } from '../../lib/overviewControls';
import { useServiceCall } from '../shared/useServiceCall';

export interface ControlActions {
  toggleItem: (item: ProControlItem) => void;
  toggleAll: (forceOn: boolean) => Promise<void>;
  setBrightness: (entityId: string, pct: number) => void;
}

const onData = (item: ProControlItem): Record<string, unknown> =>
  item.domain === 'light' && item.supportsBrightness ? { brightness_pct: item.brightnessPct && item.brightnessPct > 0 ? item.brightnessPct : 80 } : {};

export function useControlActions(model: ProControlDomainModel): ControlActions {
  const { call, setOptimistic } = useServiceCall();
  // The batch reads the latest items without re-creating the handler on every state change.
  const itemsRef = useRef(model.items);
  itemsRef.current = model.items;

  const toggleItem = useCallback(
    (item: ProControlItem) => {
      const nextOn = !item.isOn;
      const data = nextOn ? onData(item) : {};
      setOptimistic(item.entityId, nextOn ? 'on' : 'off', data);
      void call(item.domain, nextOn ? 'turn_on' : 'turn_off', data, item.entityId);
    },
    [call, setOptimistic]
  );

  const toggleAll = useCallback(
    async (forceOn: boolean) => {
      const targets = itemsRef.current.filter((item) => (forceOn ? !item.isOn : item.isOn));
      for (const item of targets) setOptimistic(item.entityId, forceOn ? 'on' : 'off', forceOn ? onData(item) : {});
      for (const item of targets) await call(item.domain, forceOn ? 'turn_on' : 'turn_off', forceOn ? onData(item) : {}, item.entityId);
    },
    [call, setOptimistic]
  );

  const setBrightness = useCallback(
    (entityId: string, brightnessPct: number) => {
      const pct = Math.max(1, Math.min(100, Math.round(brightnessPct)));
      setOptimistic(entityId, 'on', { brightness_pct: pct, brightness: Math.round((pct / 100) * 255) });
      void call('light', 'turn_on', { brightness_pct: pct }, entityId);
    },
    [call, setOptimistic]
  );

  return useMemo(() => ({ toggleItem, toggleAll, setBrightness }), [toggleItem, toggleAll, setBrightness]);
}
