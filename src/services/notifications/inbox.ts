/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure inbox logic for the notification center: tab mapping, timeline grouping, unread state
 * and counts. No React, no stores, so it is cheap to memoize and easy to test.
 */

import type { HANotificationItem, NotificationCategory, NotificationSeverity } from '../../types/notifications';

// ---------------------------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------------------------

/** Inbox tabs. "alerts" = things happening in the home, "system" = Home Assistant itself. */
export type InboxTab = 'all' | 'alerts' | 'system';
export type InboxCategory = Exclude<InboxTab, 'all'>;

export const INBOX_TABS: readonly { id: InboxTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'system', label: 'System' }
];

const CATEGORY_TO_TAB: Record<NotificationCategory, InboxCategory> = {
  hazard: 'alerts',
  alert: 'alerts',
  security: 'alerts',
  battery: 'alerts',
  appliance: 'alerts',
  update: 'system',
  restart: 'system',
  repair: 'system',
  persistent_notification: 'system'
};

export function inboxCategoryOf(category: NotificationCategory): InboxCategory {
  return CATEGORY_TO_TAB[category] ?? 'system';
}

// ---------------------------------------------------------------------------------------------
// Timeline groups
// ---------------------------------------------------------------------------------------------

export type InboxGroup = 'Needs attention' | 'Today' | 'Earlier';
export const INBOX_GROUP_ORDER: readonly InboxGroup[] = ['Needs attention', 'Today', 'Earlier'];

/** Epoch ms for an item, or null when it has no usable time. */
export function notificationTime(item: Pick<HANotificationItem, 'timestamp' | 'createdAt'>): number | null {
  if (typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)) return item.timestamp;
  if (item.createdAt) {
    const t = Date.parse(item.createdAt);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

function startOfLocalDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Critical items are pinned on top; the rest fall into Today / Earlier by their time. */
export function inboxGroupOf(
  item: Pick<HANotificationItem, 'severity' | 'timestamp' | 'createdAt'>,
  now: number
): InboxGroup {
  if (item.severity === 'critical') return 'Needs attention';
  const t = notificationTime(item);
  // Undated items are current conditions (e.g. an update waiting), so they count as today.
  if (t === null || t >= startOfLocalDay(now)) return 'Today';
  return 'Earlier';
}

// ---------------------------------------------------------------------------------------------
// Unread state
// ---------------------------------------------------------------------------------------------

/**
 * Key under which an item's read state is stored. Includes the offered version for updates, so
 * a newer release of something already read shows up as unread again.
 */
export function readKeyOf(item: Pick<HANotificationItem, 'id' | 'latestVersion'>): string {
  return item.latestVersion ? `${item.id}@${item.latestVersion}` : item.id;
}

export function isUnread(item: Pick<HANotificationItem, 'id' | 'latestVersion'>, readKeys: ReadonlySet<string>): boolean {
  return !readKeys.has(readKeyOf(item));
}

// ---------------------------------------------------------------------------------------------
// Inbox entries
// ---------------------------------------------------------------------------------------------

export interface InboxEntry {
  item: HANotificationItem;
  category: InboxCategory;
  group: InboxGroup;
  unread: boolean;
}

const SEVERITY_SCORE: Record<NotificationSeverity, number> = {
  critical: 5,
  error: 4,
  warning: 3,
  update: 2,
  info: 1
};

/**
 * Builds the inbox timeline from the (already priority-sorted) notification list:
 * groups in INBOX_GROUP_ORDER, newest first inside Today / Earlier, ties kept in priority order.
 */
export function buildInboxEntries(
  items: readonly HANotificationItem[],
  readKeys: ReadonlySet<string>,
  now: number
): InboxEntry[] {
  const ranked = items.map((item, index) => ({
    entry: {
      item,
      category: inboxCategoryOf(item.category),
      group: inboxGroupOf(item, now),
      unread: isUnread(item, readKeys)
    } as InboxEntry,
    index,
    time: notificationTime(item)
  }));

  ranked.sort((a, b) => {
    const ga = INBOX_GROUP_ORDER.indexOf(a.entry.group);
    const gb = INBOX_GROUP_ORDER.indexOf(b.entry.group);
    if (ga !== gb) return ga - gb;
    if (a.entry.group === 'Needs attention') return a.index - b.index;
    // Undated items first in Today (they are "now"), then newest first
    const ta = a.time ?? Number.POSITIVE_INFINITY;
    const tb = b.time ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return tb - ta;
    const sa = SEVERITY_SCORE[a.entry.item.severity] ?? 0;
    const sb = SEVERITY_SCORE[b.entry.item.severity] ?? 0;
    if (sa !== sb) return sb - sa;
    return a.index - b.index;
  });

  return ranked.map((r) => r.entry);
}

export function filterByTab<T extends { category: InboxCategory }>(entries: readonly T[], tab: InboxTab): readonly T[] {
  if (tab === 'all') return entries;
  return entries.filter((e) => e.category === tab);
}

export interface InboxCounts {
  total: Record<InboxTab, number>;
  unread: Record<InboxTab, number>;
}

export function countInbox(entries: readonly { category: InboxCategory; unread: boolean }[]): InboxCounts {
  const total: Record<InboxTab, number> = { all: 0, alerts: 0, system: 0 };
  const unread: Record<InboxTab, number> = { all: 0, alerts: 0, system: 0 };
  for (const e of entries) {
    total.all++;
    total[e.category]++;
    if (e.unread) {
      unread.all++;
      unread[e.category]++;
    }
  }
  return { total, unread };
}

export interface InboxSection<T> {
  group: string;
  entries: T[];
}

/** Splits entries into consecutive sections by `group`, in order of first appearance. */
export function groupEntries<T extends { group: string }>(entries: readonly T[]): InboxSection<T>[] {
  const sections: InboxSection<T>[] = [];
  const byGroup = new Map<string, InboxSection<T>>();
  for (const e of entries) {
    let section = byGroup.get(e.group);
    if (!section) {
      section = { group: e.group, entries: [] };
      byGroup.set(e.group, section);
      sections.push(section);
    }
    section.entries.push(e);
  }
  return sections;
}

/** Case-insensitive search over title, message, entity id and area. */
export function matchesSearch(item: HANotificationItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    (item.message || '').toLowerCase().includes(q) ||
    (item.entity_id || '').toLowerCase().includes(q) ||
    (item.areaName || '').toLowerCase().includes(q)
  );
}
