/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared notification list for the bell, sidebar and notification center.
 *
 * Performance notes: the bell and sidebar are always mounted, so this selector runs on every
 * Home Assistant state batch. It therefore
 *  1. skips the extraction pass entirely when only irrelevant entities changed
 *     (see services/notifications/relevance.ts), and
 *  2. reconciles the new list against the previous one, so unchanged items (and the list itself)
 *     keep their references and memoized rows don't re-render.
 */

import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore, AutoLayoutStoreState } from '../store/useAutoLayoutStore';
import { useAlertStore, AlertItem } from '../store/useAlertStore';
import { extractHANotifications } from '../services/notificationsService';
import { statesChangedRelevantly } from '../services/notifications/relevance';
import { reconcileNotifications } from '../services/notifications/reconcile';
import { HANotificationItem } from '../types/notifications';
import { useNotificationReadStore } from '../store/useNotificationReadStore';
import { isUnread } from '../services/notifications/inbox';

const EMPTY: HANotificationItem[] = [];

interface SelectorInputs {
  domainGroups: AutoLayoutStoreState['domainGroups'];
  states: AutoLayoutStoreState['states'];
  entityRegistry: AutoLayoutStoreState['entityRegistry'];
  nativeNotifications: AutoLayoutStoreState['nativeNotifications'];
  nativeRepairs: AutoLayoutStoreState['nativeRepairs'];
  dismissedNotificationIds: AutoLayoutStoreState['dismissedNotificationIds'];
  storeAlerts: AlertItem[];
}

// One computation per relevant input change, shared by every consumer
let cachedInputs: SelectorInputs | null = null;
let cachedResult: HANotificationItem[] = EMPTY;

function needsRecompute(prev: SelectorInputs | null, next: SelectorInputs): boolean {
  if (!prev) return true;
  if (
    prev.entityRegistry !== next.entityRegistry ||
    prev.nativeNotifications !== next.nativeNotifications ||
    prev.nativeRepairs !== next.nativeRepairs ||
    prev.dismissedNotificationIds !== next.dismissedNotificationIds ||
    prev.storeAlerts !== next.storeAlerts
  ) {
    return true;
  }
  const statesChanged = prev.states !== next.states;
  if (statesChanged && statesChangedRelevantly(prev.states, next.states)) return true;
  if (prev.domainGroups !== next.domainGroups) {
    // Graph re-resolved without a state change (registry, customizations): recompute.
    if (!statesChanged) return true;
    // Domains the collectors read directly; others only matter through battery state changes,
    // which statesChangedRelevantly already caught.
    if (
      prev.domainGroups['binary_sensor'] !== next.domainGroups['binary_sensor'] ||
      prev.domainGroups['update'] !== next.domainGroups['update']
    ) {
      return true;
    }
  }
  return false;
}

function selectNotifications(s: AutoLayoutStoreState, storeAlerts: AlertItem[]): HANotificationItem[] {
  const inputs: SelectorInputs = {
    domainGroups: s.domainGroups,
    states: s.states,
    entityRegistry: s.entityRegistry,
    nativeNotifications: s.nativeNotifications,
    nativeRepairs: s.nativeRepairs,
    dismissedNotificationIds: s.dismissedNotificationIds,
    storeAlerts
  };
  const prevInputs = cachedInputs;
  if (
    prevInputs &&
    prevInputs.domainGroups === inputs.domainGroups &&
    prevInputs.states === inputs.states &&
    prevInputs.entityRegistry === inputs.entityRegistry &&
    prevInputs.nativeNotifications === inputs.nativeNotifications &&
    prevInputs.nativeRepairs === inputs.nativeRepairs &&
    prevInputs.dismissedNotificationIds === inputs.dismissedNotificationIds &&
    prevInputs.storeAlerts === inputs.storeAlerts
  ) {
    return cachedResult;
  }
  cachedInputs = inputs;
  if (!needsRecompute(prevInputs, inputs)) return cachedResult;

  const next = extractHANotifications({
    domainGroups: s.domainGroups,
    states: s.states,
    entityRegistry: s.entityRegistry,
    nativeNotifications: s.nativeNotifications,
    nativeRepairs: s.nativeRepairs,
    dismissedNotificationIds: s.dismissedNotificationIds,
    callHAService: s.callHAService,
    dismissNotification: s.dismissNotification,
    updateEntityState: s.updateEntityState,
    installUpdate: s.installUpdate,
    skipUpdate: s.skipUpdate,
    clearSkippedUpdate: s.clearSkippedUpdate,
    storeAlerts
  });
  cachedResult = next.length === 0 ? EMPTY : reconcileNotifications(cachedResult, next);
  return cachedResult;
}

/** Exposed for tests: the memoized selector and a cache reset. */
export const __notificationSelectorForTests = {
  select: selectNotifications,
  reset: () => {
    cachedInputs = null;
    cachedResult = EMPTY;
  }
};

/**
 * The full notification list. Pass `enabled = false` while the list isn't shown (e.g. a closed
 * drawer) to skip the work and stay out of re-renders.
 */
export function useHANotifications(enabled = true): HANotificationItem[] {
  const storeAlerts = useAlertStore((s) => s.alerts);
  return useAutoLayoutStore((s) => (enabled ? selectNotifications(s, storeAlerts) : EMPTY));
}

export interface HANotificationSummary {
  total: number;
  /** Items not yet read in the notification center (per device). */
  unread: number;
  updates: number;
  hasCritical: boolean;
  hasWarning: boolean;
}

/**
 * Counts and severity flags only. Badges re-render when these change, not on every
 * Home Assistant state event that rebuilds the list.
 */
export function useHANotificationSummary(): HANotificationSummary {
  const storeAlerts = useAlertStore((s) => s.alerts);
  const readKeys = useNotificationReadStore((s) => s.readKeys);
  return useAutoLayoutStore(
    useShallow((s) => {
      const list = selectNotifications(s, storeAlerts);
      let unread = 0;
      let updates = 0;
      let hasCritical = false;
      let hasWarning = false;
      for (const n of list) {
        if (isUnread(n, readKeys)) unread++;
        if (n.category === 'update' && !n.skippedVersion) updates++;
        if (n.severity === 'critical') hasCritical = true;
        if (n.severity === 'warning' || n.severity === 'error') hasWarning = true;
      }
      return { total: list.length, unread, updates, hasCritical, hasWarning };
    })
  );
}
