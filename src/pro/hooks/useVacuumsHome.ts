/**
 * The live Vacuums model and actions (docs/pro-ui/VACUUM_TILES.md): Home Assistant's registry and
 * states through the cleaner adapters (`lib/vacuums/adapters`). `act` sends a page action to the
 * cleaner's integration, showing the expected state at once. In demo mode (no cleaners in the demo
 * registry) it shows the sample robot and stick, whose buttons change the sample.
 * Page states: `loading` (nothing from HA yet), `notSetUp` (no cleaner found), `offline` (HA
 * unreachable; `lastSeen` is when the page was last live).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { haWebSocketService } from '@/services/haWebSocket';
import { applySampleAction, type Cleaner, type CleanerAction } from '../lib/vacuums/cleaner';
import { cleanerSources } from '../lib/vacuums/adapters';
import { cleanerSamples } from '../lib/vacuums/samples';
import { useServiceCall } from '../widgets/shared/useServiceCall';
import { useMinuteTick } from './useMinuteTick';

export function useVacuumsHome() {
  const { states, registry, devices, connection, loading } = useAutoLayoutStore(
    useShallow((s) => ({ states: s.states, registry: s.rawEntityRegistry, devices: s.rawDevices, connection: s.connectionStatus, loading: s.isLoading }))
  );
  const tick = useMinuteTick();
  // `tick` refreshes the "2 h ago" lines on an idle page.
  const now = useMemo(() => Date.now(), [tick]);
  const sources = useMemo(() => cleanerSources({ states, registry: registry ?? [], devices: devices ?? [], zones: [], now }), [states, registry, devices, now]);

  // Demo mode: the sample robot and stick, their buttons acting on the sample.
  const demo = haWebSocketService.isDemo() && sources.length === 0;
  const [sample, setSample] = useState<Cleaner[]>(() => ['cleaning', 'stick-home'].map((id) => cleanerSamples().find((s) => s.id === id)!.c));

  const offline = connection === 'disconnected';
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  useEffect(() => {
    if (!offline && sources.length) setLastSeen(Date.now());
  }, [offline, sources]);

  const { call, setOptimistic } = useServiceCall();
  const latest = useRef(sources);
  latest.current = sources;
  const act = useCallback(
    (cleanerId: string, a: CleanerAction) => {
      if (demo) {
        setSample((cs) => cs.map((c) => (c.id === cleanerId ? applySampleAction(c, a) : c)));
        return;
      }
      for (const c of latest.current.find((s) => s.cleaner.id === cleanerId)?.calls(a) ?? []) {
        if (c.optimistic) setOptimistic(c.entityId, c.optimistic.state, c.optimistic.attributes);
        void call(c.domain, c.service, c.data, c.entityId);
      }
    },
    [call, setOptimistic, demo]
  );

  const cleaners = demo ? sample : sources.map((s) => s.cleaner);
  const none = cleaners.length === 0;
  const waiting = none && !demo && (loading || (!offline && !registry?.length));
  return { cleaners, now, act, loading: waiting, notSetUp: none && !waiting && !offline, offline, lastSeen, demo };
}
