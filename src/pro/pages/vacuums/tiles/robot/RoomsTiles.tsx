/**
 * Vacuum tiles · batch 3 · Rooms (docs/pro-ui/VACUUM_TILES.md): pick rooms and clean them.
 * A · Plan: the rooms as a floor plan of soft blocks; tap to pick, each picked room numbered in
 *     the order it will be cleaned; the room being cleaned glows.
 * B · Route: the picked rooms as stops on a line from the robot (Roborock's room order), the rest
 *     as chips under it.
 * C · List: a checklist of rooms, "Everywhere" first.
 * Robots that report rooms but cannot clean by room show them read-only and say so.
 */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, CheckmarkCircle02Icon, FloorPlanIcon, Layers01Icon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Room } from '../../../../lib/vacuums/cleaner';
import { CH, IconChip, RobotTop, RunButtons, XsRow, type CleanerTileProps } from '../cleanerTileKit';

/** The tile's picked rooms, in the order they were tapped. */
function usePicks() {
  const [ids, setIds] = useState<string[]>([]);
  const toggle = (id: string) => setIds((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  return { ids, toggle, clear: () => setIds([]) };
}

const canPick = (c: CleanerTileProps['c']) => c.actions.includes('rooms') && c.activity !== 'offline';
const nowRoom = (c: CleanerTileProps['c']) => (c.activity === 'cleaning' || c.activity === 'paused' ? c.run?.room ?? null : null);

/** "Clean 2 rooms" when rooms are picked, else the plain Start (everywhere). */
function CleanButton({ c, act, ids, clear, small, className }: Pick<CleanerTileProps, 'c' | 'act'> & { ids: string[]; clear: () => void; small?: boolean; className?: string }) {
  const size = small ? 'sm' : 'md';
  if (!ids.length) return <RunButtons c={c} act={act} size={size} dock={size === 'md'} className={className} />;
  const h = size === 'sm' ? 32 : 38;
  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        data-tile-control=""
        aria-label={`${c.name}: clean ${ids.length} room${ids.length === 1 ? '' : 's'}`}
        onPress={() => {
          act({ type: 'rooms', ids });
          clear();
        }}
        className={cn('min-w-0 flex-1 gap-1.5 rounded-full font-semibold text-white', size === 'sm' ? 'px-3 text-[12px]' : 'px-4 text-[13px]')}
        style={{ height: h, background: CH.on }}
      >
        <HugeiconsIcon icon={PlayIcon} size={size === 'sm' ? 14 : 16} />
        {size === 'sm' ? `Clean ${ids.length}` : `Clean ${ids.length} room${ids.length === 1 ? '' : 's'}`}
      </Button>
      <Button isIconOnly variant="tertiary" data-tile-control="" aria-label="Clear the picked rooms" onPress={clear} className="shrink-0 rounded-full p-0" style={{ height: h, width: h }}>
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </Button>
    </div>
  );
}

function NoRooms({ c, act, size }: CleanerTileProps) {
  if (size === 'xs') return <XsRow label="Rooms" visual={<IconChip icon={FloorPlanIcon} px={36} />} word="No rooms" detail="The robot reports no map" />;
  return (
    <TileFrame label="Rooms" className="pro-surface">
      <div className="flex h-full flex-col p-4">
        <IconChip icon={FloorPlanIcon} px={36} />
        <p className="mt-auto text-[15px] font-semibold">No rooms</p>
        <TileState>The robot reports no map; it cleans everywhere</TileState>
        {size !== 's' ? <RunButtons c={c} act={act} size="sm" className="mt-3" /> : null}
      </div>
    </TileFrame>
  );
}

function RoomsXs({ c }: CleanerTileProps) {
  const here = nowRoom(c);
  const mine = c.rooms.filter((r) => !c.floor || r.floor === c.floor);
  return <XsRow label="Rooms" visual={<IconChip icon={FloorPlanIcon} hue={here ? CH.on : undefined} px={36} />} word={here ? `In the ${here.toLowerCase()}` : `${mine.length} rooms`} detail={c.floor ? c.floor : mine.map((r) => r.name).join(' · ')} hue={here ? CH.on : undefined} />;
}

const readOnlyNote = 'Rooms from the map; this robot can’t clean by room here';

// ---------------------------------------------------------------------------------------------
// A · Plan
// ---------------------------------------------------------------------------------------------

/** A room block: tinted when picked (with its order), glowing while the robot is in it. */
function Block({ r, order, here, onPress, disabled, compact }: { r: Room; order: number; here: boolean; onPress: () => void; disabled: boolean; compact?: boolean }) {
  const on = order > 0;
  return (
    <Button
      variant="ghost"
      data-tile-control=""
      aria-label={`${r.name}${on ? `, picked ${order}` : ''}`}
      aria-pressed={on}
      isDisabled={disabled}
      onPress={onPress}
      className={cn('relative h-full min-h-0 w-full min-w-0 items-end justify-start overflow-hidden rounded-[12px] p-2 text-left font-semibold transition-colors data-[disabled]:opacity-100', compact ? 'p-1.5 text-[11px]' : 'text-[12px]', !on && 'bg-[color-mix(in_srgb,currentColor_6%,transparent)]')}
      style={on ? { background: `color-mix(in srgb, ${CH.on} 22%, transparent)`, color: CH.on } : here ? { boxShadow: `inset 0 0 0 2px ${CH.on}` } : undefined}
    >
      {here ? <span className="absolute inset-0 motion-safe:animate-pulse" style={{ background: `color-mix(in srgb, ${CH.on} 14%, transparent)` }} /> : null}
      {on ? (
        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full text-[11px] text-white" style={{ background: CH.on }}>
          {order}
        </span>
      ) : null}
      <span className="relative line-clamp-2 break-words leading-tight">{r.name}</span>
    </Button>
  );
}

/** A floor-plan-ish packing: a 4-column grid where the first room is big and every third is wide. */
const spans = (i: number, n: number, cols: number) => {
  if (cols !== 4) return '';
  if (i === 0) return 'col-span-2 row-span-2';
  return i % 3 === 0 ? 'col-span-2' : '';
};

function Plan({ c, rooms, ids, toggle, cols, max, rowPx, disabled }: { c: CleanerTileProps['c']; rooms: Room[]; ids: string[]; toggle: (id: string) => void; cols: 2 | 3 | 4; max: number; rowPx: number; disabled: boolean }) {
  const shown = rooms.slice(0, max);
  const here = nowRoom(c);
  return (
    <div className={cn('grid min-h-0 flex-1 gap-1.5', cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2')} style={{ gridAutoRows: rowPx, gridAutoFlow: 'dense' }}>
      {shown.map((r, i) => (
        <div key={r.id} className={spans(i, shown.length, cols)}>
          <Block r={r} order={ids.indexOf(r.id) + 1} here={here === r.name && (!r.floor || r.floor === c.floor)} onPress={() => toggle(r.id)} disabled={disabled} compact={cols === 2} />
        </div>
      ))}
    </div>
  );
}

/** The floors (maps) a robot has, the one shown (the robot's own until another is chosen) and its rooms. */
function useFloors(c: CleanerTileProps['c'], clear: () => void) {
  const floors = [...new Set(c.rooms.map((r) => r.floor).filter((f): f is string => !!f))];
  const [chosen, setChosen] = useState<string | null>(null);
  const shown = floors.length ? (chosen && floors.includes(chosen) ? chosen : c.floor && floors.includes(c.floor) ? c.floor : floors[0]) : null;
  // The robot cleans only the map it is on; another floor's rooms can be looked at, not cleaned.
  const away = !!shown && !!c.floor && shown !== c.floor;
  const pick = (f: string) => {
    if (f !== shown) clear();
    setChosen(f);
  };
  const next = () => pick(floors[(floors.indexOf(shown ?? '') + 1) % floors.length]);
  return { floors, shown, away, pick, next, rooms: shown ? c.rooms.filter((r) => r.floor === shown) : c.rooms };
}

/** Small and Wide: one chip naming the floor shown; a tap goes to the next floor. */
function FloorChip({ f, robotHere, short }: { f: ReturnType<typeof useFloors>; robotHere: boolean; short?: boolean }) {
  if (f.floors.length < 2) return null;
  return (
    <Button
      size="sm"
      variant="tertiary"
      data-tile-control=""
      aria-label={`Floor: ${f.shown}. Show the next floor`}
      onPress={f.next}
      className={cn('h-8 min-w-0 shrink-0 gap-1 rounded-full text-[12px] font-semibold', short ? 'max-w-[55%] px-2' : 'max-w-[48%] px-2.5')}
    >
      <HugeiconsIcon icon={Layers01Icon} size={14} />
      {/* Small: the floor's first word ("Ground", "First"); the full name is in the label. */}
      <span className="truncate">{short ? f.shown?.split(/\s+/)[0] : f.shown}</span>
      {robotHere && !short ? <span className="size-1.5 shrink-0 rounded-full" style={{ background: CH.on }} /> : null}
    </Button>
  );
}

/** Large: every floor as a tab, a dot on the robot's. */
function FloorTabs({ f, robotFloor }: { f: ReturnType<typeof useFloors>; robotFloor: string | null }) {
  if (f.floors.length < 2) return null;
  return (
    <div className="flex min-w-0 gap-1 overflow-x-auto rounded-full bg-[color-mix(in_srgb,currentColor_6%,transparent)] p-0.5" role="group" aria-label="Floor">
      {f.floors.map((fl) => (
        <Button
          key={fl}
          size="sm"
          variant="ghost"
          data-tile-control=""
          aria-pressed={fl === f.shown}
          onPress={() => f.pick(fl)}
          className={cn('h-7 min-w-0 shrink-0 gap-1 rounded-full px-2.5 text-[12px] font-semibold', fl !== f.shown && 'opacity-70')}
          style={fl === f.shown ? { background: `color-mix(in srgb, ${CH.on} 18%, transparent)`, color: CH.on } : undefined}
        >
          {fl === robotFloor ? <span className="size-1.5 shrink-0 rounded-full" style={{ background: CH.on }} aria-label="The robot is here" /> : null}
          {fl}
        </Button>
      ))}
    </div>
  );
}

export function RoomsPlan(p: CleanerTileProps) {
  const { c, size, act } = p;
  const { ids, toggle, clear } = usePicks();
  const f = useFloors(c, clear);
  if (!c.rooms.length) return <NoRooms {...p} />;
  if (size === 'xs') return <RoomsXs {...p} />;
  const pickable = canPick(c) && !f.away;
  const awayNote = `The robot is on the ${c.floor?.toLowerCase()}`;
  const bottom = f.away ? <TileState className="min-w-0 flex-1 text-[12px]">{awayNote}</TileState> : <CleanButton c={c} act={act} ids={ids} clear={clear} small className="min-w-0 flex-1" />;
  if (size === 's' || size === 'w')
    return (
      <TileFrame label="Rooms" className="pro-surface">
        <div className="flex h-full flex-col gap-2 p-2.5">
          <Plan c={c} rooms={f.rooms} ids={ids} toggle={toggle} cols={size === 's' ? 2 : 3} max={size === 's' ? 4 : 6} rowPx={40} disabled={!pickable} />
          <div className="flex min-w-0 items-center gap-1.5">
            <FloorChip f={f} robotHere={!f.away && f.floors.length > 1} short={size === 's'} />
            {bottom}
          </div>
        </div>
      </TileFrame>
    );
  const note = f.away ? `${awayNote}. Move it here to clean these rooms` : !canPick(c) && c.activity !== 'offline' ? readOnlyNote : null;
  return (
    <TileFrame label="Rooms" className="pro-surface">
      <div className="flex h-full flex-col gap-2.5 p-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <TileName className="shrink-0 text-[17px]">Rooms</TileName>
          {f.floors.length > 1 ? <FloorTabs f={f} robotFloor={c.floor} /> : <TileState className="text-[12px]">{ids.length ? `${ids.length} picked` : `${c.rooms.length} rooms`}</TileState>}
        </div>
        <Plan c={c} rooms={f.rooms} ids={ids} toggle={toggle} cols={4} max={10} rowPx={f.floors.length > 1 ? 48 : 52} disabled={!pickable} />
        {note ? <p className="text-[12px] leading-snug opacity-70">{note}</p> : null}
        {f.away ? null : <CleanButton c={c} act={act} ids={ids} clear={clear} />}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Route
// ---------------------------------------------------------------------------------------------

/** The robot, then each picked room as a numbered stop on a dotted line. */
function RouteLine({ c, ids, max }: { c: CleanerTileProps['c']; ids: string[]; max: number }) {
  const stops = ids.map((id) => c.rooms.find((r) => r.id === id)).filter((r): r is Room => !!r);
  const shown = stops.slice(0, max);
  return (
    <div className="flex min-w-0 items-center">
      <RobotTop px={26} hue={CH.on} working={c.activity === 'cleaning'} />
      {shown.length ? (
        shown.map((r, i) => (
          <div key={r.id} className="flex min-w-0 items-center">
            <span className="h-0 w-3 shrink-0 border-t-2 border-dotted" style={{ borderColor: CH.on }} />
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${CH.on} 16%, transparent)`, color: CH.on }}>
              <span className="grid size-4 shrink-0 place-items-center rounded-full text-[10px] text-white" style={{ background: CH.on }}>
                {i + 1}
              </span>
              <span className="truncate">{r.name}</span>
            </span>
          </div>
        ))
      ) : (
        <>
          <span className="h-0 w-6 shrink-0 border-t-2 border-dotted opacity-30" />
          <span className="truncate text-[12px] opacity-60">{nowRoom(c) ? `In the ${nowRoom(c)!.toLowerCase()}` : 'Everywhere'}</span>
        </>
      )}
      {stops.length > shown.length ? <span className="ml-1 text-[11px] font-semibold opacity-60">+{stops.length - shown.length}</span> : null}
    </div>
  );
}

function Chips({ c, ids, toggle, max }: { c: CleanerTileProps['c']; ids: string[]; toggle: (id: string) => void; max: number }) {
  const here = nowRoom(c);
  return (
    <div className="flex min-h-0 flex-wrap content-start gap-1.5 overflow-hidden">
      {c.rooms.slice(0, max).map((r) => {
        const on = ids.includes(r.id);
        return (
          <Button
            key={r.id}
            size="sm"
            variant="ghost"
            data-tile-control=""
            aria-pressed={on}
            isDisabled={!canPick(c)}
            onPress={() => toggle(r.id)}
            className={cn('h-7 min-w-0 gap-1 rounded-full px-2.5 text-[12px] font-semibold data-[disabled]:opacity-100', !on && 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]')}
            style={on ? { background: CH.on, color: 'white' } : here === r.name ? { boxShadow: `inset 0 0 0 1.5px ${CH.on}`, color: CH.on } : undefined}
          >
            <HugeiconsIcon icon={on ? CheckmarkCircle02Icon : FloorPlanIcon} size={12} />
            {r.name}
          </Button>
        );
      })}
    </div>
  );
}

export function RoomsRoute(p: CleanerTileProps) {
  const { c, size } = p;
  const { ids, toggle, clear } = usePicks();
  if (!c.rooms.length) return <NoRooms {...p} />;
  if (size === 'xs') return <RoomsXs {...p} />;
  if (size === 's')
    return (
      <TileFrame label="Rooms" className="pro-surface">
        <div className="flex h-full flex-col gap-2 p-3">
          <RouteLine c={c} ids={ids} max={1} />
          <Chips c={c} ids={ids} toggle={toggle} max={4} />
          {ids.length ? <CleanButton c={c} act={p.act} ids={ids} clear={clear} small className="mt-auto" /> : null}
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Rooms" className="pro-surface">
        <div className="flex h-full flex-col gap-2 p-3">
          <Chips c={c} ids={ids} toggle={toggle} max={6} />
          <div className="mt-auto flex items-center gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <RouteLine c={c} ids={ids} max={2} />
            </div>
            <CleanButton c={c} act={p.act} ids={ids} clear={clear} small className="w-[42%] shrink-0" />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Rooms" className="pro-surface">
      <div className="flex h-full flex-col gap-3 p-4">
        <TileName className="text-[17px]">Cleaning route</TileName>
        <RouteLine c={c} ids={ids} max={3} />
        <TileState className="text-[12px]">{canPick(c) ? 'Tap rooms in the order to clean them' : readOnlyNote}</TileState>
        <Chips c={c} ids={ids} toggle={toggle} max={12} />
        <CleanButton c={c} act={p.act} ids={ids} clear={clear} className="mt-auto" />
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · List
// ---------------------------------------------------------------------------------------------

function Row({ name, on, here, onPress, disabled }: { name: string; on: boolean; here?: boolean; onPress: () => void; disabled: boolean }) {
  return (
    <Button variant="ghost" data-tile-control="" aria-pressed={on} isDisabled={disabled} onPress={onPress} className="h-8 w-full min-w-0 shrink-0 justify-start gap-2 rounded-[10px] px-1.5 text-[13px] font-medium data-[disabled]:opacity-100">
      <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2', !on && 'border-current opacity-30')} style={on ? { background: CH.on, borderColor: CH.on, color: 'white' } : undefined}>
        {on ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{name}</span>
      {here ? <span className="size-2 shrink-0 rounded-full motion-safe:animate-pulse" style={{ background: CH.on }} /> : null}
    </Button>
  );
}

export function RoomsList(p: CleanerTileProps) {
  const { c, size } = p;
  const { ids, toggle, clear } = usePicks();
  if (!c.rooms.length) return <NoRooms {...p} />;
  if (size === 'xs') return <RoomsXs {...p} />;
  const here = nowRoom(c);
  const max = size === 'l' ? 9 : 2;
  const list = (
    <div className={cn('min-h-0 overflow-hidden', size === 'l' ? 'grid grid-cols-2 gap-x-2' : 'flex flex-col')}>
      {size !== 's' ? <Row name="Everywhere" on={!ids.length} onPress={clear} disabled={!canPick(c)} /> : null}
      {c.rooms.slice(0, max).map((r) => (
        <Row key={r.id} name={r.name} on={ids.includes(r.id)} here={here === r.name} onPress={() => toggle(r.id)} disabled={!canPick(c)} />
      ))}
      {c.rooms.length > max ? <TileState className="self-center px-1.5 text-[11px]">+{c.rooms.length - max} more{size === 'l' ? '' : ' on Large'}</TileState> : null}
    </div>
  );
  if (size === 's')
    return (
      <TileFrame label="Rooms" className="pro-surface">
        <div className="flex h-full flex-col gap-1 p-2.5">
          {list}
          <CleanButton c={c} act={p.act} ids={ids} clear={clear} small className="mt-auto" />
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Rooms" className="pro-surface">
        <div className="flex h-full gap-3 p-3">
          <div className="min-w-0 flex-1">{list}</div>
          <div className="flex w-[38%] shrink-0 flex-col justify-between">
            <TileState className="text-[12px]">{ids.length ? `${ids.length} picked` : 'Everywhere'}</TileState>
            <CleanButton c={c} act={p.act} ids={ids} clear={clear} small />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Rooms" className="pro-surface">
      <div className="flex h-full flex-col gap-2 p-4">
        <TileName className="text-[17px]">Rooms</TileName>
        {list}
        {!canPick(c) ? <TileState className="text-[11px]">{readOnlyNote}</TileState> : null}
        <CleanButton c={c} act={p.act} ids={ids} clear={clear} className="mt-auto" />
      </div>
    </TileFrame>
  );
}
