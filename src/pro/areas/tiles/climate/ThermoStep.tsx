/**
 * Thermostat C · "Big step". One huge number, the target. Tap the top half of it to go up a step,
 * the bottom half to go down; faint chevrons say so. The room temperature and what it's doing sit
 * small underneath. Off: the number becomes a big "Turn on". Nothing to aim at but the number.
 */
import type { CSSProperties } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, PowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { modeOf } from '../../../widgets/thermostat/concepts/ModeMenu';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { ClimateTileModel, TileProps } from '../../tileTypes';
import { actionText, clampTarget, climateHue, fmtT, ModeDropdown } from './climateParts';

/** The number with its two tap halves. `px` is the digits' font size. */
function StepNumber({ t, act, px, className }: { t: ClimateTileModel; act: TileProps<ClimateTileModel>['act']; px: number; className?: string }) {
  const on = t.available && t.isOn;
  const hue = climateHue(t);
  if (!on || t.target === null) {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        {t.available ? (
          <Button
            variant="ghost"
            data-tile-control=""
            aria-label={`${t.name}: turn on`}
            onPress={() => act({ type: 'toggle' })}
            className="h-auto min-w-0 flex-col gap-1 rounded-3xl px-4 py-2 font-semibold text-muted"
            style={{ fontSize: Math.round(px * 0.42) }}
          >
            <HugeiconsIcon icon={PowerIcon} size={Math.round(px * 0.6)} style={{ width: Math.round(px * 0.6), height: Math.round(px * 0.6) }} />
            {t.isOn ? modeOf(t.mode).label : 'Turn on'}
          </Button>
        ) : (
          <p className="font-semibold text-muted" style={{ fontSize: px }}>
            —
          </p>
        )}
      </div>
    );
  }
  const [whole, frac] = t.target.toFixed(1).split('.');
  const at = t.target;
  const chev = Math.max(14, Math.round(px * 0.28));
  const half = (dir: 1 | -1) => {
    const blocked = dir > 0 ? at >= t.max : at <= t.min;
    return (
      <Button
        variant="ghost"
        data-tile-control=""
        aria-label={`${t.name}: ${dir > 0 ? 'raise' : 'lower'} the target to ${fmtT(clampTarget(t, at + dir * t.step), t.unit)}`}
        isDisabled={blocked}
        onPress={() => act({ type: 'target', value: clampTarget(t, at + dir * t.step) })}
        className={cn(
          'absolute inset-x-0 h-1/2 min-w-0 rounded-none p-0 data-[pressed=true]:bg-[color-mix(in_srgb,var(--step-hue)_14%,transparent)] data-[hovered=true]:bg-[color-mix(in_srgb,var(--step-hue)_7%,transparent)]',
          dir > 0 ? 'top-0 items-start justify-center pt-0.5 data-[pressed=true]:[&>svg]:-translate-y-0.5' : 'bottom-0 items-end justify-center pb-0.5 data-[pressed=true]:[&>svg]:translate-y-0.5'
        )}
        style={{ '--step-hue': hue } as CSSProperties}
      >
        <HugeiconsIcon icon={dir > 0 ? ArrowUp01Icon : ArrowDown01Icon} size={chev} className="opacity-35 transition-transform" style={{ width: chev, height: chev }} />
      </Button>
    );
  };
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <p aria-hidden className="pointer-events-none flex items-start font-semibold leading-none tracking-[-0.05em] tabular-nums" style={{ fontSize: px, color: hue }}>
        {whole}
        <span className="mt-[0.08em] text-[0.42em] tracking-normal">
          .{frac}
          {t.unit}
        </span>
      </p>
      {half(1)}
      {half(-1)}
    </div>
  );
}

export default function ThermoStep({ e: t, size, act }: TileProps<ClimateTileModel>) {
  const on = t.available && t.isOn;
  const hue = climateHue(t);
  const frame = cn('pro-surface', !t.available && 'opacity-60');
  const state = actionText(t);
  const room = `Room ${fmtT(t.current, t.unit)}`;
  const Dot = () => <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: hue, boxShadow: on && t.action !== 'idle' ? `0 0 8px ${hue}` : undefined }} />;

  if (size === 'xs') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full items-center gap-2 pl-3.5 pr-1">
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{t.name}</TileName>
            <TileState className="flex items-center gap-1.5 text-[12px]">
              <Dot />
              <span className="truncate">{on ? fmtT(t.current, t.unit) : state}</span>
            </TileState>
          </div>
          <StepNumber t={t} act={act} px={26} className="h-full w-[62px] shrink-0" />
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-1.5 px-3.5 pt-3">
            <Dot />
            <TileName className="line-clamp-1 flex-1 truncate text-[14px]">{t.name}</TileName>
          </div>
          <StepNumber t={t} act={act} px={46} className="min-h-0 flex-1" />
          <TileState className="px-3.5 pb-3 text-center text-[12px]">{on ? room : state}</TileState>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full">
          <StepNumber t={t} act={act} px={60} className="w-[52%] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-4 pr-4">
            <div className="min-w-0">
              <TileName className="line-clamp-1">{t.name}</TileName>
              <TileState className="flex items-center gap-1.5">
                <Dot />
                <span className="truncate">{state}</span>
              </TileState>
            </div>
            <p className="text-[13px] opacity-60">{room}</p>
            <ModeDropdown t={t} act={act} className="self-start" />
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={t.name} className={frame}>
        <div className="flex h-full flex-col">
          <div className="px-4 pt-4">
            <TileName className="line-clamp-1">{t.name}</TileName>
            <TileState className="flex items-center gap-1.5">
              <Dot />
              <span className="truncate">{state}</span>
            </TileState>
          </div>
          <StepNumber t={t} act={act} px={58} className="min-h-0 flex-1" />
          <div className="flex items-center justify-between gap-2 px-4 pb-4">
            <span className="text-[13px] opacity-60">{room}</span>
            <ModeDropdown t={t} act={act} iconOnly />
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={t.name} className={frame}>
      <div className="flex h-full">
        <StepNumber t={t} act={act} px={96} className="w-[58%] shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 py-5 pr-5">
          <div className="min-w-0">
            <TileName className="text-[17px]">{t.name}</TileName>
            <TileState className="flex items-center gap-1.5">
              <Dot />
              <span className="truncate">{state}</span>
            </TileState>
          </div>
          <dl className="mt-auto grid gap-2 text-[13px]">
            <div>
              <dt className="opacity-55">Room</dt>
              <dd className="text-[20px] font-semibold tabular-nums">{fmtT(t.current, t.unit)}</dd>
            </div>
            {t.humidity !== null ? (
              <div>
                <dt className="opacity-55">Humidity</dt>
                <dd className="text-[20px] font-semibold tabular-nums">{t.humidity}%</dd>
              </div>
            ) : null}
          </dl>
          <ModeDropdown t={t} act={act} className="self-start" />
        </div>
      </div>
    </TileFrame>
  );
}
