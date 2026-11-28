/**
 * Ambient (D) for lights, switches and fans, refined to the owner's reference (2026-11-21):
 * - X-small: one row: name and state, and an orb wearing the device's icon (tap to switch).
 * - Small: icon, name and state at the top, a big power orb at the bottom (the Floor Lamp tile).
 * - Wide: icon and orb on top, name and "75% · Warm white", a level slider along the bottom
 *   (the Ceiling Light tile); the card warms from the corner as the level rises.
 * - Tall / Large: the level as a big number above the same parts; Large adds tone pills.
 * Lights: slide anywhere on the tile to dim. Fans: tap the speed bar. Switches: metered plugs draw
 * their load trace; plain switches keep the corner glow alone at every size.
 */
import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BulbIcon, Fan01Icon, PowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useSlideValue } from '../../gestures';
import { toneName, WHITE_TONES } from '../../tileKit';
import { cap, kelvinColor, pctOfLevel, type FanTileModel, type LightTileModel, type SwitchTileModel, type TileProps, type TileSize } from '../../tileTypes';
import { fanLevel } from '../fan/fanParts';
import { Sparkline, switchIcon, watts } from '../switch/switchParts';
import { AName, AState, Glass, glowStyle, HUE, OrbButton, Wave } from './ambientKit';

const ORB: Record<TileSize, number> = { xs: 40, s: 54, w: 50, t: 50, l: 54 };

function GlowIcon({ icon, on, color, px, spin }: { icon: IconSvgElement; on: boolean; color: string; px: number; spin?: string }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={px}
      strokeWidth={1.8}
      className={cn('shrink-0', on ? '' : 'opacity-55', spin && 'motion-safe:animate-spin')}
      style={on ? { color, filter: `drop-shadow(0 0 10px color-mix(in srgb, ${color} 75%, transparent))`, ...(spin ? { animationDuration: spin } : {}) } : undefined}
    />
  );
}

/** A level bar that looks like a slider (the tile itself takes the drag). */
export function LevelBar({ pct, color, thumb = true }: { pct: number; color: string; thumb?: boolean }) {
  return (
    <div aria-hidden className="relative h-2.5 w-full rounded-full bg-black/10 dark:bg-white/12">
      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200" style={{ width: `${pct}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 70%, white), ${color})`, boxShadow: pct ? `0 0 14px -2px ${color}` : undefined }} />
      {thumb ? <div className="absolute top-1/2 size-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-[left] duration-200" style={{ left: `clamp(11px, ${pct}%, calc(100% - 11px))` }} /> : null}
    </div>
  );
}

function Device({
  size,
  icon,
  name,
  state,
  big,
  orb,
  bottom,
  extra
}: {
  size: TileSize;
  icon: ReactNode;
  name: string;
  state: string;
  big?: string;
  orb: ReactNode;
  bottom?: ReactNode;
  extra?: ReactNode;
}) {
  if (size === 'xs') {
    return (
      <div className="relative flex h-full items-center gap-2 pl-3.5 pr-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight">{name}</p>
          <p className="mt-0.5 truncate text-[12px] leading-tight opacity-65 tabular-nums">{state}</p>
        </div>
        {orb}
      </div>
    );
  }
  if (size === 's') {
    return (
      <div className="relative flex h-full flex-col p-4">
        <div className="flex items-start gap-2.5">
          {icon}
          <div className="min-w-0 flex-1">
            <AName className="text-[15px]">{name}</AName>
            <AState className="mt-0.5 text-[13px]">{state}</AState>
          </div>
        </div>
        <div className="mt-auto flex justify-center">{orb}</div>
      </div>
    );
  }
  return (
    <div className={cn('relative flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
      <div className="flex items-start justify-between gap-2">
        {icon}
        {orb}
      </div>
      {big && (size === 't' || size === 'l') ? <p className={cn('mt-auto font-semibold leading-none tracking-[-0.03em] tabular-nums', size === 'l' ? 'text-[56px]' : 'text-[46px]')}>{big}</p> : null}
      <div className={cn('min-w-0', big && (size === 't' || size === 'l') ? 'mt-2' : size === 'w' ? '-mt-3' : 'mt-auto')}>
        <AName className={size === 'l' ? 'text-[19px]' : 'text-[17px]'}>{name}</AName>
        <AState className="mt-0.5 text-[14px]">{state}</AState>
      </div>
      {bottom ? <div className={cn(size === 'w' ? 'mt-auto' : 'mt-4')}>{bottom}</div> : null}
      {extra ? <div className="mt-3">{extra}</div> : null}
    </div>
  );
}

const TONE_TEXT: Record<string, string> = { Warm: 'Warm white', Soft: 'Soft white', Neutral: 'Neutral white', Daylight: 'Daylight' };
const toneText = (e: LightTileModel) => (e.rgb ? 'Colour' : (TONE_TEXT[toneName(e.kelvin)] ?? ''));

export function AmbientLight({ e, size, act }: TileProps<LightTileModel>) {
  const on = e.isOn && e.available;
  // Warm whites glow golden (as in the reference); only cool whites and colours change the hue.
  const color = e.rgb ?? (e.kelvin && e.kelvin > 4500 ? kelvinColor(e.kelvin) : HUE.light);
  const slide = useSlideValue({
    value: on ? (e.brightness ?? 100) : 0,
    enabled: e.available && e.dimmable,
    onCommit: (pct) => act({ type: 'brightness', pct }),
    onTap: () => undefined,
    label: `${e.name} brightness. Slide to dim`,
    valueText: on ? `${e.brightness ?? 100}%` : 'Off'
  });
  const pct = slide.live ?? (on ? (e.dimmable ? (e.brightness ?? 100) : 100) : 0);
  const lit = pct > 0;
  const level = !e.available ? 'Unavailable' : lit ? (e.dimmable ? `${Math.round(pct)}%` : 'On') : 'Off';
  const tone = lit && e.dimmable ? toneText(e) : '';
  const state = size === 't' || size === 'l' ? tone || level : tone && size !== 'xs' && size !== 's' ? `${level} · ${tone}` : lit ? (size === 's' && e.dimmable ? level : 'On') : level;
  return (
    <Glass label={e.name} className={!e.available ? 'opacity-55' : undefined} style={lit ? glowStyle(color, 0.45 + (pct / 100) * 0.55, size === 's' ? '50% 100%' : '90% 80%') : undefined}>
      <div {...slide.props} className="absolute inset-0 cursor-ew-resize rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]">
        {size !== 'xs' && size !== 's' ? <Wave color={color} level={lit ? 0.35 + (pct / 100) * 0.55 : 0} /> : null}
        <Device
          size={size}
          icon={<GlowIcon icon={BulbIcon} on={lit} color={color} px={size === 'xs' ? 24 : size === 's' ? 28 : 34} />}
          name={e.name}
          state={state}
          big={level}
          orb={<OrbButton icon={size === 'xs' ? BulbIcon : PowerIcon} label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`} on={on} color={color} isDisabled={!e.available} size={ORB[size]} onPress={() => act({ type: 'toggle' })} />}
          bottom={size !== 'xs' && size !== 's' && e.dimmable && e.available ? <LevelBar pct={pct} color={color} /> : undefined}
          extra={
            size === 'l' && e.supportsTemp && e.available ? (
              <div className="flex gap-2">
                {WHITE_TONES.map((t) => (
                  <Button
                    key={t.id}
                    variant="ghost"
                    size="sm"
                    data-tile-control=""
                    aria-label={`${e.name}: ${t.label}`}
                    aria-pressed={on && toneName(e.kelvin) === t.label}
                    onPress={() => act({ type: 'kelvin', kelvin: t.k })}
                    className={cn('h-7 min-w-0 flex-1 rounded-full px-0 text-[11px] font-semibold ring-1 ring-black/[0.05] dark:ring-white/10', on && toneName(e.kelvin) === t.label ? 'bg-black/10 dark:bg-white/20' : 'bg-black/[0.04] dark:bg-white/[0.06]')}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: kelvinColor(t.k) }} />
                    {t.label}
                  </Button>
                ))}
              </div>
            ) : null
          }
        />
      </div>
    </Glass>
  );
}

const TRACE_PX: Record<TileSize, number> = { xs: 30, s: 48, w: 42, t: 84, l: 96 };

export function AmbientSwitch({ e, size, act }: TileProps<SwitchTileModel>) {
  const on = e.isOn && e.available;
  const metered = e.powerW !== null && e.powerHistory.length > 1;
  const draw = e.powerW !== null && on ? Math.min(1, 0.35 + Math.log10(Math.max(1, e.powerW)) / 4.5) : on ? 0.6 : 0;
  const state = !e.available ? 'Unavailable' : !on ? 'Off' : e.powerW !== null ? `On · ${watts(e.powerW)}` : 'On';
  return (
    <Glass label={e.name} className={!e.available ? 'opacity-55' : undefined} style={on ? glowStyle(HUE.power, draw, size === 's' ? '50% 100%' : '90% 80%') : undefined}>
      {metered ? (
        // Metered plugs: Meter's (B) trace of the last hours instead of the wave (owner, 2026-11-21).
        <div className={cn('pointer-events-none absolute inset-x-0 bottom-0', size === 'xs' || size === 's' ? 'opacity-55' : 'opacity-90')}>
          <Sparkline values={on ? e.powerHistory : e.powerHistory.map((v, i) => (i < e.powerHistory.length - 4 ? v : 0))} width={300} height={TRACE_PX[size]} color={on ? HUE.power : HUE.idle} />
        </div>
      ) : null}
      {/* Plain switches (a wall switch): the corner glow alone at every size, no wave (owner, 2026-11-26). */}
      <Device
        size={size}
        icon={<GlowIcon icon={switchIcon(e)} on={on} color={HUE.power} px={size === 'xs' ? 24 : size === 's' ? 28 : 34} />}
        name={e.name}
        state={size === 't' || size === 'l' ? (e.energyTodayKwh !== null ? `${e.energyTodayKwh.toFixed(2)} kWh today` : on ? 'On' : 'Off') : state}
        big={!e.available ? '—' : on && e.powerW !== null ? watts(e.powerW) : on ? 'On' : 'Off'}
        orb={<OrbButton icon={size === 'xs' ? switchIcon(e) : PowerIcon} label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`} on={on} color={HUE.power} isDisabled={!e.available} size={ORB[size]} onPress={() => act({ type: 'toggle' })} />}
        bottom={size === 'w' && e.energyTodayKwh !== null ? <p className="relative text-[12px] opacity-70">{`${e.energyTodayKwh.toFixed(2)} kWh today`}</p> : undefined}
      />
    </Glass>
  );
}

export function AmbientFan({ e, size, act }: TileProps<FanTileModel>) {
  const on = e.isOn && e.available;
  const at = fanLevel(e);
  const level = e.supportsSpeed ? at / e.levels : on ? 0.7 : 0;
  const state = !e.available ? 'Unavailable' : !on ? 'Off' : `${e.supportsSpeed ? `Speed ${at}` : 'On'}${e.presetMode && size !== 's' && size !== 'xs' ? ` · ${cap(e.presetMode)}` : ''}`;
  const spin = on ? `${Math.max(0.5, 3 - level * 2.4)}s` : undefined;
  const bar =
    e.supportsSpeed && size !== 's' && size !== 'xs' && e.available ? (
      <div role="group" aria-label={`${e.name} speed`} className="flex gap-1.5">
        {Array.from({ length: e.levels }, (_, i) => (
          <Button
            key={i}
            variant="ghost"
            data-tile-control=""
            aria-label={`${e.name}: speed ${i + 1}${i + 1 === at ? ', current' : ''}`}
            aria-pressed={i + 1 === at}
            onPress={() => act({ type: 'percentage', pct: pctOfLevel(i + 1, e.levels) })}
            className="h-6 min-w-0 flex-1 rounded-full p-0"
          >
            <span className={cn('block h-2.5 w-full rounded-full', i < at ? '' : 'bg-black/10 dark:bg-white/12')} style={i < at ? { background: HUE.air, boxShadow: `0 0 10px -2px ${HUE.air}` } : undefined} />
          </Button>
        ))}
      </div>
    ) : undefined;
  return (
    <Glass label={e.name} className={!e.available ? 'opacity-55' : undefined} style={on ? glowStyle(HUE.air, 0.4 + level * 0.6, size === 's' ? '50% 100%' : '90% 80%') : undefined}>
      {size !== 'xs' && size !== 's' ? <Wave color={HUE.air} level={on ? 0.3 + level * 0.5 : 0} /> : null}
      <Device
        size={size}
        icon={<GlowIcon icon={Fan01Icon} on={on} color={HUE.air} px={size === 'xs' ? 24 : size === 's' ? 28 : 34} spin={spin} />}
        name={e.name}
        state={state}
        big={!e.available ? '—' : on ? (e.supportsSpeed ? String(at) : 'On') : 'Off'}
        orb={<OrbButton icon={size === 'xs' ? Fan01Icon : PowerIcon} label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`} on={on} color={HUE.air} isDisabled={!e.available} size={ORB[size]} onPress={() => act({ type: 'toggle' })} />}
        bottom={bar}
      />
    </Glass>
  );
}
