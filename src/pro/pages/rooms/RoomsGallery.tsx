/**
 * Rooms page body: the owner's pick, concept B "Gallery" (docs/pro-ui/ROOMS.md, 2026-11-20).
 * Optional home summary (tiles that filter), "Happening now", a filter (all, favourites, floors,
 * or a summary filter), then the room cards by floor (`RoomCard`). On touch screens a sideways
 * swipe over the rooms moves to the next filter. At night (HA's sun, else the clock) pictures dim.
 * Every extra follows `preferences.proRooms` (Customize).
 */
import { useRef, useState, type PointerEvent } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, PaintBoardIcon, StarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { RoomItem, RoomsPageModel } from '../../lib/roomsPage';
import { isNight } from '../../lib/roomsInsights';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import { RoomCard } from './RoomCard';
import { useFloorLightsOff } from './RoomCardControls';
import { RoomsSummary, SUMMARY_FILTERS, type SummaryFilter } from './RoomsSummary';
import { roomIcon, SIGNAL, temp, useRoomLights, type RoomsPagePrefs } from './shared';

const FILTER_KEY = 'had.pro.rooms.filter';
const FAV = 'favourites';
const SWIPE_PX = 60;

const SUMMARY_TEST: Record<SummaryFilter, (r: RoomItem) => boolean> = {
  lit: (r) => r.lightsOn > 0,
  occupied: (r) => r.occupied,
  open: (r) => r.openContacts > 0
};
const isSummary = (f: string): f is SummaryFilter => f in SUMMARY_TEST;

function readFilter(): string {
  try {
    return localStorage.getItem(FILTER_KEY) ?? 'all';
  } catch {
    return 'all';
  }
}

interface RoomsGalleryProps {
  model: RoomsPageModel;
  prefs: RoomsPagePrefs;
  onOpenRoom: (areaId: string) => void;
  onCustomize: () => void;
}

export default function RoomsGallery({ model: m, prefs, onOpenRoom, onCustomize }: RoomsGalleryProps) {
  const lights = useRoomLights();
  const floorLightsOff = useFloorLightsOff();
  const [stored, setStored] = useState(readFilter);
  const [slide, setSlide] = useState<'next' | 'prev' | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const compact = prefs.cardSize === 'compact';
  const sun = useAutoLayoutStore((s) => s.resolvedEntities['sun.sun']?.state);
  const night = prefs.nightLook && isNight(sun);
  const favCount = m.rooms.filter((r) => r.isFavorite).length;
  const options = [
    { id: 'all', label: 'All', count: m.totals.rooms },
    ...(favCount ? [{ id: FAV, label: 'Favourites', icon: StarIcon, count: favCount }] : []),
    ...(m.floors.length > 1 ? m.floors.map((f) => ({ id: f.floorId ?? 'none', label: f.name, count: f.rooms.length })) : [])
  ];
  // A summary filter shows as its own option while it is on.
  if (prefs.showSummary && isSummary(stored)) {
    const sf = SUMMARY_FILTERS[stored];
    options.splice(1, 0, { id: stored, label: sf.label, icon: sf.icon, count: m.rooms.filter(SUMMARY_TEST[stored]).length });
  }
  // A remembered choice that no longer exists (floor removed, favourites cleared) falls back to All.
  const filter = options.some((o) => o.id === stored) ? stored : 'all';
  const setFilter = (id: string) => {
    setStored(id);
    try {
      localStorage.setItem(FILTER_KEY, id);
    } catch {
      /* storage blocked: the choice lasts this visit */
    }
  };
  const keep = (r: RoomItem) => (filter === FAV ? r.isFavorite : isSummary(filter) ? SUMMARY_TEST[filter](r) : true);
  const shown = m.floors
    .map((f) => ({ ...f, rooms: f.rooms.filter(keep) }))
    .filter((f) => f.rooms.length > 0 && (filter === 'all' || filter === FAV || isSummary(filter) || (f.floorId ?? 'none') === filter));

  // Touch: a sideways swipe moves to the next or previous filter (floors, mostly).
  const onPointerDown = (e: PointerEvent) => {
    swipe.current = prefs.swipeFloors && e.pointerType === 'touch' && options.length > 1 ? { x: e.clientX, y: e.clientY } : null;
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(e.clientY - start.y) * 2) return;
    const i = options.findIndex((o) => o.id === filter);
    const next = options[(i + (dx < 0 ? 1 : -1) + options.length) % options.length];
    setSlide(dx < 0 ? 'next' : 'prev');
    setFilter(next.id);
  };
  // Not grouped: one grid, no floor headings.
  const groups = prefs.groupByFloor ? shown : [{ ...shown[0], floorId: 'all', name: 'Rooms', rooms: shown.flatMap((f) => f.rooms), lightsOn: 0, avgTemp: null }];
  const gridClass = compact ? 'grid grid-cols-3 gap-2.5 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' : 'grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4';

  return (
    <div className="flex flex-col gap-5">
      {prefs.showSummary ? <RoomsSummary totals={m.totals} filter={filter} onFilter={(id) => (setSlide(null), setFilter(id))} /> : null}
      {prefs.showActive ? (
        <section aria-label="Happening now" className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-semibold">Happening now</h2>
          {m.active.length === 0 ? (
            <p className="pro-surface rounded-[18px] px-4 py-3 text-sm text-muted">All quiet: no lights on, nothing playing, nobody moving.</p>
          ) : (
            <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {m.active.map((r) => (
                <li key={r.areaId} className="shrink-0">
                  <Button variant="ghost" onPress={() => onOpenRoom(r.areaId)} className="pro-surface h-auto gap-2 rounded-full py-1.5 pl-1.5 pr-3">
                    <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: r.color }}>
                      <HugeiconsIcon icon={roomIcon(r)} size={16} />
                    </span>
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="flex gap-1 text-muted">
                      {r.signals.slice(0, 3).map((s) => (
                        <HugeiconsIcon key={s} icon={SIGNAL[s].icon} size={14} aria-label={SIGNAL[s].label(r)} />
                      ))}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{options.length > 1 ? <SheetFilter label="Show rooms" value={filter} onChange={(id) => (setSlide(null), setFilter(id))} options={options} /> : null}</div>
        <Button size="sm" variant="ghost" onPress={onCustomize} className="shrink-0 gap-1.5">
          <HugeiconsIcon icon={PaintBoardIcon} size={16} />
          <span className="hidden sm:inline">Customize</span>
          <span className="sr-only sm:hidden">Customize the Rooms page</span>
        </Button>
      </div>

      <div
        key={filter}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        className={cn('flex flex-col gap-5', prefs.swipeFloors && 'touch-pan-y', prefs.animations && slide && `pro-rooms-in-${slide}`)}
      >
        {groups.map((f) => (
          <section key={f.floorId ?? 'none'} aria-label={f.name} className="flex flex-col gap-2">
            {prefs.groupByFloor && m.floors.length > 1 ? (
              <div className="flex min-h-8 items-center gap-2 px-1">
                <h2 className="text-sm font-semibold">{f.name}</h2>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {[f.lightsOn ? `${f.lightsOn} light${f.lightsOn === 1 ? '' : 's'} on` : null, f.avgTemp !== null ? temp(f.avgTemp) : null].filter(Boolean).join(' · ')}
                </span>
                {f.lightsOn > 0 ? (
                  <Button size="sm" variant="ghost" onPress={() => floorLightsOff(f)} className="h-8 shrink-0 gap-1.5 px-2.5 text-xs">
                    <HugeiconsIcon icon={BulbIcon} size={14} />
                    Lights off
                    <span className="sr-only"> on {f.name}</span>
                  </Button>
                ) : null}
              </div>
            ) : null}
            <ul className={gridClass}>
              {f.rooms.map((r) => (
                <RoomCard key={r.areaId} r={r} prefs={prefs} lights={lights} night={night} onOpen={() => onOpenRoom(r.areaId)} />
              ))}
            </ul>
          </section>
        ))}
        {groups.every((g) => g.rooms.length === 0) ? <p className="pro-surface rounded-[18px] px-4 py-6 text-center text-sm text-muted">No rooms to show here.</p> : null}
      </div>
    </div>
  );
}
