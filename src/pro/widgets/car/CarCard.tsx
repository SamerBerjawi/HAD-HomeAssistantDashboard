/**
 * Car card — the owner's choice (2026-11-20): concept A's layout ("status line": the state in
 * words and the one line that matters, the battery as a light number with a target bar, quiet rows)
 * on concept B's colours (the card is coloured by what the car is doing: green charging, blue
 * driving, warm warming up, violet update ready, night asleep, red when something is wrong).
 * The climate button is on every size (icon only where space is short) and, like unlocking, needs
 * a press and hold so it never starts by accident. Large adds the parked map and Lock.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, Download04Icon, Location01Icon, SnowflakeIcon, SquareLock02Icon, SquareUnlock02Icon, ThermometerWarmIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { carLine, type ProCarModel } from '../../lib/overviewCar';
import { HoldButton } from '../shared/HoldButton';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { CarBattery, carGlow, modeIcon, NoCar, ParkedMap, rangeText, useCarActions } from './concepts/shared';

type Tone = 'warning' | 'danger' | 'accent';
const TONE: Record<Tone, string> = { danger: 'text-[hsl(0_100%_85%)]', warning: 'text-[hsl(45_100%_75%)]', accent: 'text-[hsl(265_100%_88%)]' };
const GLASS = 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25';

function Fact({ icon, label, value, tone }: { icon: IconSvgElement; label: string; value: string; tone?: Tone }) {
  return (
    <li className="flex min-w-0 items-center gap-2 py-1 text-xs">
      <HugeiconsIcon icon={icon} size={13} className={cn('shrink-0', tone ? TONE[tone] : 'text-white/75')} />
      <span className={cn('truncate', tone ? cn('font-medium', TONE[tone]) : 'text-white/80', value ? 'shrink-0' : 'min-w-0 flex-1')}>{label}</span>
      {value ? <span className="min-w-0 flex-1 truncate text-right font-medium">{value}</span> : null}
    </li>
  );
}

function facts(m: ProCarModel) {
  const list: { icon: IconSvgElement; label: string; value: string; tone?: Tone }[] = [];
  const danger = m.alerts.filter((a) => a.tone === 'danger');
  if (danger.length) list.push({ icon: Alert02Icon, label: danger[0].text, value: '', tone: 'danger' });
  if (m.ota.state !== 'none') list.push({ icon: Download04Icon, label: m.ota.state === 'installing' ? 'Installing update' : 'Update ready', value: '', tone: 'accent' });
  if (m.mode !== 'driving') list.push({ icon: Location01Icon, label: m.location.isHome ? 'At home' : `At ${m.location.place}`, value: '' });
  list.push({ icon: m.locked ? SquareLock02Icon : SquareUnlock02Icon, label: 'Doors', value: m.locked ? 'Locked' : 'Unlocked', tone: m.locked ? undefined : 'warning' });
  if (m.cabinTemp !== null) list.push({ icon: ThermometerWarmIcon, label: m.climateOn ? 'Climate on' : 'Cabin', value: `${Math.round(m.cabinTemp)}${m.tempUnit}` });
  for (const a of m.alerts.filter((x) => x.tone === 'warning')) list.push({ icon: Alert02Icon, label: a.text, value: '', tone: 'warning' });
  return list;
}

/** Start or stop the climate: press and hold, at every size. */
function ClimateButton({ m, a, iconOnly, className }: { m: ProCarModel; a: ReturnType<typeof useCarActions>; iconOnly: boolean; className?: string }) {
  const cooling = m.modeLabel === 'Cooling down' || (m.outdoorTemp !== null && m.outdoorTemp > 24);
  return (
    <HoldButton
      icon={cooling ? SnowflakeIcon : ThermometerWarmIcon}
      label={m.climateOn ? 'Stop climate' : 'Start climate'}
      ariaLabel={m.climateOn ? `Stop ${m.name} climate` : `Start ${m.name} climate`}
      iconOnly={iconOnly}
      isPending={a.busy === 'climate'}
      isDisabled={m.mode === 'driving'}
      onConfirm={() => void a.toggleClimate()}
      fillClassName={m.climateOn ? 'bg-black/15' : 'bg-white/35'}
      className={cn('text-xs font-semibold', iconOnly ? 'size-9 min-w-0 rounded-full' : 'h-9', m.climateOn ? 'bg-white text-[hsl(18_80%_40%)] shadow-sm hover:bg-white/90' : GLASS, className)}
    />
  );
}

export default function CarCard({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProCarModel>) {
  const actions = useCarActions(m);
  const range = rangeText(m);
  const all = facts(m);
  const head = (
    <div className={cn('min-w-0 [text-shadow:0_1px_8px_rgba(0,0,0,0.18)]', size !== 'w' && 'pr-8')}>
      <p className="flex items-center gap-1 text-[11px] text-white/80">
        <HugeiconsIcon icon={modeIcon(m)} size={12} className="shrink-0" />
        <span className="truncate">{m.name}</span>
        {m.alerts.length > 0 || m.ota.state === 'available' ? (
          <span className={cn('size-1.5 shrink-0 rounded-full', m.alerts.some((x) => x.tone === 'danger') ? 'bg-white' : m.alerts.length ? 'bg-[hsl(45_100%_70%)]' : 'bg-[hsl(265_100%_85%)]')} />
        ) : null}
      </p>
      <p className={cn('font-semibold leading-tight', size === 's' ? 'text-base' : 'text-xl')}>{m.modeLabel}</p>
      <p className="truncate text-xs text-white/85">{carLine(m, size !== 'l')}</p>
    </div>
  );
  const percent = (
    <p className="flex min-w-0 items-baseline gap-1.5">
      <span className={cn('font-extralight tracking-tighter tabular-nums', size === 's' ? 'text-[30px]' : 'text-[40px]', 'leading-none')}>{m.socPct ?? '–'}%</span>
      {range ? <span className="truncate text-xs text-white/85">{range}</span> : null}
    </p>
  );
  const battery = (
    <div className="min-w-0">
      {percent}
      <div className="mt-1.5">
        <CarBattery m={m} ink="light" />
      </div>
    </div>
  );
  const hasMap = size === 'l' && m.mode !== 'driving' && m.location.lat !== null;
  // With the map at Large, place, doors and cabin are on the map and buttons: keep alerts and updates.
  const shown = hasMap ? all.filter((f) => f.tone && f.icon !== SquareUnlock02Icon).slice(0, 1) : all.slice(0, size === 't' ? 3 : 2);

  return (
    <WidgetSurface label={m.name} ink="light" style={{ background: m.hasCar ? carGlow(m) : 'linear-gradient(155deg, hsl(215 12% 42%), hsl(220 14% 22%))' }}>
      <DetailsButton title={m.name} onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2.5 p-3.5">
        {!m.hasCar ? (
          <NoCar muted="text-white/80" />
        ) : size === 's' ? (
          <>
            {head}
            <div className="mt-auto min-w-0">
              <div className="flex items-end justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[30px] font-extralight leading-none tracking-tighter tabular-nums">{m.socPct ?? '–'}%</p>
                  {range ? <p className="mt-0.5 text-[11px] leading-none text-white/85">{range}</p> : null}
                </div>
                <ClimateButton m={m} a={actions} iconOnly />
              </div>
              <div className="mt-1.5">
                <CarBattery m={m} ink="light" />
              </div>
            </div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex w-[46%] shrink-0 flex-col justify-between">
              {head}
              {battery}
            </div>
            <div className="mt-6 flex min-w-0 flex-1 flex-col justify-end gap-1.5">
              <ul aria-label="Car status" className="flex min-w-0 flex-col divide-y divide-white/20">
                {all.slice(0, 2).map((f) => (
                  <Fact key={f.label} {...f} />
                ))}
              </ul>
              <ClimateButton m={m} a={actions} iconOnly={false} className="w-full" />
            </div>
          </div>
        ) : (
          <>
            {head}
            {battery}
            {hasMap ? (
              <div className="relative min-h-16 flex-1 overflow-hidden rounded-2xl ring-1 ring-white/20">
                <ParkedMap m={m} dark className="absolute inset-0" />
                <p className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                  {[m.location.isHome ? 'Home' : m.location.place, m.location.sinceText].filter(Boolean).join(' · ')}
                </p>
              </div>
            ) : null}
            <ul aria-label="Car status" className={cn('flex min-w-0 flex-col divide-y divide-white/20', !hasMap && 'mt-auto')}>
              {shown.map((f) => (
                <Fact key={f.label} {...f} />
              ))}
            </ul>
            <div className="flex gap-2">
              {size === 'l' ? (
                m.locked ? (
                  <HoldButton
                    icon={SquareUnlock02Icon}
                    label="Unlock"
                    ariaLabel={`Unlock ${m.name}`}
                    isPending={actions.busy === 'lock'}
                    isDisabled={m.mode === 'driving'}
                    onConfirm={() => void actions.setLocked(false)}
                    className={cn('h-9 flex-1 text-xs font-semibold', GLASS)}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    isPending={actions.busy === 'lock'}
                    onPress={() => void actions.setLocked(true)}
                    className="h-9 flex-1 bg-white text-xs font-semibold text-[hsl(222_50%_25%)] shadow-sm hover:bg-white/90"
                  >
                    <HugeiconsIcon icon={SquareLock02Icon} size={14} />
                    Lock
                  </Button>
                )
              ) : null}
              <ClimateButton m={m} a={actions} iconOnly={false} className="flex-1" />
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
