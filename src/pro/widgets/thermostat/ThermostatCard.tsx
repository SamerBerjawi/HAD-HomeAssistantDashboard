/**
 * Thermostat card — the owner's Phase 2 choice, concept B ("climate"): the card is the air (ember
 * while heating, icy while cooling, slate idle, dim off); the target is the big number with the
 * room temperature under it; glass −/+ set the target. Revised 2026-11-20: the room name on top is
 * a menu to choose which thermostat the widget controls (saved in preferences); the state
 * (Heating, Idle…) moved next to the room temperature. Large lists the other rooms.
 * Small (2026-11-20): −/+ stacked beside the target so nothing runs off the bottom of the card.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { FireIcon, SnowIcon, ThermometerIcon } from '@hugeicons/core-free-icons';
import { ACTION_LABEL, type ProThermostatItem, type ProThermostatModel } from '../../lib/overviewThermostat';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { deg, Stepper } from './concepts/shared';
import { ThermostatPicker } from './ThermostatPicker';

export function air(t: ProThermostatItem | null): string {
  if (!t || t.action === 'off') return 'linear-gradient(160deg, hsl(220 10% 30%), hsl(225 12% 16%))';
  if (t.action === 'heating') return 'radial-gradient(120% 90% at 10% 100%, hsl(18 95% 58%), transparent 70%), linear-gradient(160deg, hsl(32 90% 52%), hsl(355 70% 38%))';
  if (t.action === 'cooling') return 'radial-gradient(120% 90% at 90% 0%, hsl(190 95% 70%), transparent 65%), linear-gradient(160deg, hsl(205 85% 52%), hsl(225 70% 34%))';
  if (t.action === 'drying' || t.action === 'fan') return 'linear-gradient(160deg, hsl(175 55% 45%), hsl(200 45% 30%))';
  return 'linear-gradient(160deg, hsl(215 22% 46%), hsl(225 22% 28%))';
}

const stateIcon = (t: ProThermostatItem) => (t.action === 'heating' ? FireIcon : t.action === 'cooling' ? SnowIcon : ThermometerIcon);
const stateText = (t: ProThermostatItem) => (t.action === 'off' ? 'Off' : ACTION_LABEL[t.action]);

/** Small: the room menu on top; the target with its state under it, and −/+ stacked beside it. */
function SmallBody({ t, model }: { t: ProThermostatItem; model: ProThermostatModel }) {
  return (
    <>
      <ThermostatPicker model={model} t={t} icon={stateIcon(t)} className="mr-6" />
      <div className="mt-auto flex min-w-0 items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-5xl font-semibold leading-none tracking-tight tabular-nums">{deg(t.target)}</p>
          {/* Wraps to two lines on narrow phones instead of being cut off. */}
          <p className="mt-1 line-clamp-2 text-xs leading-tight text-white/80 tabular-nums">
            {stateText(t)} · now {deg(t.current)}
          </p>
        </div>
        <Stepper t={t} ink="light" size="sm" vertical />
      </div>
    </>
  );
}

function Big({ t, model, size }: { t: ProThermostatItem; model: ProThermostatModel; size: string }) {
  const icon = stateIcon(t);
  const state = stateText(t);
  return (
    <div className="min-w-0">
      <ThermostatPicker model={model} t={t} icon={icon} className={size === 'w' ? '' : 'mr-6'} />
      <p className={size === 'l' ? 'text-6xl font-semibold leading-none tracking-tight tabular-nums' : 'text-5xl font-semibold leading-none tracking-tight tabular-nums'}>{deg(t.target)}</p>
      <p className="mt-1 truncate text-xs text-white/80 tabular-nums">
        {state} · now {deg(t.current)}
        {size !== 's' && size !== 'w' && t.humidity !== null ? ` · ${t.humidity}%` : ''}
      </p>
    </div>
  );
}

export default function ThermostatCard({ model, size, onOpenDetails }: DesignedWidgetProps<ProThermostatModel>) {
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

        {t && size === 's' ? <SmallBody t={t} model={model} /> : null}

        {t && size === 'w' ? (
          <div className="flex h-full items-center justify-between gap-3 pr-8">
            <Big t={t} model={model} size={size} />
            <Stepper t={t} ink="light" vertical />
          </div>
        ) : null}

        {t && (size === 't' || size === 'l') ? (
          <>
            <Big t={t} model={model} size={size} />
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
