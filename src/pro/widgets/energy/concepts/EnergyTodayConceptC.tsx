/**
 * Energy today concept C — Innovative ("in and out"). Two bars balance the day: where the energy
 * came from (solar, battery, grid) and where it went (home, battery, sold). Small: a ring of how
 * self-powered the home was. Wide: the two bars. Large: + money and the top users.
 */
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useEnergyEmptyState } from '../EnergyParts';
import { kwh, SOURCE, type SourceKey } from './shared';

function Bar({ title, parts, total, legend = true }: { title: string; parts: { k: SourceKey; label: string; v: number }[]; total: number; legend?: boolean }) {
  const shown = parts.filter((p) => p.v > 0.05);
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-baseline justify-between gap-2 text-[11px] text-muted">
        <span className="font-medium uppercase tracking-wide">{title}</span>
        <span className="tabular-nums">{kwh(total)}</span>
      </p>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${title}: ${shown.map((p) => `${p.label} ${kwh(p.v)}`).join(', ')}`}>
        {shown.map((p) => (
          <span key={p.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.v / Math.max(total, 0.01)) * 100}%`, background: SOURCE[p.k].color }} />
        ))}
      </div>
      {legend ? (
        <p className="mt-1 flex min-w-0 flex-wrap gap-x-2.5 text-[10px] text-muted">
          {shown.map((p) => (
            <span key={p.label} className="flex items-center gap-1 whitespace-nowrap">
              <span className="size-1.5 rounded-full" style={{ background: SOURCE[p.k].color }} />
              {p.label} {Math.round((p.v / Math.max(total, 0.01)) * 100)}%
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function SelfRing({ pct }: { pct: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 90 90" className="aspect-square h-full max-h-full w-auto" role="img" aria-label={`${pct}% self-powered`}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--default)" strokeWidth="9" />
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--energy-solar)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 45 45)" />
      <text x="45" y="47" textAnchor="middle" fontSize="17" fontWeight="600" fill="currentColor">
        {pct}%
      </text>
      <text x="45" y="60" textAnchor="middle" fontSize="7.5" fill="var(--muted)">
        self-powered
      </text>
    </svg>
  );
}

export default function EnergyTodayConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const cameFrom = [
    { k: 'solar' as const, label: 'Solar', v: m.solarToHomeKwh + m.solarToBatteryKwh + m.solarToGridKwh },
    { k: 'battery' as const, label: 'Battery', v: m.batteryToHomeKwh },
    { k: 'grid' as const, label: 'Grid', v: m.gridImportKwh }
  ];
  const wentTo = [
    { k: 'home' as const, label: 'Home', v: m.homeKwh },
    { k: 'battery' as const, label: 'Battery', v: m.solarToBatteryKwh },
    { k: 'export' as const, label: 'Sold', v: m.gridExportKwh }
  ];
  const sum = (a: { v: number }[]) => a.reduce((s, p) => s + p.v, 0);

  return (
    <WidgetSurface label="Energy today" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy today" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2.5 p-3.5">
        {empty ? (
          <div className="mt-auto">{empty}</div>
        ) : size === 's' ? (
          <>
            <div className="grid min-h-0 flex-1 place-items-center">
              <SelfRing pct={m.periodAutarkyPct} />
            </div>
            <p className="truncate text-center text-xs text-muted">{m.homeKwhText} used</p>
          </>
        ) : (
          <>
            <p className="shrink-0 truncate pr-8 text-sm font-semibold">
              {m.homeKwhText} used <span className="font-normal text-muted">· {m.netCostText}</span>
            </p>
            <div className="mt-auto flex flex-col gap-2.5">
              <Bar title="Came from" parts={cameFrom} total={sum(cameFrom)} legend={size === 'l'} />
              <Bar title="Went to" parts={wentTo} total={sum(wentTo)} legend={size === 'l'} />
            </div>
            {size === 'l' ? (
              <div className="grid grid-cols-2 gap-3 border-t border-[var(--separator,rgba(127,127,127,0.18))] pt-2.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Money</p>
                  <p className="mt-0.5 flex justify-between text-xs">
                    <span className="text-muted">Bought</span>
                    <span className="tabular-nums">
                      {m.currency}
                      {m.gridImportCost.toFixed(2)}
                    </span>
                  </p>
                  <p className="flex justify-between text-xs">
                    <span className="text-muted">Sold</span>
                    <span className="tabular-nums text-success">
                      −{m.currency}
                      {m.gridExportCompensation.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Top users</p>
                  {m.topConsumers.slice(0, 2).map((d) => (
                    <p key={d.id} className="mt-0.5 flex justify-between gap-2 text-xs">
                      <span className="truncate text-muted">{d.name}</span>
                      <span className="shrink-0 tabular-nums">{d.kwhText}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
