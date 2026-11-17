/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Consolidates Home Assistant updates, persistent notifications, repair issues and critical
 * telemetry alerts into one list. Each source lives in its own collector under ./notifications.
 */

import type { HANotificationItem } from '../types/notifications';
import { createNotificationContext, type ExtractNotificationsParams } from './notifications/context';
import { collectUpdateNotifications } from './notifications/updateNotifications';
import { collectPersistentNotifications } from './notifications/persistentNotifications';
import { collectRepairNotifications, collectRestartNotifications } from './notifications/repairNotifications';
import { collectHazardNotifications } from './notifications/hazardNotifications';
import { collectHaAlertNotifications, collectStoreAlertNotifications } from './notifications/alertNotifications';
import { sortNotifications } from './notifications/sortNotifications';

export { formatTimeAgo } from './notifications/formatTimeAgo';
export type { ExtractNotificationsParams } from './notifications/context';

/**
 * When an item has no source timestamp (sensor alerts, some repairs) it gets the time it was
 * first seen, and keeps it across passes. A fresh `new Date()` on every pass made every such item
 * look changed on every Home Assistant event and kept resetting its "time ago".
 */
const firstSeenAt = new Map<string, string>();

function fillMissingTimestamps(items: HANotificationItem[], now: number): void {
  const live = new Set<string>();
  for (const item of items) {
    live.add(item.id);
    if (item.createdAt) continue;
    let seen = firstSeenAt.get(item.id);
    if (!seen) {
      seen = new Date(now).toISOString();
      firstSeenAt.set(item.id, seen);
    }
    item.createdAt = seen;
  }
  // Forget items that went away, so a re-triggered leak counts as new.
  for (const id of firstSeenAt.keys()) {
    if (!live.has(id)) firstSeenAt.delete(id);
  }
}

/** Test hook: forget first-seen times. */
export function resetNotificationFirstSeen(): void {
  firstSeenAt.clear();
}

/**
 * Extracts and consolidates all active Home Assistant updates, persistent notifications,
 * repair issues, and critical telemetry alerts. Order of collection matters: earlier collectors
 * claim ids in `seenIds`, so later ones skip duplicates.
 */
export function extractHANotifications(params: ExtractNotificationsParams, now: number = Date.now()): HANotificationItem[] {
  const ctx = createNotificationContext(params);
  collectUpdateNotifications(ctx);
  collectPersistentNotifications(ctx);
  collectRepairNotifications(ctx);
  collectRestartNotifications(ctx);
  collectHazardNotifications(ctx);
  collectHaAlertNotifications(ctx);
  collectStoreAlertNotifications(ctx);
  fillMissingTimestamps(ctx.items, now);
  return sortNotifications(ctx.items);
}
