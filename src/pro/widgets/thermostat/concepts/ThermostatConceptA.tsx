/**
 * Thermostat concept A — Refined & minimal. The room temperature is the headline in a light
 * weight; one line says what the system is doing, its dot in the action colour; −/+ set the
 * target. Small: now + stepper. Wide: now | target + stepper. Tall: adds humidity. Large: every room.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { ThermometerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProThermostatItem, ProThermostatModel } from '../../../lib/overviewThermostat';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { actionHue, actionLine, deg, Stepper } from './shared';

function Now({ t, big }: { t: ProThermostatItem; big?: boolean }) {
  const hue = actionHue(t.action);
  return (
    <div className="min-w-0">
      <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', big ? 'text-[60px]' : 'text-[48px]')}>{deg(t.current)}</p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium">
        <span className="size-2 shrink-0 rounded-full" style={{ background: hue ?? 'var(--muted)' }} />
        <span className="truncate">{actionLine(t)}</span>
      </p>
    </div>
  );
}

export default function ThermostatConceptA({ model, size, onOpenDetails }: DesignedWidgetProps<ProThermostatModel>) {
  const t = model.primary;
  return (
    <WidgetSurface label="Thermostat" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Thermostat" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col p-3.5">
        {!t ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={ThermometerIcon} size={22} />
            <p className="text-sm font-medium">No thermostats</p>
          </div>
        ) : null}

        {t && size === 's' ? (
          <div className="flex h-full flex-col justify-between">
            <Now t={t} />
            <Stepper t={t} size="sm" />
          </div>
        ) : null}

        {t && size === 'w' ? (
          <div className="flex h-full items-end justify-between gap-3">
            <Now t={t} />
            <div className="flex flex-col items-end gap-2">
              <p className="text-right text-xs text-muted">
                Target <span className="block text-2xl font-semibold text-foreground tabular-nums">{deg(t.target)}</span>
              </p>
              <Stepper t={t} />
            </div>
          </div>
        ) : null}

        {t && size === 't' ? (
          <div className="flex h-full flex-col gap-2">
            <p className="truncate pr-8 text-xs text-muted">{t.roomName}</p>
            <Now t={t} big />
            {t.humidity !== null ? <p className="text-xs text-muted">{t.humidity}% humidity</p> : null}
            <div className="mt-auto flex items-center justify-between">
              <span className="text-2xl font-semibold tabular-nums">{deg(t.target)}</span>
              <Stepper t={t} size="sm" />
            </div>
          </div>
        ) : null}

        {t && size === 'l' ? (
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-end justify-between gap-3 pr-8">
              <Now t={t} big />
              <Stepper t={t} />
            </div>
            <ul aria-label="Rooms" className="mt-auto flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {model.items.slice(0, 4).map((i) => (
                <li key={i.entityId} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: actionHue(i.action) ?? 'var(--muted)' }} />
                  <span className="min-w-0 flex-1 truncate">{i.roomName}</span>
                  <span className="tabular-nums">{deg(i.current)}</span>
                  <span className="w-12 text-right text-xs tabular-nums text-muted">→ {deg(i.target)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
