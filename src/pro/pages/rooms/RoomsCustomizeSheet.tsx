/**
 * Customize the Rooms page (owner, 2026-11-20; tiles 2026-11-22). Page, tile and quick-action
 * options, every extra optional (`preferences.proRooms`, see ROOMS_TOGGLES). Floors: order and
 * show/hide. Rooms: tile size and colour (tap the room's icon), favourite, order within the floor
 * and show/hide. Floors and rooms use the user's shared Rooms settings
 * (`rooms.floorOrder`, `hiddenFloors`, `areaOrder`, `hiddenAreas`, `favoriteAreas`,
 * `areaOverrides[id].customColor`), so the classic Rooms page follows the same choices.
 */
import { useState } from 'react';
import { Button, Switch, ToggleButton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, PaintBoardIcon, StarIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { ProSheet } from '../../components/ProSheet';
import { toggleFavorite } from '../../lib/overviewAreas';
import { autoTileSize, type TileSizeChoice } from '../../lib/roomTiles';
import type { RoomItem, RoomsPageModel } from '../../lib/roomsPage';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import { DEFAULT_ROOMS_PREFS, rawRoomsPrefs, ROOM_COLORS, ROOMS_PREF_KEY, ROOMS_TOGGLES, roomIcon, type RoomsPagePrefs } from './shared';

type Rooms = NonNullable<ReturnType<typeof useUserConfig>['config']['rooms']>;

const GROUP_TITLE = { page: 'Page', cards: 'Tiles', actions: 'Quick actions' } as const;

const swap = <T,>(list: readonly T[], i: number, j: number) => {
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};
const toggleIn = (list: readonly string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

function Toggle({ label, isSelected, onChange }: { label: string; isSelected: boolean; onChange: () => void }) {
  return (
    <Switch size="sm" isSelected={isSelected} onChange={onChange} aria-label={label}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

function MoveButtons({ name, first, last, onMove }: { name: string; first: boolean; last: boolean; onMove: (by: -1 | 1) => void }) {
  return (
    <span className="flex shrink-0">
      <Button isIconOnly size="sm" variant="ghost" isDisabled={first} onPress={() => onMove(-1)} aria-label={`Move ${name} up`} className="size-8 min-w-0">
        <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
      </Button>
      <Button isIconOnly size="sm" variant="ghost" isDisabled={last} onPress={() => onMove(1)} aria-label={`Move ${name} down`} className="size-8 min-w-0">
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
      </Button>
    </span>
  );
}

const SIZE_LABEL: Record<TileSizeChoice, string> = { auto: 'Auto', compact: 'Compact', standard: 'Standard', expanded: 'Large' };

/** A room's options: tile size and colour. */
function RoomOptions({ room, size, onSize, onPick }: { room: RoomItem; size: TileSizeChoice; onSize: (s: TileSizeChoice) => void; onPick: (hex: string | null) => void }) {
  const auto = SIZE_LABEL[autoTileSize(room)].toLowerCase();
  return (
    <div className="flex flex-col gap-2 pb-3 pl-10">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Tile size{size === 'auto' ? ` (now ${auto})` : ''}</span>
        <SheetFilter
          label={`${room.name} tile size`}
          value={size}
          onChange={onSize}
          options={(['auto', 'compact', 'standard', 'expanded'] as const).map((id) => ({ id, label: SIZE_LABEL[id] }))}
        />
      </div>
      <div role="group" aria-label={`${room.name} colour`} className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={room.customColor ? 'ghost' : 'secondary'} onPress={() => onPick(null)} className="h-7 rounded-full px-2.5 text-xs">
          Automatic
        </Button>
        {ROOM_COLORS.map((c) => {
          const on = room.customColor && room.color.toLowerCase() === c.hex;
          return (
            <Button
              key={c.hex}
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => onPick(c.hex)}
              aria-label={c.name}
              aria-pressed={on}
              className={cn('size-7 min-w-0 rounded-full text-white', on && 'ring-2 ring-offset-2 ring-[var(--foreground)] ring-offset-[var(--background)]')}
              style={{ background: c.hex }}
            >
              {on ? <HugeiconsIcon icon={Tick02Icon} size={14} /> : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  /** Every room, hidden ones too, in the page's order. */
  model: RoomsPageModel;
  prefs: RoomsPagePrefs;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomsCustomizeSheet({ model, prefs, isOpen, onOpenChange }: Props) {
  const { config, updateConfig } = useUserConfig();
  const [colorFor, setColorFor] = useState<string | null>(null);
  const rooms = config.rooms;
  const hiddenAreas = rooms?.hiddenAreas ?? [];
  const hiddenFloors = rooms?.hiddenFloors ?? [];
  const favorites = rooms?.favoriteAreas ?? [];

  const setRooms = (patch: (r: Rooms) => Partial<Rooms>) => updateConfig((prev) => ({ ...prev, rooms: { ...prev.rooms, ...patch(prev.rooms) } }));
  // Keeps keys this version doesn't use (older options), so nothing saved is silently dropped.
  const setPrefs = (next: Partial<RoomsPagePrefs>) =>
    updateConfig((prev) => ({ ...prev, preferences: { ...(prev.preferences || {}), [ROOMS_PREF_KEY]: { ...rawRoomsPrefs(prev.preferences), ...prefs, ...next } } as typeof prev.preferences }));
  const setSize = (id: string, size: TileSizeChoice) => {
    const sizes = { ...prefs.sizes };
    if (size === 'auto') delete sizes[id];
    else sizes[id] = size;
    setPrefs({ sizes });
  };

  const floors = model.floors.filter((f) => f.floorId !== null);
  const moveFloor = (i: number, by: -1 | 1) =>
    setRooms(() => ({
      floorOrder: swap(
        floors.map((f) => f.floorId as string),
        i,
        i + by
      )
    }));
  const moveRoom = (floorRooms: RoomItem[], i: number, by: -1 | 1) => {
    const ids = model.floors.flatMap((f) => (f.rooms === floorRooms ? swap(f.rooms, i, i + by) : f.rooms)).map((r) => r.areaId);
    setRooms(() => ({ areaOrder: ids }));
  };
  const pickColor = (id: string, hex: string | null) =>
    setRooms((r) => ({ areaOverrides: { ...(r?.areaOverrides ?? {}), [id]: { ...(r?.areaOverrides?.[id] ?? {}), customColor: hex, color: hex } } }));
  const reset = () => {
    setRooms(() => ({ floorOrder: [], areaOrder: [] }));
    setPrefs(DEFAULT_ROOMS_PREFS);
  };

  const row = 'flex min-h-11 items-center gap-2';
  return (
    <ProSheet isOpen={isOpen} onOpenChange={onOpenChange} title="Customize Rooms" subtitle="Saved for every screen" icon={PaintBoardIcon} page="rooms" size="lg">
      <div className="flex flex-col gap-5">
        {(['page', 'cards', 'actions'] as const).map((group) => (
          <section key={group} aria-label={GROUP_TITLE[group]} className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-muted">{GROUP_TITLE[group]}</h3>
            {group === 'actions' ? <p className="text-xs text-muted">Shown only when a room has the devices for them. Standard tiles show two, large tiles three.</p> : null}
            {group === 'cards' ? (
              <>
                <div className={row}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm">Sizes</span>
                    <span className="text-xs text-muted">Mixed follows each room (tap its icon below); All standard is an even grid of 300×200 tiles</span>
                  </span>
                  <SheetFilter
                    label="Tile sizes"
                    value={prefs.cardSize}
                    onChange={(v) => setPrefs({ cardSize: v })}
                    options={[
                      { id: 'large', label: 'Mixed' },
                      { id: 'standard', label: 'All standard' },
                      { id: 'compact', label: 'All compact' }
                    ]}
                  />
                </div>
                <div className={row}>
                  <span className="flex-1 text-sm">Big number</span>
                  <SheetFilter
                    label="Big number on tiles"
                    value={prefs.metric}
                    onChange={(v) => setPrefs({ metric: v })}
                    options={[
                      { id: 'temperature', label: 'Temperature' },
                      { id: 'humidity', label: 'Humidity' }
                    ]}
                  />
                </div>
              </>
            ) : null}
            {ROOMS_TOGGLES.filter((t) => t.group === group).map((t) => (
              <div key={t.key} className={row}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm">{t.label}</span>
                  {t.hint ? <span className="text-xs text-muted">{t.hint}</span> : null}
                </span>
                <Toggle label={t.label} isSelected={prefs[t.key]} onChange={() => setPrefs({ [t.key]: !prefs[t.key] })} />
              </div>
            ))}
          </section>
        ))}

        {floors.length > 1 ? (
          <section aria-label="Floors" className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-muted">Floors</h3>
            {floors.map((f, i) => {
              const id = f.floorId as string;
              const shown = !hiddenFloors.includes(id);
              return (
                <div key={id} className={row}>
                  <span className={cn('min-w-0 flex-1 truncate text-sm', !shown && 'text-muted')}>{f.name}</span>
                  <MoveButtons name={f.name} first={i === 0} last={i === floors.length - 1} onMove={(by) => moveFloor(i, by)} />
                  <Toggle label={`Show ${f.name}`} isSelected={shown} onChange={() => setRooms(() => ({ hiddenFloors: toggleIn(hiddenFloors, id) }))} />
                </div>
              );
            })}
          </section>
        ) : null}

        {model.floors.map((f) => (
          <section key={f.floorId ?? 'none'} aria-label={`Rooms on ${f.name}`} className="flex flex-col">
            <h3 className="mb-1 text-xs font-semibold text-muted">{model.floors.length > 1 ? f.name : 'Rooms'}</h3>
            {f.rooms.map((r, i) => {
              const shown = !hiddenAreas.includes(r.areaId);
              const fav = favorites.includes(r.areaId);
              return (
                <div key={r.areaId}>
                  <div className={row}>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => setColorFor(colorFor === r.areaId ? null : r.areaId)}
                      aria-label={`${r.name}: size and colour`}
                      aria-expanded={colorFor === r.areaId}
                      className="size-8 min-w-0 shrink-0 rounded-full text-white"
                      style={{ background: r.color }}
                    >
                      <HugeiconsIcon icon={roomIcon(r)} size={15} />
                    </Button>
                    <span className={cn('min-w-0 flex-1 truncate text-sm', !shown && 'text-muted line-through')}>{r.name}</span>
                    <ToggleButton
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      isSelected={fav}
                      onChange={() => setRooms((c) => ({ favoriteAreas: toggleFavorite(c?.favoriteAreas ?? [], r.areaId) }))}
                      aria-label={`${r.name}: favourite`}
                      className="size-8 min-w-0"
                    >
                      <HugeiconsIcon icon={StarIcon} size={16} className={cn(fav && 'fill-current text-[hsl(44_100%_55%)]')} />
                    </ToggleButton>
                    <MoveButtons name={r.name} first={i === 0} last={i === f.rooms.length - 1} onMove={(by) => moveRoom(f.rooms, i, by)} />
                    <Toggle label={`Show ${r.name}`} isSelected={shown} onChange={() => setRooms(() => ({ hiddenAreas: toggleIn(hiddenAreas, r.areaId) }))} />
                  </div>
                  {colorFor === r.areaId ? <RoomOptions room={r} size={prefs.sizes[r.areaId] ?? 'auto'} onSize={(size) => setSize(r.areaId, size)} onPick={(hex) => pickColor(r.areaId, hex)} /> : null}
                </div>
              );
            })}
          </section>
        ))}

        <Button size="sm" variant="ghost" onPress={reset} className="self-start text-xs">
          Reset order, tile sizes and page options
        </Button>
      </div>
    </ProSheet>
  );
}
