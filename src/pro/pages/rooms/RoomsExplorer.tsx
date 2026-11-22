/**
 * Rooms page body, "Ambient explorer" (docs/pro-ui/ROOMS.md §3, owner 2026-11-22): a compact
 * status bar (room and device counts, lights, temperatures, power, people home), a filter (all,
 * favourites, each floor), then each floor as a collapsible section of mixed-size room tiles
 * packed into gap-free bands (`packTileBands`), sized to the page's real width. On touch screens a
 * sideways swipe over the rooms moves to the next filter. Every extra follows
 * `preferences.proRooms` (Customize).
 */
import { useCallback, useEffect, useMemo, useState, type PointerEvent } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, BulbIcon, Door01Icon, FlashIcon, PaintBoardIcon, StarIcon, TemperatureIcon, UserIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { bandLayout, blendMetrics, compactRowsAt, EVEN_TILE_MIN, packTileBands, roomActions, tileColumns, tileSizeFor, type BandMetrics, type QuickAction, type TileBand, type TileSize } from '../../lib/roomTiles';
import type { RoomItem, RoomsFloor, RoomsPageModel, RoomsTotals } from '../../lib/roomsPage';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import { useFloorLightsOff } from './RoomQuickActions';
import { RoomTileBlend } from './RoomTileBlend';
import type { RoomTileComponent } from './tileParts';
import { enabledActions, temp, type RoomsPagePrefs } from './shared';

const FILTER_KEY = 'had.pro.rooms.filter';
const COLLAPSED_KEY = 'had.pro.rooms.collapsed';
const FAV = 'favourites';
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
 * Mixed-size tiles in bands (`packTileBands`): each band one CSS grid row with explicit column
 * weights (`bandLayout`), so there are no holes and no tile is taller than its row needs. Phones
 * (two columns) show compact tiles as short full-width rows.
 */
/**
 * A compact tile with no partner, in a row of bigger tiles, would be a tall compact card: it takes
 * the standard composition instead (rows of compact tiles only keep their short height).
 */
const shownSize = (size: TileSize, inBlock: number, band: TileBand<unknown>): TileSize =>
  size === 'compact' && inBlock === 1 && band.some((b) => b.items[0].size !== 'compact') ? 'standard' : size;

export function RoomBands({ rooms, prefs, width, actionsOn, onOpenRoom, label, Tile = RoomTileBlend, metrics = blendMetrics }: GridProps) {
  // "All standard": an even grid of ~300×200 tiles, every one the same size.
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
        // Even grid: the same column tracks on every row, so a short last row's tiles match the rest.
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

function FloorSection({ floor, showHeading, collapsed, onToggle, ...grid }: Omit<GridProps, 'rooms' | 'label'> & { floor: RoomsFloor; showHeading: boolean; collapsed: boolean; onToggle: () => void }) {
  const floorLightsOff = useFloorLightsOff();
  const id = `rooms-floor-${floorKey(floor)}`;
  const devices = floor.rooms.reduce((n, r) => n + r.deviceCount, 0);
  const lightsOn = floor.rooms.reduce((n, r) => n + r.lightsOn, 0);
  return (
    <section aria-label={floor.name} className="flex flex-col gap-3">
      {showHeading ? (
        <div className="flex min-h-10 items-center gap-3 border-t border-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-4">
          <h2 className="-ml-2 min-w-0 shrink">
            <Button variant="ghost" onPress={onToggle} aria-expanded={!collapsed} aria-controls={id} className="h-10 min-w-0 max-w-full justify-start gap-2 rounded-full px-2 text-lg font-semibold">
              <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="pro-floor-chevron shrink-0 text-muted" />
              <span className="truncate">{floor.name}</span>
            </Button>
          </h2>
          <span className="min-w-0 flex-1 truncate text-sm text-muted">
            {[plural(floor.rooms.length, 'room'), devices ? plural(devices, 'device') : null, floor.avgTemp !== null ? `avg ${temp(floor.avgTemp)}` : null].filter(Boolean).join(' · ')}
          </span>
          {lightsOn > 0 ? (
            <Button size="sm" variant="ghost" onPress={() => floorLightsOff(floor)} className="h-9 shrink-0 gap-1.5 px-2.5 text-xs">
              <HugeiconsIcon icon={BulbIcon} size={15} className="pro-rt-lit" />
              <span className="max-sm:hidden">Lights off</span>
              <span className="sr-only">{`Turn off ${plural(lightsOn, 'light')} on ${floor.name}`}</span>
            </Button>
          ) : null}
        </div>
      ) : null}
      <div id={id} className="pro-collapse -mx-1 -mb-1" data-collapsed={collapsed || undefined} inert={collapsed || undefined}>
        <div>
          <div className="p-1">
            <RoomBands rooms={floor.rooms} label={`Rooms on ${floor.name}`} {...grid} />
          </div>
        </div>
      </div>
    </section>
  );
}

interface RoomsExplorerProps {
  model: RoomsPageModel;
  prefs: RoomsPagePrefs;
  onOpenRoom: (areaId: string) => void;
  onCustomize: () => void;
}

export default function RoomsExplorer({ model: m, prefs, onOpenRoom, onCustomize }: RoomsExplorerProps) {
  const { ref, width } = useWidth();
  const [stored, setStored] = useState(readFilter);
  const [collapsed, setCollapsed] = useState<string[]>(() => readStored<string[]>(COLLAPSED_KEY, []));
  const [slide, setSlide] = useState<'next' | 'prev' | null>(null);
  const [swipe, setSwipe] = useState<{ x: number; y: number } | null>(null);
  const actionsOn = useMemo(() => enabledActions(prefs), [prefs]);

  const favCount = m.rooms.filter((r) => r.isFavorite).length;
  const options: { id: string; label: string; icon?: IconSvgElement; count?: number }[] = [
    { id: 'all', label: 'All', count: m.totals.rooms },
    ...(favCount ? [{ id: FAV, label: 'Favourites', icon: StarIcon, count: favCount }] : []),
    ...(m.floors.length > 1 ? m.floors.map((f) => ({ id: floorKey(f), label: f.name, count: f.rooms.length })) : [])
  ];
  // A status filter (lit, open) shows as its own option while it is on.
  if (prefs.showSummary && isSummary(stored)) options.splice(1, 0, { id: stored, ...SUMMARY_LABEL[stored], count: m.rooms.filter(SUMMARY_TEST[stored]).length });
  // A remembered choice that no longer exists (floor removed, favourites cleared) falls back to All.
  const filter = options.some((o) => o.id === stored) ? stored : 'all';
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
  const byFloor = filter !== 'all' && filter !== FAV && !isSummary(filter);
  const shown = m.floors.map((f) => ({ ...f, rooms: f.rooms.filter(keep) })).filter((f) => f.rooms.length > 0 && (!byFloor || floorKey(f) === filter));
  const groups = prefs.groupByFloor || shown.length === 0 ? shown : [{ ...shown[0], floorId: 'all', name: 'Rooms', rooms: shown.flatMap((f) => f.rooms) }];
  const headings = prefs.groupByFloor && m.floors.length > 1;

  // Touch: a sideways swipe moves to the next or previous filter (floors, mostly).
  const onPointerDown = (e: PointerEvent) => setSwipe(prefs.swipeFloors && e.pointerType === 'touch' && options.length > 1 ? { x: e.clientX, y: e.clientY } : null);
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe;
    setSwipe(null);
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(e.clientY - start.y) * 2) return;
    const i = options.findIndex((o) => o.id === filter);
    setFilter(options[(i + (dx < 0 ? 1 : -1) + options.length) % options.length].id, dx < 0 ? 'next' : 'prev');
  };

  return (
    <div className="flex flex-col gap-4">
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

      <div
        ref={ref}
        key={filter}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setSwipe(null)}
        className={cn('flex min-w-0 flex-col gap-6', prefs.swipeFloors && 'touch-pan-y', prefs.animations && slide && `pro-rooms-in-${slide}`)}
      >
        {width > 0
          ? groups.map((f) => (
              <FloorSection
                key={floorKey(f)}
                floor={f}
                showHeading={headings}
                collapsed={headings && !byFloor && collapsed.includes(floorKey(f))}
                onToggle={() => toggleFloor(floorKey(f))}
                prefs={prefs}
                width={width}
                actionsOn={actionsOn}
                onOpenRoom={onOpenRoom}
              />
            ))
          : null}
        {groups.length === 0 ? <p className="pro-surface rounded-[18px] px-4 py-6 text-center text-sm text-muted">No rooms to show here.</p> : null}
      </div>
    </div>
  );
}
