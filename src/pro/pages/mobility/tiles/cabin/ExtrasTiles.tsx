/**
 * Vehicle tiles · batch 2 · Extras (docs/pro-ui/VEHICLE_TILES.md): what comes on with the climate
 * (FordPass: windscreen, rear window, steering wheel, seats), each one tap.
 * A · Chips: one chip per extra, lit when on (the Room tiles' chips).
 * B · Car plan: the car from above, each part where it is in the car, glowing when on; tap it.
 * C · Rows: a quiet list, a row per extra with On / Off (the settings way).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { HeaterIcon, SeatSelectorIcon, SteeringIcon, TemperatureIcon, WindPowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileChip, TileFrame, TileIconButton, TileName, TileState } from '../../../../areas/tileKit';
import type { Vehicle } from '../../../../lib/mobilityHome';
import { IconChip, VHUE, type VehicleTileProps } from '../vehicleTileKit';

type Extra = NonNullable<Vehicle['climate']>['extras'][number];

const ICON: Record<string, IconSvgElement> = { windscreen: WindPowerIcon, rear: HeaterIcon, wheel: SteeringIcon, 'seat-driver': SeatSelectorIcon, 'seat-passenger': SeatSelectorIcon, 'seat-rear-left': SeatSelectorIcon, 'seat-rear-right': SeatSelectorIcon };
const SHORT: Record<string, string> = { windscreen: 'Front', rear: 'Rear', wheel: 'Wheel', 'seat-driver': 'Driver', 'seat-passenger': 'Passenger', 'seat-rear-left': 'Rear L', 'seat-rear-right': 'Rear R' };
const HOT = VHUE.heat;

const extrasOf = (v: Vehicle) => v.climate?.extras ?? [];
const countOn = (x: Extra[]) => x.filter((e) => e.on).length;
const summary = (x: Extra[]) => (countOn(x) ? `${countOn(x)} of ${x.length} on` : 'All off');
const toggle = (act: VehicleTileProps['act'], e: Extra) => () => act({ type: 'extra', id: e.id, on: !e.on });

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label="Extras" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={HeaterIcon} on={false} />
        <TileName className="mt-auto">Extras</TileName>
        <TileState>{v.climate ? 'None this car offers' : 'Not offered'}</TileState>
      </div>
    </TileFrame>
  );
}

/** A small round toggle for one extra (X-small rows, the car plan's spots). */
function Spot({ e, act, px }: { e: Extra; act: VehicleTileProps['act']; px: number }) {
  return (
    <TileIconButton
      icon={ICON[e.id] ?? TemperatureIcon}
      label={`${e.label} ${e.on ? 'on' : 'off'}`}
      pressed={e.on}
      size={px}
      onPress={toggle(act, e)}
      className={e.on ? undefined : 'bg-[color-mix(in_srgb,currentColor_8%,transparent)]'}
      style={e.on ? { background: `color-mix(in srgb, ${HOT} 24%, var(--surface))`, color: HOT, boxShadow: `0 0 14px -3px ${HOT}` } : undefined}
    />
  );
}

// ---------------------------------------------------------------------------------------------
// A · Chips
// ---------------------------------------------------------------------------------------------

export function ExtrasChips({ v, size, act }: VehicleTileProps) {
  const x = extrasOf(v);
  if (!x.length) return <Unavailable v={v} />;
  if (size === 'xs')
    return (
      <TileFrame label="Extras" className="pro-surface">
        <div className="flex h-full items-center gap-1 px-2.5">
          {x.map((e) => (
            <Spot key={e.id} e={e} act={act} px={x.length > 4 ? 26 : 30} />
          ))}
        </div>
      </TileFrame>
    );
  const chip = (e: Extra, short: boolean) => (
    <TileChip
      key={e.id}
      label={`${e.label} ${e.on ? 'on' : 'off'}`}
      active={e.on}
      onPress={toggle(act, e)}
      className={cn('gap-1 px-2.5', size === 'l' ? 'h-9' : 'h-8', !e.on && 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]')}
      style={e.on ? { background: `color-mix(in srgb, ${HOT} 22%, transparent)`, color: HOT } : undefined}
    >
      <HugeiconsIcon icon={ICON[e.id] ?? TemperatureIcon} size={14} />
      {short ? SHORT[e.id] ?? e.label : e.label}
    </TileChip>
  );
  return (
    <TileFrame label="Extras" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <TileName>Extras</TileName>
        <TileState>{summary(x)}</TileState>
        {size === 's' ? (
          // Small has no room for named chips under the name: the icons alone.
          <div className="mt-auto flex gap-1">
            {x.map((e) => (
              <Spot key={e.id} e={e} act={act} px={x.length > 4 ? 26 : 30} />
            ))}
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap gap-1.5">{x.map((e) => chip(e, size !== 'l'))}</div>
        )}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Car plan
// ---------------------------------------------------------------------------------------------

/** Where each part sits on the plan (% of the drawing; the car faces right, driver on the far side). */
const AT: Record<string, [number, number]> = { windscreen: [74, 50], rear: [15, 50], wheel: [60, 30], 'seat-driver': [45, 30], 'seat-passenger': [45, 70], 'seat-rear-left': [30, 30], 'seat-rear-right': [30, 70] };

function Plan({ x, act, spot }: { x: Extra[]; act: VehicleTileProps['act']; spot: number }) {
  const on = (id: string) => x.find((e) => e.id === id)?.on;
  const glass = (id: string) => (on(id) ? `color-mix(in srgb, ${HOT} 45%, transparent)` : 'color-mix(in srgb, currentColor 10%, transparent)');
  return (
    <div className="relative w-full" style={{ aspectRatio: '200 / 90' }}>
      <svg aria-hidden viewBox="0 0 200 90" className="absolute inset-0 size-full">
        <rect x={6} y={8} width={188} height={74} rx={30} fill="color-mix(in srgb, currentColor 5%, transparent)" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.5} />
        <rect x={46} y={18} width={86} height={54} rx={10} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
        <path d="M 132 20 L 152 13 Q 156 45 152 77 L 132 70 Z" fill={glass('windscreen')} stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} style={on('windscreen') ? { filter: `drop-shadow(0 0 5px ${HOT})` } : undefined} />
        <path d="M 46 22 L 30 25 Q 27 45 30 65 L 46 68 Z" fill={glass('rear')} stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} style={on('rear') ? { filter: `drop-shadow(0 0 5px ${HOT})` } : undefined} />
      </svg>
      {x
        .filter((e) => AT[e.id])
        .map((e) => (
          <span key={e.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${AT[e.id][0]}%`, top: `${AT[e.id][1]}%` }}>
            <Spot e={e} act={act} px={spot} />
          </span>
        ))}
    </div>
  );
}

export function ExtrasPlan({ v, size, act }: VehicleTileProps) {
  const x = extrasOf(v);
  if (!x.length) return <Unavailable v={v} />;
  // Parts the plan has no place for still get a chip.
  const loose = x.filter((e) => !AT[e.id]);
  if (size === 'xs') return <ExtrasChips v={v} size="xs" act={act} now={0} />;
  return (
    <TileFrame label="Extras" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Extras</TileName>
          <TileState className="shrink-0">{summary(x)}</TileState>
        </div>
        <div className={cn('my-auto', size === 'w' && 'mx-auto w-[78%]')}>
          <Plan x={x} act={act} spot={size === 's' ? 24 : size === 'l' ? 36 : 30} />
        </div>
        {loose.length ? (
          <div className="flex flex-wrap gap-1.5">
            {loose.map((e) => (
              <Spot key={e.id} e={e} act={act} px={28} />
            ))}
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Rows
// ---------------------------------------------------------------------------------------------

function Row({ e, act, dense }: { e: Extra; act: VehicleTileProps['act']; dense: boolean }) {
  return (
    <Button
      variant="ghost"
      aria-pressed={e.on}
      aria-label={`${e.label} ${e.on ? 'on' : 'off'}`}
      onPress={toggle(act, e)}
      data-tile-control=""
      className={cn('h-auto w-full min-w-0 justify-start gap-2 rounded-xl px-2 text-left text-[var(--foreground)] data-[hovered=true]:bg-[color-mix(in_srgb,currentColor_6%,transparent)]', dense ? 'py-1' : 'py-1.5')}
    >
      <HugeiconsIcon icon={ICON[e.id] ?? TemperatureIcon} size={16} style={e.on ? { color: HOT } : undefined} className={e.on ? undefined : 'opacity-60'} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{dense ? SHORT[e.id] ?? e.label : e.label}</span>
      <span className="text-[12px] font-semibold tabular-nums" style={e.on ? { color: HOT } : { opacity: 0.45 }}>
        {e.on ? 'On' : 'Off'}
      </span>
    </Button>
  );
}

export function ExtrasRows({ v, size, act }: VehicleTileProps) {
  const x = extrasOf(v);
  if (!x.length) return <Unavailable v={v} />;
  if (size === 'xs') {
    const all = countOn(x) === x.length;
    return (
      <TileFrame label="Extras" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">Extras</p>
            <TileState className="text-[12px]">{summary(x)}</TileState>
          </div>
          <TileChip
            label={all ? 'Turn all extras off' : 'Turn all extras on'}
            onPress={() => x.filter((e) => e.on === all).forEach((e) => act({ type: 'extra', id: e.id, on: !all }))}
            className={cn(!all && 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]')}
            style={all ? { background: `color-mix(in srgb, ${HOT} 22%, transparent)`, color: HOT } : undefined}
          >
            {all ? 'All off' : 'All on'}
          </TileChip>
        </div>
      </TileFrame>
    );
  }
  // Small fits three rows; the rest are counted.
  const shown = size === 's' ? x.slice(0, 3) : x;
  return (
    <TileFrame label="Extras" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-4' : 'p-3')}>
        <div className="flex items-baseline justify-between gap-2 px-2">
          <TileName>Extras</TileName>
          <TileState className="shrink-0">{summary(x)}</TileState>
        </div>
        <div className={cn('mt-auto grid gap-x-2', size === 'w' && 'grid-cols-2')}>
          {shown.map((e) => (
            <Row key={e.id} e={e} act={act} dense={size !== 'l'} />
          ))}
        </div>
        {shown.length < x.length ? <p className="px-2 text-[12px] opacity-60">+{x.length - shown.length} more on Wide</p> : null}
      </div>
    </TileFrame>
  );
}
