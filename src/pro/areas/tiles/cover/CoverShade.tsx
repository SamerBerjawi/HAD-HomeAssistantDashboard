/**
 * Cover B · "Shade". The whole tile is the window and the cover hangs in it: fabric drops from a
 * roller at the top as far as it's closed, the sky (day, or night in dark mode) shows below. Pull
 * the bar on the fabric's edge up or down to set a position; round up / down buttons float in the
 * corner. Garage doors and other open/close-only covers show panels instead and have no bar.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { CoverTileModel, TileProps, TileSize } from '../../tileTypes';
import { CoverButton, coverState, openness } from './coverParts';

const ROLL = 10;

/** `orb`: where the sun (moon) sits, clear of the words; none on X-small. */
function Sky({ orb }: { orb: { left: string; bottom: string } | null }) {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(203_85%_74%),hsl(196_70%_88%)_70%,hsl(40_80%_88%))] dark:hidden" />
      {orb ? <div className="absolute size-9 rounded-full bg-[hsl(45_100%_72%)] shadow-[0_0_30px_10px_hsl(45_100%_75%/0.6)] dark:hidden" style={orb} /> : null}
      <div className="absolute inset-0 hidden bg-[linear-gradient(180deg,hsl(228_45%_13%),hsl(250_35%_24%)_75%,hsl(275_30%_30%))] dark:block" />
      {orb ? <div className="absolute hidden size-6 rounded-full bg-[hsl(48_40%_88%)] shadow-[0_0_18px_4px_hsl(48_60%_85%/0.35)] dark:block" style={orb} /> : null}
      <div className="absolute left-[64%] top-[56%] hidden size-0.5 rounded-full bg-white/80 dark:block" />
      <div className="absolute left-[80%] top-[70%] hidden size-0.5 rounded-full bg-white/60 dark:block" />
      {/* the window's cross */}
      <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/50 dark:bg-white/10" />
      <div className="absolute inset-x-0 top-[58%] h-[3px] bg-white/50 dark:bg-white/10" />
    </div>
  );
}

const BUTTON: Record<TileSize, number> = { xs: 28, s: 30, w: 34, t: 36, l: 40 };

export default function CoverShade({ e: c, size, act }: TileProps<CoverTileModel>) {
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<number | null>(null);
  const dragging = useRef(false);
  const settable = c.available && c.position !== null;
  const pos = live ?? openness(c);
  const garage = c.position === null;
  const closedFrac = (100 - pos) / 100;
  const fromPointer = (ev: PointerEvent<HTMLElement>) => {
    const r = box.current!.getBoundingClientRect();
    const f = (ev.clientY - r.top - ROLL) / Math.max(1, r.height - ROLL);
    return Math.round(Math.max(0, Math.min(100, 100 - f * 100)) / 5) * 5;
  };
  const state = live !== null ? (live <= 0 ? 'Closed' : live >= 100 ? 'Open' : `Open · ${live}%`) : coverState(c);
  const btn = BUTTON[size];
  const buttons = (
    <div className={cn('absolute bottom-2.5 right-2.5 z-10 flex gap-1.5', size === 'xs' ? 'top-1/2 bottom-auto -translate-y-1/2 flex-row' : 'flex-col')}>
      <CoverButton c={c} act={act} cmd="open" size={btn} className="bg-white/80 text-[hsl(220_20%_20%)] shadow-sm backdrop-blur-md dark:bg-black/45 dark:text-white" />
      {c.moving ? <CoverButton c={c} act={act} cmd="stop" size={btn} className="bg-white/80 text-[hsl(220_20%_20%)] shadow-sm backdrop-blur-md dark:bg-black/45 dark:text-white" /> : null}
      <CoverButton c={c} act={act} cmd="close" size={btn} className="bg-white/80 text-[hsl(220_20%_20%)] shadow-sm backdrop-blur-md dark:bg-black/45 dark:text-white" />
    </div>
  );
  const fabric = garage
    ? 'bg-[repeating-linear-gradient(180deg,hsl(220_10%_86%)_0_22px,hsl(220_10%_76%)_22px_24px)] dark:bg-[repeating-linear-gradient(180deg,hsl(225_10%_26%)_0_22px,hsl(225_10%_18%)_22px_24px)]'
    : 'bg-[repeating-linear-gradient(90deg,hsl(36_28%_91%)_0_3px,hsl(36_24%_87%)_3px_4px)] dark:bg-[repeating-linear-gradient(90deg,hsl(230_12%_23%)_0_3px,hsl(230_12%_20%)_3px_4px)]';
  const bar = settable && size !== 'xs';
  return (
    <TileFrame label={c.name} className={cn('bg-[var(--surface)]', !c.available && 'opacity-60')}>
      <div ref={box} className="absolute inset-0">
        <Sky orb={size === 'xs' ? null : size === 't' || size === 'l' ? { left: '58%', bottom: '42%' } : { left: '16%', bottom: '14%' }} />
        {/* the cover, hanging from its roller */}
        <div
          aria-hidden
          className={cn('absolute inset-x-0 top-0 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)]', fabric, live === null && 'transition-[height] duration-500 ease-out')}
          style={{ height: `calc(${ROLL}px + (100% - ${ROLL}px) * ${closedFrac})` }}
        >
          <div className="absolute inset-x-0 top-0 bg-[hsl(36_15%_78%)] dark:bg-[hsl(230_10%_14%)]" style={{ height: ROLL }} />
          {c.moving ? <div className="absolute inset-x-0 bottom-0 h-1 animate-pulse bg-[hsl(186_68%_42%)]" /> : null}
        </div>
        {/* the pull bar */}
        {bar ? (
          <span
            data-tile-control=""
            role="slider"
            tabIndex={0}
            aria-label={`${c.name} position`}
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pos}
            aria-valuetext={state}
            className="absolute left-1/2 z-10 flex h-7 w-[38%] -translate-x-1/2 -translate-y-1/2 cursor-ns-resize items-center justify-center outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-[hsl(186_68%_42%)]"
            style={{ top: `calc(${ROLL}px + (100% - ${ROLL}px) * ${closedFrac})`, touchAction: 'none' }}
            onPointerDown={(ev) => {
              if (ev.button !== 0) return;
              dragging.current = true;
              ev.currentTarget.setPointerCapture(ev.pointerId);
            }}
            onPointerMove={(ev) => {
              if (dragging.current) setLive(fromPointer(ev));
            }}
            onPointerUp={() => {
              if (dragging.current && live !== null && live !== c.position) act({ type: 'position', pct: live });
              dragging.current = false;
              setLive(null);
            }}
            onPointerCancel={() => {
              dragging.current = false;
              setLive(null);
            }}
            onKeyDown={(ev: KeyboardEvent<HTMLElement>) => {
              const up = ev.key === 'ArrowUp' || ev.key === 'ArrowRight';
              if (!up && ev.key !== 'ArrowDown' && ev.key !== 'ArrowLeft') return;
              ev.preventDefault();
              act({ type: 'position', pct: Math.max(0, Math.min(100, (c.position ?? 0) + (up ? 10 : -10))) });
            }}
          >
            <span className="h-2 w-full rounded-full bg-[hsl(36_18%_60%)] shadow-[0_1px_3px_rgba(0,0,0,0.3)] dark:bg-[hsl(230_10%_46%)]" />
          </span>
        ) : null}
        {/* words: dark on fabric and day sky, light on the night sky */}
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 z-[5]', size === 'xs' ? 'flex h-full items-center pl-3.5 pr-[76px]' : size === 'l' ? 'p-5 pt-6' : 'p-3.5 pt-4')}>
          <div className="min-w-0">
            <TileName className={cn(size === 'xs' ? 'line-clamp-1 truncate text-[14px]' : size === 'l' ? 'text-[17px]' : 'line-clamp-1')}>{c.name}</TileName>
            <TileState className={cn('opacity-75', size === 'xs' && 'text-[12px]')}>{state}</TileState>
          </div>
        </div>
        {size === 'l' || size === 't' ? (
          <p className="pointer-events-none absolute bottom-4 left-5 z-[5] text-[36px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[hsl(220_30%_16%)] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] dark:text-white dark:drop-shadow-none">
            {!c.available ? '—' : garage ? (c.isOn ? 'Open' : 'Closed') : `${pos}%`}
          </p>
        ) : null}
        {c.available ? buttons : null}
      </div>
    </TileFrame>
  );
}
