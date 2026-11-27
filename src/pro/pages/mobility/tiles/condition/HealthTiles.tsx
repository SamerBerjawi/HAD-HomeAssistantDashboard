/**
 * Vehicle tiles · batch 5 · 12 V battery & oil (docs/pro-ui/VEHICLE_TILES.md): the car's health
 * readings with a verdict each: 12 V battery, oil life (petrol, hybrid), traction battery health
 * and temperature, whichever the car reports. Read only.
 * A · Readings: a row per reading, value and a dot in its verdict's colour (the rail's facts).
 * B · Verdict: one word first ("All good", "12 V low"), what to do, the readings small under it.
 * C · Meters: a slim bar per reading with its value, amber when it needs a look.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, HealthIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Vehicle } from '../../../../lib/mobilityHome';
import { healthReadings, IconChip, NOT_ON_CAR, OK, wash, type VehicleTileProps } from '../vehicleTileKit';

function Unavailable() {
  return (
    <TileFrame label="Health" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={HealthIcon} on={false} />
        <TileName className="mt-auto">12 V & battery</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function verdict(v: Vehicle) {
  const r = healthReadings(v);
  const bad = r.filter((x) => x.hue !== OK && x.note !== 'Good' && x.id !== 'temp');
  return { r, ok: bad.length === 0, word: bad.length === 0 ? 'All good' : bad.length === 1 ? `${bad[0].name.replace('Battery ', '')} ${bad[0].id === 'oil' ? 'low' : bad[0].id === 'health' ? 'worn' : 'low'}` : `${bad.length} to check`, hue: bad[0]?.hue ?? OK, advice: bad[0]?.note ?? '' };
}

function Row({ v }: { v: Vehicle }) {
  const w = verdict(v);
  const first = w.ok ? w.r[0] : w.r.find((x) => x.hue === w.hue)!;
  return (
    <TileFrame label="Health" className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={w.ok ? CheckmarkCircle02Icon : Alert02Icon} hue={w.hue} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tabular-nums" style={w.ok ? undefined : { color: w.hue }}>
            {first.value}
          </p>
          <TileState className="text-[12px]">{first.name}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Readings
// ---------------------------------------------------------------------------------------------

export function HealthReadings({ v, size }: VehicleTileProps) {
  const r = healthReadings(v);
  if (!r.length) return <Unavailable />;
  if (size === 'xs') return <Row v={v} />;
  const shown = size === 's' ? r.slice(0, 3) : r;
  return (
    <TileFrame label="Health" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName>Health</TileName>
        <ul className={cn('mt-auto grid gap-x-4 gap-y-1.5', size === 'w' && 'grid-cols-2')}>
          {shown.map((x) => (
            <li key={x.id} className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="size-2 shrink-0 rounded-full" style={{ background: x.hue }} />
              <span className="min-w-0 flex-1 truncate opacity-75">{size === 's' ? x.name.replace('Battery ', '').replace(/^./, (c) => c.toUpperCase()) : x.name}</span>
              <span className="font-semibold tabular-nums" style={x.hue !== OK ? { color: x.hue } : undefined}>
                {x.value}
              </span>
            </li>
          ))}
        </ul>
        {size === 'l' ? <TileState className="mt-3">{verdict(v).ok ? 'Everything reads well.' : verdict(v).advice}</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Verdict
// ---------------------------------------------------------------------------------------------

export function HealthVerdict({ v, size }: VehicleTileProps) {
  const w = verdict(v);
  if (!w.r.length) return <Unavailable />;
  if (size === 'xs') return <Row v={v} />;
  return (
    <TileFrame label="Health" className="pro-surface" style={w.ok ? undefined : wash(w.hue)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={w.ok ? CheckmarkCircle02Icon : Alert02Icon} size={18} style={{ color: w.hue }} />
          <TileName>Health</TileName>
        </div>
        <p className={cn('mt-auto font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[32px]' : 'text-[21px]')} style={w.ok ? undefined : { color: w.hue }}>
          {w.word}
        </p>
        <TileState>{w.ok ? w.r.map((x) => x.value).join(' · ') : w.advice}</TileState>
        {size === 'l' ? <p className="mt-3 text-[12px] tabular-nums opacity-60">{w.r.map((x) => `${x.name} ${x.value}`).join(' · ')}</p> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Meters
// ---------------------------------------------------------------------------------------------

export function HealthMeters({ v, size }: VehicleTileProps) {
  const r = healthReadings(v);
  if (!r.length) return <Unavailable />;
  if (size === 'xs') return <Row v={v} />;
  const shown = size === 's' ? r.slice(0, 2) : r;
  return (
    <TileFrame label="Health" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName>Health</TileName>
        <div className={cn('mt-auto grid gap-x-4 gap-y-2.5', size === 'w' && 'grid-cols-2')}>
          {shown.map((x) => (
            <div key={x.id}>
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="truncate opacity-70">{x.name}</span>
                <span className="font-semibold tabular-nums" style={x.hue !== OK ? { color: x.hue } : undefined}>
                  {x.value}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_10%,transparent)]">
                <div className="h-full rounded-full" style={{ width: `${Math.round((x.share ?? 0) * 100)}%`, background: x.hue }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </TileFrame>
  );
}
