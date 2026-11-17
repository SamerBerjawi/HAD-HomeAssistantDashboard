import { describe, expect, it } from 'vitest';
import {
  buildInboxEntries,
  countInbox,
  filterByTab,
  groupEntries,
  inboxCategoryOf,
  inboxGroupOf,
  isUnread,
  matchesSearch,
  notificationTime,
  readKeyOf
} from '../src/services/notifications/inbox';
import { notificationDataEqual, reconcileNotifications } from '../src/services/notifications/reconcile';
import { isNotificationRelevantState, statesChangedRelevantly } from '../src/services/notifications/relevance';
import { appendReadKeys, MAX_READ_KEYS } from '../src/store/useNotificationReadStore';
import { extractHANotifications, resetNotificationFirstSeen } from '../src/services/notificationsService';
import type { HANotificationItem } from '../src/types/notifications';

const NOW = new Date(2026, 10, 17, 15, 0, 0).getTime();
const TODAY_9AM = new Date(2026, 10, 17, 9, 0, 0).toISOString();
const TODAY_2PM = new Date(2026, 10, 17, 14, 0, 0).toISOString();
const YESTERDAY = new Date(2026, 10, 16, 20, 0, 0).toISOString();

const n = (over: Partial<HANotificationItem> & { id: string }): HANotificationItem => ({
  category: 'alert',
  severity: 'warning',
  title: over.id,
  message: '',
  ...over
});

const st = (entity_id: string, state = 'on', attributes: Record<string, any> = {}) =>
  ({ entity_id, state, attributes, last_changed: '', last_updated: '', context: undefined }) as any;

describe('inbox: tabs and groups', () => {
  it('maps HA categories onto the Alerts / System tabs', () => {
    expect(inboxCategoryOf('hazard')).toBe('alerts');
    expect(inboxCategoryOf('battery')).toBe('alerts');
    expect(inboxCategoryOf('security')).toBe('alerts');
    expect(inboxCategoryOf('update')).toBe('system');
    expect(inboxCategoryOf('repair')).toBe('system');
    expect(inboxCategoryOf('persistent_notification')).toBe('system');
  });

  it('pins critical items and splits the rest into Today / Earlier', () => {
    expect(inboxGroupOf({ severity: 'critical', createdAt: YESTERDAY }, NOW)).toBe('Needs attention');
    expect(inboxGroupOf({ severity: 'warning', createdAt: TODAY_9AM }, NOW)).toBe('Today');
    expect(inboxGroupOf({ severity: 'warning', createdAt: YESTERDAY }, NOW)).toBe('Earlier');
    expect(inboxGroupOf({ severity: 'info' }, NOW)).toBe('Today');
    expect(inboxGroupOf({ severity: 'info', createdAt: 'not a date' }, NOW)).toBe('Today');
  });

  it('prefers the epoch timestamp over createdAt', () => {
    expect(notificationTime({ timestamp: 5, createdAt: TODAY_9AM })).toBe(5);
    expect(notificationTime({ createdAt: TODAY_9AM })).toBe(Date.parse(TODAY_9AM));
    expect(notificationTime({})).toBeNull();
  });

  it('orders the timeline: attention, then newest first within Today and Earlier', () => {
    const items = [
      n({ id: 'old', createdAt: YESTERDAY }),
      n({ id: 'morning', createdAt: TODAY_9AM }),
      n({ id: 'leak', severity: 'critical', category: 'hazard', createdAt: YESTERDAY }),
      n({ id: 'afternoon', createdAt: TODAY_2PM, category: 'update', severity: 'update' })
    ];
    const entries = buildInboxEntries(items, new Set(), NOW);
    expect(entries.map((e) => e.item.id)).toEqual(['leak', 'afternoon', 'morning', 'old']);
    expect(groupEntries(entries).map((s) => [s.group, s.entries.length])).toEqual([
      ['Needs attention', 1],
      ['Today', 2],
      ['Earlier', 1]
    ]);
  });

  it('filters by tab and counts totals and unread per tab', () => {
    const items = [
      n({ id: 'a', category: 'hazard' }),
      n({ id: 'b', category: 'update', latestVersion: '2' }),
      n({ id: 'c', category: 'repair' })
    ];
    const entries = buildInboxEntries(items, new Set(['a', 'b@2']), NOW);
    expect(filterByTab(entries, 'all')).toHaveLength(3);
    expect(filterByTab(entries, 'alerts').map((e) => e.item.id)).toEqual(['a']);
    expect(filterByTab(entries, 'system').map((e) => e.item.id).sort()).toEqual(['b', 'c']);
    expect(countInbox(entries)).toEqual({
      total: { all: 3, alerts: 1, system: 2 },
      unread: { all: 1, alerts: 0, system: 1 }
    });
  });

  it('keeps group sections in first-appearance order', () => {
    const sections = groupEntries([{ group: 'B' }, { group: 'A' }, { group: 'B' }]);
    expect(sections.map((s) => [s.group, s.entries.length])).toEqual([['B', 2], ['A', 1]]);
  });

  it('searches title, message, entity id and area', () => {
    const item = n({ id: 'x', title: 'Water Leak', message: 'Moisture found', entity_id: 'binary_sensor.sink', areaName: 'Kitchen' });
    expect(matchesSearch(item, 'leak')).toBe(true);
    expect(matchesSearch(item, 'MOISTURE')).toBe(true);
    expect(matchesSearch(item, 'sink')).toBe(true);
    expect(matchesSearch(item, 'kitchen')).toBe(true);
    expect(matchesSearch(item, 'garage')).toBe(false);
    expect(matchesSearch(item, '  ')).toBe(true);
  });
});

describe('inbox: unread state', () => {
  it('keys updates by offered version so a newer release is unread again', () => {
    expect(readKeyOf({ id: 'update.core', latestVersion: '2026.2' })).toBe('update.core@2026.2');
    expect(readKeyOf({ id: 'alert.garage' })).toBe('alert.garage');
    const read = new Set(['update.core@2026.2']);
    expect(isUnread({ id: 'update.core', latestVersion: '2026.2' }, read)).toBe(false);
    expect(isUnread({ id: 'update.core', latestVersion: '2026.3' }, read)).toBe(true);
  });

  it('appends read keys without duplicates, bounded, and returns the same array when unchanged', () => {
    const base = ['a', 'b'];
    expect(appendReadKeys(base, ['b'])).toBe(base);
    expect(appendReadKeys(base, ['c', 'a'])).toEqual(['a', 'b', 'c']);
    const many = Array.from({ length: MAX_READ_KEYS }, (_, i) => `k${i}`);
    const next = appendReadKeys(many, ['new']);
    expect(next).toHaveLength(MAX_READ_KEYS);
    expect(next[next.length - 1]).toBe('new');
    expect(next[0]).toBe('k1');
  });
});

describe('reconcileNotifications', () => {
  it('returns the previous array when nothing changed, ignoring fresh callbacks', () => {
    const prev = [n({ id: 'a', onDismiss: () => {} }), n({ id: 'b', actions: [{ id: 'x', label: 'X', onClick: () => {} }] })];
    const next = [n({ id: 'a', onDismiss: () => {} }), n({ id: 'b', actions: [{ id: 'x', label: 'X', onClick: () => {} }] })];
    expect(reconcileNotifications(prev, next)).toBe(prev);
  });

  it('reuses unchanged items and replaces changed ones', () => {
    const prev = [n({ id: 'a' }), n({ id: 'b', title: 'Battery 14%' })];
    const next = [n({ id: 'a' }), n({ id: 'b', title: 'Battery 13%' })];
    const out = reconcileNotifications(prev, next);
    expect(out).not.toBe(prev);
    expect(out[0]).toBe(prev[0]);
    expect(out[1]).toBe(next[1]);
  });

  it('treats order changes, removals and action changes as changes', () => {
    const a = n({ id: 'a' });
    const b = n({ id: 'b' });
    const out = reconcileNotifications([a, b], [n({ id: 'b' }), n({ id: 'a' })]);
    expect(out[0]).toBe(b);
    expect(out[1]).toBe(a);
    expect(reconcileNotifications([a, b], [n({ id: 'a' })])).toEqual([a]);
    expect(
      notificationDataEqual(
        n({ id: 'a', actions: [{ id: 'x', label: 'Install', onClick: () => {} }] }),
        n({ id: 'a', actions: [{ id: 'x', label: 'Installing', onClick: () => {} }] })
      )
    ).toBe(false);
  });
});

describe('relevance gate', () => {
  it('flags entities the collectors read', () => {
    for (const id of ['update.core', 'alert.garage', 'persistent_notification.x', 'repair.y', 'binary_sensor.door', 'sensor.hacs']) {
      expect(isNotificationRelevantState(st(id))).toBe(true);
    }
    expect(isNotificationRelevantState(st('sensor.restart_required'))).toBe(true);
    expect(isNotificationRelevantState(st('sensor.lock', '10', { device_class: 'battery' }))).toBe(true);
    expect(isNotificationRelevantState(st('lock.front', 'locked', { battery_level: 40 }))).toBe(true);
    expect(isNotificationRelevantState(st('sensor.phone_bat', '40'))).toBe(true);
  });

  it('ignores power meters, lights and media players', () => {
    expect(isNotificationRelevantState(st('sensor.grid_power', '512', { device_class: 'power', unit_of_measurement: 'W' }))).toBe(false);
    expect(isNotificationRelevantState(st('light.kitchen', 'on', { brightness: 100 }))).toBe(false);
    expect(isNotificationRelevantState(st('media_player.tv', 'playing'))).toBe(false);
  });

  it('only reports relevant diffs', () => {
    const power = st('sensor.grid_power', '1', { device_class: 'power', unit_of_measurement: 'W' });
    const door = st('binary_sensor.door', 'off');
    const prev = { [power.entity_id]: power, [door.entity_id]: door };
    expect(statesChangedRelevantly(prev, prev)).toBe(false);
    // Irrelevant value change
    expect(statesChangedRelevantly(prev, { ...prev, [power.entity_id]: { ...power, state: '2' } })).toBe(false);
    // Classification change feeds the battery exclusion rules
    expect(statesChangedRelevantly(prev, { ...prev, [power.entity_id]: { ...power, attributes: { device_class: 'energy' } } })).toBe(true);
    // Relevant entity change, addition and removal
    expect(statesChangedRelevantly(prev, { ...prev, [door.entity_id]: { ...door, state: 'on' } })).toBe(true);
    expect(statesChangedRelevantly(prev, { ...prev, 'light.x': st('light.x') })).toBe(true);
    expect(statesChangedRelevantly(prev, { [power.entity_id]: power })).toBe(true);
  });
});

describe('extractHANotifications timestamps', () => {
  const params = (states: Record<string, any>) => {
    const domainGroups: Record<string, any[]> = {};
    for (const s of Object.values(states)) {
      const d = s.entity_id.split('.')[0];
      (domainGroups[d] ||= []).push({ ...s, name: s.attributes.friendly_name || s.entity_id, domain: d });
    }
    return {
      domainGroups,
      states,
      dismissedNotificationIds: [],
      callHAService: async () => {},
      dismissNotification: () => {}
    } as any;
  };

  it('gives undated items a stable first-seen time, so repeated passes reconcile to the same list', () => {
    resetNotificationFirstSeen();
    const states = { 'binary_sensor.sink_leak': st('binary_sensor.sink_leak', 'on', { device_class: 'moisture', friendly_name: 'Sink Leak' }) };
    const first = extractHANotifications(params(states), 1_000);
    const second = extractHANotifications(params(states), 999_999);
    const leak = first.find((i) => i.id === 'alert_leak_binary_sensor.sink_leak');
    expect(leak?.createdAt).toBe(new Date(1_000).toISOString());
    expect(second.find((i) => i.id === leak?.id)?.createdAt).toBe(leak?.createdAt);
    expect(reconcileNotifications(first, second)).toBe(first);
  });

  it('forgets first-seen times when an item clears', () => {
    resetNotificationFirstSeen();
    const wet = { 'binary_sensor.sink_leak': st('binary_sensor.sink_leak', 'on', { device_class: 'moisture' }) };
    const dry = { 'binary_sensor.sink_leak': st('binary_sensor.sink_leak', 'off', { device_class: 'moisture' }) };
    extractHANotifications(params(wet), 1_000);
    extractHANotifications(params(dry), 2_000);
    const again = extractHANotifications(params(wet), 3_000);
    expect(again.find((i) => i.id === 'alert_leak_binary_sensor.sink_leak')?.createdAt).toBe(new Date(3_000).toISOString());
  });
});

describe('useHANotifications selector', async () => {
  const { __notificationSelectorForTests: sel } = await import('../src/hooks/useHANotifications');
  const storeState = (states: Record<string, any>, domainGroups: Record<string, any[]>) =>
    ({
      domainGroups,
      states,
      entityRegistry: [],
      nativeNotifications: [],
      nativeRepairs: [],
      dismissedNotificationIds: [],
      callHAService: async () => {},
      dismissNotification: () => {}
    }) as any;

  it('skips irrelevant state batches and keeps the list reference', () => {
    sel.reset();
    const alerts: any[] = [];
    const update = st('update.core', 'on', { installed_version: '1', latest_version: '2', friendly_name: 'Core' });
    const power = st('sensor.grid_power', '1', { device_class: 'power', unit_of_measurement: 'W' });
    const groups = { update: [{ ...update, name: 'Core', domain: 'update' }], sensor: [{ ...power, name: 'Grid', domain: 'sensor' }] };
    const first = sel.select(storeState({ [update.entity_id]: update, [power.entity_id]: power }, groups), alerts);
    expect(first.some((i) => i.id.includes('update.core'))).toBe(true);

    // Power meter ticks: new states object and a new domainGroups (sensor array replaced)
    const power2 = { ...power, state: '2' };
    const groups2 = { ...groups, sensor: [{ ...power2, name: 'Grid', domain: 'sensor' }] };
    const second = sel.select(storeState({ [update.entity_id]: update, [power.entity_id]: power2 }, groups2), alerts);
    expect(second).toBe(first);

    // The update finishing is relevant and changes the list
    const done = { ...update, state: 'off', attributes: { ...update.attributes, installed_version: '2' } };
    const groups3 = { ...groups2, update: [{ ...done, name: 'Core', domain: 'update' }] };
    const third = sel.select(storeState({ [update.entity_id]: done, [power.entity_id]: power2 }, groups3), alerts);
    expect(third).not.toBe(first);
    sel.reset();
  });
});
