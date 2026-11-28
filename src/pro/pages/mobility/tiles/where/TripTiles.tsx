/**
 * Vehicle tiles · batch 4 · Last trip (docs/pro-ui/VEHICLE_TILES.md): the last drive or ride:
 * distance, time, energy (FordPass: lastenergyconsumed) and how efficient it was. Read only.
 * A · Numbers: distance big, time and energy beside it, when it ended.
 * B · Efficiency: kWh per 100 km on a band from frugal to thirsty, the trip's mark on it.
 * C · Timeline: start to end as a line (your Charging and Warm-up picks' line), the distance on
 *   it, energy under it.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Route01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { ago, clock, type Trip, type Vehicle } from '../../../../lib/mobilityHome';
import { Big, IconChip, NOT_ON_CAR, VHUE, type VehicleTileProps } from '../vehicleTileKit';

const DRIVE = VHUE.info;
const tripWord = (v: Vehicle) => (v.kind === 'bike' ? 'Last ride' : 'Last trip');
const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim());

/** kWh per 100 km (or mi), when the trip says the energy. */
const per100 = (t: Trip) => (t.energyKwh !== null && t.distance > 0.5 ? Math.round((t.energyKwh / t.distance) * 1000) / 10 : null);

/** A third line the trip has: energy for cars, CO₂ / calories for bikes. */
function extra(t: Trip) {
  if (t.energyKwh !== null) return `${t.energyKwh.toFixed(1)} kWh`;
  if (t.co2SavedKg !== null) return `${t.co2SavedKg} kg CO₂ saved`;
  if (t.calories !== null) return `${t.calories} kcal`;
  return null;
}

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label={tripWord(v)} className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={Route01Icon} on={false} />
        <TileName className="mt-auto">{tripWord(v)}</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function Row({ v, t, now }: { v: Vehicle; t: Trip; now: number }) {
  return (
    <TileFrame label={tripWord(v)} className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={Route01Icon} hue={DRIVE} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tabular-nums">
            {t.distance.toFixed(1)} {v.unit} · {dur(t.minutes)}
          </p>
          <TileState className="text-[12px]">
            {tripWord(v)} · {ago(t.endedAt, now)}
          </TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Numbers
// ---------------------------------------------------------------------------------------------

export function TripNumbers({ v, size, now }: VehicleTileProps) {
  const t = v.lastTrip;
  if (!t) return <Unavailable v={v} />;
  if (size === 'xs') return <Row v={v} t={t} now={now} />;
  const e = extra(t);
  return (
    <TileFrame label={tripWord(v)} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName className="opacity-70">{tripWord(v)}</TileName>
          {size !== 's' ? <span className="shrink-0 text-[12px] opacity-60">{ago(t.endedAt, now)}</span> : null}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <Big n={t.distance.toFixed(1)} unit={v.unit} className={size === 'l' ? 'text-[56px]' : size === 's' ? 'text-[30px]' : 'text-[38px]'} />
          {size !== 's' ? (
            <div className="pb-1 text-right text-[13px] tabular-nums">
              <p className="font-semibold">{dur(t.minutes)}</p>
              {e ? <p className="opacity-70">{e}</p> : null}
            </div>
          ) : null}
        </div>
        {size === 's' ? <TileState className="mt-1">{[dur(t.minutes), e].filter(Boolean).join(' · ')}</TileState> : null}
        {size === 'l' && per100(t) !== null ? <TileState className="mt-3">{per100(t)} kWh / 100 {v.unit}</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Efficiency
// ---------------------------------------------------------------------------------------------

/** 12 to 30 kWh / 100 km: frugal (green) to thirsty (amber). shortcut: one scale for every EV, per-model typical values when the integration reports them. */
const LO = 12;
const HI = 30;

function Band({ value, labels }: { value: number; labels: boolean }) {
  const at = ((Math.min(HI, Math.max(LO, value)) - LO) / (HI - LO)) * 100;
  return (
    <div>
      <div className="relative h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${VHUE.charge}, hsl(48 90% 55%), ${VHUE.low})`, opacity: 0.85 }}>
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface)] bg-[var(--foreground)]" style={{ left: `${at}%` }} />
      </div>
      {labels ? (
        <div className="mt-1 flex justify-between text-[11px] opacity-55">
          <span>Frugal</span>
          <span>Thirsty</span>
        </div>
      ) : null}
    </div>
  );
}

export function TripEfficiency({ v, size, now }: VehicleTileProps) {
  const t = v.lastTrip;
  if (!t) return <Unavailable v={v} />;
  const eff = per100(t);
  // Bikes and trips without energy have nothing to rate: the numbers instead.
  if (eff === null || size === 'xs') return size === 'xs' ? <Row v={v} t={t} now={now} /> : <TripNumbers v={v} size={size} act={() => {}} now={now} />;
  const word = eff < 17 ? 'Frugal' : eff < 22 ? 'Typical' : 'Thirsty';
  return (
    <TileFrame label={tripWord(v)} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName className="opacity-70">{tripWord(v)}</TileName>
        <p className={cn('mt-1 font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[30px]' : 'text-[20px]')}>
          {word} <span className="font-normal opacity-60">{eff}</span>
          {size !== 's' ? <span className="text-[0.55em] font-medium opacity-60"> kWh/100 {v.unit}</span> : null}
        </p>
        <TileState className={cn(size === 's' && 'hidden')}>
          {t.distance.toFixed(1)} {v.unit} · {dur(t.minutes)}
          {size !== 's' ? ` · ${ago(t.endedAt, now)}` : ''}
        </TileState>
        <div className="mt-auto">
          <Band value={eff} labels={size === 'l'} />
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Timeline
// ---------------------------------------------------------------------------------------------

export function TripTimeline({ v, size, now }: VehicleTileProps) {
  const t = v.lastTrip;
  if (!t) return <Unavailable v={v} />;
  if (size === 'xs') return <Row v={v} t={t} now={now} />;
  const start = t.endedAt - t.minutes * 60_000;
  const e = extra(t);
  return (
    <TileFrame label={tripWord(v)} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>{tripWord(v)}</TileName>
          {size !== 's' ? <span className="shrink-0 text-[12px] opacity-60">{ago(t.endedAt, now)}</span> : null}
        </div>
        <div className="mt-auto">
          <div className="relative flex h-8 items-center">
            <span className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${DRIVE}, color-mix(in srgb, ${DRIVE} 35%, transparent))` }} />
            <span className="absolute left-0 size-3.5 rounded-full border-[3px] border-[var(--surface)]" style={{ background: DRIVE }} />
            <span className="relative mx-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 text-[13px] font-semibold tabular-nums">
              <HugeiconsIcon icon={Route01Icon} size={13} style={{ color: DRIVE }} />
              {t.distance.toFixed(1)} {v.unit}
            </span>
            <span className="absolute right-0 size-3.5 rounded-full border-2" style={{ borderColor: DRIVE, background: 'var(--surface)' }} />
          </div>
          <div className="mt-1 flex justify-between text-[12px] tabular-nums">
            <span>
              <b className="font-semibold">{clock(start)}</b>
            </span>
            {size !== 's' ? <span className="opacity-60">{[dur(t.minutes), e].filter(Boolean).join(' · ')}</span> : null}
            <span>
              <b className="font-semibold">{clock(t.endedAt)}</b>
            </span>
          </div>
          {size === 's' ? <TileState className="mt-1">{dur(t.minutes)}</TileState> : null}
        </div>
      </div>
    </TileFrame>
  );
}
