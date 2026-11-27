/**
 * Vehicle tiles · batch 7 · Efficiency (docs/pro-ui/VEHICLE_TILES.md): energy used per 100 by
 * month, for plug-in cars, and what it costs at the home tariff. Read only.
 * A · Trend: the last twelve months as a line, this month big, the average dashed.
 * B · Weather: a bar per month in the colour of its outside temperature: why winter costs more.
 * C · Cost: this month's charging cost at the home tariff, per 100, the months as bars.
 */
import { FlashIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Vehicle, VehicleHistory } from '../../../../lib/mobilityHome';
import { monthCost, monthName } from '../../../../lib/mobility/vehicleStats';
import { Big, VHUE, type VehicleTileProps } from '../vehicleTileKit';
import { ACCENT, Bars, FAINT, initial, linePath, pad, StatsRow, StatsUnavailable } from './statsTileKit';

const TITLE = 'Efficiency';
const unit = (v: Vehicle) => `kWh/100 ${v.unit}`;
const months = (v: Vehicle) => (v.history?.months ?? []).filter((m) => m.per100 !== null).slice(-12);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const f1 = (n: number) => n.toFixed(1);

function Unavailable({ v, text }: { v: Vehicle; text?: string }) {
  return <StatsUnavailable title={TITLE} icon={FlashIcon} text={text ?? (v.history?.months.length ? 'Not recorded yet' : 'No history yet')} />;
}

// ---------------------------------------------------------------------------------------------
// A · Trend
// ---------------------------------------------------------------------------------------------

export function EfficiencyTrend({ v, size }: VehicleTileProps) {
  const ms = months(v);
  if (!ms.length) return <Unavailable v={v} />;
  const vals = ms.map((m) => m.per100!);
  const cur = vals.at(-1)!;
  const mean = avg(vals);
  if (size === 'xs') return <StatsRow title={TITLE} icon={FlashIcon} value={`${f1(cur)} kWh`} label={`per 100 ${v.unit} · year ${f1(mean)}`} />;
  const lo = Math.min(...vals) - 1;
  const hi = Math.max(...vals) + 1;
  const W = 100;
  const H = 40;
  const meanY = H - ((mean - lo) / (hi - lo)) * H;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>{TITLE}</TileName>
          {size !== 's' ? <span className="text-[12px] tabular-nums opacity-60">{`12-month average ${f1(mean)}`}</span> : null}
        </div>
        <Big n={f1(cur)} unit={unit(v)} className={cn('mt-1', size === 'l' ? 'text-[40px]' : 'text-[28px]')} />
        <TileState>{cur > mean * 1.05 ? `${monthName(ms.at(-1)!.start)}: above average` : cur < mean * 0.95 ? `${monthName(ms.at(-1)!.start)}: better than average` : `${monthName(ms.at(-1)!.start)}: about average`}</TileState>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-auto h-[38%] min-h-[28px] w-full overflow-visible" aria-hidden>
          <line x1={0} x2={W} y1={meanY} y2={meanY} stroke={FAINT} strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d={linePath(vals, W, H, lo, hi)} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {size !== 's' ? (
          <div className="mt-1 flex justify-between text-[11px] opacity-50">
            {ms.map((m, i) => (
              <span key={m.start} className={cn(size === 'w' && i % 2 && 'invisible')}>
                {initial(m.start)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Weather
// ---------------------------------------------------------------------------------------------

/** Cold blue to warm amber, 0–20 °C. */
const tempHue = (t: number | null) => (t === null ? FAINT : `color-mix(in oklab, ${VHUE.cool} ${Math.round(Math.max(0, Math.min(1, 1 - t / 20)) * 100)}%, ${VHUE.heat})`);

export function EfficiencyWeather({ v, size }: VehicleTileProps) {
  const ms = months(v);
  if (!ms.length) return <Unavailable v={v} />;
  const cold = ms.filter((m) => (m.outside ?? 99) < 8).map((m) => m.per100!);
  const warm = ms.filter((m) => (m.outside ?? -99) >= 14).map((m) => m.per100!);
  const penalty = cold.length && warm.length ? avg(cold) / avg(warm) - 1 : null;
  const cur = ms.at(-1)!;
  if (size === 'xs') return <StatsRow title={TITLE} icon={FlashIcon} value={`${f1(cur.per100!)} kWh`} label={`per 100 ${v.unit}${cur.outside !== null ? ` · ${cur.outside}° out` : ''}`} />;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <TileName>{TITLE}</TileName>
        <p className={cn('mt-1 font-semibold leading-tight tracking-[-0.02em]', size === 'l' ? 'text-[26px]' : 'text-[18px]')}>{penalty !== null ? `Winter uses ${Math.round(penalty * 100)}% more` : `${f1(cur.per100!)} ${unit(v)}`}</p>
        {size !== 's' ? <TileState>{`${f1(cur.per100!)} ${unit(v)} in ${monthName(cur.start)}${cur.outside !== null ? `, ${cur.outside}° outside` : ''}`}</TileState> : null}
        <Bars values={ms.map((m) => m.per100!)} colors={ms.map((m) => tempHue(m.outside))} labels={size === 's' ? undefined : ms.map((m) => initial(m.start))} className="mt-auto h-[42%] min-h-[30px]" />
        {size === 'l' ? (
          <div className="mt-2 flex items-center gap-2 text-[11px] opacity-60">
            <span>Cold</span>
            <span className="h-1.5 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${VHUE.cool}, ${VHUE.heat})` }} />
            <span>Warm</span>
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Cost
// ---------------------------------------------------------------------------------------------

const money = (n: number, price: NonNullable<VehicleHistory['price']>, digits = 0) => new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

export function EfficiencyCost({ v, size }: VehicleTileProps) {
  const ms = months(v);
  const price = v.history?.price ?? null;
  if (!ms.length) return <Unavailable v={v} />;
  if (!price) return <Unavailable v={v} text="Set a tariff on the Energy page" />;
  const costs = ms.map((m) => monthCost(m, price)!);
  const cur = costs.at(-1)!;
  const last = costs.at(-2) ?? null;
  if (size === 'xs') return <StatsRow title="Energy cost" icon={FlashIcon} value={money(cur.total, price)} label={`${monthName(ms.at(-1)!.start)} so far · ${money(cur.per100, price, 2)}/100`} />;
  return (
    <TileFrame label="Energy cost" className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Energy cost</TileName>
          {size !== 's' && last ? <span className="text-[12px] tabular-nums opacity-60">{`${monthName(ms.at(-2)!.start)} ${money(last.total, price)}`}</span> : null}
        </div>
        <Big n={money(cur.total, price)} className={cn('mt-1', size === 'l' ? 'text-[40px]' : 'text-[28px]')} />
        <TileState>{size === 's' ? `${money(cur.per100, price, 2)} per 100 ${v.unit}` : `${monthName(ms.at(-1)!.start)} so far · ${money(cur.per100, price, 2)} per 100 ${v.unit}`}</TileState>
        <Bars values={costs.map((c) => c.total)} colors={costs.map((_, i) => (i === costs.length - 1 ? ACCENT : null))} labels={size === 's' ? undefined : ms.map((m) => initial(m.start))} className="mt-auto h-[38%] min-h-[28px]" />
        {size === 'l' ? <TileState className="mt-2">{`At ${money(price.perKwh, price, 2)} a kWh, the home tariff. Charging away is not priced.`}</TileState> : null}
      </div>
    </TileFrame>
  );
}
