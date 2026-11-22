/**
 * Car concept A — Refined & minimal ("status line"). The car's state in words ("Charging",
 * "Driving", "Parked") with the one line that matters in that state, the battery as a light
 * number with a thin bar (target tick), and quiet rows for lock, climate, software and alerts.
 * Large adds where it is parked on a small map and the Lock and Climate buttons.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, Download04Icon, Location01Icon, SquareLock02Icon, SquareUnlock02Icon, ThermometerWarmIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { HoldToConfirmButton } from '../../../components/security/HoldToConfirmButton';
import { carLine, type ProCarModel } from '../../../lib/overviewCar';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useInDark } from '../../shared/useInDark';
import { CarBattery, modeIcon, NoCar, ParkedMap, rangeText, useCarActions } from './shared';

function Fact({ icon, label, value, tone }: { icon: IconSvgElement; label: string; value: string; tone?: 'warning' | 'danger' | 'accent' }) {
  return (
    <li className="flex min-w-0 items-center gap-2 py-1 text-xs">
      <HugeiconsIcon icon={icon} size={13} className={cn('shrink-0', tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'accent' ? 'text-accent' : 'text-muted')} />
      <span className={cn('truncate text-muted', value ? 'shrink-0' : 'min-w-0 flex-1')}>{label}</span>
      {value ? <span className={cn('min-w-0 flex-1 truncate text-right font-medium', tone === 'danger' && 'text-danger')}>{value}</span> : null}
    </li>
  );
}

function facts(m: ProCarModel) {
  const list: { icon: IconSvgElement; label: string; value: string; tone?: 'warning' | 'danger' | 'accent' }[] = [];
  const danger = m.alerts.filter((a) => a.tone === 'danger');
  if (danger.length) list.push({ icon: Alert02Icon, label: danger[0].text, value: '', tone: 'danger' });
  if (m.ota.state !== 'none') list.push({ icon: Download04Icon, label: m.ota.state === 'installing' ? 'Installing update' : 'Update ready', value: '', tone: 'accent' });
  if (m.mode !== 'driving') list.push({ icon: Location01Icon, label: m.location.isHome ? 'At home' : `At ${m.location.place}`, value: '' });
  list.push({ icon: m.locked ? SquareLock02Icon : SquareUnlock02Icon, label: 'Doors', value: m.locked ? 'Locked' : 'Unlocked', tone: m.locked ? undefined : 'warning' });
  if (m.cabinTemp !== null) list.push({ icon: ThermometerWarmIcon, label: m.climateOn ? 'Climate on' : 'Cabin', value: `${Math.round(m.cabinTemp)}${m.tempUnit}` });
  for (const a of m.alerts.filter((x) => x.tone === 'warning')) list.push({ icon: Alert02Icon, label: a.text, value: '', tone: 'warning' });
  return list;
}

export default function CarConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProCarModel>) {
  const actions = useCarActions(m);
  const { ref, isDark } = useInDark<HTMLDivElement>();
  const range = rangeText(m);
  const all = facts(m);
  const head = (
    <div className={cn('min-w-0', size !== 'w' && 'pr-8')}>
      <p className="flex items-center gap-1 text-[11px] text-muted">
        <HugeiconsIcon icon={modeIcon(m)} size={12} className="shrink-0" />
        <span className="truncate">{m.name}</span>
        {m.alerts.length > 0 || m.ota.state === 'available' ? (
          <span className={cn('size-1.5 shrink-0 rounded-full', m.alerts.some((a) => a.tone === 'danger') ? 'bg-danger' : m.alerts.length ? 'bg-warning' : 'bg-accent')} />
        ) : null}
      </p>
      <p className={cn('font-semibold leading-tight', size === 's' ? 'text-base' : 'text-xl')}>{m.modeLabel}</p>
      <p className="truncate text-xs text-muted">{carLine(m, size !== 'l')}</p>
    </div>
  );
  const battery = (
    <div className="min-w-0">
      <p className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-extralight leading-none tracking-tighter tabular-nums',
            size === 's' ? 'text-[30px]' : 'text-[40px]',
            'leading-none',
            m.socPct !== null && m.socPct < 15 && 'text-danger'
          )}
        >
          {m.socPct ?? '–'}%
        </span>
        {range ? <span className="truncate text-xs text-muted">{range}</span> : null}
      </p>
      <div className="mt-1.5">
        <CarBattery m={m} />
      </div>
    </div>
  );
  const hasMap = size === 'l' && m.mode !== 'driving' && m.location.lat !== null;
  // With the map at Large, place, doors and cabin are on the map and buttons: keep alerts and updates.
  const shown = hasMap
    ? all
        .filter((f) => f.tone === 'danger' || f.tone === 'warning' || f.tone === 'accent')
        .filter((f) => f.icon !== SquareUnlock02Icon)
        .slice(0, 1)
    : all.slice(0, size === 't' ? 4 : 3);

  return (
    <WidgetSurface label={m.name} className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title={m.name} onPress={onOpenDetails} />
      <div ref={ref} className="flex h-full min-h-0 flex-col gap-2.5 p-3.5">
        {!m.hasCar ? (
          <NoCar />
        ) : size === 's' ? (
          <>
            {head}
            <div className="mt-auto">{battery}</div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex w-[46%] shrink-0 flex-col justify-between">
              {head}
              {battery}
            </div>
            <ul aria-label="Car status" className="mt-6 flex min-w-0 flex-1 flex-col justify-end divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {all.slice(0, 3).map((f) => (
                <Fact key={f.label} {...f} />
              ))}
            </ul>
          </div>
        ) : (
          <>
            {head}
            {battery}
            {hasMap ? (
              <div className="relative min-h-16 flex-1 overflow-hidden rounded-2xl">
                <ParkedMap m={m} dark={isDark} className="absolute inset-0" />
                <p className="absolute left-2 top-2 rounded-full bg-[var(--surface)]/90 px-2 py-0.5 text-[10px] font-medium shadow-sm">
                  {[m.location.isHome ? 'Home' : m.location.place, m.location.sinceText].filter(Boolean).join(' · ')}
                </p>
              </div>
            ) : null}
            <ul aria-label="Car status" className={cn('flex min-w-0 flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]', size === 't' && 'mt-auto')}>
              {shown.map((f) => (
                <Fact key={f.label} {...f} />
              ))}
            </ul>
            {size === 'l' ? (
              <div className={cn('flex gap-2', !hasMap && 'mt-auto')}>
                {m.locked ? (
                  <HoldToConfirmButton
                    icon={SquareUnlock02Icon}
                    label="Unlock"
                    ariaLabel={`Unlock ${m.name} (press and hold)`}
                    isPending={actions.busy === 'lock'}
                    isDisabled={m.mode === 'driving'}
                    onConfirm={() => void actions.setLocked(false)}
                    className="h-9 flex-1 text-xs"
                  />
                ) : (
                  <Button size="sm" variant="primary" isPending={actions.busy === 'lock'} onPress={() => void actions.setLocked(true)} className="h-9 flex-1 text-xs">
                    <HugeiconsIcon icon={SquareLock02Icon} size={14} />
                    Lock
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={m.climateOn ? 'primary' : 'secondary'}
                  isPending={actions.busy === 'climate'}
                  onPress={() => void actions.toggleClimate()}
                  className="h-9 flex-1 text-xs"
                  isDisabled={m.mode === 'driving'}
                >
                  <HugeiconsIcon icon={ThermometerWarmIcon} size={14} />
                  {m.climateOn ? 'Stop climate' : 'Climate'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
