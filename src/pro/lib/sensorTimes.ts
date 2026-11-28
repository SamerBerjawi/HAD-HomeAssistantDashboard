/**
 * When a sensor last did something, in words, and recency ordering for the sensor sheets
 * (owner review 2026-11-20, WIDGET_DESIGN.md §8 #20). HA's last change is the moment the sensor
 * went active, or the moment it went quiet again ("Last motion 5 min ago" = it cleared then).
 */
import type { ProOverviewSensorItem } from './overviewSecurity';
import { timeAgo } from './pageSentences';

type Item = Pick<ProOverviewSensorItem, 'domain' | 'isActive' | 'isOffline' | 'lastChangedAt'>;

const since = (at: number, now: number) => timeAgo(Math.max(0, (now - at) / 60000));

export function sensorWhen(i: Item, now = Date.now()): string {
  if (i.isOffline) return i.lastChangedAt === null ? 'Offline' : `Offline since ${since(i.lastChangedAt, now)}`;
  const at = i.lastChangedAt;
  if (i.domain === 'motion') return i.isActive ? 'Motion now' : at === null ? 'No motion' : `Last motion ${since(at, now)}`;
  if (i.domain === 'doors' || i.domain === 'windows') {
    if (at === null) return i.isActive ? 'Open' : 'Closed';
    return i.isActive ? `Opened ${since(at, now)}` : `Closed ${since(at, now)}`;
  }
  // Leak and smoke.
  if (at === null) return i.isActive ? 'Detected' : 'Clear';
  return i.isActive ? `Detected ${since(at, now)}` : `Clear since ${since(at, now)}`;
}

/** Active first, then the most recent change; unknown times last. */
export function byRecent<T extends Item>(a: T, b: T): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
  return (b.lastChangedAt ?? -Infinity) - (a.lastChangedAt ?? -Infinity);
}

/** Room groups ordered by their most recent sensor (same rule as `byRecent`). */
export function roomsByRecent<T extends Item>(groups: { key: string; items: T[] }[]): { key: string; items: T[] }[] {
  const sorted = groups.map((g) => ({ key: g.key, items: [...g.items].sort(byRecent) }));
  return sorted.sort((a, b) => byRecent(a.items[0], b.items[0]));
}
