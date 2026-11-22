/**
 * Thermostat A · "Scale". The thermostat as a ruler: the room's temperature is a dot on the scale,
 * the target a pin you drag, and the stretch between them fills in the colour of what it's doing
 * (orange heating up to the pin, blue cooling down to it). The gap is the work left to do. Tall
 * stands the scale up like a thermometer. − / + for exact steps; mode in a menu from Wide up.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { modeOf } from '../../../widgets/thermostat/concepts/ModeMenu';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { ClimateTileModel, TileProps } from '../../tileTypes';
import { actionText, clampTarget, climateHue, fmtT, ModeDropdown, StepButton } from './climateParts';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function Ruler({ t, act, vertical, labels = 0, knob = 18, className }: { t: ClimateTileModel; act: TileProps<ClimateTileModel>['act']; vertical?: boolean; labels?: number; knob?: number; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<number | null>(null);
  const dragging = useRef(false);
  const on = t.available && t.isOn && t.target !== null;
  const hue = climateHue(t);
  const [lo, hi] = [t.min, t.max];
  const pos = (v: number) => `${clamp01((v - lo) / (hi - lo)) * 100}%`;
  const tgt = live ?? t.target;
  const cur = t.current;
  const fromPointer = (ev: PointerEvent<HTMLElement>) => {
    const r = inner.current!.getBoundingClientRect();
    const f = vertical ? 1 - (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width;
    return clampTarget(t, lo + clamp01(f) * (hi - lo));
  };
  const ticks: number[] = [];
  for (let d = Math.ceil(lo); d <= hi; d++) ticks.push(d);
  const along = (v: number) => (vertical ? { bottom: pos(v) } : { left: pos(v) });
  const span = cur !== null && tgt !== null ? [Math.min(cur, tgt), Math.max(cur, tgt)] : null;
  const handlers = on
    ? {
        role: 'slider' as const,
        tabIndex: 0,
        'aria-label': `${t.name} target temperature`,
        'aria-valuemin': lo,
        'aria-valuemax': hi,
        'aria-valuenow': tgt ?? undefined,
        'aria-valuetext': fmtT(tgt, t.unit),
        'aria-orientation': vertical ? ('vertical' as const) : ('horizontal' as const),
        onPointerDown: (ev: PointerEvent<HTMLElement>) => {
          if (ev.button !== 0) return;
          dragging.current = true;
          ev.currentTarget.setPointerCapture(ev.pointerId);
          setLive(fromPointer(ev));
        },
        onPointerMove: (ev: PointerEvent<HTMLElement>) => {
          if (dragging.current) setLive(fromPointer(ev));
        },
        onPointerUp: () => {
          if (dragging.current && live !== null && live !== t.target) act({ type: 'target', value: live });
          dragging.current = false;
          setLive(null);
        },
        onPointerCancel: () => {
          dragging.current = false;
          setLive(null);
        },
        onKeyDown: (ev: KeyboardEvent<HTMLElement>) => {
          const up = ev.key === 'ArrowRight' || ev.key === 'ArrowUp';
          const down = ev.key === 'ArrowLeft' || ev.key === 'ArrowDown';
          if (!up && !down) return;
          ev.preventDefault();
          act({ type: 'target', value: clampTarget(t, (t.target ?? 21) + (up ? t.step : -t.step)) });
        }
      }
    : { 'aria-hidden': true };
  return (
    <div
      data-tile-control=""
      className={cn('relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]', on && 'cursor-pointer', vertical ? 'h-full' : 'w-full', className)}
      style={{ touchAction: vertical ? 'none' : 'pan-y', ...(vertical ? { width: knob + (labels ? 26 : 8) } : { height: knob + (labels ? 18 : 4) }) }}
      {...handlers}
    >
      <div
        ref={inner}
        className="absolute"
        style={vertical ? { top: knob / 2, bottom: knob / 2, right: knob / 2, width: 0 } : { left: knob / 2, right: knob / 2, top: knob / 2, height: 0 }}
      >
        {/* track */}
        <div className={cn('absolute rounded-full bg-current opacity-[0.1]', vertical ? '-left-[3px] inset-y-0 w-1.5' : '-top-[3px] inset-x-0 h-1.5')} />
        {/* the work left: current → target */}
        {on && span ? (
          <div
            className={cn('absolute rounded-full transition-[left,right,top,bottom] duration-150', vertical ? '-left-[3px] w-1.5' : '-top-[3px] h-1.5')}
            style={vertical ? { bottom: pos(span[0]), top: `calc(100% - ${pos(span[1])})`, background: hue } : { left: pos(span[0]), right: `calc(100% - ${pos(span[1])})`, background: hue }}
          />
        ) : null}
        {/* degree ticks */}
        {ticks.map((d) => (
          <span
            key={d}
            aria-hidden
            className={cn('absolute bg-current', d % 5 ? 'opacity-[0.18]' : 'opacity-40')}
            style={vertical ? { ...along(d), left: -knob / 2 - 2 - (d % 5 ? 4 : 7), width: d % 5 ? 4 : 7, height: 1 } : { ...along(d), top: knob / 2 + 1, width: 1, height: d % 5 ? 4 : 7 }}
          />
        ))}
        {labels
          ? ticks
              .filter((d) => d % labels === 0)
              .map((d) => (
                <span
                  key={`l${d}`}
                  aria-hidden
                  className="absolute text-[10px] font-medium tabular-nums opacity-50"
                  style={vertical ? { ...along(d), right: knob / 2 + 12, transform: 'translateY(50%)' } : { ...along(d), top: knob / 2 + 8, transform: 'translateX(-50%)' }}
                >
                  {d}
                </span>
              ))
          : null}
        {/* the room now */}
        {cur !== null ? (
          <span
            aria-hidden
            className="absolute size-2.5 rounded-full border-2 border-current bg-[var(--surface)]"
            style={{ ...along(cur), [vertical ? 'left' : 'top']: -5, transform: vertical ? 'translateY(50%)' : 'translateX(-50%)' }}
          />
        ) : null}
        {/* the target pin */}
        {on && tgt !== null ? (
          <span
            aria-hidden
            className="absolute rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-[left,bottom] duration-75"
            style={{ ...along(tgt), [vertical ? 'left' : 'top']: -knob / 2, width: knob, height: knob, border: `${Math.max(3, Math.round(knob / 5))}px solid ${hue}`, transform: vertical ? 'translateY(50%)' : 'translateX(-50%)' }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function ThermoScale({ e: t, size, act }: TileProps<ClimateTileModel>) {
  const on = t.available && t.isOn;
  const hue = climateHue(t);
  const big = !t.available ? '—' : !on ? 'Off' : t.target !== null ? fmtT(t.target, t.unit) : modeOf(t.mode).label;
  const now = `Now ${fmtT(t.current, t.unit)}`;
  const state = actionText(t);
  const Big = ({ className }: { className?: string }) => (
    <p className={cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', !on && 'text-muted', className)} style={on ? { color: hue } : undefined}>
      {big}
    </p>
  );
  const frame = cn('pro-surface', !t.available && 'opacity-60');

  if (size === 'xs') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full flex-col justify-center gap-1.5 px-3.5">
          <div className="flex items-baseline gap-2">
            <TileName className="line-clamp-1 flex-1 truncate text-[14px]">{t.name}</TileName>
            <Big className="text-[15px] tracking-tight" />
          </div>
          <Ruler t={t} act={act} knob={14} />
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full flex-col p-3.5">
          <TileName className="line-clamp-1">{t.name}</TileName>
          <TileState>{on ? now : state}</TileState>
          <div className="mt-auto flex items-center gap-1.5">
            <Big className="flex-1 text-[26px]" />
            <StepButton t={t} act={act} dir={-1} size={28} />
            <StepButton t={t} act={act} dir={1} size={28} />
          </div>
          <Ruler t={t} act={act} className="mt-2" knob={16} />
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full flex-col p-4 pb-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <TileName className="line-clamp-1">{t.name}</TileName>
              <TileState>{state}</TileState>
            </div>
            <ModeDropdown t={t} act={act} />
          </div>
          <div className="mt-auto flex items-baseline gap-2">
            <Big className="text-[30px]" />
            {on ? <span className="text-[13px] opacity-60">{now}</span> : null}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <StepButton t={t} act={act} dir={-1} size={28} />
            <Ruler t={t} act={act} className="flex-1" knob={16} />
            <StepButton t={t} act={act} dir={1} size={28} />
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full flex-col p-4">
          <TileName className="line-clamp-1">{t.name}</TileName>
          <TileState>{on ? modeOf(t.mode).label : state}</TileState>
          <div className="flex min-h-0 flex-1 items-stretch gap-3 py-3">
            <Ruler t={t} act={act} vertical labels={5} knob={18} />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <Big className="text-[28px]" />
              <p className="text-[12px] leading-tight opacity-60">{on ? now : fmtT(t.current, t.unit)}</p>
              {t.humidity !== null ? <p className="text-[12px] leading-tight opacity-60">{t.humidity}% humidity</p> : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-1">
            <StepButton t={t} act={act} dir={-1} size={32} />
            <ModeDropdown t={t} act={act} iconOnly />
            <StepButton t={t} act={act} dir={1} size={32} />
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={t.name} className={frame}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TileName className="text-[17px]">{t.name}</TileName>
            <TileState>{state}</TileState>
          </div>
          <ModeDropdown t={t} act={act} />
        </div>
        <div className="mt-auto flex items-end gap-4">
          <Big className="text-[44px]" />
          <div className="pb-1 text-[13px] leading-snug opacity-60">
            <p>{now}</p>
            {t.humidity !== null ? <p>{t.humidity}% humidity</p> : null}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <StepButton t={t} act={act} dir={-1} size={36} />
          <Ruler t={t} act={act} className="flex-1" labels={2} knob={22} />
          <StepButton t={t} act={act} dir={1} size={36} />
        </div>
      </div>
    </TileFrame>
  );
}
