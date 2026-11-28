/**
 * Light C · "Steps". Precise and calm: no dragging, just taps. Five brightness steps drawn as a
 * rising stair (20 … 100%), filled in the light's colour up to where it is; a power key; and on
 * Large a palette of tones and colours. Reads like an instrument panel, works with gloves on.
 * Not dimmable: one large On / Off key instead of the stair.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, PowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { COLOR_PRESETS, TileFrame, TileIconButton, TileName, TileState, toneName, WHITE_TONES } from '../../tileKit';
import { glowOf, kelvinColor, type LightTileModel, type TileProps } from '../../tileTypes';

const STEPS = [20, 40, 60, 80, 100];
const stepOf = (e: LightTileModel) => (e.isOn ? STEPS.reduce((best, s, i) => (Math.abs(s - (e.brightness ?? 100)) < Math.abs(STEPS[best] - (e.brightness ?? 100)) ? i : best), 0) + 1 : 0);

function Stair({ e, act, axis, big }: { e: LightTileModel; act: TileProps<LightTileModel>['act']; axis: 'x' | 'y'; big?: boolean }) {
  const at = stepOf(e);
  const glow = glowOf(e);
  if (!e.dimmable) {
    return (
      <Button
        variant="ghost"
        onPress={() => act({ type: 'toggle' })}
        isDisabled={!e.available}
        aria-label={`${e.name}: ${e.isOn ? 'on, turn off' : 'off, turn on'}`}
        className={cn('h-10 w-full rounded-2xl text-sm font-semibold', e.isOn ? 'text-[hsl(30_30%_14%)]' : 'bg-default')}
        style={e.isOn ? { background: glow } : undefined}
      >
        {e.isOn ? 'Turn off' : 'Turn on'}
      </Button>
    );
  }
  return (
    <div role="group" aria-label={`${e.name} brightness`} className={cn('flex', axis === 'x' ? 'h-full w-full items-end gap-1.5' : 'w-full flex-col-reverse gap-1.5')}>
      {STEPS.map((s, i) => {
        const filled = i < at;
        const grow = 0.36 + (i / (STEPS.length - 1)) * 0.64;
        return (
          <Button
            key={s}
            variant="ghost"
            isDisabled={!e.available}
            onPress={() => act({ type: 'brightness', pct: s })}
            aria-label={`${e.name}: ${s}%${i + 1 === at ? ', current' : ''}`}
            aria-pressed={i + 1 === at}
            className={cn('min-h-0 min-w-0 rounded-[10px] p-0 transition-colors duration-200', !filled && 'bg-default hover:bg-default/70', axis === 'x' ? 'flex-1' : 'self-start')}
            style={{
              ...(axis === 'x' ? { height: `${Math.round(grow * 100)}%` } : { width: `${Math.round(grow * 100)}%`, height: big ? 34 : 26 }),
              ...(filled ? { background: `color-mix(in srgb, ${glow} ${60 + i * 10}%, white)` } : {})
            }}
          />
        );
      })}
    </div>
  );
}

function Palette({ e, act }: { e: LightTileModel; act: TileProps<LightTileModel>['act'] }) {
  const tones = e.supportsTemp ? WHITE_TONES.map((t) => ({ key: t.id, label: t.label, color: kelvinColor(t.k), active: e.isOn && !e.rgb && toneName(e.kelvin) === t.label, a: { type: 'kelvin' as const, kelvin: t.k } })) : [];
  const colors = e.supportsColor ? COLOR_PRESETS.map((p) => ({ key: p.label, label: p.label, color: p.rgb, active: e.isOn && e.rgb === p.rgb, a: { type: 'color' as const, rgb: p.rgb } })) : [];
  const all = [...tones, ...colors];
  if (!all.length) return null;
  return (
    <div role="group" aria-label={`${e.name} colour`} className="grid grid-cols-9 gap-1.5">
      {all.slice(0, 9).map((s) => (
        <Button
          key={s.key}
          isIconOnly
          variant="ghost"
          isDisabled={!e.available}
          aria-label={`${e.name}: ${s.label}`}
          aria-pressed={s.active}
          onPress={() => act(s.a)}
          className={cn('aspect-square h-auto w-full min-w-0 rounded-full p-0 ring-1 ring-black/10', s.active && 'ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--surface)]')}
          style={{ background: s.color }}
        />
      ))}
    </div>
  );
}

export default function LightSteps({ e, size, act }: TileProps<LightTileModel>) {
  const on = e.isOn && e.available;
  const glow = glowOf(e);
  const level = !e.available ? 'Unavailable' : on ? (e.dimmable ? `${e.brightness ?? 100}%` : 'On') : 'Off';
  const tone = on ? (e.rgb ? 'Colour' : toneName(e.kelvin)) : '';
  const power = (
    <TileIconButton
      icon={on ? BulbIcon : PowerIcon}
      label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`}
      pressed={on}
      onPress={() => e.available && act({ type: 'toggle' })}
      size={size === 'xs' ? 26 : size === 's' ? 36 : 40}
      className={on ? 'text-[hsl(30_30%_14%)]' : 'bg-default text-muted'}
      style={on ? { background: glow, boxShadow: `0 4px 14px -4px ${glow}` } : undefined}
    />
  );
  const headline = <p className={cn('font-semibold leading-none tracking-[-0.02em] tabular-nums', size === 'l' ? 'text-[40px]' : size === 's' ? 'text-[20px]' : 'text-[28px]', !on && 'text-muted')}>{level}</p>;
  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        {on ? <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${glow}, transparent 85%)` }} /> : null}
        <div className="flex h-full flex-col justify-center gap-1.5 px-3">
          <div className="flex items-center gap-2">
            {power}
            <TileName className="line-clamp-1 min-w-0 flex-1 truncate text-[14px]">{e.name}</TileName>
            <span className={cn('text-[13px] font-semibold tabular-nums', !on && 'text-muted')}>{level}</span>
          </div>
          {e.dimmable ? (
            <div className="h-5">
              <Stair e={e} act={act} axis="x" />
            </div>
          ) : null}
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
      {on ? <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${glow}, transparent 85%)` }} /> : null}
      {size === 's' ? (
        <div className="flex h-full flex-col gap-2 p-3.5">
          <div className="flex items-center justify-between gap-2">
            {power}
            {headline}
          </div>
          <TileName className="mt-auto">{e.name}</TileName>
          <div className="h-9">{e.dimmable ? <Stair e={e} act={act} axis="x" /> : <TileState>{tone || level}</TileState>}</div>
        </div>
      ) : size === 'w' ? (
        <div className="flex h-full gap-4 p-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2.5">
              {power}
              {headline}
            </div>
            <div className="mt-auto min-w-0">
              <TileName>{e.name}</TileName>
              <TileState>{tone || (on ? 'On' : 'Off')}</TileState>
            </div>
          </div>
          <div className={cn('flex shrink-0 items-end', e.dimmable ? 'w-[46%]' : 'w-[40%] items-center')}>
            <Stair e={e} act={act} axis="x" />
          </div>
        </div>
      ) : size === 't' ? (
        <div className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            {power}
            {headline}
          </div>
          <div className="min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{tone || (on ? 'On' : 'Off')}</TileState>
          </div>
          <div className="mt-auto">
            <Stair e={e} act={act} axis="y" />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <TileName className="text-[17px]">{e.name}</TileName>
              <TileState>{tone || (on ? 'On' : 'Off')}</TileState>
            </div>
            {power}
          </div>
          {headline}
          <div className="min-h-0 flex-1">
            <Stair e={e} act={act} axis="x" big />
          </div>
          <Palette e={e} act={act} />
        </div>
      )}
    </TileFrame>
  );
}
