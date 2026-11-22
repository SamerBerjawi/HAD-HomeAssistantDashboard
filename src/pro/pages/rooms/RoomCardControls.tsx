/**
 * Quick controls on a room card (docs/pro-ui/ROOMS.md §3): the scene menu, the climate chip with
 * its −/+ popover, and the floor's "Lights off".
 */
import { useMemo } from 'react';
import { Button, Dropdown, Popover } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FireIcon, MagicWand01Icon, MinusSignIcon, PlusSignIcon, SnowIcon, TemperatureIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ACTION_LABEL } from '../../lib/overviewThermostat';
import type { RoomItem, RoomsFloor } from '../../lib/roomsPage';
import { actionHue, useThermostatActions } from '../../widgets/thermostat/concepts/shared';
import { useServiceCall } from '../../widgets/shared/useServiceCall';
import { temp } from './shared';

export const GLASS = 'bg-white/18 text-white ring-1 ring-white/25 backdrop-blur-md';

/** Scenes of the room in a menu (a wand button on the card). */
export function ScenesMenu({ r, size }: { r: RoomItem; size: string }) {
  const { call, setOptimistic } = useServiceCall();
  if (!r.scenes.length) return null;
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`${r.name}: scenes`} className={cn('pointer-events-auto z-10 min-w-0 rounded-full', size, GLASS)}>
        <HugeiconsIcon icon={MagicWand01Icon} size={16} />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-52">
        <Dropdown.Menu
          aria-label={`${r.name} scenes`}
          onAction={(key) => {
            const id = String(key);
            setOptimistic(id, new Date().toISOString());
            void call('scene', 'turn_on', {}, id);
          }}
        >
          {r.scenes.map((s) => (
            <Dropdown.Item key={s.entityId} id={s.entityId} textValue={s.name}>
              <HugeiconsIcon icon={MagicWand01Icon} size={15} className="shrink-0 text-muted" />
              <span className="truncate">{s.name}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** "Heating · 21°" on the card; tap for −/+ on the target. */
export function ClimateChip({ r }: { r: RoomItem }) {
  const { step } = useThermostatActions();
  const t = r.thermostat;
  if (!t || t.action === 'off') return null;
  const hue = actionHue(t.action);
  const label = `${ACTION_LABEL[t.action]}${t.target !== null ? ` · ${temp(t.target)}` : ''}`;
  return (
    <Popover>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`${r.name} climate: ${label}. Change the temperature`}
        className={cn('pointer-events-auto z-10 h-6! min-h-0 min-w-0 shrink-0 gap-1 whitespace-nowrap rounded-full px-2 text-[11px]! font-semibold leading-none', GLASS)}
        style={hue ? { background: `color-mix(in srgb, ${hue} 70%, transparent)` } : undefined}
      >
        <HugeiconsIcon icon={t.action === 'heating' ? FireIcon : t.action === 'cooling' ? SnowIcon : TemperatureIcon} size={12} className="shrink-0" />
        {/* Phones: icon and target only, so a second chip fits beside it. */}
        <span className={t.target !== null ? 'max-sm:hidden' : undefined}>{ACTION_LABEL[t.action]}</span>
        {t.target !== null ? (
          <span>
            <span className="max-sm:hidden">· </span>
            {temp(t.target)}
          </span>
        ) : null}
      </Button>
      <Popover.Content placement="top" className="pro" data-page="rooms">
        <Popover.Dialog aria-label={`${r.name} temperature`} className="flex flex-col items-center gap-2 p-3">
          <span className="text-xs text-muted">
            {t.shortName || 'Thermostat'} · now {temp(t.current)}
          </span>
          <span className="flex items-center gap-3">
            <Button isIconOnly size="sm" variant="secondary" onPress={() => step(t, -1)} aria-label="Lower the temperature" className="rounded-full">
              <HugeiconsIcon icon={MinusSignIcon} size={16} />
            </Button>
            <span className="min-w-14 text-center text-2xl font-semibold tabular-nums" aria-live="polite">
              {temp(t.target)}
            </span>
            <Button isIconOnly size="sm" variant="secondary" onPress={() => step(t, 1)} aria-label="Raise the temperature" className="rounded-full">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
            </Button>
          </span>
          <span className="text-xs font-medium" style={hue ? { color: hue } : undefined}>
            {ACTION_LABEL[t.action]}
          </span>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/** Turns off every light on a floor. */
export function useFloorLightsOff() {
  const { call, setOptimistic } = useServiceCall();
  return useMemo(
    () => (f: RoomsFloor) => {
      const ids = f.rooms.flatMap((r) => (r.lightsOn > 0 ? r.lightIds : []));
      if (!ids.length) return;
      for (const id of ids) setOptimistic(id, 'off');
      void call('light', 'turn_off', {}, ids);
    },
    [call, setOptimistic]
  );
}
