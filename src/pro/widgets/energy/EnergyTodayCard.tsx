/**
 * Energy today — the owner's Phase 4 mix of concepts A and C.
 * Small: A's labels (period, used, cost) under C's self-powered gauge, as a half circle.
 * Tall (added 2026-11-20): the gauge, then A's labels, then C's two bars with their legends.
 * Wide/Large: A's consumption (used, self-powered, figures at Large) with C's two bars: where the
 * energy came from and where it went.
 */
import { cn } from '@/lib/utils';
import { formatCurrencyValue, type ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { Figure, kwh, SOURCE, type SourceKey } from './concepts/shared';
import { useEnergyEmptyState } from './EnergyParts';

const RULE = 'border-t border-[var(--separator,rgba(127,127,127,0.18))]';

interface Part {
  k: SourceKey;
  label: string;
  v: number;
}

const sum = (a: Part[]) => a.reduce((s, p) => s + p.v, 0);

function FlowBar({ title, parts, legend }: { title: string; parts: Part[]; legend: boolean }) {
  const shown = parts.filter((p) => p.v > 0.05);
  const total = Math.max(sum(shown), 0.01);
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-baseline justify-between gap-2 text-[11px] text-muted">
        <span className="font-medium uppercase tracking-wide">{title}</span>
        <span className="tabular-nums">{kwh(sum(shown))}</span>
      </p>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-default" role="img" aria-label={`${title}: ${shown.map((p) => `${p.label} ${kwh(p.v)}`).join(', ') || 'nothing'}`}>
        {shown.map((p) => (
          <span key={p.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.v / total) * 100}%`, background: SOURCE[p.k].color }} />
        ))}
      </div>
      {legend ? (
        <p className="mt-1 flex min-w-0 flex-wrap gap-x-2.5 text-[10px] text-muted">
          {shown.map((p) => (
            <span key={p.label} className="flex items-center gap-1 whitespace-nowrap">
              <span className="size-1.5 rounded-full" style={{ background: SOURCE[p.k].color }} />
              {p.label} {Math.round((p.v / total) * 100)}%
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

/** How self-powered the home was, as a half circle. */
function SelfGauge({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg viewBox="0 0 100 56" className="h-full max-h-full w-auto max-w-full" role="img" aria-label={`${p}% self-powered`}>
      <path d="M 9 50 A 41 41 0 0 1 91 50" fill="none" stroke="var(--default)" strokeWidth="9" strokeLinecap="round" />
      {p > 0 ? <path d="M 9 50 A 41 41 0 0 1 91 50" fill="none" stroke="var(--energy-solar)" strokeWidth="9" strokeLinecap="round" pathLength={100} strokeDasharray={`${p} 100`} /> : null}
      <text x="50" y="43" textAnchor="middle" fontSize="18" fontWeight="600" fill="currentColor">
        {p}%
      </text>
      <text x="50" y="54" textAnchor="middle" fontSize="7.5" fill="var(--muted)">
        self-powered
      </text>
    </svg>
  );
}

export default function EnergyTodayCard({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const cameFrom: Part[] = [
    { k: 'solar', label: 'Solar', v: m.solarToHomeKwh + m.solarToBatteryKwh + m.solarToGridKwh },
    { k: 'battery', label: 'Battery', v: m.batteryToHomeKwh },
    { k: 'grid', label: 'Grid', v: m.gridImportKwh }
  ];
  const wentTo: Part[] = [
    { k: 'home', label: 'Home', v: m.homeKwh },
    { k: 'battery', label: 'Battery', v: m.solarToBatteryKwh },
    { k: 'export', label: 'Sold', v: m.gridExportKwh }
  ];
  const figures = [
    m.hasSolar ? { label: 'Solar', value: m.solarKwhText, color: SOURCE.solar.color } : null,
    m.hasGrid ? { label: 'Bought', value: m.gridImportKwhText, color: SOURCE.grid.color } : null,
    m.hasGrid && m.gridExportKwh > 0 ? { label: 'Sold', value: m.gridExportKwhText, color: SOURCE.export.color } : null,
    // Short form so four figures fit: "Credit €0.28" rather than "−€0.28 credit".
    m.netCost < -0.005 ? { label: 'Credit', value: formatCurrencyValue(-m.netCost, m.currency), color: undefined } : { label: 'Cost', value: m.netCostText, color: undefined }
  ].filter((f) => f !== null);
  const headline = (
    <div className="min-w-0">
      <p className="text-[11px] text-muted">{m.periodLabel}</p>
      <p className={cn('font-extralight tracking-tighter tabular-nums', size === 's' || size === 't' ? 'text-[30px]' : 'text-[40px]', 'leading-none')}>{m.homeKwhText}</p>
      <p className="mt-1 truncate text-xs text-muted">{size === 's' || size === 't' ? m.netCostText : `used · ${m.periodAutarkyPct}% self-powered`}</p>
    </div>
  );

  return (
    <WidgetSurface label="Energy today" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy today" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {empty ? (
          <div className="mt-auto">{empty}</div>
        ) : size === 's' ? (
          <>
            <div className="grid min-h-0 flex-1 place-items-center">
              <SelfGauge pct={m.periodAutarkyPct} />
            </div>
            <div className="shrink-0">{headline}</div>
          </>
        ) : size === 't' ? (
          <>
            <div className="grid min-h-0 flex-1 place-items-center">
              <SelfGauge pct={m.periodAutarkyPct} />
            </div>
            <div className="shrink-0">{headline}</div>
            <div className={cn('flex shrink-0 flex-col gap-2 pt-2', RULE)}>
              <FlowBar title="Came from" parts={cameFrom} legend />
              <FlowBar title="Went to" parts={wentTo} legend />
            </div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex min-w-0 shrink-0 flex-col justify-end">{headline}</div>
            <div className="mt-8 flex min-w-0 flex-1 flex-col justify-end gap-2.5">
              <FlowBar title="Came from" parts={cameFrom} legend={false} />
              <FlowBar title="Went to" parts={wentTo} legend={false} />
            </div>
          </div>
        ) : (
          <>
            {headline}
            <div className={cn('flex min-w-0 justify-between gap-3 pt-2', RULE)}>
              {figures.map((f) => (
                <Figure key={f.label} label={f.label} value={f.value} color={f.color} />
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2.5">
              <FlowBar title="Came from" parts={cameFrom} legend />
              <FlowBar title="Went to" parts={wentTo} legend />
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
