/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * What counts as an emergency (full-screen alert + chime). Pure, no stores.
 *
 * Only binary sensors that are on, and a triggered alarm panel. Lights, switches, sensors and
 * other domains never qualify: a camera floodlight ("light.garage_floodlight") turning on used
 * to read as "flood" and raise a water-leak emergency (owner report, 2026-11-19).
 */
import { isRainOrWeatherSensor } from '../../lib/entityClassifiers';

export type EmergencyType = 'smoke' | 'gas' | 'co' | 'moisture' | 'safety' | 'alarm';

const BY_DEVICE_CLASS: Record<string, EmergencyType> = {
  smoke: 'smoke',
  gas: 'gas',
  carbon_monoxide: 'co',
  co: 'co',
  moisture: 'moisture',
  safety: 'safety'
};

/** Whole-word matches only, so "floodlight" or "smokeless" don't count. */
const LEAK_WORDS = /(^|[^a-z])(leak|water_leak|flood|flooding|overflow)([^a-z]|$)/;
const SMOKE_WORDS = /(^|[^a-z])(smoke|smoke_detector)([^a-z]|$)/;

export function emergencyTypeOf(
  entityId: string,
  state: string,
  attributes: Record<string, unknown> = {},
  name = ''
): EmergencyType | null {
  const domain = entityId.split('.')[0];
  if (domain === 'alarm_control_panel') return state === 'triggered' ? 'alarm' : null;
  if (domain !== 'binary_sensor' || state !== 'on') return null;

  const friendly = String(attributes.friendly_name ?? name ?? '');
  if (isRainOrWeatherSensor({ entity_id: entityId, attributes, name: friendly })) return null;

  const dc = String(attributes.device_class ?? '').toLowerCase();
  if (dc) return BY_DEVICE_CLASS[dc] ?? null;

  // No device class: fall back to words in the id or name.
  const text = `${entityId.toLowerCase()} ${friendly.toLowerCase()}`;
  if (LEAK_WORDS.test(text)) return 'moisture';
  if (SMOKE_WORDS.test(text)) return 'smoke';
  return null;
}

export const EMERGENCY_TITLE: Record<EmergencyType, string> = {
  smoke: 'SMOKE DETECTED',
  gas: 'GAS LEAK DETECTED',
  co: 'CARBON MONOXIDE DETECTED',
  moisture: 'WATER LEAK DETECTED',
  safety: 'SAFETY HAZARD TRIGGERED',
  alarm: 'INTRUSION ALARM TRIGGERED'
};
