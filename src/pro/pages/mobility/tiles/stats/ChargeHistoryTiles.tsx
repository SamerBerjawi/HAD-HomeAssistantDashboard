/**
 * Vehicle tiles · batch 7 · Charging history (docs/pro-ui/VEHICLE_TILES.md): the charging
 * sessions by month, for plug-in cars (the server's session log). Read only.
 * A · Sessions: kWh added by month as bars, home and away stacked, this month's count big.
 * B · Habit: where charging usually starts and stops, as a band on a 0–100 track.
 * C · Care: a battery-care verdict (how often to 100 %, how low it gets), the facts under it.
 */
import { BatteryCharging01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Vehicle, VehicleMonth } from '../../../../lib/mobilityHome';
import { monthName } from '../../../../lib/mobility/vehicleStats';
import { Big, IconChip, OK, WARN, wash, type VehicleTileProps } from '../vehicleTileKit';
import { ACCENT, FAINT, initial, n0, pad, StatsRow, StatsUnavailable } from './statsTileKit';

const TITLE = 'Charging history';
type Charged = VehicleMonth & { charges: NonNullable<VehicleMonth['charges']> };
const months = (v: Vehicle) => (v.history?.months ?? []).filter((m): m is Charged => !!m.charges).slice(-12);
const none = (v: Vehicle) => <StatsUnavailable title={TITLE} icon={BatteryCharging01Icon} text={v.history?.months.length ? 'Not recorded yet' : 'No history yet'} />;

// ---------------------------------------------------------------------------------------------
// A · Sessions
// ---------------------------------------------------------------------------------------------

export function ChargeSessions({ v, size }: VehicleTileProps) {
  const ms = months(v);
  if (!ms.length) return none(v);
  const cur = ms.at(-1)!;
  if (size === 'xs') return <StatsRow title={TITLE} icon={BatteryCharging01Icon} value={`${cur.charges.sessions} charges`} label={`${monthName(cur.start)} · ${n0(cur.charges.kwh)} kWh`} />;
  const shown = size === 's' ? ms.slice(-6) : ms;
  const top = Math.max(1, ...shown.map((m) => m.charges.kwh));
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Charging</TileName>
          {size !== 's' ? (
            <span className="flex items-center gap-2 text-[11px] opacity-60">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: ACCENT }} />
                Home
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: `color-mix(in srgb, ${ACCENT} 35%, transparent)` }} />
                Away
              </span>
            </span>
          ) : null}
        </div>
        <div className={cn('flex min-h-0 flex-1', size === 'w' ? 'items-end gap-4' : 'flex-col')}>
        <div className={cn('min-w-0 shrink-0', size === 'w' ? 'w-[40%]' : 'mt-1')}>
          <Big n={cur.charges.sessions} unit={cur.charges.sessions === 1 ? 'charge' : 'charges'} className={size === 'l' ? 'text-[40px]' : 'text-[28px]'} />
          <TileState className={cn(size === 'w' && 'line-clamp-2 whitespace-normal')}>{`${n0(cur.charges.kwh)} kWh in ${monthName(cur.start)}${size !== 's' ? `, ${Math.round(cur.charges.home * 100)}% at home` : ''}`}</TileState>
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-end self-stretch">
        <div className={cn('flex items-end gap-[3px]', size === 'w' ? 'min-h-0 flex-1' : 'mt-auto h-[64%] min-h-[30px]')}>
          {shown.map((m) => (
            <span key={m.start} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <span className="rounded-t-[3px]" style={{ height: `${((m.charges.kwh * (1 - m.charges.home)) / top) * 100}%`, background: `color-mix(in srgb, ${ACCENT} 35%, transparent)` }} />
              <span className="rounded-b-[3px]" style={{ height: `${Math.max(3, ((m.charges.kwh * m.charges.home) / top) * 100)}%`, background: ACCENT }} />
            </span>
          ))}
        </div>
        {size !== 's' ? (
          <div className="mt-1 flex gap-[3px] text-[10px] leading-none opacity-50">
            {shown.map((m) => (
              <span key={m.start} className="min-w-0 flex-1 text-center">
                {initial(m.start)}
              </span>
            ))}
          </div>
        ) : null}
        </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Habit
// ---------------------------------------------------------------------------------------------

function Band({ from, to, hue = ACCENT, thin }: { from: number; to: number; hue?: string; thin?: boolean }) {
  return (
    <div className={cn('relative rounded-full', thin ? 'h-1.5' : 'h-3')} style={{ background: FAINT }}>
      <span className="absolute inset-y-0 rounded-full" style={{ left: `${from}%`, width: `${Math.max(2, to - from)}%`, background: hue }} />
    </div>
  );
}

export function ChargeHabit({ v, size }: VehicleTileProps) {
  const ms = months(v);
  if (!ms.length) return none(v);
  const recent = ms.slice(-3);
  const from = Math.round(recent.reduce((a, m) => a + m.charges.from, 0) / recent.length);
  const to = Math.round(recent.reduce((a, m) => a + m.charges.to, 0) / recent.length);
  const perMonth = Math.round(recent.reduce((a, m) => a + m.charges.sessions, 0) / recent.length);
  if (size === 'xs') return <StatsRow title={TITLE} icon={BatteryCharging01Icon} value={`${from} → ${to}%`} label={`Usually · ${perMonth} a month`} />;
  return (
    <TileFrame label={TITLE} className="pro-surface">
      <div className={cn('flex h-full flex-col', pad(size))}>
        <TileName>Charging habit</TileName>
        <p className={cn('mt-1 font-semibold leading-none tracking-[-0.03em] tabular-nums', size === 'l' ? 'text-[36px]' : 'text-[24px]')}>
          {from}
          <span className="mx-1 opacity-40">→</span>
          {to}
          <span className="ml-0.5 text-[0.5em] font-medium opacity-60">%</span>
        </p>
        <TileState>{size === 's' ? `${perMonth} charges a month` : `Where it usually starts and stops · ${perMonth} charges a month`}</TileState>
        <div className="mt-auto">
          {size === 'l' ? (
            <ul className="mb-3 flex flex-col gap-1.5">
              {ms.slice(-6).map((m) => (
                <li key={m.start} className="grid grid-cols-[2.5rem_1fr] items-center gap-2 text-[11px]">
                  <span className="opacity-60">{monthName(m.start)}</span>
                  <Band from={m.charges.from} to={m.charges.to} thin hue={`color-mix(in srgb, ${ACCENT} 55%, transparent)`} />
                </li>
              ))}
            </ul>
          ) : null}
          <Band from={from} to={to} />
          {size !== 's' ? (
            <div className="mt-1 flex justify-between text-[11px] tabular-nums opacity-50">
              <span>0</span>
              <span>50</span>
              <span>100%</span>
            </div>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Care
// ---------------------------------------------------------------------------------------------

function care(v: Vehicle) {
  const recent = months(v).slice(-3);
  const full = recent.reduce((a, m) => a + m.charges.full, 0);
  const low = Math.min(...recent.map((m) => m.charges.from));
  const home = recent.reduce((a, m) => a + m.charges.home, 0) / Math.max(1, recent.length);
  const gentle = full <= 3 && low >= 15;
  return { full, low, home, gentle, word: gentle ? 'Kind to the battery' : full > 3 ? 'Often to 100%' : 'Runs low', advice: gentle ? 'Mostly 20–90%, as makers advise' : full > 3 ? 'Keep 100% for long trips' : 'Charge before it drops under 15%' };
}

export function ChargeCare({ v, size }: VehicleTileProps) {
  if (!months(v).length) return none(v);
  const c = care(v);
  const hue = c.gentle ? OK : WARN;
  if (size === 'xs') return <StatsRow title="Battery care" icon={BatteryCharging01Icon} hue={hue} value={c.gentle ? 'Gentle' : c.word} label={`${c.full}× to 100% · 3 months`} />;
  const facts = [
    { name: 'To 100%', value: `${c.full}×`, note: 'last 3 months' },
    { name: 'Lowest', value: `${c.low}%`, note: 'before a charge' },
    { name: 'At home', value: `${Math.round(c.home * 100)}%`, note: 'of the energy' }
  ];
  return (
    <TileFrame label="Battery care" className="pro-surface" style={c.gentle ? undefined : wash(WARN)}>
      <div className={cn('flex h-full flex-col', pad(size))}>
        <IconChip icon={BatteryCharging01Icon} hue={hue} px={size === 'l' ? 40 : 32} />
        <div className="mt-auto min-w-0">
          <TileName className="opacity-70">Battery care</TileName>
          <p className={cn('font-semibold leading-tight tracking-[-0.02em]', size === 'l' ? 'text-[26px]' : 'text-[17px]', size === 's' ? 'line-clamp-2' : 'truncate')} style={{ color: hue }}>
            {c.word}
          </p>
          {size !== 's' ? <TileState>{c.advice}</TileState> : null}
          {size === 'l' || size === 'w' ? (
            <div className={cn('mt-3 grid grid-cols-3 gap-2 text-[12px]', size === 'w' && 'mt-2')}>
              {facts.map((f) => (
                <p key={f.name}>
                  <span className="block opacity-60">{f.name}</span>
                  <span className="font-semibold tabular-nums">{f.value}</span>
                  {size === 'l' ? <span className="block text-[11px] opacity-50">{f.note}</span> : null}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}
