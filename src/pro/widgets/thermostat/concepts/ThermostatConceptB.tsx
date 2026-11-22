/**
 * Thermostat concept B — Expressive & immersive ("climate"). The card is the air: a warm ember
 * gradient while heating, icy blue while cooling, calm slate when idle, dim when off. The target
 * is the big number; the room temperature sits under it. Large glass −/+ set the target.
 * Small: target + stepper. Wide: target | big vertical stepper. Tall: adds humidity. Large: + rooms.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { FireIcon, SnowIcon, ThermometerIcon } from '@hugeicons/core-free-icons';
import { ACTION_LABEL, type ProThermostatItem, type ProThermostatModel } from '../../../lib/overviewThermostat';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { deg, Stepper } from './shared';

function air(t: ProThermostatItem | null): string {
  if (!t || t.action === 'off') return 'linear-gradient(160deg, hsl(220 10% 30%), hsl(225 12% 16%))';
  if (t.action === 'heating') return 'radial-gradient(120% 90% at 10% 100%, hsl(18 95% 58%), transparent 70%), linear-gradient(160deg, hsl(32 90% 52%), hsl(355 70% 38%))';
  if (t.action === 'cooling') return 'radial-gradient(120% 90% at 90% 0%, hsl(190 95% 70%), transparent 65%), linear-gradient(160deg, hsl(205 85% 52%), hsl(225 70% 34%))';
  if (t.action === 'drying' || t.action === 'fan') return 'linear-gradient(160deg, hsl(175 55% 45%), hsl(200 45% 30%))';
  return 'linear-gradient(160deg, hsl(215 22% 46%), hsl(225 22% 28%))';
}

function Big({ t, size }: { t: ProThermostatItem; size: string }) {
  const icon = t.action === 'heating' ? FireIcon : t.action === 'cooling' ? SnowIcon : ThermometerIcon;
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-xs font-medium text-white/85">
        <HugeiconsIcon icon={icon} size={13} />
        {t.action === 'off' ? 'Off' : ACTION_LABEL[t.action]}
      </p>
      <p className={size === 'l' ? 'text-6xl font-semibold leading-none tracking-tight tabular-nums' : 'text-5xl font-semibold leading-none tracking-tight tabular-nums'}>{deg(t.target)}</p>
      <p className="mt-1 truncate text-xs text-white/80 tabular-nums">
        Now {deg(t.current)}
        {size !== 's' && size !== 'w' && t.humidity !== null ? ` · ${t.humidity}%` : ''}
      </p>
    </div>
  );
}

export default function ThermostatConceptB({ model, size, onOpenDetails }: DesignedWidgetProps<ProThermostatModel>) {
  const t = model.primary;
  const others = model.items.filter((i) => i.entityId !== t?.entityId);
  return (
    <WidgetSurface label="Thermostat" ink="light" style={{ background: air(t) }}>
      <DetailsButton title="Thermostat" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {!t ? (
          <div className="mt-auto flex flex-col gap-1 text-white/70">
            <HugeiconsIcon icon={ThermometerIcon} size={22} />
            <p className="text-sm font-medium">No thermostats</p>
          </div>
        ) : null}

        {t && size === 's' ? (
          <>
            <Big t={t} size={size} />
            <div className="mt-auto">
              <Stepper t={t} ink="light" size="sm" />
            </div>
          </>
        ) : null}

        {t && size === 'w' ? (
          <div className="flex h-full items-center justify-between gap-3 pr-8">
            <Big t={t} size={size} />
            <Stepper t={t} ink="light" vertical />
          </div>
        ) : null}

        {t && (size === 't' || size === 'l') ? (
          <>
            <p className="truncate pr-8 text-xs text-white/75">{t.roomName}</p>
            <Big t={t} size={size} />
            {size === 'l' && others.length > 0 ? (
              <ul aria-label="Other rooms" className="flex flex-wrap gap-1.5">
                {others.slice(0, 3).map((o) => (
                  <li key={o.entityId} className="rounded-full bg-white/15 px-2.5 py-1 text-xs ring-1 ring-white/20">
                    {o.roomName} · {deg(o.current)}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-auto flex justify-center">
              <Stepper t={t} ink="light" />
            </div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
