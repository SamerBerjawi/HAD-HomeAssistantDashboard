/**
 * Vehicle tiles · batch 4 · Location (docs/pro-ui/VEHICLE_TILES.md): where it is (zone, address,
 * when last reported) and, while it drives, how fast and in what gear. Read only.
 * A · Map: the map is the tile, a frosted label along the bottom (the Room page's camera tiles).
 * B · Place: words only: "Home" or the street big, "Seen 4 min ago"; driving, the speed big.
 * C · Split: a square map beside the words (Small: map on top).
 */
import { lazy, Suspense } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon, Navigation03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { ago, type Vehicle } from '../../../../lib/mobilityHome';
import { Big, IconChip, NOT_ON_CAR, useDark, VHUE, type VehicleTileProps } from '../vehicleTileKit';

const CarMap = lazy(() => import('../../../../widgets/car/concepts/CarMap'));

const DRIVE = VHUE.info;

/** Where, in words: the zone or the street; "Driving" while it moves. */
function placeWords(v: Vehicle, now: number) {
  const p = v.place!;
  const moving = !!v.motion?.moving;
  return {
    moving,
    title: moving ? 'Driving' : (p.zone ?? p.address ?? 'Away'),
    line: moving ? [p.address ? `near ${p.address}` : null, v.motion?.gear ? `Gear ${v.motion.gear}` : null].filter(Boolean).join(' · ') : [p.zone && p.address ? p.address : null, p.at ? `seen ${ago(p.at, now)}` : null].filter(Boolean).join(' · '),
    speed: moving && v.motion?.speed != null ? Math.round(v.motion.speed) : null
  };
}

function Unavailable() {
  return (
    <TileFrame label="Location" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={Location01Icon} on={false} />
        <TileName className="mt-auto">Location</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function MapFill({ v, label }: { v: Vehicle; label: string }) {
  const [ref, dark] = useDark<HTMLDivElement>();
  return (
    <div ref={ref} className="absolute inset-0 bg-[color-mix(in_srgb,currentColor_6%,transparent)]">
      <Suspense fallback={null}>
        <CarMap key={String(dark)} lat={v.place!.lat} lon={v.place!.lon} dark={dark} label={label} className="h-full w-full" />
      </Suspense>
    </div>
  );
}

/** The X-small row every concept shares: a pin, the place, when. */
function Row({ v, now }: { v: Vehicle; now: number }) {
  const w = placeWords(v, now);
  return (
    <TileFrame label="Location" className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={w.moving ? Navigation03Icon : Location01Icon} hue={w.moving ? DRIVE : undefined} on={w.moving} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{w.speed !== null ? `${w.speed} ${v.unit === 'mi' ? 'mph' : 'km/h'}` : w.title}</p>
          <TileState className="text-[12px]">{w.moving ? 'Driving' : v.place!.at ? ago(v.place!.at, now) : ''}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Map
// ---------------------------------------------------------------------------------------------

export function LocationMap({ v, size, now }: VehicleTileProps) {
  if (!v.place) return <Unavailable />;
  if (size === 'xs') return <Row v={v} now={now} />;
  const w = placeWords(v, now);
  return (
    <TileFrame label="Location" className="pro-surface">
      <MapFill v={v} label={`${v.name}: ${w.title}`} />
      <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-[18px] bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] px-3 py-2 backdrop-blur-md">
        <p className={cn('truncate font-semibold tracking-[-0.01em]', size === 'l' ? 'text-[20px]' : 'text-[15px]')} style={w.moving ? { color: DRIVE } : undefined}>
          {w.speed !== null ? `Driving · ${w.speed} ${v.unit === 'mi' ? 'mph' : 'km/h'}` : w.title}
        </p>
        {size !== 's' && w.line ? <p className="truncate text-[12px] opacity-70">{w.line}</p> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Place
// ---------------------------------------------------------------------------------------------

export function LocationPlace({ v, size, now }: VehicleTileProps) {
  if (!v.place) return <Unavailable />;
  if (size === 'xs') return <Row v={v} now={now} />;
  const w = placeWords(v, now);
  return (
    <TileFrame label="Location" className="pro-surface" style={w.moving ? { background: `linear-gradient(150deg, color-mix(in srgb, ${DRIVE} 14%, var(--surface)), var(--surface) 75%)` } : undefined}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <IconChip icon={w.moving ? Navigation03Icon : Location01Icon} hue={w.moving ? DRIVE : undefined} on={w.moving} px={size === 'l' ? 40 : 32} />
          {w.moving && v.motion?.gear && size !== 's' ? <span className="rounded-full bg-[color-mix(in_srgb,currentColor_8%,transparent)] px-2.5 py-1 text-[12px] font-semibold">{v.motion.gear}</span> : null}
        </div>
        <div className="mt-auto min-w-0">
          {w.speed !== null ? (
            <Big n={w.speed} unit={v.unit === 'mi' ? 'mph' : 'km/h'} className={size === 'l' ? 'text-[64px]' : 'text-[34px]'} style={{ color: DRIVE }} />
          ) : (
            <p className={cn('truncate font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[34px]' : size === 's' ? 'text-[20px]' : 'text-[26px]')}>{w.title}</p>
          )}
          <TileState className="mt-1">{w.line || ' '}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Split
// ---------------------------------------------------------------------------------------------

export function LocationSplit({ v, size, now }: VehicleTileProps) {
  if (!v.place) return <Unavailable />;
  if (size === 'xs') return <Row v={v} now={now} />;
  const w = placeWords(v, now);
  const map = (
    <div className={cn('relative shrink-0 overflow-hidden rounded-[18px]', size === 's' ? 'h-[76px] w-full' : size === 'w' ? 'aspect-square h-full' : 'h-[58%] w-full')}>
      <MapFill v={v} label={`${v.name}: ${w.title}`} />
    </div>
  );
  return (
    <TileFrame label="Location" className="pro-surface">
      <div className={cn('flex h-full gap-3', size === 'w' ? 'p-2.5 pr-4' : 'flex-col p-2.5')}>
        {map}
        <div className={cn('flex min-w-0 flex-1 flex-col justify-end', size === 'w' ? 'py-1.5' : 'px-1.5 pb-1.5')}>
          {size === 'w' ? <TileName className="mb-auto pt-1 opacity-70">Location</TileName> : null}
          <p className={cn('truncate font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[26px]' : 'text-[17px]')} style={w.moving ? { color: DRIVE } : undefined}>
            {w.speed !== null ? `${w.speed} ${v.unit === 'mi' ? 'mph' : 'km/h'}` : w.title}
          </p>
          {size !== 's' ? (
            <TileState>{w.line}</TileState>
          ) : (
            <p className="flex items-center gap-1 truncate text-[12px] opacity-70">
              <HugeiconsIcon icon={Location01Icon} size={12} />
              {v.place.at ? ago(v.place.at, now) : ''}
            </p>
          )}
        </div>
      </div>
    </TileFrame>
  );
}
