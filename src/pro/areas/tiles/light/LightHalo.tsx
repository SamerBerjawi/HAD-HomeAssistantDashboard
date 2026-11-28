/**
 * Light B · "Halo". The light as an object: a glowing bulb you tap to switch, inside a ring you
 * turn like a dimmer knob. The tile itself glows from the bulb outwards, brighter as the light
 * is. Wide and up add the light's tones or colours as swatches. Not dimmable: bulb and glow only.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon } from '@hugeicons/core-free-icons';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';
import { arcPath, RING_START, RING_SWEEP, useRingValue } from '../../gestures';
import { COLOR_PRESETS, TileFrame, TileName, TileState, toneName, WHITE_TONES } from '../../tileKit';
import { forText, glowOf, kelvinColor, type LightTileModel, type TileProps, type TileSize } from '../../tileTypes';

function Halo({ e, act, px }: { e: LightTileModel; act: TileProps<LightTileModel>['act']; px: number }) {
  const on = e.isOn && e.available;
  const glow = glowOf(e);
  const ring = useRingValue({ value: on ? (e.brightness ?? 100) : 1, onCommit: (pct) => act({ type: 'brightness', pct }) });
  const stroke = Math.max(6, Math.round(px * 0.085));
  const r = px / 2 - stroke / 2 - 2;
  const c = px / 2;
  const pct = ring.shown;
  const end = RING_START + (RING_SWEEP * (pct - 1)) / 99;
  const knob = [c + r * Math.cos((end * Math.PI) / 180), c + r * Math.sin((end * Math.PI) / 180)];
  const orb = Math.round(px * (e.dimmable ? 0.52 : 0.62));
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      {e.dimmable && e.available ? (
        <svg
          width={px}
          height={px}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          {...ring.props}
          role="slider"
          tabIndex={0}
          aria-label={`${e.name} brightness`}
          aria-valuemin={1}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          onKeyDown={(ev) => {
            if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') act({ type: 'brightness', pct: Math.min(100, Math.round(pct) + 10) });
            if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') act({ type: 'brightness', pct: Math.max(1, Math.round(pct) - 10) });
          }}
        >
          <path d={arcPath(c, c, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} strokeLinecap="round" />
          {on || ring.shown !== 1 ? (
            <>
              <path d={arcPath(c, c, r, RING_START, Math.max(RING_START + 0.5, end))} fill="none" stroke={glow} strokeWidth={stroke} strokeLinecap="round" />
              <circle cx={knob[0]} cy={knob[1]} r={stroke * 0.62} fill="white" stroke="rgba(0,0,0,0.12)" />
            </>
          ) : null}
        </svg>
      ) : (
        <svg aria-hidden width={px} height={px} className="absolute inset-0">
          <circle cx={c} cy={c} r={r} fill="none" stroke={on ? glow : 'currentColor'} strokeOpacity={on ? 0.9 : 0.12} strokeWidth={Math.max(3, stroke * 0.5)} style={on ? { filter: `drop-shadow(0 0 ${stroke}px ${glow})` } : undefined} />
        </svg>
      )}
      <Button
        isIconOnly
        variant="ghost"
        aria-label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`}
        aria-pressed={on}
        isDisabled={!e.available}
        onPress={() => act({ type: 'toggle' })}
        className={cn('absolute left-1/2 top-1/2 min-w-0 -translate-x-1/2 -translate-y-1/2 rounded-full p-0 transition-[background,box-shadow] duration-300', on ? 'text-[hsl(30_30%_14%)]' : 'bg-default text-muted')}
        style={{ width: orb, height: orb, ...(on ? { background: `radial-gradient(circle at 35% 30%, white, ${glow} 70%)`, boxShadow: `0 0 ${Math.round(orb * 0.5)}px ${Math.round(orb * 0.08)}px color-mix(in srgb, ${glow} ${Math.round(30 + pct * 0.4)}%, transparent)` } : {}) }}
      >
        <HugeiconsIcon icon={BulbIcon} size={Math.round(orb * 0.42)} style={{ width: Math.round(orb * 0.42), height: Math.round(orb * 0.42) }} />
      </Button>
    </div>
  );
}

function Swatches({ e, act, vertical }: { e: LightTileModel; act: TileProps<LightTileModel>['act']; vertical?: boolean }) {
  const on = e.isOn && e.available;
  const items = e.supportsColor
    ? COLOR_PRESETS.slice(0, 4).map((p) => ({ key: p.label, label: p.label, color: p.rgb, active: on && e.rgb === p.rgb, a: { type: 'color' as const, rgb: p.rgb } }))
    : e.supportsTemp
      ? WHITE_TONES.map((t) => ({ key: t.id, label: t.label, color: kelvinColor(t.k), active: on && !e.rgb && toneName(e.kelvin) === t.label, a: { type: 'kelvin' as const, kelvin: t.k } }))
      : [];
  if (!items.length || !e.available) return null;
  return (
    <div className={cn('flex', vertical ? 'flex-col gap-1.5' : 'gap-1.5')}>
      {items.map((s) => (
        <Button
          key={s.key}
          variant="ghost"
          size="sm"
          aria-label={`${e.name}: ${s.label}`}
          aria-pressed={s.active}
          onPress={() => act(s.a)}
          className={cn('h-7 min-w-0 gap-1.5 rounded-full p-0 text-[12px] font-semibold', vertical ? 'justify-start px-1 pr-2.5' : 'w-7')}
        >
          <span className={cn('size-6 shrink-0 rounded-full ring-1 ring-black/10 transition-transform', s.active && 'ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-transparent')} style={{ background: s.color }} />
          {vertical ? <span className="truncate">{s.label}</span> : null}
        </Button>
      ))}
    </div>
  );
}

const RING_PX: Record<TileSize, number> = { xs: 48, s: 70, w: 112, t: 128, l: 176 };

export default function LightHalo({ e, size, act }: TileProps<LightTileModel>) {
  const on = e.isOn && e.available;
  const glow = glowOf(e);
  const level = !e.available ? 'Unavailable' : on ? (e.dimmable ? `${e.brightness ?? 100}%` : 'On') : 'Off';
  const tone = on ? (e.rgb ? 'Colour' : toneName(e.kelvin)) : '';
  // On/off lights (no dimming, no colour): the state says how long, since there's no level to show.
  const since = forText(e.lastChanged);
  const plain = e.available && !e.dimmable;
  const plainState = `${on ? 'On' : 'Off'}${since === 'just now' ? ' · just now' : since ? ` ${since}` : ''}`;
  const line = plain ? plainState : tone ? `${level} · ${tone}` : level;
  const bg = on ? { background: `radial-gradient(120% 120% at ${size === 't' ? '50% 52%' : size === 's' ? '28% 32%' : '22% 50%'}, color-mix(in srgb, ${glow} ${Math.round(18 + (e.brightness ?? 100) * 0.3)}%, var(--surface)), var(--surface) 75%)` } : undefined;
  const halo = <Halo e={e} act={act} px={RING_PX[size]} />;
  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={cn(on ? 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'pro-surface', !e.available && 'opacity-60')} style={bg}>
        <div className="flex h-full items-center gap-2.5 px-2.5">
          {halo}
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{e.name}</TileName>
            <TileState className="text-[12px]">{line}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={cn(on ? 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'pro-surface', !e.available && 'opacity-60')} style={bg}>
      {size === 's' ? (
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between gap-1">
            <div className="-ml-1 -mt-1">{halo}</div>
            {on && e.dimmable ? (
              <p className="pt-1 text-[22px] font-semibold leading-none tracking-tight tabular-nums">
                {e.brightness ?? 100}
                <span className="text-[14px] font-medium opacity-70">%</span>
              </p>
            ) : null}
          </div>
          <div className="mt-auto min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{plain ? plainState : on && e.dimmable ? tone || 'On' : line}</TileState>
          </div>
        </div>
      ) : size === 'w' ? (
        <div className="flex h-full items-center gap-4 p-3.5 pl-4">
          {halo}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <TileName>{e.name}</TileName>
              <TileState>{line}</TileState>
            </div>
            <Swatches e={e} act={act} />
          </div>
        </div>
      ) : size === 't' ? (
        <div className="flex h-full flex-col items-center gap-2 p-4 text-center">
          <div className="w-full min-w-0 text-left">
            <TileName>{e.name}</TileName>
            <TileState>{plain ? since || ' ' : tone || level}</TileState>
          </div>
          <div className="my-auto">{halo}</div>
          <p className={cn('text-[28px] font-semibold leading-none tracking-tight tabular-nums', !on && 'text-muted')}>{level}</p>
          <div className="mt-1">
            <Swatches e={e} act={act} />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-2 p-5">
          <div className="min-w-0">
            <TileName className="text-[17px]">{e.name}</TileName>
            <TileState>{plain ? since || ' ' : tone || (on ? 'On' : 'Off')}</TileState>
          </div>
          <div className="flex min-h-0 flex-1 items-center gap-4">
            <div className="-ml-2">{halo}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className={cn('text-[36px] font-semibold leading-none tracking-[-0.03em] tabular-nums', !on && 'text-muted')}>{level}</p>
              <Swatches e={e} act={act} vertical />
            </div>
          </div>
        </div>
      )}
    </TileFrame>
  );
}
