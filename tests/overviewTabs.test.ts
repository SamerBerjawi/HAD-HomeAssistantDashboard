import { describe, expect, it } from 'vitest';
import { buildProOverviewTabs, type BuildOverviewTabsInput } from '@/pro/lib/overviewTabs';

const idleInput = (): BuildOverviewTabsInput => ({
  onLightsCount: 0,
  onSwitchesCount: 0,
  switchesTotalCount: 0,
  openDoorsCount: 0,
  openWindowsCount: 0,
  activeMotionCount: 0,
  activeLeaksCount: 0,
  activeSmokeCount: 0,
  unlockedLocksCount: 0,
  solarSelfSufficiencyPct: null,
  activeFansCount: 0,
  playingMediaCount: 0,
  vacuumsTotalCount: 0,
  activeVacuumsCount: 0,
  camerasCount: 0,
  isEditMode: false
});

describe('overviewTabs', () => {
  it('hides switches, cameras, and vacuums when empty outside edit mode, and includes switches in edit mode', () => {
    const standard = buildProOverviewTabs(idleInput());
    expect(standard.map((t) => t.id)).toEqual(['all', 'lights', 'energy', 'security', 'climate', 'openings', 'media']);
    expect(standard.every((t) => t.badge === undefined)).toBe(true);

    const editing = buildProOverviewTabs({ ...idleInput(), isEditMode: true });
    expect(editing.map((t) => t.id)).toEqual([
      'all',
      'lights',
      'switches',
      'energy',
      'security',
      'climate',
      'openings',
      'media'
    ]);
  });

  it('computes live badges and semantic tones for active domains', () => {
    const tabs = buildProOverviewTabs({
      onLightsCount: 4,
      onSwitchesCount: 2,
      switchesTotalCount: 6,
      openDoorsCount: 1,
      openWindowsCount: 2,
      activeMotionCount: 1,
      activeLeaksCount: 0,
      activeSmokeCount: 0,
      unlockedLocksCount: 1,
      solarSelfSufficiencyPct: 78.4,
      activeFansCount: 2,
      playingMediaCount: 3,
      vacuumsTotalCount: 2,
      activeVacuumsCount: 1,
      camerasCount: 4,
      isEditMode: false
    });

    expect(tabs).toEqual([
      { id: 'all', label: 'All' },
      { id: 'lights', label: 'Lights', badge: '4 on', badgeTone: 'warning' },
      { id: 'switches', label: 'Switches', badge: '2 on', badgeTone: 'default' },
      { id: 'energy', label: 'Energy', badge: '78%', badgeTone: 'success' },
      { id: 'security', label: 'Security', badge: '5', badgeTone: 'warning' },
      { id: 'cameras', label: 'Cameras', badge: '4', badgeTone: 'default' },
      { id: 'climate', label: 'Climate', badge: '2 on', badgeTone: 'accent' },
      { id: 'openings', label: 'Doors & windows', badge: '3 open', badgeTone: 'warning' },
      { id: 'media', label: 'Media', badge: '3 playing', badgeTone: 'accent' },
      { id: 'vacuums', label: 'Vacuums', badge: '1 cleaning', badgeTone: 'accent' }
    ]);
  });

  it('uses danger tone on Security when leaks or smoke are active and clamps solar pct to 100%', () => {
    const tabs = buildProOverviewTabs({
      ...idleInput(),
      activeLeaksCount: 1,
      openDoorsCount: 1,
      solarSelfSufficiencyPct: 142
    });

    const energy = tabs.find((t) => t.id === 'energy');
    const security = tabs.find((t) => t.id === 'security');
    expect(energy).toEqual({ id: 'energy', label: 'Energy', badge: '100%', badgeTone: 'success' });
    expect(security).toEqual({ id: 'security', label: 'Security', badge: '2', badgeTone: 'danger' });

    const zeroSolar = buildProOverviewTabs({ ...idleInput(), solarSelfSufficiencyPct: 0 });
    expect(zeroSolar.find((t) => t.id === 'energy')).toEqual({
      id: 'energy',
      label: 'Energy',
      badge: undefined,
      badgeTone: undefined
    });
  });
});
