/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Structural sharing for the notification list. Every extraction pass builds brand-new item
 * objects with fresh closures, which used to re-render every notification row. Reconciling against the previous result keeps
 * the old object for each item whose data is unchanged, and the old array if nothing changed, so
 * memoized rows and selector consumers only update when something really changed.
 */

import type { HANotificationAction, HANotificationItem } from '../../types/notifications';

/** Compared separately (actions) or callbacks that are rebuilt on every pass. */
const IGNORED_KEYS = new Set(['actions', 'onDismiss']);

function actionsEqual(a?: HANotificationAction[], b?: HANotificationAction[]): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.label !== y.label || x.variant !== y.variant || x.icon !== y.icon || x.loading !== y.loading) {
      return false;
    }
  }
  return true;
}

/** Data equality for two notification items, ignoring callbacks. */
export function notificationDataEqual(a: HANotificationItem, b: HANotificationItem): boolean {
  if (a === b) return true;
  const ra = a as unknown as Record<string, unknown>;
  const rb = b as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
  for (const key of keys) {
    if (IGNORED_KEYS.has(key)) continue;
    const va = ra[key];
    const vb = rb[key];
    if (typeof va === 'function' && typeof vb === 'function') continue;
    if (!Object.is(va, vb)) return false;
  }
  return actionsEqual(a.actions, b.actions);
}

/**
 * Returns `next`, but with every item that is data-equal to the previous item of the same id
 * replaced by that previous object. Returns `prev` itself when the whole list is unchanged.
 */
export function reconcileNotifications(
  prev: readonly HANotificationItem[],
  next: HANotificationItem[]
): HANotificationItem[] {
  if (prev.length === 0) return next;
  const prevById = new Map<string, HANotificationItem>();
  for (const item of prev) prevById.set(item.id, item);

  let identical = prev.length === next.length;
  const out = new Array<HANotificationItem>(next.length);
  for (let i = 0; i < next.length; i++) {
    const fresh = next[i];
    const old = prevById.get(fresh.id);
    const keep = old && notificationDataEqual(old, fresh) ? old : fresh;
    out[i] = keep;
    if (identical && keep !== prev[i]) identical = false;
  }
  return identical ? (prev as HANotificationItem[]) : out;
}
