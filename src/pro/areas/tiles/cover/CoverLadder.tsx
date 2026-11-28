/**
 * Cover A · "Positions". The positions people actually use, as a ladder of buttons: Closed, 25,
 * 50, 75, Open. The rungs up to where the cover is are filled, the nearest one is solid. One tap
 * goes there; Stop appears while it moves. Open/close-only covers get two rungs. Tall stands the
 * ladder up (Open at the top, like the blind itself).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import { forText, type CoverTileModel, type TileProps } from '../../tileTypes';
import { COVER, coverIcon, CoverButton, coverState, openness } from './coverParts';

const STEPS = [0, 25, 50, 75, 100];
const word = (p: number) => (p === 0 ? 'Closed' : p === 100 ? 'Open' : `${p}`);

function Ladder({ c, act, vertical, labels, className, rung }: { c: CoverTileModel; act: TileProps<CoverTileModel>['act']; vertical?: boolean; labels: boolean; className?: string; rung?: string }) {
  const steps = (c.canPosition ?? (c.position !== null)) ? STEPS : [0, 100]; // Capabilities are independent of the last reported position.
  const at = openness(c);
  const nearest = steps.reduce((a, b) => (Math.abs(b - at) < Math.abs(a - at) ? b : a));
  const toward = c.moving === 'opening' ? 100 : c.moving === 'closing' ? 0 : null;
  const list = vertical ? [...steps].reverse() : steps;
  return (
    <div role="group" aria-label={`${c.name} position`} className={cn('flex gap-1', vertical ? 'flex-col' : 'flex-row', className)}>
      {list.map((p) => {
        const active = c.available && !c.moving && p === nearest;
        const filled = c.available && p > 0 && p <= at;
        return (
          <Button
            key={p}
            variant="ghost"
            data-tile-control=""
            aria-label={`${c.name}: ${p === 0 ? 'close' : p === 100 ? 'open fully' : `open to ${p}%`}`}
            aria-pressed={active}
            isDisabled={!c.available}
            onPress={() => act(p === 0 || p === 100 ? { type: 'cover', cmd: p === 0 ? 'close' : 'open' } : { type: 'position', pct: p })}
            className={cn(
              'h-auto min-h-0 w-full min-w-0 flex-1 basis-0 rounded-xl p-0 text-[12px] font-semibold tabular-nums transition-[background,color] duration-200',
              vertical && 'justify-start px-3',
              active ? 'text-white' : filled ? '' : 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]',
              toward === p && 'animate-pulse',
              rung
            )}
            style={active ? { background: COVER } : filled ? { background: `color-mix(in srgb, ${COVER} 22%, transparent)` } : undefined}
          >
            {labels ? word(p) : null}
          </Button>
        );
      })}
    </div>
  );
}

export default function CoverLadder({ e: c, size, act }: TileProps<CoverTileModel>) {
  const state = coverState(c);
  const frame = cn('pro-surface', !c.available && 'opacity-60');
  const stop = c.moving && c.canStop !== false ? <CoverButton c={c} act={act} cmd="stop" size={30} /> : null;
  const icon = coverIcon(c);
  const big = !c.available ? '—' : c.position === null ? (c.isOn ? 'Open' : 'Closed') : `${c.position}%`;

  if (size === 'xs') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full flex-col justify-center gap-1.5 px-3">
          <div className="flex items-baseline gap-2 px-0.5">
            <TileName className="line-clamp-1 flex-1 truncate text-[14px]">{c.name}</TileName>
            <span className="shrink-0 text-[12px] opacity-70">{c.moving ? state : big}</span>
          </div>
          <Ladder c={c} act={act} labels={false} rung="h-6" />
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <TileName className="line-clamp-1">{c.name}</TileName>
              <TileState>{c.moving ? state : c.position === null ? 'Open / close' : state}</TileState>
            </div>
            {stop}
          </div>
          <p className="mt-auto text-[26px] font-semibold leading-none tracking-tight tabular-nums">{big}</p>
          <Ladder c={c} act={act} labels={c.position === null} className="mt-2.5" rung="h-8" />
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full flex-col p-4 pb-3.5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${COVER} 16%, transparent)`, color: COVER }}>
              <HugeiconsIcon icon={icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <TileName className="line-clamp-1">{c.name}</TileName>
              <TileState>{state}</TileState>
            </div>
            {stop}
          </div>
          <Ladder c={c} act={act} labels className="mt-auto" rung="h-11" />
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start gap-2 px-0.5">
            <div className="min-w-0 flex-1">
              <TileName className="line-clamp-1">{c.name}</TileName>
              <TileState>{state}</TileState>
            </div>
            {stop}
          </div>
          <Ladder c={c} act={act} vertical labels className="mt-3 flex-1" rung={c.position === null ? 'max-h-24' : 'max-h-14'} />
        </div>
      </TileFrame>
    );
  }
  const since = forText(c.lastChanged);
  return (
    <TileFrame label={c.name} className={frame}>
      <div className="flex h-full gap-4 p-5">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="grid size-10 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${COVER} 16%, transparent)`, color: COVER }}>
            <HugeiconsIcon icon={icon} size={20} />
          </span>
          <TileName className="mt-3 text-[17px]">{c.name}</TileName>
          <TileState>{!c.available || c.moving || !since ? state : `Last moved ${since === 'just now' ? since : `${since.replace('for ', '')} ago`}`}</TileState>
          <p className="mt-auto text-[44px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{big}</p>
          <p className="mt-1.5 text-[13px] opacity-60">{c.available && !c.moving && c.position === null ? 'Open / close only' : state}</p>
          {c.moving && c.canStop !== false ? (
            <CoverButton c={c} act={act} cmd="stop" size={36} className="mt-3 self-start">
              Stop
            </CoverButton>
          ) : null}
        </div>
        <Ladder c={c} act={act} vertical labels className="w-[44%] shrink-0" />
      </div>
    </TileFrame>
  );
}
