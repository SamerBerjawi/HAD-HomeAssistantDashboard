/**
 * Energy now concept C — Innovative ("power ring"). One ring is the home: its arcs show where
 * the power comes from right now (solar, battery, grid), the home's draw in the middle. A thin
 * outer ring shows what leaves: solar sold to the grid and solar charging the battery.
 * Small: the ring. Wide: ring | legend. Large: big ring with the legend under it.
 */
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useEnergyEmptyState } from '../EnergyParts';
import { kw, liveRows, SOURCE, SourceDot } from './shared';

const R = 40;
const C = 2 * Math.PI * R;
const R2 = 48;
const C2 = 2 * Math.PI * R2;

function Ring({ m, label }: { m: ProOverviewEnergyModel; label: boolean }) {
  const parts = [
    { k: 'solar' as const, pct: m.sourceSplit.solarPct },
    { k: 'battery' as const, pct: m.sourceSplit.batteryPct },
    { k: 'grid' as const, pct: m.sourceSplit.gridPct }
  ].filter((p) => p.pct > 0);
  // Outflows as a share of what the panels make (or of the home, without solar).
  const base = Math.max(m.solarKW, m.homeKW, 0.01);
  const out = [
    { k: 'export' as const, pct: Math.min(100, ((m.isExporting ? m.gridExportKW || -m.gridKW : 0) / base) * 100) },
    { k: 'battery' as const, pct: Math.min(100, (m.batteryChargeKW / base) * 100) }
  ].filter((p) => p.pct > 0.5);
  let at = 0;
  let outAt = 0;
  return (
    <svg
      viewBox="0 0 110 110"
      className="aspect-square h-full max-h-full w-auto max-w-full"
      role="img"
      aria-label={`Home ${m.homeKWText}: ${parts.map((p) => `${SOURCE[p.k].label} ${p.pct}%`).join(', ') || 'idle'}`}
    >
      <g transform="rotate(-90 55 55)">
        <circle cx="55" cy="55" r={R} fill="none" stroke="var(--default)" strokeWidth="10" />
        {parts.map((p) => {
          const len = (p.pct / 100) * C;
          const el = <circle key={p.k} cx="55" cy="55" r={R} fill="none" stroke={SOURCE[p.k].color} strokeWidth="10" strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-at} />;
          at += len;
          return el;
        })}
        {out.map((p) => {
          const len = (p.pct / 100) * C2;
          const el = (
            <circle
              key={`o-${p.k}`}
              cx="55"
              cy="55"
              r={R2}
              fill="none"
              stroke={SOURCE[p.k].color}
              strokeOpacity="0.7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, len - 2)} ${C2}`}
              strokeDashoffset={-outAt}
            />
          );
          outAt += len;
          return el;
        })}
      </g>
      <text x="55" y={label ? 54 : 60} textAnchor="middle" fontSize="15" fontWeight="600" fill="currentColor">
        {kw(m.homeKW)}
      </text>
      {label ? (
        <text x="55" y="68" textAnchor="middle" fontSize="8" fill="var(--muted)">
          home now
        </text>
      ) : null}
    </svg>
  );
}

export default function EnergyNowConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const rows = liveRows(m);
  const legend = (
    <ul aria-label="Sources now" className="flex min-w-0 flex-col gap-1">
      {rows.map((r) => (
        <li key={r.key} className="flex min-w-0 items-center gap-2 text-xs">
          <SourceDot k={r.key} size={13} />
          <span className="min-w-0 flex-1 truncate text-muted">{r.note}</span>
          <span className="shrink-0 font-semibold tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <WidgetSurface label="Energy now" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy now" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {empty ? (
          <div className="mt-auto p-0.5">{empty}</div>
        ) : size === 'w' ? (
          <div className="flex h-full min-h-0 items-center gap-3">
            <div className="h-full shrink-0">
              <Ring m={m} label />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-6">
              <p className="truncate text-xs font-semibold">{m.gridNetText}</p>
              {legend}
            </div>
          </div>
        ) : (
          <>
            <div className="grid min-h-0 flex-1 place-items-center">
              <Ring m={m} label={size === 'l'} />
            </div>
            {size === 'l' ? (
              <div className="flex flex-col gap-1.5 px-1">
                <p className="text-xs font-semibold">{m.gridNetText}</p>
                {legend}
              </div>
            ) : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
