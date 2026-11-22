/**
 * Quick actions on a room tile (docs/pro-ui/ROOMS.md §3): buttons for the room's lights, climate
 * (−/+ popover), media (play/pause), fans, covers and scenes, only when the room has the entities
 * behind them. Each button says its scope ("turn off both lights"), shows a spinner while HA
 * answers, and its state flips at once (optimistic). Errors are toasted by the service slice.
 * Restrained by default: a quiet button, tinted in the action's colour only while it is on.
 *
 * `look` picks the button style of a tile design (A round, B soft pill, C square). The Rooms
 * studio swaps the service (`RoomServiceContext`) so its previews never call Home Assistant.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Button, Dropdown, Popover, Spinner } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BlindsIcon, BulbIcon, FanIcon, FireIcon, MagicWand01Icon, MinusSignIcon, PauseIcon, PlayIcon, PlusSignIcon, SnowIcon, TemperatureIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ACTION_LABEL, stepTarget, type ProThermostatItem } from '../../lib/overviewThermostat';
import { AMBIENT, rgbTriplet, type QuickAction } from '../../lib/roomTiles';
import type { RoomItem, RoomsFloor } from '../../lib/roomsPage';
import { useServiceCall, type ServiceCall } from '../../widgets/shared/useServiceCall';
import { temp } from './shared';

/** A stand-in for HA's service calls (the Rooms studio's previews). Null = the real one. */
export const RoomServiceContext = createContext<ServiceCall | null>(null);
function useRoomService(): ServiceCall {
  const real = useServiceCall();
  return useContext(RoomServiceContext) ?? real;
}

export type ActionLook = 'a' | 'b' | 'c';
const LOOK: Record<ActionLook, { cls: string; icon: number }> = {
  a: { cls: 'pro-rt-act size-10 min-w-10 rounded-full', icon: 18 },
  b: { cls: 'pro-rs-act size-10 min-w-10 rounded-full', icon: 17 },
  c: { cls: 'pro-rp-act size-10 min-w-10 rounded-[11px]', icon: 17 }
};
const LookContext = createContext<ActionLook>('a');

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Runs a service call and remembers it is pending until HA answers. */
function usePending() {
  const [pending, setPending] = useState(false);
  const run = useCallback(async (job: () => Promise<void>) => {
    setPending(true);
    try {
      await job();
    } finally {
      setPending(false);
    }
  }, []);
  return { pending, run };
}

interface ActProps {
  label: string;
  icon: IconSvgElement;
  on?: boolean;
  /** The action's colour while on (RGB triplet). */
  rgb?: string;
  pending?: boolean;
  onPress?: () => void;
}

/** A quick-action button. It sits above the tile's open button (`z-10`, pointer events back on). */
function Act({ label, icon, on, rgb, pending, onPress }: ActProps) {
  const look = LOOK[useContext(LookContext)];
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      aria-pressed={Boolean(on)}
      aria-busy={pending || undefined}
      onPress={onPress}
      data-active={on ? 'true' : undefined}
      style={rgb ? { ['--act-rgb' as string]: rgb } : undefined}
      className={cn('pointer-events-auto z-10 shrink-0 p-0', look.cls)}
    >
      {pending ? <Spinner size="sm" color="current" /> : <HugeiconsIcon icon={icon} size={look.icon} />}
    </Button>
  );
}

function LightsAct({ r, useLightColor }: { r: RoomItem; useLightColor: boolean }) {
  const { call, setOptimistic } = useRoomService();
  const { pending, run } = usePending();
  const lit = r.lightsOn > 0;
  const scope = r.totalLights === 1 ? 'the light' : r.totalLights === 2 ? 'both lights' : `all ${r.totalLights} lights`;
  return (
    <Act
      icon={BulbIcon}
      on={lit}
      rgb={(useLightColor && r.lightColor && rgbTriplet(r.lightColor)) || AMBIENT.amber}
      pending={pending}
      label={`${r.name}: turn ${lit ? 'off' : 'on'} ${scope}`}
      onPress={() =>
        run(async () => {
          for (const id of r.lightIds) setOptimistic(id, lit ? 'off' : 'on');
          await call('light', lit ? 'turn_off' : 'turn_on', {}, r.lightIds);
        })
      }
    />
  );
}

function MediaAct({ r }: { r: RoomItem }) {
  const { call, setOptimistic } = useRoomService();
  const { pending, run } = usePending();
  const m = r.media;
  if (!m) return null;
  return (
    <Act
      icon={m.playing ? PauseIcon : PlayIcon}
      on={m.playing}
      rgb={AMBIENT.violet}
      pending={pending}
      label={`${r.name}: ${m.playing ? 'pause' : 'play'}${m.title ? ` ${m.title}` : ' media'}`}
      onPress={() =>
        run(async () => {
          setOptimistic(m.entityId, m.playing ? 'paused' : 'playing');
          await call('media_player', 'media_play_pause', {}, m.entityId);
        })
      }
    />
  );
}

function FanAct({ r }: { r: RoomItem }) {
  const { call, setOptimistic } = useRoomService();
  const { pending, run } = usePending();
  const on = r.fansOn > 0;
  return (
    <Act
      icon={FanIcon}
      on={on}
      rgb={AMBIENT.teal}
      pending={pending}
      label={`${r.name}: turn ${on ? 'off' : 'on'} ${r.fanIds.length === 1 ? 'the fan' : `all ${r.fanIds.length} fans`}`}
      onPress={() =>
        run(async () => {
          for (const id of r.fanIds) setOptimistic(id, on ? 'off' : 'on');
          await call('fan', on ? 'turn_off' : 'turn_on', {}, r.fanIds);
        })
      }
    />
  );
}

function CoverAct({ r }: { r: RoomItem }) {
  const { call, setOptimistic } = useRoomService();
  const { pending, run } = usePending();
  const open = r.coversOpen > 0;
  const scope = r.coverIds.length === 1 ? 'the cover' : `all ${r.coverIds.length} covers`;
  return (
    <Act
      icon={BlindsIcon}
      on={open}
      rgb={AMBIENT.blue}
      pending={pending}
      label={`${r.name}: ${open ? 'close' : 'open'} ${scope}`}
      onPress={() =>
        run(async () => {
          for (const id of r.coverIds) setOptimistic(id, open ? 'closing' : 'opening');
          await call('cover', open ? 'close_cover' : 'open_cover', {}, r.coverIds);
        })
      }
    />
  );
}

/** Thermometer button; opens −/+ on the room's thermostat target. Tinted (not filled) while working. */
function ClimateAct({ r }: { r: RoomItem }) {
  const { call, setOptimistic } = useRoomService();
  const look = LOOK[useContext(LookContext)];
  const t = r.thermostat;
  if (!t) return null;
  const step = (th: ProThermostatItem, dir: -1 | 1) => {
    const temperature = stepTarget(th, dir);
    setOptimistic(th.entityId, null, { temperature });
    void call('climate', 'set_temperature', { temperature }, th.entityId);
  };
  const working = t.action === 'heating' || t.action === 'cooling';
  const off = t.action === 'off' || t.target === null;
  const label = `${ACTION_LABEL[t.action]}${t.target !== null && t.action !== 'off' ? ` to ${temp(t.target)}` : ''}`;
  return (
    <Popover>
      <Button
        isIconOnly
        variant="ghost"
        aria-label={`${r.name} climate: ${label}. Change the temperature`}
        data-active={working ? 'true' : undefined}
        style={{ ['--act-rgb' as string]: t.action === 'cooling' ? AMBIENT.blue : AMBIENT.rose }}
        className={cn('pointer-events-auto z-10 shrink-0 p-0', look.cls)}
      >
        <HugeiconsIcon icon={t.action === 'heating' ? FireIcon : t.action === 'cooling' ? SnowIcon : TemperatureIcon} size={look.icon} />
      </Button>
      <Popover.Content placement="left" className="pro" data-page="rooms">
        <Popover.Dialog aria-label={`${r.name} temperature`} className="flex flex-col items-center gap-2 p-3">
          <span className="text-xs text-muted">
            {t.shortName || 'Thermostat'} · now {temp(t.current)}
          </span>
          <span className="flex items-center gap-3">
            <Button isIconOnly size="sm" variant="secondary" isDisabled={off} onPress={() => step(t, -1)} aria-label="Lower the temperature" className="rounded-full">
              <HugeiconsIcon icon={MinusSignIcon} size={16} />
            </Button>
            <span className="min-w-14 text-center text-2xl font-semibold tabular-nums" aria-live="polite">
              {off ? 'Off' : temp(t.target)}
            </span>
            <Button isIconOnly size="sm" variant="secondary" isDisabled={off} onPress={() => step(t, 1)} aria-label="Raise the temperature" className="rounded-full">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
            </Button>
          </span>
          <span className="text-xs font-medium text-muted">{ACTION_LABEL[t.action]}</span>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/** The room's scenes in a menu. */
function ScenesAct({ r }: { r: RoomItem }) {
  const { call, setOptimistic } = useRoomService();
  const look = LOOK[useContext(LookContext)];
  if (!r.scenes.length) return null;
  return (
    <Dropdown>
      <Button isIconOnly variant="ghost" aria-label={`${r.name}: ${plural(r.scenes.length, 'scene')}`} className={cn('pointer-events-auto z-10 shrink-0 p-0', look.cls)}>
        <HugeiconsIcon icon={MagicWand01Icon} size={look.icon} />
      </Button>
      <Dropdown.Popover placement="left top" className="min-w-52">
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

interface RoomQuickActionsProps {
  r: RoomItem;
  actions: readonly QuickAction[];
  useLightColor: boolean;
  look?: ActionLook;
  className?: string;
}

export function RoomQuickActions({ r, actions, useLightColor, look = 'a', className }: RoomQuickActionsProps) {
  if (!actions.length) return null;
  return (
    <LookContext.Provider value={look}>
      <div className={cn('flex shrink-0 items-center gap-2', className)}>
        {actions.map((a) =>
          a === 'lights' ? (
            <LightsAct key={a} r={r} useLightColor={useLightColor} />
          ) : a === 'climate' ? (
            <ClimateAct key={a} r={r} />
          ) : a === 'media' ? (
            <MediaAct key={a} r={r} />
          ) : a === 'fan' ? (
            <FanAct key={a} r={r} />
          ) : a === 'cover' ? (
            <CoverAct key={a} r={r} />
          ) : (
            <ScenesAct key={a} r={r} />
          )
        )}
      </div>
    </LookContext.Provider>
  );
}

/** Turns off every light on a floor. */
export function useFloorLightsOff() {
  const { call, setOptimistic } = useRoomService();
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
