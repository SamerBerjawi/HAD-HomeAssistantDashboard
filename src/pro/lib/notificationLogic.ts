/**
 * Pure logic for the pro notification center (DESIGN.md 7.7): triage sections, stacks by kind,
 * summaries and tones. No React, no stores.
 */
import type { HANotificationItem } from '@/types/notifications';
import { notificationTime } from '@/services/notifications/inbox';

export type NotificationTone = 'danger' | 'warning' | 'default';
export type StackKind = 'alerts' | 'repairs' | 'batteries' | 'updates';

export interface NotificationStack {
  kind: StackKind;
  title: string;
  items: HANotificationItem[];
  /** "Core, Zigbee2MQTT and 5 more" */
  summary: string;
}

export interface NotificationSections {
  /** Critical and error items, in priority order. */
  action: HANotificationItem[];
  /** Stacks by kind, most urgent kind first, empty ones dropped. */
  stacks: NotificationStack[];
  /** HA persistent notifications, newest first. */
  messages: HANotificationItem[];
}

/** Most urgent kind first (agent's call, DESIGN.md 7.7). */
export const STACK_ORDER: readonly StackKind[] = ['alerts', 'repairs', 'batteries', 'updates'];

export const STACK_TITLE: Record<StackKind, string> = {
  alerts: 'Home alerts',
  repairs: 'Repairs',
  batteries: 'Low batteries',
  updates: 'Updates'
};

export function needsAction(item: Pick<HANotificationItem, 'severity'>): boolean {
  return item.severity === 'critical' || item.severity === 'error';
}

export function stackKindOf(item: Pick<HANotificationItem, 'category'>): StackKind | 'message' {
  switch (item.category) {
    case 'update':
      return 'updates';
    case 'battery':
      return 'batteries';
    case 'repair':
    case 'restart':
      return 'repairs';
    case 'persistent_notification':
      return 'message';
    default:
      return 'alerts';
  }
}

/** Green / orange / red rule from 7.5: red critical/error, orange warning, neutral otherwise. */
export function notificationTone(item: Pick<HANotificationItem, 'severity'>): NotificationTone {
  if (item.severity === 'critical' || item.severity === 'error') return 'danger';
  if (item.severity === 'warning') return 'warning';
  return 'default';
}

/** Strongest tone among items. */
export function strongestTone(items: readonly Pick<HANotificationItem, 'severity'>[]): NotificationTone {
  let tone: NotificationTone = 'default';
  for (const i of items) {
    const t = notificationTone(i);
    if (t === 'danger') return t;
    if (t === 'warning') tone = t;
  }
  return tone;
}

/** Short name for summaries: update titles carry a version, drop it. */
export function shortTitle(item: Pick<HANotificationItem, 'title' | 'category' | 'latestVersion'>): string {
  let t = item.title.trim();
  if (item.category === 'update' && item.latestVersion) t = t.replace(item.latestVersion, '').trim();
  t = t.replace(/(\s+(firmware|update|available))+$/i, '').trim();
  return t || item.title;
}

export function stackSummary(items: readonly Pick<HANotificationItem, 'title' | 'category' | 'latestVersion'>[]): string {
  const names = items.map(shortTitle);
  if (names.length <= 2) return names.join(' and ');
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

const newestFirst = (a: HANotificationItem, b: HANotificationItem) =>
  (notificationTime(b) ?? Number.POSITIVE_INFINITY) - (notificationTime(a) ?? Number.POSITIVE_INFINITY);

/** Splits the (priority-sorted) list into Needs action, stacks and messages. */
export function buildSections(items: readonly HANotificationItem[]): NotificationSections {
  const action: HANotificationItem[] = [];
  const messages: HANotificationItem[] = [];
  const byKind = new Map<StackKind, HANotificationItem[]>();
  for (const item of items) {
    if (needsAction(item)) {
      action.push(item);
      continue;
    }
    const kind = stackKindOf(item);
    if (kind === 'message') {
      messages.push(item);
      continue;
    }
    const list = byKind.get(kind) ?? [];
    list.push(item);
    byKind.set(kind, list);
  }
  const stacks = STACK_ORDER.flatMap((kind) => {
    const list = byKind.get(kind);
    if (!list?.length) return [];
    // Skipped updates last: they are parked on purpose.
    const sorted = kind === 'updates' ? [...list].sort((a, b) => Number(Boolean(a.skippedVersion)) - Number(Boolean(b.skippedVersion))) : list;
    return [{ kind, title: STACK_TITLE[kind], items: sorted, summary: stackSummary(sorted) }];
  });
  return { action, stacks, messages: [...messages].sort(newestFirst) };
}

/** Updates the "Update all" button would install: not skipped, not already installing. */
export function installableUpdates(items: readonly HANotificationItem[]): HANotificationItem[] {
  return items.filter((n) => n.category === 'update' && !n.skippedVersion && !n.inProgress && Boolean(n.entity_id));
}

/** One-line summary under a row's title. */
export function rowSummary(item: HANotificationItem): string {
  if (item.category === 'update') {
    if (item.inProgress) return item.updatePercentage ? `Installing · ${item.updatePercentage}%` : 'Installing…';
    if (item.skippedVersion) return `Skipped ${item.latestVersion ?? ''}`.trim();
    if (item.installedVersion && item.latestVersion) return `${item.installedVersion} → ${item.latestVersion}`;
  }
  const place = [item.areaName, item.source && item.source !== item.areaName ? item.source : undefined].filter(Boolean).join(' · ');
  const text = plainText(item.message);
  return text || place;
}

/** Markdown-ish message to one plain line. */
export function plainText(message: string | undefined): string {
  if (!message) return '';
  return message
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Action ids handled outside the action buttons (✕ / swipe, the release-notes section). */
export const HIDDEN_ACTION_IDS = new Set(['release_notes', 'ha_updater_notes']);
