/**
 * Thermostat concept C — Innovative ("dial"). A 270° dial from the lowest to the highest setting:
 * the arc fills to the target in the action colour, a tick marks the room temperature, and the
 * target sits in the middle. Small: the dial with −/+ under it. Wide: dial | room, action, stepper.
 * Tall: dial over stepper. Large: dial | every room with its own small arc. Wide, Tall and Large
 * have the mode menu (Heat, Cool, Auto, Off…) when the device offers more than one mode.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { ThermometerIcon } from '@hugeicons/core-free-icons';
import type { ProThermostatItem, ProThermostatModel } from '../../../lib/overviewThermostat';
import { useBoxSize } from '../../shared/useBoxSize';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { ModeMenu } from './ModeMenu';
import { actionHue, actionLine, deg, Stepper } from './shared';

const START = 135;
const SWEEP = 270;

function Dial({ t, compact }: { t: ProThermostatItem; compact?: boolean }) {
  const box = useBoxSize<HTMLDivElement>({ width: 120, height: 120 });
  const d = Math.max(56, Math.min(box.width, box.height));
  const stroke = Math.max(5, d * 0.075);
  const r = d / 2 - stroke;
  const c = d / 2;
  const frac = (v: number | null) => (v === null ? 0 : Math.max(0, Math.min(1, (v - t.min) / (t.max - t.min || 1))));
  const at = (f: number) => {
    const a = ((START + SWEEP * f) * Math.PI) / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const arc = (f: number) => {
    const [x0, y0] = at(0);
    const [x1, y1] = at(f);
    return `M${x0},${y0} A${r},${r} 0 ${SWEEP * f > 180 ? 1 : 0} 1 ${x1},${y1}`;
  };
  const hue = actionHue(t.action) ?? 'var(--foreground)';
  const [tx, ty] = at(frac(t.target));
  const [nx, ny] = at(frac(t.current));
  return (
    <div ref={box.ref} className="grid size-full place-items-center">
      <svg width={d} height={d} role="img" aria-label={`${t.name}: ${actionLine(t)}, now ${deg(t.current)}`}>
        <path d={arc(1)} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} strokeLinecap="round" />
        {t.target !== null && t.action !== 'off' ? <path d={arc(frac(t.target))} fill="none" stroke={hue} strokeOpacity={0.9} strokeWidth={stroke} strokeLinecap="round" /> : null}
        {t.current !== null ? <circle cx={nx} cy={ny} r={stroke * 0.32} fill="var(--foreground)" /> : null}
        {t.target !== null && t.action !== 'off' ? <circle cx={tx} cy={ty} r={stroke * 0.85} fill="var(--surface)" stroke={hue} strokeWidth={stroke * 0.45} /> : null}
        <text x={c} y={c + d * 0.06} textAnchor="middle" className="fill-[var(--foreground)] font-semibold tabular-nums" style={{ fontSize: d * (compact ? 0.24 : 0.22) }}>
          {t.action === 'off' ? 'Off' : deg(t.target)}
        </text>
        <text x={c} y={c + d * 0.22} textAnchor="middle" className="fill-[var(--muted)]" style={{ fontSize: Math.max(10, d * 0.085) }}>
          Now {deg(t.current)}
        </text>
      </svg>
    </div>
  );
}

export default function ThermostatConceptC({ model, size, onOpenDetails }: DesignedWidgetProps<ProThermostatModel>) {
  const t = model.primary;
  const hue = t ? actionHue(t.action) : null;
  return (
    <WidgetSurface
      label="Thermostat"
      className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      style={{ backgroundImage: hue ? `radial-gradient(80% 80% at 30% 40%, color-mix(in oklab, ${hue} 14%, transparent), transparent 70%)` : undefined }}
    >
      <DetailsButton title="Thermostat" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {!t ? (
          <div className="mt-auto flex flex-col gap-1 p-0.5 text-muted">
            <HugeiconsIcon icon={ThermometerIcon} size={22} />
            <p className="text-sm font-medium">No thermostats</p>
          </div>
        ) : null}

        {t && size === 's' ? (
          <>
            <div className="min-h-0 flex-1">
              <Dial t={t} compact />
            </div>
            <div className="flex justify-center">
              <Stepper t={t} size="sm" />
            </div>
          </>
        ) : null}

        {t && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="aspect-square h-full">
              <Dial t={t} compact />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between pr-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.roomName}</p>
                <p className="truncate text-xs" style={{ color: hue ?? undefined }}>
                  {actionLine(t)}
                </p>
                <ModeMenu t={t} className="mt-1.5" />
              </div>
              <Stepper t={t} />
            </div>
          </div>
        ) : null}

        {t && size === 't' ? (
          <>
            <p className="truncate pr-8 text-sm font-semibold">{t.roomName}</p>
            <div className="min-h-0 w-full flex-1">
              <Dial t={t} />
            </div>
            <p className="truncate text-center text-xs" style={{ color: hue ?? undefined }}>
              {actionLine(t)}
            </p>
            <div className="mt-auto flex flex-col items-center gap-2">
              <ModeMenu t={t} />
              <Stepper t={t} />
            </div>
          </>
        ) : null}

        {t && size === 'l' ? (
          <div className="flex h-full min-h-0 gap-3">
            <div className="flex min-w-0 flex-[1.2] flex-col gap-2">
              <div className="min-h-0 flex-1">
                <Dial t={t} />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <ModeMenu t={t} />
                <Stepper t={t} />
              </div>
            </div>
            <ul aria-label="Rooms" className="flex min-w-0 flex-1 flex-col justify-end gap-2 pr-1">
              {model.items.slice(0, 4).map((i) => (
                <li key={i.entityId} className="min-w-0">
                  <p className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium">{i.roomName}</span>
                    <span className="tabular-nums">{deg(i.current)}</span>
                  </p>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-default">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${Math.round((((i.target ?? i.min) - i.min) / (i.max - i.min || 1)) * 100)}%`, background: actionHue(i.action) ?? 'var(--muted)' }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
