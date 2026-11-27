/**
 * Vehicle tiles · batch 4 · Today (docs/pro-ui/VEHICLE_TILES.md): how much it has been used today:
 * the drives (read from the speed history, so FordPass has them too) and the distance when the
 * integration reports it. Read only.
 * A · Day bar: midnight to now as a bar, each drive a block where it happened; distance big.
 * B · Numbers: distance, drives and time driving, the Reading tile's way.
 * C · Trace: today's speed as a soft area, the drives as its hills.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { clock, type Drive, type Vehicle } from '../../../../lib/mobilityHome';
import { todaysDrives } from '../../home/whereTripsConcepts';
import { Big, IconChip, NOT_ON_CAR, VHUE, type VehicleTileProps } from '../vehicleTileKit';

const DRIVE = VHUE.info;
const midnightOf = (now: number) => new Date(now).setHours(0, 0, 0, 0);

function dayOf(v: Vehicle, now: number) {
  const drives = todaysDrives(v, now);
  const minutes = Math.round(drives.reduce((a, d) => a + (Math.min(d.to, now) - Math.max(d.from, midnightOf(now))) / 60_000, 0));
  // The integration's distance today when it has one; else the drives' rough sum.
  const distance = v.today ?? (drives.length ? Math.round(drives.reduce((a, d) => a + d.distance, 0) * 10) / 10 : null);
  return { drives, minutes, distance, rough: v.today === null };
}

const has = (v: Vehicle) => v.today !== null || !!v.motion?.speeds.length;
const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim());
const drivesWord = (v: Vehicle, n: number) => `${n} ${v.kind === 'bike' ? (n === 1 ? 'ride' : 'rides') : n === 1 ? 'drive' : 'drives'}`;

function Unavailable() {
  return (
    <TileFrame label="Today" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={Calendar03Icon} on={false} />
        <TileName className="mt-auto">Today</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function Row({ v, now }: { v: Vehicle; now: number }) {
  const d = dayOf(v, now);
  return (
    <TileFrame label="Today" className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={Calendar03Icon} hue={DRIVE} on={d.drives.length > 0} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{d.distance !== null ? `${d.rough ? '≈ ' : ''}${d.distance} ${v.unit}` : drivesWord(v, d.drives.length)}</p>
          <TileState className="text-[12px]">{d.drives.length ? `Today · ${drivesWord(v, d.drives.length)}` : 'Not driven today'}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Day bar
// ---------------------------------------------------------------------------------------------

function DayBar({ drives, now, labels }: { drives: Drive[]; now: number; labels: boolean }) {
  const start = midnightOf(now);
  const end = start + 24 * 3_600_000;
  const at = (t: number) => ((Math.max(start, Math.min(end, t)) - start) / (end - start)) * 100;
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_8%,transparent)]">
        <span className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,currentColor_6%,transparent)]" style={{ width: `${at(now)}%` }} />
        {drives.map((d) => (
          <span key={d.from} className="absolute inset-y-0 rounded-full" style={{ left: `${at(d.from)}%`, width: `max(4px, ${at(d.to) - at(d.from)}%)`, background: DRIVE, boxShadow: `0 0 8px -1px ${DRIVE}` }} />
        ))}
        <span className="absolute inset-y-0 w-0.5 bg-current opacity-50" style={{ left: `${at(now)}%` }} />
      </div>
      {labels ? (
        <div className="mt-1 flex justify-between text-[11px] tabular-nums opacity-55">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      ) : null}
    </div>
  );
}

export function TodayBar({ v, size, now }: VehicleTileProps) {
  if (!has(v)) return <Unavailable />;
  if (size === 'xs') return <Row v={v} now={now} />;
  const d = dayOf(v, now);
  return (
    <TileFrame label="Today" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName className="opacity-70">Today</TileName>
        {d.distance !== null ? (
          <Big n={`${d.rough ? '≈' : ''}${d.distance}`} unit={v.unit} className={cn('mt-1', size === 'l' ? 'text-[56px]' : 'text-[28px]')} />
        ) : (
          <p className="mt-1 text-[22px] font-semibold">{drivesWord(v, d.drives.length)}</p>
        )}
        <TileState className="mt-0.5">{d.drives.length ? `${drivesWord(v, d.drives.length)} · ${dur(d.minutes)}` : 'Not driven today'}</TileState>
        <div className="mt-auto">
          <DayBar drives={d.drives} now={now} labels={size === 'l'} />
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Numbers
// ---------------------------------------------------------------------------------------------

export function TodayNumbers({ v, size, now }: VehicleTileProps) {
  if (!has(v)) return <Unavailable />;
  if (size === 'xs') return <Row v={v} now={now} />;
  const d = dayOf(v, now);
  const stats = [
    { label: 'Distance', value: d.distance !== null ? `${d.rough ? '≈ ' : ''}${d.distance} ${v.unit}` : '—' },
    { label: v.kind === 'bike' ? 'Rides' : 'Drives', value: String(d.drives.length) },
    { label: 'Time', value: d.minutes ? dur(d.minutes) : '—' }
  ];
  const last = d.drives.at(-1);
  return (
    <TileFrame label="Today" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Calendar03Icon} size={16} className="opacity-60" />
          <TileName>Today</TileName>
        </div>
        <dl className={cn('mt-auto grid gap-x-4 gap-y-2', size === 's' ? 'grid-cols-1' : 'grid-cols-3')}>
          {(size === 's' ? stats.slice(0, 2) : stats).map((s) => (
            <div key={s.label} className={cn(size === 's' && 'flex items-baseline justify-between gap-2')}>
              <dt className="text-[12px] opacity-60">{s.label}</dt>
              <dd className={cn('whitespace-nowrap font-semibold tabular-nums tracking-[-0.02em]', size === 'l' ? 'text-[24px]' : size === 's' ? 'text-[17px]' : 'text-[20px]')}>{s.value}</dd>
            </div>
          ))}
        </dl>
        {size === 'l' && last ? <TileState className="mt-3">Last out {clock(last.from)}–{clock(last.to)}</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Trace
// ---------------------------------------------------------------------------------------------

/** Today's speed, one point per 15 min from midnight, as a soft area. */
function Trace({ v, now, height }: { v: Vehicle; now: number; height: number }) {
  const sp = v.motion?.speeds ?? [];
  const slot = 15 * 60_000;
  const start = now - (sp.length - 1) * slot;
  const mid = midnightOf(now);
  const today = sp.map((s, i) => ({ t: start + i * slot, s })).filter((p) => p.t >= mid);
  const top = Math.max(30, ...today.map((p) => p.s));
  const W = 300;
  const x = (t: number) => ((t - mid) / (24 * 3_600_000)) * W;
  const y = (s: number) => height - 2 - (s / top) * (height - 6);
  const pts = today.map((p) => `${x(p.t).toFixed(1)},${y(p.s).toFixed(1)}`);
  const line = pts.length ? `M ${pts.join(' L ')}` : '';
  const area = pts.length ? `${line} L ${x(today.at(-1)!.t).toFixed(1)},${height} L ${x(today[0].t).toFixed(1)},${height} Z` : '';
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="today-trace" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={DRIVE} stopOpacity={0.35} />
          <stop offset="1" stopColor={DRIVE} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={0} x2={W} y1={height - 1} y2={height - 1} stroke="currentColor" strokeOpacity={0.12} />
      {area ? <path d={area} fill="url(#today-trace)" /> : null}
      {line ? <path d={line} fill="none" stroke={DRIVE} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" /> : null}
      <line x1={x(now)} x2={x(now)} y1={0} y2={height} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function TodayTrace({ v, size, now }: VehicleTileProps) {
  if (!has(v)) return <Unavailable />;
  if (size === 'xs') return <Row v={v} now={now} />;
  const d = dayOf(v, now);
  const top = d.drives.length ? Math.max(...d.drives.map((x) => x.top)) : null;
  return (
    <TileFrame label="Today" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Today</TileName>
          <span className="shrink-0 text-[13px] font-semibold tabular-nums">{d.distance !== null ? `${d.rough ? '≈ ' : ''}${d.distance} ${v.unit}` : drivesWord(v, d.drives.length)}</span>
        </div>
        <div className="mt-auto">
          {v.motion?.speeds.length ? <Trace v={v} now={now} height={size === 'l' ? 150 : size === 's' ? 56 : 64} /> : <TileState>No speed history</TileState>}
          {size !== 's' ? (
            <TileState className="mt-1.5">{d.drives.length ? `${drivesWord(v, d.drives.length)} · ${dur(d.minutes)}${top ? ` · top ${Math.round(top)} ${v.unit === 'mi' ? 'mph' : 'km/h'}` : ''}` : 'Not driven today'}</TileState>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}
