/**
 * Mobility round 4: Where and Trips inside B (docs/pro-ui/MOBILITY.md §0). Where it is now and
 * where it has been: the map, the zone and address, today's drives (read from the speed history)
 * and the last trip or ride. Three ways: tidy cards, the day on the map, or a journey log.
 */
import { lazy, Suspense } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon, Route01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ago, clock, drivesFromSpeeds, fmtDistance, type Drive, type Vehicle } from '../../../lib/mobilityHome';
import { Block, placeMood, soft, Stat, TONE, type VehicleProps } from './parts';

const CarMap = lazy(() => import('../../../widgets/car/concepts/CarMap'));

type Props = VehicleProps & { className?: string };

// ---------------------------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------------------------

const whereWord = (v: Vehicle) => (v.motion?.moving ? 'On the move' : v.place?.zone ? `At ${v.place.zone}` : 'Away');

function MapBox({ v, dark, height, className }: { v: Vehicle; dark: boolean; height: number; className?: string }) {
  const p = v.place;
  if (!p) return null;
  return (
    <div className={cn('overflow-hidden rounded-2xl', className)} style={{ height, background: soft(6) }}>
      <Suspense fallback={null}>
        <CarMap lat={p.lat} lon={p.lon} dark={dark} label={`${v.name}: ${whereWord(v)}`} className="h-full w-full" />
      </Suspense>
    </div>
  );
}

/** Drives that touch today (since midnight). */
export function todaysDrives(v: Vehicle, now: number): Drive[] {
  if (!v.motion?.speeds.length) return [];
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return drivesFromSpeeds(v.motion.speeds, now).filter((d) => d.to > midnight.getTime());
}

function tripFacts(v: Vehicle) {
  const t = v.lastTrip;
  if (!t) return [];
  return [
    { label: 'Distance', value: `${t.distance.toFixed(1)} ${v.unit}` },
    { label: 'Time', value: `${t.minutes} min` },
    t.energyKwh !== null ? { label: 'Energy', value: `${t.energyKwh.toFixed(1)} kWh` } : t.calories !== null ? { label: 'Burned', value: `${t.calories} kcal` } : null,
    t.co2SavedKg !== null ? { label: 'CO₂ saved', value: `${t.co2SavedKg} kg` } : null
  ].filter((x): x is { label: string; value: string } => x !== null);
}

function totals(v: Vehicle) {
  return [
    v.today !== null ? { label: 'Today', value: `${v.today.toFixed(1)} ${v.unit}` } : null,
    v.odometer !== null ? { label: v.kind === 'bike' ? 'Ridden' : 'Odometer', value: fmtDistance(v.odometer, v.unit) } : null,
    v.lifetime?.co2SavedKg != null ? { label: 'CO₂ saved, lifetime', value: `${v.lifetime.co2SavedKg} kg` } : null,
    v.lifetime?.hours != null ? { label: 'Time ridden', value: `${v.lifetime.hours} h` } : null
  ].filter((x): x is { label: string; value: string } => x !== null);
}

const hairline = 'border-[color-mix(in_oklab,var(--foreground)_10%,transparent)]';

// ---------------------------------------------------------------------------------------------
// 1 · Tidy cards
// ---------------------------------------------------------------------------------------------

/** 1 · Where: the map, then the zone and address and when it last reported. No speed chart (Trips has the day). */
export function WhereTidy({ v, home, dark, className }: Props) {
  const p = v.place;
  if (!p) return null;
  return (
    <Block title="Where" icon={Location01Icon} aside={p.at ? ago(p.at, home.now) : undefined} className={className}>
      <MapBox v={v} dark={dark} height={180} />
      <div className="-mt-1 flex items-baseline justify-between gap-3">
        <p className="truncate text-[15px]">{whereWord(v)}</p>
        {p.address ? <p className="truncate text-sm text-muted">{p.address}</p> : null}
      </div>
    </Block>
  );
}

/** 1 · Trips: the last trip or ride in big numbers, today's drives as a count, the totals under a hairline. */
export function TripsTidy({ v, home, className }: Props) {
  const t = v.lastTrip;
  const drives = todaysDrives(v, home.now);
  const tot = totals(v);
  if (!t && !tot.length) return null;
  return (
    <Block title={v.kind === 'bike' ? 'Rides' : 'Trips'} icon={Route01Icon} aside={t ? `last ${ago(t.endedAt, home.now)}` : undefined} className={className}>
      {t ? (
        <div className="flex flex-col gap-2">
          <p className="text-[15px]">
            {t.title ?? (v.kind === 'bike' ? 'Last ride' : 'Last trip')}
            <span className="text-muted"> · ended {clock(t.endedAt)}</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {tripFacts(v).slice(0, 3).map((f) => (
              <Stat key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      ) : null}
      <div className={cn('grid grid-cols-3 gap-3 border-t pt-3', hairline)}>
        {drives.length ? <Stat label="Drives today" value={String(drives.length)} /> : null}
        {tot.slice(0, drives.length ? 2 : 3).map((f) => (
          <Stat key={f.label} label={f.label} value={f.value} />
        ))}
      </div>
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------
// 2 · The day on the map
// ---------------------------------------------------------------------------------------------

/** Today as a 24 h bar, each drive a block, a tick at now. */
function DayBar({ drives, now }: { drives: Drive[]; now: number }) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const f = (t: number) => Math.max(0, Math.min(1, (t - midnight.getTime()) / 86400_000)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-6 rounded-lg" style={{ background: soft(6) }} role="img" aria-label={`${drives.length} drives today`}>
        {drives.map((d) => (
          <span key={d.from} className="absolute inset-y-1 rounded-md bg-[var(--accent)]" style={{ left: `${f(d.from)}%`, width: `max(4px, ${f(d.to) - f(d.from)}%)` }} />
        ))}
        <span className="absolute -inset-y-1 w-0.5 rounded-full bg-[var(--foreground)]" style={{ left: `${f(now)}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-muted tabular-nums">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

function DriveRow({ d, v }: { d: Drive; v: Vehicle }) {
  return (
    <li className="flex flex-col text-sm @[400px]:flex-row @[400px]:items-baseline @[400px]:justify-between @[400px]:gap-3">
      <span className="tabular-nums">
        {clock(d.from)} – {clock(d.to)}
      </span>
      <span className="text-xs text-muted tabular-nums @[400px]:text-sm">
        about {d.distance.toFixed(0)} {v.unit} · top {Math.round(d.top)} {v.unit === 'mi' ? 'mph' : 'km/h'}
      </span>
    </li>
  );
}

/**
 * 2 · The day on the map: one wide card. The map large on the left (on top on phones); beside it
 * where it is, today as a 24-hour bar with each drive marked, the drives listed, and the last trip
 * under a hairline.
 */
export function DayOnMap({ v, home, width, dark, className }: Props) {
  const p = v.place;
  if (!p && !v.lastTrip) return null;
  const phone = width < 640;
  const drives = todaysDrives(v, home.now);
  const t = v.lastTrip;
  return (
    <Block title="Where and today" icon={Location01Icon} aside={p?.at ? `seen ${ago(p.at, home.now)}` : undefined} className={className} mood={placeMood(v)}>
      <div className={cn('grid gap-5', phone ? 'grid-cols-1' : 'grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]')}>
        <MapBox v={v} dark={dark} height={phone ? 180 : 250} />
        <div className="flex min-w-0 flex-col gap-4">
          {p ? (
            <div>
              <p className="text-[19px] font-light">{whereWord(v)}</p>
              {p.address ? <p className="truncate text-sm text-muted">{p.address}</p> : null}
            </div>
          ) : null}
          {v.motion ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{drives.length ? `${drives.length} drive${drives.length > 1 ? 's' : ''} today` : 'Not driven today'}</p>
              <DayBar drives={drives} now={home.now} />
              {drives.length ? (
                <ul className="flex flex-col gap-1">
                  {drives.slice(-3).map((d) => (
                    <DriveRow key={d.from} d={d} v={v} />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {t ? (
            <div className={cn('flex flex-col gap-2 border-t pt-3', hairline)}>
              <p className="text-sm text-muted">
                {t.title ?? `Last ${v.kind === 'bike' ? 'ride' : 'trip'}`}, ended {clock(t.endedAt)}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {tripFacts(v).slice(0, 3).map((f) => (
                  <Stat key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------
// 3 · Journey log
// ---------------------------------------------------------------------------------------------

/** 3 · Where, small: a round map thumbnail beside the zone, the address and when it last reported. */
export function WhereCompact({ v, home, dark, className }: Props) {
  const p = v.place;
  if (!p) return null;
  return (
    <Block title="Where" icon={Location01Icon} className={className}>
      <div className="flex items-center gap-4">
        <MapBox v={v} dark={dark} height={88} className="w-[88px] shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="text-[19px] font-light">{whereWord(v)}</p>
          {p.address ? <p className="truncate text-sm text-muted">{p.address}</p> : null}
          {p.at ? <p className="text-xs text-muted">seen {ago(p.at, home.now)}</p> : null}
        </div>
      </div>
    </Block>
  );
}

/** 3 · Trips as a log: today's drives and the last trip as a timeline, newest first, the totals at the foot. */
export function TripsLog({ v, home, className }: Props) {
  const drives = todaysDrives(v, home.now).reverse();
  const t = v.lastTrip;
  const tot = totals(v);
  if (!t && !drives.length && !tot.length) return null;
  const entries = [
    ...drives.map((d) => ({ id: `d${d.from}`, at: d.to, title: `${clock(d.from)} – ${clock(d.to)}`, sub: `about ${d.distance.toFixed(0)} ${v.unit} · top ${Math.round(d.top)} ${v.unit === 'mi' ? 'mph' : 'km/h'}`, live: d.to > home.now - 15 * 60_000 && !!v.motion?.moving })),
    ...(t && !drives.some((d) => Math.abs(d.to - t.endedAt) < 30 * 60_000)
      ? [{ id: 'last', at: t.endedAt, title: t.title ?? `${v.kind === 'bike' ? 'Ride' : 'Trip'} ended ${clock(t.endedAt)}`, sub: tripFacts(v).map((f) => f.value).join(' · '), live: false }]
      : [])
  ].slice(0, 4);
  return (
    <Block title={v.kind === 'bike' ? 'Rides' : 'Trips'} icon={Route01Icon} aside={drives.length ? `${drives.length} today` : undefined} className={className}>
      {entries.length ? (
        <ol className="flex flex-col">
          {entries.map((e, i) => (
            <li key={e.id} className="relative flex gap-3 pb-3 last:pb-0">
              <span className="relative flex w-3 shrink-0 justify-center">
                <span className="mt-1.5 size-2.5 rounded-full" style={{ background: e.live ? TONE.info : i === 0 ? 'var(--accent)' : soft(30) }} />
                {i < entries.length - 1 ? <span className="absolute bottom-0 top-5 w-px" style={{ background: soft(14) }} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] tabular-nums">
                  {e.title}
                  {e.live ? <span className="text-muted"> · now</span> : <span className="text-muted"> · {ago(e.at, home.now)}</span>}
                </span>
                <span className="block truncate text-xs text-muted">{e.sub}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {tot.length ? (
        <div className={cn('grid grid-cols-3 gap-3 border-t pt-3', hairline)}>
          {tot.slice(0, 3).map((f) => (
            <Stat key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      ) : null}
    </Block>
  );
}
