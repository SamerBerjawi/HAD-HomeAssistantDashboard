/**
 * Sensor groups for the Overview rebuild (Phase 3c): Openings = doors + windows, Safety = leak +
 * smoke, Motion = motion. One pure model per group, built from the per-domain models the old
 * widgets used (`buildOverviewSensorDomainModel`). No React.
 */
import type { ResolvedEntity } from '@/types';
import { classifyBinarySensors } from '@/lib/entityClassifiers';
import {
  buildOverviewSensorDomainModel,
  type ProOverviewSensorDomain,
  type ProOverviewSensorDomainModel,
  type ProOverviewSensorItem
} from '../../lib/overviewSecurity';
import type { PillTone } from '../../lib/overviewPills';

export type SensorGroupKind = 'openings' | 'safety' | 'motion';

export const SENSOR_GROUP_DOMAINS: Record<SensorGroupKind, readonly ProOverviewSensorDomain[]> = {
  openings: ['doors', 'windows'],
  safety: ['leak', 'smoke'],
  motion: ['motion']
};

const DOMAIN_SHORT: Record<ProOverviewSensorDomain, string> = {
  doors: 'Doors',
  windows: 'Windows',
  motion: 'Motion',
  leak: 'Leak',
  smoke: 'Smoke'
};

export interface SensorGroupModel {
  kind: SensorGroupKind;
  domains: ProOverviewSensorDomainModel[];
  /** All items, active first (then offline, then by name). */
  items: ProOverviewSensorItem[];
  activeCount: number;
  totalCount: number;
  /** Leak or smoke detected. */
  isCritical: boolean;
  headlineText: string;
  badgeText: string;
  badgeTone: PillTone;
  /** One line: where it is active, or what is monitored. */
  detailText: string;
}

export const domainShortLabel = (d: ProOverviewSensorDomain) => DOMAIN_SHORT[d];

type Classified = ReturnType<typeof classifyBinarySensors>;
const CLASSIFIED = new WeakMap<readonly ResolvedEntity[], Classified>();

/** Classifies binary sensors once per array identity (several widgets read the same domain). */
export function classifyBinarySensorsCached(sensors: readonly ResolvedEntity[]): Classified {
  let hit = CLASSIFIED.get(sensors);
  if (!hit) {
    hit = classifyBinarySensors([...sensors]);
    CLASSIFIED.set(sensors, hit);
  }
  return hit;
}

const SENSORS_FOR: Record<ProOverviewSensorDomain, keyof Classified> = {
  doors: 'doorSensors',
  windows: 'windowSensors',
  motion: 'motionSensors',
  leak: 'leakSensors',
  smoke: 'smokeSensors'
};

export function buildSensorDomainModels(
  domains: readonly ProOverviewSensorDomain[],
  sensors: readonly ResolvedEntity[]
): ProOverviewSensorDomainModel[] {
  const classified = classifyBinarySensorsCached(sensors);
  return domains.map((d) => buildOverviewSensorDomainModel(d, classified[SENSORS_FOR[d]]));
}

const sortItems = (a: ProOverviewSensorItem, b: ProOverviewSensorItem) =>
  Number(b.isActive) - Number(a.isActive) || Number(b.isOffline) - Number(a.isOffline) || a.name.localeCompare(b.name);

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

export function buildSensorGroupModel(kind: SensorGroupKind, domains: ProOverviewSensorDomainModel[]): SensorGroupModel {
  const items = domains.flatMap((d) => d.items).sort(sortItems);
  const active = items.filter((i) => i.isActive);
  const activeCount = active.length;
  const totalCount = items.length;
  const activeDomains = domains.filter((d) => d.activeCount > 0);
  const isCritical = kind === 'safety' && activeCount > 0;

  let headlineText: string;
  let badgeText: string;
  let badgeTone: PillTone;
  if (kind === 'openings') {
    headlineText = activeCount > 0 ? `${activeCount} open` : 'All closed';
    badgeText = activeCount > 0 ? 'Open' : 'Closed';
    badgeTone = activeCount > 0 ? 'warning' : 'success';
  } else if (kind === 'safety') {
    headlineText = activeCount > 0 ? plural(activeCount, 'alert') : 'All clear';
    badgeText = activeCount > 0 ? activeDomains.map((d) => DOMAIN_SHORT[d.domain]).join(' & ') : 'Safe';
    badgeTone = activeCount > 0 ? 'danger' : 'success';
  } else {
    headlineText = activeCount > 0 ? `${activeCount} active` : 'Clear';
    badgeText = activeCount > 0 ? 'Motion' : 'Clear';
    badgeTone = activeCount > 0 ? 'warning' : 'success';
  }

  let detailText: string;
  if (totalCount === 0) {
    detailText = 'No sensors found';
  } else if (activeCount > 0) {
    const names = active.slice(0, 2).map((i) => (i.roomName !== 'General' ? i.roomName : i.shortName));
    detailText = `${names.join(', ')}${activeCount > 2 ? ` +${activeCount - 2}` : ''}`;
  } else if (kind === 'openings') {
    detailText = domains.map((d) => `${d.totalCount} ${DOMAIN_SHORT[d.domain].toLowerCase()}`).join(' · ');
  } else {
    detailText = `${plural(totalCount, 'sensor')} monitored`;
  }

  return { kind, domains, items, activeCount, totalCount, isCritical, headlineText, badgeText, badgeTone, detailText };
}
