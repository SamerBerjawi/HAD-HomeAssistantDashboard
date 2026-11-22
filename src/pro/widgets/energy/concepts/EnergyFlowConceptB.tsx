/**
 * Energy flow concept B — Expressive & immersive ("leaderboard"). A dark card where the day's
 * biggest users glow as bars, longest first, each in its own colour; what nothing tracks is a dim
 * bar at the end. A thin strip on top shows where the energy came from.
 */
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useEnergyEmptyState } from '../EnergyParts';
import { kwh } from './shared';

const HUES = [32, 190, 280, 140, 340, 210, 60];

export default function EnergyFlowConceptB({ model: m, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const rows = [
    ...m.topConsumers.map((d, i) => ({ id: d.id, name: d.name, kwh: d.kwh, hue: HUES[i % HUES.length] as number | null })),
    ...(m.untrackedKwh > 0.05 ? [{ id: 'untracked', name: 'Not tracked', kwh: m.untrackedKwh, hue: null }] : [])
  ].slice(0, 6);
  const max = Math.max(0.01, ...rows.map((r) => r.kwh));
  const from = [
    { label: 'Solar', v: m.solarToHomeKwh, c: 'hsl(42 95% 60%)' },
    { label: 'Battery', v: m.batteryToHomeKwh, c: 'hsl(172 60% 55%)' },
    { label: 'Grid', v: m.gridToHomeKwh, c: 'hsl(212 85% 65%)' }
  ].filter((f) => f.v > 0.05);
  const fromTotal = Math.max(
    0.01,
    from.reduce((s, f) => s + f.v, 0)
  );

  return (
    <WidgetSurface label="Energy flow" ink="light" style={{ background: 'linear-gradient(160deg, hsl(235 30% 18%), hsl(250 30% 9%))' }}>
      <DetailsButton title="Energy flow" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2.5 p-3.5">
        {empty ? (
          <div className="mt-auto text-white/80">{empty}</div>
        ) : (
          <>
            <div className="min-w-0 pr-8">
              <p className="text-xs text-white/70">Where it went · {m.periodLabel.toLowerCase()}</p>
              <p className="text-2xl font-semibold tabular-nums">{m.homeKwhText}</p>
            </div>
            <div>
              <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`Came from ${from.map((f) => `${f.label} ${Math.round((f.v / fromTotal) * 100)}%`).join(', ')}`}>
                {from.map((f) => (
                  <span key={f.label} style={{ width: `${(f.v / fromTotal) * 100}%`, background: f.c }} />
                ))}
              </div>
              <p className="mt-1 flex gap-3 text-[10px] text-white/65">
                {from.map((f) => (
                  <span key={f.label}>
                    {f.label} {Math.round((f.v / fromTotal) * 100)}%
                  </span>
                ))}
              </p>
            </div>
            <ul aria-label="Biggest users" className="mt-auto flex flex-col gap-2">
              {rows.map((r) => (
                <li key={r.id} className="min-w-0">
                  <p className="mb-0.5 flex justify-between gap-2 text-xs">
                    <span className={r.hue === null ? 'truncate text-white/55' : 'truncate font-medium'}>{r.name}</span>
                    <span className="shrink-0 tabular-nums text-white/75">{kwh(r.kwh)}</span>
                  </p>
                  <span className="block h-2 rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(r.kwh / max) * 100}%`,
                        background: r.hue === null ? 'rgba(255,255,255,0.22)' : `linear-gradient(90deg, hsl(${r.hue} 85% 55%), hsl(${r.hue + 20} 90% 66%))`,
                        boxShadow: r.hue === null ? undefined : `0 0 10px hsl(${r.hue} 90% 60% / 0.55)`
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
