/**
 * Rooms page body, "Ambient explorer" (docs/pro-ui/ROOMS.md §3 + Phase 1.2/1.4):
 * - Home status summary bar with interactive Lit / Open filters
 * - Filter bar: All · Active (live happening-now rooms) · Favourites · Floors (with per-device landing default)
 * - View mode: mixed-size room tiles packed into gap-free bands
 * - Edit mode: in-place sortable tile grid with TouchSensor long-press, DragOverlay, tile `⋯` menu,
 *   floor reorder/hide controls, and a 1-tap restore tray for hidden rooms/floors.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { Button, Dropdown, Header, Label } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BulbIcon,
  Door01Icon,
  DragDropVerticalIcon,
  FlashIcon,
  MoreHorizontalIcon,
  PaintBoardIcon,
  Settings01Icon,
  StarIcon,
  TemperatureIcon,
  Tick02Icon,
  UserIcon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { bandLayout, blendMetrics, compactRowsAt, EVEN_TILE_MIN, packTileBands, roomActions, tileColumns, tileSizeFor, type BandMetrics, type QuickAction, type TileBand, type TileSize, type TileSizeChoice } from '../../lib/roomTiles';
import type { RoomItem, RoomsFloor, RoomsPageModel, RoomsTotals } from '../../lib/roomsPage';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import { useFloorLightsOff } from './RoomQuickActions';
import { RoomTileBlend } from './RoomTileBlend';
import type { RoomTileComponent } from './tileParts';
import { enabledActions, temp, type RoomsPagePrefs } from './shared';

const FILTER_KEY = 'had.pro.rooms.filter';
const COLLAPSED_KEY = 'had.pro.rooms.collapsed';
const FAV = 'favourites';
const ACTIVE = 'active';
const SWIPE_PX = 60;
const GAP = 12;

type SummaryFilter = 'lit' | 'open';
const SUMMARY_TEST: Record<SummaryFilter, (r: RoomItem) => boolean> = { lit: (r) => r.lightsOn > 0, open: (r) => r.openContacts > 0 };
const SUMMARY_LABEL: Record<SummaryFilter, { label: string; icon: IconSvgElement }> = { lit: { label: 'Lit', icon: BulbIcon }, open: { label: 'Open', icon: Door01Icon } };
const isSummary = (f: string): f is SummaryFilter => f in SUMMARY_TEST;
const floorKey = (f: Pick<RoomsFloor, 'floorId'>) => f.floorId ?? 'none';
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function readStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the choice lasts this visit */
  }
}
/** Older builds saved the filter as a bare string. */
function readFilter(): string {
  try {
    const v = localStorage.getItem(FILTER_KEY);
    if (v === null) return 'all';
    return v.startsWith('"') ? (JSON.parse(v) as string) : v;
  } catch {
    return 'all';
  }
}

/** Width of the rooms area (one observer for the whole page). */
function useWidth() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  const ref = useCallback((node: HTMLElement | null) => setEl(node), []);
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.floor(e.contentRect.width);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth((prev) => (prev === w ? prev : w)));
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [el]);
  return { ref, width };
}

/** People whose HA person entity is home, or null when the home has no person entities. */
function usePeopleHome(): number | null {
  return useAutoLayoutStore((s) => {
    const people = s.domainGroups['person'] ?? [];
    return people.length ? people.filter((p) => p.state === 'home').length : null;
  });
}

function Stat({ icon, value, label, tone, selected, onPress }: { icon: IconSvgElement; value: string; label: string; tone?: 'warn' | 'lit'; selected?: boolean; onPress?: () => void }) {
  const body = (
    <>
      <HugeiconsIcon icon={icon} size={20} className={cn('shrink-0', tone === 'warn' ? 'text-[hsl(24_90%_55%)]' : tone === 'lit' ? 'pro-rt-lit' : 'text-[var(--accent)]')} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[15px] font-semibold tabular-nums">{value}</span>
        <span className="text-[11px] font-normal text-muted">{label}</span>
      </span>
    </>
  );
  const box = 'pro-surface flex h-auto min-h-12 shrink-0 items-center justify-start gap-2.5 rounded-[16px] px-3 py-1.5';
  if (!onPress) return <li className={box}>{body}</li>;
  return (
    <li className="shrink-0">
      <Button variant="ghost" onPress={onPress} aria-pressed={selected} className={cn(box, selected && 'outline-2 outline-solid -outline-offset-2 outline-[var(--accent)]')}>
        {body}
      </Button>
    </li>
  );
}

/** Home status: lights, temperatures, power in the rooms, people home, open. Lights and open filter the rooms. */
function RoomsStatus({ totals, filter, onFilter }: { totals: RoomsTotals; filter: string; onFilter: (f: string) => void }) {
  const people = usePeopleHome();
  const toggle = (f: SummaryFilter) => () => onFilter(filter === f ? 'all' : f);
  const range = totals.minTemp === null || totals.maxTemp === null ? null : totals.minTemp === totals.maxTemp ? temp(totals.minTemp) : `${temp(totals.minTemp)} – ${temp(totals.maxTemp)}`;
  const kw = totals.powerWatts >= 1000 ? `${(totals.powerWatts / 1000).toFixed(1)} kW` : `${totals.powerWatts} W`;
  return (
    <ul aria-label="Home status" className="-mx-1 flex gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]">
      {totals.totalLights > 0 ? (
        <Stat icon={BulbIcon} tone={totals.lightsOn ? 'lit' : undefined} value={`${totals.lightsOn} / ${totals.totalLights}`} label="lights on" selected={filter === 'lit'} onPress={toggle('lit')} />
      ) : null}
      {range ? <Stat icon={TemperatureIcon} value={range} label="temperatures" /> : null}
      {totals.powerWatts > 0 ? <Stat icon={FlashIcon} value={kw} label="in rooms now" /> : null}
      {people !== null ? <Stat icon={UserIcon} value={String(people)} label="home" /> : null}
      {totals.open > 0 ? <Stat icon={Door01Icon} tone="warn" value={String(totals.open)} label="open" selected={filter === 'open'} onPress={toggle('open')} /> : null}
    </ul>
  );
}

interface GridProps {
  rooms: RoomItem[];
  prefs: RoomsPagePrefs;
  width: number;
  actionsOn: ReadonlySet<QuickAction>;
  onOpenRoom: (areaId: string) => void;
  label: string;
  /** The tile design (production: Design D · Soft blend; the studio passes the others). */
  Tile?: RoomTileComponent;
  /** Row heights (designs differ in density). */
  metrics?: (width: number) => BandMetrics;
}

/**
 * A compact tile with no partner, in a row of bigger tiles, would be a tall compact card: it takes
 * the standard composition instead (rows of compact tiles only keep their short height).
 */
const shownSize = (size: TileSize, inBlock: number, band: TileBand<unknown>): TileSize =>
  size === 'compact' && inBlock === 1 && band.some((b) => b.items[0].size !== 'compact') ? 'standard' : size;

export function RoomBands({ rooms, prefs, width, actionsOn, onOpenRoom, label, Tile = RoomTileBlend, metrics = blendMetrics }: GridProps) {
  const even = prefs.cardSize === 'standard';
  const cols = even ? tileColumns(width, GAP, EVEN_TILE_MIN) : tileColumns(width, GAP);
  const m = metrics(width);
  const bands = useMemo(
    () =>
      packTileBands(
        rooms.map((r) => ({ item: r, size: tileSizeFor(r, prefs.sizes, prefs.cardSize === 'large' ? false : prefs.cardSize) })),
        cols,
        compactRowsAt(cols)
      ),
    [rooms, prefs.sizes, prefs.cardSize, cols]
  );
  return (
    <div role="list" aria-label={label} className="flex flex-col" style={{ gap: GAP }}>
      {bands.map((band, i) => {
        const { weights, spacer, height } = bandLayout(band, cols, i === bands.length - 1, m, GAP, even);
        const template = even ? `repeat(${cols}, minmax(0, 1fr))` : [...weights, ...(spacer > 0 ? [spacer] : [])].map((w) => `minmax(0, ${w}fr)`).join(' ');
        return (
          <div key={i} className="grid min-w-0" style={{ gap: GAP, height, gridTemplateColumns: template }}>
            {band.map((b) => (
              <div key={b.items[0].item.areaId} className="grid min-w-0" style={{ gap: GAP, gridTemplateRows: `repeat(${b.items.length}, minmax(0, 1fr))` }}>
                {b.items.map(({ item, size }) => (
                  <Tile key={item.areaId} r={item} size={shownSize(size, b.items.length, band)} prefs={prefs} actions={roomActions(item, actionsOn)} onOpen={onOpenRoom} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const SIZE_LABEL: Record<TileSizeChoice, string> = { auto: 'Auto', compact: 'Compact', standard: 'Standard', expanded: 'Large' };
const SIZE_CHOICES: readonly TileSizeChoice[] = ['auto', 'compact', 'standard', 'expanded'];

function EditTileCell({
  r,
  size,
  choice,
  first,
  last,
  isFavorite,
  prefs,
  actionsOn,
  dragging,
  onSetSize,
  onMoveBy,
  onToggleFavorite,
  onOpenSettings,
  onHide
}: {
  r: RoomItem;
  size: TileSize;
  choice: TileSizeChoice;
  first: boolean;
  last: boolean;
  isFavorite: boolean;
  prefs: RoomsPagePrefs;
  actionsOn: ReadonlySet<QuickAction>;
  dragging: boolean;
  onSetSize: (s: TileSizeChoice) => void;
  onMoveBy: (dir: -1 | 1) => void;
  onToggleFavorite: () => void;
  onOpenSettings: () => void;
  onHide: () => void;
}) {
  const { setNodeRef, attributes, listeners } = useSortable({ id: r.areaId });
  const spanClass =
    size === 'expanded'
      ? 'col-span-2 min-h-[196px]'
      : size === 'compact'
      ? 'col-span-2 sm:col-span-1 min-h-[76px]'
      : 'col-span-1 min-h-[188px]';
  return (
    <div ref={setNodeRef} className={cn(spanClass, 'relative min-w-0', dragging && 'opacity-35')}>
      <div inert className="h-full w-full opacity-90 saturate-[.85]">
        <RoomTileBlend r={r} size={size} prefs={prefs} actions={roomActions(r, actionsOn)} onOpen={() => undefined} />
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-inset ring-[color-mix(in_srgb,var(--accent)_55%,transparent)] [background:color-mix(in_srgb,var(--accent)_5%,transparent)]" />
      <div className="absolute -inset-x-1.5 -top-1.5 z-10 flex items-center justify-between">
        <span
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${r.name}`}
          className="grid size-8 cursor-grab touch-none place-items-center rounded-full bg-[var(--surface)] shadow-md ring-1 ring-black/10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:cursor-grabbing dark:ring-white/15"
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} size={15} />
        </span>
        <Dropdown>
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label={`Edit ${r.name}`}
            className="size-8 min-w-0 rounded-full bg-[var(--surface)] shadow-md ring-1 ring-black/10 dark:ring-white/15"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu
              aria-label={`Edit ${r.name}`}
              onAction={(key) => {
                const k = String(key);
                if (k.startsWith('size:')) onSetSize(k.slice(5) as TileSizeChoice);
                else if (k === 'earlier') onMoveBy(-1);
                else if (k === 'later') onMoveBy(1);
                else if (k === 'fav') onToggleFavorite();
                else if (k === 'settings') onOpenSettings();
                else if (k === 'hide') onHide();
              }}
            >
              <Dropdown.Section>
                <Header>Card size</Header>
                {SIZE_CHOICES.map((c) => (
                  <Dropdown.Item key={c} id={`size:${c}`} textValue={c === choice ? `${SIZE_LABEL[c]}, selected` : SIZE_LABEL[c]}>
                    <HugeiconsIcon icon={Tick02Icon} size={15} className={c === choice ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} aria-hidden="true" />
                    <Label>{SIZE_LABEL[c]}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Section>
              <Dropdown.Section>
                <Header>Arrange</Header>
                <Dropdown.Item id="earlier" textValue="Move earlier" isDisabled={first}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={15} className="shrink-0" />
                  <Label>Move earlier</Label>
                </Dropdown.Item>
                <Dropdown.Item id="later" textValue="Move later" isDisabled={last}>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="shrink-0" />
                  <Label>Move later</Label>
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Section>
                <Header>Room</Header>
                <Dropdown.Item id="fav" textValue={isFavorite ? 'Remove from favourites' : 'Add to favourites'}>
                  <HugeiconsIcon icon={StarIcon} size={15} className={cn('shrink-0', isFavorite && 'fill-current text-[hsl(44_100%_55%)]')} />
                  <Label>{isFavorite ? 'Remove favourite' : 'Add to favourites'}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="settings" textValue="Room settings">
                  <HugeiconsIcon icon={Settings01Icon} size={15} className="shrink-0" />
                  <Label>Room settings…</Label>
                </Dropdown.Item>
                <Dropdown.Item id="hide" textValue="Hide room">
                  <HugeiconsIcon icon={ViewOffSlashIcon} size={15} className="shrink-0" />
                  <Label>Hide room</Label>
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}

function EditableFloorGrid({
  floorId,
  rooms,
  prefs,
  actionsOn,
  edit
}: {
  floorId: string | null;
  rooms: RoomItem[];
  prefs: RoomsPagePrefs;
  actionsOn: ReadonlySet<QuickAction>;
  edit: RoomsExplorerEditProps;
}) {
  const { setDragActive } = useUserConfig();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => () => setDragActive?.(false), [setDragActive]);

  const activeRoom = activeId ? rooms.find((r) => r.areaId === activeId) ?? null : null;
  const activeSize = activeRoom ? tileSizeFor(activeRoom, prefs.sizes, prefs.cardSize === 'large' ? false : prefs.cardSize) : 'standard';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        setActiveId(String(e.active.id));
        setDragActive?.(true);
      }}
      onDragOver={(e) => {
        if (e.over && e.active.id !== e.over.id) {
          edit.onMoveRoomOnto(floorId, String(e.active.id), String(e.over.id));
        }
      }}
      onDragEnd={() => {
        setActiveId(null);
        setDragActive?.(false);
      }}
      onDragCancel={() => {
        setActiveId(null);
        setDragActive?.(false);
      }}
    >
      <SortableContext items={rooms.map((r) => r.areaId)} strategy={() => null}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rooms.map((r, idx) => {
            const size = tileSizeFor(r, prefs.sizes, prefs.cardSize === 'large' ? false : prefs.cardSize);
            return (
              <EditTileCell
                key={r.areaId}
                r={r}
                size={size}
                choice={prefs.sizes[r.areaId] ?? 'auto'}
                first={idx === 0}
                last={idx === rooms.length - 1}
                isFavorite={edit.favorites.includes(r.areaId)}
                prefs={prefs}
                actionsOn={actionsOn}
                dragging={activeId === r.areaId}
                onSetSize={(s) => edit.onSetRoomSize(r.areaId, s)}
                onMoveBy={(dir) => edit.onMoveRoomBy(floorId, r.areaId, dir)}
                onToggleFavorite={() => edit.onToggleFavorite(r.areaId)}
                onOpenSettings={() => edit.onOpenRoomSettings(r.areaId)}
                onHide={() => edit.onHideRoom(r.areaId)}
              />
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
        {activeRoom ? (
          <div className="h-full w-full scale-[1.03] rounded-[22px] opacity-95 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]">
            <RoomTileBlend r={activeRoom} size={activeSize} prefs={prefs} actions={roomActions(activeRoom, actionsOn)} onOpen={() => undefined} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function FloorSection({
  floor,
  floorIndex,
  floorCount,
  showHeading,
  collapsed,
  onToggle,
  edit,
  ...grid
}: Omit<GridProps, 'rooms' | 'label'> & {
  floor: RoomsFloor;
  floorIndex: number;
  floorCount: number;
  showHeading: boolean;
  collapsed: boolean;
  onToggle: () => void;
  edit?: RoomsExplorerEditProps;
}) {
  const floorLightsOff = useFloorLightsOff();
  const id = `rooms-floor-${floorKey(floor)}`;
  const devices = floor.rooms.reduce((n, r) => n + r.deviceCount, 0);
  const lightsOn = floor.rooms.reduce((n, r) => n + r.lightsOn, 0);
  const isEditing = Boolean(edit?.editing);
  return (
    <section aria-label={floor.name} className="flex flex-col gap-3">
      {showHeading || isEditing ? (
        <div className="flex min-h-10 items-center gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-4">
          <h2 className="-ml-2 min-w-0 shrink">
            <Button variant="ghost" onPress={onToggle} aria-expanded={!collapsed} aria-controls={id} className="h-10 min-w-0 max-w-full justify-start gap-2 rounded-full px-2 text-lg font-semibold">
              <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="pro-floor-chevron shrink-0 text-muted" />
              <span className="truncate">{floor.name}</span>
            </Button>
          </h2>
          <span className="min-w-0 flex-1 truncate text-sm text-muted">
            {[plural(floor.rooms.length, 'room'), devices ? plural(devices, 'device') : null, !isEditing && floor.avgTemp !== null ? `avg ${temp(floor.avgTemp)}` : null].filter(Boolean).join(' · ')}
          </span>
          {isEditing && floor.floorId ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                isDisabled={floorIndex === 0}
                onPress={() => edit!.onMoveFloorBy(floor.floorId!, -1)}
                aria-label={`Move ${floor.name} up`}
                className="size-8 min-w-0 rounded-full"
              >
                <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                isDisabled={floorIndex >= floorCount - 1}
                onPress={() => edit!.onMoveFloorBy(floor.floorId!, 1)}
                aria-label={`Move ${floor.name} down`}
                className="size-8 min-w-0 rounded-full"
              >
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => edit!.onHideFloor(floor.floorId!)}
                aria-label={`Hide ${floor.name}`}
                className="size-8 min-w-0 rounded-full"
              >
                <HugeiconsIcon icon={ViewOffSlashIcon} size={15} />
              </Button>
            </div>
          ) : lightsOn > 0 ? (
            <Button size="sm" variant="ghost" onPress={() => floorLightsOff(floor)} className="h-9 shrink-0 gap-1.5 px-2.5 text-xs">
              <HugeiconsIcon icon={BulbIcon} size={15} className="pro-rt-lit" />
              <span className="max-sm:hidden">Lights off</span>
              <span className="sr-only">{`Turn off ${plural(lightsOn, 'light')} on ${floor.name}`}</span>
            </Button>
          ) : null}
        </div>
      ) : null}
      <div id={id} className="pro-collapse -mx-1 -mb-1" data-collapsed={(!isEditing && collapsed) || undefined} inert={(!isEditing && collapsed) || undefined}>
        <div>
          <div className="p-1">
            {isEditing ? (
              <EditableFloorGrid floorId={floor.floorId} rooms={floor.rooms} prefs={grid.prefs} actionsOn={grid.actionsOn} edit={edit!} />
            ) : (
              <RoomBands rooms={floor.rooms} label={`Rooms on ${floor.name}`} {...grid} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export interface RoomsExplorerEditProps {
  editing: boolean;
  hiddenRooms: readonly { areaId: string; name: string }[];
  hiddenFloors: readonly { floorId: string; name: string }[];
  favorites: readonly string[];
  onMoveRoomOnto: (floorId: string | null, activeId: string, overId: string) => void;
  onMoveRoomBy: (floorId: string | null, areaId: string, dir: -1 | 1) => void;
  onSetRoomSize: (areaId: string, size: TileSizeChoice) => void;
  onToggleFavorite: (areaId: string) => void;
  onOpenRoomSettings: (areaId: string) => void;
  onHideRoom: (areaId: string) => void;
  onShowRoom: (areaId: string) => void;
  onMoveFloorBy: (floorId: string, dir: -1 | 1) => void;
  onHideFloor: (floorId: string) => void;
  onShowFloor: (floorId: string) => void;
}

interface RoomsExplorerProps {
  model: RoomsPageModel;
  prefs: RoomsPagePrefs;
  onOpenRoom: (areaId: string) => void;
  onCustomize: () => void;
  edit?: RoomsExplorerEditProps;
}

export default function RoomsExplorer({ model: m, prefs, onOpenRoom, onCustomize, edit }: RoomsExplorerProps) {
  const isEditing = Boolean(edit?.editing);
  const { ref, width } = useWidth();
  const [stored, setStored] = useState(() =>
    prefs.defaultFilter && prefs.defaultFilter !== 'remember' ? prefs.defaultFilter : readFilter()
  );
  const prevDefaultFilter = useRef(prefs.defaultFilter);
  useEffect(() => {
    if (prefs.defaultFilter !== prevDefaultFilter.current) {
      prevDefaultFilter.current = prefs.defaultFilter;
      if (prefs.defaultFilter && prefs.defaultFilter !== 'remember') {
        setStored(prefs.defaultFilter);
      }
    }
  }, [prefs.defaultFilter]);

  const [collapsed, setCollapsed] = useState<string[]>(() => readStored<string[]>(COLLAPSED_KEY, []));
  const [slide, setSlide] = useState<'next' | 'prev' | null>(null);
  const [swipe, setSwipe] = useState<{ x: number; y: number } | null>(null);
  const actionsOn = useMemo(() => enabledActions(prefs), [prefs]);

  const favCount = m.rooms.filter((r) => r.isFavorite).length;
  const activeCount = m.active.length;
  const options: { id: string; label: string; icon?: IconSvgElement; count?: number }[] = [
    { id: 'all', label: 'All', count: m.totals.rooms },
    ...(activeCount ? [{ id: ACTIVE, label: 'Active', icon: FlashIcon, count: activeCount }] : []),
    ...(favCount ? [{ id: FAV, label: 'Favourites', icon: StarIcon, count: favCount }] : []),
    ...(m.floors.length > 1 ? m.floors.map((f) => ({ id: floorKey(f), label: f.name, count: f.rooms.length })) : [])
  ];
  if (prefs.showSummary && isSummary(stored)) options.splice(1, 0, { id: stored, ...SUMMARY_LABEL[stored], count: m.rooms.filter(SUMMARY_TEST[stored]).length });
  const filter = isEditing ? 'all' : options.some((o) => o.id === stored) ? stored : 'all';
  const setFilter = (id: string, dir: 'next' | 'prev' | null = null) => {
    setSlide(dir);
    setStored(id);
    writeStored(FILTER_KEY, id);
  };
  const toggleFloor = (key: string) =>
    setCollapsed((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      writeStored(COLLAPSED_KEY, next);
      return next;
    });

  const keep = (r: RoomItem) => (filter === FAV ? r.isFavorite : isSummary(filter) ? SUMMARY_TEST[filter](r) : true);
  const byFloor = filter !== 'all' && filter !== FAV && filter !== ACTIVE && !isSummary(filter);

  const groups: RoomsFloor[] = useMemo(() => {
    if (filter === ACTIVE) {
      if (!m.active.length) return [];
      return [
        {
          floorId: ACTIVE,
          name: 'Active now',
          level: 0,
          rooms: m.active,
          lightsOn: m.active.reduce((n, r) => n + r.lightsOn, 0),
          totalLights: m.active.reduce((n, r) => n + r.totalLights, 0),
          occupied: m.active.filter((r) => r.occupied).length,
          avgTemp: null,
          devices: m.active.reduce((n, r) => n + r.deviceCount, 0)
        }
      ];
    }
    const shown = m.floors.map((f) => ({ ...f, rooms: f.rooms.filter(keep) })).filter((f) => f.rooms.length > 0 && (!byFloor || floorKey(f) === filter));
    if (isEditing || prefs.groupByFloor || shown.length === 0) return shown;
    return [{ ...shown[0], floorId: 'all', name: 'Rooms', rooms: shown.flatMap((f) => f.rooms) }];
  }, [filter, m.active, m.floors, byFloor, isEditing, prefs.groupByFloor]);

  const headings = filter !== ACTIVE && (isEditing || (prefs.groupByFloor && m.floors.length > 1));
  const namedFloorCount = groups.filter((g) => g.floorId !== null).length;

  // Touch: a sideways swipe moves to the next or previous filter (disabled in Edit Mode so drags stay pure).
  const onPointerDown = (e: PointerEvent) => setSwipe(!isEditing && prefs.swipeFloors && e.pointerType === 'touch' && options.length > 1 ? { x: e.clientX, y: e.clientY } : null);
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe;
    setSwipe(null);
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(e.clientY - start.y) * 2) return;
    const i = options.findIndex((o) => o.id === filter);
    setFilter(options[(i + (dx < 0 ? 1 : -1) + options.length) % options.length].id, dx < 0 ? 'next' : 'prev');
  };

  const hasHidden = Boolean(isEditing && ((edit?.hiddenRooms.length ?? 0) > 0 || (edit?.hiddenFloors.length ?? 0) > 0));

  return (
    <div className="flex flex-col gap-4">
      {!isEditing ? (
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="shrink-0 text-sm text-muted">
              <span className="font-semibold text-foreground">{plural(m.totals.rooms, 'room')}</span>
              {m.totals.devices ? ` · ${plural(m.totals.devices, 'device')}` : null}
            </p>
            {prefs.showSummary ? (
              <div className="min-w-0 flex-1">
                <RoomsStatus totals={m.totals} filter={filter} onFilter={(id) => setFilter(id)} />
              </div>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center gap-2 2xl:max-w-[50%] 2xl:shrink-0">
            <div className="min-w-0 flex-1 2xl:flex 2xl:justify-end">{options.length > 1 ? <SheetFilter label="Show rooms" value={filter} onChange={(id) => setFilter(id)} options={options} /> : null}</div>
            <Button isIconOnly size="sm" variant="ghost" onPress={onCustomize} aria-label="Customize the Rooms page" className="size-10 shrink-0 rounded-full">
              <HugeiconsIcon icon={PaintBoardIcon} size={18} />
            </Button>
          </div>
        </div>
      ) : null}

      {hasHidden ? (
        <section aria-label="Hidden rooms and floors" className="rounded-2xl border border-dashed border-[color-mix(in_srgb,currentColor_18%,transparent)] p-3">
          <p className="mb-2 px-1 text-xs font-semibold text-muted">
            Hidden ({(edit?.hiddenFloors.length ?? 0) + (edit?.hiddenRooms.length ?? 0)})
          </p>
          <div className="flex flex-wrap gap-2">
            {edit?.hiddenFloors.map((f) => (
              <Button key={`floor:${f.floorId}`} size="sm" variant="secondary" onPress={() => edit.onShowFloor(f.floorId)} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={ViewIcon} size={14} />
                Floor: {f.name}
              </Button>
            ))}
            {edit?.hiddenRooms.map((r) => (
              <Button key={`room:${r.areaId}`} size="sm" variant="secondary" onPress={() => edit.onShowRoom(r.areaId)} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={ViewIcon} size={14} />
                {r.name}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <div
        ref={ref}
        key={filter}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setSwipe(null)}
        className={cn('flex min-w-0 flex-col gap-6', !isEditing && prefs.swipeFloors && 'touch-pan-y', !isEditing && prefs.animations && slide && `pro-rooms-in-${slide}`)}
      >
        {width > 0 || isEditing
          ? groups.map((f, idx) => (
              <FloorSection
                key={floorKey(f)}
                floor={f}
                floorIndex={idx}
                floorCount={namedFloorCount}
                showHeading={headings}
                collapsed={headings && !byFloor && collapsed.includes(floorKey(f))}
                onToggle={() => toggleFloor(floorKey(f))}
                prefs={prefs}
                width={width}
                actionsOn={actionsOn}
                onOpenRoom={onOpenRoom}
                edit={edit}
              />
            ))
          : null}
        {groups.length === 0 ? <p className="pro-surface rounded-[18px] px-4 py-6 text-center text-sm text-muted">No rooms to show here.</p> : null}
      </div>
    </div>
  );
}
