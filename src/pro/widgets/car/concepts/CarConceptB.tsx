/**
 * Car concept B — Expressive & immersive ("on stage"). The car stands on a card coloured by what
 * it is doing: green while charging (charge flowing down the cable), blue while driving (wheels
 * turning, speed lines), warm while the climate runs, violet when an update is ready, night blue
 * asleep, red when something is wrong. Your own photo replaces the drawing when set. Large adds
 * glass tiles and a map of where it is parked.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Download04Icon, SquareLock02Icon, SquareUnlock02Icon, ThermometerWarmIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { carLine, type ProCarModel } from '../../../lib/overviewCar';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { CarArt, CarBattery, carGlow, NoCar, ParkedMap, rangeText } from './shared';

function Stage({ m, className }: { m: ProCarModel; className?: string }) {
  return m.image ? (
    <img src={m.image} alt="" className={cn('object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]', className)} />
  ) : (
    <CarArt m={m} className={cn('drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)]', className)} />
  );
}

function Pill({ m }: { m: ProCarModel }) {
  const alert = m.alerts[0];
  if (alert)
    return (
      <p
        className={cn(
          'inline-flex max-w-full items-center gap-1 self-start rounded-full px-2 py-0.5 text-[11px] font-semibold',
          alert.tone === 'danger' ? 'bg-white text-[hsl(0_70%_42%)]' : 'bg-white/18 ring-1 ring-white/25'
        )}
      >
        <HugeiconsIcon icon={Alert02Icon} size={12} className="shrink-0" />
        <span className="truncate">{m.alerts.length > 1 ? `${alert.text} +${m.alerts.length - 1}` : alert.text}</span>
      </p>
    );
  if (m.ota.state !== 'none')
    return (
      <p className="inline-flex max-w-full items-center gap-1 self-start rounded-full bg-white/18 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/25">
        <HugeiconsIcon icon={Download04Icon} size={12} className={cn('shrink-0', m.ota.state === 'installing' && 'motion-safe:animate-bounce')} />
        <span className="truncate">{m.ota.state === 'installing' ? 'Installing update' : 'Update ready'}</span>
      </p>
    );
  return null;
}

function Glass({ label, value, icon, small = false }: { label: string; value: string; icon?: typeof Alert02Icon; small?: boolean }) {
  return (
    <div className={cn('min-w-0 rounded-xl bg-white/14 py-1.5 ring-1 ring-white/20 backdrop-blur-md', small ? 'px-2' : 'px-2.5')}>
      <p className="flex items-center gap-1 truncate text-[10px] text-white/75">
        {icon ? <HugeiconsIcon icon={icon} size={11} className="shrink-0" /> : null}
        {label}
      </p>
      <p className={cn('truncate font-semibold tabular-nums', small ? 'text-[11px]' : 'text-sm')}>{value}</p>
    </div>
  );
}

export default function CarConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProCarModel>) {
  const range = rangeText(m);
  const head = (
    <div className={cn('min-w-0 [text-shadow:0_1px_8px_rgba(0,0,0,0.2)]', size !== 'w' && 'pr-8')}>
      <p className={cn('font-semibold leading-tight', size === 's' ? 'text-lg' : 'text-2xl')}>{m.modeLabel}</p>
      <p className="truncate text-xs text-white/85">{carLine(m, size !== 'l')}</p>
    </div>
  );
  const battery = (
    <div className="min-w-0">
      <p className="mb-1 flex items-baseline justify-between gap-2">
        <span className={cn('font-semibold leading-none tabular-nums', size === 's' ? 'text-xl' : 'text-3xl')}>{m.socPct ?? '–'}%</span>
        {range ? <span className="truncate text-xs text-white/85">{range}</span> : null}
      </p>
      <CarBattery m={m} ink="light" thick={size === 'l'} />
    </div>
  );
  const tiles = [
    { label: 'Doors', value: m.locked ? 'Locked' : 'Unlocked', icon: m.locked ? SquareLock02Icon : SquareUnlock02Icon },
    m.cabinTemp !== null ? { label: m.climateOn ? 'Cabin, warming' : 'Cabin', value: `${Math.round(m.cabinTemp)}${m.tempUnit}`, icon: ThermometerWarmIcon } : null,
    m.odometer !== null ? { label: 'Odometer', value: `${m.odometer.toLocaleString()} ${m.odometerUnit}` } : null
  ].filter((t) => t !== null);

  return (
    <WidgetSurface label={m.name} ink="light" style={{ background: m.hasCar ? carGlow(m) : 'linear-gradient(155deg, hsl(215 12% 42%), hsl(220 14% 22%))' }}>
      <DetailsButton title={m.name} onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {!m.hasCar ? (
          <NoCar muted="text-white/80" />
        ) : size === 's' ? (
          <>
            {head}
            <div className="grid min-h-0 flex-1 place-items-center">
              <Stage m={m} className="h-full max-h-full w-full" />
            </div>
            {battery}
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-2">
            <div className="flex w-[44%] shrink-0 flex-col gap-1.5">
              {head}
              <Pill m={m} />
              <div className="mt-auto">{battery}</div>
            </div>
            <div className="grid min-w-0 flex-1 place-items-center pt-6">
              <Stage m={m} className="w-full" />
            </div>
          </div>
        ) : (
          <>
            {head}
            <Pill m={m} />
            <div className="grid min-h-0 flex-1 place-items-center">
              <Stage m={m} className={cn('max-h-full w-full', size === 'l' ? 'max-w-[85%]' : '')} />
            </div>
            {battery}
            {size === 'l' ? (
              <div className="grid grid-cols-3 gap-1.5">
                {m.mode !== 'driving' && m.location.lat !== null ? (
                  <div className="relative col-span-1 overflow-hidden rounded-xl ring-1 ring-white/25">
                    <ParkedMap m={m} dark className="absolute inset-0" />
                    <p className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-1.5 py-0.5 text-[10px] font-medium">{m.location.isHome ? 'Home' : m.location.place}</p>
                  </div>
                ) : null}
                {tiles.slice(0, m.mode !== 'driving' && m.location.lat !== null ? 2 : 3).map((t) => (
                  <Glass key={t.label} {...t} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {tiles.slice(0, 2).map((t) => (
                  <Glass key={t.label} {...t} small />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
