/**
 * Thermostat B · "Modes". Mode first: the modes the device has are big buttons on the tile, the
 * chosen one fills with its colour and the whole tile takes its tint. The target comes second,
 * with − / +. For homes where people switch Heat / Cool / Off far more than they fine-tune degrees.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { modeOf } from '../../../widgets/thermostat/concepts/ModeMenu';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { ClimateTileModel, TileProps, TileSize } from '../../tileTypes';
import { actionText, climateHue, fmtT, IDLE, ModeDropdown, StepButton } from './climateParts';

const ORDER = ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'];

/** The modes a size shows, in a fixed order; the current one always among them. */
function modesFor(t: ClimateTileModel, max: number): string[] {
  const all = [...t.modes].sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - ((ORDER.indexOf(b) + 99) % 99));
  if (all.length <= max) return all;
  const pick = all.slice(0, max);
  if (!pick.includes(t.mode)) pick[max - 1] = t.mode;
  return pick;
}

function ModeButton({ t, act, mode, label, iconPx, className }: { t: ClimateTileModel; act: TileProps<ClimateTileModel>['act']; mode: string; label: 'none' | 'below' | 'beside'; iconPx: number; className?: string }) {
  const info = modeOf(mode);
  const active = t.available && t.mode === mode;
  const hue = info.hue ?? IDLE;
  return (
    <Button
      variant="ghost"
      data-tile-control=""
      aria-label={`${t.name}: ${info.label}`}
      aria-pressed={active}
      isDisabled={!t.available}
      onPress={() => act({ type: 'hvac', mode })}
      className={cn(
        'h-auto w-full min-w-0 rounded-2xl p-0 font-semibold transition-[background,color,box-shadow] duration-200',
        label === 'below' ? 'flex-col gap-1 text-[11px]' : label === 'beside' ? 'justify-start gap-2 px-2.5 text-[13px]' : '',
        active ? 'text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]' : 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]',
        className
      )}
      style={active ? { background: mode === 'off' ? 'hsl(230 8% 46%)' : hue } : undefined}
    >
      <HugeiconsIcon icon={info.icon} size={iconPx} style={{ width: iconPx, height: iconPx, ...(active ? {} : { color: info.hue ?? undefined }) }} />
      {label !== 'none' ? <span className="truncate">{info.label}</span> : null}
    </Button>
  );
}

const MAX: Record<TileSize, number> = { xs: 0, s: 4, w: 4, t: 4, l: 6 };

export default function ThermoModes({ e: t, size, act }: TileProps<ClimateTileModel>) {
  const on = t.available && t.isOn;
  const hue = climateHue(t);
  const info = modeOf(t.mode);
  const tint = on ? { background: `linear-gradient(160deg, color-mix(in srgb, ${hue} 20%, var(--surface)), var(--surface) 70%)` } : undefined;
  const frame = cn(!on && 'pro-surface', on && 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]', !t.available && 'opacity-60');
  const target = on && t.target !== null ? fmtT(t.target, t.unit) : null;
  const modes = modesFor(t, MAX[size]);
  const stepper = (px: number, cls?: string) =>
    target ? (
      <div className={cn('flex items-center gap-1.5', cls)}>
        <StepButton t={t} act={act} dir={-1} size={px} />
        <p className="min-w-0 text-center font-semibold tabular-nums tracking-tight" style={{ fontSize: Math.round(px * 0.62), minWidth: px * 1.9 }}>
          {target}
        </p>
        <StepButton t={t} act={act} dir={1} size={px} />
      </div>
    ) : null;
  const Heading = ({ className }: { className?: string }) => (
    <p className={cn('font-semibold leading-none tracking-[-0.02em]', className)} style={on ? { color: hue } : undefined}>
      {t.available ? (on && t.action === 'heating' ? 'Heating' : on && t.action === 'cooling' ? 'Cooling' : info.label) : 'Unavailable'}
    </p>
  );
  const room = `Room ${fmtT(t.current, t.unit)}`;

  if (size === 'xs') {
    return (
      <TileFrame label={t.name} className={frame} style={tint}>
        <div className="flex h-full items-center gap-2.5 px-2.5">
          <ModeDropdown t={t} act={act} iconOnly className="size-11 bg-[color-mix(in_srgb,currentColor_9%,transparent)]" />
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{t.name}</TileName>
            <TileState className="text-[12px]">{target ? `${info.label} · ${target}` : actionText(t)}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={t.name} className={frame} style={tint}>
        <div className="flex h-full flex-col p-3">
          <div className="flex items-baseline gap-1.5 px-0.5">
            <Heading className="text-[17px]" />
            {target ? <span className="text-[14px] font-semibold tabular-nums opacity-70">{target}</span> : null}
          </div>
          <TileState className="mt-1 px-0.5 text-[12px]">
            {t.name} · {room}
          </TileState>
          <div className="mt-auto grid gap-1.5" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
            {modes.map((m) => (
              <ModeButton key={m} t={t} act={act} mode={m} label="none" iconPx={18} className="h-11" />
            ))}
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={t.name} className={frame} style={tint}>
        <div className="flex h-full gap-3 p-3.5 pl-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <TileName className="line-clamp-1">{t.name}</TileName>
            <TileState>{room}</TileState>
            <Heading className="mt-auto text-[22px]" />
            {stepper(30, 'mt-2 -ml-0.5') ?? <p className="mt-2 text-[13px] opacity-60">{actionText(t)}</p>}
          </div>
          <div className="grid w-[46%] shrink-0 grid-cols-2 gap-1.5" style={{ gridAutoRows: '1fr' }}>
            {modes.map((m) => (
              <ModeButton key={m} t={t} act={act} mode={m} label="below" iconPx={18} className="h-full" />
            ))}
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={t.name} className={frame} style={tint}>
        <div className="flex h-full flex-col p-3.5">
          <div className="px-0.5">
            <TileName className="line-clamp-1">{t.name}</TileName>
            <TileState>{room}</TileState>
          </div>
          <div className="mt-3 flex flex-1 flex-col gap-1.5">
            {modes.map((m) => (
              <ModeButton key={m} t={t} act={act} mode={m} label="beside" iconPx={17} className="max-h-12 flex-1" />
            ))}
          </div>
          <div className="mt-3 flex justify-center">{stepper(32) ?? <p className="py-2 text-[13px] opacity-60">{actionText(t)}</p>}</div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={t.name} className={frame} style={tint}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <TileName className="text-[17px]">{t.name}</TileName>
            <TileState>
              {room}
              {t.humidity !== null ? ` · ${t.humidity}%` : ''}
            </TileState>
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Heading className="text-[30px]" />
            <p className="mt-1.5 text-[13px] opacity-60">{actionText(t)}</p>
          </div>
          {stepper(40)}
        </div>
        <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(modes.length, 3)}, minmax(0, 1fr))` }}>
          {modes.map((m) => (
            <ModeButton key={m} t={t} act={act} mode={m} label="beside" iconPx={17} className="h-11" />
          ))}
        </div>
      </div>
    </TileFrame>
  );
}
