/**
 * The live Mobility model and actions: Home Assistant's registry and states through the vehicle
 * adapters (`lib/mobility/adapters`), plus 24 h of speed for each car that reports it (for the
 * day's drives). `act` sends a page action to the vehicle's integration, showing the expected state
 * at once. The owner's vehicle pictures come from classic Mobility's settings. In demo mode (no
 * vehicles in the demo registry) it shows the sample car and bike, whose controls change the sample.
 * Page states: `loading` (nothing from HA yet), `notSetUp` (no vehicle found), `offline` (HA
 * unreachable; `lastSeen` is when the numbers were last live).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useUserConfig } from '@/hooks/useUserConfig';
import { fetchLiveEntityHistory } from '@/services/haHistoryService';
import { haWebSocketService } from '@/services/haWebSocket';
import { applySampleAction, type MobilityAction, type MobilityHome } from '../lib/mobilityHome';
import { studioMobilityHome } from '../lib/mobility/sampleVehicles';
import { buildMobilityHome, mobilityCalls } from '../lib/mobility/adapters';
import { applyVehiclePicture, pictureSource, type PictureSource } from '../lib/mobility/pictures';
import { NO_PICTURE, readCarPictures, withCarPicture } from '../areas/ha/carPictures';
import type { UserDashboardConfig } from '@/types/userConfig';
import type { Vehicle, VehicleMonth } from '../lib/mobilityHome';
import { monthsFromOdometer, type OdometerStat } from '../lib/mobility/vehicleStats';
import { useServiceCall } from '../widgets/shared/useServiceCall';
import { useMinuteTick } from './useMinuteTick';

const QUARTER = 15 * 60_000;

/** Peak speed per quarter hour over the 24 h ending at `end` (96 values, oldest first); the sensor records on change, so the last value carries forward. */
export function quarterHourSpeeds(raw: { state: string; timestamp: number }[], end: number, toKmh: (v: number) => number = (v) => v): number[] {
  const pts = raw
    .map((h) => ({ t: h.timestamp, v: Number.parseFloat(h.state) }))
    .filter((h) => Number.isFinite(h.v) && Number.isFinite(h.t))
    .sort((a, b) => a.t - b.t);
  const out: number[] = [];
  let i = 0;
  let last = 0;
  for (let k = 95; k >= 0; k--) {
    const to = end - k * QUARTER;
    let peak = last;
    while (i < pts.length && pts[i].t <= to) {
      peak = Math.max(peak, pts[i].v);
      last = pts[i].v;
      i++;
    }
    out.push(Math.max(0, Math.round(toKmh(peak))));
  }
  return out;
}

export function useMobilityHome() {
  const { states, registry, devices, zones, connection, loading } = useAutoLayoutStore(
    useShallow((s) => ({ states: s.states, registry: s.rawEntityRegistry, devices: s.rawDevices, zones: s.resolvedZones, connection: s.connectionStatus, loading: s.isLoading }))
  );
  const { config, updateConfig, uploadVehicleAsset } = useUserConfig();
  const choices = useMemo(() => readCarPictures(config.preferences), [config.preferences]);
  const images = useMemo(() => ({ car: config.mobility?.car?.vehicleImageUrl ?? null, bike: config.mobility?.bike?.bikeImageUrl ?? null }), [config.mobility?.car?.vehicleImageUrl, config.mobility?.bike?.bikeImageUrl]);
  const tick = useMinuteTick();
  const [speeds, setSpeeds] = useState<Record<string, number[]>>({});

  const built = useMemo(
    () => buildMobilityHome({ states, registry, devices, zones, now: Date.now(), speeds, images }),
    // `tick` refreshes the "2 min ago" lines on an idle page.
    [states, registry, devices, zones, speeds, images, tick]
  );

  // 24 h of speed for each car that reports it, refreshed every 5 minutes.
  const speedIds = built.sources.map((s) => s.speedEntity).filter((x): x is string => !!x).join(',');
  useEffect(() => {
    if (!speedIds) return;
    let cancelled = false;
    const load = async () => {
      const end = Date.now();
      const next: Record<string, number[]> = {};
      for (const id of speedIds.split(',')) {
        // A little before the window, so the speed held at its start is known.
        const raw = await fetchLiveEntityHistory(id, new Date(end - 30 * 3600_000).toISOString(), new Date(end).toISOString()).catch(() => []);
        const unit = String(useAutoLayoutStore.getState().states[id]?.attributes?.unit_of_measurement ?? '');
        next[id] = raw.length ? quarterHourSpeeds(raw, end, unit === 'm/s' ? (v) => v * 3.6 : undefined) : [];
      }
      if (!cancelled) setSpeeds(next);
    };
    void load();
    const timer = setInterval(() => void load(), 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [speedIds]);

  // Distance by month for Statistics: two years of each odometer's monthly long-term statistics
  // (needs a state_class on the sensor; none means no history and the tiles say so). Hourly.
  const odoIds = built.sources.map((s) => s.odometerEntity).filter((x): x is string => !!x).join(',');
  const [months, setMonths] = useState<Record<string, VehicleMonth[]>>({});
  useEffect(() => {
    if (!odoIds) return;
    let cancelled = false;
    const load = async () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 23, 1);
      const res = await haWebSocketService
        .sendRequest<Record<string, OdometerStat[]>>('recorder/statistics_during_period', { start_time: start.toISOString(), end_time: end.toISOString(), statistic_ids: odoIds.split(','), period: 'month', types: ['change', 'state', 'max'] })
        .catch(() => null);
      if (!cancelled && res) setMonths(Object.fromEntries(Object.entries(res).map(([id, recs]) => [id, monthsFromOdometer(recs ?? [])])));
    };
    void load();
    const timer = setInterval(() => void load(), 3600_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [odoIds]);

  // Demo mode: the sample vehicles, their controls acting on the sample.
  const demo = haWebSocketService.isDemo() && built.home.vehicles.length === 0;
  const [sample, setSample] = useState<MobilityHome>(() => studioMobilityHome('fleet'));

  // When the numbers were last live, for the "HA unreachable" alert.
  const offline = connection === 'disconnected';
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  useEffect(() => {
    if (!offline && built.home.vehicles.length) setLastSeen(Date.now());
  }, [offline, built.home]);

  const { call, setOptimistic } = useServiceCall();
  const latest = useRef(built.sources);
  latest.current = built.sources;
  const act = useCallback(
    (vehicleId: string, a: MobilityAction) => {
      if (demo) {
        setSample((h) => ({ ...h, vehicles: h.vehicles.map((v) => (v.id === vehicleId ? applySampleAction(v, a) : v)) }));
        return;
      }
      for (const c of mobilityCalls(latest.current, vehicleId, a)) {
        if (c.optimistic) setOptimistic(c.entityId, c.optimistic.state, c.optimistic.attributes);
        void call(c.domain, c.service, c.data, c.entityId);
      }
    },
    [call, setOptimistic, demo]
  );

  const liveHome = useMemo(() => {
    const odo = new Map(built.sources.map((s) => [s.vehicle.id, s.odometerEntity]));
    const withHistory = (v: Vehicle): Vehicle => {
      const m = months[odo.get(v.id) ?? ''];
      // shortcut: distance only; efficiency, charging and the allowance need the server's daily snapshot and Customize.
      return m?.length ? { ...v, history: { months: m, allowance: null, price: null } } : v;
    };
    return { ...built.home, vehicles: built.home.vehicles.map((v) => withHistory(applyVehiclePicture(v, choices))) };
  }, [built.home, built.sources, choices, months]);
  const home = demo ? sample : liveHome;

  // The owner's picture per vehicle: the integration's, their own upload, or none. Saved at once.
  const [pictureBusy, setPictureBusy] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const savePicture = useCallback(
    (deviceId: string, choice: string | null) =>
      updateConfig((prev: UserDashboardConfig) => ({ ...prev, preferences: withCarPicture(prev.preferences as Record<string, unknown> | undefined, deviceId, choice) as UserDashboardConfig['preferences'] })),
    [updateConfig]
  );
  const pictures = useMemo(
    () =>
      demo
        ? null
        : {
            source: (v: Vehicle): PictureSource => pictureSource(v, choices),
            hasOwn: (v: Vehicle) => !!v.picture,
            busy: (v: Vehicle) => pictureBusy === v.id,
            error: (v: Vehicle) => (pictureBusy === null && pictureError?.startsWith(`${v.id}|`) ? pictureError.slice(v.id.length + 1) : null),
            choose: (v: Vehicle, s: Exclude<PictureSource, 'upload'>) => {
              if (!v.deviceId) return;
              setPictureError(null);
              void savePicture(v.deviceId, s === 'none' ? NO_PICTURE : null);
            },
            upload: async (v: Vehicle, file: File) => {
              if (!v.deviceId) return;
              setPictureBusy(v.id);
              setPictureError(null);
              try {
                const url = await uploadVehicleAsset(file, `car_${v.deviceId}`.slice(0, 30));
                await savePicture(v.deviceId, url);
              } catch {
                setPictureError(`${v.id}|Could not upload the picture. PNG, JPEG or WebP up to 5 MB; uploading needs an admin.`);
              } finally {
                setPictureBusy(null);
              }
            }
          },
    [demo, choices, pictureBusy, pictureError, savePicture, uploadVehicleAsset]
  );
  const none = home.vehicles.length === 0;
  // Nothing from HA yet: still loading, or connected but the registry not in.
  const waiting = none && !demo && (loading || (!offline && registry.length === 0));
  return { home, act, loading: waiting, notSetUp: none && !waiting && !offline, offline, lastSeen, demo, pictures };
}
