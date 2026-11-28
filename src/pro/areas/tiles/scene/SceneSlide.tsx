/**
 * Scene C · "Slide to run". Some scenes do a lot (Good Night turns off fourteen things), so this
 * one is never run by a stray tap: slide the round knob, wearing the scene's icon, all the way
 * along its track. A tap just nudges the knob to show how it works. The track fills with the
 * scene's colour as you go, and says "Done" when it ran. Keyboard: Enter runs it.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { SceneTileModel, TileProps, TileSize } from '../../tileTypes';
import { membersText, sceneHue, sceneIcon, sceneState, useRun } from './sceneParts';

const KNOB: Record<TileSize, number> = { xs: 52, s: 44, w: 48, t: 48, l: 56 };

function Track({ s, act, size, inside }: { s: SceneTileModel; act: TileProps<SceneTileModel>['act']; size: TileSize; inside?: string }) {
  const { run, done } = useRun(s, act);
  const track = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [x, setX] = useState(0); // 0–1 of the way along
  const [nudge, setNudge] = useState(false);
  const hue = sceneHue(s);
  const knob = KNOB[size];
  const ok = s.available;
  const reset = () => {
    start.current = null;
    setX(0);
  };
  const frac = (ev: PointerEvent<HTMLElement>) => {
    const r = track.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (ev.clientX - start.current!.x) / Math.max(1, r.width - knob - 8)));
  };
  const shown = done ? 1 : x;
  return (
    <div
      ref={track}
      data-tile-control=""
      role="slider"
      tabIndex={ok ? 0 : -1}
      aria-label={`${s.name}: slide to run the scene`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      aria-valuetext={done ? 'Done' : 'Slide to run. Enter runs it'}
      aria-disabled={!ok}
      className={cn('relative w-full shrink-0 select-none overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_7%,transparent)] outline-none focus-visible:ring-2', ok && 'cursor-grab active:cursor-grabbing')}
      style={{ height: knob + 8, touchAction: 'pan-y' }}
      onPointerDown={(ev) => {
        if (!ok || ev.button !== 0) return;
        start.current = { x: ev.clientX, y: ev.clientY, moved: false };
        ev.currentTarget.setPointerCapture(ev.pointerId);
      }}
      onPointerMove={(ev) => {
        const st = start.current;
        if (!st) return;
        if (!st.moved) {
          if (Math.abs(ev.clientY - st.y) > 10 && Math.abs(ev.clientX - st.x) < 8) return reset();
          if (Math.abs(ev.clientX - st.x) < 5) return;
          st.moved = true;
        }
        setX(frac(ev));
      }}
      onPointerUp={() => {
        const st = start.current;
        if (!st) return;
        if (!st.moved) {
          setNudge(true);
          window.setTimeout(() => setNudge(false), 450);
        } else if (x > 0.85) run();
        reset();
      }}
      onPointerCancel={reset}
      onKeyDown={(ev: KeyboardEvent<HTMLElement>) => {
        if (ok && (ev.key === 'Enter' || ev.key === ' ')) {
          ev.preventDefault();
          run();
        }
      }}
    >
      {/* the fill behind the knob */}
      <div aria-hidden className={cn('absolute inset-y-0 left-0 rounded-full', start.current === null && 'transition-[width] duration-300')} style={{ width: `calc(${knob + 8}px + (100% - ${knob + 8}px) * ${shown})`, background: `color-mix(in srgb, ${hue} ${done || s.isOn ? 40 : 22}%, transparent)` }} />
      <span aria-hidden className={cn('absolute inset-0 flex items-center gap-1.5 text-[13px] font-semibold opacity-60 transition-opacity', inside ?? 'justify-center', x > 0.15 && 'opacity-0')} style={{ paddingLeft: knob + 14 }}>
        {inside ? null : (
          <>
            {done ? 'Done' : size === 's' || size === 't' ? 'Slide' : 'Slide to run'}
            {done ? null : <HugeiconsIcon icon={ArrowRight02Icon} size={14} />}
          </>
        )}
      </span>
      <span
        aria-hidden
        className={cn('absolute left-1 top-1 grid place-items-center rounded-full text-white shadow-md', start.current === null && 'transition-transform duration-300', nudge && 'translate-x-3')}
        style={{ width: knob, height: knob, background: ok ? hue : 'hsl(230 8% 60%)', ...(x > 0 || done ? { transform: `translateX(calc((${track.current?.clientWidth ?? 0}px - ${knob + 8}px) * ${shown}))` } : {}) }}
      >
        <HugeiconsIcon icon={done ? Tick02Icon : sceneIcon(s)} size={Math.round(knob * 0.44)} style={{ width: Math.round(knob * 0.44), height: Math.round(knob * 0.44) }} />
      </span>
    </div>
  );
}

export default function SceneSlide({ e: s, size, act }: TileProps<SceneTileModel>) {
  const state = sceneState(s);
  const frame = cn('pro-surface', !s.available && 'opacity-60');
  const hue = sceneHue(s);
  const active = s.available && s.isOn;
  const dot = active ? <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: hue, boxShadow: `0 0 8px ${hue}` }} /> : null;

  if (size === 'xs') {
    // The tile is the track: the name rides in it.
    return (
      <TileFrame label={s.name} className={frame}>
        <div className="relative flex h-full items-center p-1.5">
          <Track s={s} act={act} size={size} inside="justify-start" />
          <div className="pointer-events-none absolute inset-y-0 left-[66px] right-3 flex flex-col justify-center">
            <TileName className="line-clamp-1 truncate text-[14px]">{s.name}</TileName>
            <TileState className="flex items-center gap-1.5 text-[12px]">
              {dot}
              <span className="truncate">{active ? 'Active · slide to run' : 'Slide to run'}</span>
            </TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  const big = size === 'l';
  return (
    <TileFrame label={s.name} className={frame} style={active ? { background: `linear-gradient(160deg, color-mix(in srgb, ${hue} 14%, var(--surface)), var(--surface) 70%)` } : undefined}>
      <div className={cn('flex h-full flex-col', big ? 'p-5' : 'p-3')}>
        <div className={cn('min-w-0', !big && 'px-1 pt-0.5')}>
          <TileName className={cn(big ? 'text-[24px]' : size === 't' ? 'text-[18px]' : 'line-clamp-2')}>{s.name}</TileName>
          <TileState className="mt-0.5 flex items-center gap-1.5">
            {dot}
            <span className="truncate">{state}</span>
          </TileState>
          {size === 'w' || size === 't' || big ? <TileState className="mt-0.5 text-[12px] opacity-50">{membersText(s)}</TileState> : null}
        </div>
        {size === 't' || big ? (
          <div className="my-auto flex justify-center py-2">
            <span className="grid size-20 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${hue} 14%, transparent)`, color: hue }}>
              <HugeiconsIcon icon={sceneIcon(s)} size={36} />
            </span>
          </div>
        ) : null}
        <div className={cn(size === 't' || big ? '' : 'mt-auto')}>
          <Track s={s} act={act} size={size} />
        </div>
      </div>
    </TileFrame>
  );
}
