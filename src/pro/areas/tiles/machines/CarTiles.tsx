/**
 * Car, batch 5 concepts. X-small and Small: one tile per entity of the car (battery, range,
 * charging, doors, climate, location: the studio's state picks which). Wide, Tall and Large: one
 * tile for the whole car (owner, 2026-11-21).
 * - A · "Gauge": a charge arc with the range inside it leads; the rest are small chips.
 * - B · "Dashboard": the car as a list, one row per entity, each with its control.
 * - C · "Silhouette": the car itself, with a charge bar under it and its state as badges.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { arcPath, RING_START, RING_SWEEP } from '../../gestures';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { CarTileModel, TileProps, TileSize } from '../../tileTypes';
import { batteryHue, CAR_ENTITIES, CarPicture, carEntity, CHARGE, EntityDot, PreconditionButton, type CarEntity } from './carParts';

const frame = (c: CarTileModel) => cn('pro-surface', !c.available && 'opacity-60');

/** An X-small or Small tile for one entity, in a concept's own dress. */
function EntityTile({ c, size, e, visual, tint }: { c: CarTileModel; size: TileSize; e: CarEntity; visual: (px: number) => React.ReactNode; tint?: boolean }) {
  const style = tint && e.lit ? { background: `linear-gradient(160deg, color-mix(in srgb, ${e.hue} 16%, var(--surface)), var(--surface) 70%)` } : undefined;
  if (size === 'xs') {
    return (
      <TileFrame label={`${c.name} ${e.label}`} className={frame(c)} style={style}>
        <div className="flex h-full items-center gap-2.5 px-3">
          {visual(40)}
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{e.value}</TileName>
            <TileState className="text-[12px]">
              {c.name} · {e.label}
            </TileState>
          </div>
          {e.control}
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={`${c.name} ${e.label}`} className={frame(c)} style={style}>
      <div className="flex h-full flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          {visual(48)}
          <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide opacity-50">{e.label}</span>
        </div>
        <div className="mt-auto min-w-0">
          <p className="truncate text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums" style={{ color: e.lit ? e.hue : undefined }}>
            {e.value}
          </p>
          <TileState className="mt-1 text-[12px]">{e.control ? c.name : e.sub || c.name}</TileState>
        </div>
        {e.control ? <div className="mt-2 [&>button]:w-full">{e.control}</div> : null}
      </div>
    </TileFrame>
  );
}

/* ── A · Gauge ── */
function ChargeArc({ c, px, label = true }: { c: CarTileModel; px: number; label?: boolean }) {
  const stroke = Math.max(5, Math.round(px * 0.08));
  const r = px / 2 - stroke / 2 - 1;
  const pct = c.battery ?? 0;
  const end = RING_START + (RING_SWEEP * pct) / 100;
  const limit = c.chargeLimit !== null ? RING_START + (RING_SWEEP * c.chargeLimit) / 100 : null;
  const hue = batteryHue(c);
  const pt = (deg: number, rr = r) => [px / 2 + rr * Math.cos((deg * Math.PI) / 180), px / 2 + rr * Math.sin((deg * Math.PI) / 180)];
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: px, height: px }}>
      <svg aria-hidden width={px} height={px} className="absolute inset-0">
        <path d={arcPath(px / 2, px / 2, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} strokeLinecap="round" />
        {c.available && pct > 0 ? <path d={arcPath(px / 2, px / 2, r, RING_START, Math.max(RING_START + 0.5, end))} fill="none" stroke={hue} strokeWidth={stroke} strokeLinecap="round" className={c.charging === 'charging' ? 'motion-safe:animate-pulse' : ''} /> : null}
        {limit !== null && c.available ? <line x1={pt(limit, r - stroke)[0]} y1={pt(limit, r - stroke)[1]} x2={pt(limit, r + stroke * 0.6)[0]} y2={pt(limit, r + stroke * 0.6)[1]} stroke="currentColor" strokeOpacity={0.45} strokeWidth={2} /> : null}
      </svg>
      {label ? (
        <span className="relative flex flex-col items-center leading-none">
          <span className="font-semibold tracking-[-0.03em] tabular-nums" style={{ fontSize: Math.round(px * 0.22) }}>
            {c.battery === null ? '—' : `${c.battery}%`}
          </span>
          <span className="mt-1 opacity-60" style={{ fontSize: Math.max(11, Math.round(px * 0.09)) }}>
            {c.rangeKm === null ? '' : `${c.rangeKm} km`}
          </span>
        </span>
      ) : null}
    </span>
  );
}

function Chip({ e }: { e: CarEntity }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold" style={{ background: `color-mix(in srgb, ${e.hue} ${e.lit ? 18 : 9}%, transparent)`, color: e.lit ? e.hue : undefined }}>
      <HugeiconsIcon icon={e.icon} size={13} style={{ color: e.hue }} />
      <span className="truncate">{e.value}</span>
    </span>
  );
}

export function CarGauge({ e: c, size, act }: TileProps<CarTileModel>) {
  if (size === 'xs' || size === 's') {
    const e = carEntity(c, c.focus, act, size === 'xs');
    return <EntityTile c={c} size={size} e={e} visual={(px) => (c.focus === 'battery' ? <ChargeArc c={c} px={px} label={false} /> : <EntityDot e={e} px={px} />)} />;
  }
  const bat = carEntity(c, 'battery', act);
  // The doors button already says locked or not, so Wide and Tall leave the lock chip out.
  const chips = (size === 'l' ? (['lock', 'climate', 'location'] as const) : (['climate', 'location'] as const)).map((k) => <Chip key={k} e={carEntity(c, k, act)} />);
  const lock = carEntity(c, 'lock', act, size === 'w').control;
  const climate = carEntity(c, 'climate', act, size === 'w').control;
  if (size === 'w') {
    return (
      <TileFrame label={c.name} className={frame(c)}>
        <div className="flex h-full items-center gap-4 p-3.5 pl-4">
          <ChargeArc c={c} px={104} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 self-stretch py-0.5">
            <TileName className="line-clamp-1">{c.name}</TileName>
            <TileState className="-mt-1">{bat.sub}</TileState>
            <div className="flex gap-1 overflow-hidden">{chips}</div>
            <div className="mt-auto flex gap-1.5">{lock}</div>
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={c.name} className={frame(c)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TileName className={size === 'l' ? 'text-[17px]' : ''}>{c.name}</TileName>
            <TileState>{bat.sub}</TileState>
          </div>
        </div>
        <div className={cn('flex min-h-0 flex-1 items-center', size === 'l' ? 'gap-5' : 'justify-center')}>
          <ChargeArc c={c} px={size === 'l' ? 150 : 108} />
          {size === 'l' ? (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <CarPicture c={c} className="h-16 w-full" />
              <div className="flex flex-wrap gap-1.5">{chips}</div>
            </div>
          ) : null}
        </div>
        {size === 't' ? <div className="mb-2.5 flex justify-center gap-1 overflow-hidden">{chips}</div> : null}
        <div className={cn('flex gap-2', size === 't' && 'flex-col [&>button]:w-full')}>
          {lock}
          {climate}
        </div>
      </div>
    </TileFrame>
  );
}

/* ── B · Dashboard ── */
function Row({ e, dense }: { e: CarEntity; dense?: boolean }) {
  // Dense with a control: the button says the state ("Unlock" means locked), so it takes the row.
  if (dense && e.control) {
    return (
      <div className="flex min-w-0 items-center gap-2.5 py-1 [&>button]:flex-1">
        <EntityDot e={e} px={26} solid={e.lit} />
        {e.control}
      </div>
    );
  }
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', dense ? 'py-1' : 'py-0.5')}>
      <EntityDot e={e} px={dense ? 26 : 30} solid={e.lit} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight tabular-nums">{e.value}</p>
        {dense ? null : <p className="truncate text-[11px] leading-tight opacity-60">{e.sub || e.label}</p>}
      </div>
      {e.control}
    </div>
  );
}

export function CarDashboard({ e: c, size, act }: TileProps<CarTileModel>) {
  if (size === 'xs' || size === 's') {
    const e = carEntity(c, c.focus, act, size === 'xs');
    return <EntityTile c={c} size={size} e={e} tint visual={(px) => <EntityDot e={e} px={px} solid={e.lit} />} />;
  }
  const rows = (keys: readonly (typeof CAR_ENTITIES)[number][], compact: boolean) => keys.map((k) => carEntity(c, k, act, compact));
  if (size === 'w') {
    return (
      <TileFrame label={c.name} className={frame(c)}>
        <div className="flex h-full flex-col p-3.5 pb-2">
          <div className="flex items-baseline gap-2">
            <TileName className="line-clamp-1 flex-1">{c.name}</TileName>
            <span className="text-[12px] opacity-60">{c.available ? '' : 'Asleep'}</span>
          </div>
          <div className="mt-1 grid flex-1 grid-cols-2 gap-x-3">
            {rows(['battery', 'range', 'lock', 'location'], true).map((e) => (
              <Row key={e.key} e={{ ...e, control: undefined }} dense />
            ))}
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={c.name} className={frame(c)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-3.5')}>
        <TileName className={cn('line-clamp-1', size === 'l' && 'text-[17px]')}>{c.name}</TileName>
        <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-between">
          {rows(CAR_ENTITIES, size === 't').map((e) => (
            <Row key={e.key} e={size === 't' && (e.key === 'charging' || e.key === 'climate') ? { ...e, control: undefined } : e} dense={size === 't'} />
          ))}
        </div>
      </div>
    </TileFrame>
  );
}

/* ── C · Silhouette ── */
function ChargeBar({ c, className }: { c: CarTileModel; className?: string }) {
  const pct = c.battery ?? 0;
  return (
    <div aria-hidden className={cn('relative h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_8%,transparent)]', className)}>
      <div className={cn('absolute inset-y-0 left-0 rounded-full', c.charging === 'charging' && 'motion-safe:animate-pulse')} style={{ width: `${pct}%`, background: batteryHue(c) }} />
      {c.chargeLimit !== null ? <span className="absolute inset-y-0 w-0.5 bg-current opacity-40" style={{ left: `${c.chargeLimit}%` }} /> : null}
    </div>
  );
}

export function CarSilhouette({ e: c, size, act }: TileProps<CarTileModel>) {
  // Small tiles leave the picture out (owner): the entity's icon, its value and its control, plus
  // Precondition as an icon. X-small has room for one control: the entity's own, else Precondition.
  if (size === 'xs' || size === 's') {
    const e = carEntity(c, c.focus, act, true);
    const own = c.focus === 'climate' ? null : e.control;
    const pre = <PreconditionButton c={c} act={act} px={size === 'xs' ? 34 : 36} />;
    if (size === 'xs') {
      return (
        <TileFrame label={`${c.name} ${e.label}`} className={frame(c)}>
          <div className="flex h-full items-center gap-2.5 px-3">
            <EntityDot e={e} px={38} solid={e.lit} />
            <div className="min-w-0 flex-1">
              <TileName className="line-clamp-1 truncate text-[14px]">{e.value}</TileName>
              <TileState className="text-[12px]">
                {c.name} · {e.label}
              </TileState>
            </div>
            {own ?? pre}
          </div>
        </TileFrame>
      );
    }
    return (
      <TileFrame label={`${c.name} ${e.label}`} className={frame(c)}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            <EntityDot e={e} px={40} solid={e.lit} />
            <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide opacity-50">{e.label}</span>
          </div>
          <div className="mt-auto flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums" style={{ color: e.lit ? e.hue : undefined }}>
                {e.value}
              </p>
              <TileState className="mt-1 text-[12px]">{own ? c.name : e.sub || c.name}</TileState>
            </div>
            {own ? null : pre}
          </div>
          {own ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="min-w-0 flex-1 [&>button]:w-full">{own}</div>
              {pre}
            </div>
          ) : null}
        </div>
      </TileFrame>
    );
  }
  const bat = carEntity(c, 'battery', act);
  // Tall and Large have a doors button, which already says locked or not.
  const badges = (size === 'w' ? (['lock', 'climate', 'location'] as const) : (['climate', 'location'] as const)).map((k) => carEntity(c, k, act));
  const lock = carEntity(c, 'lock', act, size === 'w').control;
  const climate = carEntity(c, 'climate', act, size === 'w').control;
  const head = (
    <div className="flex items-baseline gap-2">
      <p className={cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', size === 'l' ? 'text-[36px]' : 'text-[28px]')} style={{ color: c.charging === 'charging' ? CHARGE : undefined }}>
        {bat.value}
      </p>
      <p className="text-[13px] opacity-60">{c.rangeKm !== null ? `${c.rangeKm} km` : ''}</p>
    </div>
  );
  return (
    <TileFrame label={c.name} className={frame(c)}>
      <div className={cn('flex h-full', size === 'w' ? 'gap-3 p-3.5' : 'flex-col p-4', size === 'l' && 'p-5')}>
        <div className={cn('flex min-w-0 flex-col', size === 'w' ? 'w-[46%] shrink-0 justify-between' : '')}>
          <div className="flex items-start gap-2">
            <TileName className="line-clamp-1 flex-1">{c.name}</TileName>
          </div>
          <div className={cn('relative', size === 'w' ? 'h-14' : size === 't' ? 'my-1 h-14' : 'my-2 h-20')}>
            <CarPicture c={c} className="absolute inset-0" />
          </div>
          <ChargeBar c={c} />
        </div>
        <div className={cn('flex min-w-0 flex-1 flex-col', size === 'w' ? 'justify-between py-0.5' : 'mt-2.5 gap-2')}>
          {head}
          {size === 't' ? null : <p className="-mt-1 truncate text-[12px] opacity-60">{bat.sub}</p>}
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b.key} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${b.hue} ${b.lit ? 18 : 9}%, transparent)`, color: b.lit ? b.hue : undefined }}>
                <HugeiconsIcon icon={b.icon} size={12} style={{ color: b.hue }} />
                {b.value}
              </span>
            ))}
          </div>
          {size !== 'w' ? (
            <div className={cn('mt-auto flex gap-2', size === 't' && 'flex-col [&>button]:w-full')}>
              {lock}
              {climate}
            </div>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}
