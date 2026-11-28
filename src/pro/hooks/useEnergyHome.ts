/**
 * Live data for the restarted Energy page (docs/pro-ui/ENERGY.md §0): today from `useEnergyData`,
 * the last seven days, this month and this year fetched alongside it, today's grid carbon history,
 * mapped into the page model by `buildEnergyHome`. Also publishes the Overview energy model, as the
 * old page did, so the Energy widgets stay current while this page is open.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEnergyData } from '@/hooks/useEnergyData';
import { transformEnergyStatistics, type TransformedEnergyModel } from '@/services/energyDataTransformer';
import { computePeriodTimeRange, fetchHAEnergyStatistics, fetchHAStatisticsMetadata, type EnergyHistoryPeriod } from '@/services/haEnergyStatistics';
import { fetchLiveEntityHistory } from '@/services/haHistoryService';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { EnergyHome, Period } from '../lib/energyHome';
import { buildEnergyHome, findCo2Entity } from '../lib/energyHomeLive';
import { buildOverviewEnergyModel } from '../lib/overviewEnergy';
import { useEnergyStore } from '../widgets/energy/energyStore';
import { useMinuteTick } from './useMinuteTick';

type Past = Exclude<Period, 'day'>;
const PAST: { id: Past; period: EnergyHistoryPeriod }[] = [
  { id: 'week', period: '7d' },
  { id: 'month', period: 'month' },
  { id: 'year', period: 'year' }
];
const SLOW_REFRESH_MS = 10 * 60_000;

export interface EnergyHomeState {
  home: EnergyHome;
  /** First load, nothing to show yet. */
  loading: boolean;
  /** Energy is not configured in Home Assistant. */
  notSetUp: boolean;
  /** Home Assistant is unreachable after the page had loaded; `home` holds the last known numbers. */
  offline: boolean;
  /** The first load failed (HA unreachable before anything was shown). */
  failed: boolean;
  lastSeen: number;
  refresh: () => void;
}

export function useEnergyHome(): EnergyHomeState {
  const energy = useEnergyData({ autoRefreshIntervalMs: 5 * 60_000 });
  const { states, resolvedEntities, areas, floors, isLiveMode, connectionStatus } = useAutoLayoutStore(
    useShallow((s) => ({ states: s.states, resolvedEntities: s.resolvedEntities, areas: s.areas, floors: s.floors, isLiveMode: s.isLiveMode, connectionStatus: s.connectionStatus }))
  );
  const tick = useMinuteTick(60_000);
  const [nonce, setNonce] = useState(0);
  const [periods, setPeriods] = useState<Partial<Record<Past, TransformedEnergyModel>>>({});
  const [co2History, setCo2History] = useState<{ state: string; timestamp: number }[]>([]);

  const ready = energy.loadState === 'ready' && energy.preferences !== null && energy.resolvedEntityIds !== null;
  const { preferences, resolvedEntityIds: ids, currency } = energy;

  // The periods behind today: fetched once Energy is ready, then every ten minutes.
  useEffect(() => {
    if (!ready || !preferences || !ids || ids.allStatisticIds.length === 0) return;
    let cancelled = false;
    const load = async () => {
      try {
        const meta = await fetchHAStatisticsMetadata(undefined, ids.allStatisticIds);
        const now = new Date();
        const models = await Promise.all(
          PAST.map(async ({ id, period }) => {
            const range = computePeriodTimeRange(period, now);
            const start = new Date(range.start).getTime();
            const end = new Date(range.end).getTime();
            const stats = await fetchHAEnergyStatistics(undefined, ids.allStatisticIds, period, now, undefined, undefined, false, range.periodType);
            const model = transformEnergyStatistics(preferences, stats, meta ?? {}, null, {
              currencySymbol: currency,
              periodType: range.periodType,
              daysInPeriod: Math.max(1, Math.round((end - start) / 86400_000)),
              states: useAutoLayoutStore.getState().states ?? {},
              startTimeMs: start,
              endTimeMs: end
            });
            return [id, model] as const;
          })
        );
        if (!cancelled) setPeriods(Object.fromEntries(models));
      } catch (err) {
        console.warn('[Energy] Could not load week, month and year statistics', err);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), SLOW_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ready, preferences, ids, currency, nonce]);

  // Today's grid carbon, for the carbon lane (Electricity Maps keeps no forecast, so past hours only).
  const co2Id = useMemo(() => findCo2Entity(states), [states]);
  useEffect(() => {
    if (!co2Id) return;
    let cancelled = false;
    const load = () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      fetchLiveEntityHistory(co2Id, midnight.toISOString())
        .then((points) => {
          if (!cancelled) setCo2History(points);
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, SLOW_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [co2Id, nonce]);

  // `tick` re-dates "now" every minute (the Now line, past and future hours).
  const now = useMemo(() => Date.now(), [tick, energy.model, energy.realtime]);
  const home = useMemo(
    () => buildEnergyHome({ now, currency, day: energy.model, periods, realtime: energy.realtime, states, resolvedEntities, ids, co2History }),
    [now, currency, energy.model, periods, energy.realtime, states, resolvedEntities, ids, co2History]
  );

  // Keep the Overview's Energy widgets current while this page owns the energy fetch.
  const publish = useEnergyStore((s) => s.publish);
  const published = useRef('');
  const overview = useMemo(() => buildOverviewEnergyModel({ ...energy, resolvedEntities, areas, floors }), [energy, resolvedEntities, areas, floors]);
  useEffect(() => {
    const key = JSON.stringify(overview);
    if (key === published.current) return;
    published.current = key;
    publish({ model: overview });
  }, [overview, publish]);
  useEffect(() => {
    publish({ load: energy.loadState, setPeriod: energy.setPeriod });
  }, [energy.loadState, energy.setPeriod, publish]);

  const connected = !isLiveMode || connectionStatus === 'connected';
  const lastSeenRef = useRef(Date.now());
  if (connected && energy.hasLoadedInitial) lastSeenRef.current = now;

  const energyRefresh = energy.refresh;
  const refresh = useCallback(() => {
    void energyRefresh();
    setNonce((n) => n + 1);
  }, [energyRefresh]);

  return {
    home,
    loading: !energy.hasLoadedInitial && energy.loadState !== 'unconfigured' && energy.loadState !== 'error',
    notSetUp: energy.loadState === 'unconfigured',
    offline: (!connected || energy.loadState === 'error') && energy.hasLoadedInitial,
    failed: energy.loadState === 'error' && !energy.hasLoadedInitial,
    lastSeen: lastSeenRef.current,
    refresh
  };
}
