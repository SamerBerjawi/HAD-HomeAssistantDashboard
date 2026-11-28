/**
 * Switch A · "Rocker". A real wall rocker: a plate split in two, the pressed half sunk in and lit
 * in the accent when on. One press flips it. Next to it, what it powers and what it draws. The
 * plate grows with the tile; on Large the numbers (now, today, how long) get their own column.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import { forText, type SwitchTileModel, type TileProps, type TileSize } from '../../tileTypes';
import { switchIcon, switchState, watts } from './switchParts';

const PLATE: Record<TileSize, { w: number; h: number }> = { xs: { w: 30, h: 52 }, s: { w: 46, h: 104 }, w: { w: 58, h: 116 }, t: { w: 92, h: 176 }, l: { w: 112, h: 252 } };

function Plate({ e, act, size }: { e: SwitchTileModel; act: TileProps<SwitchTileModel>['act']; size: TileSize }) {
  const on = e.isOn && e.available;
  const { w, h } = PLATE[size];
  const glyph = size === 's' || size === 'w' ? 'text-[11px]' : 'text-sm';
  return (
    <Button
      variant="ghost"
      isDisabled={!e.available}
      onPress={() => act({ type: 'toggle' })}
      aria-label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`}
      aria-pressed={on}
      className="shrink-0 rounded-[18px] bg-default p-[5px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
      style={{ width: w, height: h }}
    >
      <span className="flex h-full w-full flex-col overflow-hidden rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
        <span
          className={cn(
            'grid flex-1 place-items-center font-bold transition-all duration-200',
            glyph,
            on ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[inset_0_3px_8px_rgba(0,0,0,0.25)]' : 'bg-[var(--surface)] text-muted shadow-[0_2px_3px_rgba(0,0,0,0.08)]'
          )}
        >
          I
        </span>
        <span
          className={cn(
            'grid flex-1 place-items-center font-bold transition-all duration-200',
            glyph,
            on ? 'bg-[var(--surface)] text-muted shadow-[0_-2px_3px_rgba(0,0,0,0.08)]' : 'bg-[color-mix(in_oklab,var(--surface)_80%,black)] text-foreground/70 shadow-[inset_0_-3px_8px_rgba(0,0,0,0.18)] dark:bg-[color-mix(in_oklab,var(--surface)_70%,black)]'
          )}
        >
          O
        </span>
      </span>
    </Button>
  );
}

export default function SwitchRocker({ e, size, act }: TileProps<SwitchTileModel>) {
  const on = e.isOn && e.available;
  const icon = (
    <span className={cn('grid size-9 place-items-center rounded-full transition-colors', on ? 'pro-soft' : 'bg-default text-muted')}>
      <HugeiconsIcon icon={switchIcon(e)} size={18} />
    </span>
  );
  const plate = <Plate e={e} act={act} size={size} />;
  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        <div className="flex h-full items-center gap-2 pl-3.5 pr-2">
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{e.name}</TileName>
            <TileState className="text-[12px]">{switchState(e)}</TileState>
          </div>
          {plate}
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
      {size === 's' || size === 'w' ? (
        <div className="flex h-full items-center gap-3 p-3.5 pl-4">
          <div className="flex min-w-0 flex-1 flex-col self-stretch">
            {icon}
            <div className="mt-auto min-w-0">
              <TileName>{e.name}</TileName>
              <TileState>{switchState(e)}</TileState>
              {size === 'w' && on && forText(e.lastChanged) ? <TileState className="opacity-50">{`${e.powerW !== null ? 'On ' : ''}${forText(e.lastChanged)}`}</TileState> : null}
            </div>
          </div>
          {plate}
        </div>
      ) : size === 't' ? (
        <div className="flex h-full flex-col items-center gap-3 p-4">
          <div className="flex w-full items-start gap-2.5">
            {icon}
            <div className="min-w-0 flex-1">
              <TileName>{e.name}</TileName>
              <TileState>{on ? 'On' : !e.available ? 'Unavailable' : 'Off'}</TileState>
            </div>
          </div>
          <div className="my-auto">{plate}</div>
          <TileState className="opacity-60">{on ? [watts(e.powerW), forText(e.lastChanged)].filter(Boolean).join(' · ') : e.appliance ?? ' '}</TileState>
        </div>
      ) : (
        <div className="flex h-full items-center gap-5 p-5">
          {plate}
          <div className="flex min-w-0 flex-1 flex-col gap-4 self-stretch">
            <div className="flex items-start gap-2.5">
              {icon}
              <div className="min-w-0 flex-1">
                <TileName className="text-[17px]">{e.name}</TileName>
                <TileState>{on ? 'On' : !e.available ? 'Unavailable' : 'Off'}</TileState>
              </div>
            </div>
            <dl className="mt-auto grid gap-3">
              {e.powerW !== null ? (
                <div>
                  <dt className="text-xs text-muted">Drawing now</dt>
                  <dd className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">{on ? watts(e.powerW) : '0 W'}</dd>
                </div>
              ) : null}
              {e.energyTodayKwh !== null ? (
                <div>
                  <dt className="text-xs text-muted">Today</dt>
                  <dd className="text-lg font-semibold tabular-nums">{e.energyTodayKwh.toFixed(2)} kWh</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted">{on ? 'On' : 'Off'}</dt>
                <dd className="text-lg font-semibold">{forText(e.lastChanged).replace(/^for /, '') || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </TileFrame>
  );
}
