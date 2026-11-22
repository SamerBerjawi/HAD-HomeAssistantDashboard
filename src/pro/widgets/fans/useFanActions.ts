/** Fan actions (rebuild, Phase 3a). Same behaviour as the old Overview fan handlers. */
import { useCallback, useMemo, useRef } from 'react';
import type { ProFanItem, ProFansModel } from '../../lib/overviewAppliances';
import { useServiceCall } from '../shared/useServiceCall';

const resumePct = (fan: ProFanItem) => (fan.percentage > 0 ? fan.percentage : 66);

export function useFanActions(model: ProFansModel) {
  const { call, setOptimistic } = useServiceCall();
  const itemsRef = useRef(model.items);
  itemsRef.current = model.items;

  const toggleFan = useCallback(
    (fan: ProFanItem) => {
      const nextOn = !fan.isOn;
      const pct = nextOn ? resumePct(fan) : 0;
      setOptimistic(fan.entityId, nextOn ? 'on' : 'off', { percentage: pct });
      void call('fan', nextOn ? 'turn_on' : 'turn_off', nextOn ? { percentage: pct } : {}, fan.entityId);
    },
    [call, setOptimistic]
  );
  const toggleAll = useCallback(
    async (forceOn: boolean) => {
      const targets = itemsRef.current.filter((fan) => (forceOn ? !fan.isOn : fan.isOn));
      for (const fan of targets) setOptimistic(fan.entityId, forceOn ? 'on' : 'off', { percentage: forceOn ? resumePct(fan) : 0 });
      for (const fan of targets) await call('fan', forceOn ? 'turn_on' : 'turn_off', forceOn ? { percentage: resumePct(fan) } : {}, fan.entityId);
    },
    [call, setOptimistic]
  );
  const setSpeed = useCallback(
    (entityId: string, percentage: number) => {
      const pct = Math.max(0, Math.min(100, Math.round(percentage)));
      setOptimistic(entityId, pct === 0 ? 'off' : 'on', { percentage: pct });
      void call('fan', pct === 0 ? 'turn_off' : 'set_percentage', pct === 0 ? {} : { percentage: pct }, entityId);
    },
    [call, setOptimistic]
  );
  const toggleOscillate = useCallback(
    (fan: ProFanItem) => {
      setOptimistic(fan.entityId, null, { oscillating: !fan.oscillating });
      void call('fan', 'oscillate', { oscillating: !fan.oscillating }, fan.entityId);
    },
    [call, setOptimistic]
  );
  const toggleDirection = useCallback(
    (fan: ProFanItem) => {
      const direction = fan.direction === 'reverse' ? 'forward' : 'reverse';
      setOptimistic(fan.entityId, null, { direction });
      void call('fan', 'set_direction', { direction }, fan.entityId);
    },
    [call, setOptimistic]
  );
  const setPreset = useCallback(
    (entityId: string, presetMode: string) => {
      setOptimistic(entityId, 'on', { preset_mode: presetMode });
      void call('fan', 'set_preset_mode', { preset_mode: presetMode }, entityId);
    },
    [call, setOptimistic]
  );
  return useMemo(
    () => ({ toggleFan, toggleAll, setSpeed, toggleOscillate, toggleDirection, setPreset }),
    [toggleFan, toggleAll, setSpeed, toggleOscillate, toggleDirection, setPreset]
  );
}
