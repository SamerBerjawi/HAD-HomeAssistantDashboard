/**
 * Energy flow — the owner's Phase 4 choice, concept A: the Sankey (sources → home → areas →
 * devices) on a calm card, with a one-line header (used, how much the tracked devices explain).
 */
import type { ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import { SankeyChart } from '../../ui/bklit/SankeyChart';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { useBoxHeight } from '../shared/useBoxHeight';
import { useEnergyEmptyState } from './EnergyParts';

export default function EnergyFlowCard({ model: m, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const { ref, height } = useBoxHeight<HTMLDivElement>(220);
  const graph = m.energyFlowFull;
  return (
    <WidgetSurface label="Energy flow" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy flow" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-1.5 p-3.5">
        {empty ? (
          <div className="mt-auto">{empty}</div>
        ) : (
          <>
            <div className="flex min-w-0 shrink-0 items-center gap-2 pr-8">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                Where {m.homeKwhText} went <span className="font-normal text-muted">· {100 - m.untrackedPct}% tracked</span>
              </p>
            </div>
            <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
              <SankeyChart nodes={graph.nodes} links={graph.links} height={height} compact={false} />
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
