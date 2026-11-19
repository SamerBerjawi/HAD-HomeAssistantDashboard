import { describe, expect, it } from 'vitest';
import type { HANotificationItem } from '@/types/notifications';
import {
  buildSections,
  installableUpdates,
  notificationTone,
  plainText,
  rowSummary,
  shortTitle,
  stackSummary,
  strongestTone
} from '@/pro/lib/notificationLogic';

const n = (id: string, extra: Partial<HANotificationItem>): HANotificationItem => ({
  id,
  category: 'persistent_notification',
  severity: 'info',
  title: id,
  message: '',
  ...extra
});

describe('notificationLogic', () => {
  const items = [
    n('smoke', { category: 'hazard', severity: 'critical', title: 'Smoke in Kitchen' }),
    n('repair_err', { category: 'repair', severity: 'error', title: 'Database failing' }),
    n('core', { category: 'update', severity: 'update', title: 'Home Assistant Core', entity_id: 'update.core', latestVersion: '2026.12.0' }),
    n('z2m', { category: 'update', severity: 'update', title: 'Zigbee2MQTT', entity_id: 'update.z2m', skippedVersion: '2.1.0' }),
    n('bat', { category: 'battery', severity: 'warning', title: 'Hallway sensor' }),
    n('restart', { category: 'restart', severity: 'warning', title: 'Restart required' }),
    n('old', { createdAt: '2026-11-01T10:00:00Z', title: 'Old message' }),
    n('new', { createdAt: '2026-11-18T10:00:00Z', title: 'New message' })
  ];

  it('triages critical and error items into Needs action', () => {
    expect(buildSections(items).action.map((i) => i.id)).toEqual(['smoke', 'repair_err']);
  });

  it('stacks by kind, most urgent first, skipped updates last', () => {
    const { stacks } = buildSections(items);
    expect(stacks.map((s) => s.kind)).toEqual(['repairs', 'batteries', 'updates']);
    expect(stacks[2].items.map((i) => i.id)).toEqual(['core', 'z2m']);
  });

  it('lists messages newest first', () => {
    expect(buildSections(items).messages.map((i) => i.id)).toEqual(['new', 'old']);
  });

  it('summarises stacks', () => {
    const t = (title: string) => ({ title, category: 'update' as const });
    expect(stackSummary([t('A')])).toBe('A');
    expect(stackSummary([t('A'), t('B')])).toBe('A and B');
    expect(stackSummary([t('A'), t('B'), t('C')])).toBe('A, B and C');
    expect(stackSummary([t('A'), t('B'), t('C'), t('D'), t('E')])).toBe('A, B and 3 more');
    expect(shortTitle({ title: 'Shelly firmware update', category: 'update' })).toBe('Shelly');
    expect(shortTitle({ title: 'Core 2026.12.0', category: 'update', latestVersion: '2026.12.0' })).toBe('Core');
  });

  it('tones follow green/orange/red', () => {
    expect(notificationTone({ severity: 'critical' })).toBe('danger');
    expect(notificationTone({ severity: 'warning' })).toBe('warning');
    expect(notificationTone({ severity: 'update' })).toBe('default');
    expect(strongestTone([{ severity: 'info' }, { severity: 'warning' }])).toBe('warning');
  });

  it('only installs updates that are not skipped or running', () => {
    expect(installableUpdates([...items, n('busy', { category: 'update', entity_id: 'update.b', inProgress: true })]).map((i) => i.id)).toEqual(['core']);
  });

  it('writes one-line summaries', () => {
    expect(rowSummary(n('u', { category: 'update', installedVersion: '1.0', latestVersion: '1.1' }))).toBe('1.0 → 1.1');
    expect(rowSummary(n('u', { category: 'update', inProgress: true, updatePercentage: 40 }))).toBe('Installing · 40%');
    expect(rowSummary(n('m', { message: 'See [the docs](https://x.y) **now**', areaName: 'Kitchen' }))).toBe('See the docs now');
    expect(rowSummary(n('b', { areaName: 'Hall', source: 'Aqara' }))).toBe('Hall · Aqara');
    expect(plainText('![img](a.png) # Title')).toBe('Title');
  });
});
