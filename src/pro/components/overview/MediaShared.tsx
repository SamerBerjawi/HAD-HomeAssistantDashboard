/**
 * Shared Media Player UI primitives for pro Overview (docs/pro-ui/DESIGN.md 7.6):
 * dark-mode detector, square album cover renderer, dual-layer adaptive album-art backdrop,
 * transport buttons, volume Slider, and expandable "Up next" track queue panel.
 */
import { useEffect, useState } from 'react';
import { Badge, Button, Slider } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  MusicNote03Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  Playlist01Icon,
  PreviousIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeHighIcon,
  VolumeMute02Icon
} from '@hugeicons/core-free-icons';
import type { AlbumArtPalette } from '@/hooks/useAlbumArtColor';
import { cn } from '@/lib/utils';
import { useHAImage } from '@/services/haImageService';
import type { ProMediaQueueSource, ProMediaQueueTrack } from '../../lib/overviewMedia';

export function useProDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    if (document.documentElement.classList.contains('dark')) return true;
    return Boolean(document.querySelector('.pro.dark'));
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sync = () => {
      setIsDark(
        document.documentElement.classList.contains('dark') ||
          Boolean(document.querySelector('.pro.dark'))
      );
    };
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const proRoot = document.querySelector('.pro');
    if (proRoot) {
      observer.observe(proRoot, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ProMediaCover({
  rawImage,
  alt,
  serverUrl,
  sizeClass,
  palette,
  iconSize = 22
}: {
  rawImage: string | null | undefined;
  alt: string;
  serverUrl: string;
  sizeClass: string;
  palette: AlbumArtPalette;
  iconSize?: number;
}) {
  const { imageUrl } = useHAImage(rawImage || undefined, serverUrl);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden shadow-sm ring-1 ring-black/10 dark:ring-white/10',
        sizeClass
      )}
      style={
        !imageUrl
          ? {
              background: `linear-gradient(135deg, ${palette.badgeBg}, transparent 120%)`
            }
          : undefined
      }
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center" style={{ color: palette.primary }}>
          <HugeiconsIcon icon={MusicNote03Icon} size={iconSize} />
        </div>
      )}
    </div>
  );
}

export function ProMediaAdaptiveBackdrop({
  albumArt,
  palette,
  isPlaying,
  darkMode,
  roundedClass = 'rounded-2xl'
}: {
  albumArt: string | null;
  palette: AlbumArtPalette;
  isPlaying: boolean;
  darkMode: boolean;
  roundedClass?: string;
}) {
  const showActiveWash = isPlaying || Boolean(albumArt);
  if (!showActiveWash) return null;

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', roundedClass)}
    >
      {albumArt ? (
        <img
          src={albumArt}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            'size-full scale-115 object-cover blur-2xl transition-opacity duration-700',
            isPlaying
              ? darkMode
                ? 'opacity-28'
                : 'opacity-20'
              : darkMode
                ? 'opacity-14'
                : 'opacity-10'
          )}
        />
      ) : null}

      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 22% 24%, ${
            isPlaying ? palette.glow : palette.glowSubtle
          }, transparent 75%)`
        }}
      />

      <div
        className={cn(
          'absolute inset-0',
          darkMode
            ? 'bg-gradient-to-b from-background/50 via-background/72 to-background/88'
            : 'bg-gradient-to-b from-background/60 via-background/78 to-background/90'
        )}
      />
    </div>
  );
}

export function ProMediaTransportControls({
  isPlaying,
  shuffle,
  repeat,
  supportsNextPrev,
  supportsShuffle = false,
  supportsRepeat = false,
  palette,
  size = 'md',
  onPrev,
  onPlayPause,
  onNext,
  onToggleShuffle,
  onCycleRepeat
}: {
  isPlaying: boolean;
  shuffle?: boolean;
  repeat?: 'off' | 'all' | 'one';
  supportsNextPrev: boolean;
  supportsShuffle?: boolean;
  supportsRepeat?: boolean;
  palette: AlbumArtPalette;
  size?: 'sm' | 'md' | 'lg';
  onPrev: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
}) {
  const skipSize = size === 'lg' ? 'md' : 'sm';
  const playButtonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const skipIconSize = size === 'lg' ? 18 : size === 'sm' ? 13 : 15;
  const playIconSize = size === 'lg' ? 22 : size === 'sm' ? 14 : 18;
  const compactButtonClass = size === 'sm' ? 'size-7 min-w-7' : undefined;

  return (
    <div
      className={cn('flex items-center', size === 'sm' ? 'gap-1' : 'gap-1.5')}
      data-card-click="ignore"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {supportsShuffle && onToggleShuffle ? (
        <Button
          isIconOnly
          size="sm"
          variant={shuffle ? 'primary' : 'ghost'}
          aria-label="Toggle shuffle"
          style={shuffle ? { backgroundColor: palette.primary, color: '#ffffff' } : undefined}
          onPress={onToggleShuffle}
        >
          <HugeiconsIcon icon={ShuffleIcon} size={14} />
        </Button>
      ) : null}

      <Button
        isIconOnly
        size={skipSize}
        variant="tertiary"
        aria-label="Previous track"
        className={compactButtonClass}
        isDisabled={!supportsNextPrev}
        onPress={onPrev}
      >
        <HugeiconsIcon icon={PreviousIcon} size={skipIconSize} />
      </Button>

      <Button
        isIconOnly
        size={playButtonSize}
        variant="primary"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={compactButtonClass}
        style={{
          backgroundColor: palette.primary,
          color: '#ffffff',
          boxShadow: size === 'sm' ? undefined : `0 8px 20px -4px ${palette.glow}`
        }}
        onPress={onPlayPause}
      >
        <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={playIconSize} />
      </Button>

      <Button
        isIconOnly
        size={skipSize}
        variant="tertiary"
        aria-label="Next track"
        className={compactButtonClass}
        isDisabled={!supportsNextPrev}
        onPress={onNext}
      >
        <HugeiconsIcon icon={NextIcon} size={skipIconSize} />
      </Button>

      {supportsRepeat && onCycleRepeat && repeat ? (
        <Button
          isIconOnly
          size="sm"
          variant={repeat !== 'off' ? 'primary' : 'ghost'}
          aria-label={`Repeat: ${repeat}`}
          style={
            repeat !== 'off' ? { backgroundColor: palette.primary, color: '#ffffff' } : undefined
          }
          onPress={onCycleRepeat}
        >
          <HugeiconsIcon icon={RepeatIcon} size={14} />
        </Button>
      ) : null}
    </div>
  );
}

export function ProMediaVolumeSlider({
  volumePct,
  isMuted,
  isDisabled,
  accentColor,
  onToggleMute,
  onCommitVolume
}: {
  volumePct: number;
  isMuted: boolean;
  isDisabled?: boolean;
  accentColor: string;
  onToggleMute: () => void;
  onCommitVolume: (pct: number) => void;
}) {
  const [draggingVol, setDraggingVol] = useState<number | null>(null);
  const current = isMuted ? 0 : draggingVol ?? volumePct;

  return (
    <div
      className="flex min-w-0 items-center gap-2"
      data-card-click="ignore"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
        className="size-7 min-w-7 shrink-0"
        onPress={onToggleMute}
      >
        <HugeiconsIcon
          icon={isMuted || current === 0 ? VolumeMute02Icon : VolumeHighIcon}
          size={15}
          className={isMuted ? 'text-danger' : 'text-muted'}
        />
      </Button>

      <Slider
        aria-label="Speaker volume"
        minValue={0}
        maxValue={100}
        step={1}
        value={current}
        isDisabled={isDisabled}
        onChange={(next) => setDraggingVol(Array.isArray(next) ? next[0] : next)}
        onChangeEnd={(next) => {
          const finalVal = Array.isArray(next) ? next[0] : next;
          setDraggingVol(null);
          onCommitVolume(finalVal);
        }}
        className="min-w-0 flex-1"
        style={{ ['--accent' as string]: accentColor }}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>

      <span className="w-8 shrink-0 text-right font-mono text-[11px] font-semibold text-foreground">
        {Math.round(current)}%
      </span>
    </div>
  );
}

export function ProMediaUpNextPanel({
  tracks,
  queueSource,
  sourceList,
  activeSource,
  serverUrl,
  palette,
  isExpanded,
  onToggleExpand,
  onPlayTrack,
  onSelectSource,
  onNextTrack,
  supportsNext,
  compact = false,
  showToggleHeader = true
}: {
  tracks: ProMediaQueueTrack[];
  queueSource: ProMediaQueueSource;
  sourceList: string[];
  activeSource: string | null;
  serverUrl: string;
  palette: AlbumArtPalette;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPlayTrack: (track: ProMediaQueueTrack) => void;
  onSelectSource?: (source: string) => void;
  onNextTrack?: () => void;
  supportsNext: boolean;
  compact?: boolean;
  showToggleHeader?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2"
      data-card-click="ignore"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {showToggleHeader ? (
        <Button
          size="sm"
          variant="tertiary"
          className={cn('w-full justify-between px-2.5', compact ? 'h-8 text-xs' : 'h-9 text-xs')}
          aria-expanded={isExpanded}
          onPress={onToggleExpand}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <HugeiconsIcon icon={Playlist01Icon} size={14} style={{ color: palette.primary }} />
            <span>Up next</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            {tracks.length > 0 ? (
              <Badge
                size="sm"
                variant="soft"
                color="accent"
                className="static transform-none! min-h-4.5 min-w-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold"
              >
                <Badge.Label className="font-mono">{tracks.length}</Badge.Label>
              </Badge>
            ) : null}
            <HugeiconsIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} size={14} />
          </span>
        </Button>
      ) : null}

      {isExpanded ? (
        <div className="flex flex-col gap-1.5 rounded-xl bg-default/55 p-2 backdrop-blur-xs">
          {tracks.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-1 text-[10px] font-medium text-muted">
                <span>{queueSource === 'live' ? 'Playing next queue' : 'Queued next (Demo)'}</span>
                <span>Tap a track to play</span>
              </div>
              <div className={cn('flex flex-col gap-1', compact && 'max-h-40 overflow-y-auto')}>
                {tracks.map((track, idx) => (
                  <Button
                    key={track.id}
                    variant="ghost"
                    className="h-auto w-full justify-between gap-2.5 rounded-lg px-2 py-1.5 text-left"
                    onPress={() => onPlayTrack(track)}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="w-3.5 shrink-0 font-mono text-[10px] text-muted">
                        {idx + 1}
                      </span>
                      <ProMediaCover
                        rawImage={track.albumArt}
                        alt={track.title}
                        serverUrl={serverUrl}
                        sizeClass="size-8 rounded-lg"
                        palette={palette}
                        iconSize={14}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {track.title}
                        </span>
                        <span className="truncate text-[11px] text-muted">{track.artist}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted">
                      <span>{track.durationLabel}</span>
                      <HugeiconsIcon icon={PlayIcon} size={12} style={{ color: palette.primary }} />
                    </span>
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 px-1 py-1 text-xs text-muted">
              <p>Home Assistant does not expose an Up Next queue for this speaker.</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {supportsNext && onNextTrack ? (
                  <Button size="sm" variant="secondary" onPress={onNextTrack}>
                    <HugeiconsIcon icon={NextIcon} size={13} />
                    Skip to next track
                  </Button>
                ) : null}
                {onSelectSource &&
                  sourceList.slice(0, 3).map((src) => (
                    <Button
                      key={src}
                      size="sm"
                      variant={activeSource === src ? 'primary' : 'tertiary'}
                      onPress={() => onSelectSource(src)}
                    >
                      {src}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
