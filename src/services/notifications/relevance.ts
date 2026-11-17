/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Decides whether a batch of Home Assistant state changes can affect the notification list, so
 * the (O(entities)) extraction pass can be skipped for the vast majority of events: power meters,
 * lights, media players and climate updates never produce notifications.
 *
 * This must stay a superset of what the collectors in this folder read. When adding a collector
 * that looks at a new kind of entity, extend `isNotificationRelevantState` too.
 */

import type { HAState } from '../../types';

const RELEVANT_PREFIXES = [
  'update.',
  'alert.',
  'persistent_notification.',
  'repair.',
  'binary_sensor.' // leaks, smoke/gas, problem, tamper, updater, restart flags
];

/** True if this entity could feed any notification collector. */
export function isNotificationRelevantState(state: HAState | undefined): boolean {
  if (!state || !state.entity_id) return false;
  const id = state.entity_id.toLowerCase();
  for (const prefix of RELEVANT_PREFIXES) {
    if (id.startsWith(prefix)) return true;
  }
  if (id === 'sensor.hacs') return true;

  const attrs = state.attributes || {};
  const name = String(attrs.friendly_name || '').toLowerCase();
  const deviceClass = String(attrs.device_class || '').toLowerCase();

  // Restart / reboot required sensors
  if (
    deviceClass === 'restart' || deviceClass === 'reboot' ||
    id.includes('restart') || id.includes('reboot') ||
    name.includes('restart') || name.includes('reboot') ||
    attrs.restart_required !== undefined || attrs.reboot_required !== undefined
  ) {
    return true;
  }

  // Anything that can carry a battery level (own attribute, battery sensor, sibling device battery)
  if (
    deviceClass === 'battery' ||
    id.includes('battery') || id.endsWith('_bat') ||
    name.includes('battery') ||
    'battery' in attrs || 'battery_level' in attrs
  ) {
    return true;
  }

  return false;
}

/**
 * True when `next` differs from `prev` in a way that could change the notification list.
 * Entities whose object reference is unchanged are skipped, so this is a cheap reference scan.
 */
export function statesChangedRelevantly(
  prev: Record<string, HAState>,
  next: Record<string, HAState>
): boolean {
  if (prev === next) return false;
  let prevCount = 0;
  for (const _ in prev) prevCount++;
  let nextCount = 0;

  for (const id in next) {
    nextCount++;
    const a = prev[id];
    const b = next[id];
    if (a === b) continue;
    // Added entity: registry-level changes are rare, recompute to be safe.
    if (!a) return true;
    if (isNotificationRelevantState(a) || isNotificationRelevantState(b)) return true;
    // Power/energy classification feeds the battery exclusion rules.
    const pa = a.attributes || {};
    const pb = b.attributes || {};
    if (pa.device_class !== pb.device_class || pa.unit_of_measurement !== pb.unit_of_measurement) return true;
  }

  // Removed entities
  return nextCount !== prevCount;
}
