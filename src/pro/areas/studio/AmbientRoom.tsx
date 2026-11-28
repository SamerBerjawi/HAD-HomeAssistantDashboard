/**
 * The Living Room in concept D · Ambient, laid out like the owner's reference (2026-11-21): the
 * room's photo fading in behind a breadcrumb, the title and the room's facts; then one grid of
 * tiles with no section headings. Sizes differ per screen (phone uses X-small for the quick ones).
 */
import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Home01Icon, MoreHorizontalIcon, Sofa01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ClimateTileModel, FanTileModel, LightTileModel, MediaTileModel, CameraTileModel, CoverTileModel, ReadingTileModel, SwitchTileModel, TileAction, TileModel, TileSize } from '../tileTypes';
import { AmbientCamera, AmbientMedia } from '../tiles/ambient/AmbientMedia';
import { AmbientCover, AmbientReading, AmbientThermostat } from '../tiles/ambient/AmbientClimate';
import { AmbientFan, AmbientLight, AmbientSwitch } from '../tiles/ambient/AmbientPower';
import { CAMERA_STATES, COVER_STATES, FAN_STATES, LIGHT_STATES, MEDIA_STATES, READING_STATES, SWITCH_STATES, applyTileAction, CLIMATE_STATES } from './areaStates';
import { ROOM_PHOTO } from './mockArt';

export type Screen = 'phone' | 'tablet' | 'desktop';

const SPAN: Record<TileSize, string> = { xs: 'col-span-1 row-span-1', s: 'col-span-1 row-span-2', w: 'col-span-2 row-span-2', t: 'col-span-1 row-span-4', l: 'col-span-2 row-span-4' };

const first = <M,>(list: { id: string; model: M }[], id: string) => list.find((s) => s.id === id)!.model;
const warm = first(LIGHT_STATES, 'warm');

/** The reference room: 9 devices plus the fan and plug from batch 1. */
const ROOM: { model: TileModel; phone: TileSize; wide: TileSize }[] = [
  { model: { ...warm, name: 'Ceiling Light', brightness: 75 } as LightTileModel, phone: 'w', wide: 'w' },
  { model: { ...warm, entityId: 'light.living_room_floor_lamp', name: 'Floor Lamp', brightness: 60 } as LightTileModel, phone: 'xs', wide: 's' },
  { model: { ...warm, entityId: 'light.living_room_accent', name: 'Accent Light', isOn: false, brightness: null } as LightTileModel, phone: 'xs', wide: 's' },
  { model: { ...first(CLIMATE_STATES, 'heat'), entityId: 'climate.living_room', name: 'Thermostat', current: 21.4, target: 22 } as ClimateTileModel, phone: 'w', wide: 'l' },
  { model: first(COVER_STATES, 'open') as CoverTileModel, phone: 'w', wide: 'w' },
  { model: { ...first(READING_STATES, 'temp'), value: 22 } as ReadingTileModel, phone: 'xs', wide: 's' },
  { model: first(READING_STATES, 'humidity') as ReadingTileModel, phone: 'xs', wide: 's' },
  { model: first(MEDIA_STATES, 'playing') as MediaTileModel, phone: 'w', wide: 'l' },
  { model: first(CAMERA_STATES, 'live') as CameraTileModel, phone: 'w', wide: 'l' },
  { model: first(FAN_STATES, 'tower') as FanTileModel, phone: 'xs', wide: 's' },
  { model: first(SWITCH_STATES, 'plug') as SwitchTileModel, phone: 'xs', wide: 's' }
];

function Tile({ m, size, act }: { m: TileModel; size: TileSize; act: (a: TileAction) => void }) {
  switch (m.kind) {
    case 'light':
      return <AmbientLight e={m} size={size} act={act} />;
    case 'switch':
      return <AmbientSwitch e={m} size={size} act={act} />;
    case 'fan':
      return <AmbientFan e={m} size={size} act={act} />;
    case 'climate':
      return <AmbientThermostat e={m} size={size} act={act} />;
    case 'cover':
      return <AmbientCover e={m} size={size} act={act} />;
    case 'reading':
      return <AmbientReading e={m} size={size} act={act} />;
    case 'media':
      return <AmbientMedia e={m} size={size} act={act} />;
    case 'camera':
      return <AmbientCamera e={m} size={size} act={act} />;
  }
}

const BG: Record<'light' | 'dark', string> = {
  dark: 'radial-gradient(55% 32% at 72% 0%, rgba(150,95,255,0.22), transparent 70%), radial-gradient(45% 30% at 0% 60%, rgba(60,120,255,0.12), transparent 70%), hsl(232 26% 8%)',
  light: 'radial-gradient(55% 32% at 72% 0%, rgba(150,95,255,0.16), transparent 70%), radial-gradient(45% 30% at 0% 60%, rgba(60,140,255,0.1), transparent 70%), hsl(240 25% 96%)'
};

export default function AmbientRoom({ screen, theme, width }: { screen: Screen; theme: 'light' | 'dark'; width: number }) {
  const [models, setModels] = useState<TileModel[]>(() => ROOM.map((r) => r.model));
  const phone = screen === 'phone';
  const act = (i: number) => (a: TileAction) => setModels((all) => all.map((m, j) => (j === i ? applyTileAction(m, a) : m)));
  const temp = models.find((m) => m.kind === 'reading' && m.deviceClass === 'temperature') as ReadingTileModel | undefined;
  const hum = models.find((m) => m.kind === 'reading' && m.deviceClass === 'humidity') as ReadingTileModel | undefined;
  const facts = [`${models.length} devices`, temp?.value != null ? `${temp.value.toFixed(1)}°C` : null, hum?.value != null ? `${hum.value}%` : null].filter(Boolean).join(' · ');
  return (
    <div className="@container relative isolate overflow-hidden rounded-[28px] text-[hsl(240_20%_14%)] dark:text-white" style={{ width, background: BG[theme] }}>
      {!phone ? (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[340px] opacity-60 dark:opacity-55"
          style={{ backgroundImage: ROOM_PHOTO, backgroundSize: 'cover', backgroundPosition: 'center 40%', maskImage: 'linear-gradient(180deg, black 35%, transparent), linear-gradient(90deg, transparent, black 45%)', maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}
        />
      ) : null}
      <div className={cn('px-4', phone ? 'pb-5 pt-4' : 'px-6 pb-6 pt-6')}>
        <header className={cn('flex flex-col', phone ? 'mb-4 gap-1' : 'mb-16 gap-2')}>
          <div className="flex items-center justify-between text-[14px] opacity-75">
            <span className="flex items-center gap-1.5">
              {phone ? <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> : <HugeiconsIcon icon={Home01Icon} size={17} />}
              {phone ? null : <HugeiconsIcon icon={ArrowRight01Icon} size={14} />}
              Areas
            </span>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
          </div>
          <h1 className={cn('font-semibold tracking-[-0.02em]', phone ? 'text-[28px]' : 'text-[44px] leading-tight')}>Living Room</h1>
          <p className={cn('flex items-center gap-2 opacity-70', phone ? 'text-[13px]' : 'text-[17px]')}>
            <HugeiconsIcon icon={Sofa01Icon} size={phone ? 16 : 20} />
            {facts}
          </p>
        </header>
        <ul className="grid grid-flow-dense grid-cols-2 gap-3 @2xl:grid-cols-4 @5xl:grid-cols-6" style={{ gridAutoRows: '68px' }}>
          {models.map((m, i) => {
            const size = phone ? ROOM[i].phone : ROOM[i].wide;
            return (
              <li key={m.entityId} className={cn(SPAN[size], 'min-h-0 min-w-0')}>
                <Tile m={m} size={size} act={act(i)} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
