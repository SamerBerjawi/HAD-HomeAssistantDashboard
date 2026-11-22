/**
 * Ambient (D) for batch 5: the same glass cards as Security, the state's colour glowing from a
 * corner, a round orb that is the main control.
 * - Vacuum: the orb starts or pauses; a wave rises while it cleans. Small and up show the battery.
 * - Car: X-small and Small are one entity of the car (the orb is its control when it has one);
 *   Wide, Tall and Large are the whole car: battery and range in big type, doors, climate and
 *   location underneath, the orb charges, and the doors use the hold-to-unlock button.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { AutomotiveBattery02Icon, FastWindIcon, EvChargingIcon } from '@hugeicons/core-free-icons';
import type { CarTileModel, TileProps, VacuumTileModel } from '../../tileTypes';
import { BatteryNote } from '../security/securityParts';
import { GuardedLockButton } from '../security/LockTiles';
import { mainAction, vacInfo } from '../machines/vacuumParts';
import { carEntity } from '../machines/carParts';
import { AmbientCard, StatusOrb } from './AmbientSecurity';
import { OrbButton } from './ambientKit';

export function AmbientVacuum({ e: v, size, act }: TileProps<VacuumTileModel>) {
  const info = vacInfo(v);
  const m = mainAction(v);
  return (
    <AmbientCard
      size={size}
      label={v.name}
      name={v.name}
      word={info.word}
      detail={info.detail}
      hue={info.hue}
      level={!v.available ? 0 : info.busy ? 0.85 : v.state === 'error' ? 0.7 : 0.2}
      orb={(px) => <OrbButton icon={m.icon} label={`${v.name}: ${m.label.toLowerCase()}`} on={v.available && (info.busy || v.state === 'error')} color={info.hue} size={px} isDisabled={!v.available} onPress={() => act({ type: 'vacuum', cmd: m.cmd })} />}
      aside={size === 'xs' ? null : <BatteryNote battery={v.battery} always />}
      dim={!v.available}
    />
  );
}

export function AmbientCar({ e: c, size, act }: TileProps<CarTileModel>) {
  if (size === 'xs' || size === 's') {
    const e = carEntity(c, c.focus, act, true);
    const toggle = c.focus === 'charging' ? (e.control ? () => act({ type: 'charge', on: c.charging !== 'charging' }) : null) : c.focus === 'climate' && e.control ? () => act({ type: 'carClimate', on: !c.climateOn }) : null;
    return (
      <AmbientCard
        size={size}
        label={`${c.name} ${e.label}`}
        name={size === 'xs' ? e.value : `${c.name} · ${e.label}`}
        word={size === 'xs' ? `${c.name} · ${e.label}` : e.value}
        detail={e.sub}
        hue={e.hue}
        level={!c.available ? 0 : e.lit ? 0.8 : 0.15}
        orb={(px) =>
          c.focus === 'lock' && c.can.lock ? (
            <GuardedLockButton name={c.name} locked={!!c.locked} available={c.available && c.locked !== null} onLock={() => act({ type: 'lock', cmd: 'lock' })} onUnlock={() => act({ type: 'lock', cmd: 'unlock' })} compact />
          ) : toggle ? (
            <OrbButton icon={e.icon} label={`${c.name}: ${e.label.toLowerCase()} ${e.lit ? 'off' : 'on'}`} on={e.lit} color={e.hue} size={px} onPress={toggle} />
          ) : (
            <StatusOrb icon={e.icon} hue={e.hue} on={e.lit} px={px} />
          )
        }
        dim={!c.available}
      />
    );
  }
  const bat = carEntity(c, 'battery', act);
  const rest = (['lock', 'climate', 'location'] as const).map((k) => carEntity(c, k, act));
  const plugged = c.available && (c.charging === 'charging' || c.charging === 'plugged');
  return (
    <AmbientCard
      size={size}
      label={c.name}
      // Tall shares its top row with the doors button: keep a short name on one line.
      name={size === 't' ? c.name.replace(/ /g, '\u00a0') : c.name}
      word={`${bat.value}${c.rangeKm !== null && size !== 't' ? ` · ${c.rangeKm} km` : ''}`}
      detail={`${bat.sub} · ${rest.map((r) => r.value).join(' · ')}`}
      hue={bat.hue}
      level={!c.available ? 0 : c.charging === 'charging' ? 0.85 : 0.3}
      orb={(px) =>
        plugged && c.can.charge ? (
          <OrbButton icon={c.charging === 'charging' ? EvChargingIcon : AutomotiveBattery02Icon} label={`${c.name}: ${c.charging === 'charging' ? 'stop' : 'start'} charging`} on={c.charging === 'charging'} color={bat.hue} size={px} onPress={() => act({ type: 'charge', on: c.charging !== 'charging' })} />
        ) : c.can.climate ? (
          <OrbButton icon={FastWindIcon} label={`${c.name}: climate ${c.climateOn ? 'off' : 'on'}`} on={!!c.climateOn} color="hsl(22 95% 58%)" size={px} isDisabled={!c.available} onPress={() => act({ type: 'carClimate', on: !c.climateOn })} />
        ) : null
      }
      aside={
        <span className="flex items-center gap-1.5">
          {size === 'l'
            ? rest.slice(1).map((r) => (
                <span key={r.key} className="grid size-7 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${r.hue} ${r.lit ? 22 : 10}%, transparent)`, color: r.hue }}>
                  <HugeiconsIcon icon={r.icon} size={14} />
                </span>
              ))
            : null}
          {c.can.lock ? <GuardedLockButton name={c.name} locked={!!c.locked} available={c.available && c.locked !== null} onLock={() => act({ type: 'lock', cmd: 'lock' })} onUnlock={() => act({ type: 'lock', cmd: 'unlock' })} compact /> : null}
        </span>
      }
      dim={!c.available}
    />
  );
}
