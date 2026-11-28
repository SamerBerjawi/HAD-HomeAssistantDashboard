/**
 * Lighting concept B — Expressive & immersive ("glow"). The card is lit by the home: a warm glow
 * whose strength follows how many lights are on and how bright, on a dusk surface that goes dark
 * when everything is off. Rooms are glowing pills that switch the whole room.
 * Small: bulb + count + all. Wide: count over All + a 2 × 2 grid of rooms. Tall: room list. Large: room tiles.
 * A single light (the room page's one widget per light) shows its name, level and a slider (`OneLight`).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProControlDomainModel } from '../../../lib/overviewControls';
import { useControlActions } from '../../controls/useControlActions';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { OneLight } from './OneLight';
import { glowOf, lightRooms, roomTargets, type LightRoom } from './rooms';

const WARM = (a: number) => `hsl(36 100% 62% / ${a})`;

function surface(glow: number): string {
  // Dusk base; the warm light grows with the glow (0 = all off, 1 = everything on, full bright).
  const g = Math.max(0, Math.min(1, glow));
  return [
    `radial-gradient(120% 90% at 20% 0%, ${WARM(0.25 + g * 0.6)} 0%, ${WARM(g * 0.25)} 45%, transparent 75%)`,
    `linear-gradient(160deg, hsl(28 30% ${14 + g * 10}%) 0%, hsl(250 18% ${9 + g * 4}%) 100%)`
  ].join(', ');
}

function RoomPill({ room, onPress, tile }: { room: LightRoom; onPress: () => void; tile?: boolean }) {
  const lit = room.onCount > 0;
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      aria-label={`${room.name}: ${lit ? `${room.onCount} on, turn off` : 'off, turn on'}`}
      className={cn(
        'h-auto min-w-0 justify-start gap-2 rounded-2xl px-2.5 text-left text-white ring-1',
        tile ? 'flex-col items-start gap-1 whitespace-normal py-2' : 'py-1.5',
        lit ? 'ring-white/25' : 'bg-white/5 ring-white/10 text-white/60'
      )}
      style={lit ? { background: `linear-gradient(135deg, ${WARM(0.25 + (room.level / 100) * 0.45)}, ${WARM(0.08)})`, boxShadow: `0 0 18px ${WARM(0.25 * (room.level / 100))}` } : undefined}
    >
      <HugeiconsIcon icon={BulbIcon} size={14} className={cn('shrink-0', lit ? 'text-[hsl(42_100%_80%)]' : '')} />
      {/* Tiles wrap long names onto two lines ("Home Studio & Office"); pills truncate. */}
      <span className={cn('min-w-0 text-xs font-medium', tile ? 'line-clamp-2 w-full whitespace-normal break-words leading-tight' : 'truncate')}>{room.name}</span>
      {tile ? <span className="w-full truncate text-[11px] font-normal text-white/70">{lit ? `${room.onCount}/${room.items.length} · ${room.level}%` : 'Off'}</span> : null}
    </Button>
  );
}

export default function LightsConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProControlDomainModel>) {
  const actions = useControlActions(m);
  const glow = glowOf(m);
  const anyOn = m.onCount > 0;
  const rooms = lightRooms(m);
  const toggleRoom = (room: LightRoom) => {
    for (const item of roomTargets(room).items) actions.toggleItem(item);
  };

  const all = (
    <Button
      size="sm"
      variant="ghost"
      onPress={() => void actions.toggleAll(!anyOn)}
      className="h-8 rounded-full bg-white/15 px-3 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/25"
    >
      {anyOn ? 'All off' : 'All on'}
    </Button>
  );
  const count = (big?: boolean) => (
    <div className="min-w-0">
      <p className={cn('font-semibold leading-none tracking-tight tabular-nums drop-shadow-sm', big ? 'text-5xl' : 'text-4xl')}>
        {m.onCount}
        <span className="ml-1 text-base font-normal text-white/70">of {m.totalCount}</span>
      </p>
      <p className="mt-1 truncate text-xs text-white/80">{anyOn ? `lights on${m.avgBrightnessPct !== null ? ` · ${m.avgBrightnessPct}%` : ''}` : 'Everything is off'}</p>
    </div>
  );

  return (
    <WidgetSurface label="Lighting" ink="light" style={{ background: surface(glow) }}>
      <DetailsButton title="Lighting" onPress={onOpenDetails} ink="light" />
      {/* The bulb's halo; it breathes slowly when lights are on (motion-safe only). */}
      <div
        aria-hidden
        className={cn('pointer-events-none absolute -left-10 -top-10 -z-10 size-48 rounded-full blur-2xl', anyOn && 'motion-safe:animate-[pulse_6s_ease-in-out_infinite]')}
        style={{ background: `radial-gradient(circle, ${WARM(0.15 + glow * 0.55)} 0%, transparent 70%)` }}
      />
      {m.totalCount === 1 && m.items[0] ? <OneLight item={m.items[0]} size={size} actions={actions} /> : null}
      <div className={cn('flex h-full min-h-0 flex-col gap-2 p-3.5', m.totalCount === 1 && 'hidden')}>
        {size === 's' ? (
          <>
            <HugeiconsIcon icon={BulbIcon} size={26} className={anyOn ? 'text-[hsl(42_100%_78%)] drop-shadow-[0_0_10px_hsl(40_100%_60%)]' : 'text-white/50'} />
            <div className="mt-auto flex items-end justify-between gap-2">
              {count()}
              {all}
            </div>
          </>
        ) : null}

        {size === 'w' ? (
          // Wide (owner: use the space): count on top, then "All" beside a 2 × 2 grid of rooms.
          <div className="flex h-full min-w-0 flex-col justify-between gap-2">
            {/* One line, so two rows of rooms fit below. */}
            <div className="flex min-w-0 items-center gap-2 pr-8">
              <HugeiconsIcon icon={BulbIcon} size={22} className={cn('shrink-0', anyOn ? 'text-[hsl(42_100%_78%)] drop-shadow-[0_0_8px_hsl(40_100%_60%)]' : 'text-white/50')} />
              <p className="min-w-0 truncate leading-none">
                <span className="text-3xl font-semibold tracking-tight tabular-nums drop-shadow-sm">{m.onCount}</span>
                <span className="ml-1 text-sm text-white/75">
                  of {m.totalCount} on{anyOn && m.avgBrightnessPct !== null ? ` · ${m.avgBrightnessPct}%` : ''}
                </span>
              </p>
            </div>
            <div className="flex min-w-0 items-end gap-2">
              {all}
              <ul aria-label="Rooms" className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
                {rooms.slice(0, 4).map((r) => (
                  <li key={r.name} className="min-w-0 [&>button]:w-full">
                    <RoomPill room={r} onPress={() => toggleRoom(r)} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {size === 't' ? (
          <>
            {count()}
            <ul aria-label="Rooms" className="mt-auto flex flex-col gap-1.5">
              {rooms.slice(0, 4).map((r) => (
                <li key={r.name} className="min-w-0 [&>button]:w-full">
                  <RoomPill room={r} onPress={() => toggleRoom(r)} />
                </li>
              ))}
            </ul>
            <div className="flex justify-end">{all}</div>
          </>
        ) : null}

        {size === 'l' ? (
          <>
            <div className="flex items-end justify-between gap-3 pr-8">
              {count(true)}
              {all}
            </div>
            <ul aria-label="Rooms" className="mt-auto grid grid-cols-3 gap-1.5">
              {rooms.slice(0, 6).map((r) => (
                <li key={r.name} className="min-w-0 [&>button]:w-full">
                  <RoomPill room={r} onPress={() => toggleRoom(r)} tile />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
