/** Shared bits for the speaker & TV tiles: colour, icon, words, the live position and transport buttons. */
import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon, Speaker01Icon, Tv01Icon, VolumeHighIcon, VolumeMute02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { MediaTileModel, TileAction } from '../../tileTypes';

export const MEDIA = 'hsl(268 75% 62%)';

export const mediaIcon = (e: MediaTileModel): IconSvgElement => (e.deviceClass === 'tv' ? Tv01Icon : Speaker01Icon);

export const clock = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

/** Position that keeps moving while playing (HA sends `media_position` + its update time). */
export function usePosition(e: MediaTileModel) {
  const [pos, setPos] = useState(e.position ?? 0);
  useEffect(() => setPos(e.position ?? 0), [e.position, e.title]);
  useEffect(() => {
    if (!e.playing || !e.duration) return;
    const id = window.setInterval(() => setPos((p) => Math.min(e.duration ?? p, p + 1)), 1000);
    return () => window.clearInterval(id);
  }, [e.playing, e.duration]);
  return pos;
}

/** Headline and second line: the track and artist, or the TV's show and app. */
export function mediaLines(e: MediaTileModel): [string, string] {
  if (!e.available) return [e.name, 'Unavailable'];
  if (!e.title) return [e.deviceClass === 'tv' ? 'TV is off' : 'Nothing playing', e.name];
  return [e.title, [e.artist, e.deviceClass === 'tv' ? e.source : null].filter(Boolean).join(' · ') || e.name];
}

/** "Playing · Spotify", "Paused", "Muted", "Off". */
export function mediaState(e: MediaTileModel): string {
  if (!e.available) return 'Unavailable';
  if (!e.title) return e.isOn ? 'Idle' : 'Off';
  const what = e.playing ? 'Playing' : 'Paused';
  return [e.muted ? 'Muted' : what, e.source].filter(Boolean).join(' · ');
}

export function Transport({
  e,
  act,
  cmd,
  size = 36,
  className,
  variant = 'ghost'
}: {
  e: MediaTileModel;
  act: (a: TileAction) => void;
  cmd: 'play' | 'previous' | 'next' | 'mute';
  size?: number;
  className?: string;
  variant?: 'ghost' | 'secondary';
}) {
  const icon = cmd === 'play' ? (e.playing ? PauseIcon : PlayIcon) : cmd === 'next' ? NextIcon : cmd === 'previous' ? PreviousIcon : e.muted ? VolumeMute02Icon : VolumeHighIcon;
  const label = cmd === 'play' ? (e.playing ? 'pause' : 'play') : cmd === 'mute' ? (e.muted ? 'unmute' : 'mute') : cmd;
  const px = Math.round(size * 0.48);
  return (
    <Button
      isIconOnly
      variant={variant}
      data-tile-control=""
      aria-label={`${e.name}: ${label}`}
      aria-pressed={cmd === 'mute' ? e.muted : undefined}
      isDisabled={!e.available || (!e.title && cmd !== 'mute')}
      onPress={() => act(cmd === 'mute' ? { type: 'mute', on: !e.muted } : cmd === 'play' ? { type: 'media', cmd: e.playing ? 'pause' : 'play' } : { type: 'media', cmd })}
      className={cn('min-w-0 shrink-0 rounded-full p-0', className)}
      style={{ width: size, height: size }}
    >
      <HugeiconsIcon icon={icon} size={px} style={{ width: px, height: px }} />
    </Button>
  );
}

/** A thin progress line (read-only), optionally with times. */
export function MediaProgress({ e, times, className, track = 'bg-current/15' }: { e: MediaTileModel; times?: boolean; className?: string; track?: string }) {
  const pos = usePosition(e);
  if (!e.duration || !e.available) return null;
  const pct = Math.min(100, (pos / e.duration) * 100);
  return (
    <div className={className}>
      <div className={cn('h-1 overflow-hidden rounded-full', track)} role="meter" aria-label={`${e.name} progress`} aria-valuenow={Math.round(pos)} aria-valuemin={0} aria-valuemax={e.duration}>
        <div className="h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
      </div>
      {times ? (
        <div className="mt-1 flex justify-between text-[11px] tabular-nums opacity-60">
          <span>{clock(pos)}</span>
          <span>-{clock(Math.max(0, e.duration - pos))}</span>
        </div>
      ) : null}
    </div>
  );
}
