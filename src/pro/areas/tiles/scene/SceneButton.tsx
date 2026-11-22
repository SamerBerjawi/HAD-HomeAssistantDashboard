/**
 * Scene A · "Button". The tile is one big button: the scene's icon in its colour, its name, when
 * it last ran. Press anywhere to run it; it answers with a check ("Done") and, while the scene
 * still holds, the tile stays filled with its colour. Plain, obvious, and fast to scan in a row.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TILE_RADIUS } from '../../tileKit';
import type { SceneTileModel, TileProps, TileSize } from '../../tileTypes';
import { membersText, sceneHue, sceneIcon, sceneState, useRun } from './sceneParts';

const CHIP: Record<TileSize, number> = { xs: 40, s: 44, w: 56, t: 64, l: 72 };

export default function SceneButton({ e: s, size, act }: TileProps<SceneTileModel>) {
  const { run, done } = useRun(s, act);
  const hue = sceneHue(s);
  const on = s.available && s.isOn;
  const chip = CHIP[size];
  const Chip = (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full transition-[background,color,transform] duration-300', done && 'scale-105')}
      style={{ width: chip, height: chip, background: on || done ? hue : `color-mix(in srgb, ${hue} 16%, transparent)`, color: on || done ? 'white' : hue, boxShadow: on ? `0 8px 20px -8px ${hue}` : undefined }}
    >
      <HugeiconsIcon icon={done ? Tick02Icon : sceneIcon(s)} size={Math.round(chip * 0.46)} style={{ width: Math.round(chip * 0.46), height: Math.round(chip * 0.46) }} />
    </span>
  );
  const state = done ? 'Done' : sceneState(s);
  const name = (cls: string) => <span className={cn('min-w-0 break-words font-semibold leading-[1.15] tracking-[-0.01em]', cls)}>{s.name}</span>;
  const meta = (cls: string) => <span className={cn('min-w-0 truncate leading-tight opacity-70', cls)}>{state}</span>;

  let body;
  if (size === 'xs') {
    body = (
      <span className="flex h-full w-full items-center gap-2.5 px-3 text-left">
        {Chip}
        <span className="flex min-w-0 flex-1 flex-col">
          {name('line-clamp-1 truncate text-[14px]')}
          {meta('text-[12px]')}
        </span>
      </span>
    );
  } else if (size === 's') {
    body = (
      <span className="flex h-full w-full flex-col p-3.5 text-left">
        {Chip}
        <span className="mt-auto flex min-w-0 flex-col">
          {name('line-clamp-2 text-[15px]')}
          {meta('mt-0.5 text-[13px]')}
        </span>
      </span>
    );
  } else if (size === 'w') {
    body = (
      <span className="flex h-full w-full items-center gap-4 p-4 text-left">
        {Chip}
        <span className="flex min-w-0 flex-1 flex-col">
          {name('line-clamp-2 text-[17px]')}
          {meta('mt-1 text-[13px]')}
          <span className="mt-0.5 text-[12px] opacity-50">{membersText(s)}</span>
        </span>
      </span>
    );
  } else if (size === 't') {
    body = (
      <span className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
        {Chip}
        {name('line-clamp-3 text-[17px]')}
        {meta('text-[13px]')}
      </span>
    );
  } else {
    body = (
      <span className="flex h-full w-full flex-col p-5 text-left">
        {Chip}
        <span className="mt-auto flex min-w-0 flex-col">
          {name('line-clamp-2 text-[26px]')}
          {meta('mt-1.5 text-[14px]')}
          <span className="mt-0.5 text-[13px] opacity-50">{membersText(s)}</span>
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
        'h-full w-full min-w-0 items-stretch justify-stretch p-0 font-normal transition-[background,transform] duration-200 data-[pressed=true]:scale-[0.97]',
        TILE_RADIUS,
        !on && 'pro-surface',
        !s.available && 'opacity-60'
      )}
      style={on ? { background: `linear-gradient(150deg, color-mix(in srgb, ${hue} 26%, var(--surface)), color-mix(in srgb, ${hue} 8%, var(--surface)))` } : undefined}
    >
      {body}
    </Button>
  );
}
