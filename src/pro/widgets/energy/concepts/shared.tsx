/** Energy pieces the Phase 4 concepts share: source colours, figures, the empty state and kW text. */
import type { ReactNode } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BatteryFullIcon, Home01Icon, PlugSocketIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';

export type SourceKey = 'solar' | 'battery' | 'grid' | 'home' | 'export';

export const SOURCE: Record<SourceKey, { label: string; color: string; icon: IconSvgElement }> = {
  solar: { label: 'Solar', color: 'var(--energy-solar)', icon: Sun01Icon },
  battery: { label: 'Battery', color: 'var(--energy-battery)', icon: BatteryFullIcon },
  grid: { label: 'Grid', color: 'var(--energy-grid)', icon: PlugSocketIcon },
  home: { label: 'Home', color: 'var(--foreground)', icon: Home01Icon },
  export: { label: 'Export', color: 'var(--energy-export)', icon: PlugSocketIcon }
};

export const kw = (n: number) => (Math.abs(n) < 1 ? `${Math.round(Math.abs(n) * 1000)} W` : `${Math.abs(n).toFixed(1)} kW`);
export const kwh = (n: number) => `${n >= 100 ? Math.round(n) : n.toFixed(1)} kWh`;

/** Which source is feeding the home most right now (for colour), or null when idle. */
export function dominantSource(m: ProOverviewEnergyModel): 'solar' | 'battery' | 'grid' | null {
  const s = m.sourceSplit;
  if (m.homeKW < 0.02) return null;
  if (s.solarPct >= s.batteryPct && s.solarPct >= s.gridPct && s.solarPct > 0) return 'solar';
  if (s.batteryPct >= s.gridPct && s.batteryPct > 0) return 'battery';
  return 'grid';
}

/** Live rows: what each source is doing now. */
export function liveRows(m: ProOverviewEnergyModel) {
  return [
    m.hasSolar ? { key: 'solar' as const, value: kw(m.solarKW), note: m.solarKW > 0.04 ? 'producing' : 'idle' } : null,
    m.hasBattery
      ? {
          key: 'battery' as const,
          value: m.batterySoC !== null ? `${m.batterySoC}%` : kw(m.batteryKW),
          note: m.batteryChargeKW > 0.02 ? `charging ${kw(m.batteryChargeKW)}` : m.batteryDischargeKW > 0.02 ? `giving ${kw(m.batteryDischargeKW)}` : 'idle'
        }
      : null,
    m.hasGrid
      ? {
          key: 'grid' as const,
          value: m.isExporting ? `↑ ${kw(m.gridExportKW || -m.gridKW)}` : m.gridImportKW > 0.02 ? `↓ ${kw(m.gridImportKW)}` : '0 W',
          note: m.isExporting ? 'selling' : m.gridImportKW > 0.02 ? 'buying' : 'balanced'
        }
      : null
  ].filter((r) => r !== null);
}

export function Figure({ label, value, color, className }: { label: string; value: string; color?: string; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-1 truncate text-[11px] text-muted">
        {color ? <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} /> : null}
        {label}
      </p>
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function SourceDot({ k, size = 14 }: { k: SourceKey; size?: number }): ReactNode {
  return <HugeiconsIcon icon={SOURCE[k].icon} size={size} style={{ color: SOURCE[k].color }} className="shrink-0" />;
}
