/**
 * Vehicle tiles · batch 7 · Allowance (docs/pro-ui/VEHICLE_TILES.md): a lease's mileage
 * allowance (set by the owner: per year, years, start) against the odometer. Cars only; read only.
 * A · Pace: the contract as a bar, used so far against a tick at what is allowed by today.
 * B · Projection: the allowance as a straight line, the odometer over it, where it ends at this pace.
 * C · Budget: what is left per day to finish within the allowance.
 */
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Vehicle } from '../../../../lib/mobilityHome';
import { allowancePace } from '../../../../lib/mobility/vehicleStats';
import { Big, OK, WARN, type VehicleTileProps } from '../vehicleTileKit';
import { ACCENT, FAINT, n0, pad, StatsRow, StatsUnavailable } from './statsTileKit';

const TITLE = 'Allowance';
const none = <StatsUnavailable title={TITLE} icon={Calendar03Icon} text="Set a yearly allowance" />;
const when = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

function pace(v: Vehicle, now: number) {
  const p = v.history ? allowancePace(v.history, v.odometer, now) : null;
  if (!p) return null;
  // Within 2 % of the allowance by today counts as on pace.
  const on = Math.abs(p.ahead) < p.total * 0.02;
  const word = on ? 'On pace' : p.ahead > 0 ? `${n0(p.ahead)} ${v.unit} over pace` : `${n0(-p.ahead)} ${v.unit} under`;
  return { ...p, on, word, hue: p.ahead > p.total * 0.02 ? WARN : OK };
}

// ---------------------------------------------------------------------------------------------
// A · Pace
// ---------------------------------------------------------------------------------------------

export function AllowancePace({ v, size, now }: VehicleTileProps) {
  const p = pace(v, now);
  if (!p) return none;
  if (size === 'xs') return <StatsRow title={TITLE} icon={Calendar03Icon} hue={p.hue} value={p.word} label={`${n0(p.used)} of ${n0(p.total)} ${v.unit}`} />;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <TileName>{TITLE}</TileName>
        <p className={cn('mt-1 font-semibold leading-tight tracking-[-0.02em]', size === 'l' ? 'text-[28px]' : 'text-[18px]', size === 's' && 'line-clamp-2')} style={{ color: p.hue }}>
          {p.word}
        </p>
        {size !== 's' ? <TileState>{`${n0(p.used)} of ${n0(p.total)} ${v.unit} · ends ${when(p.end)}`}</TileState> : null}
        <div className="mt-auto">
          <div className="relative h-3 rounded-full" style={{ background: FAINT }}>
            <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (p.used / p.total) * 100)}%`, background: p.on || p.ahead < 0 ? ACCENT : p.hue }} />
            <span className="absolute -inset-y-1 w-0.5 rounded-full bg-[var(--foreground)]" style={{ left: `${p.elapsed * 100}%` }} aria-hidden />
          </div>
          {size !== 's' ? (
            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums opacity-60">
              <span>{`Today’s mark ${n0(p.allowedNow)}`}</span>
              <span>{n0(p.total)}</span>
            </div>
          ) : (
            <p className="mt-1 text-[11px] tabular-nums opacity-60">{`${n0(p.used)} / ${n0(p.total)}`}</p>
          )}
          {size === 'l' && p.over !== null ? <TileState className="mt-2">{p.over > 0 ? `At this pace, ${n0(p.over)} ${v.unit} over at the end` : `At this pace, ${n0(-p.over)} ${v.unit} to spare at the end`}</TileState> : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Projection
// ---------------------------------------------------------------------------------------------

export function AllowanceProjection({ v, size, now }: VehicleTileProps) {
  const p = pace(v, now);
  if (!p) return none;
  if (size === 'xs') return <StatsRow title={TITLE} icon={Calendar03Icon} hue={p.hue} value={p.projected !== null ? `≈ ${n0(p.projected)} ${v.unit}` : p.word} label={`at the end · of ${n0(p.total)}`} />;
  const a = v.history!.allowance!;
  const W = 100;
  const H = 40;
  const top = Math.max(p.total, p.projected ?? 0) * 1.05;
  const x = (t: number) => ((t - a.since) / (p.end - a.since)) * W;
  const y = (d: number) => H - (d / top) * H;
  // The odometer's path: each month's total since the start, ending at today's reading.
  let run = 0;
  const pts = v.history!.months
    .filter((m) => new Date(m.start).getFullYear() * 12 + new Date(m.start).getMonth() >= new Date(a.since).getFullYear() * 12 + new Date(a.since).getMonth())
    .map((m) => {
      run += m.distance;
      const endOfMonth = new Date(new Date(m.start).getFullYear(), new Date(m.start).getMonth() + 1, 1).getTime();
      return `${x(Math.min(endOfMonth, now))},${y(run)}`;
    });
  const actual = `M0,${H} L${pts.join(' L')} L${x(now)},${y(p.used)}`;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>{TITLE}</TileName>
          {size !== 's' ? <span className="text-[12px] tabular-nums opacity-60">{`${n0(a.perYear)} ${v.unit} a year`}</span> : null}
        </div>
        <p className={cn('mt-1 font-semibold leading-tight tracking-[-0.02em] tabular-nums', size === 'l' ? 'text-[28px]' : 'text-[18px]')} style={{ color: p.hue }}>
          {p.over === null ? p.word : p.over > 0 ? `≈ ${n0(p.over)} over` : `≈ ${n0(-p.over)} to spare`}
        </p>
        {size !== 'w' ? <TileState>{size === 's' ? `at the end, ${when(p.end)}` : `At this pace, at the end in ${when(p.end)}`}</TileState> : null}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-auto h-[42%] min-h-[30px] w-full overflow-visible" aria-hidden>
          <line x1={0} y1={H} x2={W} y2={y(p.total)} stroke={FAINT} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          {p.projected !== null ? <line x1={x(now)} y1={y(p.used)} x2={W} y2={y(p.projected)} stroke={p.hue} strokeWidth={2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" /> : null}
          <path d={actual} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {size !== 's' ? (
          <div className="mt-1 flex justify-between text-[11px] tabular-nums opacity-60">
            <span>{when(a.since)}</span>
            <span>{size === 'l' ? 'allowance · driven · at this pace' : 'today'}</span>
            <span>{when(p.end)}</span>
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Budget
// ---------------------------------------------------------------------------------------------

export function AllowanceBudget({ v, size, now }: VehicleTileProps) {
  const p = pace(v, now);
  if (!p) return none;
  const usual = p.used / Math.max(1, (now - v.history!.allowance!.since) / 86400_000);
  const tight = p.perDayLeft < usual * 0.95;
  const hue = tight ? WARN : OK;
  if (size === 'xs') return <StatsRow title={TITLE} icon={Calendar03Icon} hue={hue} value={`${n0(p.perDayLeft)} ${v.unit} a day`} label={`left · you drive ${n0(usual)}`} />;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <TileName>{TITLE}</TileName>
        <TileState>{size === 's' ? 'Left a day' : `Left a day, to stay within ${n0(p.total)} ${v.unit}`}</TileState>
        <Big n={n0(p.perDayLeft)} unit={`${v.unit} a day`} className={cn('mt-auto', size === 'l' ? 'text-[48px]' : 'text-[30px]')} style={{ color: hue }} />
        <TileState className="mt-1">{tight ? `You drive ${n0(usual)} a day` : `More than the ${n0(usual)} you drive`}</TileState>
        {size === 'l' ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
            <p>
              <span className="block opacity-60">Left</span>
              <span className="font-semibold tabular-nums">{`${n0(Math.max(0, p.total - p.used))} ${v.unit}`}</span>
            </p>
            <p>
              <span className="block opacity-60">A month</span>
              <span className="font-semibold tabular-nums">{`${n0(p.perDayLeft * 30.4)} ${v.unit}`}</span>
            </p>
            <p>
              <span className="block opacity-60">Ends</span>
              <span className="font-semibold tabular-nums">{when(p.end)}</span>
            </p>
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}
