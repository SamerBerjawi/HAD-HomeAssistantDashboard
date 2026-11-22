import { describe, expect, it } from 'vitest';
import { demoServiceEffects } from '@/pro/lib/demoServices';
import { buildAttentionPills, buildShellTabs, resolveShellTab, resolveShellTabId, sectionShowsCards, type WidgetStatus } from '@/pro/lib/overviewShell';
import { WIDGET_BY_ID } from '@/pro/widgets/registry';

const sections = [
  { section: 'lights' as const, items: [{ i: 'lights' }] },
  { section: 'security' as const, items: [{ i: 'alarm' }, { i: 'locks' }, { i: 'motion' }] },
  { section: 'openings' as const, items: [{ i: 'openings' }] }
];
const status: Record<string, WidgetStatus> = {
  lights: { count: 8, attention: null },
  alarm: { count: 0, attention: { label: 'Alarm arming', tone: 'warning' } },
  locks: { count: 1, attention: { label: 'Front door jammed', tone: 'danger' } },
  motion: { count: 2, attention: null },
  openings: { count: 1, attention: { label: 'Back door open', tone: 'warning' } }
};

describe('Overview shell: tabs', () => {
  it('one tab per section with summed counts and the worst colour', () => {
    const tabs = buildShellTabs(sections, status);
    expect(tabs.map((t) => [t.id, t.label, t.count, t.tone])).toEqual([
      ['all', 'All', 0, null],
      ['lights', 'Lights', 8, null],
      ['security', 'Security', 3, 'danger'],
      ['openings', 'Doors & windows', 1, 'warning']
    ]);
  });
  it('a widget that has not reported yet counts as nothing', () => {
    expect(buildShellTabs(sections, {})[1]).toEqual({ id: 'lights', label: 'Lights', count: 0, tone: null });
  });
  it('falls back to All when the asked tab is not on the page', () => {
    const tabs = buildShellTabs(sections, status);
    expect(resolveShellTab('security', tabs)).toBe('security');
    expect(resolveShellTab('vacuums', tabs)).toBe('all');
    expect(resolveShellTab(null, tabs)).toBe('all');
  });
});

describe('Overview shell: attention pills', () => {
  it('danger first, then page order', () => {
    expect(buildAttentionPills(sections, status).map((p) => p.label)).toEqual(['Front door jammed', 'Alarm arming', 'Back door open']);
    expect(buildAttentionPills(sections, { lights: status.lights })).toEqual([]);
  });
});

describe('Widget counts and attention', () => {
  it('counts what is going on', () => {
    const lights = WIDGET_BY_ID.get('lights')!;
    expect(lights.count?.(lights.fixture)).toBeGreaterThanOrEqual(0);
    for (const id of ['lights', 'switches', 'fans', 'thermostat', 'users', 'openings', 'safety', 'motion', 'locks', 'media', 'vacuums']) {
      const w = WIDGET_BY_ID.get(id)!;
      expect(typeof w.count?.(w.fixture), id).toBe('number');
    }
  });
});

describe('Demo mode service simulator', () => {
  const states: Record<string, { state: string }> = { 'light.a': { state: 'off' }, 'media_player.tv': { state: 'playing' }, 'cover.g': { state: 'closed' } };
  const of = (id: string) => states[id];
  it('works out the state HA would report', () => {
    expect(demoServiceEffects('light', 'toggle', {}, ['light.a'], of)).toEqual([{ entityId: 'light.a', state: 'on' }]);
    expect(demoServiceEffects('switch', 'turn_off', {}, ['switch.x', 'switch.y'], of).map((e) => e.state)).toEqual(['off', 'off']);
    expect(demoServiceEffects('lock', 'unlock', {}, ['lock.front'], of)[0]).toMatchObject({ state: 'unlocked', attributes: { changed_by: 'You' } });
    expect(demoServiceEffects('alarm_control_panel', 'alarm_arm_away', {}, ['alarm_control_panel.home'], of)[0].state).toBe('armed_away');
    expect(demoServiceEffects('media_player', 'media_play_pause', {}, ['media_player.tv'], of)[0].state).toBe('paused');
    expect(demoServiceEffects('vacuum', 'return_to_base', {}, ['vacuum.r'], of)[0].state).toBe('returning');
    expect(demoServiceEffects('climate', 'set_temperature', { temperature: 21.5 }, ['climate.l'], of)[0]).toEqual({ entityId: 'climate.l', state: null, attributes: { temperature: 21.5 } });
    expect(demoServiceEffects('cover', 'toggle', {}, ['cover.g'], of)[0].state).toBe('open');
  });
  it('leaves services it does not know alone', () => {
    expect(demoServiceEffects('button', 'press', {}, ['button.car_lock'], of)).toEqual([]);
    expect(demoServiceEffects('light', 'set_brightness_whatever', {}, ['light.a'], of)).toEqual([]);
  });
});

describe('Overview shell: tab and visible sections without the status', () => {
  it('picks the same tab as resolveShellTab, from the sections alone', () => {
    for (const asked of ['security', 'openings', 'climate', null, 'all']) {
      expect(resolveShellTabId(asked, sections)).toBe(resolveShellTab(asked, buildShellTabs(sections, status)));
    }
  });
  it('"All" shows every expanded section; a tab shows only its own, even when collapsed', () => {
    expect(sectionShowsCards('lights', 'all', [])).toBe(true);
    expect(sectionShowsCards('lights', 'all', ['lights'])).toBe(false);
    expect(sectionShowsCards('lights', 'lights', ['lights'])).toBe(true);
    expect(sectionShowsCards('security', 'lights', [])).toBe(false);
  });
});
