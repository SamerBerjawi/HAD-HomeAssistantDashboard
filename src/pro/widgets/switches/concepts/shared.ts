/** Switches helpers for the concepts (pure). */
import type { ProControlDomainModel, ProControlItem } from '../../../lib/overviewControls';

export const watts = (w: number) => (w >= 1000 ? `${(w / 1000).toFixed(w >= 10000 ? 0 : 1)} kW` : `${Math.round(w)} W`);

/** On switches by power drawn (unknown power last), then the off ones. */
export function byPower(m: ProControlDomainModel): ProControlItem[] {
  return [...m.items].sort((a, b) => Number(b.isOn) - Number(a.isOn) || (b.powerWatts ?? -1) - (a.powerWatts ?? -1));
}

/** Distinct colours for the power-share bar (D1: content colour, by position). */
export const SHARE_COLORS = ['hsl(212 85% 56%)', 'hsl(268 65% 60%)', 'hsl(170 60% 42%)', 'hsl(35 90% 55%)', 'hsl(340 70% 58%)', 'hsl(195 70% 50%)'];
