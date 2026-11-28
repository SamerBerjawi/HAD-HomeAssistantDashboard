/**
 * Speaker & TV C · "Level". The tile is the volume: a violet wash fills it from the left as loud
 * as it is. Slide sideways anywhere to change it (one change on release), tap to play or pause.
 * Little level bars dance while it plays. Large adds the inputs or services as chips, so a TV can
 * switch to the PS5 or a speaker to the radio from the tile.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { VolumeMute02Icon } from '@hugeicons/core-free-icons';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useSlideValue } from '../../gestures';
import { TileChip, TileFrame, TileName, TileState } from '../../tileKit';
import type { MediaTileModel, TileProps } from '../../tileTypes';
import { MEDIA, mediaIcon, mediaLines, mediaState } from './mediaParts';

const BARS = [0.55, 0.9, 0.4, 1, 0.65];

function Bars({ on, height = 18 }: { on: boolean; height?: number }) {
  return (
    <span aria-hidden className="inline-flex items-end gap-[3px]" style={{ height }}>
      {BARS.map((b, i) => (
        <span key={i} className={cn('w-[3px] rounded-full bg-current', on && 'had-eq')} style={{ height: `${b * 100}%`, opacity: on ? 0.9 : 0.3, ['--d' as string]: `${0.75 + (i % 3) * 0.2}s`, ['--delay' as string]: `${i * -0.17}s` } as CSSProperties} />
      ))}
    </span>
  );
}

export default function MediaLevel({ e, size, act }: TileProps<MediaTileModel>) {
  const [title, sub] = mediaLines(e);
  const can = e.available && e.volume !== null;
  const slide = useSlideValue({
    value: e.volume ?? 0,
    min: 0,
    max: 100,
    enabled: can,
    onCommit: (pct) => act({ type: 'volume', pct }),
    onTap: () => (e.title ? act({ type: 'media', cmd: e.playing ? 'pause' : 'play' }) : undefined),
    label: `${e.name} volume. Tap to ${e.playing ? 'pause' : 'play'}`,
    valueText: `${Math.round(e.volume ?? 0)}%${e.muted ? ', muted' : ''}`
  });
  const vol = Math.round(slide.shown);
  const fill = can ? vol : 0;
  const tint = e.muted ? 'hsl(230 8% 60%)' : MEDIA;
  const Vol = ({ className }: { className?: string }) =>
    can ? (
      <p className={cn('flex items-baseline font-semibold leading-none tracking-[-0.03em] tabular-nums', className)}>
        {e.muted && slide.live === null ? <HugeiconsIcon icon={VolumeMute02Icon} className="mr-1 size-[0.7em] self-center opacity-60" /> : null}
        {vol}
        <span className="text-[0.5em] font-medium opacity-60">%</span>
      </p>
    ) : null;
  const playing = e.available && e.playing;
  const icon = <HugeiconsIcon icon={mediaIcon(e)} size={20} className="opacity-60" />;
  const what = e.title ? (e.playing ? (e.muted ? 'Muted' : 'Playing') : 'Paused') : mediaState(e);
  const chips =
    size === 'l' && e.available && e.sources.length ? (
      <div className="flex flex-wrap gap-1.5">
        {e.sources.slice(0, 5).map((src) => (
          <TileChip key={src} label={`${e.name}: play from ${src}`} active={e.source === src} onPress={() => act({ type: 'source', source: src })} className={e.source === src ? 'text-white' : 'bg-[color-mix(in_srgb,currentColor_8%,transparent)]'} style={e.source === src ? { background: MEDIA } : undefined}>
            {src}
          </TileChip>
        ))}
      </div>
    ) : null;

  let body;
  if (size === 'xs') {
    body = (
      <div className="flex h-full items-center gap-2.5 px-3.5">
        <div className="min-w-0 flex-1">
          <TileName className="line-clamp-1 truncate text-[14px]">{title}</TileName>
          <TileState className="flex items-center gap-1.5 text-[12px]">
            <Bars on={playing} height={10} />
            <span className="truncate">{e.title ? sub : what}</span>
          </TileState>
        </div>
        <Vol className="text-[19px]" />
      </div>
    );
  } else if (size === 's' || size === 't') {
    body = (
      <div className="flex h-full flex-col p-3.5">
        <div className="flex items-center justify-between">
          {icon}
          <Bars on={playing} />
        </div>
        {size === 't' ? <Vol className="my-auto text-[52px]" /> : null}
        <div className={cn('min-w-0', size === 's' && 'mt-auto')}>
          <TileName className={size === 's' ? 'line-clamp-1' : ''}>{title}</TileName>
          <TileState>{e.title ? sub : what}</TileState>
          {size === 's' ? <Vol className="mt-2 text-[24px]" /> : <TileState className="mt-1 text-[12px]">{e.title ? what : ''}</TileState>}
        </div>
      </div>
    );
  } else if (size === 'w') {
    body = (
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center gap-2">
          {icon}
          <TileState className="flex-1 text-[12px]">{e.name}</TileState>
          <Bars on={playing} />
        </div>
        <div className="mt-auto flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 text-[16px]">{title}</TileName>
            <TileState>{e.title ? `${sub} · ${what}` : what}</TileState>
          </div>
          <Vol className="text-[34px]" />
        </div>
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2">
          {icon}
          <TileState className="flex-1">{e.name}</TileState>
          <Bars on={playing} height={22} />
        </div>
        <div className="mt-auto flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <TileName className="text-[20px]">{title}</TileName>
            <TileState>{e.title ? `${sub} · ${what}` : what}</TileState>
          </div>
          <Vol className="text-[56px]" />
        </div>
        {chips ? <div className="mt-4">{chips}</div> : null}
      </div>
    );
  }

  return (
    <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
      <div {...slide.props} className={cn('relative h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-inset', can && 'cursor-ew-resize')} style={slide.props.style}>
        <div
          aria-hidden
          className={cn('absolute inset-y-0 left-0', slide.live === null && 'transition-[width] duration-300')}
          style={{ width: `${fill}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${tint} 10%, transparent), color-mix(in srgb, ${tint} ${playing ? 30 : 18}%, transparent))`, borderRight: fill > 0 && fill < 100 ? `2px solid color-mix(in srgb, ${tint} 60%, transparent)` : undefined }}
        />
        <div className="relative h-full">{body}</div>
      </div>
    </TileFrame>
  );
}
