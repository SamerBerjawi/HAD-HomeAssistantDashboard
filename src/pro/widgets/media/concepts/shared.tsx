/** Pieces the Media styles share: the art, its colours, position and transport buttons. */
import type { CSSProperties } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from '@hugeicons/core-free-icons';
import { useAlbumArtColor } from '@/hooks/useAlbumArtColor';
import { useMediaPosition } from '@/hooks/useMediaPosition';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { ProMediaOverviewModel } from '../../../lib/overviewMedia';
import { useHaPicture } from '../../shared/useHaPicture';
import { useInDark } from '../../shared/useInDark';
import { useMediaActions } from '../useMediaActions';

/** Art URL, palette (for this preview's theme), live position and actions of the active player. */
export function useMediaView(model: ProMediaOverviewModel, live: boolean) {
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const dark = useInDark<HTMLElement>();
  const player = model.activePlayer;
  const imageUrl = useHaPicture(player?.rawImage, serverUrl);
  const palette = useAlbumArtColor(imageUrl || null, { title: player?.title, artist: player?.artist, darkMode: dark.isDark });
  const position = useMediaPosition(model.activeEntity, false, null, live && Boolean(player?.isPlaying));
  const actions = useMediaActions(model);
  return { player, imageUrl, palette, position, actions, darkRef: dark.ref, isDark: dark.isDark };
}

export type MediaView = ReturnType<typeof useMediaView>;

export function Art({ url, className, style, rounded = 'rounded-xl' }: { url?: string | null; className?: string; style?: CSSProperties; rounded?: string }) {
  return (
    <div className={cn('shrink-0 overflow-hidden bg-default', rounded, className)} style={style}>
      {url ? <img src={url} alt="" loading="lazy" decoding="async" className="size-full object-cover" /> : null}
    </div>
  );
}

type Ink = 'auto' | 'light';

export function Transport({ view, compact, ink = 'auto', accent }: { view: MediaView; compact?: boolean; ink?: Ink; accent?: string }) {
  const p = view.player;
  if (!p) return null;
  const id = p.entityId;
  const ghost = ink === 'light' ? 'text-white hover:bg-white/15' : 'text-foreground hover:bg-default';
  return (
    <div className="flex items-center gap-1">
      {p.supportsNextPrev && !compact ? (
        <Button isIconOnly size="sm" variant="ghost" aria-label="Previous track" onPress={() => view.actions.prev(id)} className={cn('rounded-full', ghost)}>
          <HugeiconsIcon icon={PreviousIcon} size={18} />
        </Button>
      ) : null}
      <Button
        isIconOnly
        aria-label={p.isPlaying ? 'Pause' : 'Play'}
        onPress={() => view.actions.playPause(id)}
        className={cn('size-10 min-w-0 rounded-full', ink === 'light' ? 'bg-white text-black' : 'text-white')}
        style={ink === 'light' ? undefined : { background: accent ?? 'var(--foreground)' }}
      >
        <HugeiconsIcon icon={p.isPlaying ? PauseIcon : PlayIcon} size={18} />
      </Button>
      {p.supportsNextPrev && !compact ? (
        <Button isIconOnly size="sm" variant="ghost" aria-label="Next track" onPress={() => view.actions.next(id)} className={cn('rounded-full', ghost)}>
          <HugeiconsIcon icon={NextIcon} size={18} />
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Track position. Some players (TVs, radio) report no length: the model's fallback length is
 * used while playing, and without any length the bar stays empty with "--:--".
 */
export function Progress({ view, color, track = 'bg-default' }: { view: MediaView; color: string; track?: string }) {
  const { duration: reported, currentPosition, formatTime } = view.position;
  const duration = reported || view.player?.durationSecs || 0;
  const position = duration ? Math.min(duration, currentPosition) : 0;
  const pct = duration ? (position / duration) * 100 : 0;
  return (
    <div className="flex w-full items-center gap-2 text-[11px] tabular-nums opacity-80">
      <span className="w-9 shrink-0">{formatTime(position)}</span>
      <span
        className={cn('relative h-1 flex-1 overflow-hidden rounded-full', track)}
        role="progressbar"
        aria-label="Track position"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="w-9 shrink-0 text-right">{duration ? formatTime(duration) : '--:--'}</span>
    </div>
  );
}

/** Title over artist; the artist takes the art colour when given. */
export function TrackText({ view, big, artistColor, sub = 'text-muted' }: { view: MediaView; big?: boolean; artistColor?: string; sub?: string }) {
  const p = view.player;
  if (!p) return null;
  return (
    <div className="min-w-0">
      <p className={cn('font-semibold leading-tight', big ? 'line-clamp-2 text-lg' : 'truncate text-sm')}>{p.title || p.shortName}</p>
      <p className={cn('truncate text-xs', !artistColor && sub)} style={artistColor ? { color: artistColor } : undefined}>
        {p.artist || p.deviceKindLabel}
      </p>
    </div>
  );
}
