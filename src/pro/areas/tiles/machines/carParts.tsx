/**
 * Shared bits for the car tiles (owner, 2026-11-21): X-small and Small show one of the car's
 * entities (`focus`); Wide, Tall and Large are one tile for the whole car. `carEntity` describes
 * any entity the same way (value, words, icon, colour, its control) so every concept can render
 * a single-entity tile or a row in the device tile.
 */
import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AutomotiveBattery02Icon, Car01Icon, EvChargingIcon, FastWindIcon, Home01Icon, Location01Icon, Plug01Icon, Road01Icon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { agoText, type CarTileModel, type TileAction } from '../../tileTypes';
import { GuardedLockButton } from '../security/LockTiles';
import { ALARM, CALM, SAFE, WATCH } from '../security/securityParts';

export const CHARGE = 'hsl(152 60% 42%)';
export const HEAT = 'hsl(22 95% 56%)';
export type CarFocus = CarTileModel['focus'];
export const CAR_ENTITIES: CarFocus[] = ['battery', 'range', 'charging', 'lock', 'climate', 'location'];

export interface CarEntity {
  key: CarFocus;
  label: string;
  /** The value, short: "54%", "262 km", "Locked". */
  value: string;
  /** A line under it: "Charging · 1h 35m to 80%". */
  sub: string;
  icon: IconSvgElement;
  hue: string;
  /** Lit: the entity is in its "active" state (charging, unlocked, climate on, away). */
  lit: boolean;
  control?: ReactNode;
}

const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 ? `${min % 60}m` : ''}`.trim() : `${min}m`);

export function batteryHue(c: CarTileModel) {
  if (c.battery === null) return CALM;
  if (c.charging === 'charging') return CHARGE;
  return c.battery <= 20 ? ALARM : c.battery <= 35 ? WATCH : SAFE;
}

export function carEntity(c: CarTileModel, key: CarFocus, act: (a: TileAction) => void, compact = false): CarEntity {
  const off = !c.available;
  switch (key) {
    case 'battery':
      return {
        key,
        label: 'Battery',
        value: c.battery === null ? '—' : `${c.battery}%`,
        sub: off ? 'Asleep' : c.charging === 'charging' ? `Charging${c.chargeMinutes ? ` · ${hm(c.chargeMinutes)} to ${c.chargeLimit ?? 100}%` : ''}` : c.battery !== null && c.battery <= 20 ? 'Low, charge soon' : c.charging === 'plugged' ? 'Plugged in' : 'Not charging',
        icon: c.charging === 'charging' ? EvChargingIcon : AutomotiveBattery02Icon,
        hue: batteryHue(c),
        lit: c.charging === 'charging'
      };
    case 'range':
      return {
        key,
        label: 'Range',
        value: c.rangeKm === null ? '—' : `${c.rangeKm} km`,
        sub: off ? 'Asleep' : c.rangeKm !== null && c.rangeKm < 80 ? 'Low range' : `${c.battery ?? '—'}% battery`,
        icon: Road01Icon,
        hue: c.rangeKm !== null && c.rangeKm < 80 ? WATCH : CALM,
        lit: false
      };
    case 'charging': {
      const on = c.charging === 'charging';
      const can = c.can.charge && c.available && c.charging !== 'unplugged' && c.charging !== null;
      return {
        key,
        label: 'Charging',
        value: off ? '—' : on ? `${c.chargeKw ?? 0} kW` : c.charging === 'plugged' ? 'Plugged in' : 'Unplugged',
        sub: off ? 'Asleep' : on ? `${c.chargeMinutes ? `${hm(c.chargeMinutes)} to ${c.chargeLimit ?? 100}%` : 'Charging'}` : c.charging === 'plugged' ? `Limit ${c.chargeLimit ?? 100}%` : 'Not connected',
        icon: on ? EvChargingIcon : Plug01Icon,
        hue: on ? CHARGE : c.charging === 'plugged' ? SAFE : CALM,
        lit: on,
        control: can ? (
          <Button size="sm" variant={on ? 'secondary' : 'primary'} data-tile-control="" aria-label={`${c.name}: ${on ? 'stop' : 'start'} charging`} onPress={() => act({ type: 'charge', on: !on })} className={cn('min-w-0 shrink-0 rounded-full font-semibold', compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-4 text-[13px]')} style={on ? undefined : { background: CHARGE, color: 'white' }}>
            {on ? 'Stop' : 'Charge'}
          </Button>
        ) : undefined
      };
    }
    case 'lock':
      return {
        key,
        label: 'Doors',
        value: c.locked === null ? '—' : c.locked ? 'Locked' : 'Unlocked',
        sub: off ? 'Asleep' : c.lastChanged ? `${c.locked ? 'Locked' : 'Unlocked'} ${agoText(c.lastChanged).toLowerCase()}` : '',
        icon: c.locked === false ? SquareUnlock02Icon : SquareLock02Icon,
        hue: c.locked === null ? CALM : c.locked ? SAFE : WATCH,
        lit: c.locked === false,
        control: c.can.lock ? (
          <GuardedLockButton name={c.name} locked={!!c.locked} available={c.available && c.locked !== null} onLock={() => act({ type: 'lock', cmd: 'lock' })} onUnlock={() => act({ type: 'lock', cmd: 'unlock' })} compact={compact} />
        ) : undefined
      };
    case 'climate': {
      const on = !!c.climateOn;
      return {
        key,
        label: 'Climate',
        value: c.cabinTemp === null ? '—' : `${c.cabinTemp.toFixed(1)}°`,
        sub: off ? 'Asleep' : on ? `Heating to ${c.climateTarget ?? 21}°` : 'Climate off',
        icon: FastWindIcon,
        hue: on ? HEAT : CALM,
        lit: on,
        control:
          c.can.climate && c.available && c.climateOn !== null ? (
            <Button size="sm" variant={on ? 'secondary' : 'primary'} data-tile-control="" aria-label={`${c.name}: climate ${on ? 'off' : 'on'}`} onPress={() => act({ type: 'carClimate', on: !on })} className={cn('min-w-0 shrink-0 rounded-full font-semibold', compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-4 text-[13px]')} style={on ? undefined : { background: HEAT, color: 'white' }}>
              {on ? 'Stop' : compact ? 'Heat' : 'Precondition'}
            </Button>
          ) : undefined
      };
    }
    default: {
      const home = c.location === 'Home';
      return {
        key,
        label: 'Location',
        value: c.location ?? '—',
        sub: off ? 'Asleep' : c.lastChanged && !home ? `Since ${agoText(c.lastChanged).toLowerCase()}` : home ? 'Parked at home' : '',
        icon: home ? Home01Icon : Location01Icon,
        hue: home ? SAFE : 'hsl(205 85% 55%)',
        lit: !home && c.location !== null
      };
    }
  }
}

/** A tinted round icon for an entity. */
export function EntityDot({ e, px, solid }: { e: CarEntity; px: number; solid?: boolean }) {
  const ip = Math.round(px * 0.5);
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full" style={{ width: px, height: px, background: solid ? e.hue : `color-mix(in srgb, ${e.hue} 15%, transparent)`, color: solid ? 'white' : e.hue }}>
      <HugeiconsIcon icon={e.icon} size={ip} style={{ width: ip, height: ip }} />
    </span>
  );
}

/** Climate on / off as a round icon button ("Precondition"), for the car's small tiles. */
export function PreconditionButton({ c, act, px = 32 }: { c: CarTileModel; act: (a: TileAction) => void; px?: number }) {
  const on = !!c.climateOn;
  const can = c.available && c.climateOn !== null;
  if (!c.can.climate) return null;
  return (
    <Button
      isIconOnly
      size="sm"
      variant={on ? 'primary' : 'secondary'}
      data-tile-control=""
      aria-label={`${c.name}: ${on ? 'stop preconditioning' : 'precondition'}`}
      aria-pressed={on}
      isDisabled={!can}
      onPress={() => act({ type: 'carClimate', on: !on })}
      className="min-w-0 shrink-0 rounded-full p-0"
      style={{ width: px, height: px, ...(on ? { background: HEAT, color: 'white' } : {}) }}
    >
      <HugeiconsIcon icon={FastWindIcon} size={Math.round(px * 0.5)} />
    </Button>
  );
}

/**
 * The car's picture: the owner's upload first, else the entity picture from Home Assistant, else a
 * plain car outline. Contained, never cropped (pictures come in any shape).
 */
export function CarPicture({ c, className }: { c: CarTileModel; className?: string }) {
  const src = c.uploadedPicture ?? c.picture;
  return (
    <div aria-hidden className={cn('relative grid shrink-0 place-items-center', !c.available && 'opacity-50 grayscale', className)}>
      {src ? <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" /> : <HugeiconsIcon icon={Car01Icon} className="h-4/5 w-auto opacity-20" />}
    </div>
  );
}
