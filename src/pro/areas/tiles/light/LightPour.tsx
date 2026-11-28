/**
 * Light A · "Pour". The whole tile is the dimmer: light pours across it from the left, in the
 * light's own colour, as far as its brightness. Slide anywhere to dim, tap to switch. Where the
 * light covers the text, the text turns dark (a second, clipped copy), so it always reads.
 * Large adds a row of tones or colours. Not dimmable: tap only, full pour when on.
 */
import type { ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useSlideValue } from '../../gestures';
import { COLOR_PRESETS, TileChip, TileFrame, TileName, TileState, toneName, WHITE_TONES } from '../../tileKit';
import { glowOf, kelvinColor, type LightTileModel, type TileProps } from '../../tileTypes';

function Layout({ e, size, pct, dark }: { e: LightTileModel; size: TileProps<LightTileModel>['size']; pct: number; dark: boolean }) {
  const on = e.isOn && e.available;
  const level = !e.available ? 'Unavailable' : on ? (e.dimmable ? `${Math.round(pct)}%` : 'On') : 'Off';
  const sub = on ? (e.rgb ? 'Colour' : toneName(e.kelvin)) : '';
  const icon = <HugeiconsIcon icon={BulbIcon} size={size === 's' ? 22 : 24} className={cn(!on && 'opacity-50')} />;
  const ink = dark ? 'text-[hsl(30_25%_12%)]' : '';
  const big = (cls: string) => <p className={cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', cls, !on && 'opacity-45')}>{level}</p>;
  let body: ReactNode;
  if (size === 'xs') {
    body = (
      <div className="flex min-h-0 flex-1 items-center gap-2">
        <TileName className="line-clamp-1 flex-1 truncate text-[14px]">{e.name}</TileName>
        {big('text-[19px]')}
      </div>
    );
  } else if (size === 's') {
    body = (
      <>
        {icon}
        <div className="mt-auto min-w-0">
          <TileName>{e.name}</TileName>
          <TileState>{sub ? `${level} · ${sub}` : level}</TileState>
        </div>
      </>
    );
  } else if (size === 't') {
    body = (
      <>
        {icon}
        <div className="my-auto">{big('text-[44px]')}</div>
        <div className="min-w-0">
          <TileName>{e.name}</TileName>
          <TileState>{sub || (on ? 'On' : 'Off')}</TileState>
        </div>
      </>
    );
  } else if (size === 'l') {
    // Number up top, name at the foot: a long name never meets the big number.
    body = (
      <div className={cn('flex min-h-0 flex-1 flex-col', (e.supportsColor || e.supportsTemp) && 'pb-11')}>
        <div className="flex items-start justify-between gap-3">
          {icon}
          {big('text-[64px]')}
        </div>
        <div className="mt-auto min-w-0">
          <TileName className="text-[17px]">{e.name}</TileName>
          <TileState>{sub || (on ? 'On' : 'Off')}</TileState>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="flex min-h-0 flex-1 items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-3 self-stretch">
          {icon}
          <div className="mt-auto min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{sub || (on ? 'On' : 'Off')}</TileState>
          </div>
        </div>
        {big('text-[40px]')}
      </div>
    );
  }
  return <div className={cn('absolute inset-0 flex flex-col gap-2', size === 'xs' ? 'px-3.5 py-2' : 'p-4', ink)}>{body}</div>;
}

export default function LightPour({ e, size, act }: TileProps<LightTileModel>) {
  const on = e.isOn && e.available;
  const glow = glowOf(e);
  const slide = useSlideValue({
    value: on ? (e.brightness ?? 100) : 0,
    min: 1,
    enabled: e.available && e.dimmable,
    onCommit: (pct) => act({ type: 'brightness', pct }),
    onTap: () => e.available && act({ type: 'toggle' }),
    label: `${e.name} brightness. Slide to dim, tap to switch`,
    valueText: on ? `${e.brightness ?? 100}%` : 'Off'
  });
  // While sliding an off light, show where it will land.
  const pct = slide.live ?? (on ? (e.dimmable ? (e.brightness ?? 100) : 100) : 0);
  const pour = `color-mix(in srgb, ${glow} 78%, white)`;
  return (
    <TileFrame
      label={e.name}
      className={cn('select-none', on || slide.live !== null ? '' : 'pro-surface', !e.available && 'opacity-60')}
      style={on || slide.live !== null ? { background: `color-mix(in srgb, ${glow} 16%, var(--surface))` } : undefined}
    >
      <div {...slide.props} className="absolute inset-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-inset rounded-[inherit]">
        <div
          aria-hidden
          className={cn('absolute inset-y-0 left-0', slide.live === null && 'transition-[width] duration-300 ease-out')}
          style={{ width: `${pct}%`, background: pour, boxShadow: pct > 0 && pct < 100 ? `8px 0 24px -6px ${glow}` : undefined }}
        />
        <div aria-hidden>
          <Layout e={e} size={size} pct={pct} dark={false} />
        </div>
        <div aria-hidden style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} className={cn('absolute inset-0', slide.live === null && 'transition-[clip-path] duration-300 ease-out')}>
          <Layout e={e} size={size} pct={pct} dark />
        </div>
      </div>
      {size === 'l' && e.available ? (
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {e.supportsColor
            ? COLOR_PRESETS.map((c) => (
                <TileChip key={c.label} label={`${e.name}: ${c.label}`} active={e.rgb === c.rgb} onPress={() => act({ type: 'color', rgb: c.rgb })} className="gap-1.5 bg-white/70 text-[hsl(30_25%_12%)] backdrop-blur-md dark:bg-black/45 dark:text-white">
                  <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c.rgb }} />
                  {c.label}
                </TileChip>
              ))
            : e.supportsTemp
              ? WHITE_TONES.map((t) => (
                  <TileChip key={t.id} label={`${e.name}: ${t.label}`} active={on && !e.rgb && toneName(e.kelvin) === t.label} onPress={() => act({ type: 'kelvin', kelvin: t.k })} className="gap-1.5 bg-white/70 text-[hsl(30_25%_12%)] backdrop-blur-md dark:bg-black/45 dark:text-white">
                    <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: kelvinColor(t.k) }} />
                    {t.label}
                  </TileChip>
                ))
              : null}
        </div>
      ) : null}
    </TileFrame>
  );
}
