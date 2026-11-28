/**
 * Scene B · "Palette". A preview of the room the scene makes: the tile is painted with the colours
 * its lights go to, soft pools of light blending into each other (deep blue for Good Night, warm
 * amber for Relax). The name sits on a frosted label. Press anywhere to run it; a "Now" pill shows
 * while it holds. You pick a scene by how it looks, not by reading.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TILE_RADIUS } from '../../tileKit';
import type { SceneTileModel, TileProps } from '../../tileTypes';
import { membersText, sceneIcon, sceneState, useRun } from './sceneParts';

/** Pools of light: one radial per palette colour, spread across the tile. */
const SPOTS = ['20% 25%', '85% 20%', '55% 90%', '10% 95%'];
function paint(s: SceneTileModel): string {
  const cols = s.palette.length ? s.palette : ['hsl(230 10% 70%)'];
  const night = s.look === 'night';
  const base = night ? 'hsl(232 35% 14%)' : `color-mix(in srgb, ${cols[0]} 35%, hsl(30 30% 96%))`;
  const pools = cols.slice(0, 4).map((c, i) => `radial-gradient(70% 80% at ${SPOTS[i]}, ${c}, transparent 70%)`);
  return [...pools, base].join(', ');
}

export default function ScenePalette({ e: s, size, act }: TileProps<SceneTileModel>) {
  const { run, done } = useRun(s, act);
  const on = s.available && s.isOn;
  const state = done ? 'Done' : sceneState(s);
  const icon = sceneIcon(s);
  const label = cn(
    'flex min-w-0 flex-col rounded-2xl bg-white/70 text-[hsl(240_20%_14%)] shadow-sm backdrop-blur-md dark:bg-black/45 dark:text-white',
    size === 'xs' ? 'flex-1 px-2.5 py-1.5' : size === 'l' ? 'px-4 py-3' : 'px-3 py-2'
  );
  const pill = on || done ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-[hsl(240_20%_14%)] shadow-sm dark:bg-black/55 dark:text-white">
      <HugeiconsIcon icon={Tick02Icon} size={12} />
      {done ? 'Done' : 'Now'}
    </span>
  ) : null;
  const iconBubble = (px: number) => (
    <span className="grid shrink-0 place-items-center rounded-full bg-white/70 text-[hsl(240_20%_14%)] backdrop-blur-md dark:bg-black/40 dark:text-white" style={{ width: px, height: px }}>
      <HugeiconsIcon icon={icon} size={Math.round(px * 0.5)} style={{ width: Math.round(px * 0.5), height: Math.round(px * 0.5) }} />
    </span>
  );
  const swatches = (
    <span className="flex gap-1">
      {s.palette.map((c, i) => (
        <span key={i} className="size-3 rounded-full ring-1 ring-black/10 dark:ring-white/20" style={{ background: c }} />
      ))}
    </span>
  );

  let body;
  if (size === 'xs') {
    body = (
      <span className="flex h-full w-full items-center gap-2 p-2 text-left">
        <span className={label}>
          <span className="truncate text-[14px] font-semibold leading-tight">{s.name}</span>
          <span className="truncate text-[11px] opacity-70">{on || done ? (done ? 'Done' : 'Active') : sceneState(s)}</span>
        </span>
        {iconBubble(34)}
      </span>
    );
  } else {
    const big = size === 'l';
    body = (
      <span className={cn('flex h-full w-full flex-col text-left', big ? 'p-4' : 'p-2.5')}>
        <span className="flex items-start justify-between gap-2">
          {iconBubble(big ? 44 : 34)}
          {pill}
        </span>
        <span className={cn(label, 'mt-auto')}>
          <span className={cn('line-clamp-2 break-words font-semibold leading-tight', big ? 'text-[22px]' : 'text-[15px]')}>{s.name}</span>
          <span className={cn('mt-0.5 truncate opacity-70', big ? 'text-[13px]' : 'text-[12px]')}>{state}</span>
          {big || size === 'w' || size === 't' ? (
            <span className="mt-1.5 flex items-center gap-2 text-[12px] opacity-70">
              {swatches}
              <span className="truncate">{membersText(s)}</span>
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      aria-label={`${s.name}: run scene. ${state}`}
      isDisabled={!s.available}
      onPress={run}
      className={cn(
        'relative h-full w-full min-w-0 items-stretch justify-stretch overflow-hidden p-0 font-normal transition-[transform,box-shadow] duration-200 data-[pressed=true]:scale-[0.97]',
        TILE_RADIUS,
        on && 'ring-[3px] ring-inset ring-white/80 dark:ring-white/60',
        !s.available && 'opacity-50 grayscale'
      )}
      style={{ background: paint(s) }}
    >
      {body}
    </Button>
  );
}
