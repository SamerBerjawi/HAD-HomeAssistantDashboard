/**
 * Vehicle tiles · batch 5 · Tyres (docs/pro-ui/VEHICLE_TILES.md): the four pressures, the low one
 * amber (FordPass: under 80% of the placard). Read only.
 * A · Car plan: the car from above (as your Extras pick), each pressure at its wheel.
 * B · Grid: four numbers, front row above rear, left and right as in the car.
 * C · Status: the verdict first ("All good", "Front left low") and the car from above with each
 *   pressure and its wheel's name beside it (the earlier Condition card's drawing; owner's pick).
 */
import { CheckmarkCircle02Icon, Alert02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { lowTyres, type Tyres, type Vehicle } from '../../../../lib/mobilityHome';
import { IconChip, NOT_ON_CAR, OK, WARN, wash, type VehicleTileProps } from '../vehicleTileKit';

type Wheel = 'fl' | 'fr' | 'rl' | 'rr';
const NAMES: Record<Wheel, string> = { fl: 'Front left', fr: 'Front right', rl: 'Rear left', rr: 'Rear right' };
const isLow = (t: Tyres, w: Wheel) => t[w] !== null && t[w]! < t.low;
const fmt = (n: number | null) => (n === null ? '—' : n.toFixed(1));

function Unavailable() {
  return (
    <TileFrame label="Tyres" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={CheckmarkCircle02Icon} on={false} />
        <TileName className="mt-auto">Tyres</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function verdict(v: Vehicle) {
  const low = lowTyres(v.condition.tyres);
  return low.length === 0 ? { word: 'All good', hue: OK, ok: true } : { word: low.length === 1 ? `${low[0].replace(/^./, (c) => c.toUpperCase())} low` : `${low.length} tyres low`, hue: WARN, ok: false };
}

function Row({ v, t }: { v: Vehicle; t: Tyres }) {
  const w = verdict(v);
  return (
    <TileFrame label="Tyres" className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={w.ok ? CheckmarkCircle02Icon : Alert02Icon} hue={w.hue} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold" style={w.ok ? undefined : { color: w.hue }}>
            {w.ok ? 'Tyres' : w.word}
          </p>
          <TileState className="text-[12px]">{w.ok ? `All good · ${t.unit}` : `${fmt(Math.min(...(['fl', 'fr', 'rl', 'rr'] as Wheel[]).map((k) => t[k] ?? 99)))} ${t.unit}`}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Car plan
// ---------------------------------------------------------------------------------------------

/** The car faces right, the driver's (left) side on top: front left is top right. */
const AT: Record<Wheel, [number, number]> = { fl: [76, 4], fr: [76, 96], rl: [22, 4], rr: [22, 96] };

export function TyresPlan({ v, size }: VehicleTileProps) {
  const t = v.condition.tyres;
  if (!t) return <Unavailable />;
  if (size === 'xs') return <Row v={v} t={t} />;
  const w = verdict(v);
  return (
    <TileFrame label="Tyres" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Tyres</TileName>
          <span className="shrink-0 text-[12px] font-semibold" style={w.ok ? { opacity: 0.6 } : { color: w.hue }}>
            {w.ok ? t.unit : size === 's' ? 'Low' : w.word}
          </span>
        </div>
        <div className={cn('relative my-auto', size === 'w' ? 'mx-auto w-[60%]' : size === 's' ? 'mx-1' : 'mx-4')} style={{ aspectRatio: '200 / 90' }}>
          <svg aria-hidden viewBox="0 0 200 90" className="absolute inset-0 size-full">
            <rect x={6} y={8} width={188} height={74} rx={30} fill="color-mix(in srgb, currentColor 5%, transparent)" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1.5} />
            {(Object.keys(AT) as Wheel[]).map((k) => (
              <rect key={k} x={AT[k][0] * 2 - 14} y={AT[k][1] < 50 ? 2 : 78} width={28} height={10} rx={4} fill={isLow(t, k) ? WARN : 'currentColor'} fillOpacity={isLow(t, k) ? 0.9 : 0.25} />
            ))}
          </svg>
          {(Object.keys(AT) as Wheel[]).map((k) => (
            <span
              key={k}
              className={cn('absolute -translate-x-1/2 font-semibold tabular-nums', size === 'l' ? 'text-[18px]' : size === 's' ? 'text-[12px]' : 'text-[14px]')}
              style={{ left: `${AT[k][0]}%`, top: AT[k][1] < 50 ? '22%' : undefined, bottom: AT[k][1] > 50 ? '22%' : undefined, color: isLow(t, k) ? WARN : undefined }}
            >
              {fmt(t[k])}
            </span>
          ))}
        </div>
        {size === 'l' ? <TileState>{`${t.unit} · low under ${t.low}`}</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Grid
// ---------------------------------------------------------------------------------------------

export function TyresGrid({ v, size }: VehicleTileProps) {
  const t = v.condition.tyres;
  if (!t) return <Unavailable />;
  if (size === 'xs') return <Row v={v} t={t} />;
  const w = verdict(v);
  const cell = (k: Wheel) => (
    <div key={k} className="rounded-xl px-2 py-1.5" style={{ background: isLow(t, k) ? `color-mix(in srgb, ${WARN} 16%, transparent)` : 'color-mix(in srgb, currentColor 5%, transparent)' }}>
      {size !== 's' ? <p className="text-[11px] opacity-60">{NAMES[k]}</p> : null}
      <p className={cn('font-semibold tabular-nums tracking-[-0.02em]', size === 'l' ? 'text-[26px]' : 'text-[17px]')} style={isLow(t, k) ? { color: WARN } : undefined}>
        {fmt(t[k])}
      </p>
    </div>
  );
  return (
    <TileFrame label="Tyres" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Tyres</TileName>
          <span className="shrink-0 text-[12px] font-semibold" style={{ color: w.ok ? undefined : w.hue, opacity: w.ok ? 0.6 : 1 }}>
            {w.ok ? t.unit : size === 's' ? 'Low' : w.word}
          </span>
        </div>
        <div className={cn('mt-auto grid gap-1.5', size === 'w' ? 'grid-cols-4' : 'grid-cols-2')}>{(['fl', 'fr', 'rl', 'rr'] as Wheel[]).map(cell)}</div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Status (owner, 2026-11-27: with the earlier Condition card's drawing, the car from above
// and each pressure with its wheel's name beside it)
// ---------------------------------------------------------------------------------------------

const soft = (pct: number) => `color-mix(in oklab, currentColor ${pct}%, transparent)`;

/** The car from above (the earlier Condition card's): four wheels, a low one amber. */
function CarTop({ t, height }: { t: Tyres; height: number }) {
  const wheel = (x: number, y: number, k: Wheel) => <rect key={k} x={x} y={y} width={11} height={30} rx={4} fill={isLow(t, k) ? WARN : soft(55)} />;
  return (
    <svg viewBox="0 0 96 168" className="w-auto shrink-0" style={{ height }} aria-hidden>
      {wheel(6, 30, 'fl')}
      {wheel(79, 30, 'fr')}
      {wheel(6, 118, 'rl')}
      {wheel(79, 118, 'rr')}
      <rect x={14} y={6} width={68} height={156} rx={26} fill={soft(8)} stroke={soft(30)} strokeWidth={1.5} />
      <path d="M24 52 Q48 40 72 52 L68 70 Q48 64 28 70 Z" fill={soft(22)} />
      <path d="M28 120 Q48 126 68 120 L71 134 Q48 142 25 134 Z" fill={soft(22)} />
      <rect x={30} y={76} width={36} height={38} rx={8} fill={soft(12)} />
    </svg>
  );
}

function Pressure({ t, k, align, px, named }: { t: Tyres; k: Wheel; align: 'left' | 'right'; px: number; named: boolean }) {
  const low = isLow(t, k);
  return (
    <div className={cn('flex min-w-0 flex-col', align === 'right' ? 'items-end text-right' : 'items-start')}>
      <span className="font-light leading-none tabular-nums tracking-tight" style={{ fontSize: px, ...(low ? { color: WARN } : {}) }}>
        {fmt(t[k])}
      </span>
      {named ? (
        <span className="mt-1 truncate text-[12px] opacity-60" style={low ? { color: WARN, opacity: 1 } : undefined}>
          {NAMES[k]}
          {low ? ', low' : ''}
        </span>
      ) : null}
    </div>
  );
}

/** Pressures either side of the car, front at the top. */
function TopView({ t, car, px, named }: { t: Tyres; car: number; px: number; named: boolean }) {
  const pad = Math.round(car * 0.12);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-2 items-center gap-x-3">
      <div className="self-start" style={{ paddingTop: pad }}>
        <Pressure t={t} k="fl" align="right" px={px} named={named} />
      </div>
      <div className="row-span-2 flex justify-center">
        <CarTop t={t} height={car} />
      </div>
      <div className="self-start" style={{ paddingTop: pad }}>
        <Pressure t={t} k="fr" align="left" px={px} named={named} />
      </div>
      <div className="self-end" style={{ paddingBottom: pad }}>
        <Pressure t={t} k="rl" align="right" px={px} named={named} />
      </div>
      <div className="self-end" style={{ paddingBottom: pad }}>
        <Pressure t={t} k="rr" align="left" px={px} named={named} />
      </div>
    </div>
  );
}

export function TyresStatus({ v, size }: VehicleTileProps) {
  const t = v.condition.tyres;
  if (!t) return <Unavailable />;
  if (size === 'xs') return <Row v={v} t={t} />;
  const w = verdict(v);
  const head = (
    <div className="flex items-center gap-2">
      <HugeiconsIcon icon={w.ok ? CheckmarkCircle02Icon : Alert02Icon} size={18} style={{ color: w.hue }} />
      <TileName>Tyres</TileName>
      {size === 's' ? (
        <span className="ml-auto shrink-0 text-[12px] font-semibold" style={w.ok ? { opacity: 0.6 } : { color: w.hue }}>
          {w.ok ? t.unit : 'Low'}
        </span>
      ) : null}
    </div>
  );
  const word = (
    <p className={cn('font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[26px]' : 'text-[19px]')} style={w.ok ? undefined : { color: w.hue }}>
      {w.word}
    </p>
  );
  if (size === 's')
    return (
      <TileFrame label="Tyres" className="pro-surface" style={w.ok ? undefined : wash(WARN)}>
        <div className="flex h-full flex-col p-3">
          {head}
          <div className="mt-auto">
            <TopView t={t} car={98} px={17} named={false} />
          </div>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Tyres" className="pro-surface" style={w.ok ? undefined : wash(WARN)}>
        <div className="flex h-full flex-col px-4 pb-2 pt-3">
          <div className="flex items-center justify-between gap-2">
            {head}
            <span className="truncate text-[14px] font-semibold" style={w.ok ? { opacity: 0.6 } : { color: w.hue }}>
              {w.ok ? `All good · ${t.unit}` : w.word}
            </span>
          </div>
          <div className="mx-auto mt-auto">
            <TopView t={t} car={100} px={19} named />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Tyres" className="pro-surface" style={w.ok ? undefined : wash(WARN)}>
      <div className="flex h-full flex-col p-5">
        {head}
        <div className="mt-1">{word}</div>
        <div className="my-auto">
          <TopView t={t} car={168} px={30} named />
        </div>
        <TileState>{`${t.unit} · low under ${t.low}`}</TileState>
      </div>
    </TileFrame>
  );
}
