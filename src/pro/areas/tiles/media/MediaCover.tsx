/**
 * Speaker & TV A · "Cover". The artwork is the tile: it fills the card edge to edge (a blurred
 * wash of it behind on the bigger sizes), the title sits on it in white, and tapping anywhere on it
 * plays or pauses. Transport and progress come in from Wide up. A TV without artwork shows its
 * app's name over a deep gradient; nothing playing is a quiet card with the speaker's icon.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { MediaTileModel, TileProps } from '../../tileTypes';
import { MediaProgress, mediaIcon, mediaLines, mediaState, Transport } from './mediaParts';

const TV_ART = 'linear-gradient(140deg, hsl(350 70% 32%), hsl(268 55% 22%) 55%, hsl(225 50% 12%))';

/** The picture: artwork, or the TV gradient with its app's name. */
function Picture({ e, className, label = true }: { e: MediaTileModel; className?: string; label?: boolean }) {
  return (
    <div aria-hidden className={cn('relative overflow-hidden', className)} style={{ background: e.art ?? TV_ART }}>
      {!e.art && label ? (
        <span className="absolute inset-0 grid place-items-center text-center text-[22px] font-bold tracking-tight text-white/85">
          <span className="flex flex-col items-center gap-1">
            <HugeiconsIcon icon={mediaIcon(e)} size={26} className="opacity-70" />
            {e.source}
          </span>
        </span>
      ) : null}
    </div>
  );
}

export default function MediaCover({ e, size, act }: TileProps<MediaTileModel>) {
  const [title, sub] = mediaLines(e);
  const has = e.available && !!e.title;

  // Nothing playing (or unavailable): a plain card, no picture to show.
  if (!has) {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        <div className={cn('flex h-full gap-3', size === 'xs' ? 'items-center px-3.5' : 'flex-col p-4')}>
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,currentColor_7%,transparent)] opacity-70">
            <HugeiconsIcon icon={mediaIcon(e)} size={20} />
          </span>
          <div className={cn('min-w-0', size !== 'xs' && 'mt-auto')}>
            <TileName className={size === 'xs' ? 'line-clamp-1 truncate text-[14px]' : ''}>{e.name}</TileName>
            <TileState className={size === 'xs' ? 'text-[12px]' : ''}>{mediaState(e)}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }

  // The whole picture plays / pauses; the controls sit above it as siblings (never nested buttons).
  const tap = (
    <Button
      variant="ghost"
      aria-label={`${e.name}: ${e.playing ? 'pause' : 'play'} ${title}`}
      onPress={() => act({ type: 'media', cmd: e.playing ? 'pause' : 'play' })}
      className="absolute inset-0 h-full w-full min-w-0 rounded-none p-0 data-[hovered=true]:bg-transparent data-[pressed=true]:bg-black/10"
    />
  );
  const badge = (px: number) => (
    <span aria-hidden className="pointer-events-none grid shrink-0 place-items-center rounded-full bg-white/90 text-[hsl(260_30%_14%)] shadow-md" style={{ width: px, height: px }}>
      <HugeiconsIcon icon={e.playing ? PauseIcon : PlayIcon} size={Math.round(px * 0.46)} />
    </span>
  );
  const scrim = 'pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(0,0,0,0.72))]';
  const white = 'text-white';

  if (size === 'xs' || size === 's' || size === 'w') {
    return (
      <TileFrame label={e.name} className={cn('bg-black', white)}>
        <Picture e={e} className="absolute inset-0" label={false} />
        <div className={scrim} />
        {tap}
        {size === 'xs' ? (
          <div className="pointer-events-none relative flex h-full items-center gap-2.5 px-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold leading-tight">{title}</p>
              <p className="truncate text-[12px] opacity-75">{e.muted ? 'Muted' : sub}</p>
            </div>
            {badge(30)}
          </div>
        ) : size === 's' ? (
          <div className="pointer-events-none relative flex h-full flex-col p-3.5">
            <div className="flex justify-end">{badge(32)}</div>
            <div className="mt-auto min-w-0">
              <p className="line-clamp-2 text-[15px] font-semibold leading-tight">{title}</p>
              <p className="mt-0.5 truncate text-[12px] opacity-75">{e.muted ? 'Muted' : sub}</p>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none relative flex h-full flex-col p-4">
            <p className="truncate text-[12px] font-medium opacity-75">{e.name}</p>
            <div className="mt-auto flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold leading-tight">{title}</p>
                <p className="mt-0.5 truncate text-[13px] opacity-75">{e.muted ? `Muted · ${sub}` : sub}</p>
                <MediaProgress e={e} className="mt-2.5" track="bg-white/25" />
              </div>
              <div className="pointer-events-auto flex items-center">
                <Transport e={e} act={act} cmd="previous" size={34} className="text-white" />
                <Transport e={e} act={act} cmd="play" size={42} className="bg-white text-[hsl(260_30%_14%)]" />
                <Transport e={e} act={act} cmd="next" size={34} className="text-white" />
              </div>
            </div>
          </div>
        )}
      </TileFrame>
    );
  }

  // Tall and Large: the picture as a square, with a blurred wash of it filling the card.
  const wash = (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute -inset-10 scale-110 blur-2xl" style={{ background: e.art ?? TV_ART }} />
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
  const controls = (
    <div className="flex items-center gap-1">
      <Transport e={e} act={act} cmd="previous" size={36} className="text-white" />
      <Transport e={e} act={act} cmd="play" size={46} className="bg-white text-[hsl(260_30%_14%)]" />
      <Transport e={e} act={act} cmd="next" size={36} className="text-white" />
    </div>
  );
  if (size === 't') {
    return (
      <TileFrame label={e.name} className={cn('bg-black', white)}>
        {wash}
        <div className="relative flex h-full flex-col p-3">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[18px] shadow-lg">
            <Picture e={e} className="absolute inset-0" />
            {tap}
          </div>
          <div className="mt-2.5 min-w-0 px-1">
            <p className="truncate text-[15px] font-semibold leading-tight">{title}</p>
            <p className="truncate text-[12px] opacity-75">{e.muted ? 'Muted' : sub}</p>
          </div>
          <MediaProgress e={e} className="mx-1 mt-2" track="bg-white/25" />
          <div className="mt-auto flex items-center justify-center gap-1">
            <Transport e={e} act={act} cmd="previous" size={32} className="text-white" />
            <Transport e={e} act={act} cmd="play" size={42} className="bg-white text-[hsl(260_30%_14%)]" />
            <Transport e={e} act={act} cmd="next" size={32} className="text-white" />
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={cn('bg-black', white)}>
      {wash}
      <div className="relative flex h-full gap-4 p-4">
        <div className="relative aspect-square w-[46%] shrink-0 self-center overflow-hidden rounded-[20px] shadow-xl">
          <Picture e={e} className="absolute inset-0" />
          {tap}
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <div className="flex items-center gap-1">
            <p className="min-w-0 flex-1 truncate text-[12px] font-medium opacity-70">{e.name}</p>
            <Transport e={e} act={act} cmd="mute" size={30} className="-mr-1.5 -mt-1 text-white/80" />
          </div>
          <p className="mt-auto line-clamp-2 text-[20px] font-semibold leading-tight">{title}</p>
          <p className="mt-1 truncate text-[13px] opacity-75">{sub}</p>
          <MediaProgress e={e} times className="mt-3" track="bg-white/25" />
          <div className="mt-3">{controls}</div>
        </div>
      </div>
    </TileFrame>
  );
}
