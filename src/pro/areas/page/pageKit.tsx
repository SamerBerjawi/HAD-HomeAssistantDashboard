/**
 * Shared bits of the Area page (batch 6; the real page and the studio's concepts): what a page is
 * handed, the way back and to the next room, the room's facts, the editing hooks for a grid, and
 * a section heading.
 */
import type { ReactNode } from 'react';
import { Button, Dropdown, Label } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, DashboardSquare01Icon, Delete02Icon, DropletIcon, ArrowUp01Icon, ArrowDown01Icon, BulbIcon, EyeIcon, MoreHorizontalIcon, PencilEdit01Icon, TemperatureIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { CarTileModel, TileAction, TileModel, TileSize } from '../tileTypes';
import { hide, moveBy, moveOnto, moveSection, moveTileToSection, setSize, togglePin, type AnyDevice, type RoomItem, type SectionId } from './roomLayout';
import { roomFacts } from './roomSummary';
import type { GridEditing } from './RoomGrid';
import type { RoomEditor } from './useRoomEditor';

/** A tile on the page; car X-small / Small tiles say which of the car's entities they are about. */
export interface PageItem extends RoomItem {
  focus?: CarTileModel['focus'];
}

export interface PageRoom {
  id: string;
  name: string;
  /** A CSS background for the room's picture, when it has one. */
  photo: string | null;
  items: PageItem[];
  /** The area in Home Assistant (for the empty room's link), when known. */
  haUrl?: string | null;
}

export interface PageProps {
  room: PageRoom;
  /** Every room in the Rooms page's order, for previous / next. */
  rooms: readonly { id: string; name: string }[];
  onRoom: (id: string) => void;
  /** Back to every room. */
  onBack?: () => void;
  /** The tile's model (car tiles carry their focus). */
  model: (key: string) => TileModel;
  /** The tile's name in menus and the Hidden tray (car entity tiles: "Model Y · Doors"); default the model's name. */
  name?: (key: string) => string;
  renderTile: (key: string, size: TileSize) => ReactNode;
  /** A tile's action, by tile key. */
  actOn: (key: string, a: TileAction) => void;
  device: AnyDevice;
}

/** Tappable room title with dropdown picker to switch directly to another room. */
export function RoomTitlePicker({
  room,
  rooms,
  onRoom,
  className
}: Pick<PageProps, 'room' | 'rooms' | 'onRoom'> & { className?: string }) {
  if (rooms.length <= 1) {
    return (
      <h1 className={cn('min-w-0 truncate text-[24px] font-bold leading-tight tracking-[-0.02em]', className)}>
        {room.name}
      </h1>
    );
  }
  return (
    <Dropdown>
      <Button
        variant="ghost"
        aria-label={`Jump to room (currently ${room.name})`}
        className={cn('-ml-1.5 h-auto min-w-0 max-w-full justify-start gap-1 rounded-xl px-1.5 py-0.5 text-left', className)}
      >
        <h1 className="min-w-0 truncate text-[24px] font-bold leading-tight tracking-[-0.02em]">{room.name}</h1>
        <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="shrink-0 opacity-70" />
      </Button>
      <Dropdown.Popover placement="bottom start" className="max-h-[60dvh] min-w-52 overflow-y-auto">
        <Dropdown.Menu aria-label="Jump to room" onAction={(key) => onRoom(String(key))}>
          {rooms.map((r) => (
            <Dropdown.Item key={r.id} id={r.id} textValue={r.id === room.id ? `${r.name}, current room` : r.name}>
              <HugeiconsIcon icon={Tick02Icon} size={15} className={r.id === room.id ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} aria-hidden="true" />
              <Label className="truncate">{r.name}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** All rooms + optional quick-jump picker + ‹ › previous / next room (in the Rooms page's order). */
export function RoomNav({
  room,
  rooms,
  onRoom,
  onBack,
  right,
  light,
  hidePicker = false
}: Pick<PageProps, 'room' | 'rooms' | 'onRoom' | 'onBack'> & { right?: ReactNode; light?: boolean; hidePicker?: boolean }) {
  const i = rooms.findIndex((r) => r.id === room.id);
  const prev = i > 0 ? rooms[i - 1] : null;
  const next = i >= 0 && i < rooms.length - 1 ? rooms[i + 1] : null;
  return (
    <nav aria-label="Rooms" className={cn('flex items-center gap-1', light && 'text-white')}>
      <Button size="sm" variant="ghost" className="-ml-2 gap-1 px-2 text-[13px] font-medium opacity-80" onPress={() => onBack?.()}>
        <HugeiconsIcon icon={DashboardSquare01Icon} size={15} />
        All rooms
      </Button>
      <span className="flex-1" />
      {rooms.length > 1 ? (
        <>
          {!hidePicker ? (
            <Dropdown>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Jump to room (currently ${room.name})`}
                className="h-8 max-w-[140px] min-w-0 gap-1 rounded-full px-2.5 text-xs font-medium opacity-85 sm:max-w-[200px]"
              >
                <span className="truncate">{room.name}</span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={13} className="shrink-0" />
              </Button>
              <Dropdown.Popover placement="bottom end" className="max-h-[60dvh] min-w-52 overflow-y-auto">
                <Dropdown.Menu aria-label="Jump to room" onAction={(key) => onRoom(String(key))}>
                  {rooms.map((r) => (
                    <Dropdown.Item key={r.id} id={r.id} textValue={r.id === room.id ? `${r.name}, current room` : r.name}>
                      <HugeiconsIcon icon={Tick02Icon} size={15} className={r.id === room.id ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} aria-hidden="true" />
                      <Label className="truncate">{r.name}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : null}
          <Button isIconOnly size="sm" variant="ghost" isDisabled={!prev} aria-label={prev ? `Previous room: ${prev.name}` : 'No previous room'} onPress={() => prev && onRoom(prev.id)} className="size-8 min-w-0 rounded-full">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" isDisabled={!next} aria-label={next ? `Next room: ${next.name}` : 'No next room'} onPress={() => next && onRoom(next.id)} className="size-8 min-w-0 rounded-full">
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        </>
      ) : null}
      {right}
    </nav>
  );
}

/** "21.8° · 48% · 3 lights on", as icons and words. */
export function Facts({ models, className }: { models: TileModel[]; className?: string }) {
  const f = roomFacts(models);
  const items = [
    f.temperature !== null ? { icon: TemperatureIcon, text: `${f.temperature.toFixed(1)}°` } : null,
    f.humidity !== null ? { icon: DropletIcon, text: `${Math.round(f.humidity)}%` } : null,
    f.lights ? { icon: BulbIcon, text: f.lightsOn ? `${f.lightsOn} light${f.lightsOn > 1 ? 's' : ''} on` : 'Lights off' } : null
  ].filter((x): x is NonNullable<typeof x> => x !== null);
  if (!items.length) return null;
  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted', className)}>
      {items.map((it) => (
        <span key={it.text} className="inline-flex items-center gap-1 tabular-nums">
          <HugeiconsIcon icon={it.icon} size={15} />
          {it.text}
        </span>
      ))}
    </p>
  );
}

/** Turn off every light in `keys` that is on. */
export function lightsOff(props: PageProps, keys: string[]) {
  for (const k of keys) {
    const m = props.model(k);
    if (m.kind === 'light' && m.isOn && m.available) props.actOn(k, { type: 'toggle' });
  }
}

/** The tile's name for menus and the Hidden tray. */
export const nameOf = (props: Pick<PageProps, 'model' | 'name'>) => props.name ?? ((k: string) => props.model(k).name);

export function gridEditing(
  editor: RoomEditor,
  name: (key: string) => string,
  withPin = false,
  extra?: {
    items?: readonly RoomItem[];
    sections?: readonly { id: SectionId; title: string }[];
    currentSection?: SectionId;
    onEditTile?: (key: string) => void;
    hasVisibilityRules?: (key: string) => boolean;
    onEditVisibility?: (key: string) => void;
  }
): GridEditing {
  return {
    name,
    onMoveOnto: (k, over) => editor.update((l) => moveOnto(l, k, over)),
    onMoveBy: (k, dir) => editor.update((l) => moveBy(l, k, dir)),
    onSize: (k, size) => editor.update((l) => setSize(l, k, size)),
    onHide: (k) => editor.update((l) => hide(l, k)),
    ...(withPin ? { pinned: (k: string) => editor.layout.pinned.includes(k), onPin: (k: string) => editor.update((l) => togglePin(l, k)) } : {}),
    ...(extra?.sections ? { sections: extra.sections, currentSection: extra.currentSection, onMoveToSection: (k: string, target: SectionId) => editor.update((l) => moveTileToSection(l, k, target, extra.items)) } : {}),
    ...(extra?.onEditTile ? { onEditTile: extra.onEditTile } : {}),
    ...(extra?.hasVisibilityRules ? { hasVisibilityRules: extra.hasVisibilityRules } : {}),
    ...(extra?.onEditVisibility ? { onEditVisibility: extra.onEditVisibility } : {})
  };
}

/** A section heading; in edit mode it gets ↑ / ↓ to move the section and optional rename/delete/visibility controls. */
export function SectionHeading({
  id,
  title,
  summary,
  action,
  editor,
  index,
  count,
  isCustom = false,
  hasVisibilityRules = false,
  onEditVisibility,
  onRename,
  onDelete
}: {
  id: SectionId;
  title: string;
  summary?: string;
  action?: ReactNode;
  editor?: RoomEditor;
  index: number;
  count: number;
  isCustom?: boolean;
  hasVisibilityRules?: boolean;
  onEditVisibility?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  const showMenu = Boolean(onEditVisibility || (isCustom && (onRename || onDelete)));
  return (
    <div className="mb-2 flex min-h-8 items-center gap-2 px-1">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {editor?.editing && hasVisibilityRules ? (
        <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">Conditional</span>
      ) : null}
      {summary ? <span className="truncate text-[13px] text-muted">{summary}</span> : null}
      <span className="flex-1" />
      {editor?.editing ? (
        <span className="flex items-center gap-1">
          {showMenu ? (
            <Dropdown>
              <Button isIconOnly size="sm" variant="secondary" aria-label={`${title} section options`} className="size-8 min-w-0 rounded-full">
                <HugeiconsIcon icon={MoreHorizontalIcon} size={15} />
              </Button>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu
                  aria-label={`${title} options`}
                  onAction={(key) => {
                    if (key === 'rules') onEditVisibility?.();
                    else if (key === 'rename') onRename?.();
                    else if (key === 'delete') onDelete?.();
                  }}
                >
                  {onEditVisibility ? (
                    <Dropdown.Item id="rules" textValue="Visibility rules">
                      <HugeiconsIcon icon={EyeIcon} size={15} className={hasVisibilityRules ? 'shrink-0 text-[var(--accent)]' : 'shrink-0'} />
                      <Label>Visibility rules…</Label>
                    </Dropdown.Item>
                  ) : null}
                  {onRename ? (
                    <Dropdown.Item id="rename" textValue="Rename section">
                      <HugeiconsIcon icon={PencilEdit01Icon} size={15} className="shrink-0" />
                      <Label>Rename section…</Label>
                    </Dropdown.Item>
                  ) : null}
                  {onDelete ? (
                    <Dropdown.Item id="delete" textValue="Delete section">
                      <HugeiconsIcon icon={Delete02Icon} size={15} className="shrink-0 text-danger" />
                      <Label>Delete section</Label>
                    </Dropdown.Item>
                  ) : null}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : null}
          <Button isIconOnly size="sm" variant="secondary" aria-label={`Move ${title} up`} isDisabled={index === 0} onPress={() => editor.update((l) => moveSection(l, id, -1))} className="size-8 min-w-0 rounded-full">
            <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
          </Button>
          <Button isIconOnly size="sm" variant="secondary" aria-label={`Move ${title} down`} isDisabled={index === count - 1} onPress={() => editor.update((l) => moveSection(l, id, 1))} className="size-8 min-w-0 rounded-full">
            <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
          </Button>
        </span>
      ) : (
        action
      )}
    </div>
  );
}
