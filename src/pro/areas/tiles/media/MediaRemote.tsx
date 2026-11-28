/**
 * Speaker & TV B · "Remote". Controls first: a big play / pause in the middle of a volume ring you
 * turn like a hi-fi knob (one change on release), previous and next either side. What's playing is
 * a line of text, not a picture. The ring greys out when muted. Built for the things people do
 * with a speaker from across the room: louder, quieter, skip, stop.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon, PlayIcon, VolumeMute02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { arcPath, RING_START, RING_SWEEP, useRingValue } from '../../gestures';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { MediaTileModel, TileProps, TileSize } from '../../tileTypes';
import { MEDIA, mediaLines, mediaState, Transport } from './mediaParts';

function Knob({ e, act, px }: { e: MediaTileModel; act: TileProps<MediaTileModel>['act']; px: number }) {
  const ok = e.available && e.volume !== null;
  const ring = useRingValue({ value: e.volume ?? 0, min: 0, max: 100, onCommit: (pct) => act({ type: 'volume', pct }) });
  const vol = ring.shown;
  const stroke = Math.max(5, Math.round(px * 0.075));
  const r = px / 2 - stroke / 2 - 2;
  const c = px / 2;
  const end = RING_START + (RING_SWEEP * vol) / 100;
  const knob = [c + r * Math.cos((end * Math.PI) / 180), c + r * Math.sin((end * Math.PI) / 180)];
  const hue = e.muted ? 'hsl(230 8% 60%)' : MEDIA;
  const orb = Math.round(px * 0.56);
  const ip = Math.round(orb * 0.4);
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <svg
        width={px}
        height={px}
        className={cn('absolute inset-0', ok && 'cursor-grab active:cursor-grabbing')}
        {...(ok ? ring.props : {})}
        role="slider"
        tabIndex={ok ? 0 : -1}
        aria-label={`${e.name} volume`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(vol)}
        aria-valuetext={e.muted ? `${Math.round(vol)}%, muted` : `${Math.round(vol)}%`}
        aria-disabled={!ok}
        onKeyDown={(ev) => {
          if (!ok) return;
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') act({ type: 'volume', pct: Math.min(100, Math.round(vol) + 5) });
          if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') act({ type: 'volume', pct: Math.max(0, Math.round(vol) - 5) });
        }}
      >
        <path d={arcPath(c, c, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} strokeLinecap="round" />
        {ok && vol > 0 ? <path d={arcPath(c, c, r, RING_START, Math.max(RING_START + 0.5, end))} fill="none" stroke={hue} strokeWidth={stroke} strokeLinecap="round" /> : null}
        {ok ? <circle cx={knob[0]} cy={knob[1]} r={stroke * 0.7} fill="white" stroke="rgba(0,0,0,0.15)" /> : null}
      </svg>
      <Button
        isIconOnly
        variant="ghost"
        data-tile-control=""
        aria-label={`${e.name}: ${e.playing ? 'pause' : 'play'}`}
        isDisabled={!e.available || !e.title}
        onPress={() => act({ type: 'media', cmd: e.playing ? 'pause' : 'play' })}
        className={cn('absolute left-1/2 top-1/2 min-w-0 -translate-x-1/2 -translate-y-1/2 rounded-full p-0', e.playing ? 'text-white' : 'bg-[color-mix(in_srgb,currentColor_8%,transparent)]')}
        style={{ width: orb, height: orb, ...(e.playing ? { background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${MEDIA} 60%, white), ${MEDIA})`, boxShadow: `0 6px 18px -6px ${MEDIA}` } : {}) }}
      >
        <HugeiconsIcon icon={e.playing ? PauseIcon : PlayIcon} size={ip} style={{ width: ip, height: ip }} />
      </Button>
      {e.muted ? (
        <span aria-hidden className="absolute bottom-0 left-1/2 grid -translate-x-1/2 place-items-center rounded-full bg-[var(--surface)] p-0.5 text-muted">
          <HugeiconsIcon icon={VolumeMute02Icon} size={Math.max(12, Math.round(px * 0.12))} />
        </span>
      ) : null}
    </div>
  );
}

const KNOB: Record<TileSize, number> = { xs: 50, s: 92, w: 116, t: 128, l: 156 };

export default function MediaRemote({ e, size, act }: TileProps<MediaTileModel>) {
  const [title, sub] = mediaLines(e);
  const frame = cn('pro-surface', !e.available && 'opacity-60');
  const knob = <Knob e={e} act={act} px={KNOB[size]} />;
  const vol = e.available && e.volume !== null ? (e.muted ? 'Muted' : `Volume ${e.volume}%`) : '';
  const skip = (px: number) => (
    <>
      <Transport e={e} act={act} cmd="previous" size={px} variant="secondary" />
      <Transport e={e} act={act} cmd="next" size={px} variant="secondary" />
    </>
  );

  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={frame}>
        <div className="flex h-full items-center gap-2.5 px-2.5">
          {knob}
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{e.title ? title : e.name}</TileName>
            <TileState className="text-[12px]">{e.title ? vol || sub : mediaState(e)}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={e.name} className={frame}>
        <div className="flex h-full flex-col items-center px-3 pb-2.5 pt-3">
          <TileName className="line-clamp-1 w-full truncate text-center text-[13px]">{title}</TileName>
          <div className="mt-auto">{knob}</div>
          <TileState className="mt-0.5 text-center text-[11px]">{e.title ? vol : mediaState(e)}</TileState>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={e.name} className={frame}>
        <div className="flex h-full items-center gap-4 p-3 pl-3.5">
          {knob}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <TileName className="line-clamp-1">{title}</TileName>
              <TileState>{sub}</TileState>
              <TileState className="mt-0.5 text-[12px]">{e.title ? vol : mediaState(e)}</TileState>
            </div>
            <div className="flex items-center gap-1.5">
              {skip(32)}
              <Transport e={e} act={act} cmd="mute" size={32} variant="secondary" />
            </div>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={e.name} className={frame}>
        <div className="flex h-full flex-col items-center p-4">
          <TileName className="line-clamp-1 w-full text-[14px]">{e.name}</TileName>
          <div className="my-auto">{knob}</div>
          <div className="w-full min-w-0 text-center">
            <p className="truncate text-[15px] font-semibold">{title}</p>
            <TileState className="text-[12px]">{e.title ? vol : sub}</TileState>
          </div>
          <div className="mt-3 flex items-center gap-1.5">{skip(34)}</div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={frame}>
      <div className="flex h-full items-center gap-5 p-5">
        {knob}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TileState className="text-[12px]">{e.name}</TileState>
          <p className="line-clamp-2 text-[19px] font-semibold leading-tight">{title}</p>
          <TileState>{sub}</TileState>
          <p className="mt-2 text-[13px] font-medium tabular-nums" style={{ color: e.muted ? undefined : MEDIA }}>
            {e.title ? vol : mediaState(e)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {skip(36)}
            <Transport e={e} act={act} cmd="mute" size={36} variant="secondary" />
          </div>
        </div>
      </div>
    </TileFrame>
  );
}
