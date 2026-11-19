/**
 * Custom song-adaptive waveform scrubber built on HeroUI Slider primitives + album-art palette tinting
 * (docs/pro-ui/DESIGN.md 7.6). Generates a unique multi-harmonic waveform profile per song title,
 * artist, and track duration, and supports pointer drag, tap-to-seek, and keyboard stepping.
 */
import { useMemo, useRef, useState } from 'react';
import { Slider } from '@heroui/react';
import type { AlbumArtPalette } from '@/hooks/useAlbumArtColor';
import { formatMediaTime } from '@/hooks/useMediaPosition';
import { cn } from '@/lib/utils';
import { generateSongWaveform } from '../../lib/overviewMedia';

interface ProWaveformScrubberProps {
  title: string;
  artist: string;
  duration: number;
  currentPosition: number;
  isPlaying: boolean;
  isDisabled?: boolean;
  onSeek: (seconds: number) => void;
  onScrubbingChange?: (isScrubbing: boolean, previewSeconds: number | null) => void;
  palette: AlbumArtPalette;
  darkMode: boolean;
  barCount?: number;
  layout?: 'inline' | 'stacked';
  compact?: boolean;
}

export function ProWaveformScrubber({
  title,
  artist,
  duration,
  currentPosition,
  isPlaying,
  isDisabled = false,
  onSeek,
  onScrubbingChange,
  palette,
  darkMode,
  barCount = 40,
  layout = 'stacked',
  compact = false
}: ProWaveformScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingSecs, setDraggingSecs] = useState<number | null>(null);
  const [hoverSecs, setHoverSecs] = useState<number | null>(null);

  const effectiveDuration = duration > 0 ? duration : 220;
  const bars = useMemo(
    () => generateSongWaveform(title, artist, effectiveDuration, barCount),
    [title, artist, effectiveDuration, barCount]
  );

  const activeSecs = Math.max(
    0,
    Math.min(effectiveDuration, draggingSecs !== null ? draggingSecs : currentPosition)
  );
  const progressRatio = effectiveDuration > 0 ? activeSecs / effectiveDuration : 0;
  const activeBarIndex = Math.min(bars.length - 1, Math.floor(progressRatio * bars.length));
  const timeAccentColor = darkMode ? palette.light : palette.badgeText || palette.primary;

  const previewSecs = draggingSecs ?? hoverSecs;
  const previewRatio =
    previewSecs !== null && effectiveDuration > 0
      ? Math.max(0.06, Math.min(0.94, previewSecs / effectiveDuration))
      : null;

  const computeHoverSeconds = (clientX: number): number | null => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * effectiveDuration);
  };

  const handleScrubChange = (val: number | number[]) => {
    const raw = Array.isArray(val) ? val[0] : val;
    const rounded = Math.round(raw);
    setDraggingSecs(rounded);
    onScrubbingChange?.(true, rounded);
  };

  const handleScrubEnd = (val: number | number[]) => {
    const raw = Array.isArray(val) ? val[0] : val;
    const rounded = Math.round(raw);
    setDraggingSecs(null);
    onScrubbingChange?.(false, null);
    onSeek(rounded);
  };

  const sliderTrack = (
    <div
      ref={trackRef}
      className="relative min-w-0 flex-1 select-none"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => {
        if (isDisabled) return;
        setHoverSecs(computeHoverSeconds(e.clientX));
      }}
      onPointerLeave={() => setHoverSecs(null)}
    >
      {previewSecs !== null && previewRatio !== null ? (
        <div
          className="pointer-events-none absolute -top-6 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-semibold text-background shadow-sm"
          style={{ left: `${previewRatio * 100}%` }}
        >
          {formatMediaTime(previewSecs)}
        </div>
      ) : null}

      <Slider
        aria-label={`Seek ${title}`}
        minValue={0}
        maxValue={effectiveDuration}
        step={1}
        value={activeSecs}
        isDisabled={isDisabled}
        onChange={handleScrubChange}
        onChangeEnd={handleScrubEnd}
        className="w-full gap-0"
      >
        <Slider.Track
          className={cn(
            'pro-waveform-track relative flex w-full cursor-pointer items-center justify-between gap-[1.5px] overflow-visible rounded-lg bg-transparent px-0.5',
            compact ? 'h-7' : 'h-9'
          )}
        >
          {bars.map((heightPct, idx) => {
            const isPlayed = idx <= activeBarIndex;
            const isPlayheadBar = isPlaying && idx === activeBarIndex;
            const isNearPlayhead = isPlaying && Math.abs(idx - activeBarIndex) === 1;

            return (
              <span
                key={idx}
                aria-hidden="true"
                className={cn(
                  'pointer-events-none relative flex h-full min-w-[1.5px] flex-1 items-center justify-center'
                )}
              >
                <span
                  className={cn(
                    'w-full rounded-full transition-[transform,opacity,background-color] duration-150',
                    isPlayed
                      ? 'opacity-100'
                      : darkMode
                        ? 'bg-white/20 opacity-85'
                        : 'bg-foreground/15 opacity-85',
                    isPlayheadBar && 'scale-y-115 animate-pulse',
                    isNearPlayhead && 'scale-y-105'
                  )}
                  style={{
                    height: `${heightPct}%`,
                    minHeight: '3px',
                    background: isPlayed ? palette.waveformPlayedGradient : undefined,
                    boxShadow: isPlayed ? `0 0 6px ${palette.glowSubtle}` : undefined
                  }}
                />
              </span>
            );
          })}

          <Slider.Thumb
            className={cn(
              'pro-waveform-thumb top-1/2 z-10 h-full w-[3px] rounded-full border-0 shadow-none ring-0 transition-[left] duration-75',
              compact ? 'h-6' : 'h-8'
            )}
            style={{
              backgroundColor: darkMode ? palette.light : palette.primary,
              boxShadow: `0 0 8px ${palette.glow}`
            }}
          />
        </Slider.Track>
      </Slider>
    </div>
  );

  if (layout === 'inline') {
    return (
      <div
        className={cn('flex w-full items-center select-none', compact ? 'gap-1.5' : 'gap-2')}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            'shrink-0 font-mono text-[10px] font-semibold',
            compact ? 'min-w-6.5' : 'min-w-8'
          )}
          style={{ color: timeAccentColor }}
        >
          {formatMediaTime(activeSecs)}
        </span>
        {sliderTrack}
        <span
          className={cn(
            'shrink-0 text-right font-mono text-[10px] font-medium text-muted',
            compact ? 'min-w-6.5' : 'min-w-8'
          )}
        >
          {duration > 0 ? formatMediaTime(duration) : formatMediaTime(effectiveDuration)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col gap-1 select-none"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {sliderTrack}
      <div className="flex items-center justify-between px-0.5 font-mono text-[11px]">
        <span className="font-semibold" style={{ color: timeAccentColor }}>
          {formatMediaTime(activeSecs)}
        </span>
        <span className="font-medium text-muted">
          {duration > 0 ? `-${formatMediaTime(Math.max(0, duration - activeSecs))}` : 'Live'}
        </span>
      </div>
    </div>
  );
}
