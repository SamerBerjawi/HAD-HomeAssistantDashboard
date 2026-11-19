/**
 * Which Overview detail sheet is open (audit P4, 2026-11-19). One value instead of a boolean per
 * sheet, so two sheets can never be open together. Pure, no React.
 */
import type { ProControlDomain } from './overviewControls';
import { energyViewForWidgetId, type ProOverviewEnergyView } from './overviewEnergy';
import type { OverviewStatusPill } from './overviewPills';
import type { ProOverviewSensorDomain } from './overviewSecurity';

export type OverviewSheet =
  | { kind: 'addWidgets' }
  | { kind: 'weather' }
  | { kind: 'presence'; personId?: string }
  | { kind: 'control'; domain: ProControlDomain }
  | { kind: 'fans' }
  | { kind: 'vacuums' }
  | { kind: 'media' }
  | { kind: 'alarm' }
  | { kind: 'cameras'; cameraId?: string }
  | { kind: 'sensor'; domain: ProOverviewSensorDomain }
  | { kind: 'energy'; view: ProOverviewEnergyView };

export type OverviewSheetKind = OverviewSheet['kind'];

export const OVERVIEW_SENSOR_DOMAINS: ReadonlySet<string> = new Set<ProOverviewSensorDomain>(['doors', 'windows', 'motion', 'leak', 'smoke']);

export function isSensorDomain(id: string): id is ProOverviewSensorDomain {
  return OVERVIEW_SENSOR_DOMAINS.has(id);
}

const SIMPLE: Partial<Record<string, OverviewSheet>> = {
  weather: { kind: 'weather' },
  weather_hourly: { kind: 'weather' },
  users: { kind: 'presence' },
  lights: { kind: 'control', domain: 'lights' },
  switches: { kind: 'control', domain: 'switches' },
  fans: { kind: 'fans' },
  vacuums: { kind: 'vacuums' },
  media: { kind: 'media' },
  alarm: { kind: 'alarm' },
  cameras: { kind: 'cameras' }
};

/** The sheet a widget card opens, or null when it has none. */
export function sheetForWidget(widgetId: string): OverviewSheet | null {
  const view = energyViewForWidgetId(widgetId);
  if (view) return { kind: 'energy', view };
  if (widgetId.startsWith('camera:')) return { kind: 'cameras', cameraId: widgetId.slice('camera:'.length) };
  if (isSensorDomain(widgetId)) return { kind: 'sensor', domain: widgetId };
  return SIMPLE[widgetId] ?? null;
}

/** The sheet a status pill opens, or null. */
export function sheetForPill(pill: Pick<OverviewStatusPill, 'kind' | 'person'>): OverviewSheet | null {
  if (pill.kind === 'person') return pill.person?.entityId ? { kind: 'presence', personId: pill.person.entityId } : null;
  if (isSensorDomain(pill.kind)) return { kind: 'sensor', domain: pill.kind };
  return SIMPLE[pill.kind] ?? null;
}
