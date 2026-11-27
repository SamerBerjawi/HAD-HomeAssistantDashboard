/**
 * Vehicle tiles · batch 7 · Distance (docs/pro-ui/VEHICLE_TILES.md): how far it goes, by month
 * (the odometer's long-term statistics). Read only.
 * A · Bars: the last twelve months as bars, this month lit (so far, and where it is heading).
 * B · Compare: this month against last month and the same month last year, the change in words.
 * C · Year: this year's running total over last year's, year to date big.
 */
import { Road01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Vehicle } from '../../../../lib/mobilityHome';
import { monthCompare, monthName, signed, yearCompare } from '../../../../lib/mobility/vehicleStats';
import { Big, type VehicleTileProps } from '../vehicleTileKit';
import { ACCENT, Bars, FAINT, initial, linePath, n0, pad, StatsRow, StatsUnavailable } from './statsTileKit';

const TITLE = 'Distance';
const none = <StatsUnavailable title={TITLE} icon={Road01Icon} text="No history yet" />;
const vsYear = (r: number) => (Math.abs(r) < 0.02 ? 'Same as last year' : `${signed(r)} on last year`);
const hist = (v: Vehicle) => (v.history?.months.length ? v.history : null);

function Row({ v, now }: { v: Vehicle; now: number }) {
  const c = monthCompare(hist(v)!, now);
  return <StatsRow title={TITLE} icon={Road01Icon} value={`${n0(c.sofar)} ${v.unit}`} label={`${monthName(now)} so far${c.vsLast !== null ? ` · ${signed(c.vsLast)}` : ''}`} />;
}

// ---------------------------------------------------------------------------------------------
// A · Bars
// ---------------------------------------------------------------------------------------------

export function DistanceBars({ v, size, now }: VehicleTileProps) {
  const h = hist(v);
  if (!h) return none;
  if (size === 'xs') return <Row v={v} now={now} />;
  const c = monthCompare(h, now);
  const y = yearCompare(h, now);
  const months = h.months.slice(size === 's' ? -6 : -12);
  // This month's bar: what is driven so far, with where it is heading as a faint cap.
  const values = months.map((m, i) => (i === months.length - 1 ? Math.max(m.distance, c.heading) : m.distance));
  const colors = months.map((_, i) => (i === months.length - 1 ? `linear-gradient(to top, ${ACCENT} ${Math.round((c.sofar / Math.max(1, c.heading)) * 100)}%, color-mix(in srgb, ${ACCENT} 30%, transparent) 0)` : null));
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>{TITLE}</TileName>
          {size !== 's' ? <span className="text-[12px] tabular-nums opacity-60">{c.vsLast !== null ? `${signed(c.vsLast)} on ${monthName(c.last!.start)}` : ''}</span> : null}
        </div>
        <div className={cn('flex min-h-0 flex-1 gap-4', size === 'w' ? 'items-end' : 'flex-col')}>
          <div className={cn('min-w-0 shrink-0', size === 'w' ? 'w-[42%]' : 'mt-1')}>
            <Big n={n0(c.sofar)} unit={v.unit} className={size === 'l' ? 'text-[40px]' : 'text-[28px]'} />
            <TileState className="truncate">{size === 's' ? `${monthName(now)} so far` : size === 'w' ? `${monthName(now)} so far · ≈ ${n0(c.heading)}` : `${monthName(now, true)} so far · heading for ${n0(c.heading)}`}</TileState>
          </div>
          <Bars values={values} colors={colors} labels={size === 's' ? undefined : months.map((m) => initial(m.start))} className={cn('min-w-0 flex-1', size === 'w' ? 'h-full' : 'min-h-[36px]')} />
        </div>
        {size === 'l' ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
            <p>
              <span className="block opacity-60">This year</span>
              <span className="font-semibold tabular-nums">{n0(y.ytd)} {v.unit}</span>
            </p>
            <p>
              <span className="block opacity-60">A day</span>
              <span className="font-semibold tabular-nums">{n0(y.perDay)} {v.unit}</span>
            </p>
            <p>
              <span className="block opacity-60">Best month</span>
              <span className="font-semibold tabular-nums">{y.best ? `${monthName(y.best.start)} ${new Date(y.best.start).getFullYear() % 100}` : '—'}</span>
            </p>
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Compare
// ---------------------------------------------------------------------------------------------

export function DistanceCompare({ v, size, now }: VehicleTileProps) {
  const h = hist(v);
  if (!h) return none;
  if (size === 'xs') return <Row v={v} now={now} />;
  const c = monthCompare(h, now);
  const rows = [
    { name: `${monthName(now)} (heading)`, km: c.heading, hue: ACCENT },
    c.last ? { name: monthName(c.last.start), km: c.last.distance, hue: null } : null,
    c.lastYear ? { name: `${monthName(c.lastYear.start)} ${new Date(c.lastYear.start).getFullYear()}`, km: c.lastYear.distance, hue: null } : null
  ].filter((x): x is NonNullable<typeof x> => !!x);
  const top = Math.max(1, ...rows.map((r) => r.km));
  const change = c.vsLast === null ? 'First month' : Math.abs(c.vsLast) < 0.05 ? 'About the same' : c.vsLast > 0 ? `${signed(c.vsLast)} more` : `${signed(c.vsLast)} less`;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <TileName>{TITLE}</TileName>
        {size === 'l' ? <TileState>{c.last ? `${monthName(now)} against ${monthName(c.last.start)}` : monthName(now, true)}</TileState> : null}
        <div className={cn('mt-auto flex gap-4', size === 'w' ? 'items-end' : 'flex-col gap-3')}>
          <div className={cn('min-w-0 shrink-0', size === 'w' && 'w-[44%]')}>
            <p className={cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', size === 'l' ? 'text-[36px]' : size === 's' ? 'text-[28px]' : 'text-[22px]', size === 'w' && 'line-clamp-2')} style={{ color: ACCENT }}>
              {size === 's' ? (c.vsLast === null || Math.abs(c.vsLast) < 0.05 ? 'Same' : signed(c.vsLast)) : change}
            </p>
            {size === 's' && c.last ? <p className="mt-1 text-[12px] opacity-60">{`against ${monthName(c.last.start)}`}</p> : null}
            <p className="mt-1 text-[12px] tabular-nums opacity-60">{`${n0(c.sofar)} ${v.unit} so far`}</p>
          </div>
          {size !== 's' ? (
            <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
              {rows.map((r) => (
                <li key={r.name} className="text-[12px]">
                  <div className="flex justify-between gap-2">
                    <span className="truncate opacity-70">{r.name}</span>
                    <span className="font-semibold tabular-nums">{n0(r.km)}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full" style={{ width: `${(r.km / top) * 100}%`, background: r.hue ?? FAINT }} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {size === 'l' && c.vsLastYear !== null ? <TileState className="mt-3">{`${signed(c.vsLastYear)} on ${monthName(now)} last year`}</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Year
// ---------------------------------------------------------------------------------------------

export function DistanceYear({ v, size, now }: VehicleTileProps) {
  const h = hist(v);
  if (!h) return none;
  const y = yearCompare(h, now);
  if (size === 'xs') return <StatsRow title={TITLE} icon={Road01Icon} value={`${n0(y.ytd)} ${v.unit}`} label={`This year${y.vs !== null ? ` · ${signed(y.vs)}` : ''}`} />;
  const max = Math.max(1, y.thisYear.at(-1) ?? 0, y.lastYear.at(-1) ?? 0);
  const W = 100;
  const H = 40;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>This year</TileName>
          {size !== 's' && y.vs !== null ? <span className="text-[12px] tabular-nums opacity-60">{vsYear(y.vs)}</span> : null}
        </div>
        <Big n={n0(y.ytd)} unit={v.unit} className={cn('mt-1', size === 'l' ? 'text-[40px]' : 'text-[28px]')} />
        {size === 's' ? <TileState>{y.vs !== null ? vsYear(y.vs) : `${n0(y.perDay)} ${v.unit} a day`}</TileState> : null}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-auto h-[38%] min-h-[28px] w-full overflow-visible" aria-hidden>
          <path d={linePath([0, ...y.lastYear], W, H, 0, max, 13)} fill="none" stroke="color-mix(in srgb, currentColor 35%, transparent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
          <path d={linePath([0, ...y.thisYear], W, H, 0, max, 13)} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {size !== 's' ? (
          <div className="mt-1 flex justify-between text-[11px] tabular-nums opacity-60">
            <span>Jan</span>
            <span>{size === 'l' ? `${n0(y.perDay)} ${v.unit} a day · last year dashed` : 'last year dashed'}</span>
            <span>Dec</span>
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}
