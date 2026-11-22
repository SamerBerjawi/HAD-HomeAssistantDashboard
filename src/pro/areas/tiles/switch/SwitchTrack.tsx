/**
 * Switch C · "Track". The tile is the switch: a big knob carrying the device's icon rides across
 * it, and the track behind floods with the accent when it's on. Tap anywhere on the tile. The
 * knob runs along the tile's long side (up the Tall tile), the words sit in the space it leaves.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TILE_RADIUS, TileName, TileState } from '../../tileKit';
import { forText, type SwitchTileModel, type TileProps, type TileSize } from '../../tileTypes';
import { switchIcon, switchState } from './switchParts';

const KNOB: Record<TileSize, number> = { xs: 40, s: 52, w: 92, t: 104, l: 132 };
const PAD = 10;

export default function SwitchTrack({ e, size, act }: TileProps<SwitchTileModel>) {
  const on = e.isOn && e.available;
  const k = KNOB[size];
  const vertical = size === 't';
  const knobPos = vertical ? { left: '50%', top: on ? PAD : `calc(100% - ${k + PAD}px)`, transform: 'translateX(-50%)' } : size === 's' ? { bottom: PAD, left: on ? `calc(100% - ${k + PAD}px)` : PAD } : { top: '50%', left: on ? `calc(100% - ${k + PAD}px)` : PAD, transform: 'translateY(-50%)' };
  // Words live in the half the knob is not in.
  const textPos = vertical
    ? cn('inset-x-4', on ? 'bottom-4' : 'top-4')
    : size === 's'
      ? 'inset-x-3.5 top-3.5'
      : cn('inset-y-0 flex flex-col justify-center', on ? 'left-5 right-[calc(var(--k)+28px)]' : 'right-5 left-[calc(var(--k)+28px)] text-right');
  return (
    <Button
      variant="ghost"
      isDisabled={!e.available}
      onPress={() => act({ type: 'toggle' })}
      aria-label={`${e.name}: ${switchState(e)}. ${on ? 'Turn off' : 'Turn on'}`}
      aria-pressed={on}
      className={cn('relative block h-full w-full min-w-0 overflow-hidden p-0 text-left whitespace-normal transition-colors duration-300', TILE_RADIUS, on ? 'text-[var(--accent-foreground)]' : 'pro-surface text-foreground', !e.available && 'opacity-60')}
      style={{ ['--k' as string]: `${k}px`, ...(on ? { background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 88%, white), var(--accent))' } : {}) }}
    >
      {/* the groove */}
      {size === 's' ? <span aria-hidden className={cn('absolute inset-x-[10px] bottom-[10px] rounded-full', on ? 'bg-white/20' : 'bg-default')} style={{ height: k }} /> : null}
      <span className={cn('absolute min-w-0', textPos)}>
        <TileName className={size === 'l' ? 'text-[18px]' : undefined}>{e.name}</TileName>
        <TileState className={on ? 'opacity-85' : undefined}>{switchState(e)}</TileState>
        {size === 'l' && on && forText(e.lastChanged) ? <TileState className="opacity-70">{forText(e.lastChanged)}</TileState> : null}
        {size === 'l' && e.energyTodayKwh !== null ? <p className="mt-2 text-[13px] leading-tight opacity-70">{`${e.energyTodayKwh.toFixed(2)} kWh today`}</p> : null}
      </span>
      <span
        aria-hidden
        className={cn('absolute grid place-items-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.5,1)] motion-reduce:transition-none', on ? 'bg-white text-[var(--accent)] shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)]' : 'bg-[var(--surface)] text-muted shadow-[0_2px_8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:bg-default dark:ring-white/10')}
        style={{ width: k, height: k, ...knobPos }}
      >
        <HugeiconsIcon icon={switchIcon(e)} size={Math.round(k * 0.4)} />
      </span>
    </Button>
  );
}
