/**
 * Ambient (D) previews for batches 3–4, refined to the owner's reference (2026-11-21):
 * - Speaker: artwork with a violet glow; Large is the full player (speaker, title, artist, cast,
 *   a progress bar with times, shuffle / previous / play / next / repeat); Wide the compact one;
 *   X-small a row with a play button.
 * - Camera: a header with the name and a "Live" pill, the view below with a full-screen button;
 *   Small is the picture with the name over it; X-small a row with a thumbnail.
 */
import type { CSSProperties } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CastIcon, FullScreenIcon, MusicNote03Icon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, RepeatIcon, ShuffleIcon, Video01Icon, VideoOffIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { CameraTileModel, MediaTileModel, TileProps } from '../../tileTypes';
import { AName, AState, Glass, GlassButton, glowStyle, HUE, OrbButton } from './ambientKit';
import { clock, usePosition } from '../media/mediaParts';

const BARS = [0.5, 0.8, 0.45, 1, 0.7, 0.9, 0.4, 0.75, 0.55, 0.95, 0.6, 0.35];

function Levels({ playing, count = 12, height = 28 }: { playing: boolean; count?: number; height?: number }) {
  return (
    <div aria-hidden className="flex items-end gap-[3px]" style={{ height }}>
      {BARS.slice(0, count).map((b, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full', playing && 'had-eq')}
          style={{ height: `${b * 100}%`, background: `linear-gradient(0deg, ${HUE.media}, color-mix(in srgb, ${HUE.media} 40%, hsl(320 80% 75%)))`, opacity: playing ? 1 : 0.35, ['--d' as string]: `${0.7 + (i % 4) * 0.18}s`, ['--delay' as string]: `${(i % 5) * -0.13}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function Art({ e, px, radius = 18 }: { e: MediaTileModel; px: number | string; radius?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden bg-black/[0.06] ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/15"
      style={{ width: px, ...(typeof px === 'number' ? { height: px } : { aspectRatio: '1 / 1' }), borderRadius: radius, background: e.art ?? undefined, boxShadow: e.art ? `0 10px 30px -10px color-mix(in srgb, ${HUE.media} 70%, transparent)` : undefined }}
    >
      {e.art ? null : <HugeiconsIcon icon={MusicNote03Icon} size={22} className="opacity-40" />}
    </div>
  );
}

function Progress({ e, times }: { e: MediaTileModel; times?: boolean }) {
  const pos = usePosition(e);
  if (!e.duration) return null;
  const pct = (pos / e.duration) * 100;
  return (
    <div>
      <div className="relative h-1 rounded-full bg-black/10 dark:bg-white/15" role="meter" aria-label={`${e.name} progress`} aria-valuenow={Math.round(pos)} aria-valuemin={0} aria-valuemax={e.duration}>
        <div className="h-full rounded-full bg-current opacity-80" style={{ width: `${pct}%` }} />
        <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${pct}%` }} />
      </div>
      {times ? (
        <div className="mt-1.5 flex justify-between text-[12px] opacity-60 tabular-nums">
          <span>{clock(pos)}</span>
          <span>{clock(e.duration)}</span>
        </div>
      ) : null}
    </div>
  );
}

export function AmbientMedia({ e, size, act }: TileProps<MediaTileModel>) {
  const title = e.title ?? 'Nothing playing';
  const play = (px: number) => <OrbButton icon={e.playing ? PauseIcon : PlayIcon} label={`${e.name}: ${e.playing ? 'pause' : 'play'}`} on={e.playing} color={HUE.media} size={px} isDisabled={!e.title} onPress={() => act({ type: 'media', cmd: e.playing ? 'pause' : 'play' })} />;
  const next = (px = 38) => <GlassButton icon={NextIcon} label={`${e.name}: next`} onPress={() => act({ type: 'media', cmd: 'next' })} isDisabled={!e.title} size={px} />;
  const prev = (px = 38) => <GlassButton icon={PreviousIcon} label={`${e.name}: previous`} onPress={() => act({ type: 'media', cmd: 'previous' })} isDisabled={!e.title} size={px} />;
  const style = e.playing ? glowStyle(HUE.media, 0.75, '15% 20%') : undefined;
  if (size === 'xs') {
    return (
      <Glass label={e.name} style={style}>
        <div className="flex h-full items-center gap-2.5 px-3">
          {/* The artwork is the play button here. */}
          <Button
            isIconOnly
            variant="ghost"
            aria-label={`${e.name}: ${e.playing ? 'pause' : 'play'}`}
            isDisabled={!e.title}
            onPress={() => act({ type: 'media', cmd: e.playing ? 'pause' : 'play' })}
            className="relative size-11 min-w-0 shrink-0 overflow-hidden rounded-[12px] p-0"
          >
            <Art e={e} px={44} radius={12} />
            <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
              <HugeiconsIcon icon={e.playing ? PauseIcon : PlayIcon} size={18} />
            </span>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">{title}</p>
            <p className="mt-0.5 truncate text-[11px] opacity-60">{e.name}</p>
          </div>
        </div>
      </Glass>
    );
  }
  if (size === 's') {
    return (
      <Glass label={e.name} style={style}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <Art e={e} px={58} radius={14} />
            {play(44)}
          </div>
          <div className="mt-auto min-w-0">
            <AName className="text-[15px]">{title}</AName>
            <AState className="mt-0.5 text-[12px]">{e.name}</AState>
          </div>
        </div>
      </Glass>
    );
  }
  if (size === 'w') {
    return (
      <Glass label={e.name} style={style}>
        <div className="flex h-full items-center gap-4 p-3.5 pl-4">
          <Art e={e} px={108} />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="min-w-0">
              <AName className="truncate text-[15px]">{e.name}</AName>
              <AState className="mt-0.5">{title}</AState>
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <Levels playing={e.playing} count={8} height={24} />
              </div>
              {play(40)}
              {next()}
            </div>
          </div>
        </div>
      </Glass>
    );
  }
  if (size === 't') {
    return (
      <Glass label={e.name} style={style}>
        <div className="flex h-full flex-col gap-3 p-4">
          <Art e={e} px="100%" />
          <div className="min-w-0">
            <AName className="truncate text-[15px]">{title}</AName>
            <AState className="mt-0.5 text-[12px]">{e.artist ?? e.name}</AState>
          </div>
          <Progress e={e} />
          <div className="mt-auto flex items-center justify-between">
            {prev(34)}
            {play(46)}
            {next(34)}
          </div>
        </div>
      </Glass>
    );
  }
  return (
    <Glass label={e.name} style={style}>
      <div className="flex h-full flex-col p-5">
        <div className="flex gap-4">
          <Art e={e} px={116} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <AName className="text-[17px]">{e.name}</AName>
              <HugeiconsIcon icon={CastIcon} size={20} className="shrink-0 opacity-60" />
            </div>
            <p className="mt-2 truncate text-[15px] opacity-80">{title}</p>
            <p className="mt-1 truncate text-[14px] opacity-55">{e.artist ?? ''}</p>
          </div>
        </div>
        <div className="mt-auto">
          <Progress e={e} times />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <GlassButton icon={ShuffleIcon} label={`${e.name}: shuffle`} active={e.shuffle} onPress={() => act({ type: 'media', cmd: 'shuffle' })} size={34} />
          {prev(40)}
          {play(54)}
          {next(40)}
          <GlassButton icon={RepeatIcon} label={`${e.name}: repeat`} active={e.repeat} onPress={() => act({ type: 'media', cmd: 'repeat' })} size={34} />
        </div>
      </div>
    </Glass>
  );
}

const ago = (t: number | null) => (t ? `${Math.max(1, Math.round((Date.now() - t) / 60_000))}m ago` : '');

function LivePill({ e, className }: { e: CameraTileModel; className?: string }) {
  if (!e.available) return <span className={cn('rounded-full bg-black/10 px-2.5 py-1 text-[12px] font-semibold opacity-70 dark:bg-white/10', className)}>Offline</span>;
  return (
    <span className={cn('flex shrink-0 items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md', className)}>
      <span className={cn('size-2 rounded-full', e.live ? 'bg-[hsl(0_85%_58%)] motion-safe:animate-pulse' : 'bg-white/60')} />
      {e.live ? 'Live' : ago(e.lastMotion)}
    </span>
  );
}

function View({ e, className, expand }: { e: CameraTileModel; className?: string; expand?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[16px] bg-black/20', className)} style={{ background: e.picture ?? undefined }}>
      {!e.available ? (
        <div className="grid h-full place-items-center bg-black/[0.06] dark:bg-white/[0.06]">
          <span className="flex items-center gap-1.5 text-xs font-medium opacity-60">
            <HugeiconsIcon icon={VideoOffIcon} size={16} />
            Offline
          </span>
        </div>
      ) : null}
      {expand && e.available ? (
        <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-lg bg-black/45 text-white backdrop-blur-md" aria-hidden>
          <HugeiconsIcon icon={FullScreenIcon} size={16} />
        </span>
      ) : null}
    </div>
  );
}

export function AmbientCamera({ e, size }: TileProps<CameraTileModel>) {
  if (size === 'xs') {
    return (
      <Glass label={e.name}>
        <div className="flex h-full items-center gap-2 pl-3.5 pr-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">{e.name}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] opacity-70">
              <span className={cn('size-1.5 rounded-full', e.live ? 'bg-[hsl(0_85%_58%)]' : 'bg-current opacity-50')} />
              {e.available ? (e.live ? 'Live' : ago(e.lastMotion)) : 'Offline'}
            </p>
          </div>
          <View e={e} className="h-[48px] w-[54px] shrink-0 rounded-[12px]" />
        </div>
      </Glass>
    );
  }
  if (size === 's') {
    return (
      <Glass label={e.name}>
        <View e={e} className="absolute inset-1.5 rounded-[22px]" />
        <LivePill e={e} className="absolute right-3 top-3" />
        <p className="pointer-events-none absolute inset-x-1.5 bottom-1.5 rounded-b-[22px] bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-7 text-[14px] font-semibold text-white">{e.name}</p>
      </Glass>
    );
  }
  return (
    <Glass label={e.name}>
      <div className={cn('flex h-full flex-col gap-2.5', size === 'l' ? 'p-3.5' : 'p-3')}>
        <div className="flex items-center gap-2.5 px-1 pt-0.5">
          <HugeiconsIcon icon={Video01Icon} size={22} className="shrink-0 opacity-85" />
          <AName className="truncate text-[15px]">{e.name}</AName>
          <LivePill e={e} className="ml-auto" />
        </div>
        <View e={e} className="min-h-0 flex-1" expand={size !== 'w'} />
      </div>
    </Glass>
  );
}
